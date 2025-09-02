import "./globals.css";
import type { Metadata } from "next";
import { cookies } from 'next/headers';
import { THEME_COOKIE } from "@/lib/shared/constants";
import { ThemeProvider } from "@/ui/contexts/ThemeContext";
import { logger } from "@/lib/server/logger";
import DevButton from "@/ui/test/DevBtn";
import { StatesStoreProvider } from "@/ui/contexts/StoreContext";
import { getLibrariesData } from "@/lib/server/actions/library";
import { auth } from "@/lib/auth/server-auth";
import { ToastContainer } from 'react-toastify';

export const metadata: Metadata = {
  title: "My Readcast",
  description: "Read and Listen to Your EPUBs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  logger.debug('[RootLayout] SSR 渲染');
  
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value || 'light';
  const sessionUser = await auth();
  logger.debug('[RootLayout] 获取当前用户', { sessionUser });
  const libraries = sessionUser ? await getLibrariesData() : [];
  
  const initStates = {
    sessionUser: sessionUser,
    libraries: libraries,
    count: sessionUser ? 1 : 0
  };

  return (
    <html lang="en" data-theme={theme}>
      <body>
        <StatesStoreProvider initStates={initStates}>
          <ThemeProvider initialTheme={theme}>
            
            {children}

            <ToastContainer position="bottom-right" />
            
            <DevButton />

          </ThemeProvider>
        </StatesStoreProvider>
      </body>
    </html>
  );
}
