'use client';

import { reader } from '@/lib/client/audiobook-reader';
import { ClientStatesStore } from '@/lib/client/store';
import { useClientStatesStore } from '@/ui/contexts/StoreContext';
import { toast } from 'react-toastify';
import { EpubViewer } from '../audiobook-reader/components/EpubViewer';

export default function TestUI() {
  const { sessionUser, setSessionUser, count, increaseCount } = useClientStatesStore();
  console.log('[TestUI]', 'count = ', count);
  const handleClick = () => {
    // 使用 ClientStates.count 的其他组件也会刷新
    increaseCount();
    
    toast.info("Wow so easy! " + count);
  }
  
  return (
    <>
      <div className='flex flex-col gap-4'>
        <button className="btn" onClick={ handleClick }>
          One up <div className="badge badge-sm">{count}</div>
        </button>
        <div className='divider'></div>
        
        <button
        className ="btn btn-primary"
          onClick={() =>
            reader.open({
              type: 'epub', // 我们可以先用 epub 类型测试
              path: '/books/oldman.epub', // 使用我们规划的测试路径
              title: '测试书籍：打开与关闭功能',
            })
          }
        >
          Plain EPUB
        </button>

        <button
        className ="btn btn-primary"
          onClick={() =>
            reader.open({
              type: 'epub', // 我们可以先用 epub 类型测试
              path: '/books/chamber/OEBPS/content.opf', // 使用我们规划的测试路径
              title: '测试书籍：打开与关闭功能',
            })
          }
        >
          Plain EPUB (unzipped)
        </button>

        <button
        className ="btn btn-primary"
          onClick={() =>
            reader.open({
              type: 'audible_epub', // 我们可以先用 epub 类型测试
              path: '/books/hp-fire/OEBPS/content.opf', // 使用我们规划的测试路径
              title: '测试书籍：打开与关闭功能',
            })
          }
        >
          Audible EPUB
        </button>

        <button
        className ="btn btn-primary"
          onClick={() =>
            reader.open({
              type: 'audios', // 我们可以先用 epub 类型测试
              path: '/books/oldman.epub', // 使用我们规划的测试路径
              title: '测试书籍：打开与关闭功能',
            })
          }
        >
          Only Audios
        </button>
      </div>
    </>
  );
}
