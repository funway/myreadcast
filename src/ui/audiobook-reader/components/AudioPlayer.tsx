'use client';

import React from 'react';
import { reader } from '@/lib/client/audiobook-reader';

type AudioPlayerProps = {
  className?: string;
  showCloseButton?: boolean;
};

/**
 * A reusable component for the audio player UI.
 * It can be styled to fit in different contexts (modal vs. fixed bar)
 * and can optionally show its own close button.
 */
export const AudioPlayer = React.memo(({ className, showCloseButton = false }: AudioPlayerProps) => {
  return (
    <div className={className}>
      <div className="relative h-full w-full flex items-center justify-center bg-base-100 p-4 shadow-lg">
        {showCloseButton && (
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-1/2 -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              reader.close();
            }}
          >
            ✕
          </button>
        )}
        <p className="text-gray-500">AudioPlayer UI will be rendered here.</p>
      </div>
    </div>
  );
});
