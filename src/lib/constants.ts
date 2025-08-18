import path from 'path';

// export const BASE_PATH = path.join(__dirname, '../..');
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
// access token 有效期，单位为秒 (例如：30分钟)
export const ACCESS_TOKEN_EXPIRES_IN = 60 * 60;
// refresh token 有效期，单位为秒 (例如：7天)
export const REFRESH_TOKEN_EXPIRES_IN = 365 * 24 * 60 * 60;

// cookies
export const THEME_COOKIE = 'daisy_theme';
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// List of all available daisyUI themes
export const DAISY_THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
  "synthwave", "retro", "cyberpunk", "valentine", "halloween",
  "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe",
  "black", "luxury", "dracula", "cmyk", "autumn", "business",
  "acid", "lemonade", "night", "coffee", "winter", "dim", "nord",
  "sunset",
];
