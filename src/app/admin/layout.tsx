import { ReactNode } from 'react'
import NavBar from '@/ui/NavBar'
import SideBar from '@/ui/admin/SideBar'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      {/* 顶部导航 */}
      <header className="w-full z-[10]">
        <NavBar />
      </header>

      {/* 主体区域 */}
      <div className="flex-1 flex">
        
        {/* 左侧侧边栏 */}
        <aside className="flex-none bg-base-100 w-1/9 py-4">
          <SideBar />
        </aside>

        {/* 内容区域 */}
        <main className="flex-1 p-8">
          <div className="bg-base-100 shadow-md rounded-lg p-6 min-h-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}