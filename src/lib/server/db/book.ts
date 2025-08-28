// =============================================================================
// book.ts - Book CRUD Functions
// =============================================================================

import { eq, and, like, or } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { BookTable } from "./schema";
import { createId } from '@paralleldrive/cuid2';

// 类型定义
export type Book = typeof BookTable.$inferSelect;

type BookInsert = typeof BookTable.$inferInsert;

export type NewBook = Omit<BookInsert, "id"> & {
  id?: string;
};

export type UpdateBook = Partial<Omit<BookInsert, "id" | "createdAt" | "updatedAt">>;

export type BookType = 'epub' | 'audible_epub' | 'audiobook';
export interface BookFilter {
  libraryId?: string;
  type?: BookType;
  author?: string;
  genre?: string;
  search?: string; // 搜索标题或作者
}

/**
 * 创建新书籍
 */
export async function createBook(data: NewBook): Promise<Book> {
  const bookData = {
    ...data,
    id: data.id ?? createId(),
    tags: data.tags ?? [],
    genre: data.genre ?? [],
  };
  
  const [book] = await db.insert(BookTable).values(bookData).returning();
  return book;
}

/**
 * 根据 ID 获取书籍
 */
export async function getBookById(id: string): Promise<Book | null> {
  const book = await db.query.BookTable.findFirst({
    where: eq(BookTable.id, id),
  });
  return book ?? null;
}

/**
 * 获取图书馆中的所有书籍
 */
export async function getBooksByLibraryId(libraryId: string): Promise<Book[]> {
  return db.query.BookTable.findMany({
    where: eq(BookTable.libraryId, libraryId),
    orderBy: (book, { asc }) => [asc(book.title)],
  });
}

/**
 * 根据条件筛选书籍
 */
export async function getBooks(filter: BookFilter = {}): Promise<Book[]> {
  const conditions = [];
  
  if (filter.libraryId) {
    conditions.push(eq(BookTable.libraryId, filter.libraryId));
  }
  
  if (filter.type) {
    conditions.push(eq(BookTable.type, filter.type));
  }
  
  if (filter.author) {
    conditions.push(like(BookTable.author, `%${filter.author}%`));
  }
  
  if (filter.search) {
    conditions.push(
      or(
        like(BookTable.title, `%${filter.search}%`),
        like(BookTable.author, `%${filter.search}%`)
      )
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  return db.query.BookTable.findMany({
    where: whereClause,
    orderBy: (book, { asc }) => [asc(book.title)],
  });
}

/**
 * 根据类型获取书籍
 */
export async function getBooksByType(type: BookType): Promise<Book[]> {
  return db.query.BookTable.findMany({
    where: eq(BookTable.type, type),
    orderBy: (book, { asc }) => [asc(book.title)],
  });
}

/**
 * 搜索书籍（标题或作者）
 */
export async function searchBooks(query: string): Promise<Book[]> {
  return db.query.BookTable.findMany({
    where: or(
      like(BookTable.title, `%${query}%`),
      like(BookTable.author, `%${query}%`)
    ),
    orderBy: (book, { asc }) => [asc(book.title)],
  });
}

/**
 * 根据标签获取书籍
 */
export async function getBooksByTags(tags: string[]): Promise<Book[]> {
  // 由于 SQLite 的 JSON 查询限制，这里使用 JavaScript 过滤
  const allBooks = await db.query.BookTable.findMany();
  return allBooks.filter(book => {
    const bookTags = Array.isArray(book.tags) ? book.tags : [];
    return tags.some(tag => bookTags.includes(tag));
  });
}

/**
 * 更新书籍信息
 */
export async function updateBook(id: string, data: UpdateBook): Promise<Book | null> {
  const [book] = await db
    .update(BookTable)
    .set(data)
    .where(eq(BookTable.id, id))
    .returning();
  return book ?? null;
}

/**
 * 添加书籍标签
 */
export async function addTagsToBook(id: string, newTags: string[]): Promise<Book | null> {
  const book = await getBookById(id);
  if (!book) return null;
  
  const currentTags = Array.isArray(book.tags) ? book.tags : [];
  const uniqueTags = [...new Set([...currentTags, ...newTags])];
  
  return updateBook(id, { tags: uniqueTags });
}

/**
 * 删除书籍
 */
export async function deleteBook(id: string): Promise<Book | null> {
  const [book] = await db
    .delete(BookTable)
    .where(eq(BookTable.id, id))
    .returning();
  return book ?? null;
}

/**
 * 批量删除书籍
 */
export async function deleteBooksFromLibrary(libraryId: string): Promise<Book[]> {
  return db
    .delete(BookTable)
    .where(eq(BookTable.libraryId, libraryId))
    .returning();
}