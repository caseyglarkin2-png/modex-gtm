import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 180_000 });

const artifactDir = join(process.cwd(), 'test-results', 'revops-ui-baseline');

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

async function capture(page: Page, name: string) {
  mkdirSync(artifactDir, { recursive: true });
  await page.screenshot({
    path: join(artifactDir, `${name}.png`),
    fullPage: true,
  });
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('captures current desktop navigation and core workspace baselines', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Generated Content' })).toBeVisible();
  await capture(page, 'desktop-expanded-sidebar-generated-content');

  await page.getByRole('button', { name: /Collapse sidebar/i }).click();
  await expect(page.getByRole('button', { name: /Expand sidebar/i })).toBeVisible();
  await capture(page, 'desktop-collapsed-sidebar-generated-content');

  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  });
  await expect(page.getByPlaceholder('Search accounts, personas, pages...')).toBeVisible();
  await capture(page, 'desktop-command-palette');
});

test('captures current mobile navigation baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Generated Content' })).toBeVisible();

  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await capture(page, 'mobile-navigation-sheet');
});

test('captures current high-value workspace baselines', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  const pages = [
    { path: '/accounts/general-mills', heading: /General Mills/i, name: 'account-detail-general-mills' },
    { path: '/campaigns', heading: 'Campaigns', name: 'campaigns-index' },
    { path: '/studio', heading: /Studio/i, name: 'creative-studio' },
    { path: '/capture', heading: /Mobile Capture|Capture/i, name: 'quick-capture-current' },
    { path: '/contacts', heading: /Contacts/i, name: 'contacts-current' },
  ];

  for (const item of pages) {
    await page.goto(item.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Page Not Found');
    await expect(page.locator('h1').first()).toContainText(item.heading);
    await capture(page, item.name);
  }
});
