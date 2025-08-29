'use client';

import Link from 'next/link';
import ThemeSelector from '@/ui/ThemeSelector';
import AvatarDropdown from './user/AvatarDropdown';
import { useClientStatesStore } from '@/ui/contexts/StoreContext';
import MyIcon from './MyIcon';
import LibrarySelector from './LibrarySelector';

const NavBar = () => {
  const sessionUser = useClientStatesStore(state => state.sessionUser);
  const isAdmin = sessionUser?.role === 'admin';
  console.log('[NavBar] sessionUser:', sessionUser?.username, sessionUser?.role);

  return (
    <div className="navbar bg-base-100 px-8 shadow-sm">
      {/* Left side */}
      <div className="navbar-start gap-1">
        <Link className="btn btn-ghost text-xl" href='/'>
          <img src="/logo.svg" alt="Logo" className='w-10' />
          My Readcast
        </Link>
        
        {/* 书库下拉菜单 */}
        <LibrarySelector />
      </div>

      <div className="navbar-center gap-1">
        {/* 搜索栏 */}
        <input name="search" type="text" placeholder="Search" className="input input-bordered md:w-auto" />
      </div>

      {/* Right side */}
      <div className="navbar-end gap-1">
        {/* upload button */}
        <div className="btn btn-ghost btn-square tooltip tooltip-bottom" data-tip="Upload">
          <MyIcon iconName="upload" />
        </div>
        {/* Admin setting button */}
        {isAdmin && (
          <Link href="/admin" className="btn btn-ghost btn-square tooltip tooltip-bottom" data-tip="Setting">
            <MyIcon iconName='setting' />
          </Link>
        )}
        
        <ThemeSelector />

        <AvatarDropdown />
      </div>
    </div>
  );
};

export default NavBar;