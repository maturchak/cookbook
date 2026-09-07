import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // В мок-сервисах и формах `any` пока осознанно допустим
      '@typescript-eslint/no-explicit-any': 'warn',
      // Подчёркивание — маркер намеренно неиспользуемого параметра
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Пустые catch-блоки у нас используются для «проглотить» ошибки localStorage
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // В контекстах провайдер и его хук намеренно живут в одном файле —
    // это стандартный паттерн, fast-refresh для них не критичен.
    files: ['src/contexts/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  }
);
