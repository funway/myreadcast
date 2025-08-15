import { cookies } from 'next/headers';
import { COOKIE_THEME } from "@/lib/constants";
import ThemeSelector from "@/ui/ThemeSelector"; 

export default async function HomePage() {
  const cookieStore = await cookies();
  const theme = cookieStore.get(COOKIE_THEME)?.value || 'light';

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-4xl font-bold">Welcome to My Readcast</h1>
      <p className="text-lg">This is a demo homepage showing daisyUI themes.</p>

      {/* 1. 创建一个导航栏 */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">myreadcast</a>
        </div>
        <div className="flex-none">
          <ThemeSelector initialTheme={theme}/>
        </div>
      </div>

      {/* 演示组件 */}
      <div className="mt-6 space-y-4">
        <button className="btn btn-primary">Primary Button</button>
        <button className="btn btn-secondary">Secondary Button</button>
        <div className="card w-96 bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Card Title</h2>
            <p>This is a sample card to show theme effect.</p>
            <div className="card-actions justify-end">
              <button className="btn btn-accent">Action</button>
              <button className="btn btn-primary">One</button>
              <button className="btn btn-secondary">Two</button>
              <button className="btn btn-accent btn-outline">Three</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
