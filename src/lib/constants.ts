import path from 'path';

// export const BASE_PATH = path.join(__dirname, '../..');
export const BASE_PATH = path.resolve('./');

// logging
export const LOG_DIR = path.join(BASE_PATH, 'logs');
export const LOG_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const LOG_MAX_FILES = 5;

// cookies
export const COOKIE_THEME = 'daisy_theme'

// List of all available daisyUI themes
export const DAISY_THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
  "synthwave", "retro", "cyberpunk", "valentine", "halloween",
  "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe",
  "black", "luxury", "dracula", "cmyk", "autumn", "business",
  "acid", "lemonade", "night", "coffee", "winter", "dim", "nord",
  "sunset",
];
