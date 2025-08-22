import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_EXPIRES_IN } from '@/lib/shared/constants';
import { AccessTokenPayload, SessionUser } from '@/lib/auth/types';
import { cookies } from 'next/headers';

/**
 * 生成 JWT Token
 *
 * @param payload - JWT 的负载对象，包含自定义字段。
 * 注意：不需要手动添加 `iat` (issued at) 和 `exp` (expiration) 字段，
 * 它们会由 jose 的 SignJWT 根据 `setExpirationTime()` 自动生成。
 * @param expiresIn - token 有效期，单位秒或字符串，如 '1h', '7d'。
 * @param secret - 用于签名的密钥字符串。
 * @returns 生成的 JWT 字符串。
 */
export async function generateJWT(payload: Record<string, unknown>, expiresIn: number | string, secret: string): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  
  // 将过期时间转换为 jose 可接受的格式
  const expirationTime = typeof expiresIn === 'number' ? 
    Math.floor(Date.now() / 1000) + expiresIn : 
    expiresIn;
  
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secretKey);
    
  return jwt;
}

/**
 * 验证 JWT Token
 * 
 * 只校验 签名 与 过期时间
 */
export async function verifyJWT<T>(token: string, secret: string): Promise<T | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as T;
  } catch (error) {
    console.log('Failed to verify JWT:', error);
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
    const decoded = decodeJwt(token) as AccessTokenPayload | null;
    if (!decoded) {
      return null;
    }
    const { exp, iat, ...sessionUser } = decoded;
    return sessionUser;
  } catch {
    return null;
  }
}