'use client';

import { signOutAction } from "@/lib/server/actions/user";
import { LOGOUT_REDIRECT } from "@/lib/shared/constants";
import { useRouter } from "next/navigation";

const LogoutButton = () => { 
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      router.push(LOGOUT_REDIRECT);  // push 会向目标路径发起一个 GET 请求: /path?_rsc=xxx, 按需渲染 (如果目标路径与当前路径的 layout 一样，就不会重新渲染 layout)
      router.refresh();  // refresh 会向当前路径发送一个 GET 请求: /path?_rsc=root, 强制全部重新渲染

      // window.location.href = '/';  // 使用原始的 js 控制浏览器做重定向
      /**
       * 虽然 push + refresh 需要两次 GET 请求才能实现跟 window.location.href 一样的效果
       * 但是由于 React 的按需渲染, 
       * - 它们两次请求的 总数据量 跟一次 window.location 重定向是几乎一样的
       * - 而且在客户端渲染的 总时间 比一次 window.location 重定向还快
       */
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    // 方式1, 请求 API
    <button className="w-full text-left" onClick={ handleLogout }>
      Logout
    </button>
    
    // 方式2, 请求 Server Action
    // <button className="w-full text-left" onClick={() => signOutAction(LOGOUT_REDIRECT)}>
    //   Logout
    // </button>
  );
}

export const LogoutForm = () => { 
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" className="w-full text-left cursor-pointer">
        Logout
      </button>
    </form>
  );
}

export default LogoutButton;