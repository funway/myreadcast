'use client';

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { COOKIE_THEME, DAISY_THEMES } from "@/lib/constants";

// This component renders the small 2x2 color grid for the theme preview
const ThemePreview = ({ theme }: { theme: string }) => (
  <div data-theme={theme} className="bg-base-100 grid shrink-0 grid-cols-2 gap-0.5 rounded-md border border-base-content/20 p-1">
    <div className="bg-base-content size-1 rounded-full"></div>
    <div className="bg-primary size-1 rounded-full"></div>
    <div className="bg-secondary size-1 rounded-full"></div>
    <div className="bg-accent size-1 rounded-full"></div>
  </div>
);

const ThemeSelector = ({ initialTheme }: { initialTheme: string }) => {
  const [theme, setTheme] = useState(initialTheme);

  // Apply theme to HTML tag and save to localStorage
  // Triggered by theme state change
  useEffect(() => {
    console.log('use effect:', theme)
    document.documentElement.setAttribute('data-theme', theme);  // set <html> attr
  }, [theme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    Cookies.set(COOKIE_THEME, newTheme, { expires: 365, path: '/' });
  };

  return (
    <div title="Change Theme" className="dropdown dropdown-end">
      {/* Dropdown Trigger Button */}
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1.5 px-1.5">
        <ThemePreview theme={theme} />
        <svg width="12px" height="12px" className="mt-px hidden size-2 fill-current opacity-60 sm:inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      
      {/* Dropdown Content */}
      <div tabIndex={0} className="dropdown-content bg-base-200 text-base-content rounded-box top-px h-[70vh] max-h-96 w-56 overflow-y-auto shadow-2xl mt-16 border border-white/5">
        <ul className="menu menu-sm p-2">
          <li className="menu-title text-xs">Theme</li>
          {DAISY_THEMES.map((themeName) => (
            <li key={themeName}>
              <button
                className={`gap-3 px-2 ${theme === themeName ? '[&_svg]:visible' : ''}`}
                onClick={() => handleThemeChange(themeName)}
              >
                <ThemePreview theme={themeName} />
                <span className="flex-grow truncate">{themeName.charAt(0).toUpperCase() + themeName.slice(1)}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="invisible h-3 w-3 shrink-0">
                  <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"></path>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ThemeSelector;
