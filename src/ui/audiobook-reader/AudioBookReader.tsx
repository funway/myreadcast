'use client';

import { useReaderState } from './hooks/useReaderState';
import { EpubViewer } from './components/EpubViewer';
import { AudioPlayer } from './components/AudioPlayer';
import { useEffect } from 'react';
import { KEYBOARD_SHORTCUTS, reader } from '@/lib/client/audiobook-reader';

/**
 * The main <AudioBookReader /> component.
 * It acts as a frame, rendering either the EPUB modal or the audio-only bar.
 */
export function AudioBookReader() {
  const { isOpen, currentBook } = useReaderState(
    (state) => ({ isOpen: state.isOpen, currentBook: state.currentBook }),
    "AudioBookReader"
  );

  useEffect(
    () => {
      console.log('[AudioBookReader] calls useEffect');
      
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        // console.log('keydown', event);
        
        const action = KEYBOARD_SHORTCUTS[event.code as keyof typeof KEYBOARD_SHORTCUTS];
        if (action) {
          reader.handleShortcut(action);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
  
      return () => {
        console.log('[AudioBookReader] useEffect cleanup');
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, []
  );

  console.log('[AudioBookReader] rendering', {isOpen, currentBook});

  if (!isOpen || !currentBook) {
    return null;
  }

  const hasEpubView = currentBook.type === 'epub' || currentBook.type === 'audible_epub';
  const hasAudioPlayer = currentBook.type === 'audios' || currentBook.type === 'audible_epub';

  if (hasEpubView) {
    // For EPUBs, render the fullscreen modal containing the viewer and player.
    return (
      <dialog id="audiobook-reader-modal" className="modal modal-open">
        <div className="modal-box w-screen max-w-full h-screen max-h-screen rounded-none flex flex-col p-0">
        
          {/* EpubViewer */}
          <div className="flex-grow overflow-auto">
            <EpubViewer />
          </div>
          
          {/* AudioPlayer */}
          {hasAudioPlayer && (
            <AudioPlayer
              className="flex-shrink-0 mt-4"
              showCloseButton={false}
            />
          )}

        </div>
      </dialog>
    );
  } else if (hasAudioPlayer) {
    return (
      <AudioPlayer
        className="fixed bottom-0 left-0 right-0 z-50"
        showCloseButton={true} // The player needs its own close button in this mode
      />
    );
  }

  console.error('Unrecognized book:', currentBook);
  return null;
}