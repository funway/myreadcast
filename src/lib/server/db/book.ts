import { eq, and, like, or, inArray, asc, desc, sql } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { BookTable } from "./schema";
import { generateId } from "@/lib/server/helpers";
import { logger } from "../logger";

// 类型定义
export type Book = typeof BookTable.$inferSelect;

type BookInsert = typeof BookTable.$inferInsert;

export type BookNew = Omit<BookInsert, "id" | "updatedAt" | "createdAt">;

export type BookUpdate = {
  id: string;
} & Partial<BookNew>;

export type BookType = 'epub' | 'audible_epub' | 'audios';

export type BookQueryOptions = {
  libraryId?: string;
  type?: BookType;
  author?: string;
  narrator?: string;
  genre?: string[];
  tags?: string[];
  search?: string;  // 搜索标题、作者、描述
  orderBy?: keyof typeof BookTable._.columns;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

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

  getBooksFromFolder: async (folder: string): Promise<Book[]> => {
    // 确保文件夹路径以 '/' 结尾，用于精确匹配子路径
    const folderPath = folder.endsWith('/') ? folder : folder + '/';
    
    return await db.query.BookTable.findMany({
      where: like(BookTable.path, `${folderPath}%`),
      orderBy: (book, { asc }) => [asc(book.path)],
    });
  },

  getBookFromLibrary: async (libraryId: string): Promise<Book[]> => { 
    return await db.query.BookTable.findMany({
      where: eq(BookTable.libraryId, libraryId),
    });
  },

  queryBooks: async (options: BookQueryOptions = {}): Promise<Book[]> => {
    const {
      libraryId,
      type,
      author,
      narrator,
      genre,
      tags,
      search,
      orderBy = 'createdAt',
      orderDirection = 'desc',
      limit,
      offset,
    } = options;

    // 构建查询条件
    const conditions = [];

    if (libraryId) {
      conditions.push(eq(BookTable.libraryId, libraryId));
    }

    if (type) {
      conditions.push(eq(BookTable.type, type));
    }

    if (author) {
      conditions.push(like(BookTable.author, `%${author}%`));
    }

    if (narrator) {
      conditions.push(like(BookTable.narrator, `%${narrator}%`));
    }

    // 使用 JSON 查询来处理 genre 字段
    if (genre && genre.length > 0) {
      const genreConditions = genre.map(g => 
        sql`json_extract(${BookTable.genre}, '$') LIKE '%"${g}"%'`
      );
      conditions.push(or(...genreConditions));
    }

    // 使用 JSON 查询来处理 tags 字段
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(tag => 
        sql`json_extract(${BookTable.tags}, '$') LIKE '%"${tag}"%'`
      );
      conditions.push(or(...tagConditions));
    }

    // 搜索功能：在标题、作者、描述中搜索
    if (search) {
      conditions.push(
        or(
          like(BookTable.title, `%${search}%`),
          like(BookTable.author, `%${search}%`),
          like(BookTable.description, `%${search}%`)
        )
      );
    }

    // 构建排序
    const orderByField = BookTable[orderBy];
    const orderClause = orderDirection === 'asc' ? asc(orderByField) : desc(orderByField);

    // 执行查询
    // const books = await db.query.BookTable.findMany({
    //   where: conditions.length > 0 ? and(...conditions) : undefined,
    //   orderBy: [orderClause],
    //   limit,
    //   offset,
    // });
    
    const queryBuilder = db
      .select()
      .from(BookTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderClause);
    if (limit !== undefined) {
      queryBuilder.limit(limit);
    }
    if (offset !== undefined) {
      queryBuilder.offset(offset);
    }

    // const { sql, params } = queryBuilder.toSQL();

    logger.debug(
      `Drizzle Query Builder:\n` +
      `  - SQL: ${queryBuilder.toSQL().sql} \n` +
      `  - Params: ${queryBuilder.toSQL().params}`);
    
    const books = await queryBuilder.execute();
    
    return books;
  },

  /**
   * 获取所有作者列表
   */
  getAllAuthors: async (libraryId?: string): Promise<string[]> => {
    const conditions = [
      sql`${BookTable.author} IS NOT NULL`,
      sql`${BookTable.author} <> ''`,
      ...(libraryId ? [eq(BookTable.libraryId, libraryId)] : []),
    ];

    const rows = await db
      .selectDistinct({ author: BookTable.author })
      .from(BookTable)
      .where(and(...conditions))
      .orderBy(asc(BookTable.author));

    return rows.map(r => r.author as string);
  },

  /**
   * 获取所有朗读者列表
   */
  getAllNarrators: async (libraryId?: string): Promise<string[]> => {
    const conditions = [
      sql`${BookTable.narrator} IS NOT NULL`,
      sql`${BookTable.narrator} <> ''`,
      ...(libraryId ? [eq(BookTable.libraryId, libraryId)] : []),
    ];

    const rows = await db
      .selectDistinct({ narrator: BookTable.narrator })
      .from(BookTable)
      .where(and(...conditions))
      .orderBy(asc(BookTable.narrator));

    return rows.map(r => r.narrator as string);
  },

  /**
   * 获取所有书籍类型（genre）列表
   */
  getAllGenre: async (libraryId?: string): Promise<string[]> => {
    const conditions = [
      sql`${BookTable.genre} IS NOT NULL`,
      ...(libraryId ? [eq(BookTable.libraryId, libraryId)] : []),
    ];

    const rows = await db
      .select({ genre: BookTable.genre })
      .from(BookTable)
      .where(and(...conditions));
    const genreSet = new Set<string>();

    rows.forEach(row => {
      const genres: string[] = JSON.parse(row.genre as string);
      genres.forEach(g => {
        if (g) genreSet.add(g);
      });
    });
    
    return Array.from(genreSet).sort();
  },
  
}
