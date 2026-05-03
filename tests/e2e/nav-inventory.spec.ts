import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 180_000 });
test.use({
  launchOptions: {
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  },
});

const canonicalSidebarItems = [
  { label: 'Home', href: '/' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Contacts', href: '/contacts' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Engagement', href: '/engagement' },
  { label: 'Work Queue', href: '/queue' },
  { label: 'Content Studio', href: '/studio' },
  { label: 'Pipeline', href: '/pipeline' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Ops', href: '/ops' },
];

const legacyRoutes = [
  '/personas',
  '/waves',
  '/waves/campaign',
  '/queue/generations',
  '/generated-content',
  '/briefs',
  '/search',
  '/intel',
  '/capture',
  '/audit-routes',
  '/qr',
  '/activities',
  '/meetings',
  '/analytics/quarterly',
  '/admin/crons',
  '/admin/generation-metrics',
];

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

test('canonical sidebar items click through to live routes', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('aside')).toBeVisible();

  for (const item of canonicalSidebarItems) {
    await test.step(item.label, async () => {
      const navLink = page.locator(`aside a[href="${item.href}"]`).first();
      await expect(navLink, `${item.label} sidebar link exists`).toBeVisible();
      await navLink.click();
      await page.waitForLoadState('domcontentloaded');

      await expect(page, `${item.label} URL`).toHaveURL(new RegExp(`${item.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[?#].*)?$`));
      await expect(page.locator('body'), `${item.label} should not be missing`).not.toContainText('Page Not Found');
      await expect(page.locator('body'), `${item.label} should not crash`).not.toContainText('Application error');
      await expect(page.locator('main').first()).toBeVisible();
    });
  }
});

test('legacy routes remain directly reachable during consolidation', async ({ page }) => {
  test.setTimeout(180_000);

  for (const href of legacyRoutes) {
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
