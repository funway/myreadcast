/**
 * 可以在 Edge runtime 和 客户端安全运行
 * 通过 API 调用服务端认证方法
 */
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

import { AccessTokenPayload, SessionUser } from '@/lib/auth/types';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/shared/constants';
import { verifyJWT } from '@/lib/auth/common';

// The AUTH_SECRET should not be exposed to the Edge Runtime in production.
// Since this is just a personal project, it's fine 🙂. 
const AUTH_SECRET = (process.env.AUTH_SECRET ?? '').trim();

/**
 * 使用 Accesss Token JWT 中验证当前用户
 * 
 * `edgeAuthAccessToken` is Edge safe
 * @returns SessionUser 或 null
 */
export async function edgeAuthAccessToken(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    console.log('<edgeAuthAccessToken> Access token:', accessToken);

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
  }
  catch (error) {
    console.error('Auth error:', error);
    return null;
  }
  
  return null;
}

export type EdgeAuthResult = {
  sessionUser: SessionUser | null;
  newAccessToken: string | null;
};

export async function edgeAuthRefreshToken(request: NextRequest): Promise<EdgeAuthResult> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  console.log('<edgeAuthRefreshToken>', refreshToken);
  
  if (!refreshToken) {
    return { sessionUser: null, newAccessToken: null };
  }

  const resp = await fetch(`${request.nextUrl.origin}/api/auth/refresh`, {
    method: 'GET',
    headers: {
      'Cookie': `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
    },
    cache: 'no-store',
  });

  const data = await resp.json();
  console.log('<edgeAuthRefreshToken> GET result:', resp.status, data);

  if (!resp.ok) {
    return { sessionUser: null, newAccessToken: null };
  }

  return { sessionUser: data.user, newAccessToken: data.access_token };
}

export async function edgeAuth(request: NextRequest): Promise<EdgeAuthResult> {
  const sessionUser = await edgeAuthAccessToken();

  if (sessionUser) {
    return { sessionUser: sessionUser, newAccessToken: null };
  } else {
    return edgeAuthRefreshToken(request);
  }
}