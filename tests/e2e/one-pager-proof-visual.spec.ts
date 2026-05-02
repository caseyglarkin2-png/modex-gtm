import { expect, test } from '@playwright/test';
import { bootstrapOnePagerProof } from './helpers/onepager-proof';

test.beforeEach(async ({ page }) => {
  await bootstrapOnePagerProof(page);
});

test('generated content workspace framing stays visually stable', async ({ page }) => {
  await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Generated Content' })).toBeVisible();

  await page.getByPlaceholder('Search accounts/campaigns').fill('E2E Guarded');
  await page.getByRole('checkbox', { name: /E2E Guarded Warehouse/i }).check();

  const workspaceFrame = page.locator('main').first();
  await expect(workspaceFrame).toHaveScreenshot('one-pager-workspace-frame.png', {
    animations: 'disabled',
    caret: 'hide',
  });
});

test('bulk preview decision surface stays visually stable', async ({ page }) => {
  await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Generated Content' })).toBeVisible();

  await page.getByPlaceholder('Search accounts/campaigns').fill('E2E Guarded');
  await page.getByRole('checkbox', { name: /E2E Guarded Warehouse/i }).check();
  await page.getByRole('button', { name: /Bulk Preview & Queue Send/i }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveScreenshot('one-pager-bulk-preview-frame.png', {
    animations: 'disabled',
    caret: 'hide',
  });
});
