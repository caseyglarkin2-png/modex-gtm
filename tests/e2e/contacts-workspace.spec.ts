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

test('Contacts renders saved views, readiness explanations, detail context, and links', async ({ page }) => {
  await page.goto('/contacts', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Contacts', level: 1 })).toBeVisible();
  await expect(page.getByText('Core workspace for people, enrichment, readiness, and relationship context.')).toBeVisible();

  for (const view of ['All', 'Send Ready', 'Needs Enrichment', 'Blocked / Hold', 'HubSpot Linked', 'Recently Touched']) {
    await expect(page.getByRole('button', { name: new RegExp(view, 'i') })).toBeVisible();
  }

  await page.getByRole('button', { name: /Send Ready/i }).click();
  await expect(page.locator('body')).toContainText(/Send Ready|No results found/);

  await page.getByRole('button', { name: /All/i }).click();
  await page.getByRole('row').nth(1).click();
  await expect(page.getByRole('complementary', { name: 'Contact Detail' })).toBeVisible();
  await expect(page.getByText('Readiness').last()).toBeVisible();
  await expect(page.getByText('Relationship Context', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Account' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Campaign' })).toBeVisible();

  await page.screenshot({ path: 'test-results/contacts-workspace/contacts-core-workspace.png', fullPage: true });
});

test('Personas legacy route lands in Contacts', async ({ page }) => {
  await page.goto('/personas', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/contacts\?view=all&legacy=personas$/);
  await expect(page.getByRole('heading', { name: 'Contacts', level: 1 })).toBeVisible();
});

test('Contacts account and campaign links are directly clickable', async ({ page }) => {
  await page.goto('/contacts', { waitUntil: 'domcontentloaded' });
  await page.getByRole('row').nth(1).click();

  await page.getByRole('link', { name: 'Open Account' }).click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/accounts\//);
  await expect(page.locator('main').first()).toBeVisible();

  await page.goto('/contacts', { waitUntil: 'domcontentloaded' });
  await page.getByRole('row').nth(1).click();
  await page.getByRole('link', { name: 'Open Campaign' }).click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/campaigns\//);
  await expect(page.locator('main').first()).toBeVisible();
});
