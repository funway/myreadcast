import { clearSessionCookies } from "@/lib/auth/common";
import { logger } from "@/lib/server/logger";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  logger.debug('用户退出', cookieStore.getAll());

  clearSessionCookies(cookieStore);
  return NextResponse.json({ ok: true });  // API 不做重定向，只做数据更新。重定向由客户端自己完成
}