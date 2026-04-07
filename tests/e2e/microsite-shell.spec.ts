import { expect, test } from '@playwright/test';

test('account microsite renders the proposal shell frame', async ({ page }) => {
  const response = await page.goto('/for/frito-lay', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByText('Frito-Lay yard execution brief')).toBeVisible();
  await expect(page.getByText('Commercial Thesis')).toBeVisible();
  await expect(page.locator('a[href="#hero-1"]')).toBeVisible();
  await expect(page.locator('[data-ms-cta-id="header-booking"]')).toBeVisible();
});

test('person microsite keeps the mobile booking CTA visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const response = await page.goto('/for/frito-lay/brian-watson', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByText('Brian Watson operating brief')).toBeVisible();
  await expect(page.locator('[data-ms-cta-id="mobile-booking"]')).toBeVisible();
  await expect(page.getByText('Commercial Thesis')).toBeVisible();
});