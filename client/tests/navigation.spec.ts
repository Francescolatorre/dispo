import { test, expect, waitForTableLoad } from './setup/test-setup';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the drawer navigation using a more specific selector
    await expect(page.locator('.MuiDrawer-paper')).toBeVisible();
  });

  test('should navigate through all main routes', async ({ page }) => {
    // Verify Dashboard is loaded
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Willkommen im DispoMVP Dashboard')).toBeVisible();
    
    // Navigate to Projects
    const projectsLink = page.getByRole('link', { name: 'Projekte' });
    await expect(projectsLink).toBeVisible();
    await projectsLink.click();
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('button', { name: 'Neues Projekt' })).toBeVisible();
    
    // Navigate to Employees
    const employeesLink = page.getByRole('link', { name: 'Mitarbeiter' });
    await expect(employeesLink).toBeVisible();
    await employeesLink.click();
    await expect(page).toHaveURL('/employees');
    await waitForTableLoad(page);
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    
    // Navigate to Reports
    const reportsLink = page.getByRole('link', { name: 'Berichte' });
    await expect(reportsLink).toBeVisible();
    await reportsLink.click();
    await expect(page).toHaveURL('/reports');
    
    // Navigate back to Dashboard
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Willkommen im DispoMVP Dashboard')).toBeVisible();
  });

  test('should redirect unknown routes to dashboard', async ({ page }) => {
    await page.goto('/unknown-route');
    // Wait for navigation to complete
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Willkommen im DispoMVP Dashboard')).toBeVisible();
  });

  test('should highlight current navigation item', async ({ page }) => {
    // Helper function to verify selected state
    const verifySelectedLink = async (linkName: string) => {
      const link = page.getByRole('link', { name: linkName });
      // MUI applies selected class to the ListItemButton
      await expect(link).toHaveClass(/Mui-selected/);
    };

    // Check Dashboard selected state
    await verifySelectedLink('Dashboard');
    
    // Navigate to Projects and verify
    await page.getByRole('link', { name: 'Projekte' }).click();
    await verifySelectedLink('Projekte');
    
    // Navigate to Employees and verify
    await page.getByRole('link', { name: 'Mitarbeiter' }).click();
    await verifySelectedLink('Mitarbeiter');
    
    // Navigate to Reports and verify
    await page.getByRole('link', { name: 'Berichte' }).click();
    await verifySelectedLink('Berichte');
  });
});
