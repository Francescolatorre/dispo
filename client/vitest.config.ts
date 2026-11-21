import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Playwright e2e specs live in ./tests and run via `npm run test:e2e`, never in vitest.
    exclude: ['node_modules/**', 'dist/**', 'tests/**'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['src/test/**', '**/*.d.ts', '**/*.test.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
