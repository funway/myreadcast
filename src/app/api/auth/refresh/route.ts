/**
 * 通过 refresh_token 申请新的 access_token
 */
import { clearSessionCookies, generateJWT, setSessionCookies } from "@/lib/auth/common";
import { authToken } from "@/lib/auth/server-auth";
import { AUTH_SECRET } from "@/lib/server/constants";
import { logger } from "@/lib/server/logger";
import { ACCESS_TOKEN_EXPIRES_IN } from "@/lib/shared/constants";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  logger.debug('请求刷新 access_token', cookieStore.getAll());

  const sessionUser = await authToken();
  if (!sessionUser) { 
    // const response = NextResponse.json(
    //   { error: 'Refresh token invalid' },
    //   { status: 401 },
    // );
    // const cookieStore = response.cookies;
    // clearSessionCookies(cookieStore);
    // return response;
    clearSessionCookies(cookieStore);
    return NextResponse.json(
      { error: 'Refresh token invalid' },
      { status: 401 },
    );
  }

  const accessToken = generateJWT(sessionUser, ACCESS_TOKEN_EXPIRES_IN, AUTH_SECRET);
  setSessionCookies(cookieStore, accessToken);
  return NextResponse.json(
    {
      user: sessionUser, 
      access_token: accessToken,
    },
  );
}