import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { LibraryTable, LibraryFolderTable } from "./schema";
import { generateId } from "@/lib/server/helpers";
import { Book, BookService } from "./book";

// 业务层的统一 Library 类型定义
export type Library = typeof LibraryTable.$inferSelect & {
  folders: string[]; // 文件夹路径数组，可能为空数组
};

export type LibraryNew = {
  name: string,
  icon: string,
} & Partial<Omit<Library, "id" | "updatedAt" | "createdAt">>;
  
export type LibraryUpdate = {
  id: string,
} & Partial<Omit<Library, "updatedAt" | "createdAt">>;

/**
 * 将数据库记录转换为业务层 Library 对象 (关联 folders)
 */
async function buildLibraryWithFolders(libraryRecord: typeof LibraryTable.$inferSelect): Promise<Library> {
  const folders = await db.query.LibraryFolderTable.findMany({
    where: eq(LibraryFolderTable.libraryId, libraryRecord.id),
  });

  return {
    ...libraryRecord,
    folders: folders.map(f => f.path), // 可能为空数组
  };
}

export const LibraryService = {
  /**
   * 创建新的图书馆
   */
  createLibrary: async (data: LibraryNew): Promise<Library> => {
    const libraryId = generateId();
    
    // 事务：插入 library 和 folders
    return await db.transaction(async (tx) => {
      // 插入主表
      const [library] = await tx
        .insert(LibraryTable)
        .values({
          id: libraryId,
          ...data,
        })
        .returning();

      // 插入文件夹
      if (data.folders && data.folders.length > 0) {
        const folderValues = data.folders.map(path => ({
          id: generateId(),
          path,
          libraryId,
        }));
        
        await tx.insert(LibraryFolderTable).values(folderValues);
      }

      return buildLibraryWithFolders(library);
    });
  },

  /**
   * 根据 ID 获取图书馆
   */
  getLibraryById: async (id: string): Promise<Library | null> => {
    const library = await db.query.LibraryTable.findFirst({
      where: eq(LibraryTable.id, id),
    });

    if (!library) return null;
    return buildLibraryWithFolders(library);
  },

  /**
   * 获取所有图书馆
   */
  getAllLibraries: async (): Promise<Library[]> => {
    const libraries = await db.query.LibraryTable.findMany({
      orderBy: [asc(LibraryTable.createdAt)],
    });

    return Promise.all(
      libraries.map(library => buildLibraryWithFolders(library))
    );
  },

  /**
   * 根据名称获取图书馆
   */
  getLibraryByName: async (name: string): Promise<Library | null> => {
    const library = await db.query.LibraryTable.findFirst({
      where: eq(LibraryTable.name, name),
    });

    if (!library) return null;
    return buildLibraryWithFolders(library);
  },

  /**
   * 更新图书馆信息
   */
  updateLibrary: async (data: LibraryUpdate): Promise<Library | null> => {
    return await db.transaction(async (tx) => {
      const { id, folders, ...rest } = data;
      // 更新主表
      await tx
        .update(LibraryTable)
        .set({
          ...rest,
          updatedAt: new Date(),
        })
        .where(eq(LibraryTable.id, id));

      // 更新文件夹
      if (folders !== undefined) {
        // 删除所有现有文件夹
        await tx
          .delete(LibraryFolderTable)
          .where(eq(LibraryFolderTable.libraryId, id));

        // 插入新文件夹
        if (folders.length > 0) {
          const folderValues = folders.map(path => ({
            id: generateId(),
            path,
            libraryId: id,
          }));
          
          await tx.insert(LibraryFolderTable).values(folderValues);
        }
      }

      // 获取更新后的记录
      const library = await tx.query.LibraryTable.findFirst({
        where: eq(LibraryTable.id, id),
      });

      if (!library) return null;
      return buildLibraryWithFolders(library);
    });
  },

  /**
   * 向图书馆添加文件夹路径
   */
  addFolderToLibrary: async (id: string, folderPath: string): Promise<Library | null> => {
    return await db.transaction(async (tx) => {
      // 检查文件夹是否已存在
      const existingFolder = await tx.query.LibraryFolderTable.findFirst({
        where: and(
          eq(LibraryFolderTable.libraryId, id),
          eq(LibraryFolderTable.path, folderPath)
        ),
      });

      if (existingFolder) {
        // 如果已存在，获取当前的 library
        const library = await tx.query.LibraryTable.findFirst({
          where: eq(LibraryTable.id, id),
        });
        
        if (!library) return null;
        return buildLibraryWithFolders(library);
      }

      // 添加新文件夹
      await tx.insert(LibraryFolderTable).values({
        id: generateId(),
        path: folderPath,
        libraryId: id,
      });

      // 获取更新后的 library
      const library = await tx.query.LibraryTable.findFirst({
        where: eq(LibraryTable.id, id),
      });

      if (!library) return null;
      return buildLibraryWithFolders(library);
    });
  },

  /**
   * 从图书馆移除文件夹路径
   */
  removeFolderFromLibrary: async (id: string, folderPath: string): Promise<Library | null> => {
    await db
      .delete(LibraryFolderTable)
      .where(and(
        eq(LibraryFolderTable.libraryId, id),
        eq(LibraryFolderTable.path, folderPath)
      ));

    return LibraryService.getLibraryById(id);
  },

  /**
   * 删除图书馆（级联删除相关的文件夹和书籍）
   */
  deleteLibrary: async (id: string): Promise<Library | null> => {
    return await db.transaction(async (tx) => {
      // 先获取要删除的记录
      const library = await LibraryService.getLibraryById(id);
      if (!library) return null;

      // 删除相关的文件夹
      await tx
        .delete(LibraryFolderTable)
        .where(eq(LibraryFolderTable.libraryId, id));

      // 删除主记录
      await tx
        .delete(LibraryTable)
        .where(eq(LibraryTable.id, id));

      return library;
    });
  },

  /**
   * 获取图书馆中所有的书籍
   * @param libraryId 
   * @returns 
   */
  getAllBooks: async (libraryId: string): Promise<Book[]> => {
    // 获取图书馆信息
    const library = await LibraryService.getLibraryById(libraryId);
    if (!library) return [];

    // 存储所有书籍的 Map，用 book.path 作为 key 来去重
    const booksMap = new Map();

    // 遍历所有文件夹，获取书籍
    for (const folder of library.folders) {
      const books = await BookService.getBooksFromFolder(folder);
      // 将书籍添加到 Map 中，自动去重
      books.forEach(book => {
        if (book.path && !booksMap.has(book.path)) {
          booksMap.set(book.path, book);
        }
      });
    }

    // 返回去重后的书籍数组
    return Array.from(booksMap.values());
  },

}
