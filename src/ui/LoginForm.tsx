'use client';

import React, { useActionState } from 'react';
import { signInAction } from '@/lib/server/actions';
import { UserIcon, KeyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function LoginForm() {
  // 使用 useActionState 来管理表单状态
  // 它接受两个必填参数 [action, initialState]
  //  - action 指向要执行的服务端函数, 我们这里是 authenticatie()
  //  - initialState 是初始状态值。这个值将在第一次渲染时被用作返回的 state 值 (在这里即初始错误信息，我们不需要，所以定义为 undefined)
  // 它返回 [state, dispatch, isPending]
  //  - state: 当前的状态值，这里是 errorMessage
  //  - dispatch: 传递给 <form> action 属性的函数, 我们命名为 formAction
  //  - isPending: 一个布尔值，表示表单是否正在提交
  const [errorMessage, formAction, isPending] = useActionState(
    signInAction,
    undefined,
  );

  return (
    // 使用 padding 和 max-width 来控制表单大小和布局
    <div className="w-full max-w-md p-8 space-y-6 bg-base-200 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center">
        Please log in to continue.
      </h2>
      <form className="space-y-6" action={formAction}>
        
        {/* Username Input */}
        <div className="form-control">
          <label className="label" htmlFor="username">
            <span className="label-text">Username</span>
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              required
            />
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-base-content/40 peer-focus:text-base-content/80" />
          </div>
        </div>

        {/* Password Input */}
        <div className="form-control">
          <label className="label" htmlFor="password">
            <span className="label-text">Password</span>
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
              id="password"
              type="password"
              name="password"
              placeholder="Enter password"
              required
              minLength={4}
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-base-content/40 peer-focus:text-base-content/80" />
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div role="alert" className="alert alert-error text-sm p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Button */}
        <div className="form-control mt-6">
          <button className="btn btn-primary w-full rounded-lg" type="submit" disabled={isPending}>
            {isPending && <span className="loading loading-spinner"></span>}
            Log in
            {!isPending && <ArrowRightIcon className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
