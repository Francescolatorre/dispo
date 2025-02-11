import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [
      'dotenv/config',
      './src/routes/__tests__/setup.js'
    ],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/',
        'coverage/',
        '**/__tests__/',
        'dist/'
      ]
    }
  }
});