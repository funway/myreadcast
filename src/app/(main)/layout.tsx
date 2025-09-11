import { logger } from "@/lib/server/logger";
import LibrarySideBar from "@/ui/library/LibrarySideBar";
import NavBar from "@/ui/NavBar";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  logger.debug('[MainLayout] SSR 渲染');
  
  // return root layout template
  return (
    <div className="flex flex-col h-screen bg-base-200">
      {/* 顶部导航 */}
      <header className="w-full z-[10]">
        <NavBar />
      </header>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 左侧侧边栏 */}
        <aside className="flex-none bg-base-100 w-24">
          <LibrarySideBar />
        </aside>

        {/* 内容区域 */}
        <main className="overflow-y-auto w-full">
          {children}
        </main>

      </div>
    </div>
  );
}
