import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from '@/lib/db/schema'; // 确保路径正确
import fs from 'fs';
import path from 'path';

// 从环境变量读取路径，如果未设置则使用默认值
const dbFile = process.env.DB_FILE!;
const migrationsFolder = process.env.DB_MIGRATION!;

// 构建数据库文件的绝对路径
const dbPath = path.join(process.cwd(), dbFile);
// 获取数据库文件所在的目录
const dbDir = path.dirname(dbPath);

// 确保数据库目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 使用 better-sqlite3 初始化数据库连接 (如果 dbPath 不存在，则会自动创建)
const sqlite = new Database(dbPath);

// 将 better-sqlite3 实例传递给 Drizzle
export const db = drizzle(sqlite, { schema });

// 使用一个简单的锁来防止在并发请求下重复执行
let migrating = false;
let migrationComplete = false;

export async function initializeDatabase() {
  if (migrationComplete || migrating) {
    return;
  }

  migrating = true;
  try {
    console.log("Database initialization started...");
    // Drizzle 的 migrate 函数会自动应用所有尚未执行的迁移
    await migrate(db, { migrationsFolder });
    migrationComplete = true;
    console.log("Database initialization complete.");
  } catch (error) {
    console.error("Database migration failed:", error);
    process.exit(1);
  } finally {
    migrating = false;
  }
}