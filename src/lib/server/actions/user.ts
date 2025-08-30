'use server';
import { z } from 'zod'; 
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signIn } from '@/lib/auth/server-auth';
import { clearSessionCookies } from '@/lib/auth/common';
import { LOGOUT_REDIRECT } from '@/lib/server/constants';
import { logger } from '@/lib/server/logger';
import { createUser, deleteUser, updateUser } from '@/lib/server/db/user';
import { ActionResult } from '@/lib/shared/types';

// 定义登录表单的数据结构和验证规则
const LoginFormSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(4, { message: 'Password must be at least 4 characters.' }),
});

export async function signInAction(
  formData: FormData,
  redirectTo?: string,
): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  logger.debug('用户登录验证', data);

  const validationResult = LoginFormSchema.safeParse(data);
  // 验证用户输入
  if (!validationResult.success) {
    logger.debug(`验证失败: ${validationResult.error.message}`);
    return {
      success: false,
      message: z.prettifyError(validationResult.error),
    };
  }

  // 尝试登录
  const { username, password } = validationResult.data;
  const cookieStore = await cookies();
  try {
    const sessionUser = await signIn(username, password, cookieStore);
    if (!sessionUser) {
      return {
        success: false,
        message: 'Invalid username or password.',
      };
    }
  } catch (error) {
    logger.error('Fail to signIn a user', error);
    return {
      success: false,
      message: String(error),
    };
  }
  
  // Do not put `redirect()` function inside of a try/catch code
  if (redirectTo) {
    redirect(redirectTo);
  }
  return {success: true, message: 'User logined'}
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

export async function createUserAction(
  formData: FormData,
  redirectTo?: string,
): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  logger.debug('Create a new user', data);
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
    const user = await createUser({
      username: username,
      plainPassword: password,
      role: role,
    });
  } catch (error) {
    logger.error('Fail to create user', error)
    return {
      success: false,
      message: String(error),
    };
  }
  if (redirectTo) {
    redirect(redirectTo);
  }

  return { success: true, message: 'User created' };
}

const UpdateUserSchema = z.object({
  id: z.string().min(1, { message: 'User ID is required.' }),
  username: z.string().min(1, { message: 'Username is required.' }).optional(),
  password: z.string().min(4, { message: 'Password must be at least 4 characters.' }).optional(),
  role: z.enum(['admin', 'user'], { message: 'Invalid role.' }).optional(),
});

export async function updateUserAction(
  formData: FormData,
  redirectTo?: string,
): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries());
  logger.debug('Update user', data);
  const validationResult = UpdateUserSchema.safeParse(data);
  if (!validationResult.success) {
    const msg = z.prettifyError(validationResult.error);
    logger.debug('Input validation failed', { msg });
    return {
      success: false,
      message: msg,
    };
  }

  const { id, username, password, role } = validationResult.data;
  try {
    await updateUser({
      id: id,
      username: username,
      password: password,
      role: role,
    });
  } catch (error) {
    logger.error('Fail to update user', error);
    return {
      success: false,
      message: String(error),
    };
  }
  if (redirectTo) {
    redirect(redirectTo);
  }
  return { success: true, message: 'User updated' };
}

export async function deleteUserAction(
  formData: FormData,
  redirectTo?: string,
): Promise<ActionResult> {
  const id = formData.get('id');
  if (!id || typeof id !== 'string') {
    return {
      success: false,
      message: 'User ID is required.',
    };
  }

  try {
    await deleteUser(id);
    logger.debug('Delete user', { id });
  } catch (error) {
    logger.error('Fail to delete user', error);
    return {
      success: false,
      message: String(error),
    };
  }
  if (redirectTo) {
    redirect(redirectTo);
  }
  return { success: true, message: 'User deleted' };
}
