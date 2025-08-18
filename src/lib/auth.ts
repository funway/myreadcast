'use server';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

import { logger } from '@/lib/logger';
import { db, initializeDatabase } from "@/lib/db/init";
import { UserTable } from "@/lib/db/schema";
import { generateRandomToken } from '@/lib/helpers';
import {
  AUTH_SECRET, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN
} from '@/lib/constants';

// 会话用户信息接口 (非敏感信息)
export interface SessionUser {
  id: string;
  username: string;
  role: string;
  image?: string | null;
}

// Access Token Payload 接口
interface AccessTokenPayload extends SessionUser {
  exp: number;  // expire at
  iat: number;  // issued at
}

// Refresh Token Payload 接口
interface RefreshTokenPayload {
  id: string;
  token: string;
  exp: number;
  iat: number;
}

/**
 * 生成 JWT Token
 */
function generateJWT(payload: object, expiresIn: number): string {
  // jsonwebtoken.sign() 方法会自动添加 iat 字段和 exp 字段 (根据 expiresIn 参数)
  return jwt.sign(payload, AUTH_SECRET, { expiresIn });
}

/**
 * 验证 JWT Token
 * 
 * 只校验 签名 与 过期时间
 */
function verifyJWT<T>(token: string): T | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as T;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 设置认证 Cookie
 */
async function setAuthCookies(accessToken: string, refreshToken?: string) {
  const cookieStore = await cookies();

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
 * 清除认证 Cookie
 */
async function clearAuthCookies() {
  const cookieStore = await cookies();
  
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * 用户登录
 * @param username - 用户名
 * @param password - 密码
 * @returns SessionUser 或 null
 */
export async function signIn(username: string, password: string): Promise<SessionUser | null> {
  logger.debug(`signIn: ${username}, ${password}`)

  // 1. 确保数据库已初始化
  await initializeDatabase();

  // 2. 检查 user 表是否为空
  const userCountResult = await db.select({ count: sql<number>`count(*)` }).from(UserTable);
  const userCount = userCountResult[0].count;
  let user;

  // 3. 如果 user 表为空，创建第一个用户作为 root
  if (userCount === 0) {
    console.log("No users found. Creating first user as root...");
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = generateRandomToken();
    const newUser = {
      id: createId(),
      username: username,
      password: hashedPassword,
      token: token,
      role: "root",
      image: null,
    }
    
    await db.insert(UserTable).values(newUser);
    logger.info("First user created:", newUser);
    user = newUser;
  }
  else { 
    // 4. 如果表不为空，执行正常的登录验证
    const existingUser = db.select().from(UserTable)
      .where(eq(UserTable.username, username))
      .get();

    if (!existingUser) {
      logger.debug("User not found:", {username});
      return null;  // 用户不存在
    }

    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatch) {
      logger.debug("Password mismatch for user:", {username});
      return null;  // 密码不匹配
    }
    user = existingUser;
  }

  const sessionUser: SessionUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    image: user.image,
  };
  
  // 生成 JWT tokens
  const accessToken = generateJWT(sessionUser, ACCESS_TOKEN_EXPIRES_IN);
  const refreshToken = generateJWT({ id: user.id, token: user.token }, REFRESH_TOKEN_EXPIRES_IN);
  setAuthCookies(accessToken, refreshToken);
  return sessionUser;
}

/**
 * 用户登出
 */
export async function signOut(): Promise<void> {
  logger.debug('用户登出', auth())
  clearAuthCookies();
}

/**
 * 获取当前认证用户
 * @returns SessionUser 或 null
 */
export async function auth(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    // 1. 无 Access Token, 直接返回 null
    if (!accessToken) {
      return null;
    }

    // 2. 验证 Access Token
    const payload = verifyJWT<AccessTokenPayload>(accessToken);
    
    // 3. Access Token 有效则返回用户信息
    if (payload) {
      return {
        id: payload.id,
        username: payload.username,
        role: payload.role,
        image: payload.image,
      } as SessionUser;
    }

    // 4. Access Token 无效, 尝试使用 Refresh Token 获取新的 Access Token
    const sessionUser = authToken();
    if (!sessionUser) {
      clearAuthCookies();
      return null;
    }
    const newAccessToken = generateJWT(sessionUser, ACCESS_TOKEN_EXPIRES_IN);
    
    // 5. 更新客户端 Access Token Cookie 并返回 SessionUser 对象
    setAuthCookies(newAccessToken);
    return sessionUser;
  }
  catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * 验证 Refresh Token
 * @returns SessionUser 或 null
 */
export async function authToken(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    
    // 1. Refresh Token 不存在或无效, 返回 null
    if (!refreshToken) {
      throw new AuthError('No Refresh Token');
    }
    const refreshPayload = verifyJWT<RefreshTokenPayload>(refreshToken);
    if (!refreshPayload) {
      throw new AuthError('Refresh Token verification failed');
    }

    // 2. 验证 Refresh Token 中的 token 与数据库是否一致
    const existingUser = db.select().from(UserTable)
      .where(eq(UserTable.id, refreshPayload.id))
      .get();
    if (!existingUser || existingUser.token !== refreshPayload.token) { 
      logger.info('用户 refresh_token 不匹配', existingUser);
      throw new AuthError('Refresh Token does not match stored token');
    }

    // 5. Refresh Token 验证通过，返回 SessionUser 实例
    const sessionUser: SessionUser = {
      id: existingUser.id,
      username: existingUser.username,
      role: existingUser.role,
      image: existingUser.image,
    };
    return sessionUser;
  }
  catch (error) {
    if (error instanceof AuthError) {
      logger.debug('Refresh Token 认证错误', error);
    } else {
      logger.error('Refresh Token 认证错误 (未知错误)', error);
    }
    clearAuthCookies();
    return null;
  }
}
