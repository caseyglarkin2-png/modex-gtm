import { expect, test } from '@playwright/test';
import { loginAsCasey } from './helpers/session';

test('generation metrics page renders core admin telemetry', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  await page.goto('/admin/generation-metrics', { waitUntil: 'domcontentloaded' });
  const heading = page.locator('h1');
  await expect(heading).not.toHaveText('Page Not Found');

  await expect(heading).toContainText('Generation Metrics');
  await expect(page.locator('body')).toContainText('Provider Breakdown');
  await expect(page.locator('body')).toContainText('Queue State');
  await expect(page.locator('body')).toContainText('Send Job State');
  await expect(page.locator('body')).toContainText('Potentially Stuck Jobs');
  await expect(page.locator('body')).toContainText('Recent Failures');
});
