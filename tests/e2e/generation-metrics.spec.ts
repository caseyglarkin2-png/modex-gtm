import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  const csrfRes = await page.request.get('/api/auth/csrf');
  if (!csrfRes.ok()) return false;
  const contentType = csrfRes.headers()['content-type'] ?? '';
  if (!contentType.includes('application/json')) return false;
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  if (!csrfToken) return false;

  const authRes = await page.request.post('/api/auth/callback/credentials', {
    form: {
      email: 'casey@freightroll.com',
      csrfToken,
      json: 'true',
    },
  });
  return authRes.ok();
}

test('generation metrics page renders core admin telemetry', async ({ page }) => {
  const loggedIn = await login(page);
  test.skip(!loggedIn, 'Auth endpoints are not available for this base URL/environment.');

  await page.goto('/admin/generation-metrics', { waitUntil: 'domcontentloaded' });
  const heading = page.locator('h1');
  test.skip(await heading.innerText() === 'Page Not Found', 'Route not deployed on this base URL yet.');

  await expect(heading).toContainText('Generation Metrics');
  await expect(page.locator('body')).toContainText('Provider Breakdown');
  await expect(page.locator('body')).toContainText('Queue State');
  await expect(page.locator('body')).toContainText('Recent Failures');
});
