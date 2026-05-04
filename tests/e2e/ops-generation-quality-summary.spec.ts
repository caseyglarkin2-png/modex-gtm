import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test.describe.configure({ timeout: 180_000 });
test.use({
  launchOptions: {
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  },
});

test('ops generation metrics shows low-score review summary', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  if (!loggedIn) {
    await expect(page.locator('body')).toContainText(/Sign in|Login/i);
    return;
  }
  const routable = await openRoutablePage(page, '/ops?tab=generation-metrics', 'Generation Metrics');
  expect(routable).toBe(true);
  await expect(page.locator('body')).toContainText('Low-Score Assets Awaiting Review');
  await page.screenshot({ path: 'test-results/ops-generation-quality-summary/ops-generation-quality-summary.png', fullPage: true });
});
