import path from 'path';

export const BASE_PATH = path.resolve('./');

// logging
export const LOG_DIR = path.join(BASE_PATH, 'logs');
export const LOG_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const LOG_MAX_FILES = 5;
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "INFO";

// db
export const DB_FILE = process.env.DB_FILE ?? path.join(BASE_PATH, 'database/myreadcast.db');
export const DB_MIGRATION = process.env.DB_MIGRATION ?? path.join(BASE_PATH, 'database/drizzle');

// auth
export const AUTH_SECRET = (process.env.AUTH_SECRET ?? '').trim();

export * from '@/lib/shared/constants';