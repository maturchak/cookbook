import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // API-тесты гоняем на отдельной базе
    env: {
      DATABASE_URL: 'postgresql://cookbook:cookbook@localhost:5432/cookbook_test',
    },
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
