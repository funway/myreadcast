'use client';

import Link from 'next/link';
import ThemeSelector from '@/ui/ThemeSelector';
import AvatarDropdown from './user/AvatarDropdown';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useClientStatesStore } from '@/lib/client/store';

const NavBar = () => {
  const sessionUser = useClientStatesStore(state => state.sessionUser);
  console.log('[NavBar] sessionUser:', sessionUser);
  const isAdmin = sessionUser?.role === 'admin';

  return (
    <div className="navbar bg-base-100 px-8 shadow-sm">
      {/* Left side */}
      <div className="navbar-start">
        <Link className="btn btn-ghost m-1 text-xl" href='/'>
          <img src="/logo.svg" alt="Logo" className='w-10' />
          My Readcast
        </Link>
        
        {/* 书库下拉菜单 */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn m-1">Library</div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-1 mt-1 w-52 p-2 shadow">
            <li><a>Item 1</a></li>
            <li><a>Item 2</a></li>
          </ul>
        </div>

        <div className="btn m-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
      </div>

      <div className="navbar-center">
        {/* 搜索栏 */}
        <input name="search" type="text" placeholder="Search" className="input input-bordered md:w-auto" />
      </div>

      {/* Right side */}
      <div className="navbar-end">
        <ThemeSelector />
        {isAdmin && (
          <Link href="/admin" className="btn btn-ghost btn-circle">
            <Cog6ToothIcon className="h-6 w-6" />
          </Link>
        )}
        <AvatarDropdown />
      </div>
    </div>
  );
};

export default NavBar;