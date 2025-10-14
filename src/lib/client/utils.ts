/**
 * Format a time value (in seconds) into a human-readable string.
 * 
 * Examples:
 * - 65 → "1:05"
 * - 3671 → "1:01:11"
 *
 * @param {number | undefined} timeInSeconds - The time value in seconds.
 * @returns {string} A formatted time string in `MM:SS` or `H:MM:SS` format.
 */
export const formatTime = (timeInSeconds: number | undefined) => {
    const time = Math.round(timeInSeconds || 0);
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Create a debounced version of a function.
 * 
 * The debounced function delays invoking `fn` until after `delay` milliseconds
 * have elapsed since the last time it was called.
 * 
 * Useful for events that fire frequently (e.g. input, resize) where you only
 * want to run the handler after the user stops triggering it.
 * 
 * @template T
 * @param {T} fn - The target function to debounce.
 * @param {number} delay - The number of milliseconds to wait after the last call.
 * @returns A debounced version of the function.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function debounced(this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };

  debounced.cancel = () => { 
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return debounced;
}

/**
 * Create a throttled version of a function.
 * 
 * The throttled function ensures that `fn` is called at most once
 * every `interval` milliseconds, regardless of how many times it’s triggered.
 * 
 * Useful for high-frequency events (e.g. scroll, mousemove) where you want to
 * limit how often the handler executes.
 * 
 * @template T
 * @param {T} fn - The target function to throttle.
 * @param {number} interval - The minimum time interval (in milliseconds) between calls.
 * @returns {T} A throttled version of the function.
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  interval: number
): T {
  let lastCall = 0;
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn.apply(this, args);
    }
  } as T;
}
