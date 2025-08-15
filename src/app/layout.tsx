import type { Metadata } from "next";
import { cookies } from 'next/headers';
import { COOKIE_THEME } from "@/lib/constants";
import ThemeSelector from "@/ui/ThemeSelector"; 

import "./globals.css";

export const metadata: Metadata = {
  title: "My Readcast",
  description: "Read and Listen to Your EPUBs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get(COOKIE_THEME)?.value || 'light';
  
  return (
    <html lang="en" data-theme={theme}>
      <body>
        <div className="absolute top-4 right-4 z-50">
          <ThemeSelector initialTheme={theme} />
        </div>

        {children}
      </body>
    </html>
  );
}
