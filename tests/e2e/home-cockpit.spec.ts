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

test('Home renders the daily cockpit and routes operators to canonical work surfaces', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Daily Cockpit' })).toBeVisible();
  await expect(page.getByText('Today').first()).toBeVisible();
  await expect(page.getByText('Active Campaigns').first()).toBeVisible();
  await expect(page.getByText('System Health').first()).toBeVisible();
  await expect(page.getByText('Proof Status').first()).toBeVisible();

  await expect(page.getByRole('link', { name: /Open Work Queue/i })).toHaveAttribute('href', '/queue');
  await expect(page.getByRole('link', { name: /Campaigns/i }).first()).toHaveAttribute('href', '/campaigns');
  await expect(page.getByRole('link', { name: /Open Ops health/i })).toHaveAttribute('href', '/ops');
  await expect(page.getByRole('link', { name: /Open proof workspace/i })).toHaveAttribute('href', '/ops');

  await page.screenshot({ path: 'test-results/home-cockpit/home-daily-cockpit.png', fullPage: true });
});

test('Home cockpit quick links click through without leaving the canonical IA', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('link', { name: /Open Work Queue/i }).click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/queue(?:[?#].*)?$/);
  await expect(page.locator('main').first()).toBeVisible();

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /Open proof workspace/i }).click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/ops(?:[?#].*)?$/);
  await expect(page.locator('main').first()).toBeVisible();
});
