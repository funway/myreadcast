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
  
  for (let key of keysA) {
    if (!(key in objB) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }
  return true;
}
