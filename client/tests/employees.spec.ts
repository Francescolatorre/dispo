import { test, expect, waitForTableLoad, TEST_DATA } from './setup/test-setup';

test.describe('Employees', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    await waitForTableLoad(page);
  });

  test('should display employees list', async ({ page }) => {
    // Wait for table to be populated
    await expect(page.locator('tbody tr').first()).toBeVisible();

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Seniorität' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Qualifikationen' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Arbeitszeitfaktor' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Vertragsende' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Aktionen' })).toBeVisible();

    // Verify test data is displayed using role selectors
    await expect(page.getByRole('cell', { name: TEST_DATA.EMPLOYEE.name })).toBeVisible();
    await expect(page.getByRole('cell', { name: TEST_DATA.EMPLOYEE.seniority_level })).toBeVisible();
  });

  test('should show loading state', async ({ page }) => {
    // Force loading state by reloading with a delayed response
    await page.route('**/api/employees', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ json: [TEST_DATA.EMPLOYEE] });
    });
    
    await page.reload();
    
    // Verify loading state is shown
    await expect(page.getByText('Loading...')).toBeVisible();
    
    // Wait for data to load
    await expect(page.getByRole('cell', { name: TEST_DATA.EMPLOYEE.name })).toBeVisible();
  });

  test('should handle employee actions', async ({ page }) => {
    // Wait for the table and first row to be visible
    await expect(page.locator('tbody tr').first()).toBeVisible();
    
    // Edit employee
    const editButton = page.getByRole('button', { name: 'Bearbeiten' }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();
    
    // Verify edit modal/form is shown
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Close the dialog before proceeding
    await page.keyboard.press('Escape');
    
    // Delete employee
    const deleteButton = page.getByRole('button', { name: 'Löschen' }).first();
    await expect(deleteButton).toBeVisible();
    
    // Setup dialog handler for confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Are you sure you want to delete this employee?');
      await dialog.accept();
    });
    
    await deleteButton.click();
  });

  test('should display qualifications as chips', async ({ page }) => {
    // Wait for the table to load and first employee to be visible
    await expect(page.locator('tbody tr').first()).toBeVisible();
    
    // Get the qualifications cell from the first row
    const qualificationsCell = page.getByRole('row').first().getByRole('cell').nth(2);
    
    // Verify each qualification is displayed as a chip
    for (const qualification of TEST_DATA.EMPLOYEE.qualifications) {
      // Wait for each chip to be visible
      await expect(
        qualificationsCell.locator('.MuiChip-root', { hasText: qualification })
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should format contract end date correctly', async ({ page }) => {
    // Wait for the table to load
    await expect(page.locator('tbody tr').first()).toBeVisible();
    
    // Get contract end date from test data
    const date = new Date(TEST_DATA.EMPLOYEE.contract_end_date);
    const formattedDate = date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Verify the date is displayed correctly using role selector
    await expect(page.getByRole('cell', { name: formattedDate })).toBeVisible();
  });

  test('should handle error state', async ({ page }) => {
    // Route to return error response
    await page.route('**/api/employees', async (route) => {
      await route.fulfill({ 
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Failed to load employees' })
      });
    });
    
    await page.reload();
    
    // Wait for error message with increased timeout
    await expect(page.getByText('Failed to load employees')).toBeVisible({ timeout: 10000 });
  });

  test('should format work time factor correctly', async ({ page }) => {
    // Wait for the table to load
    await expect(page.locator('tbody tr').first()).toBeVisible();
    
    // Format the expected work time factor
    const formattedFactor = TEST_DATA.EMPLOYEE.work_time_factor.toFixed(2);
    
    // Verify the work time factor is displayed correctly using role selector
    await expect(page.getByRole('cell', { name: formattedFactor })).toBeVisible();
  });
});
