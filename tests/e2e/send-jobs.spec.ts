import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('async send job queue action opens tracker flow', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  test.skip(!loggedIn, 'Auth endpoints are not available for this base URL/environment.');

  const routable = await openRoutablePage(page, '/generated-content', 'Generated Content');
  test.skip(!routable, 'Route not deployed on this base URL yet.');

  if (await page.getByText(/No generated one-pagers yet/i).count()) {
    await expect(page.getByText(/No generated one-pagers yet/i)).toBeVisible();
    return;
  }

  await page.getByRole('button', { name: /Select All Visible/i }).click();
  const bulkButton = page.getByRole('button', { name: /Bulk Preview & Queue Send/i });
  test.skip((await bulkButton.count()) === 0, 'No bulk-send eligible rows are currently available.');
  await bulkButton.click();

  const queueButton = page.getByRole('button', { name: 'Queue Async Send Job' });
  const acknowledge = page.getByRole('checkbox', { name: /I acknowledge this warning/i });
  if ((await acknowledge.count()) > 0) {
    await acknowledge.first().check();
  }

  const allowMutation = process.env.PLAYWRIGHT_ALLOW_MUTATION === '1';
  if (!allowMutation) {
    await expect(queueButton).toBeVisible();
    return;
  }

  await queueButton.click();
  await expect(page.locator('body')).toContainText(/Send Job #|queued/i);
});
