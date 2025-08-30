import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

import { logger } from '@/lib/server/logger';
import {
  AUTH_SECRET,
  ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN
} from '@/lib/server/constants';
import { AccessTokenPayload, RefreshTokenPayload, SessionUser, AuthError, WritableCookies } from '@/lib/auth/types';
import { generateJWT, setSessionCookies, verifyJWT } from '@/lib/auth/common';
import { getUserById, getUserByUsername } from '../server/db/user';

export async function signIn(username: string, password: string, cookieStore: WritableCookies): Promise<SessionUser | null> { 
  logger.debug('用户登录:', { name: username, password: '***' });
  const existingUser = await getUserByUsername(username);
  if (!existingUser) {
    logger.debug("User not found:", {username});
    return null;  // 用户不存在
  }

  const passwordMatch = await bcrypt.compare(password, existingUser.password);
  if (!passwordMatch) {
    logger.debug("Password mismatch for user:", {username});
    return null;  // 密码不匹配
  }

  const sessionUser: SessionUser = {
    id: existingUser.id,
    username: existingUser.username,
    role: existingUser.role,
    image: existingUser.image,
  };
  logger.debug('Got user:', sessionUser);
  
  const accessToken = await generateJWT(sessionUser, ACCESS_TOKEN_EXPIRES_IN, AUTH_SECRET);
  const refreshToken = await generateJWT({ id: sessionUser.id, token: existingUser.token }, REFRESH_TOKEN_EXPIRES_IN, AUTH_SECRET);
  setSessionCookies(cookieStore, accessToken, refreshToken);
  
  return sessionUser;
}

/**
 * 获取当前认证用户
 * 
 * 如果 Access Token 无效，会自动校验 Refresh Token.  
 * 只负责返回用户，不负责写 Session Cookie
 * 
 * `auth` is not Edge safe.  
 * Use `edgeAuth` if u need to run in Edge runtime.
 * @returns SessionUser 或 null
 */
export async function auth(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    
    if (accessToken) { 
      // 1. 验证 Access Token
      const payload = await verifyJWT<AccessTokenPayload>(accessToken, AUTH_SECRET);
      // 2. Access Token 有效则返回用户信息
      if (payload) {
        const user = {
          id: payload.id,
          username: payload.username,
          role: payload.role,
          image: payload.image,
        } as SessionUser;
        
        logger.debug('Access Token authed:', user);
        return user;
      }
    }
    
    logger.debug('Access Token auth failed')

    // 3. Access Token 无效, 尝试从 Refresh Token 验证用户
    const user = await authToken();
    if (!user) {
      logger.debug('Refresh Token auth failed')
      return null;
    }
    
    logger.debug('Refresh Token authed:', user);
    return user;
  }
  catch (error) {
    logger.error('Auth error:', error);
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
    const existingUser = await getUserById(refreshPayload.id);
    if (!existingUser || existingUser.token !== refreshPayload.token) { 
      logger.info('用户 refresh_token 不匹配', existingUser);
      throw new AuthError('Refresh Token does not match stored token');
    }

    // 3. Refresh Token 验证通过，返回 SessionUser 实例
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
