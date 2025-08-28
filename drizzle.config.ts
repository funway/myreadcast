import 'dotenv/config';
import { defineConfig } from "drizzle-kit";
import { DB_FILE, DB_MIGRATION } from './src/lib/server/constants';
import path from 'path';

const REL_DB_FILE = path.relative(path.resolve(), DB_FILE);
const REL_DB_MIGRATION = path.relative(path.resolve(), DB_MIGRATION);
// console.log(REL_DB_FILE, REL_DB_MIGRATION);

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/server/db/schema.ts",
  out: REL_DB_MIGRATION,  // migration dir
  dbCredentials: {
    url: REL_DB_FILE,
  }
});


/**
 * Drizzle SQLite Usage:
 * 
 * 根据底层使用的 sqlite 驱动是 better-sqlite3 还是 libsql, 用法会有些差异
 * 
 * Assume: UserTable is a Table object in schema.ts
 * 
 * - 异步查询, 必须使用 await 等待
 *  const result = await db.select().from(UserTable);           // [异步]
 *  const result = await db.query.UserTable.findMany();         // [异步]
 *  const result = await db.select().from(UserTable).limit(1);  // [异步]
 *  const result = await db.query.UserTable.findFirst();        // [异步]
 * 
 * - all() 和 get() 方法, 如果是 better-sqlite3 驱动, 则为同步查询; 如果是 libsql 驱动, 则为异步查询
 *  const result = (await) db.select().from(UserTable).all(); 
 *  const result = (await) db.select().from(UserTable).get(); 
 * 
 * - sync() 方法, 只能在 better-sqlite3 驱动下使用, 作为同步查询方法; libsql 驱动不支持
 *  const result = db.query.UserTable.findMany().sync();
 */