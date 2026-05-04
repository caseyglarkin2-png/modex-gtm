import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const emailInput = page.getByPlaceholder('casey@freightroll.com');
  await expect(emailInput).toBeVisible();
  await emailInput.fill('casey@freightroll.com');
  const submit = page.getByRole('button', { name: /Sign in with Email/i });
  await expect(submit).toBeEnabled();
  await submit.click();
  await page.waitForLoadState('networkidle');
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test('email engagement analytics includes experiment tracker panel', async ({ page }) => {
  await page.goto('/analytics?tab=email-engagement', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Analytics' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Detailed Email Analytics');
  await expect(page.locator('body')).toContainText('Experiment Tracker');
});

test('bulk preview exposes variant experiment builder', async ({ page }) => {
  await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Generated Content' })).toBeVisible();

  const selectAllButton = page.getByRole('button', { name: /Select All Visible|Clear Selection/i });
  if ((await selectAllButton.count()) === 0) {
    await expect(page.locator('body')).toContainText(/No generated one-pagers yet/i);
    return;
  }
  await selectAllButton.first().click();

  const bulkButton = page.getByRole('button', { name: /Bulk Preview & Queue Send/i });
  await expect(bulkButton).toBeVisible();
  await bulkButton.click();

  await expect(page.getByRole('heading', { name: 'Bulk Preview' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Variant Experiment Builder');
  await page.getByRole('checkbox', { name: /Enable experiment/i }).check();
  await expect(page.locator('body')).toContainText('Deterministic Allocation Preview');
});
