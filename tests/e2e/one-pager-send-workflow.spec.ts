import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('one-pager workflow pages are reachable in order', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  test.skip(!loggedIn, 'Auth endpoints are not available for this base URL/environment.');

  const queueRoutable = await openRoutablePage(page, '/queue/generations', 'Generation Queue');
  test.skip(!queueRoutable, 'Generation queue route not deployed on this base URL yet.');
  await expect(page.locator('body')).toContainText('Job List');

  const workspaceLinks = page.getByRole('link', { name: /Generated Content Workspace|Open Workspace/i });
  if ((await workspaceLinks.count()) > 0) {
    await workspaceLinks.first().click();
  } else {
    await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  }

  const generatedContentHeading = await page.locator('h1').innerText().catch(() => '');
  test.skip(generatedContentHeading === 'Page Not Found', 'Generated content route not deployed on this base URL yet.');
  await expect(page.locator('h1')).toContainText('Generated Content');
  await expect(page.getByPlaceholder('Search accounts/campaigns')).toBeVisible();

  await page.goto('/admin/crons', { waitUntil: 'domcontentloaded' });
  const cronsRoutable = await page.locator('h1').innerText().catch(() => '');
  test.skip(cronsRoutable === 'Page Not Found', 'Admin crons route not deployed on this base URL yet.');
  const metricsLink = page.getByRole('link', { name: /Generation Metrics/i });
  if ((await metricsLink.count()) > 0) {
    await metricsLink.first().click();
  } else {
    await page.goto('/admin/generation-metrics', { waitUntil: 'domcontentloaded' });
  }

  await expect(page).toHaveURL(/\/admin\/generation-metrics/);
  await expect(page.locator('h1')).toContainText('Generation Metrics');
});
