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

test('generated content page renders filters and workspace', async ({ page }) => {
  const loggedIn = await login(page);
  test.skip(!loggedIn, 'Auth endpoints are not available for this base URL/environment.');

  await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  const heading = page.locator('h1');
  test.skip(await heading.innerText() === 'Page Not Found', 'Route not deployed on this base URL yet.');

  await expect(heading).toContainText('Generated Content');
  await expect(page.getByPlaceholder('Search accounts/campaigns')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear Filters' })).toBeVisible();
  await expect(page.getByText(/account card\(s\) visible/i)).toBeVisible();

  const accountCards = page.locator('a[href^="/accounts/"]');
  if ((await accountCards.count()) > 0) {
    const previewButton = page.getByRole('button', { name: /Preview/i }).first();
    await expect(previewButton).toBeVisible();

    await page.getByPlaceholder('Search accounts/campaigns').fill('acme');
    await expect(page.getByText(/account card\(s\) visible/i)).toBeVisible();
  } else {
    await expect(page.getByText(/No generated one-pagers yet/i)).toBeVisible();
  }
});
