'use client';

import { useState } from 'react';
import type { User } from '@/lib/server/db/user'; 
import { createUserAction, updateUserAction } from '@/lib/server/actions/user'; 
import MyIcon, { IconName } from '@/ui/MyIcon';
import { toast } from 'react-toastify';

type UserRole = 'user' | 'admin';

type UserEditProps = {
  user?: User;
  className?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function UserEdit({ user, className, onSuccess, onCancel }: UserEditProps) {
  // 组件状态
  const [role, setRole] = useState<UserRole>((user?.role as UserRole) || 'user');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(!user); // 新建用户时默认显示，编辑用户时默认隐藏
  const [isPending, setIsPending] = useState(false);

  const roleOptions = [
    { value: 'user', label: 'User', icon: 'user' },
    { value: 'admin', label: 'Admin', icon: 'admin' },
  ];

  const handleSave = async () => {
    setIsPending(true);
    
    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('role', role);
      if (password.trim()) {
        formData.append('password', password);
      }

      let result;
      if (user) {
        formData.append('id', user.id);
        // 更新现有用户
        result = await updateUserAction(formData);
      } else {
        // 创建新用户
        result = await createUserAction(formData);
      }

      if (result.success) {
        console.log("[UserEdit] 创建/更新 用户成功");
        onSuccess?.();
      } else {
        toast.error(result.message);
        // 这里可以添加错误提示逻辑
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={`bg-base-100 border-base-300 p-6 space-y-6 ${className}`}>
      {/* 第一行 - Role 和 Username */}
      <div className="flex gap-4">
        {/* Role 下拉框 */}
        <div className="form-control">
          <label className="block text-sm font-medium text-base-content mb-2">
            Role
          </label>
          <div className="dropdown dropdown-bottom min-w-32">
            <div 
              tabIndex={0} 
              role="button" 
              className="btn w-full justify-between bg-base-100 min-w-32"
            >
              <span className="flex items-center gap-2">
                <MyIcon iconName={role === 'admin' ? 'admin' : 'user'} />
                {role === 'admin' ? 'Admin' : 'User'}
              </span>
              <MyIcon iconName="chevronDown" className="w-4 h-4" />
            </div>
            <ul 
              tabIndex={0} 
              className="dropdown-content menu bg-base-100 z-[1] w-full p-2 shadow-lg"
            >
              {roleOptions.map((option) => (
                <li key={option.value}>
                  <a
                    className={`flex items-center gap-2 ${role === option.value ? 'active' : ''}`}
                    onClick={() => setRole(option.value as UserRole)}
                  >
                    <MyIcon iconName={option.icon as IconName} />
                    {option.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Username */}
        <div className="flex-1 form-control">
          <label className="block text-sm font-medium text-base-content mb-2">
            Username
          </label>
          <input
            name="username"
            type="text" 
            className="input input-bordered w-full bg-base-100" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>
      </div>

      {/* 第二行 - Password */}
      <div className="form-control">
        {showPasswordField ? (
          <>
            <label className="block text-sm font-medium text-base-content mb-2">
              Password
            </label>
            <div className="flex gap-2">
              <input
                name="password"
                type="password" 
                className="input input-bordered flex-1 bg-base-100" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={user ? "Enter new password" : "Enter password"}
              />
              {user && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowPasswordField(false);
                    setPassword('');
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-base-content mb-2">
              Password
            </label>
            <button
              type="button"
              className="btn btn-outline btn-primary w-full"
              onClick={() => setShowPasswordField(true)}
            >
              <MyIcon iconName="key" />
              Change Password
            </button>
          </>
        )}
      </div>

      {/* 第三行 Save Button - 右下角 */}
      <div className="divider" />
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button 
            className="btn"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </button>
        )}
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isPending || !username.trim() || (!user && !password.trim())}
        >
          {isPending ? (user ? 'Saving...' : 'Creating...') : (user ? 'Save' : 'Create')}
        </button>
      </div>
    </div>
  );
}