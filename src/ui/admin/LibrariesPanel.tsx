'use client';

import { deleteLibraryAction } from "@/lib/server/actions/library";
import type { Library } from "@/lib/server/db/library";
import type { Task } from "@/lib/server/db/task";
import { useEffect, useState, useTransition } from 'react';
import MyIcon, { IconName } from "../MyIcon";
import LibraryEdit from "./LibraryEdit";
import { toast } from "react-toastify";

interface LibraryWithScan extends Library {
  scanStatus: 'idle' | 'scanning' | 'error';
}

interface Props {
  initLibraries: Library[];
  className?: string;
}

export default function LibrariesPanel({ initLibraries, className }: Props) { 
  console.log('[LibrariesPanel] initLibraries:', initLibraries.length);
  
  const [libraries, setLibraries] = useState<LibraryWithScan[]>(
    initLibraries.map(lib => ({ ...lib, scanStatus: 'idle' as const }))
  );
  useEffect(() => {
    console.log('[LibrariesPanel] calss useEffect: initLibraries changed.', initLibraries);
    setLibraries(initLibraries.map(lib => ({ ...lib, scanStatus: 'idle' as const })));
  }, [initLibraries]);
  
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<LibraryWithScan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteLibraryAction(id);
      if (result.success) {
        setDeleteConfirmId(null);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleScan = async (libraryId: string) => {
    // 1. 设置扫描状态
    setLibraries(libs => libs.map(lib => 
      lib.id === libraryId ? { ...lib, scanStatus: 'scanning' } : lib
    ));

    try {
      // 2. 调用扫描 API
      const response = await fetch(`/api/library/${libraryId}/scan`);
      const result = await response.json();
     
      if (!result.success) {
        throw new Error(result.message || 'Failed to start scan');
      }

      // 3. 更新 taskId 并开始轮询状态
      const task = result.data as Task;
      console.log(`Started scan task ${task.id} for library ${libraryId}`);
      
      // 4. 开始轮询任务状态
      await pollTaskStatus(libraryId, task.id);

    } catch (error) {
      toast.error(`Scan error: ${error}`);
      setLibraries(libs => libs.map(lib => 
        lib.id === libraryId ? { ...lib, scanStatus: 'error' } : lib
      ));
    }
  };

  const pollTaskStatus = async (libraryId: string, taskId: string) => {
    const poll = async () => {
      const currentLibrary = libraries.find(lib => lib.id === libraryId);
      try {
        const response = await fetch(`/api/task/${taskId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error('Failed to get task status');
        }

        const task = result.data as Task;
        console.log(`Task ${taskId} status:`, task.status);
        
        // 更新进度信息
        if (task.status === 'completed') {
          // 任务完成
          setLibraries(libs => libs.map(lib => 
            lib.id === libraryId ? { 
              ...lib,
              lastScan: task.completedAt,
              scanStatus: 'idle',
            } : lib
          ));
          
          toast.info(`Library [${currentLibrary?.name || 'Unknown Library'}] scan completed`);
          
          return;
        } else if (task.status === 'failed') {
          // 任务失败
          const errorMessage = task.result || 'Task failed';
          setLibraries(libs => libs.map(lib => 
            lib.id === libraryId ? { 
              ...lib, 
              scanStatus: 'error',
            } : lib
          ));
          toast.error(`Library [${currentLibrary?.name || 'Unknown Library'}] scan failed - ${errorMessage}`);
          return;
        }
        
        // 任务还在进行中，继续轮询
        if (task.status === 'running' || task.status === 'pending') {
          setTimeout(poll, 2000); // 2秒后再次检查
        }
        
      } catch (error) {
        console.error('Error polling task status:', error);
        setLibraries(libs => libs.map(lib => 
          lib.id === libraryId ? { 
            ...lib, 
            scanStatus: 'error',
          } : lib
        ));
        toast.error('Failed to get scan status');
      }
    };

    // 开始轮询
    setTimeout(poll, 1000); // 1秒后开始第一次检查
  };

  // 打开编辑媒体库弹出框
  const handleOpenEditModal = (library: LibraryWithScan) => {
    setEditingLibrary(library);
    setIsModalOpen(true);
  };

  // 关闭弹出框
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLibrary(null);
  };

  // LibraryEdit 保存成功回调
  const handleLibrarySuccess = () => {
    setIsModalOpen(false);
    setEditingLibrary(null);
    // 页面会自动重新渲染，因为 action 中使用了 revalidatePath
  };
  
  return (
    <div className={className}>
      {/* caption */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 items-center">
          <h1 className="text-3xl font-bold text-primary">Libraries</h1>
          <div className="badge badge-sm badge-secondary">{ libraries.length }</div>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          disabled={isPending}
        >
          <MyIcon iconName="plus" />
          Add Library
        </button>
      </div>

      {/* libraries list */}
      <ul className="list max-h-[70vh] min-h-[50vh] overflow-y-auto">
        {libraries.map((library) => (
          <li key={library.id} className="list-row items-center">
            {/* icon */}
            <MyIcon iconName={library.icon as IconName} className="w-8 h-8" />
            {/* title */}
            <div>
              <h3 className="text-lg font-semibold">{library.name}</h3>
                <p className="text-sm text-base-content/70">
                {library.folders?.length > 0 
                  ? `${library.folders.length} folders` 
                  : 'No folders'
                }
                </p>
                <p className="text-xs text-base-content/50 font-mono">
                  {/* <span>Updated at: {library.updatedAt ? new Date(library.updatedAt).toLocaleString() : 'N/A'},</span> */}
                  <span>Last Scan: {library.lastScan ? new Date(library.lastScan).toLocaleString() : 'N/A'}</span>
                </p>
            </div>
            {/* actions */}
            <div className="flex items-center gap-2">
              {/* 扫描按钮 */}
              <button 
                className="btn btn-sm gap-2 w-32"
                onClick={() => handleScan(library.id)}
                disabled={library.scanStatus === 'scanning' || isPending}
              >
                {library.scanStatus !== 'scanning' ? (
                  <MyIcon iconName="libraryScan" className="w-4 h-4" />
                ) : (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
                {library.scanStatus === 'scanning' ? 'Scaning' : 'Scan'}
              </button>
              {/* 操作菜单 */}
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                  <MyIcon iconName="ellipsisVertical"/>
                </div>
                <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-32 p-2 shadow">
                  <li>
                    <a onClick={() => handleOpenEditModal(library)}>
                      <MyIcon iconName="edit" className="w-4 h-4" />
                      Edit
                    </a>
                  </li>
                  <li>
                    <a className="text-error" onClick={() => setDeleteConfirmId(library.id)}>
                      <MyIcon iconName="trash" className="w-4 h-4" />
                      Delete
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* 添加媒体库 modal */}
      {isModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {editingLibrary ? 'Edit Library' : 'Add Library'}
              </h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={handleCloseModal}
              >
                <MyIcon iconName="x" className="w-4 h-4" />
              </button>
            </div>
            
            {/* LibraryEdit 组件 */}
            <LibraryEdit 
              library={editingLibrary || undefined}
              onSuccess={handleLibrarySuccess}
              onCancel={handleCloseModal}
            />
          </div>
        </dialog>
      )}

      {/* 删除确认 modal */}
      {deleteConfirmId && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <div className="flex flex-col gap-2 py-4">
              <p className="">
                Are you sure you want to delete this library?
              </p>
              <span className="badge badge-soft badge-secondary">
                {libraries.find(lib => lib.id === deleteConfirmId)?.name}
              </span>
            </div>
            <div className="modal-action">
              <button 
                className="btn btn-error"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isPending}
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
        </dialog>
      )}
    </div>
  );
}