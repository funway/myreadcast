import type { Book } from '@/lib/server/db/book';
import { BookConfig } from "../types";
import { PlaylistItemWithRel } from '@/lib/shared/types';

export function getAppColors(): { background: string; color: string } {
  const defaultColors = { background: '#ffffff', color: '#000000' };
  if (typeof window === 'undefined') return defaultColors;

  try {
    // Dynamically find the element with the DaisyUI theme attribute, falling back to documentElement.
    const themedElement = document.querySelector('[data-theme]') || document.documentElement;
    const computedStyle = window.getComputedStyle(themedElement);
    const background = computedStyle.getPropertyValue('--color-base-100') || defaultColors.background;
    const color = computedStyle.getPropertyValue('--color-base-content') || defaultColors.color;
    return { background, color };
  } catch (error) {
    console.error("Could not compute theme colors, falling back to default.", error);
    return defaultColors;
  }
}

/**
 * Performs a shallow equality check between two values.
 * 
 * - Returns `true` if both values are strictly equal (`Object.is`), 
 *   or if both are non-null objects with the same set of keys 
 *   and their corresponding values are strictly equal.
 * - Only checks the **first level** of properties (does not compare nested objects).
 *
 * @template T - The type of the objects being compared.
 * @param {T} objA - The first object to compare.
 * @param {T} objB - The second object to compare.
 * @returns {boolean} `true` if the two values are shallowly equal, otherwise `false`.
 *
 * @example
 * shallowEqual({a: 1, b: 2}, {a: 1, b: 2}); // true
 * shallowEqual({a: {x: 1}}, {a: {x: 1}});   // false (different object references)
 */
export function shallowEqual<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) return true;
  if (
    typeof objA !== 'object' || objA === null ||
    typeof objB !== 'object' || objB === null
  ) {
    return false;
  }
  const keysA = Object.keys(objA) as (keyof T)[];
  const keysB = Object.keys(objB) as (keyof T)[];
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!(key in objB) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }
  return true;
}


export function createBookConfig(bookData: Book): BookConfig {
  const urlPath = `/api/book/${bookData.id}`;
  
  const oriPlaylist = bookData.playlist as PlaylistItemWithRel[] | undefined;
  const playlist = oriPlaylist ? oriPlaylist.map(track => ({
    title: track.title,
    path: `${urlPath}/${track.relPath}`,
    duration: track.duration,
  })) : undefined;

  const book: BookConfig = {
    id: bookData.id,
    type: bookData.type,
    title: bookData.title,
    path: urlPath,
    
    opfPath: bookData.opf ? `${urlPath}/${bookData.opf}` : undefined,
    
    coverPath: bookData.coverPath ? `${urlPath}/cover` : undefined,
    
    playlist: playlist,

    author: bookData.author ? bookData.author : undefined,
  };

  return book;
}