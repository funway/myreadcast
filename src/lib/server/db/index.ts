import fs from 'fs';
import path from 'path';
import { createClient } from "@libsql/client";
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

import * as schema from '@/lib/server/db/schema';
import { DB_FILE, DB_MIGRATION } from '@/lib/server/constants';
import { logger } from '../logger';

// 从环境变量读取路径，如果未设置则使用默认值
const dbPath = DB_FILE!;
const migrationsFolder = DB_MIGRATION!;

// 获取数据库文件所在的目录
const dbDir = path.dirname(dbPath);

// 确保数据库目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 使用 better-sqlite3 初始化数据库连接 (如果 dbPath 不存在，则会自动创建)
const sqlite = createClient({
  url: `file:${dbPath}`,
});

// 创建 db 对象并导出供外部使用
export const db = drizzle(sqlite, { schema });

// 使用一个简单的锁来防止在并发请求下重复执行
let migrating = false;
let migrationComplete = false;

/**
 * 初始化数据库
 * 
 * SQLite 的初始化操作是同步的, 所以不需要 await
 * - 如果不存在，自动创建
 * - 如果有未迁移表结构，自动迁移
 * @returns 
 */
function initializeDatabase() {
  if (migrationComplete || migrating) {
    return;
  }

  migrating = true;
  try {
    logger.debug("Database initialization started...");
    // Drizzle 的 migrate 函数会自动应用所有尚未执行的迁移
    migrate(db, { migrationsFolder });
    migrationComplete = true;
    logger.debug("Database initialization complete.");
  } catch (error) {
    logger.error("Database migration failed:", error);
    process.exit(1);
  } finally {
    migrating = false;
  }
}

// 在模块加载时立即初始化数据库
initializeDatabase();