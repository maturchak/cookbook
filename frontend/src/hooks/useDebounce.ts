import { useEffect, useState } from 'react';

/**
 * Возвращает значение с задержкой: полезно для поиска,
 * чтобы не дёргать фильтрацию на каждое нажатие клавиши.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
