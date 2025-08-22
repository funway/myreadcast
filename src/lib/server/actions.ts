'use server';

import { z } from 'zod'; 
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signIn } from '@/lib/auth/server-auth';
import { generateJWT, setSessionCookies, clearSessionCookies } from '@/lib/auth/common';
import { ACCESS_TOKEN_EXPIRES_IN, AUTH_SECRET, REFRESH_TOKEN_EXPIRES_IN } from '@/lib/server/constants';
import { logger } from '@/lib/server/logger';

// 定义登录表单的数据结构和验证规则
const LoginFormSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(4, { message: 'Password must be at least 4 characters.' }),
});

export async function signInAction(
  prevState: string | undefined,
  formData: FormData,
) {
  logger.debug('用户登录验证');

  const validationResult = LoginFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  // 验证用户输入
  if (!validationResult.success) {
    logger.debug(`验证失败: ${validationResult.error.message}`);
    return z.prettifyError(validationResult.error);
  }

  // 尝试登录
  const { username, password } = validationResult.data;
  const loginResult = await signIn(username, password);
  
  // 判断登录结果
  if (!loginResult) {
    return 'Invalid username or password.';
  } else {
    const accessToken = await generateJWT(loginResult.user, ACCESS_TOKEN_EXPIRES_IN, AUTH_SECRET);
    const refreshToken = await generateJWT({ id: loginResult.user.id, token: loginResult.token }, REFRESH_TOKEN_EXPIRES_IN, AUTH_SECRET);
    const cookieStore = await cookies();
    setSessionCookies(cookieStore, accessToken, refreshToken);
    redirect('/');
  }
}

export async function signOutAction(redirectTo: string) {
  logger.debug('用户退出');
  const cookieStore = await cookies();
  clearSessionCookies(cookieStore);
  redirect(redirectTo);
}

