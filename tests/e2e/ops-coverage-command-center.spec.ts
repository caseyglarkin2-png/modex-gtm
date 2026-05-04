import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 180_000 });

test('ops coverage and connector tabs render', async ({ page }) => {
  await page.goto('/ops?tab=connector-health', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Connector Health' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Connector Runtime + Ownership');

  await page.goto('/ops?tab=coverage', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Coverage Command Center' })).toBeVisible();
  await expect(page.locator('body')).toContainText('TAM/ICP Coverage + Gate 0');
  await page.screenshot({ path: 'test-results/ops-coverage-command-center/coverage.png', fullPage: true });
});
