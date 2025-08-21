'use client';
/**
 * ThemeContext 实现:
 *  - 服务端组件读取 cookie, 返回 THEME_COOKIE 的初始值
 *  - 用 React Context 包装, 所有子组件共享
 * 
 * 但是其实 theme 根本用不着这么复杂，因为:
 *  - THEME_COOKIE 本来就是 http-only=false 的本地 cookie，服务端根本不用处理
 *  - 而且一般就一个 ThemeSelector 组件会用到这个 cookie, 所以不需要共享
 *  - 那么它完全可以在 ThemeSelector 组件中，直接用 js-cookie 读写
 */
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { THEME_COOKIE } from '@/lib/shared/constants';

// 1. 定义 Context 的数据类型
interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

// 2. 使用 React.createContext() 创建一个 React Context 类型的实例 themeContext
// 并且通过泛型 T 声明这个 Context 的 .Provider.value 属性是 ThemeContextType 类型的
// 所以此时，themeContext 是一个 Context 类型实例, 它包含两个重要属性 .Provider 与 .Consumer
const themeContext = createContext<ThemeContextType | undefined>(undefined);

// 3. 定义并导出 ThemeProvider 客户端组件
export const ThemeProvider = ({ initialTheme, children }: { initialTheme: string; children: ReactNode }) => {
  // a. 获取组件级别的 状态实例(theme) 与 设置函数(setTheme)
  const [theme, setTheme] = useState(initialTheme);

  // 当状态实例(theme)改变时，更新 HTML 的 data-theme 属性并保存到 cookie
  useEffect(() => {
    console.log('[ThemeProvider] calls useEffect: theme =', theme);
    document.documentElement.setAttribute('data-theme', theme);  // set <html> attr
    Cookies.set(THEME_COOKIE, theme, { expires: 365, path: '/' });
  }, [theme]);

  // b. 将步骤 a 获得的 {React 状态实例与设置函数} 赋值给 value
  const value = { theme, setTheme };

  // c. 将步骤 b 获得的 value 作为 themeContext.Provider.value 属性的值 
  // 这样，所有被其包裹的 children 组件都可以通过 useContext(themeContext) 获得这个 value 对象 {theme, setTheme}
  return (
    <themeContext.Provider value={value}>
      {children}
    </themeContext.Provider>
  );
};

// 4. 定义并导出 Hook，方便在客户端组件中使用 ThemeContext
export const useTheme = () => {
  const context = useContext(themeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};