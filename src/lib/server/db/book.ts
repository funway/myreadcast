import { eq, and, like, or, inArray } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { BookTable } from "./schema";
import { generateId } from "@/lib/server/helpers";

// 类型定义
export type Book = typeof BookTable.$inferSelect;

type BookInsert = typeof BookTable.$inferInsert;

export type BookNew = Omit<BookInsert, "id" | "updatedAt" | "createdAt">;

export type BookUpdate = {
  id: string;
} & Partial<BookNew>;

export type BookType = 'epub' | 'audible_epub' | 'audios';

export interface BookFilter {
  libraryId?: string;
  type?: BookType;
  author?: string;
  genre?: string;
  search?: string; // 搜索标题或作者
}

export const BookService = {
  /**
   * 创建新书籍
   */
  createBook: async (data: BookNew): Promise<Book> => { 
    const bookData = {
      id: generateId(),
      ...data,
    }
    const [book] = await db.insert(BookTable).values(bookData).returning();
    return book;
  },

  createBooks: async (books: BookNew[]): Promise<Book[]> => {
    return await db.transaction(async (tx) => {
      const bookData = books.map((b) => ({
        id: generateId(),
        ...b,
      }));

      const inserted = await tx.insert(BookTable).values(bookData).returning();
      return inserted;
    });
  },

  /**
   * 根据 ID 获取书籍
   */
  getBookById: async (id: string): Promise<Book | undefined> => {
    return await db.query.BookTable.findFirst({
      where: eq(BookTable.id, id),
    });
  },

  updateBook: async (bookUpdates: BookUpdate): Promise<Book> => {
    const { id, ...updates } = bookUpdates;
    const [book] = await db
      .update(BookTable)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(BookTable.id, id))
      .returning();
    
    return book;
  },

  deleteBookById: async (id: string): Promise<Book | undefined> => {
    const [book] = await db
      .delete(BookTable)
      .where(eq(BookTable.id, id))
      .returning();
    
    return book;
  },

  deleteBooksByIds: async (ids: string[]): Promise<void> => { 
    await db.delete(BookTable).where(inArray(BookTable.id, ids));
  },

  /**
   * 根据文件夹路径获取书籍
   */
  getBooksFromFolder: async (folder: string): Promise<Book[]> => {
    // 确保文件夹路径以 '/' 结尾，用于精确匹配子路径
    const folderPath = folder.endsWith('/') ? folder : folder + '/';
    
    return await db.query.BookTable.findMany({
      where: like(BookTable.path, `${folderPath}%`),
      orderBy: (book, { asc }) => [asc(book.path)],
    });
  },

}
