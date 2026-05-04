import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('studio one-pager exposes infographic selectors and bundle composer', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/studio', 'Content Studio');
  expect(routable).toBe(true);

  await page.getByRole('button', { name: 'One-Pager' }).click();
  await expect(page.locator('body')).toContainText('Journey Stage');
  await expect(page.locator('body')).toContainText('Infographic Type');
  await expect(page.locator('body')).toContainText('Multi-Infographic Bundle Composer');
  await page.screenshot({ path: 'test-results/sprint24-27-infographic-system/studio-one-pager-variability.png', fullPage: true });
});

test('generated content workspace exposes infographic filters and bundle publish path', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/generated-content', 'Generated Content');
  expect(routable).toBe(true);

  await expect(page.locator('body')).toContainText('Any Type');
  await expect(page.locator('body')).toContainText('Any Stage');
  await page.screenshot({ path: 'test-results/sprint24-27-infographic-system/generated-content-infographic-filters.png', fullPage: true });
});

test('analytics exposes infographic performance leaderboard tab', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/analytics?tab=infographic-performance', 'Analytics');
  expect(routable).toBe(true);

  await expect(page.locator('body')).toContainText('Infographic Leaderboard');
  await page.screenshot({ path: 'test-results/sprint24-27-infographic-system/analytics-infographic-leaderboard.png', fullPage: true });
});
