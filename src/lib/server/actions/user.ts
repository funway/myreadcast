'use server';
import { z } from 'zod'; 
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signIn } from '@/lib/auth/server-auth';
import { generateJWT, setSessionCookies, clearSessionCookies } from '@/lib/auth/common';
import { ACCESS_TOKEN_EXPIRES_IN, AUTH_SECRET, LOGIN_REDIRECT, LOGOUT_REDIRECT, PASSWORD_BCRYPT_SALT_ROUNDS, REFRESH_TOKEN_EXPIRES_IN } from '@/lib/server/constants';
import { logger } from '@/lib/server/logger';
import { createUser } from '@/lib/server/db/user';

// 定义登录表单的数据结构和验证规则
const LoginFormSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(4, { message: 'Password must be at least 4 characters.' }),
});

export async function signInAction(
  _prevState: string | undefined,
  formData: FormData,
) {
  const data = Object.fromEntries(formData.entries());
  logger.debug('用户登录验证', data);

  const validationResult = LoginFormSchema.safeParse(data);
  // 验证用户输入
  if (!validationResult.success) {
    logger.debug(`验证失败: ${validationResult.error.message}`);
    return z.prettifyError(validationResult.error);
  }

  // 尝试登录
  const { username, password } = validationResult.data;
  const cookieStore = await cookies();
  try {
    const sessionUser = await signIn(username, password, cookieStore);
    if (!sessionUser) {
      return 'Invalid username or password.';
    }
  } catch (error) {
    logger.error('Fail to signIn a user', error);
    return String(error);
  }
  // Do not put `redirect()` function inside of a try/catch code
  redirect(LOGIN_REDIRECT);
}

/**
 * Signs out the current user by clearing session cookies and redirecting to the specified URL.
 *
 * @param redirectTo - The URL to redirect to after signing out. Defaults to `LOGOUT_REDIRECT`.
 * @returns A promise that resolves after the sign-out process is complete.
 */
export async function signOutAction(redirectTo: string = LOGOUT_REDIRECT) {
  logger.debug('用户退出');
  const cookieStore = await cookies();
  clearSessionCookies(cookieStore);
  redirect(redirectTo);
}

const CreateUserSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(4, { message: 'Password must be at least 4 characters.' }),
  role: z.enum(['admin', 'user'], { message: 'Invalid role. Please select either admin or user.' }),
});

export async function createAction(
  _prevState: { success: boolean; message: string; } | undefined,
  formData: FormData,
): Promise<{ success: boolean; message: string; }> {
  const data = Object.fromEntries(formData.entries());
  const validationResult = CreateUserSchema.safeParse(data);
  if (!validationResult.success) { 
    return {
      success: false,
      message: z.prettifyError(validationResult.error),
    };
  }

  const { username, password, role } = validationResult.data;
  try {
    // 创建新用户
    await createUser({
      username: username,
      plainPassword: password,
      role: role,
    });

    // 登录新用户
    const cookieStore = await cookies();
    const sessionUser = await signIn(username, password, cookieStore);
    
    logger.debug('Create a new user and sign in', sessionUser);
  } catch (error) {
    logger.error('Fail to create user', error)
    return {
      success: false,
      message: String(error),
    };
  }
  return { success: true, message: 'User created' };
;}