/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a debounced function with a unique key,
 * useful for debouncing multiple inputs independently.
 */
export function createDebouncedMap<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (key: string, ...args: Parameters<T>) => void {
  const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  return function debouncedWithKey(key: string, ...args: Parameters<T>) {
    const existing = timeouts.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timeoutId = setTimeout(() => {
      func(...args);
      timeouts.delete(key);
    }, wait);

    timeouts.set(key, timeoutId);
  };
}
