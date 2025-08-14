import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Readcast",
  description: "Read and Listen to Your EPUBs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        {children}
      </body>
    </html>
  );
}
