import type { Metadata } from "next";
import { cookies } from 'next/headers';
import { COOKIE_THEME } from "@/lib/constants";

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
        {children}
      </body>
    </html>
  );
}
