'use client';

import { useClientStatesStore } from "@/lib/client/store";

export default function TestUI() {
  const { sessionUser, setSessionUser, count, increaseCount } = useClientStatesStore();
  console.log('[TestUI]', 'count = ', count);
  const handleClick = () => {
    increaseCount();
    if (sessionUser) {
      setSessionUser({ ...sessionUser, username: 'new name' });
    }
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
