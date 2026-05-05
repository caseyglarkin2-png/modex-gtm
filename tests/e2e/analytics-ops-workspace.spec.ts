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

test('Analytics workspace tabs are clickable', async ({ page }) => {
  await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Analytics' })).toBeVisible();
  const main = page.locator('main');

  await main.locator('a[href="/analytics?tab=campaigns"]').first().click();
  await expect(page).toHaveURL(/\/analytics\?tab=campaigns$/);
  await expect(page.locator('body')).toContainText('Campaign Comparison');

  await main.locator('a[href="/analytics?tab=email-engagement"]').first().click();
  await expect(page).toHaveURL(/\/analytics\?tab=email-engagement$/);
  await expect(page.locator('body')).toContainText('Detailed Email Analytics');
  await expect(page.locator('body')).toContainText('Experiment Tracker');

  await main.locator('a[href="/analytics?tab=pipeline"]').first().click();
  await expect(page).toHaveURL(/\/analytics\?tab=pipeline$/);
  await expect(page.locator('body')).toContainText('Pipeline Funnel');

  await main.locator('a[href="/analytics?tab=quarterly"]').first().click();
  await expect(page).toHaveURL(/\/analytics\?tab=quarterly$/);
  await expect(page.locator('body')).toContainText('Quarterly Review');
});

test('Quarterly legacy route and Ops tabs remain reachable', async ({ page }) => {
  await page.goto('/analytics/quarterly', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Quarterly Review' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Canonical Quarterly Tab' })).toBeVisible();

  await page.goto('/ops', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Proof Ledger' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Latest Sprint Proof');

  await page.getByRole('link', { name: 'Cron Health' }).first().click();
  await expect(page).toHaveURL(/\/ops\?tab=cron-health$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Cron Health' })).toBeVisible();

  await page.getByRole('link', { name: 'Generation Metrics' }).first().click();
  await expect(page).toHaveURL(/\/ops\?tab=generation-metrics$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Generation Metrics' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Open Detailed Generation Metrics');

  await page.getByRole('link', { name: 'Provider Health' }).first().click();
  await expect(page).toHaveURL(/\/ops\?tab=provider-health$/);
  await expect(page.locator('body')).toContainText('Provider Health');

  await page.getByRole('link', { name: 'Feature Flags' }).first().click();
  await expect(page).toHaveURL(/\/ops\?tab=feature-flags$/);
  await expect(page.locator('body')).toContainText('HubSpot sync');

  await page.getByRole('link', { name: 'Connector Health' }).first().click();
  await expect(page).toHaveURL(/\/ops\?tab=connector-health$/);
  await expect(page.locator('body')).toContainText('Connector Runtime + Ownership');

  await page.getByRole('link', { name: 'Coverage' }).first().click();
  await expect(page).toHaveURL(/\/ops\?tab=coverage$/);
  await expect(page.locator('body')).toContainText('TAM/ICP Coverage + Gate 0');

  await page.getByRole('link', { name: 'Account Identity' }).first().click();
  await expect(page).toHaveURL(/\/ops\?tab=account-identity$/);
  await expect(page.locator('body')).toContainText('Duplicate Account Remediation');
  await expect(page.getByRole('link', { name: 'Export JSON' })).toHaveAttribute('href', '/api/revops/account-identity-report?format=json');
  await expect(page.getByRole('link', { name: 'Export CSV' })).toHaveAttribute('href', '/api/revops/account-identity-report?format=csv');

  await page.screenshot({ path: 'test-results/analytics-ops-workspace/analytics-ops-workspace.png', fullPage: true });
});

test('legacy admin routes still work while linking to canonical Ops tabs', async ({ page }) => {
  await page.goto('/admin/crons', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Cron Health' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ops Cron Health' })).toHaveAttribute('href', '/ops?tab=cron-health');

  await page.goto('/admin/generation-metrics', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Generation Metrics' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ops Generation Metrics' })).toHaveAttribute('href', '/ops?tab=generation-metrics');
});
