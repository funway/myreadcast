/**
 * 可以在 Edge runtime 和 客户端安全运行
 * 通过 API 调用服务端认证方法
 */
import { cookies } from 'next/headers';

import { AccessTokenPayload, SessionUser } from '@/lib/auth/types';
import { ACCESS_TOKEN_COOKIE } from '@/lib/shared/constants';
import { verifyJWT } from '@/lib/auth/common';

// The AUTH_SECRET should not be exposed to the Edge Runtime in production.
// Since this is just a personal project, it's fine 🙂. 
const AUTH_SECRET = (process.env.AUTH_SECRET ?? '').trim();

/**
 * 1. authByAccessToken() -> SessionUser | null
 * 2. authByRefreshToken() -> SessionUser | null
 */

/**
 * 获取当前认证用户
 * 
 * `edgeAuth` is Edge safe
 * @returns SessionUser 或 null
 */
export async function edgeAuth(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    // 1. 无 Access Token, 直接返回 null
    if (!accessToken) {
      return null;
    }

    // 2. 验证 Access Token
    const payload = verifyJWT<AccessTokenPayload>(accessToken, AUTH_SECRET);
    
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
    // const sessionUser = authToken();
    // if (!sessionUser) {
    //   clearAuthCookies();
    //   return null;
    // }
    // const newAccessToken = generateJWT(sessionUser, ACCESS_TOKEN_EXPIRES_IN);
    
    // // 5. 更新客户端 Access Token Cookie 并返回 SessionUser 对象
    // setAuthCookies(newAccessToken);
    // return sessionUser;
  }
  catch (error) {
    console.error('Auth error:', error);
    return null;
  }
  
  return null;
}