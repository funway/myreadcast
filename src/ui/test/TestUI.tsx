'use client';

import { reader } from '@/lib/client/audiobook-reader';
import { useClientStatesStore } from '@/ui/contexts/StoreContext';
import { toast } from 'react-toastify';
import { EpubViewer } from '../audiobook-reader/components/EpubViewer';
import ePub, { Book, Rendition } from 'hawu-epubjs';
import { useRef, useState } from 'react';

export default function TestUI() {
  const { sessionUser, setSessionUser, count, increaseCount } = useClientStatesStore();
  console.log('[TestUI]', 'count = ', count);
  console.log(Object.keys(Rendition));

  const [book, setBook] = useState<Book | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  
  const handleClick = () => {
    // 使用 ClientStates.count 的其他组件也会刷新
    increaseCount();
    toast.info("Wow so easy! " + count);
  }

  const handleToggleBook = async () => {
    if (book) {
      // --- 销毁逻辑 ---
      console.log('[TestUI] Destroying book...');
      try {
        book.rendition.q.clear();
        book.rendition.clear();
        book.rendition.destroy();
        book.destroy();
      } catch (e) {
        console.warn('Error destroying book:', e);
      }
      setBook(null);
      if (viewerRef.current) {
        viewerRef.current.innerHTML = '';
      }
      toast.info('Book closed and destroyed.');
      return;
    }

    // --- 创建逻辑 ---
    console.log('[TestUI] Opening book...');
    const newBook = ePub('/books/hp-fire/OEBPS/content.opf');
    const newRendition = newBook.renderTo(viewerRef.current!, {
      width: '100%',
      height: '600px',
      spread: 'auto',
      allowScriptedContent: true,
    });

    await newRendition.display();
    setBook(newBook);
    toast.success('Book opened.');
  };
  
  return (
    <>
      <button className="btn btn-primary" onClick={handleToggleBook}>
        {book ? 'Close Book' : 'Open Book'}
      </button>

      <div
        ref={viewerRef}
        id="viewer"
        className="w-full border border-gray-300 rounded-lg overflow-hidden"
      ></div>

      <div className='flex flex-col gap-4'>
        <div className='divider'></div>
        <button className="btn" onClick={ handleClick }>
          One up <div className="badge badge-sm">{count}</div>
        </button>
      </div>
    </>
  );
}
