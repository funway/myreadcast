import { and, eq } from "drizzle-orm";
import { ReadingProgressTable } from "./schema";
import { db } from "@/lib/server/db";
import { generateId } from "../helpers";

export type Progress = typeof ReadingProgressTable.$inferSelect;
type ProgressInsert = typeof ReadingProgressTable.$inferInsert;
export type ProgressUpdate = Omit<ProgressInsert, 'id' | "updatedAt" | "createdAt">;

export const ProgressService = {
  updateProgress: async (updates: ProgressUpdate) => {
    return await db
      .insert(ReadingProgressTable)
      .values({
        id: generateId(),
        ...updates,
        updatedAt: new Date(),
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [ReadingProgressTable.userId, ReadingProgressTable.bookId],
        set: {
          ...updates,
          updatedAt: new Date(),
        }
      })
      .returning();
  },

  getProgress: async (userId: string, bookId: string) => {
    return await db.query.ReadingProgressTable.findFirst(
      {
        where: and(
          eq(ReadingProgressTable.userId, userId),
          eq(ReadingProgressTable.bookId, bookId)
        ),
      }
    );
  },

  allProgressByUser: async (userId: string) => {
    return await db
      .select()
      .from(ReadingProgressTable)
      .where(
        eq(ReadingProgressTable.userId, userId)
      );
  },

  deleteProgressById: async (id: string) => {
    return await db
      .delete(ReadingProgressTable)
      .where(
        eq(ReadingProgressTable.id, id)
      );
  },

  deleteProgressByUserBook: async (userId: string, bookId: string) => { 
    return await db
      .delete(ReadingProgressTable)
      .where(
        and(
          eq(ReadingProgressTable.userId, userId),
          eq(ReadingProgressTable.bookId, bookId)
        )
      );
  },

  deleteProgressByBook: async (bookId: string) => {
    return await db
      .delete(ReadingProgressTable)
      .where(
        eq(ReadingProgressTable.bookId, bookId)
      );
  },
}
