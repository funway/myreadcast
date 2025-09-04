'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { APP_VERSION } from '@/lib/shared/constants'
import MyIcon from '@/ui/MyIcon'

export default function LibrarySideBar() {
  const pathname = usePathname();  // 获取当前路径，用于高亮
  const params = useParams();
  const libraryId = params.libraryId as string; // 这里拿到 [libraryId] 的值
  console.log('libraryId:', libraryId);

  const menuItems = [
    { 
      label: 'Library', 
      href: `/library/${libraryId}`, 
      icon: <MyIcon iconName="libraryBuilding" /> 
    },
    { 
      label: 'Books', 
      href: `/library/${libraryId}/books`, 
      icon: <MyIcon iconName="library" /> 
    },
    { 
      label: 'Authors', 
      href: `/library/${libraryId}/authors`, 
      icon: <MyIcon iconName="author" /> 
    },
  ]

  return (
    <div className="w-full h-full flex flex-col">
      {/* 菜单部分 */}
      <ul className="menu w-full flex-1 gap-4">
        {menuItems.map(item => {
          
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link 
                href={item.href}
                // 如果是激活状态，添加 active 类
                className={`flex flex-col w-full py-4 ${isActive ? 'menu-active' : ''}`}
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