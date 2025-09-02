'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/server/db/user';
import { deleteUserAction } from '@/lib/server/actions/user';
import MyIcon, { IconName } from '../MyIcon';
import UserEdit from './UserEdit';
import { useRouter } from 'next/navigation';

interface UsersPanelProps {
  initUsers: User[];
  className?: string;
}

export default function UsersPanel({ initUsers, className }: UsersPanelProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 每当 props 变化时，要同步更新 state!!! 
  // 否则即使父组件传递了新的 initUsers 进来, 由于它的 state[users] 这个状态量不会自动变化，所以就不会自动更新。
  useEffect(() => {
    console.log("[UsersPanel] calls useEffect. users count:", initUsers.length);
    setUsers(initUsers);
  }, [initUsers]);

  // Reset edit states
  const handleClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    console.log('[UsersPanel] 创建/更新 用户成功');
    setIsModalOpen(false);
    setEditingUser(null);
    router.refresh();
  }

  const handleDelete = async (id: string) => {
    const formData = new FormData();
    formData.append('id', id);

    const result = await deleteUserAction(formData);
    if (!result.success) {
      alert(result.message);
      return;
    }
    setDeleteConfirmId(null);
    // Remove user from local state
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 items-center">
          <h1 className="text-3xl font-bold text-primary">Users</h1>
          <div className="badge badge-sm badge-secondary">{users.length}</div>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <MyIcon iconName="userPlus" />
          Add User
        </button>
      </div>

      {/* Users List */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="flex items-center gap-2">
                  <MyIcon iconName={ user.role as IconName} className="w-4 h-4" />
                  {user.username}
                </td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                    {user.role}
                  </span>
                </td>
                <td className='font-mono'>{user.createdAt.toLocaleString()}</td>
                <td className="flex gap-2">
                  <button
                    className="btn btn-ghost btn-square btn-sm"
                    onClick={() => {
                      setEditingUser(user);
                      setIsModalOpen(true);
                    }}
                  >
                    <MyIcon iconName="edit" className="w-4 h-4" />
                  </button>
                  <button
                    className="btn btn-ghost btn-square btn-sm text-error"
                    onClick={() => setDeleteConfirmId(user.id)}
                  >
                    <MyIcon iconName="trash" className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={handleClose}
              >
                <MyIcon iconName="x" className="w-4 h-4" />
              </button>
            </div>

            <UserEdit
              user={editingUser || undefined}
              onCancel={handleClose}
              // onSuccess={(updatedUser) => {
              //   if (editingUser) {
              //     // Update existing user
              //     setUsers(users.map(u =>
              //       u.id === updatedUser.id ? updatedUser : u
              //     ));
              //   } else {
              //     // Add new user
              //     setUsers([...users, updatedUser]);
              //   }
              //   handleClose();
              // }}
              onSuccess={handleSuccess}
            />
          </div>
          {/* <div className="modal-backdrop" onClick={handleClose}></div> */}
        </dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <div className="flex flex-col gap-2 py-4">
              <p>Are you sure you want to delete this user?</p>
              <span className="badge badge-soft badge-secondary">
                {users.find(u => u.id === deleteConfirmId)?.username}
              </span>
            </div>
            <div className="modal-action">
              <button 
                className="btn btn-error"
                onClick={() => { handleDelete(deleteConfirmId) }}
              >
                Delete
              </button>
              <button 
                className="btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
          {/* <div className="modal-backdrop" onClick={() => setDeleteConfirmId(null)}></div> */}
        </dialog>
      )}
    </div>
  );
}
