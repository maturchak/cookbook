import { useEffect } from 'react';

const APP_NAME = 'CookBook';

/** Устанавливает заголовок вкладки и восстанавливает его при размонтировании. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
