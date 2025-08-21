import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_EXPIRES_IN } from '@/lib/shared/constants';
import { AccessTokenPayload, SessionUser } from './types';

/**
 * 生成 JWT Token
 * 
 * @param payload - JWT 的负载对象，包含自定义字段。
 *                  注意：不需要手动添加 `iat` (issued at) 和 `exp` (expiration) 字段，
 *                  它们会由 `jsonwebtoken.sign()` 根据 `expiresIn` 自动生成。
 * @param expiresIn - token 有效期，单位秒或字符串，如 '1h', '7d'。
 * @param secret - 用于签名的密钥字符串。
 * @returns 生成的 JWT 字符串。
 */
export function generateJWT(payload: object, expiresIn: number, secret: string): string {
  // jsonwebtoken.sign() 方法会自动添加 iat 字段和 exp 字段 (根据 expiresIn 参数)
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * 验证 JWT Token
 * 
 * 只校验 签名 与 过期时间
 */
export function verifyJWT<T>(token: string, secret: string): T | null {
  try {
    const decoded = jwt.verify(token, secret) as T;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * 设置会话 cookies
 * @param cookieStore - 必须是可写的 cookies 实例。
 *                      `ResponseCookies` 或是
 *                       在 Server Actions 或 Route Handlers 中获取的 `ReadonlyRequestCookies`
 * @param accessToken - 用户的访问令牌
 * @param [refreshToken] - (可选) 用户的刷新令牌
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setSessionCookies(cookieStore: any, accessToken: string, refreshToken?: string): void {
  // 设置 Access Token Cookie
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_EXPIRES_IN,
  });

  // 设置 Refresh Token Cookie（如果提供）
  if (refreshToken) {
    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRES_IN,
    });
  }
}

/**
 * 清除会话 cookies
 * @param cookieStore 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clearSessionCookies(cookieStore: any): void {
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * 从 JWT 中直接解析并返回用户信息，不进行验证
 * 
 * @param token Access Token
 * @returns 
 */
export function getUserFromJWT(token: string): SessionUser | null {
  try {
    const decoded = jwt.decode(token) as AccessTokenPayload | null;
    if (!decoded) {
      return null;
    }
    const { exp, iat, ...sessionUser } = decoded;
    return sessionUser;
  } catch {
    return null;
  }
}