// =============================================================================
// library.ts - Library CRUD Functions (统一的 Library 模型)
// =============================================================================
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { LibraryTable, LibraryFolderTable } from "./schema";
import { createId } from '@paralleldrive/cuid2';

// 业务层的统一 Library 类型定义
export type Library = typeof LibraryTable.$inferSelect & {
  folders: string[]; // 文件夹路径数组，可能为空数组
};

export type NewLibrary = Omit<typeof LibraryTable.$inferInsert, "id"> & {
  id?: string;
  folders?: string[];
};

export type UpdateLibrary = {
  name?: string;
  icon?: string;
  folders?: string[];
};

/**
 * 将数据库记录转换为业务层 Library 对象
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

/**
 * 创建新的图书馆
 */
export async function createLibrary(data: NewLibrary): Promise<Library> {
  const libraryId = data.id ?? createId();
  
  // 事务：插入 library 和 folders
  return await db.transaction(async (tx) => {
    // 插入主表
    const [library] = await tx
      .insert(LibraryTable)
      .values({
        id: libraryId,
        name: data.name,
        icon: data.icon,
      })
      .returning();

    // 插入文件夹
    if (data.folders && data.folders.length > 0) {
      const folderValues = data.folders.map(path => ({
        id: createId(),
        path,
        libraryId,
      }));
      
      await tx.insert(LibraryFolderTable).values(folderValues);
    }

    return buildLibraryWithFolders(library);
  });
}

/**
 * 根据 ID 获取图书馆
 */
export async function getLibraryById(id: string): Promise<Library | null> {
  const library = await db.query.LibraryTable.findFirst({
    where: eq(LibraryTable.id, id),
  });

  if (!library) return null;
  return buildLibraryWithFolders(library);
}

/**
 * 获取所有图书馆
 */
export async function getAllLibraries(): Promise<Library[]> {
  const libraries = await db.query.LibraryTable.findMany({
    orderBy: [asc(LibraryTable.createdAt)],
  });

  return Promise.all(
    libraries.map(library => buildLibraryWithFolders(library))
  );
}

/**
 * 根据名称获取图书馆
 */
export async function getLibraryByName(name: string): Promise<Library | null> {
  const library = await db.query.LibraryTable.findFirst({
    where: eq(LibraryTable.name, name),
  });

  if (!library) return null;
  return buildLibraryWithFolders(library);
}

/**
 * 更新图书馆信息
 */
export async function updateLibrary(id: string, data: UpdateLibrary): Promise<Library | null> {
  return await db.transaction(async (tx) => {
    // 更新主表
    if (data.name !== undefined || data.icon !== undefined) {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.icon !== undefined) updateData.icon = data.icon;
      
      await tx
        .update(LibraryTable)
        .set(updateData)
        .where(eq(LibraryTable.id, id));
    }

    // 更新文件夹
    if (data.folders !== undefined) {
      // 删除所有现有文件夹
      await tx
        .delete(LibraryFolderTable)
        .where(eq(LibraryFolderTable.libraryId, id));

      // 插入新文件夹
      if (data.folders.length > 0) {
        const folderValues = data.folders.map(path => ({
          id: createId(),
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
}

/**
 * 向图书馆添加文件夹路径
 */
export async function addFolderToLibrary(id: string, folderPath: string): Promise<Library | null> {
  // 检查文件夹是否已存在
  const existingFolder = await db.query.LibraryFolderTable.findFirst({
    where: and(
      eq(LibraryFolderTable.libraryId, id),
      eq(LibraryFolderTable.path, folderPath)
    ),
  });

  if (existingFolder) {
    // 如果已存在，直接返回现有的 library
    return getLibraryById(id);
  }

  // 添加新文件夹
  await db.insert(LibraryFolderTable).values({
    id: createId(),
    path: folderPath,
    libraryId: id,
  });

  return getLibraryById(id);
}

/**
 * 从图书馆移除文件夹路径
 */
export async function removeFolderFromLibrary(id: string, folderPath: string): Promise<Library | null> {
  await db
    .delete(LibraryFolderTable)
    .where(and(
      eq(LibraryFolderTable.libraryId, id),
      eq(LibraryFolderTable.path, folderPath)
    ));

  return getLibraryById(id);
}

/**
 * 删除图书馆（级联删除相关的文件夹和书籍）
 */
export async function deleteLibrary(id: string): Promise<Library | null> {
  return await db.transaction(async (tx) => {
    // 先获取要删除的记录
    const library = await getLibraryById(id);
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
}