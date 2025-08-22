'use client';

import Link from 'next/link';
import { UserIcon } from '@heroicons/react/24/solid';
import { useClientStatesStore } from '@/lib/client/store';
import LogoutButton from '@/ui/LogoutBtn';

const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/adventurer/svg?seed=default';

const AvatarDropdown = () => {
  console.log('[AvatarDropdown]');
  const sessionUser = useClientStatesStore(state => state.sessionUser);
  const isLoggedIn = !!sessionUser;
  // 获取头像URL
  const getAvatarUrl = () => {
    if (!isLoggedIn) return null;
    
    // 如果用户有自定义头像，使用用户头像
    if (sessionUser.image) {
      return sessionUser.image;
    }
    
    // 否则使用 DiceBear 基于用户名生成头像
    return `https://api.dicebear.com/9.x/initials/svg?seed=${sessionUser.username || sessionUser.id}&backgroundColor=3b82f6&textColor=ffffff`;
  };
  const avatarSrc = getAvatarUrl();

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className={`btn btn-ghost btn-circle avatar ${!isLoggedIn ? 'btn-disabled' : ''}`}>
        <div className="w-10 rounded-full">
          {avatarSrc ? (
            <img alt="User Avatar" src={avatarSrc} />
          ) : (
            <UserIcon className="w-10 h-10" />
          )}
        </div>
      </div>
      
      {/* 下拉菜单 */}
      { 
        avatarSrc ? (
          <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-[1] mt-1 w-52 p-2 shadow">
            <li className="menu-title text-xs">
              {isLoggedIn ? sessionUser.username : 'Guest'}
            </li>

            <li>
              <Link className="justify-between" href={'#'}>
                Profile
                <span className="badge">New</span>
              </Link>
            </li>

            <li>
              <Link href={'/user/setting'}>
                Setting
              </Link>
            </li>

            <li>
              <LogoutButton />
            </li>
          </ul>
        ) : null
      }
    </div>
  );
};

export default AvatarDropdown;