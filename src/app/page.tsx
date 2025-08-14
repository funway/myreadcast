'use client';

import { useState } from 'react';

export default function HomePage() {
  const themes = ['light', 'dark', 'cupcake', 'bumblebee'];
  const [theme, setTheme] = useState('light');

  const handleChangeTheme = (nextTheme: string) => {
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-4xl font-bold">Welcome to My Readcast</h1>
      <p className="text-lg">This is a demo homepage showing daisyUI themes.</p>

      {/* 主题切换按钮 */}
      <div className="space-x-2">
        {themes.map((t) => (
          <button
            key={t}
            className="btn btn-outline btn-primary"
            onClick={() => handleChangeTheme(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 演示组件 */}
      <div className="mt-6 space-y-4">
        <button className="btn btn-primary">Primary Button</button>
        <button className="btn btn-secondary">Secondary Button</button>
        <div className="card w-96 bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Card Title</h2>
            <p>This is a sample card to show theme effect.</p>
            <div className="card-actions justify-end">
              <button className="btn btn-accent">Action</button>
              <button className="btn btn-primary">One</button>
              <button className="btn btn-secondary">Two</button>
              <button className="btn btn-accent btn-outline">Three</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
