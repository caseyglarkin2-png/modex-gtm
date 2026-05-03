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

test('Work Queue renders canonical tabs and unified queue surface', async ({ page }) => {
  await page.goto('/queue', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Work Queue', level: 1 })).toBeVisible();

  for (const tab of ['My Work', 'Follow-ups', 'Captures', 'Approvals', 'System Jobs', 'Stuck/Failed']) {
    await expect(page.getByRole('tab', { name: tab })).toBeVisible();
  }

  await expect(page.getByRole('link', { name: /Quick Capture/i }).first()).toHaveAttribute('href', '/capture');
  await expect(page.getByRole('link', { name: /Legacy Generation Queue/i })).toHaveAttribute('href', '/queue/generations');

  await page.getByRole('tab', { name: /System Jobs/i }).click();
  await expect(page.locator('main')).toContainText(/Generation job|Send job|System Jobs/i);

  await page.getByRole('tab', { name: /Stuck\/Failed/i }).click();
  await expect(page.locator('main')).toContainText(/Stuck|Failed|Escalation|Stuck\/Failed/i);

  await page.screenshot({ path: 'test-results/work-queue/work-queue.png', fullPage: true });
});

test('Work Queue quick actions and legacy generation queue remain reachable', async ({ page }) => {
  await page.goto('/queue?tab=system-jobs', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Work Queue', level: 1 })).toBeVisible();

  const retryButton = page.getByRole('button', { name: 'Retry' }).first();
  if ((await retryButton.count()) > 0) {
    await retryButton.click();
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();
  } else {
    await expect(page.locator('body')).toContainText(/System Jobs|No generation jobs|No delivery failures/i);
  }

  await page.goto('/queue/generations', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Generation Queue', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Work Queue System Jobs/i })).toHaveAttribute('href', '/queue?tab=system-jobs');
});

test('Global Quick Capture action routes to /capture', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const sidebar = page.locator('aside');
  await expect(sidebar.getByRole('link', { name: /Quick Capture/i }).first()).toHaveAttribute('href', '/capture');
  await sidebar.getByRole('link', { name: /Quick Capture/i }).first().click();
  await expect(page).toHaveURL(/\/capture$/);
  await expect(page.getByRole('heading', { name: /Mobile Capture/i, level: 1 })).toBeVisible();
});
