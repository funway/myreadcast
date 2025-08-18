/**
 * Next.js middleware sucks 👎
 * NextAuth sucks 👎
 */
 
import { NextResponse, NextRequest } from 'next/server'
import { redirect } from 'next/navigation';
// import NextAuth from 'next-auth';
// import { authConfig } from './auth.config'

// 这个配置指定中间件函数应该在哪些路径上被执行
export const config = {
  matcher: [
    '/',
    '/user/:path*', 
    '/admin/:path*',
  ],
};

// const { auth } = NextAuth(authConfig);

// export default async function middleware(req: NextRequest) {
//   const { nextUrl } = req;       // 获取 req.nextUrl, 一个 NextURL 对象
//   const sessionUser = await auth();  // 获取当前用户的会话信息
//   console.log('session user from auth:', sessionUser);
//   console.log('nextUrl:', nextUrl)
  
//   const isLoggedIn = !!sessionUser;
//   const isPublicRoute = nextUrl.pathname.startsWith('/user/login');
  
//   // 限流检查 (预留)
//   // ... 

//   // 用户登录检查
//   if (isPublicRoute) {
//     if (isLoggedIn) {
//       // 如果用户已登录，但试图访问登录页，则重定向到首页
//       return NextResponse.redirect(new URL('/', nextUrl));
//     }
//   } else if (!isLoggedIn) {
//     // 对于所有其他受保护的路由, 如果用户未登录，则重定向到登录页
//     return NextResponse.redirect(new URL('/user/login', nextUrl));
//   }

//   // // 用户权限检查 (user.role == admin 的才有权限访问 /admin 下面的页面, 否则返回 404)
//   if (nextUrl.pathname.startsWith('/admin')) {
//     // @ts-ignore - session.user is extended by callbacks
//     // const permissions = JSON.parse(session?.user?.permissions || '[]');
//     // if (!permissions.includes('root') && !permissions.includes('admin')) {
//     //   // 如果没有 'root' 或 'admin' 权限，则返回 404
//     //   return new NextResponse(null, { status: 404 });
//     // }
//     return new NextResponse(null, { status: 404 });
//   }
  
//   // 如果所有检查都通过，则继续处理请求
//   return NextResponse.next();
// }



export default async function middleware(req: NextRequest) { 
  const { nextUrl } = req;

  if (nextUrl.pathname.startsWith('/admin')) { 
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}