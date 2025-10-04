// 会话用户信息 (非敏感信息)
export type SessionUser = {
  id: string;
  username: string;
  role: string;
  image?: string | null;
  // [key: string]: unknown;
}

// Access Token Payload 
export type AccessTokenPayload = SessionUser & {
  exp: number;  // expire at
  iat: number;  // issued at
}

// Refresh Token Payload
export type RefreshTokenPayload = {
  id: string;
  token: string;
  exp: number;
  iat: number;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

type CookieOptions = {
  path?: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export interface WritableCookies {
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string): void;
}
