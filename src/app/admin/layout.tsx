import { ReactNode } from 'react'
import NavBar from '@/ui/NavBar'
import AdminSideBar from '@/ui/admin/AdminSideBar'

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
        <aside className="flex-none bg-base-100 w-1/8 py-4">
          <AdminSideBar />
        </aside>

        {/* 内容区域 */}
        <main className="flex-1 p-8 flex justify-center items-start">
          <div className="bg-base-100 shadow-md rounded-lg p-8 min-w-2/3 min-h-2/3">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}