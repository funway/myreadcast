/**
 * 供客户端组件全局共享的状态集合
 */
import { create } from 'zustand';
import { SessionUser } from '@/lib/auth/types';

/**
 * 客户端共享状态的类型 (包括 状态值的类型 以及 状态修改函数的类型)
 * 
 * - 可以把多种状态 `state` 放在这个 States 中一起声明
 * - 也可以给一个 状态(`state`) 声明多种 状态修改函数(`setState`, `increaseState`, `clearState` 等)
 */
interface ClientStates { 
  sessionUser: SessionUser | null;
  setSessionUser: (user: SessionUser | null) => void;

  // 还可以增加其他 状态 与 状态修改函数
  // 以 count 为例子
  count: number; 
  setCount: (newCount: number) => void;
  increaseCount: () => void;
}

/**
 * 通过 zustand 的 `create` 函数返回一个 React Hook
 * 
 * `create` 的实参是一个函数 `fun(set) => ({ })`
 * - 这个函数的输入是 zustand 传递的 `set()` 函数，用来给状态赋值
 * - 然后这个函数返回值是一个对象, 这个对象实现了我们的 ClientStates 接口
 *   - 在这个对象定义里，才是我们状态设置函数 setXXX 的实体，通过调用 `set()` 函数来实现对状态的修改
 */
export const useClientStatesStore = create<ClientStates>((set) => { 
  console.log('<useClientStatesStore> 初始化 ClientStates 全局对象');

  // 返回一个 ClientStates 对象
  return {
    sessionUser: null,
    setSessionUser: (user) => set({ sessionUser: user }),
    
    // 可以扩展其他 状态 与 状态修改函数
    count: 0,
    setCount: (newCount) => set({ count: newCount }),
    increaseCount: () => { 
      console.log('<increaseCount> ClientStates.count +1');
      set((state) => ({ count: state.count + 1 }));
    },
  }
});