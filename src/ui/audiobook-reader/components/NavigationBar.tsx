'use client';

import { useAudioBookReader } from '../hooks/useAudioBookReader';

/**
 * The navigation bar displayed at the top of the reader.
 * It shows the book title, page progress, and provides buttons for chapters and settings.
 */
export function NavigationBar() {
  const { currentBook, currentPage, totalPages } = useAudioBookReader();

  const progress =
    totalPages && currentPage ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div className="flex items-center justify-between w-full h-full">
      {/* Left Section: Title */}
      <div className="flex-1 truncate">
        <h3 className="font-bold text-lg">
          {currentBook?.title || 'AudioBook Reader'}
        </h3>
      </div>

      {/* Center Section: Page Progress */}
      <div className="flex-1 flex items-center justify-center text-sm">
        {currentPage && totalPages ? (
          <span>
            {currentPage} / {totalPages} ({progress}%)
          </span>
        ) : (
          <span>Loading...</span>
        )}
      </div>

      {/* Right Section: Actions */}
      <div className="flex-1 flex justify-end gap-2">
        <button className="btn btn-sm btn-ghost" disabled>
          Chapters
        </button>
        <button className="btn btn-sm btn-ghost" disabled>
          Settings
        </button>
      </div>
    </div>
  );
}

