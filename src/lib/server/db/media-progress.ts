// =============================================================================
// mediaProgress.ts - Media Progress CRUD Functions
// =============================================================================

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { MediaProgressTable } from "./schema";
import { generateId } from "@/lib/server/helpers";

// Position 类型定义
export type EpubPosition = {
  type: 'epub';
  cfi: string; // EPUB Canonical Fragment Identifier
  chapter?: string;
  page?: number;
};

export type AudioPosition = {
  type: 'audio';
  filePath: string; // audio 文件路径
  currentTime: number; // 当前播放时间（秒）
  duration?: number; // 总时长（秒）
};

export type MediaPosition = EpubPosition | AudioPosition;

// 类型定义
export type MediaProgress = typeof MediaProgressTable.$inferSelect;
type MediaProgressInsert = typeof MediaProgressTable.$inferInsert;
export type NewMediaProgress = {
  userId: string;
  bookId: string;
  progress?: number;
  position?: MediaPosition;
} & Partial<Omit<MediaProgressInsert, "userId" | "bookId">>;

export type UpdateMediaProgress = {
  progress?: number;
  position?: MediaPosition;
};

/**
 * 创建或更新媒体进度
 */
export async function upsertMediaProgress(data: NewMediaProgress): Promise<MediaProgress> {
  // 先尝试查找现有记录
  const existingProgress = await db.query.MediaProgressTable.findFirst({
    where: and(
      eq(MediaProgressTable.userId, data.userId),
      eq(MediaProgressTable.bookId, data.bookId)
    ),
  });

  if (existingProgress) {
    // 更新现有记录
    const [updated] = await db
      .update(MediaProgressTable)
      .set({
        progress: data.progress ?? existingProgress.progress,
        position: data.position ?? existingProgress.position,
      })
      .where(eq(MediaProgressTable.id, existingProgress.id))
      .returning();
    return updated;
  } else {
    // 创建新记录
    const [created] = await db
      .insert(MediaProgressTable)
      .values({
        id: generateId(),
        userId: data.userId,
        bookId: data.bookId,
        progress: data.progress ?? 0,
        position: data.position ?? null,
      })
      .returning();
    return created;
  }
}

/**
 * 根据用户和书籍获取媒体进度
 */
export async function getMediaProgress(userId: string, bookId: string): Promise<MediaProgress | null> {
  const progress = await db.query.MediaProgressTable.findFirst({
    where: and(
      eq(MediaProgressTable.userId, userId),
      eq(MediaProgressTable.bookId, bookId)
    ),
  });
  return progress ?? null;
}

/**
 * 根据用户 ID 获取所有媒体进度
 */
export async function getUserMediaProgress(userId: string): Promise<MediaProgress[]> {
  return db.query.MediaProgressTable.findMany({
    where: eq(MediaProgressTable.userId, userId),
    orderBy: (progress, { desc }) => [desc(progress.updatedAt)],
  });
}

/**
 * 根据书籍 ID 获取所有用户的进度
 */
export async function getBookMediaProgress(bookId: string): Promise<MediaProgress[]> {
  return db.query.MediaProgressTable.findMany({
    where: eq(MediaProgressTable.bookId, bookId),
    orderBy: (progress, { desc }) => [desc(progress.updatedAt)],
  });
}

/**
 * 更新媒体进度
 */
export async function updateMediaProgress(
  userId: string, 
  bookId: string, 
  data: UpdateMediaProgress
): Promise<MediaProgress | null> {
  const existingProgress = await getMediaProgress(userId, bookId);
  if (!existingProgress) return null;

  const [updated] = await db
    .update(MediaProgressTable)
    .set(data)
    .where(eq(MediaProgressTable.id, existingProgress.id))
    .returning();
  
  return updated ?? null;
}

/**
 * 删除媒体进度
 */
export async function deleteMediaProgress(userId: string, bookId: string): Promise<MediaProgress | null> {
  const [deleted] = await db
    .delete(MediaProgressTable)
    .where(and(
      eq(MediaProgressTable.userId, userId),
      eq(MediaProgressTable.bookId, bookId)
    ))
    .returning();
  
  return deleted ?? null;
}

/**
 * 删除用户的所有媒体进度
 */
export async function deleteUserMediaProgress(userId: string): Promise<MediaProgress[]> {
  return db
    .delete(MediaProgressTable)
    .where(eq(MediaProgressTable.userId, userId))
    .returning();
}

/**
 * 删除书籍的所有媒体进度
 */
export async function deleteBookMediaProgress(bookId: string): Promise<MediaProgress[]> {
  return db
    .delete(MediaProgressTable)
    .where(eq(MediaProgressTable.bookId, bookId))
    .returning();
}