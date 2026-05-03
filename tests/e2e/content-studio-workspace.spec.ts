import { expect, test } from '@playwright/test';
import { loginAsCasey } from './helpers/session';

test.describe.configure({ timeout: 180_000 });
test.use({
  launchOptions: {
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  },
});

test.beforeEach(async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test('Content Studio renders canonical tabs and consolidated asset types', async ({ page }) => {
  await page.goto('/studio', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Content Studio', level: 1 })).toBeVisible();

  for (const tab of ['Generate', 'Library', 'Queue', 'Send Readiness', 'Asset Types']) {
    await expect(page.getByRole('tab', { name: tab })).toBeVisible();
  }

  await page.getByRole('tab', { name: 'Library' }).click();
  for (const asset of [
    'Generated Content',
    'Meeting Briefs',
    'Search Strings',
    'Actionable Intel',
    'Audit Routes',
    'QR Assets',
    'Microsites',
    'Proposals',
  ]) {
    await expect(page.getByText(asset).first()).toBeVisible();
  }
  await expect(page.getByRole('link', { name: /Generated Content/i })).toHaveAttribute('href', '/generated-content');
  await expect(page.getByRole('link', { name: /Microsites/i }).first()).toHaveAttribute('href', /\/for\/.+/);
  await expect(page.getByRole('link', { name: /Proposals/i }).first()).toHaveAttribute('href', /\/proposal\/.+/);

  await page.getByRole('tab', { name: 'Queue' }).click();
  await expect(page.getByRole('link', { name: /Open Generation Queue/i })).toHaveAttribute('href', '/queue/generations');

  await page.getByRole('tab', { name: 'Send Readiness' }).click();
  await expect(page.getByRole('link', { name: /Review Generated Content/i })).toHaveAttribute('href', '/generated-content');

  await page.getByRole('tab', { name: 'Asset Types' }).click();
  for (const asset of ['Generation Jobs', 'Meeting Briefs', 'Search Strings', 'Audit Routes', 'QR Assets', 'Proposals']) {
    await expect(page.getByText(asset).first()).toBeVisible();
  }
  await expect(page.getByText('Owner: Content Studio').first()).toBeVisible();

  await page.screenshot({ path: 'test-results/content-studio-workspace/content-studio.png', fullPage: true });
});

test('legacy content routes remain reachable under the Content Studio consolidation', async ({ page }) => {
  const routes = [
    { path: '/generated-content', heading: /Generated Content/i, body: /Content Studio \/ Library/i },
    { path: '/queue/generations', heading: /Generation Queue/i, body: /Content Studio Queue/i },
    { path: '/briefs', heading: /Meeting Briefs/i, body: /Brief Library/i },
    { path: '/search', heading: /Search Strings/i, body: /Query Library/i },
    { path: '/intel', heading: /Actionable Intel/i, body: /Intel Action Board/i },
    { path: '/audit-routes', heading: /Audit Routes/i, body: /Route Library/i },
    { path: '/qr', heading: /QR Assets/i, body: /QR Asset Library/i },
  ];

  for (const route of routes) {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toContainText(route.heading);
    await expect(page.locator('body')).toContainText(route.body);
  }
});
