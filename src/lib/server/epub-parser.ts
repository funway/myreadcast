import { promises as fsp } from 'fs';
import fs from 'fs';
import path from "path";
import extract from 'extract-zip';
import xml2js from 'xml2js';
import { logger } from './logger';
import { getAudioFileInfo, smilTimeToSeconds } from './helpers';
import { AudioFileInfo, PlaylistItem } from "../shared/types";
import { SmilPar } from '../client/audiobook-reader';

interface SmilParElem {
  $?: Record<string, string>;
  text: Array<{ $: Record<string, string> }>;
  audio?: Array<{ $: Record<string, string> }>;
}

interface SmilSeqElem {
  seq?: SmilSeqElem[];
  par?: SmilParElem[];
}

interface SmilBodyElem {
  seq?: SmilSeqElem[];
  par?: SmilParElem[];
}

interface EpubExtractMetadata {
  srcPath: string;       // 源 EPUB 文件路径
  srcMtime: number;      // 源文件 mtime
  srcCtime: number;      // 源文件 ctime
  srcSize: number;       // 源文件大小
  srcHash?: string;      // 源文件 hash，可选
  unzipTime: number;     // 解压时间
  version?: string;      // 解压版本，可选
}

interface OpfData {
  opfDir: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  package: Record<string, any>; // xml2js解析后的结果
}

export class EpubParser {
  private readonly defaultVersion = '1.0';

  /**
   * 解压 EPUB 文件
   * 
   * 如果 存在已解压目录 并且其中的 metadata.json 指向源 EPUB，则默认不再重新解压
   * @param epubPath EPUB 文件路径
   * @param extractDir 解压目录
   * @param overwrite 是否强制覆盖 (即使目标目录已存在且是刚刚解压的，也强制重新解压覆盖)
   */
  public async extractEpub(epubPath: string, extractDir: string, metadataPath: string, overwrite: boolean = false): Promise<void> {
    logger.debug(`Extract epub [${epubPath}] to [${extractDir}]`);
    
    // 获取 EPUB 文件信息
    const stats = await fsp.stat(epubPath);
    const newMetadata: Omit<EpubExtractMetadata, 'unzipTime'> = {
      srcPath: epubPath,
      srcMtime: stats.mtimeMs,
      srcCtime: stats.ctimeMs,
      srcSize: stats.size,
    };

    // 1. 判断解压目录是否存在
    let needExtract = true;
    if (!overwrite && fs.existsSync(extractDir) && fs.existsSync(metadataPath)) {
      logger.debug('EpubExtractMetadata info exists', { metadataPath });
      try {
        const existingMeta: EpubExtractMetadata = JSON.parse(await fsp.readFile(metadataPath, 'utf-8'));
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
        logger.warn('EpubExtractMetadata info parse error!', { metadataPath });
      }
    }

    // 2. 执行解压
    if (needExtract) {
      // 如果目录已存在但需要覆盖，可以先清空
      if (fs.existsSync(extractDir)) {
        await fsp.rm(extractDir, { recursive: true, force: true });
      }
      await fsp.mkdir(extractDir, { recursive: true });
      await extract(epubPath, {dir: extractDir});

      // 3. 写入 metadata.json
      const metadata: EpubExtractMetadata = {
        ...newMetadata,
        unzipTime: Date.now(),
        version: this.defaultVersion,
      };
      await fsp.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
      logger.debug('EPUB extracted', { metadata });
    } else {
      logger.debug('EPUB extraction ignored - already exists and metadata match');
    }
  }

  public async parseEpubExtracted(extractDir: string) {
    try {
      // 1. 查找并解析OPF文件
      const opfPath = await this.findOpfFile(extractDir);
      const opfData = await this.parseOpfFile(opfPath);
      
      // 2. 从manifest中找到所有音频文件
      const audios = await this.getAudioFiles(opfData);
      
      // 3. 从manifest中找到所有SMIL文件并解析
      const smilPars = await this.parseSmilFiles(opfData);
      
      // 4. 根据smil数组生成playlist
      const playlist = this.generatePlaylist(smilPars, audios);
      
      // 5. 查找封面图片
      const coverPath = this.findCoverImagePath(opfData);
      
      // 6. 解析metadata
      const metadata = this.parseMetadata(opfData);
      
      return {
        audios,
        playlist,
        opfPath,
        smilPars,
        coverPath,
        isbn: metadata.isbn,
        title: metadata.title,
        language: metadata.language,
        author: metadata.author,
      };
    } catch (error) {
      logger.error('解析EPUB文件失败:', error);
      throw error;
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
        const opfPath = decodeURIComponent(rootfileElems[0].$['full-path']);
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
  private async getAudioFiles(opfData: OpfData): Promise<AudioFileInfo[]> {
    const manifest = opfData.package?.manifest?.[0]?.item || [];
    const audios: AudioFileInfo[] = [];
    
    for (const item of manifest) {
      const mediaType = item.$['media-type'];
      if (mediaType && mediaType.startsWith('audio/')) {
        const href = item.$.href;
        const audioPath = path.resolve(opfData.opfDir, decodeURIComponent(href));
        
        try {
          const audioInfo = await getAudioFileInfo(audioPath);
          audios.push(audioInfo);
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
    const manifest = opfData.package?.manifest?.[0]?.item || [];
    const smilPars: SmilPar[] = [];
    
    for (const item of manifest) {
      const mediaType = item.$['media-type'];
      if (mediaType === 'application/smil+xml') {
        const href = item.$.href;
        const smilPath = path.resolve(opfData.opfDir, decodeURIComponent(href));
        
        if (fs.existsSync(smilPath)) {
          const smilContent = await fsp.readFile(smilPath, 'utf8');
          const pars = await this.parseSmilContent(smilContent);
          smilPars.push(...pars);
          logger.debug(`Parse SMIL file ${smilPath} - Got ${pars.length} pars`);
        } else {
          logger.warn(`Parse SMIL file ${smilPath} failed - no such file exist`);
        }
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
  private generatePlaylist(smilPars: SmilPar[], audios: AudioFileInfo[]): PlaylistItem[] {
    const playlist: Array<{ filePath: string; title: string; duration: number }> = [];
    const audioMap = new Map<string, AudioFileInfo>();
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
        const coverPath = path.resolve(opfData.opfDir, decodeURIComponent(item.$.href));
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
