'use server';

import { z } from 'zod'; 
import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';

// 定义登录表单的数据结构和验证规则
const LoginFormSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(4, { message: 'Password must be at least 4 characters.' }),
});

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const result = LoginFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!result.success) {
    return z.prettifyError(result.error)
  }

  const { username, password } = result.data;
  const sessionUser = await signIn(username, password);
  if (!sessionUser) {
    return 'Invalid username or password.';
  } else {
    redirect('/');
  }
}

// ////////////////////////////////

// import { signIn } from '@/auth';
// import { z } from 'zod'; 

// // 定义登录表单的数据结构和验证规则
// const LoginFormSchema = z.object({
//   username: z.string().min(1, { message: 'Username is required.' }),
//   password: z.string().min(4, { message: 'Password must be at least 4 characters.' }),
// });

// export async function authenticate(
//   prevState: string | undefined,
//   formData: FormData,
// ) {
//   const result = LoginFormSchema.safeParse(
//     Object.fromEntries(formData.entries()),
//   );
//   if (!result.success) {
//     return z.prettifyError(result.error)
//   }
  
//   const { username, password } = result.data;
//   await signIn('credentials', { username, password});

// }