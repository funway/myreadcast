'use client';

import React, { useActionState, useEffect } from 'react';
import { signInAction } from '@/lib/server/actions/user';
import MyIcon from '@/ui/MyIcon';
import { ActionResult } from '@/lib/shared/types';
import { LOGIN_REDIRECT } from '@/lib/shared/constants';

export default function LoginForm({ caption = "Login", className = "space-y-6" }) {
  console.log('[LoginForm] Rendered');
  // 使用 useActionState 来管理表单状态
  // 它接受两个必填参数 [action, initialState]
  //  - action 指向要执行的服务端函数, 我们这里是 authenticatie()
  //  - initialState 是初始状态值。这个值将在第一次渲染时被用作返回的 state 值 (在这里即初始错误信息，我们不需要，所以定义为 undefined)
  // 它返回 [state, dispatch, isPending]
  //  - state: 当前的状态值，这里是 errorMessage
  //  - dispatch: 传递给 <form> action 属性的函数, 我们命名为 formAction
  //  - isPending: 一个布尔值，表示表单是否正在提交
  const [actionResult, formAction, isPending] = useActionState(
    async (_prevState: ActionResult | undefined, formData: FormData) => {
          return await signInAction(formData, LOGIN_REDIRECT);
        },
    undefined,
  );

  useEffect(() => {
    // 如果 action 成功，直接返回 redirect, 就不会进入这个钩子了
    console.log('[LoginForm] Action Result:', actionResult);
    if (actionResult?.success) {
    }
  }, [actionResult]);

  return (
    <form className={className} action={formAction}>
      <h2 className="text-2xl font-bold text-center">
        {caption}
      </h2>
      {/* Username Input */}
      <div className="form-control">
        <label className="label mb-1" htmlFor="username">
          <span className="label-text">Username</span>
        </label>
        <div className="flex w-full items-center border input input-bordered">
          <input
            className="peer order-2 flex-1 text-sm placeholder:text-gray-300 outline-none"
            type="text"
            id="username"
            name="username"
            placeholder="Enter your username"
            required
          />
          <MyIcon iconName="user" className="order-1 h-[18px] w-[18px] text-base-content/40 peer-focus:text-base-content/80" />
        </div>
      </div>

      {/* Password Input */}
      <div className="form-control">
        <label className="label mb-1" htmlFor="password">
          <span className="label-text">Password</span>
        </label>
        <div className="flex w-full items-center border input input-bordered">
          <input
            className="peer order-2 flex-1 text-sm placeholder:text-gray-300 outline-none"
            id="password"
            type="password"
            name="password"
            placeholder="Enter password"
            required
            minLength={4}
          />
          <MyIcon iconName="key" className="order-1 h-[18px] w-[18px] text-base-content/40 peer-focus:text-base-content/80" />
        </div>
      </div>

      {/* Error Message */}
      {actionResult && (
        <div role="alert" className="alert alert-error w-full text-sm p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{actionResult.message}</span>
        </div>
      )}

      {/* Login Button */}
      <div className="form-control mt-6">
        <button
          className="btn btn-primary w-full rounded-lg"
          type="submit"
          disabled={isPending}
        >
          {isPending && <span className="loading loading-spinner"></span>}
          Log in
          {!isPending && <MyIcon iconName="arrowRight" className="w-5 h-5" />}
        </button>
      </div>
    </form>
  );
}
