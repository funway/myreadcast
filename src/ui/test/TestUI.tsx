'use client';

import { ClientStatesStore } from '@/lib/client/store';
import { useClientStatesStore } from '@/ui/contexts/StoreContext';

export default function TestUI() {
  const { sessionUser, setSessionUser, count, increaseCount } = useClientStatesStore();
  console.log('[TestUI]', 'count = ', count);
  const handleClick = () => {
    // 使用 ClientStates.count 的其他组件也会刷新
    increaseCount();
    
    // if (sessionUser) {
    //   // 使用 ClientStates.sessionUser 的其他组件也会刷新
    //   setSessionUser({ ...sessionUser, username: 'new name' });
    // }
  }
  
  return (
    <>
      <div>
        <button className="btn" onClick={ handleClick }>
          One up <div className="badge badge-sm">{count}</div>
        </button>
      </div>
    </>
  );
}
