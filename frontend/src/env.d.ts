/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' | 'false' — использовать мок-данные вместо реального API */
  readonly VITE_USE_MOCK?: string;
  /** Базовый URL API, например '/api' или 'https://api.cookbook.local' */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
