'use client';
/**
 * 使用 StoreInitializer 组件相比于 StatesStoreProvider 组件来说
 * 
 */
import { SessionUser } from "@/lib/auth/types";
import { useClientStatesStore } from "@/lib/client/store-hook";
import { useEffect } from "react";

interface StoreInitializerProps { 
  sessionUser: SessionUser | null;
}

export default function StoreInitializer({ sessionUser }: StoreInitializerProps) { 
  console.log('[StoreInitializer] sessionUser:', sessionUser);

  // 从 ClientStates 对象中取出 setSessionUser 函数
  const setSessionUser = useClientStatesStore(state => state.setSessionUser);

  // 通过 useEffect 来调用 状态修改函数
  useEffect(() => { 
    console.log('[StoreInitializer] calls useEffect: 执行 ClientStates 的赋值操作', sessionUser);
    setSessionUser(sessionUser);
  }, [sessionUser]); 
  
  return null;  // 这个组件不渲染任何 HTML 内容
}