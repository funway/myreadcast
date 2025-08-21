import "./globals.css";
import type { Metadata } from "next";
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, THEME_COOKIE } from "@/lib/shared/constants";
import { ThemeProvider } from "@/ui/contexts/ThemeContext";
import NavBar from "@/ui/NavBar";
import { getUserFromJWT } from "@/lib/auth/common";
import { logger } from "@/lib/server/logger";
import StoreInitializer from "@/ui/StoreInitializer";

export const metadata: Metadata = {
  title: "My Readcast",
  description: "Read and Listen to Your EPUBs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  logger.debug('SSR 渲染 RootLayout');
  
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value || 'light';
  const sessionUser = getUserFromJWT(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || '');
  logger.debug('获取当前用户', sessionUser);
  
  // return root layout template
  return (
    <html lang="en" data-theme={theme}>
      <body>
        <StoreInitializer sessionUser={ sessionUser } />
        <ThemeProvider initialTheme={theme}>
          <NavBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
