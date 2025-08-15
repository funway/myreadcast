'use client';

import React, { useState } from 'react';
import { UserIcon, KeyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- 在这里添加您的登录逻辑 ---
    // 模拟一个网络请求
    setTimeout(() => {
      console.log('Logging in with:', { username, password });
      if (username === 'admin' && password === 'password') {
        console.log('Login successful!');
        // 在真实应用中，这里会进行页面跳转
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 1000);
    // --- 登录逻辑结束 ---
  };

  return (
    // 使用 padding 和 max-width 来控制表单大小和布局
    <div className="w-full max-w-md p-8 space-y-6 bg-base-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center">
        Please log in to continue.
      </h2>
      <form className="space-y-6" onSubmit={handleLogin}>
        
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              minLength={6}
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-base-content/40 peer-focus:text-base-content/80" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="alert alert-error text-sm p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Button */}
        <div className="form-control mt-6">
          <button className="btn btn-primary w-full rounded-lg" type="submit" disabled={loading}>
            {loading && <span className="loading loading-spinner"></span>}
            Log in
            {!loading && <ArrowRightIcon className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
