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

test('pipeline board renders all core stages', async ({ page }) => {
  await login(page);
  await page.goto('/pipeline', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toContainText('Pipeline Board');
  await expect(page.locator('body')).toContainText('Targeted');
  await expect(page.locator('body')).toContainText('Contacted');
  await expect(page.locator('body')).toContainText('Engaged');
  await expect(page.locator('body')).toContainText('Meeting');
});
