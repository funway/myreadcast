/**
 * Next.js middleware sucks 👎
 * NextAuth sucks 👎
 * Why do they make simple things so complicated!
 */
import { NextResponse, NextRequest } from 'next/server'
import { edgeAuth } from '@/lib/auth/edge-auth';
import { CookieJar } from '@/lib/server/cookie-jar';
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_COOKIE } from '@/lib/shared/constants';

// 这个配置指定中间件函数应该在哪些路径上被执行
// https://nextjs.org/docs/app/api-reference/file-conventions/middleware#matcher
export const config = {
  matcher: [
    '/',
    '/test',
    '/user/:path*', 
    '/admin/:path*',
    '/api/:path*',
  ],
};

// 允许匿名访问的 URL 路径
// 只支持 完全匹配 与 * 号的前缀匹配
const publicPaths = ['/', '/user/login', '/user/register', '/api/auth*'];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((publicPath) => { 
    if (publicPath.endsWith('*')) { 
      const base = publicPath.slice(0, -1);
      return pathname.startsWith(base);
    }
    return pathname === publicPath;
  });
}

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;  // 获取 req.nextUrl, 一个 NextURL 对象
  console.log('🤖 <middleware> capture:', request.method, nextUrl.href,
    'isPublicPath?', isPublicPath(nextUrl.pathname));
  
  // 如果是访问公开路径, 直接返回
  if (isPublicPath(nextUrl.pathname)) { 
    return NextResponse.next();
  }

  let response: NextResponse | null = null;
  const cookieJar = new CookieJar();

  // - 限流检查 (预留)
  // ...

  // - 获取当前用户
  const { sessionUser, newAccessToken } = await edgeAuth(request);
  console.log('<middleware> Get user from edgeAuth:', sessionUser);
  const isLoggedIn = !!sessionUser;
  // 如果需要刷新 Access Token
  if (newAccessToken) { 
    cookieJar.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  // - 用户登录检查
  if (!response && !isLoggedIn) { 
    console.log('<middleware> Unauthenticated user');
    // cookieJar.delete(ACCESS_TOKEN_COOKIE);
    // cookieJar.delete(REFRESH_TOKEN_COOKIE);
    response = NextResponse.redirect(new URL('/user/login', request.url));
  }

  // - 用户权限检查 (user.role == admin 的才有权限访问 /admin 下面的页面, 否则返回 404)
  if (!response && nextUrl.pathname.startsWith('/admin')) {
    cookieJar.set('test_cookie', 'you_have_no_permission');
    response = NextResponse.rewrite(new URL('/not-found', request.url));
  }
  
  if (!response) {
    response = NextResponse.next();
  }
  cookieJar.apply(response);  // 添加 cookies
  return response;  // 返回 HTTP 响应
}
