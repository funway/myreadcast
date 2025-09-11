'use client';

import { useAudioBookReader } from './hooks/useAudioBookReader';
import { EpubViewer } from './components/EpubViewer';
import { AudioPlayer } from './components/AudioPlayer';

/**
 * The main <AudioBookReader /> component.
 * It acts as a frame, rendering either the EPUB modal or the audio-only bar.
 */
export function AudioBookReader() {
  const { isOpen, currentBook } = useAudioBookReader();

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
              className="flex-shrink-0 border-t mt-4 h-28"
              showCloseButton={false}
            />
          )}

        </div>
      </dialog>
    );
  } else if (hasAudioPlayer) {
    return (
      <AudioPlayer
        className="fixed bottom-0 left-0 right-0 z-50 h-28"
        showCloseButton={true} // The player needs its own close button in this mode
      />
    );
  }

  console.error('Unrecognized book:', currentBook);
  return null;
}