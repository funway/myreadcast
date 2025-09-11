'use client';

import { useEffect, useRef, useState } from 'react';
import { KEYBOARD_SHORTCUTS, reader } from '@/lib/client/audiobook-reader';
import { useAudioBookReader } from '../hooks/useAudioBookReader';
import MyIcon from '@/ui/MyIcon';

export function EpubViewer() {
  const { currentBook } = useAudioBookReader();
  const [openDrawer, setOpenDrawer] = useState<null | 'toc' | 'settings'>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  
  useEffect(
    () => {
      // 1. setup epub view
      const viewerElement = viewerRef.current;
      if (viewerElement) {
        reader.attachView(viewerElement);
      }

      // 2. setup key events
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        
        const action = KEYBOARD_SHORTCUTS[event.key as keyof typeof KEYBOARD_SHORTCUTS];
        if (action) {
          reader.handleShortcut(action);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
  
      return () => {
        console.log('[EpubViewer] useEffect cleanup');
        reader.detachView();
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, []
  );

  return (
    <div className="relative flex flex-col h-full w-full">
      
      {/* Top Navigation */}
      <div className="flex flex-shrink-0 items-center justify-between p-4">
        {/* 左侧：按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenDrawer('toc')}
            className="btn btn-sm btn-ghost btn-square"
          >
            <MyIcon iconName="list" />
          </button>
          <button
            onClick={() => setOpenDrawer('settings')}
            className="btn btn-sm btn-ghost btn-square"
          >
            <MyIcon iconName="setting" />
          </button>
        </div>

        {/* 中间：书名 */}
        <div className="flex-1 text-center truncate">
          <h3 className="font-bold text-lg">
            {currentBook?.title || 'AudioBook Reader'}
          </h3>
          {/* <p className="text-sm text-base-content/70">
            {currentPage && totalPages ? `${currentPage} / ${totalPages} (${progress}%)` : 'Loading...'}
          </p> */}
        </div>

        {/* 右侧：关闭按钮 */}
        <div className="flex items-center justify-end">
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={() => reader.close()}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Epub container */}
      <div className="flex-grow relative">

        <div
          ref={viewerRef}
          id="epub-viewer-area"
          className="h-full w-full bg-base-200 rounded-lg"
        />

        <div className="absolute inset-2 flex justify-between items-center pointer-events-none">
          <div className="p-2 rounded-full cursor-pointer pointer-events-auto opacity-20 hover:opacity-100"
            onClick={() => reader.prevPage()}>
            <MyIcon iconName="chevronLeft" className="w-[3em] h-[3em]" />
          </div>
          <div className="p-2 rounded-full cursor-pointer pointer-events-auto opacity-20 hover:opacity-100"
            onClick={() => reader.nextPage()}>
            <MyIcon iconName="chevronRight" className="w-[3em] h-[3em]" />
          </div>
        </div>

      </div>

      {/* 半透明遮罩（点一下关闭所有 drawer） */}
      {openDrawer && (
        <div
          className="absolute inset-0 bg-black/20"
          onClick={() => setOpenDrawer(null)}
        />
      )}

      {/* Drawer */}
      <div
        className={`absolute top-0 left-0 z-50 h-full w-80 bg-base-100 shadow-lg transition-transform duration-500 transform ${
          openDrawer ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center p-4 gap-2">
          <button
            onClick={() => setOpenDrawer(null)}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <MyIcon iconName="arrowLeft"/>
          </button>
          <h2 className="font-bold text-lg">
            {openDrawer === 'toc' ? 'Table of Contents' : 'Reader Setting'}
          </h2>
        </div>
          {openDrawer === 'toc' ? (
            <>
              {/* 显示 Epub 的 Table of Contents */}
            </>
          ) : (
            <>
              {/* 使用 DaisyUI 的 range 实现 fontsize, linespace 调节，font family 选择，以及 theme 选择 */}
            </>
          )}
      </div>
    </div>
  );
}
