import { promises as fs } from 'fs';
import path from 'path';
import { LibraryService } from "../db/library";
import { logger } from "../logger";
import { TaskHandler } from "./handler";
import { Book, BookNew, BookService } from '../db/book';
import { AUDIO_EXTENSIONS } from '../constants';
import { DrizzleQueryError } from 'drizzle-orm';


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
      await this.updateTaskStatus('completed', `${unchangedCount} unchanged, ${toDelete.length} deleted, ${toInsert.length} added`);
      
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

  private async scanFolder(folderPath: string, scannedBooks: BookNew[]) { 
    logger.debug(`  Scanning foler: ${folderPath}`);
    
    const items = await fs.readdir(folderPath);
    for (const item of items) { 
      const itemPath = path.join(folderPath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isFile()) {
        // 处理 EPUB 文件
        if (path.extname(item).toLowerCase() === '.epub') {
          scannedBooks.push({
            libraryId: this.task.targetId,
            type: 'epub',
            path: itemPath,
            title: path.basename(item, '.epub'),  // 去掉后缀
            mtime: Math.floor(stats.mtimeMs), // 去掉小数点部分
            size: stats.size,
          });
        }
      } else if (stats.isDirectory()) { 
        // 检查是否为音频文件夹
        const audioFiles = await this.getAudioFiles(itemPath);
        if (audioFiles.length > 0) {
          scannedBooks.push({
            libraryId: this.task.targetId,
            type: 'audios',
            path: itemPath,
            title: path.basename(itemPath),
            mtime: Math.floor(stats.mtimeMs),
            size: stats.size,
            audios: audioFiles.toSorted(),
          });
        } else { 
          // 如果不是音频文件夹，则递归扫描该文件夹
          await this.scanFolder(itemPath, scannedBooks);
        }
      }
    }
  }

  private async getAudioFiles(folderPath: string): Promise<string[]> {
    const audioFiles: string[] = [];
    const items = await fs.readdir(folderPath);
    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const ext = path.extname(item).toLowerCase();
      if (AUDIO_EXTENSIONS.has(ext)) { 
        audioFiles.push(itemPath)
      }
    }

    return audioFiles;
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
        toDelete.push(exBook);
      } else if (
        exBook.mtime !== scBook.mtime ||
        exBook.size !== scBook.size
      ) {                           // 文件存在但有变更 (将旧文件标记为 to delete)
        /**
         * 这里可以增加其他判断, 比如再判断 MD5, 或者对于文件夹再判断内部文件
         */
        toDelete.push(exBook);
      } else {                      // 文件存在但没有变更 (将新文件从 to insert 中踢出)
        pathsToInsert.delete(exBook.path);
      }
    }
    const toInsert = scannedBooks.filter(book => pathsToInsert.has(book.path));
    
    return { toDelete, toInsert };
  }
}