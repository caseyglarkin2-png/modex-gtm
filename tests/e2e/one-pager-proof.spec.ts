import { expect, test } from '@playwright/test';
import { bootstrapOnePagerProof } from './helpers/onepager-proof';

const FAILED_ACCOUNT = 'E2E Failed Logistics';

test.beforeEach(async ({ page }) => {
  await bootstrapOnePagerProof(page);
});

test('queue retry transitions failed job to pending', async ({ page }) => {
  await page.goto('/queue/generations', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Generation Queue' })).toBeVisible();

  await expect(page.locator('body')).toContainText(FAILED_ACCOUNT);
  const retryButtons = page.getByRole('button', { name: /Retry Generation/i });
  const retryCountBefore = await retryButtons.count();

  await expect(retryButtons.first()).toBeVisible();
  await retryButtons.first().click();
  await expect(page.locator('body')).toContainText(/Retry queued|Retrying/i);
  await expect.poll(async () => page.getByRole('button', { name: /Retry Generation/i }).count()).toBeLessThan(retryCountBefore);
});

test('bulk preview enforces guard acknowledgement before enabling queue action', async ({ page }) => {
  await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Generated Content' })).toBeVisible();

  await page.getByPlaceholder('Search accounts/campaigns').fill('E2E Guarded');
  await page.getByRole('checkbox', { name: /E2E Guarded Warehouse/i }).check();
  await page.getByRole('button', { name: /Bulk Preview & Queue Send/i }).click();

  const queueButton = page.getByRole('button', { name: 'Queue Async Send Job' });
  await expect(queueButton).toBeDisabled();
  await page.getByRole('checkbox', { name: /I acknowledge this warning/i }).first().check();
  await expect(queueButton).toBeEnabled();
});

test('bulk enqueue creates send job and opens tracker', async ({ page }) => {
  await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Generated Content' })).toBeVisible();

  await page.getByPlaceholder('Search accounts/campaigns').fill('E2E Guarded');
  await page.getByRole('checkbox', { name: /E2E Guarded Warehouse/i }).check();
  await page.getByRole('button', { name: /Bulk Preview & Queue Send/i }).click();
  await page.getByRole('checkbox', { name: /I acknowledge this warning/i }).first().check();
  await expect(page.getByRole('button', { name: 'Queue Async Send Job' })).toBeEnabled();
  await page.getByRole('button', { name: 'Queue Async Send Job' }).click();

  await expect(page.locator('body')).toContainText(/send job #\d+/i);
});

test('admin metrics reflects seeded queue, send, and failure surfaces', async ({ page }) => {
  await page.goto('/admin/generation-metrics', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Generation Metrics' })).toBeVisible();

  await expect(page.locator('body')).toContainText('Provider Breakdown');
  await expect(page.locator('body')).toContainText('Send Job State');
  await expect(page.locator('body')).toContainText('Potentially Stuck Jobs');
  await expect(page.locator('body')).toContainText(FAILED_ACCOUNT);
  await expect(page.locator('body')).toContainText('jordan.ops+failed@example.com');
});
