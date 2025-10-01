'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { ClientStates, ClientStatesStore, createClientStatesStore } from '@/lib/client/store';
import { useStore } from 'zustand';

const StatesStoreContext = createContext<ReturnType<typeof createClientStatesStore> | null>(null);

interface StatesStoreProviderProps {
  children: ReactNode;
  initStates?: ClientStates;
}

export const StatesStoreProvider = ({children, initStates}: StatesStoreProviderProps) => { 
  console.log('[StatesStoreProvider] 创建 store');
  const store = createClientStatesStore(initStates);
  
  return (
    <StatesStoreContext.Provider value={store}>
      {children}
    </StatesStoreContext.Provider>
  );
}

/**
 * React Hook: 获取客户端共享状态 store
 *
 * - 通过 `StatesStoreProvider` 提供的 Context 获取 store 实例
 * - 并使用 `zustand` 的 `useStore` 进行状态订阅
 * - 支持选择性获取 store 中的部分状态或方法,
 * - 只会根据其监听的状态变化做出响应
 *
 * @param selector 可选的选择器函数，从 store 中选取特定状态或方法。
 *                 如果未传入，默认返回整个 store。
 * @example
 * // 取整个 store（状态 + 方法）
 * const store = useClientStatesStore();
 * store.count; // number
 * store.increaseCount(); // 调用方法
 *
 * @example
 * // 只取 count
 * const count = useClientStatesStore(s => s.count); // 类型推导为 number
 *
 * @example
 * // 只取 setSessionUser 方法
 * const setUser = useClientStatesStore(s => s.setSessionUser); // 类型推导为 (user: SessionUser | null) => void
 *
 * @example
 * // 默认返回整个 store（可选 selector）
 * const wholeStore = useClientStatesStore();
 *
 * @throws 当组件未被 `<StatesStoreProvider>` 包裹时抛出错误
 */
export function useClientStatesStore<T = ClientStatesStore>(
  selector?: (state: ClientStatesStore) => T
): T {
  const store = useContext(StatesStoreContext);
  if (!store) {
    throw new Error('useClientStatesStore must be used within a <StatesStoreProvider>');
  }

  // 如果没传 selector，默认返回整个 store
  return useStore(store, selector ?? ((s) => s as unknown as T));
}