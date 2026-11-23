/**
 * E2E smoke suite (local data source, seeded data, real Chromium).
 *
 * Every test starts from a fresh seed: localStorage is cleared before the app boots.
 * Run: `npm run test:e2e` (starts the Vite dev server with VITE_DATA_SOURCE=local).
 */
import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Only on the first load of a test, so a reload inside a test keeps its data.
    if (!sessionStorage.getItem('e2e-seeded')) {
      localStorage.clear();
      sessionStorage.setItem('e2e-seeded', '1');
    }
  });
});

const bodyRows = (page: Page) => page.locator('[role="grid"] [role="row"][data-employee-id]');

async function openBoard(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Planung' })).toBeVisible();
  await expect(page.getByRole('grid', { name: /Planungsboard/ })).toBeVisible();
}

test('loads the board with the seeded people', async ({ page }) => {
  await openBoard(page);
  await expect(bodyRows(page)).toHaveCount(13); // 14 seeded, 1 inactive hidden
  await expect(page.getByTestId('row-count')).toContainText('13 von 13 Personen');
  await expect(bodyRows(page).filter({ hasText: 'Anna Schmidt' })).toHaveCount(1);
  await expect(page.getByTestId('data-source')).toHaveAccessibleName('Datenquelle: Lokale Daten');
});

test('the "überbucht" chip reduces the rows to overbooked people', async ({ page }) => {
  await openBoard(page);
  await expect(bodyRows(page)).toHaveCount(13);
  const chip = page.getByRole('button', { name: /überbuchte Personenwoche/ });
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(bodyRows(page)).toHaveCount(1);
  await expect(bodyRows(page).first()).toContainText('Jonas Fischer');

  await chip.click();
  await expect(bodyRows(page)).toHaveCount(13);
});

test('dragging a bar one week moves it, Rückgängig restores it', async ({ page }) => {
  await openBoard(page);
  const lukas = bodyRows(page).filter({ hasText: 'Lukas Müller' });
  const bar = lukas.getByRole('button', { name: /^Lukas Müller: Mobile App 2\.0/ });
  const before = await bar.getAttribute('aria-label');
  expect(before).toBeTruthy();

  // One column = one week; measure it from the week header.
  const header = page.locator('[role="columnheader"][data-week-key]').nth(4);
  const columnWidth = (await header.boundingBox())!.width;

  // Grab the bar's right part (clear of the resize handle and the sticky name column).
  const box = (await bar.boundingBox())!;
  const x = box.x + box.width - 40;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + (columnWidth * i) / 8, y);
  await expect(page.getByTestId('drag-ghost')).toBeVisible();
  await page.mouse.up();

  const toast = page.getByTestId('action-toast');
  await expect(toast).toContainText('Einsatz verschoben');
  const moved = lukas.getByRole('button', { name: /^Lukas Müller: Mobile App 2\.0/ });
  await expect(moved).not.toHaveAttribute('aria-label', before!);

  await toast.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(lukas.getByRole('button', { name: /^Lukas Müller: Mobile App 2\.0/ })).toHaveAttribute('aria-label', before!);
});

test('editing a capacity on the people page shows the overbooking warning', async ({ page }) => {
  await openBoard(page);
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Personen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Personen' })).toBeVisible();

  await page.getByRole('button', { name: 'Lukas Müller bearbeiten' }).click();
  const drawer = page.getByRole('dialog', { name: 'Person bearbeiten' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByTestId('dry-run-warning')).toHaveCount(0);

  await drawer.getByRole('slider', { name: 'Kapazität' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(drawer.getByTestId('capacity-value')).toHaveText('90 %');
  await expect(drawer.getByTestId('dry-run-warning')).toContainText('Überbucht in KW');

  await drawer.getByRole('button', { name: 'Speichern' }).click();
  await expect(drawer).toBeHidden();
  const row = page.getByRole('table', { name: 'Personen' }).locator('tbody tr', { hasText: 'Lukas Müller' });
  await expect(row).toContainText('90 %');
});

test.describe('WebMCP', () => {
  test.beforeEach(async ({ page }) => {
    // Stub of the browser's WebMCP API that records the registered tools.
    await page.addInitScript(() => {
      const tools: Record<string, { execute: (input: Record<string, unknown>) => Promise<unknown> }> = {};
      Object.assign(window, { __webmcpTools: tools });
      Object.defineProperty(document, 'modelContext', {
        configurable: true,
        value: {
          registerTool(tool: { name: string; execute: (input: Record<string, unknown>) => Promise<unknown> }) {
            tools[tool.name] = tool;
          },
        },
      });
    });
  });

  test('registers the 8 planning tools and find_free_capacity returns candidates', async ({ page }) => {
    await openBoard(page);
    await expect(page.getByTestId('webmcp-status')).toBeVisible();

    const names = await page.evaluate(() => Object.keys((window as unknown as { __webmcpTools: object }).__webmcpTools).sort());
    expect(names).toEqual([
      'create_assignment',
      'delete_assignment',
      'find_free_capacity',
      'get_workload',
      'list_employees',
      'list_projects',
      'undo_last_change',
      'update_assignment',
    ]);

    const result = await page.evaluate(async () => {
      const tools = (window as unknown as { __webmcpTools: Record<string, { execute: (i: object) => Promise<unknown> }> }).__webmcpTools;
      return (await tools.find_free_capacity.execute({ minFreePercent: 20 })) as {
        ok: boolean;
        count: number;
        candidates: Array<{ name: string; minFreePercent: number }>;
      };
    });
    expect(result.ok).toBe(true);
    expect(result.count).toBeGreaterThan(0);
    expect(result.candidates).toHaveLength(result.count);
    for (const c of result.candidates) expect(c.minFreePercent).toBeGreaterThanOrEqual(20);
  });
});
