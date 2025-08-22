import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

import { logger } from '@/lib/server/logger';
import { generateRandomToken } from '@/lib/server/helpers';
import { db, initializeDatabase } from "@/lib/server/db/init";
import { UserTable } from "@/lib/server/db/schema";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, AUTH_SECRET } from '@/lib/server/constants';
import { AccessTokenPayload, RefreshTokenPayload, SessionUser, AuthError } from '@/lib/auth/types';
import { verifyJWT } from '@/lib/auth/common';

/**
 * 用户登录
 * @param username - 用户名
 * @param password - 密码
 * @returns SessionUser 或 null
 */
export async function signIn(username: string, password: string): Promise< { user: SessionUser; token: string } | null> {
  logger.debug('用户登录', {name: username, password: '***'});

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
  
  return { user: sessionUser, token: user.token };
}

/**
 * 获取当前认证用户
 * 
 * `auth` is not Edge safe. 
 * Use `edgeAuth` if u need to run in Edge runtime.
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
    const payload = await verifyJWT<AccessTokenPayload>(accessToken, AUTH_SECRET);
    
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
      return null;
    }
    
    return sessionUser;
  }
  catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * 验证 Refresh Token
 * 
 * `authToken` is not Edge safe
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
    const refreshPayload = await verifyJWT<RefreshTokenPayload>(refreshToken, AUTH_SECRET);
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
  } catch (error) {
    if (error instanceof AuthError) {
      logger.debug('Refresh Token 认证错误', {
        name: error.name,
        msg: error.message
      });
    } else {
      logger.error('Refresh Token 认证错误 (未知错误)', error);
    }
    return null;
  }
}
