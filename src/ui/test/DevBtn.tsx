'use client';

import Link from "next/link";

export default function DevButton() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return (
    <div className="fixed bottom-32 left-4">
      <div className="dropdown dropdown-top dropdown-start">
        <div tabIndex={0} role="button" className="btn btn-circle btn-secondary m-1 shadow-lg">
          Dev
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-100 rounded-box z-[1] w-40 p-2 shadow"
        >
          <li>
            <Link href="/test">Go to /test</Link>
          </li>
          <li>
            <a href="/test">Jump to /test</a>
          </li>
        </ul>
      </div>
    </div>
  );
}