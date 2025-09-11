'use client';

import { DAISY_THEMES } from "@/lib/shared/constants";
import { useTheme } from '@/ui/contexts/ThemeContext';

// This component renders the small 2x2 color grid for the theme preview
const ThemePreview = ({ theme }: { theme: string }) => (
  <div data-theme={theme} className="bg-base-100 group-hover:border-base-content/30 border-base-content/20 grid shrink-0 grid-cols-2 gap-0.5 rounded-md border p-1 transition-colors">
    <div className="bg-base-content size-2 rounded-full"></div>
    <div className="bg-primary size-2 rounded-full"></div>
    <div className="bg-secondary size-2 rounded-full"></div>
    <div className="bg-accent size-2 rounded-full"></div>
  </div>
);

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  console.log('[ThemeSelector] useTheme:', theme);
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  return (
    <div title="Change Theme" className="dropdown dropdown-end">
      {/* Dropdown Trigger Button */}
      <div tabIndex={0} role="button" className="btn btn-ghost btn-square group gap-1.5 px-1.5" aria-label="Change Theme">
        <ThemePreview theme={theme} />
      </div>
      
      {/* Dropdown Content */}
      <div tabIndex={0} className="dropdown-content bg-base-200 text-base-content rounded-box h-[30.5rem] max-h-[calc(100vh-8.6rem)] overflow-y-auto mt-1 shadow-2xl">
        <ul className="menu w-56">
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
