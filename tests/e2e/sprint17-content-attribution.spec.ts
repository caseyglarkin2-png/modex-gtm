import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('analytics email engagement shows content attribution subviews', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/analytics?tab=email-engagement', 'Analytics');
  expect(routable).toBe(true);

  await expect(page.locator('body')).toContainText('Content Performance Attribution');
  await expect(page.getByRole('button', { name: 'By Variant' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'By Provider' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'By Prompt Template' })).toBeVisible();

  await page.getByRole('button', { name: 'By Provider' }).click();
  await expect(page).toHaveURL(/attributionView=provider/);
  await page.screenshot({ path: 'test-results/sprint17-content-attribution/analytics-attribution.png', fullPage: true });
});

test('campaign analytics shows campaign content attribution card', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  await page.goto('/campaigns/modex-2026-follow-up/analytics', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Campaign Analytics' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Campaign Content Attribution');
  await page.screenshot({ path: 'test-results/sprint17-content-attribution/campaign-attribution.png', fullPage: true });
});
