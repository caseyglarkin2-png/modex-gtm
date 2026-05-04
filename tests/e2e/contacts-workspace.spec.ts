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
  await expect(page.getByText(/Core workspace for people, enrichment, readiness,? and relationship context\./i)).toBeVisible();
  await expect(page.getByText('TAM / ICP Intake')).toBeVisible();
  await expect(page.getByRole('button', { name: /Import Page/i })).toBeVisible();
  await expect(page.getByLabel('Apollo contact label IDs')).toBeVisible();
  await expect(page.getByLabel('Apollo account label IDs')).toBeVisible();
  await expect(page.getByRole('button', { name: /Show Lists/i })).toBeVisible();
  await expect(page.getByLabel('Contacts CSV file')).toBeVisible();
  await expect(page.getByRole('button', { name: /Import CSV/i })).toBeVisible();
  await expect(page.getByLabel('Add contact')).toBeVisible();

  for (const view of ['All', 'Send Ready', 'Needs Enrichment', 'Blocked / Hold', 'HubSpot Linked', 'Recently Touched']) {
    await expect(page.getByRole('button', { name: new RegExp(view, 'i') })).toBeVisible();
  }

  await page.getByRole('button', { name: /Send Ready/i }).click();
  await expect(page.locator('body')).toContainText(/Send Ready|No results found/);

  await page.getByRole('button', { name: /All/i }).click();
  await page.locator('tbody tr').first().click();
  await expect(page.getByRole('complementary', { name: 'Contact Detail' })).toBeVisible();
  await expect(page.getByText('Readiness').last()).toBeVisible();
  await expect(page.getByText('Relationship Context', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Dossier' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enrich', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Find Same-Company Contacts/i })).toBeVisible();

  await page.screenshot({ path: 'test-results/contacts-workspace/contacts-core-workspace.png', fullPage: false });
});

test('Personas legacy route lands in Contacts', async ({ page }) => {
  await page.goto('/personas', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/contacts\?view=all&legacy=personas$/);
  await expect(page.getByRole('heading', { name: 'Contacts', level: 1 })).toBeVisible();
});

test('Contacts account and campaign links are directly clickable', async ({ page }) => {
  await page.goto('/contacts', { waitUntil: 'domcontentloaded' });
  await page.locator('tbody tr').first().click();

  await page.getByRole('link', { name: 'Open Account' }).click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/accounts\//);
  await expect(page.locator('main').first()).toBeVisible();

  await page.goto('/contacts', { waitUntil: 'domcontentloaded' });
  await page.locator('tbody tr').first().click();
  const campaignLink = page.getByRole('link', { name: 'Open Campaign' });
  await expect(campaignLink).toBeVisible();
  await page.getByRole('link', { name: 'Open Campaign' }).click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/campaigns\//);
  await expect(page.locator('main').first()).toBeVisible();
});
