'use client';

import { useState, useEffect } from 'react';
import MyIcon from '../MyIcon';

interface FolderItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface ServerFolderSelectorProps {
  onFolderSelect?: (folderPath: string) => void;
  initialPath?: string;
  className?: string;
}

export default function ServerFolderSelector({
  onFolderSelect = (folderPath) => { console.log('Selected folder:', folderPath)},
  initialPath = '/',
  className = ''
}: ServerFolderSelectorProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([initialPath]));

  // 获取文件夹列表
  const fetchFolders = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/server/browse?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // 只显示文件夹
        // const directories = data.items.filter((item: FolderItem) => item.isDirectory);
        const directories = data.items;
        setFolders(directories);
      } else {
        throw new Error(data.error || '获取文件夹失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文件夹失败');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和 currentPath 路径变化时加载
  useEffect(() => {
    fetchFolders(currentPath);
  }, [currentPath]);

  // 切换文件夹展开状态
  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  // 导航到父级目录
  const navigateUp = () => {
    if (currentPath !== '/') {
      const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
      setCurrentPath(parentPath);
    }
  };

  // 导航到子目录
  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  // 选择文件夹
  const selectFolder = (folderPath: string) => {
    // setSelectedPath(folderPath);
    onFolderSelect(folderPath);
  };

  // 获取路径面包屑
  const getBreadcrumbs = () => {
    if (currentPath === '/') return [{ name: 'Root', path: '/' }];
    
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Root', path: '/' }];
    
    let accumulatedPath = '';
    parts.forEach(part => {
      accumulatedPath += '/' + part;
      breadcrumbs.push({ name: part, path: accumulatedPath });
    });
    
    return breadcrumbs;
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      
      {/* 面包屑导航 */}
      <div className="breadcrumbs text-sm bg-base-200 px-4">
        <ul>
          {getBreadcrumbs().map((crumb, _index) => (
            <li key={crumb.path}>
              <button
                className="link link-hover"
                onClick={() => setCurrentPath(crumb.path)}
                disabled={crumb.path === currentPath}
              >
                {crumb.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      {/* 文件夹列表容器 */}
      <div className="h-64 overflow-y-auto bg-base-200">
        {/* 加载状态 */}
        {loading && (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-md"></span>
            <span className="ml-2">Loading...</span>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="flex flex-col justify-center items-center h-full gap-4">
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => fetchFolders(currentPath)}
            >
              Retry
            </button>
          </div>
        )}

        {/* 文件夹列表 */}
        {!loading && !error && (
          <>
            {folders.length === 0 ? (
              <div className="flex h-full justify-center items-center text-base-content/70">
                <span>Empty Folder</span>
              </div>
            ) : (
              <ul className="menu w-full">
                {folders.map((folder) => (
                  <li key={folder.path}>
                    <button
                      className="justify-between text-sm"
                      onClick={() => navigateToFolder(folder.path)}
                      disabled={!folder.isDirectory}
                    >
                      <div className="flex items-center gap-2">
                        <MyIcon
                          iconName={folder.isDirectory ? "folder" : "file"}
                          className={`w-4 h-4 ${folder.isDirectory ? "text-warning" : "text-base-content/70"}`}
                        />
                        <span className="font-mono">{folder.name}</span>
                      </div>
                      {folder.isDirectory && (
                        <MyIcon iconName="chevronRight" className="w-4 h-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      
      {/* 选择按钮 */}
      <div className="flex flex-col gap-4">
        <div className="flex text-xs items-center gap-1">
          <span className="flex-none text-base-content/70">Current Path:</span>
          <code className="font-mono bg-base-200 p-1 rounded overflow-x-auto whitespace-pre">
            { currentPath }
          </code>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => selectFolder(currentPath)}
        >
          Select
        </button>
      </div>
        
    </div>
  );
}