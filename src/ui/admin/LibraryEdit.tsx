'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import type { Library } from '@/lib/server/db/library';
import { createLibraryAction, updateLibraryAction } from '@/lib/server/actions/library';
import MyIcon, { IconName } from '@/ui/MyIcon';
import ServerFolderSelector from '@/ui/admin/ServerFolderSelector';


const AVAILABLE_ICONS: IconName[] = [
  'book', 'bookOpen', 'bookLock', 'bookCheck', 'bookAudio', 
  'bookHeadphones', 'bookHeart', 'library', 'libraryBuilding', 'music',
  'audioLines', 'audioFile', 'speaker', 'microphone', 'headphone',
];

type LibraryEditProps = {
  library?: Library;
  className?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function LibraryEdit({ library, className, onSuccess, onCancel }: LibraryEditProps) {
  // 组件状态
  const [selectedIcon, setSelectedIcon] = useState('library' as IconName);
  const [name, setName] = useState(library?.name || '');
  const [folders, setFolders] = useState<string[]>(library?.folders || [] );
  const [tab1Content, setTab1Content] = useState<'details' | 'folder-select'>('details');
  const [isPending, setIsPending] = useState(false);

  const handleSave = async () => {
    setIsPending(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('icon', selectedIcon);
      formData.append('folders', JSON.stringify(folders));

      let result;
      if (library) {
        // 更新现有媒体库
        result = await updateLibraryAction(library.id, formData);
      } else {
        // 创建新媒体库
        result = await createLibraryAction(formData);
      }

      if (result.success) {
        onSuccess?.();
      } else {
        // 这里可以添加错误提示逻辑
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setIsPending(false);
    }
  };

  const handleAddFolder = (folderPath: string) => {
    // 判断是否和已有路径重叠
    const hasConflict = folders.some(existing => {
      return (
        folderPath === existing || // 完全相同
        folderPath.startsWith(existing + '/') || // 新目录是已有目录的子目录
        existing.startsWith(folderPath + '/')    // 已有目录是新目录的子目录
      );
    });

    if (hasConflict) {
      toast.error(`Path conflict: ${folderPath} overlaps with an existing path`);
      return;
    }

    // 直接添加
    setFolders([...folders, folderPath]);
    setTab1Content('details');
  };

  const handleRemoveFolder = (folderPath: string) => {
    setFolders(folders.filter(f => f !== folderPath));
  };

  const handleBackToDetails = () => {
    setTab1Content('details');
  };

  return (
    <div className={`tabs tabs-lift ${className}`}>
      
      {/* Tab1 */}
      <label className="tab">
        <input type="radio" name="my_tabs_group" defaultChecked />
        { library ? 'Edit Library' : 'New Library' }
      </label>

      {/* 选项卡内容 */}
      {tab1Content === "details" ? (
        // 编辑界面
        <div className="tab-content bg-base-100 border-base-300 p-6 space-y-6">

          {/* 第一行 */}
          <div className="flex gap-4">
            {/* Icon 选择 */}
            <div className="form-control">
              <label className="block text-sm font-medium text-base-content mb-2">
                Icon
              </label>
              <input type="hidden" id="icon" name="icon" value={selectedIcon} />
              <div className="dropdown dropdown-bottom">
                <div 
                  tabIndex={0} 
                  role="button" 
                  className="btn w-full justify-center bg-base-100"
                >
                  <MyIcon iconName={selectedIcon} />
                </div>
                <div tabIndex={0} className="dropdown-content z-[1] mt-1 w-64">
                  <div className="card-body p-4 bg-base-100 shadow-lg rounded">
                    <div className="grid grid-cols-5 gap-3">
                      {AVAILABLE_ICONS.map((iconName) => (
                        <button
                          key={iconName}
                          type="button"
                          className={`btn btn-square ${selectedIcon === iconName ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setSelectedIcon(iconName)}>
                          <MyIcon iconName={iconName}/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Library Name */}
            <div className="flex-1 form-control">
              <label className="block text-sm font-medium text-base-content mb-2">
                Library Name
              </label>
              <input
                name="libraryName"
                type="text" 
                className="input input-bordered w-full bg-base-100" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your library"
              />
            </div>
          </div>

          {/* 第二行 */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-base-content mb-2">
              Folders
            </label>

            {/* Folders List */}
            <div className="space-y-2 bg-base-200 rounded max-h-64 overflow-y-auto">
              {folders.map((folder, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2`}
                  >
                  <MyIcon iconName="folder" className="w-4 h-4 ml-3 text-warning" />
                  <span className="text-base-content flex-1 font-mono text-sm">{folder}</span>
                  <button 
                    type="button"
                    className="btn btn-ghost hover:bg-error hover:text-error-content"
                    onClick={() => handleRemoveFolder(folder)}
                  >
                    <MyIcon iconName="trash" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {/* Browse for Folder Button */}
            <button 
              type="button"
              className="btn btn-soft btn-primary w-full"
              onClick={() => setTab1Content('folder-select')}
            >
              Add Folder
            </button>
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
              disabled={isPending || !name.trim()}
            >
              {isPending ? (library ? 'Saving...' : 'Creating...') : (library ? 'Save' : 'Create')}
            </button>
          </div>

        </div>
      ) : (
          // 文件夹选择界面
          <div className="tab-content bg-base-100 border-base-300 p-6">
            {/* 标题栏 */}
            <div className="flex items-center mb-4">
              <button className="btn btn-ghost btn-square" onClick={handleBackToDetails}>
                <MyIcon iconName="arrowLeft"/>
              </button>
              <h4 className="font-semibold">Choose a Folder</h4>
            </div>

            {/* ServerFolderSelector 组件 */}
            <ServerFolderSelector
              onFolderSelect={handleAddFolder}
              initialPath="/"
              className="w-full"
            />
          </div>
        )
      }

      {/* Tab2 */}
    </div>
  );
}