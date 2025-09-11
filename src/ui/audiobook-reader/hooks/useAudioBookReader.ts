'use client';

import { useState, useEffect } from 'react';
import { reader, ReaderState } from '@/lib/client/audiobook-reader';

/**
 * A React hook that subscribes to the global AudioBookReader's state.
 * It provides the reader's state to a React component and ensures
 * the component re-renders whenever the state changes.
 */
export function useAudioBookReader() {
  // 1. Use the reader's initial state to initialize React state
  const [state, setState] = useState<ReaderState>(reader.getState());

  useEffect(() => {
    // 2. Define a handler that updates React state when it receives a new state
    const handleStateChange = (newState: ReaderState) => {
      // Use a new object reference to trigger React's re-render
      setState({ ...newState });
    };

    // 3. Subscribe to the 'state-changed' event on component mount
    reader.on('state-changed', handleStateChange);

    // 4. Return a cleanup function to unsubscribe on component unmount to prevent memory leaks
    return () => {
      reader.off('state-changed', handleStateChange);
    };
  }, []); // Empty dependency array ensures this effect runs only on mount and unmount

  return state;
}
