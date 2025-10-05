import { promises as fsp } from 'fs';
import fs from 'fs';
import path from "path";
import extract from 'extract-zip';
import xml2js from 'xml2js';
import { logger } from './logger';
import { getAudioFileInfo, smilTimeToSeconds } from './helpers';
import { AudioFileInfoWithRel, PlaylistItemWithRel } from "../shared/types";
import { SmilPar } from '../client/audiobook-reader';
import { EPUB_MERGED_SMIL_FILE, EPUB_META_FILE } from '../shared/constants';
import { BookNew } from './db/book';

type ManifestItem = {
  $: {
    id: string;
    href: string;
    'media-type': string;
    'media-overlay'?: string;
  };
};

type SmilParElem = {
  $?: Record<string, string>;
  text: Array<{ $: Record<string, string> }>;
  audio?: Array<{ $: Record<string, string> }>;
}

type SmilSeqElem = {
  seq?: SmilSeqElem[];
  par?: SmilParElem[];
}

type SmilBodyElem = {
  seq?: SmilSeqElem[];
  par?: SmilParElem[];
}

type EpubExtractMetadata = {
  srcPath: string;       // 源 EPUB 文件路径
  srcMtime: number;      // 源文件 mtime
  srcCtime: number;      // 源文件 ctime
  srcSize: number;       // 源文件大小
  srcHash?: string;      // 源文件 hash，可选
  unzipTime: number;     // 解压时间
  version: string;       // 解压版本
}

type OpfData = {
  opfDir: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  package: Record<string, any>; // xml2js解析后的结果
}

export class EpubExtractor {
  private readonly defaultVersion = '1.1';
  private epubPath: string;
  private extractDir: string;
  private metaPath: string;
  private smilPath: string;

  public constructor(epubPath: string) { 
    this.epubPath = epubPath;
    
    const baseName = path.basename(epubPath, '.epub');
    this.extractDir = path.join(path.dirname(epubPath), `.${baseName}`);
    this.metaPath = path.join(this.extractDir, EPUB_META_FILE);
    this.smilPath = path.join(this.extractDir, EPUB_MERGED_SMIL_FILE);
  }

  public async extract() { 
    await this.unzipEpub();
    return await this.parseEpub();
  }

  /**
   * 解压 EPUB 文件
   * 
   * 如果 extractDir 已存在并且其中的 metaPath 文件信息与当前 epubPath 文件一致，则跳过解压
   * @param overwrite 是否强制覆盖 (即使目标目录已存在且 metaPath 内信息一致，也强制重新解压覆盖)
   */
  private async unzipEpub(overwrite: boolean = false): Promise<void> {
    logger.debug(`Unzip epub [${this.epubPath}] to [${this.extractDir}]`);
    
    // 获取 EPUB 文件信息
    const stats = await fsp.stat(this.epubPath);
    const newMetadata: Omit<EpubExtractMetadata, 'unzipTime'> = {
      srcPath: this.epubPath,
      srcMtime: stats.mtimeMs,
      srcCtime: stats.ctimeMs,
      srcSize: stats.size,
      version: this.defaultVersion,
    };

    // 1. 判断解压目录是否存在
    let needExtract = true;
    if (!overwrite && fs.existsSync(this.extractDir) && fs.existsSync(this.metaPath)) {
      logger.debug('EpubExtractMetadata info exists', { meta_path: this.metaPath });
      try {
        const existingMeta: EpubExtractMetadata = JSON.parse(await fsp.readFile(this.metaPath, 'utf-8'));
        // 判断目录是否是最新的
        if (
          existingMeta.srcPath === newMetadata.srcPath &&
          existingMeta.srcMtime === newMetadata.srcMtime &&
          existingMeta.srcCtime === newMetadata.srcCtime &&
          existingMeta.srcSize === newMetadata.srcSize &&
          (newMetadata.srcHash ? existingMeta.srcHash === newMetadata.srcHash : true)
        ) {
          needExtract = false; // 不需要重新解压
        }
      } catch {
        logger.warn('EpubExtractMetadata info parse error!', { meta_path: this.metaPath });
      }
    }

    // 2. 执行解压
    if (needExtract) {
      // 如果目录已存在但需要覆盖，可以先清空
      if (fs.existsSync(this.extractDir)) {
        await fsp.rm(this.extractDir, { recursive: true, force: true });
      }
      await fsp.mkdir(this.extractDir, { recursive: true });
      await extract(this.epubPath, {dir: this.extractDir});

      // 3. 写入 metadata.json
      const metadata: EpubExtractMetadata = {
        ...newMetadata,
        unzipTime: Date.now(),
        version: this.defaultVersion,
      };
      await fsp.writeFile(this.metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
      logger.debug('EPUB unzipped', { metadata });
    } else {
      logger.debug('EPUB extraction ignored - already exists and metadata match');
    }
  }

  private async parseEpub() {
    try {
      // 1. 查找并解析OPF文件
      const opfPath = await this.findOpfFile(this.extractDir);
      const opfData = await this.parseOpfFile(opfPath);
      
      // 2. 从manifest中找到所有音频文件
      const audios = await this.getAudioFiles(opfData);
      
      // 3. 从manifest中找到所有SMIL文件并解析
      const smilPars = await this.parseSmilFiles(opfData);
      if (smilPars.length > 0) {
        await fsp.writeFile(this.smilPath, JSON.stringify(smilPars, null, 2), 'utf-8');
      }
      
      // 4. 根据smil数组生成playlist
      const playlist = this.generatePlaylist(smilPars, audios);
      
      // 5. 查找封面图片
      const coverPath = this.findCoverImagePath(opfData);
      
      // 6. 解析 metadata
      const metadata = this.parseMetadata(opfData);

      // 7. 返回结果
      const book: Omit<BookNew, 'libraryId' | 'mtime' | 'size'> = {
        type: playlist.length > 0 ? 'audible_epub' : 'epub',
        path: this.epubPath,
        folderPath: this.extractDir,
        opf: path.relative(this.extractDir, opfPath),
        smil: smilPars.length > 0 ? path.relative(this.extractDir, this.smilPath) : undefined,
        audios: audios,
        playlist: playlist,
        title: metadata.title || path.basename(this.epubPath, '.epub'),
        author: metadata.author,
        isbn: metadata.isbn,
        coverPath: coverPath,
        language: metadata.language,
      }
      return book;
    } catch (error) {
      logger.error('解析EPUB文件失败:', error);
      throw error;
    }
  }

  public async clearExtractedData(): Promise<void> {
    // 删除 metaPath 文件
    if (fs.existsSync(this.metaPath)) {
      await fsp.rm(this.metaPath, { force: true });
    }
    // 删除 smilPath 文件
    if (fs.existsSync(this.smilPath)) {
      await fsp.rm(this.smilPath, { force: true });
    }
    // 删除解压目录
    if (fs.existsSync(this.extractDir)) {
      await fsp.rm(this.extractDir, { recursive: true, force: true });
    }
  }

  /**
   * 查找OPF文件
   */
  private async findOpfFile(extractDir: string): Promise<string> {
    const containerPath = path.join(extractDir, 'META-INF', 'container.xml');

    try {
      const xml = await fsp.readFile(containerPath, 'utf-8');
      const parser = new xml2js.Parser({ explicitArray: true });
      const parsed = await parser.parseStringPromise(xml);
      const rootfileElems = parsed.container.rootfiles[0].rootfile;
      if (rootfileElems && rootfileElems.length > 0) {
        const opfPath = decodeURI(rootfileElems[0].$['full-path']);
        return path.join(extractDir, opfPath);
      }
    } catch (error) {
      logger.error(`Cannot find OPF file under ${extractDir}`, error);
    }
    
    throw new Error(`Cannot find OPF file under ${extractDir}`);
  }

  /**
   * 解析OPF文件
   */
  private async parseOpfFile(opfPath: string) {
    const opfContent = await fsp.readFile(opfPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(opfContent);
    return {
      opfDir: path.dirname(opfPath),
      package: result.package,
    };
  }

  /**
   * 获取音频文件信息
   */
  private async getAudioFiles(opfData: OpfData): Promise<AudioFileInfoWithRel[]> {
    const manifest = opfData.package?.manifest?.[0]?.item || [];
    const audios: AudioFileInfoWithRel[] = [];
    
    for (const item of manifest) {
      const mediaType = item.$['media-type'];
      if (mediaType && mediaType.startsWith('audio/')) {
        const href = item.$.href;
        const audioPath = path.resolve(opfData.opfDir, decodeURI(href));
        
        try {
          const audioInfo = await getAudioFileInfo(audioPath);
          audios.push({...audioInfo, relPath: path.relative(this.extractDir, audioPath)});
        } catch (error) {
          logger.error(`获取音频文件信息失败: ${audioPath}`, error);
        }
      }
    }
    
    return audios;
  }

  /**
   * 解析SMIL文件
   */
  private async parseSmilFiles(opfData: OpfData): Promise<SmilPar[]> {
    const manifest: ManifestItem[] = opfData.package?.manifest?.[0]?.item || [];
    const spine = opfData.package?.spine?.[0]?.itemref || [];
    const smilPars: SmilPar[] = [];

    // 1. 遍历 spine（章节顺序）
    for (const itemref of spine) {
      const idref = itemref.$.idref;

      // 2. 找到 manifest 中对应的 item
      const spineItem = manifest.find(m => m.$.id === idref);
      if (!spineItem) continue;

      // 3. 如果该 item 有 media-overlay 属性 → 指向 smil item
      const overlayId = spineItem.$['media-overlay'];
      if (!overlayId) continue;

      const smilItem = manifest.find(m => m.$.id === overlayId);
      if (!smilItem) continue;

      // 获取 SMIL 文件的绝对路径
      // href 是相对于 opf 的路径, 而且是 URL encoding 的
      const smilHref = smilItem.$.href;  
      const smilPath = path.resolve(opfData.opfDir, decodeURI(smilHref));

      // 4. 解析 SMIL 文件
      if (fs.existsSync(smilPath)) {
        const smilContent = await fsp.readFile(smilPath, 'utf8');
        const pars = await this.parseSmilContent(smilContent);
        /**
         * 从 SMIL 文件中解析出来的原始 par 中, src 是相对于该 SMIL 文件的相对路径 (也是 URL encoding 的)
         * 我们需要根据 textSrc 和 audioSrc 的用途, 做对应的相对路径调整
         */
        const smilDir = path.dirname(smilPath);
        for (const par of pars) {
          // textSrc 需要改造成相对于 opf 文件的相对路径, 因为 Epub.js 的内部跳转是基于 opf 相对路径进行的
          par.textSrc = path.relative(opfData.opfDir, path.resolve(smilDir, par.textSrc));
          // audioSrc 需要改造成相对于有声书根目录(extractDir)的相对路径, 方便浏览器直接访问
          par.audioSrc = path.relative(this.extractDir, path.resolve(smilDir, par.audioSrc));
        }

        smilPars.push(...pars);
        logger.debug(`Parse SMIL file ${smilPath} - Got ${pars.length} pars`);
      } else {
        logger.warn(`Parse SMIL file ${smilPath} failed - no such file`);
      }
    }

    return smilPars;
  }

  /**
   * 解析单个SMIL文件内容
   */
  private async parseSmilContent(smilContent: string): Promise<SmilPar[]> {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(smilContent);
    const smilPars: SmilPar[] = [];
    
    const body = result?.smil?.body?.[0];
    if (!body) {
      throw new Error('Invalid SMIL file: missing <body> element');
    }
    const allPars = this.collectPars(body);
    
    for (const par of allPars) {
      const id = par.$?.id;
      const [srcPart, idPart] = par.text[0].$.src.split('#');
      const audio = par.audio?.[0];
      if (!audio) {
        logger.warn(`No valid <audio> clip element in a <par> element`);
        continue;
      }
      smilPars.push({
        id: id,
        textSrc: srcPart,
        textId: idPart,
        audioSrc: audio.$.src,
        clipBegin: smilTimeToSeconds(audio.$.clipBegin),
        clipEnd: smilTimeToSeconds(audio.$.clipEnd),
      });
    }

    return smilPars;
  }

  private collectPars(bodyOrSeq: SmilBodyElem | SmilSeqElem): SmilParElem[] {
    const result: SmilParElem[] = [];

    if (bodyOrSeq.par) {
      result.push(...bodyOrSeq.par);
    }
    if (bodyOrSeq.seq) {
      for (const childSeq of bodyOrSeq.seq) {
        result.push(...this.collectPars(childSeq));
      }
    }

    return result;
  }

  /**
   * 生成播放列表
   */
  private generatePlaylist(smilPars: SmilPar[], audios: AudioFileInfoWithRel[]): PlaylistItemWithRel[] {
    const playlist: PlaylistItemWithRel[] = [];
    const audioMap = new Map<string, AudioFileInfoWithRel>();
    const seen = new Set<string>();

    // 建立音频文件映射：文件名 -> AudioFileInfo
    for (const audio of audios) {
      audioMap.set(path.basename(audio.filePath), audio);
    }

    // 按 smilPars 顺序生成 playlist（唯一）
    for (const par of smilPars) {
      const audioFilename = path.basename(par.audioSrc);
      if (seen.has(audioFilename)) continue;

      const audioInfo = audioMap.get(audioFilename);
      if (!audioInfo) continue;

      playlist.push({
        filePath: audioInfo.filePath,
        relPath: audioInfo.relPath,
        title: audioInfo.meta?.title || path.basename(audioFilename, path.extname(audioFilename)),
        duration: audioInfo.duration || 0,
      });

      seen.add(audioFilename);
    }

    return playlist;
  }

  /**
   * 查找封面图片
   */
  private findCoverImagePath(opfData: OpfData): string | undefined {
    const manifest = opfData.package?.manifest?.[0]?.item || [];
    
    // 查找manifest中包含cover的图片文件
    for (const item of manifest) {
      const id = item.$.id?.toLowerCase() || '';
      const href = item.$.href?.toLowerCase() || '';
      const mediaType = item.$['media-type'] || '';
      
      if (mediaType.startsWith('image/') && (id.includes('cover') || href.includes('cover'))) {
        const coverPath = path.resolve(opfData.opfDir, decodeURI(item.$.href));
        if (fs.existsSync(coverPath)) {
          return coverPath;
        }
      }
    }
    
    return undefined;
  }

  /**
   * 解析元数据
   */
  private parseMetadata(opfData: OpfData) {
    const metadata = opfData.package?.metadata?.[0] || {};
    
    const getMetadataValue = (field: string): string | undefined => {
      const element = metadata[field] || metadata[`dc:${field}`];
      if (Array.isArray(element) && element.length > 0) {
        return typeof element[0] === 'string' ? element[0] : element[0]._;
      }
      return undefined;
    };
    
    return {
      title: getMetadataValue('title'),
      isbn: getMetadataValue('identifier'),
      language: getMetadataValue('language'),
      author: getMetadataValue('creator') || getMetadataValue('author'),
    };
  }

}
