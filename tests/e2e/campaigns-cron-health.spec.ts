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

test('campaigns page renders active campaign data', async ({ page }) => {
  await login(page);
  await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toContainText('Campaigns');
  await expect(page.locator('body')).toContainText('MODEX 2026 Follow-Up');
  await expect(page.locator('body')).toContainText('Year-round GTM mode');
});

test('cron health page renders telemetry cards', async ({ page }) => {
  await login(page);
  await page.goto('/admin/crons', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toContainText('Cron Health');
  await expect(page.locator('body')).toContainText('Inbox Polling');
  await expect(page.locator('body')).toContainText('HubSpot Sync');
});
