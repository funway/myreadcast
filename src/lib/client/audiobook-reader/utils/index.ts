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