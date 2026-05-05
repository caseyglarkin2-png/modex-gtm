import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('generation queue renders jobs and retry controls', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/queue/generations', 'Generation Queue');
  expect(routable).toBe(true);

  await expect(page.locator('body')).toContainText('Job List');
  await expect(page.getByRole('heading', { name: /Generation Queue/i })).toBeVisible();

  const retryButtons = page.getByRole('button', { name: /Retry Generation/i });
  const retryCount = await retryButtons.count();
  if (retryCount === 0) {
    await expect(page.locator('body')).toContainText(/Status:/i);
    return;
  }

  const allowMutation = process.env.PLAYWRIGHT_ALLOW_MUTATION === '1';
  if (!allowMutation) {
    await expect(retryButtons.first()).toBeVisible();
    return;
  }

  await retryButtons.first().click();
  await expect(page.locator('body')).toContainText(/Retry queued|Retrying/i);
});
