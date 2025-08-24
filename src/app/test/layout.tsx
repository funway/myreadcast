import type { Metadata } from "next";
import { logger } from "@/lib/server/logger";
import NavBar from "@/ui/NavBar";

export const metadata: Metadata = {
  title: "My Readcast | Test",
  description: "Read and Listen to Your EPUBs",
};

export default async function TestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  logger.debug('[TestLayout] SSR 渲染');
  
  // return root layout template
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
