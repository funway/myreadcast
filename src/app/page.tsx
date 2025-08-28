import TestUI from "@/ui/test/TestUI";
import Link from "next/link";

export default async function HomePage() {
  return (
    <>
      <main>
        <div className="hero bg-base-200 min-h-screen">
          
          {/* 内容容器，实现垂直和水平居中 */}
          <div className="hero-content text-center">
            
            {/* 限制最大宽度，确保在大屏幕上阅读体验良好 */}
            <div className="max-w-lg">
              
              <h1 className="text-5xl font-bold">My Readcast</h1>
              
              <p className="py-6 text-xl text-base-content/70">一个沉静的空间，献给阅读与聆听的你。</p>
              
              {/* 按钮组 */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link className="btn btn-primary btn-wide" href={'/user/login'}>Login</Link>
                
                <a href="https://github.com/funway/myreadcast" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.5-.5 1.2-.5 2V22"></path>
                  </svg>
                  GitHub
                </a>
              </div>
              
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
