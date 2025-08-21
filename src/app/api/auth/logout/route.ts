import { clearSessionCookies } from "@/lib/auth/common";
import { logger } from "@/lib/server/logger";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST() {
  const cookieStore = await cookies();
  logger.debug('用户退出', cookieStore.getAll());

  clearSessionCookies(cookieStore);
  redirect('/');
}