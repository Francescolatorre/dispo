import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1
      }
    },
    maxConcurrency: 1, // Run tests sequentially
    testTimeout: 30000, // Increase timeout to 30 seconds
    hookTimeout: 30000, // Timeout for hooks
    teardownTimeout: 30000 // Timeout for teardown
  },
});
