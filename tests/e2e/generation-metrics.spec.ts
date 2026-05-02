import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  await page.request.post('/api/auth/callback/credentials', {
    form: {
      email: 'casey@freightroll.com',
      csrfToken,
      json: 'true',
    },
  });
}

test('generation metrics page renders core admin telemetry', async ({ page }) => {
  await login(page);
  await page.goto('/admin/generation-metrics', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toContainText('Generation Metrics');
  await expect(page.locator('body')).toContainText('Provider Breakdown');
  await expect(page.locator('body')).toContainText('Queue State');
  await expect(page.locator('body')).toContainText('Recent Failures');
});
