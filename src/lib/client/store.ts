'use client';
/**
 * 供客户端组件全局共享的状态集合 (Vanilla Store 写法)
 */
import { createStore } from 'zustand';
import { SessionUser } from '@/lib/auth/types';
import type { Library } from '@/lib/server/db/library';

/**
 * 客户端共享状态的类型 (包括 状态值的类型 以及 状态修改函数的类型)
 * 
 * - 可以把多种状态 `state` 放在这个 States 中一起声明
 * - 也可以给一个 状态(`state`) 声明多种 状态修改函数(`setState`, `increaseState`, `clearState` 等)
 */
export type ClientStates = { 
  sessionUser: SessionUser | null;
  count: number; 
  libraries: Library[];
}

type ClientStatesActions = {
  setSessionUser: (user: SessionUser | null) => void;
  
  setCount: (newCount: number) => void;
  increaseCount: () => void;

  setLibraries: (libs: Library[]) => void;
}

export type ClientStatesStore = ClientStates & ClientStatesActions;

// 默认值
const defaultInitState: ClientStates = {
  sessionUser: null,
  libraries: [],
  count: 99,
}

// 创建 vanilla store 的工厂函数
export const createClientStatesStore = (
  initStates: ClientStates = defaultInitState,
) => {
  return createStore<ClientStatesStore>()((set) => {
    console.log('<createClientStatesStore → createStore> 初始化 ClientStatesStore 对象', initStates);
    return {
      ...initStates,
      
      setSessionUser: (user) => {
        console.log('<setSessionUser> 设置用户:', user);
        set({ sessionUser: user });
      },
      
      setCount: (newCount) => set({ count: newCount }),
      
      increaseCount: () => {
        console.log('<increaseCount> ClientStates.count +1');
        set((state) => ({ count: state.count + 1 }));
      },

      setLibraries: (libs) => {
        console.log('<setLibraries> 设置 libraries:', libs.length);
        set({ libraries: libs });
      },
    };
  })
}
