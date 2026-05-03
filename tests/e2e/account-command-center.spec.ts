import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 180_000 });
test.use({
  launchOptions: {
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  },
});

async function login(page: Page) {
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  await page.request.post('/api/auth/callback/credentials', {
    form: {
      email: 'casey@freightroll.com',
      csrfToken,
      json: 'true',
    },
    maxRedirects: 0,
  });
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test('account detail renders the canonical command center tabs', async ({ page }) => {
  await page.goto('/accounts/general-mills', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'General Mills', level: 1 })).toBeVisible();
  await expect(page.getByText('Account Command Center')).toBeVisible();
  await expect(page.getByText('Next Best Action')).toBeVisible();

  const tabs = ['Overview', 'Contacts', 'Assets', 'Engagement', 'Tasks', 'Meetings', 'Pipeline'];
  for (const tab of tabs) {
    await expect(page.getByRole('tab', { name: new RegExp(tab, 'i') })).toBeVisible();
  }

  await page.getByRole('tab', { name: /Contacts/i }).click();
  await expect(page.getByText(/Lane:/).first()).toBeVisible();

  await page.getByRole('tab', { name: /Assets/i }).click();
  await expect(page.getByText('Meeting Brief')).toBeVisible();
  await expect(page.getByText('Audit Route')).toBeVisible();
  await expect(page.getByText('QR Asset')).toBeVisible();
  await expect(page.getByText('Generated Content')).toBeVisible();

  await page.getByRole('tab', { name: /Engagement/i }).click();
  await expect(page.getByText(/engagement|activity|email|microsite|meeting|capture/i).first()).toBeVisible();

  await page.getByRole('tab', { name: /Tasks/i }).click();
  await expect(page.getByText('Recommended')).toBeVisible();

  await page.getByRole('tab', { name: /Meetings/i }).click();
  await expect(page.getByText(/meeting record|No meetings booked/i).first()).toBeVisible();

  await page.getByRole('tab', { name: /Pipeline/i }).click();
  await expect(page.getByText('Pipeline Stage')).toBeVisible();
  await expect(page.getByText('Outreach Status')).toBeVisible();

  await page.screenshot({ path: 'test-results/account-command-center/general-mills-command-center.png', fullPage: true });
});

test('legacy account asset routes remain directly reachable', async ({ page }) => {
  for (const href of ['/briefs/general-mills', '/audit-routes', '/qr', '/generated-content']) {
    await test.step(href, async () => {
      const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
      expect(response, `No response for ${href}`).not.toBeNull();
      expect(response?.status(), `Unexpected status for ${href}`).toBeLessThan(400);
      await expect(page.locator('body'), `${href} should not be missing`).not.toContainText('Page Not Found');
      await expect(page.locator('body'), `${href} should not crash`).not.toContainText('Application error');
      await expect(page.locator('main').first()).toBeVisible();
    });
  }
});
