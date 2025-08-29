/**
 * Next.js middleware sucks 👎
 * NextAuth sucks 👎
 * Why do they make simple things so complicated!
 */
import { NextResponse, NextRequest } from 'next/server'
import { edgeAuth } from '@/lib/auth/edge-auth';
import { CookieJar } from '@/lib/server/cookie-jar';
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_EXPIRES_IN, LOGIN_REDIRECT, REFRESH_TOKEN_COOKIE } from '@/lib/shared/constants';

// 这个配置指定中间件函数应该在哪些路径上被执行
// https://nextjs.org/docs/app/api-reference/file-conventions/middleware#matcher
export const config = {
  matcher: [
    '/',
    '/test',
    '/init',
    '/api/:path*',
    '/admin/:path*',
    '/user/:path*',
    '/library/:path*',
  ],
};

/**
 * 判断是否是 允许公开服务的路径 (无需用户登录)
 * @param pathname 
 * @returns 
 */
function isPublicPath(pathname: string): boolean {
  // 允许匿名访问的 URL 路径
  // 只支持 完全匹配 与 * 号的前缀匹配
  const publicPaths = ['/', '/api/auth*'];

  return publicPaths.some((publicPath) => { 
    if (publicPath.endsWith('*')) { 
      const base = publicPath.slice(0, -1);
      return pathname.startsWith(base);
    }
    return pathname === publicPath;
  });
}

/**
 * 判断是否是 保护访问的路径 (需 admin 权限)
 * @param pathname 
 * @returns 
 */
function isProtectedPath(pathname: string): boolean {
  // 允许匿名访问的 URL 路径
  // 只支持 完全匹配 与 * 号的前缀匹配
  const protectedPaths = ['/admin*', '/api/server*'];

  return protectedPaths.some((protectedPath) => { 
    if (protectedPath.endsWith('*')) { 
      const base = protectedPath.slice(0, -1);
      return pathname.startsWith(base);
    }
    return pathname === protectedPath;
  });
}

/**
 * 判断是否是 登录、注册或者初始化页面 (已登录用户不允许访问)
 * @param pathname 
 * @returns 
 */
function isLoginOrRegisterPath(pathname: string): boolean {
  const lrPaths = ['/user/login', '/user/register', '/init'];
  return lrPaths.includes(pathname);
}

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;  // 获取 req.nextUrl, 一个 NextURL 对象
  console.log('🤖 <middleware> capture:', request.method, nextUrl.href);
  
  let response: NextResponse | null = null;
  const cookieJar = new CookieJar();

  // - 限流检查 (预留)
  // console.log('<middleware> throttling...');

  // - 如果是访问公开路径, 直接返回
  if (isPublicPath(nextUrl.pathname)) { 
    console.log('<middleware> Access public path >> Allowed');
    return NextResponse.next();
  }
  console.log('<middleware> not public path');

  // - 获取当前用户
  const { sessionUser, newAccessToken } = await edgeAuth(request);
  console.log('<middleware> Get user from edgeAuth:', { user: sessionUser?.username });
  const isLoggedIn = !!sessionUser;
  if (newAccessToken) { 
    // 如果需要刷新 Access Token
    console.log('<middleware> refresh Access Token');

    cookieJar.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRES_IN,
    });
  }
  if (!isLoggedIn) {
    // 如果未登录, 确保清除 session cookie
    cookieJar.delete(ACCESS_TOKEN_COOKIE);
    cookieJar.delete(REFRESH_TOKEN_COOKIE);
  }

  // - 如果访问的是 登录、注册或初始化 页面
  if (isLoginOrRegisterPath(nextUrl.pathname)) {
    if (isLoggedIn) {
      console.log(`<middleware> Access ${nextUrl.pathname}, with authenticated status >> Redirect to ${LOGIN_REDIRECT}`);
      response = NextResponse.redirect(new URL(LOGIN_REDIRECT, request.url));
    } else { 
      console.log(`<middleware> Access ${nextUrl.pathname}, with unauthenticated status >> Allowed`);
      response = NextResponse.next();
    }
  }

  // - 用户登录检查 (未登录的跳转到登录页面)
  if (!response && !isLoggedIn) { 
    console.log('<middleware> Unauthenticated >> Redirect to login page.');
    response = NextResponse.redirect(new URL('/user/login', request.url));
  }

  // - 用户权限检查 (无权限的用户跳转到 404)
  if (!response && isProtectedPath(nextUrl.pathname)) {
    console.log('<middleware> try to access Protected Path. Check user role...');
    if (sessionUser?.role !== 'admin') { 
      console.log('<middleware> Unauthorized access to protected path >> Redirect to /not-found');
      response = NextResponse.rewrite(new URL('/not-found', request.url));
    }
  }
  
  if (!response) {
    response = NextResponse.next();
  }
  cookieJar.apply(response);  // 添加 cookies
  return response;  // 返回 HTTP 响应
}
