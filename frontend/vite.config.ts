/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Разрешаем любые хосты, чтобы preview-прокси работал
    allowedHosts: true,
    // Настоящий бэкенд: /api проксируется на Express-сервер
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // unit-тесты всегда гоняем на мок-данных, независимо от .env
    env: { VITE_USE_MOCK: 'true' },
  },
});
