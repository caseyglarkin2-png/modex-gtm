import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('generation queue renders jobs and retry controls', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  test.skip(!loggedIn, 'Auth endpoints are not available for this base URL/environment.');

  const routable = await openRoutablePage(page, '/queue/generations', 'Generation Queue');
  test.skip(!routable, 'Route not deployed on this base URL yet.');

  await expect(page.locator('body')).toContainText('Job List');
  const workspaceLinks = page.getByRole('link', { name: /Generated Content Workspace|Open Workspace/i });
  if ((await workspaceLinks.count()) > 0) {
    await expect(workspaceLinks.first()).toBeVisible();
  }

  const retryButtons = page.getByRole('button', { name: /Retry Generation/i });
  const retryCount = await retryButtons.count();
  test.skip(retryCount === 0, 'No failed retryable jobs are currently visible.');

  const allowMutation = process.env.PLAYWRIGHT_ALLOW_MUTATION === '1';
  if (!allowMutation) {
    await expect(retryButtons.first()).toBeVisible();
    return;
  }

  await retryButtons.first().click();
  await expect(page.locator('body')).toContainText(/Retry queued|Retrying/i);
});
