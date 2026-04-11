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

test('new campaign page exposes templates', async ({ page }) => {
  await login(page);
  await page.goto('/campaigns/new', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('h1')).toContainText('Create New Campaign');
  await expect(page.locator('body')).toContainText('Trade Show Follow-Up');
  await expect(page.locator('body')).toContainText('Cold Outbound');
});

test('quarterly review and campaign analytics pages load', async ({ page }) => {
  await login(page);

  await page.goto('/analytics/quarterly', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Quarterly Review');
  await expect(page.locator('body')).toContainText('Current Quarter Operating Goals');

  await page.goto('/campaigns/modex-2026-follow-up/analytics', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Campaign Analytics');
  await expect(page.locator('body')).toContainText('Estimated Pipeline');

  await page.goto('/campaigns/modex-2026-follow-up', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Cadence & Automation');
  await expect(page.locator('body')).toContainText('Pause Drip');
  await expect(page.locator('body')).toContainText('Reset Queue');
  await expect(page.locator('body')).toContainText('Campaign Settings');
  await expect(page.locator('body')).toContainText('Save Settings');
  await expect(page.locator('body')).toContainText('Danger Zone');
});
