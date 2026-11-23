import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config (specs live in ./tests; `npm run test:e2e`).
 *
 * Default: only the Vite dev server, pinned to the in-browser data source
 * (`VITE_DATA_SOURCE=local`) — no database or API needed, every test starts from the seed.
 *
 * `E2E_DATA_SOURCE=api npx playwright test` additionally starts the REST API from the repo root
 * (`node server/index.js`, needs Postgres: `npm run db:up && npm run db:migrate` there) and pins the
 * client to it. Vite proxies `/api` to http://localhost:3001 (see vite.config.ts).
 *
 * See https://playwright.dev/docs/test-configuration.
 */
const useApi = process.env.E2E_DATA_SOURCE === 'api';
const PORT = 5173;
const baseURL = `http://localhost:${PORT}`;

const vite = {
  command: `npm run dev -- --port ${PORT} --strictPort`,
  url: baseURL,
  env: { VITE_DATA_SOURCE: useApi ? 'api' : 'local' },
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
};

const api = {
  command: 'node server/index.js',
  cwd: '..',
  url: 'http://localhost:3001/api/health',
  reuseExistingServer: !process.env.CI,
  timeout: 60 * 1000,
};

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: !useApi, // a shared database needs serial tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI || useApi ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: useApi ? [api, vite] : [vite],
});
