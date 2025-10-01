import path from 'path';
import { promises as fsp, Stats } from 'fs';
import { DrizzleQueryError } from 'drizzle-orm';
import { LibraryService } from "../db/library";
import { logger } from "../logger";
import { TaskHandler } from "./handler";
import { Book, BookNew, BookService } from '../db/book';
import { AUDIO_EXTENSIONS, EPUB_MERGED_SMIL_FILE, EPUB_META_FILE } from '../constants';
import { AudioFileInfo, AudioFileInfoWithRel } from '@/lib/shared/types';
import { getAudioFileInfo } from '../helpers';
import { EpubExtractor } from '../epub-extractor';

export class LibraryScanHandler extends TaskHandler { 
  public async run(): Promise<void> {
    const libraryId = this.task.targetId;
    logger.debug(`Running library scan task for libraryId: ${libraryId}`);
    
    // 1. 更新 task 为 running
    await this.updateTaskStatus('running');

    try {
      // 2. 执行操作
      // 2.1 fetch target
      const library = await LibraryService.getLibraryById(libraryId);
      logger.debug('Fetch library: ', library);
      if (!library) {
        logger.warn(`library id [${libraryId}] not exist`);
        throw new Error(`library id [${libraryId}] not exist`);
      }

      // 2.2 扫描 library 的所有目录以及从数据库获取它的所有 books
      const folders = library.folders;
      const scannedBooks: BookNew[] = [];
      
      // 扫描目录获取所有 books (EPUB 文件，以及包含 audio 的文件夹)
      for (const folder of folders) { 
        await this.scanFolder(folder, scannedBooks);
      }
      // 获取数据库中记录的该 library 下的所有 books
      const existingBooks: Book[] = await BookService.getBookFromLibrary(libraryId);

      logger.debug(`Found ${scannedBooks.length} books during scan`);
      
      // 2.3 对比数据库中的 books 与 扫描得到的 books
      const { toDelete, toInsert } = this.compareBooks(existingBooks, scannedBooks);
      
      const unchangedCount = existingBooks.length - toDelete.length;
      logger.debug(`Books unchanged: ${unchangedCount}, Books to delete: ${toDelete.length}, Books to insert: ${toInsert.length}`);
      logger.debug(`Delete paths: [${toDelete.map(b => b.path).join(', ')}]`);
      logger.debug(`Insert paths: [${toInsert.map(b => b.path).join(', ')}]`);
      
      // 2.4 执行 books 的删除与新增操作
      if (toDelete.length > 0) { 
        await BookService.deleteBooksByIds(toDelete.map(book => book.id));
      }
      if (toInsert.length > 0) { 
        await BookService.createBooks(toInsert);
      }

      // 3. 更新 task 状态
      await this.updateTaskStatus(
        'completed',
        `${unchangedCount} unchanged, ${toDelete.length} deleted, ${toInsert.length} added`
      );
      
      // 4. 更新 library 的 last_scan
      await LibraryService.updateLibrary({
        id: libraryId,
        lastScan: new Date(),
      });
    } catch (error) {
      logger.error(`Failed to scan for libraryId: ${libraryId}`, error);
      if (error instanceof DrizzleQueryError) {
        this.updateTaskStatus('failed', String(error.cause));
      } else { 
        this.updateTaskStatus('failed', String(error));
      }
    }
  }

  /**
   * 递归扫描目录，获取 Book 信息
   * 1. 优先获取目录下的 .epub 信息
   * 2. 判断子目录是否直接包含音频文件，是则认为是 audiobook
   * 3. 否则认为需要递归扫描该子目录
   * @param folderPath 目标目录路径
   * @param scannedBooks 扫描得到的 Book 信息
   */
  private async scanFolder(folderPath: string, scannedBooks: BookNew[]) { 
    logger.debug(`Scanning foler: ${folderPath}`);
    
    const items = await fsp.readdir(folderPath);
    for (const item of items) {
      if (item.startsWith('.')) continue;

      const itemPath = path.join(folderPath, item);
      const stats = await fsp.stat(itemPath);

      if (stats.isFile()) {
        if (path.extname(item).toLowerCase() === '.epub') {
          // 1. 处理 EPUB 文件
          const epubExtractor = new EpubExtractor(itemPath);
          try {
            const book = await epubExtractor.extract();
            scannedBooks.push({
              ...book,
              libraryId: this.task.targetId,
              mtime: Math.floor(stats.mtimeMs),  // 只保留整数部分(毫秒)
              size: stats.size,
            });
          } catch (error) {
            logger.error(`Fail to extract the EPUB ${itemPath}`, error);
            epubExtractor.clearExtractedData();
          }
        }
      } else if (stats.isDirectory()) { 
        // 2. 处理 audios 子目录
        const book = await this.collectAudiosAsBook(itemPath, stats);
        if (book) {
          scannedBooks.push(book);
        } else { 
          // 3. 递归扫描子目录
          await this.scanFolder(itemPath, scannedBooks);
        }
      }
    }
  }

  /**
   * 获取目录下的音频文件信息 (不递归)
   * @param folderPath 
   * @returns 
   */
  private async getAudioFiles(folderPath: string): Promise<AudioFileInfo[]> {
    const audioFiles: AudioFileInfo[] = [];
    const items = await fsp.readdir(folderPath);

    for (const item of items) {
      const filePath = path.join(folderPath, item);
      const ext = path.extname(item).toLowerCase();
      if (!AUDIO_EXTENSIONS.has(ext)) continue;
      
      try {
        const info = await getAudioFileInfo(filePath);
        audioFiles.push(info);
      } catch (error) {
        logger.error(`Failed to parse ${filePath}:`, error);
        continue;
      }
    }

    return audioFiles;
  }

  private async collectAudiosAsBook(folderPath: string, stats: Stats): Promise<BookNew | null> { 
    const audioFiles = await this.getAudioFiles(folderPath);
    if (audioFiles.length === 0) return null;

    const audios = [...audioFiles]
      .sort((a, b) => a.filePath.localeCompare(b.filePath))
      .map(a => { 
        const relPath = path.relative(folderPath, a.filePath);
        return { ...a, relPath } as AudioFileInfoWithRel;
      });
    
    const playlist = audios
      .filter(a => a.duration > 0)
      .map(a => ({
        filePath: a.filePath,
        relPath: a.relPath, 
        title: a.meta?.title ?? path.basename(a.filePath),
        duration: a.duration
      }));
    
    const book: BookNew = {
      libraryId: this.task.targetId,
      type: 'audios',
      
      path: folderPath,
      mtime: Math.floor(stats.mtimeMs),  // 只保留整数部分 (毫秒)
      size: stats.size,
      
      folderPath: folderPath,
      audios: audioFiles,
      playlist: playlist,
      
      title: path.basename(folderPath),
    }
    logger.debug(`Audiobook (audio folder) parsed success [${folderPath}]`, { playlist_len: playlist.length });
    return book;
  }

  private compareBooks(existingBooks: Book[], scannedBooks: BookNew[]): {
    toDelete: Book[],
    toInsert: BookNew[],
  } { 
    const toDelete: Book[] = [];

    const pathsToInsert = new Set(scannedBooks.map(book => book.path));  // 默认本次扫描到的都是新书
    const scannedBooksMap = new Map(scannedBooks.map(book => [book.path, book]));
    for (const exBook of existingBooks) { 
      const scBook = scannedBooksMap.get(exBook.path);

      if (!scBook) {                // 文件已被删除 (将旧文件标记为 to delete)
        logger.debug(`${exBook.path} not exist agin`);
        toDelete.push(exBook);
      } else if (
        exBook.mtime !== scBook.mtime ||
        exBook.size !== scBook.size 
      ) {                           // 文件存在但有变更 (将旧文件标记为 to delete)
        /**
         * 这里可以增加其他判断, 比如再判断 MD5, 或者对于文件夹再判断内部文件
         */
        logger.debug(`${exBook.path} not equal to new scanned`);
        toDelete.push(exBook);
      } else {                      // 文件存在但没有变更 (将新文件从 to insert 中踢出)
        logger.debug(`${exBook.path} exits and no change`);
        pathsToInsert.delete(exBook.path);
      }
    }
    const toInsert = scannedBooks.filter(book => pathsToInsert.has(book.path));
    
    return { toDelete, toInsert };
  }
}