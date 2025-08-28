'use client';

import Link from 'next/link';
import ThemeSelector from '@/ui/ThemeSelector';
import AvatarDropdown from './user/AvatarDropdown';
import { useClientStatesStore } from '@/ui/contexts/StoreContext';
import MyIcon from './MyIcon';

const NavBar = () => {
  const sessionUser = useClientStatesStore(state => state.sessionUser);
  console.log('[NavBar] sessionUser:', sessionUser);
  const isAdmin = sessionUser?.role === 'admin';

  return (
    <div className="navbar bg-base-100 px-8 shadow-sm">
      {/* Left side */}
      <div className="navbar-start gap-1">
        <Link className="btn btn-ghost text-xl" href='/'>
          <img src="/logo.svg" alt="Logo" className='w-10' />
          My Readcast
        </Link>
        
        {/* 书库下拉菜单 */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn">Library</div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-1 mt-1 w-52 p-2 shadow">
            <li><a>Item 1</a></li>
            <li><a>Item 2</a></li>
          </ul>
        </div>
        
        {/* upload button */}
        <div className="btn btn-ghost btn-square tooltip tooltip-bottom" data-tip="Upload">
          <MyIcon iconName="upload" className="w-3/4 h-3/4"/>
        </div>
      </div>

      <div className="navbar-center gap-1">
        {/* 搜索栏 */}
        <input name="search" type="text" placeholder="Search" className="input input-bordered md:w-auto" />
      </div>

      {/* Right side */}
      <div className="navbar-end gap-1">
        {isAdmin && (
          <Link href="/admin" className="btn btn-ghost btn-square tooltip tooltip-bottom" data-tip="Setting">
            <MyIcon iconName='setting' className="w-3/4 h-3/4" />
          </Link>
        )}
        
        <ThemeSelector />

        <AvatarDropdown />
      </div>
    </div>
  );
};

export default NavBar;