'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Cog6ToothIcon,
  BuildingLibraryIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { APP_NAME, APP_VERSION } from '@/lib/shared/constants'
import MyIcon from '../MyIcon'

export default function SideBar() {
  const pathname = usePathname() // 获取当前路径，用于高亮

  const menuItems = [
    { 
      label: 'System', 
      href: '/admin', 
      icon: <MyIcon iconName="setting" /> 
    },
    { 
      label: 'Libraries', 
      href: '/admin/libraries', 
      icon: <MyIcon iconName="libraryBuilding" /> 
    },
    { 
      label: 'Users', 
      href: '/admin/users', 
      icon: <MyIcon iconName="users" /> 
    },
  ]

  return (
    <div className="w-full h-full flex flex-col">
      {/* 菜单部分 */}
      <ul className="menu w-full flex-1 gap-4">
        {menuItems.map(item => {
          const isActive = item.href === '/admin' 
            ? pathname === item.href 
            : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link 
                href={item.href}
                // 如果是激活状态，添加 active 类
                className={`${isActive ? 'menu-active' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* 你可以在这里添加一些额外的内容，例如页脚 */}
      <div className="p-4 text-sm text-center text-base-content/50">
        v{APP_VERSION}
      </div>
    </div>
  )
}