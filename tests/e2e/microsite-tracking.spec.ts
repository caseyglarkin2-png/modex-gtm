import { expect, test } from '@playwright/test';

test('frito-lay microsite renders instrumented sections and CTAs', async ({ page }) => {
  const response = await page.goto('/for/frito-lay', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await expect(page.locator('[data-ms-section-id]').first()).toBeVisible();
  await expect(page.locator('[data-ms-cta-id]').first()).toBeVisible();
  await expect(page.locator('[data-ms-variant-link]').first()).toBeVisible();
});