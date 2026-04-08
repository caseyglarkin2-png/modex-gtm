import { expect, test } from '@playwright/test';

test('account microsite renders the proposal shell frame', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });

  const response = await page.goto('/for/frito-lay', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByText('Frito-Lay yard execution brief')).toBeVisible();
  await expect(page.getByText('Commercial Thesis')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the brief' })).toBeVisible();
  await expect(page.locator('[data-ms-cta-id="header-booking"]')).toBeVisible();

  const heroFrame = await page.locator('[data-ms-shell-frame="hero"]').boundingBox();
  const mainFrame = await page.locator('[data-ms-shell-frame="main"]').boundingBox();

  expect(heroFrame).not.toBeNull();
  expect(mainFrame).not.toBeNull();
  expect(heroFrame?.width ?? 0).toBeGreaterThan(1300);
  expect(mainFrame?.width ?? 0).toBeGreaterThan(1300);
});

test('person microsite keeps the mobile booking CTA visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const response = await page.goto('/for/frito-lay/brian-watson', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByText('Brian Watson operating brief')).toBeVisible();
  await expect(page.locator('[data-ms-cta-id="mobile-booking"]')).toBeVisible();
  await expect(page.locator('[data-ms-mobile-cta="true"]')).toBeVisible();
  await expect(page.getByText('Commercial Thesis')).toBeVisible();

  const mainFrame = await page.locator('[data-ms-shell-frame="main"]').boundingBox();

  expect(mainFrame).not.toBeNull();
  expect(mainFrame?.width ?? 0).toBeLessThanOrEqual(390);
});
