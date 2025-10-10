'use client';

import { useEffect, useRef, useState } from 'react';
import { NavItem } from 'hawu-epubjs';
import { reader } from '@/lib/client/audiobook-reader';
import { useReaderState } from '../hooks/useReaderState';
import MyIcon from '@/ui/MyIcon';

const FONT_FAMILIES = [
  'serif',
  'sans-serif',
  'cursive',
  'monospace',
];

export function EpubViewer() {
  const { currentBook, settings, toc } = useReaderState((state) => ({
    currentBook: state.currentBook,
    settings: state.settings.epubView,
    toc: state.toc,
  }), "EpubViewer");
  
  const [openDrawer, setOpenDrawer] = useState<null | 'toc' | 'settings'>(null);
  const activeDrawerContent = useRef<null | 'toc' | 'settings'>(null);
  if (openDrawer !== null) {
    activeDrawerContent.current = openDrawer;
  }
  const viewerRef = useRef<HTMLDivElement>(null);

  console.log('[EpubViewer] rendering', { currentBook, toc });

  useEffect(
    () => {
      // 1. setup epub view
      const viewerElement = viewerRef.current;
      if (viewerElement) {
        reader.attachView(viewerElement);
      }

      return () => {
        console.log('[EpubViewer] useEffect cleanup');
        reader.detachView();
      };
    }, []
  );

  const handleTocClick = (href: string) => {
    reader.goToHref(href);
    setOpenDrawer(null);
  };

  const renderToc = (toc?: NavItem[]) => { 
    if (toc === undefined) {
      return (
        <div className="flex justify-center p-4 text-base-content">
          <span className="loading loading-dots loading-md"></span>
        </div>
      );
    }

    return (
      <ul className="menu w-full p-4 text-base-content">
        {toc.map((item) => (
          <li key={item.id}>
            <a onClick={() => handleTocClick(item.href)}>{item.label}</a>
            {item.subitems && item.subitems.length > 0 && (
              <ul>{renderToc(item.subitems)}</ul>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const renderSettings = () => (
    <div className="p-4 space-y-6">
      {/* Font Family */}
      <div>
        <span className="label-text">Font Family</span>
        <select
          className="select select-bordered w-full mt-2"
          value={settings.fontFamily}
          onChange={(e) => reader.updateSettings({ epubView: { fontFamily: e.target.value } })}
        >
          {FONT_FAMILIES.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div>
        <div className="flex justify-between items-center">
          <span className="label-text">Font Size</span>
          <span className="badge badge-ghost">{settings.fontSize}%</span>
        </div>
        <input
          type="range"
          min="80"
          max="200"
          value={settings.fontSize}
          onChange={(e) => reader.updateSettings({ epubView: { fontSize: parseInt(e.target.value) } })}
          className="range range-primary mt-2"
        />
      </div>

      {/* Line Height */}
      <div>
        <div className="flex justify-between items-center">
          <span className="label-text">Line Spacing</span>
          <span className="badge badge-ghost">{settings.lineHeight}</span>
        </div>
        <input
          type="range"
          min="1"
          max="2.5"
          step="0.1"
          value={settings.lineHeight}
          onChange={(e) => reader.updateSettings({ epubView: { lineHeight: parseFloat(e.target.value) } })}
          className="range range-primary mt-2"
        />
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col h-full w-full">
      
      {/* Top Navigation */}
      <div className="flex flex-shrink-0 items-center justify-between p-4">
        {/* 左侧：按钮 */}
        <div className="flex items-center gap-2 w-1/5">
          <button
            onClick={() => setOpenDrawer('toc')}
            className="btn btn-ghost btn-square"
          >
            <MyIcon iconName="list" />
          </button>
          <button
            onClick={() => setOpenDrawer('settings')}
            className="btn btn-ghost btn-square"
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
        <div className="flex items-center justify-end w-1/5">
          <button
            className="btn btn-circle btn-ghost"
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
          className="h-full w-full rounded-lg"
        />

        <div className="absolute inset-2 flex justify-between items-center pointer-events-none">
          <div className="p-2 rounded-full cursor-pointer pointer-events-auto opacity-20 hover:opacity-100"
            onClick={() => {
              reader.setSyncPage(false);
              reader.prevPage();
            }}
          >
            <MyIcon iconName="chevronLeft" className="w-[3em] h-[3em]" />
          </div>
          <div className="p-2 rounded-full cursor-pointer pointer-events-auto opacity-20 hover:opacity-100"
            onClick={() => {
              reader.setSyncPage(false);
              reader.nextPage();
            }}
          >
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
        className={`flex flex-col absolute top-0 left-0 z-50 h-full w-80 shadow-lg bg-base-100
          transform transition-transform duration-300 ${openDrawer ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex-shrink-0 flex items-center p-4 gap-2">
          <button
            onClick={() => setOpenDrawer(null)}
            className="btn btn-circle btn-ghost"
          >
            <MyIcon iconName="arrowLeft"/>
          </button>
          <h2 className="font-bold text-lg">
            {activeDrawerContent.current === 'toc' ? 'Table of Contents' : 'Reader Setting'}
          </h2>
        </div>

        <div className="flex-grow overflow-y-auto">
          {activeDrawerContent.current === 'toc' && renderToc(toc)}
          {activeDrawerContent.current === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
}
