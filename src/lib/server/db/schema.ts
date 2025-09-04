import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, check, real } from "drizzle-orm/sqlite-core";

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
  name: text('name').notNull().unique(),
  icon: text('icon').notNull(),
  lastScan: integer('last_scan', { mode: 'timestamp' }),
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
  type: text('type', { enum: ['epub', 'audible_epub', 'audios'] }).notNull(),
  
  path: text('path').notNull().unique(), // 对于 EPUB 来说就是文件路径，对于 Audios 来说就是文件夹路径
  audios: text('audios', { mode: 'json' }).notNull().default(sql`'[]'`),  
  mtime: integer('mtime').notNull(),  // 文件修改时间
  size: integer('size').notNull(),  // 文件大小

  title: text('title').notNull(), // 对于 EPUB 来说就是文件名，对于 Audios 来说就是目录名。允许用户修改
  author: text('author'),
  narrator: text('narrator'),
  isbn: text('isbn'),
  description: text('description'),
  coverPath: text('cover_path'),
  duration: integer('duration'),
  wordCount: integer('word_count'),
  
  tags: text('tags', { mode: 'json' }).notNull().default(sql`'[]'`),
  genre: text('genre', { mode: 'json' }).notNull().default(sql`'[]'`),
  ...timestamps,
});

export const MediaProgressTable = sqliteTable('media_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  bookId: text('book_id').notNull(),
  progress: real('progress').notNull().default(0),
  position: text('position', { mode: 'json' }),
  ...timestamps,
});

/**
 * 任务队列  
 * - scan 任务, 扫描本地文件
 * - match 任务, 去互联网获取书籍信息
 */
export const TaskTable = sqliteTable('task', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['library_scan', 'book_match'] }).notNull(),
  targetId: text('target_id').notNull(), // e.g., libraryId or bookId
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] }).notNull().default('pending'),

  result: text('result'),  // 存储成功信息或错误详情
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  ...timestamps,
});