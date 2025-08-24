import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, check } from "drizzle-orm/sqlite-core";

const timestamps = {
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}

export const UserTable = sqliteTable('user',
  {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
    token: text('token').notNull(),
    role: text('role').notNull().default('user'),
    image: text('image'),
    permissions: text('permissions', {mode: 'json'}).notNull().default(sql`'{}'`),
    ...timestamps,
  },
  (table) => [
    check("role_check", sql`${table.role} IN ('admin', 'user')`)
  ]
);

export const LibraryTable = sqliteTable('library', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  ...timestamps,
});

export const LibraryFolderTable = sqliteTable('library_folder', {
  id: text('id').primaryKey(),
  path: text('path').notNull(),
  libraryId: text('library_id').notNull(),
  ...timestamps,
});

export const BookTable = sqliteTable('book', {
  id: text('id').primaryKey(),
  libraryId: text('library_id').notNull(),
  type: text('type', { enum: ['epub', 'audible_epub', 'audiobook'] }).notNull(),
  title: text('title').notNull(),
  author: text('author'),
  narrator: text('narrator'),
  description: text('description'),
  coverPath: text('cover_path'),
  duration: integer('duration'),
  wordCount: integer('word_count'),
  filePath: text('file_path').notNull(),
  tags: text('tags', { mode: 'json' }).notNull().default(sql`'[]'`),
  genre: text('genre', { mode: 'json' }).notNull().default(sql`'[]'`),
  ...timestamps,
});

export const MediaProgressTable = sqliteTable('media_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  bookId: text('book_id').notNull(),
  ...timestamps,
});
