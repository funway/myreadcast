'use client';

import { useRef, useSyncExternalStore } from 'react';
import { reader, ReaderState } from '@/lib/client/audiobook-reader';
import { shallowEqual } from '@/lib/client/audiobook-reader/utils';

/**
 * Custom hook to subscribe to the audiobook reader's state and select a subset of it.
 * 
 * This hook internally uses `useSyncExternalStore` to subscribe to the `reader`'s
 * "state-changed" events. It also performs shallow comparison to avoid unnecessary
 * re-renders when the selected state slice hasn't changed.
 * @param selector 
 * @returns 
 * @example
 * // Subscribe to the full reader state
 * const state = useReaderState();
 * 
 * // Subscribe to only the current track index
 * const currentTrack = useReaderState(state => state.currentTrack);
 */
export function useReaderState<T = ReaderState>(
  selector?: (state: ReaderState) => T,
  debugLabel?: string
): T {
  const lastSnapshotRef = useRef<T>(null);

  const subscribe = (onStoreChange: () => void) => {
    reader.on('state-changed', onStoreChange);
    // console.log(`<useReaderState> subscribe state-changed event by ${debugLabel ?? 'unknown'}`);
    
    return () => {
      reader.off('state-changed', onStoreChange);
      // console.log(`<useReaderState> subscribe cleanup (unsubscribe state-changed event) by ${debugLabel ?? 'unknown'}`);
    }
  };

  const getSnapshot = () => {
    const state = reader.getState();
    const selected = selector ? selector(state) : (state as unknown as T);
    
    const prev = lastSnapshotRef.current;
    if (prev && shallowEqual(prev, selected)) { 
      return prev;
    } else {
      lastSnapshotRef.current = selected;
      return selected;
    }
  };

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}