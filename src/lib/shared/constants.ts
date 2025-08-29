export const APP_NAME = 'MyReadcast';
export const APP_VERSION = '0.1.1';

// access token 有效期，单位为秒 (例如：30分钟)
export const ACCESS_TOKEN_EXPIRES_IN = 5 * 60;
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

export const LOGIN_REDIRECT = '/test';
export const LOGOUT_REDIRECT = '/user/login';