/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/test-setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/e2e/',
        '**/*.d.ts',
      ],
    },
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests')
    },
    deps: {
      inline: [/@testing-library\/jest-dom/],
    },
    reporters: ['verbose'],
    watch: false,
    testTimeout: 10000,
    clearMocks: true,
    restoreMocks: true,
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    pool: 'vmThreads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
});
