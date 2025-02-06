import { test, expect, waitForTableLoad } from './setup/test-setup';

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await waitForTableLoad(page);
  });

  test('should display projects list', async ({ page }) => {
    // Wait for table to be populated
    await expect(page.locator('tbody tr').first()).toBeVisible();

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Projektleiter' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Zeitraum' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Dokumentation' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Aktionen' })).toBeVisible();
  });

  test('should handle empty projects state', async ({ page }) => {
    // Route to return empty projects array
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.reload();
    await expect(page.getByText('No projects found')).toBeVisible();
  });

  test('should perform project actions', async ({ page }) => {
    // Mock the archive API call
    await page.route('**/api/projects/*/archive', async (route) => {
      const projectId = route.request().url().split('/').slice(-2)[0];
      await route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: parseInt(projectId),
          status: 'archived'
        })
      });
    });

    // Wait for the table and first row to be visible
    await expect(page.locator('tbody tr').first()).toBeVisible();
    
    // Edit project
    const editButton = page.getByRole('button', { name: 'Bearbeiten' }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();
    
    // Verify edit modal/form is shown
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Close the dialog before proceeding
    await page.keyboard.press('Escape');
    
    // Archive project
    const archiveButton = page.getByRole('button', { name: 'Archivieren' }).first();
    await expect(archiveButton).toBeVisible();
    await archiveButton.click();
    
    // Wait for status chip to update with increased timeout
    const statusCell = page.getByRole('row').first().getByRole('cell').nth(3);
    await expect(
      statusCell.locator('.MuiChip-root', { hasText: 'Archiviert' })
    ).toBeVisible({ timeout: 10000 });
    
    // Delete project
    const deleteButton = page.getByRole('button', { name: 'Löschen' }).first();
    await expect(deleteButton).toBeVisible();
    
    // Setup dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });
    
    await deleteButton.click();
  });

  test('should handle documentation links', async ({ page, context }) => {
    // Wait for the table and first row to be visible
    await expect(page.locator('tbody tr').first()).toBeVisible();
    
    // Get the first documentation link
    const docLink = page.getByRole('link', { name: /Link \d+/ }).first();
    await expect(docLink).toBeVisible();
    
    // Mock any document requests
    await page.route('**/*', async route => {
      if (route.request().resourceType() === 'document') {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body>Documentation</body></html>'
        });
      } else {
        await route.continue();
      }
    });
    
    // Click the link and verify new tab
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      docLink.click()
    ]);
    
    await newPage.waitForLoadState();
    await expect(newPage.locator('body')).toContainText('Documentation');
    await newPage.close();
  });

  test('should handle error state', async ({ page }) => {
    // Route to return error response
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ 
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Failed to load projects' })
      });
    });
    
    await page.reload();
    
    // Wait for error message with increased timeout
    await expect(page.getByText('Failed to load projects')).toBeVisible({ timeout: 10000 });
  });

  test.describe('Timeline View', () => {
    test('should toggle between list and timeline views', async ({ page }) => {
      // Initially in list view
      await expect(page.getByRole('table')).toBeVisible();

      // Wait for data to load and switch to timeline view
      await expect(page.getByRole('table')).toBeVisible();
      await page.getByRole('button', { name: 'timeline view' }).click();
      await expect(page.getByRole('table')).not.toBeVisible();
      await page.waitForTimeout(1000); // Wait for timeline to render
      await expect(page.locator('.MuiBox-root').filter({ hasText: /Jan\.|Feb\.|März/ })).toBeVisible();

      // Switch back to list view
      await page.getByRole('button', { name: 'list view' }).click();
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('should display projects in timeline', async ({ page }) => {
      const testProject = {
        id: 1,
        name: 'Test Timeline Project',
        project_number: 'P' + Date.now(),
        start_date: '2025-02-05',
        end_date: '2025-12-31',
        location: 'Test Location',
        fte_count: 1,
        project_manager_id: 1,
        status: 'active',
        documentation_links: ['https://example.com/docs'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock API to return project manager
      await page.route('**/api/employees/1', async (route) => {
        await route.fulfill({ 
          json: {
            id: 1,
            name: 'Test Manager',
            seniority_level: 'Senior',
            level_code: 'S1',
            qualifications: ['Project Management'],
            work_time_factor: 1.0
          }
        });
      });

      // Mock API to return test project
      await page.route('**/api/projects', async (route) => {
        await route.fulfill({ json: [testProject] });
      });
      await page.reload();
      await waitForTableLoad(page);

      // Wait for data to load and switch to timeline view
      await expect(page.getByRole('table')).toBeVisible();
      await page.getByRole('button', { name: 'timeline view' }).click();
      await page.waitForTimeout(1000); // Wait for timeline to render

      // Verify month scale is visible
      const monthScale = page.locator('.MuiBox-root').filter({ hasText: /Feb\. 2025/ });
      await expect(monthScale).toBeVisible();

      // Verify project bar is visible
      const projectBar = page.locator('.MuiPaper-root').filter({ hasText: testProject.name });
      await expect(projectBar).toBeVisible();

      // Hover over project bar to show tooltip
      await projectBar.hover();
      await expect(page.getByText('Test Manager')).toBeVisible();
      await expect(page.getByText('05.02.2025 - 31.12.2025')).toBeVisible();
    });

    test('should handle empty state in timeline view', async ({ page }) => {
      // Route to return empty projects array
      await page.route('**/api/projects', async (route) => {
        await route.fulfill({ json: [] });
      });
      await page.reload();

      // Switch to timeline view
      await page.getByRole('button', { name: 'timeline view' }).click();

      // Verify empty state message
      await expect(page.getByText('No projects to display')).toBeVisible();
    });
  });
});
