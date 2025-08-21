/**
 * Next.js middleware sucks 👎
 * NextAuth sucks 👎
 */
import { NextResponse, NextRequest } from 'next/server'
import { edgeAuth } from '@/lib/auth/edge-auth';

// 这个配置指定中间件函数应该在哪些路径上被执行
export const config = {
  matcher: [
    '/',
    '/user/:path*', 
    '/admin/:path*',
  ],
};

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;       // 获取 req.nextUrl, 一个 NextURL 对象
  const sessionUser = await edgeAuth();  // 获取当前用户的会话信息
  console.log('Session user from auth:', sessionUser);
  // console.log('nextUrl:', nextUrl)
  
  // 限流检查 (预留)
  // ... 

  // 用户登录检查
  // if (isPublicRoute) {
  //   if (isLoggedIn) {
  //     // 如果用户已登录，但试图访问登录页，则重定向到首页
  //     return NextResponse.redirect(new URL('/', nextUrl));
  //   }
  // } else if (!isLoggedIn) {
  //   // 对于所有其他受保护的路由, 如果用户未登录，则重定向到登录页
  //   return NextResponse.redirect(new URL('/user/login', nextUrl));
  // }

  // // 用户权限检查 (user.role == admin 的才有权限访问 /admin 下面的页面, 否则返回 404)
  if (nextUrl.pathname.startsWith('/admin')) {
    const response = NextResponse.rewrite(new URL('/not-found', request.url));
    response.cookies.set('test_cookie', 'you_are_not_admin');
    return response;
  }
  
  // 如果所有检查都通过，则继续处理请求
  return NextResponse.next();
}



// export default async function middleware(req: NextRequest) { 
//   const { nextUrl } = req;
  
//   const response = NextResponse.next();
//   // 在响应对象上设置一个名为 'my-cookie' 的 Cookie
//   response.cookies.set('my-cookie', 'my-cookie-value');

//   if (nextUrl.pathname.startsWith('/admin')) { 
//     return new NextResponse(null, { status: 404 });
//   }

//   return response;
// }