'use client';

import React, { act, useActionState, useEffect, useState } from 'react';
import { createAction } from '@/lib/server/actions/user';
import { UserIcon, KeyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from "next/navigation";

export function CreateRootForm({ caption = "Create Root User", className = "space-y-6" }) {
  const [actionResult, formAction, isPending] = useActionState(
    createAction,
    undefined,
  );
  const router = useRouter();

  useEffect(() => {
    if (actionResult?.success) {
      router.push('/test');
      // router.refresh();
    }
  }, [actionResult]);

  // 前端状态
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 校验结果
  const passwordsMatch = (password === confirmPassword);

  return (
    <form className={className} action={formAction}>
      <h2 className="text-2xl font-bold text-center">
        { caption }
      </h2>
      {/* Hidden field */}
      <input type="hidden" name="role" value="admin" />

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
            defaultValue = "root"
            required
          />
          <UserIcon className="order-1 h-[18px] w-[18px] text-base-content/40 peer-focus:text-base-content/80" />
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <KeyIcon className="order-1 h-[18px] w-[18px] text-base-content/40 peer-focus:text-base-content/80" />
        </div>
      </div>

      {/* Confirm Password Input */}
      <div className="form-control">
        <label className="label mb-1" htmlFor="confirmPassword">
          <span className="label-text">Confirm Password</span>
          {(confirmPassword && !passwordsMatch) && (
            <span className="label-text text-red-500">
              (not match)
            </span>
          )}
        </label>
        <div className="flex w-full items-center border input input-bordered">
          <input
            className="peer order-2 flex-1 text-sm placeholder:text-gray-300 outline-none"
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Re-enter password"
            required
            minLength={4}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <KeyIcon className="order-1 h-[18px] w-[18px] text-base-content/40 peer-focus:text-base-content/80" />
        </div>
      </div>

      {/* Error Message */}
      {(actionResult && !actionResult.success) && (
        <div role="alert" className="alert alert-error text-sm p-2">
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
          <span>{actionResult?.message}</span>
        </div>
      )}

      {/* Button */}
      <div className="form-control mt-6">
        <button
          className="btn btn-primary w-full rounded-lg"
          type="submit"
          disabled={isPending || !passwordsMatch}
        >
          {isPending && <span className="loading loading-spinner"></span>}
          Create
          {!isPending && <ArrowRightIcon className="w-5 h-5" />}
        </button>
      </div>
    </form>
  );
}
