import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Test data
export const TEST_DATA = {
  EMPLOYEE: {
    id: 1,
    name: 'Test Employee',
    seniority_level: 'Senior',
    qualifications: ['JavaScript', 'React', 'Node.js'],
    work_time_factor: 1.0,
    contract_end_date: '2025-12-31'
  },
  PROJECT: {
    id: 1,
    name: 'Test Project',
    project_manager: 'Test Manager',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    status: 'active',
    documentation_links: ['http://example.com/docs']
  }
};

// Extend the base test type with our custom fixtures
export const test = base.extend({
  // Add a custom fixture for API mocking
  page: async ({ page }, use) => {
    // Setup API mocking for employees
    await page.route('**/api/employees', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ json: [TEST_DATA.EMPLOYEE] });
      } else if (method === 'DELETE') {
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    // Setup API mocking for projects
    await page.route('**/api/projects', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ json: [TEST_DATA.PROJECT] });
      } else if (method === 'DELETE') {
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    // Setup API mocking for project archive
    await page.route('**/api/projects/*/archive', async (route) => {
      const projectId = route.request().url().split('/').slice(-2)[0];
      await route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...TEST_DATA.PROJECT,
          id: parseInt(projectId),
          status: 'archived'
        })
      });
    });

    // Setup API mocking for documentation links
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.includes('example.com/docs')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body><h1>Documentation</h1></body></html>'
        });
      } else {
        await route.continue();
      }
    });

    // Add page error handler
    page.on('pageerror', error => {
      console.error('Page error:', error);
    });

    // Add console message handler
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    await use(page);
  }
});

export { expect };

// Helper functions for common test operations
export const waitForTableLoad = async (page: Page) => {
  // Wait for loading state to appear and disappear
  const loadingElement = page.getByText('Loading...');
  try {
    await loadingElement.waitFor({ state: 'visible', timeout: 1000 });
    await loadingElement.waitFor({ state: 'hidden', timeout: 10000 });
  } catch (e) {
    // Loading state might be too quick to catch, that's ok
  }

  // Wait for table to be visible
  await page.waitForSelector('table', { 
    state: 'visible',
    timeout: 10000 
  });
};

export const clearTestData = async (page: Page) => {
  // Clear local storage
  await page.evaluate(() => window.localStorage.clear());
  // Clear session storage
  await page.evaluate(() => window.sessionStorage.clear());
};
