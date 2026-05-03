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

test('Campaign detail renders the canonical workspace tabs', async ({ page }) => {
  await page.goto('/campaigns/modex-2026-follow-up', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'MODEX 2026 Follow-Up', level: 1 })).toBeVisible();

  for (const tab of ['Overview', 'Phases', 'Targets', 'Content', 'Engagement', 'Settings']) {
    await expect(page.getByRole('tab', { name: new RegExp(tab, 'i') })).toBeVisible();
  }

  await page.getByRole('tab', { name: /Overview/i }).click();
  await expect(page.getByText('MODEX Saved View')).toBeVisible();

  await page.getByRole('tab', { name: /Phases/i }).click();
  await expect(page.getByText(/progressed/i).first()).toBeVisible();

  await page.getByRole('tab', { name: /Targets/i }).click();
  await expect(page.getByText('Target Cohort')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Readiness' })).toBeVisible();

  await page.getByRole('tab', { name: /Content/i }).click();
  await expect(page.getByRole('link', { name: /Open Filtered Content Studio/i })).toHaveAttribute('href', '/generated-content?campaign=modex-2026-follow-up');

  await page.getByRole('tab', { name: /Engagement/i }).click();
  await expect(page.getByText(/campaign engagement|email|activity/i).first()).toBeVisible();

  await page.getByRole('tab', { name: /Settings/i }).click();
  await expect(page.getByText('Cadence & Automation')).toBeVisible();

  await page.screenshot({ path: 'test-results/campaign-workspace/modex-campaign-workspace.png', fullPage: true });
});

test('legacy waves routes land in the canonical campaign workspace', async ({ page }) => {
  await page.goto('/waves', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/campaigns\/modex-2026-follow-up\?view=phases&legacy=waves$/);
  await expect(page.getByRole('heading', { name: 'MODEX 2026 Follow-Up', level: 1 })).toBeVisible();

  await page.goto('/waves/campaign', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/campaigns\/modex-2026-follow-up\?view=overview&legacy=campaign-hq$/);
  await expect(page.getByText('MODEX Saved View')).toBeVisible();
});

test('Campaign list still opens the campaign workspace', async ({ page }) => {
  await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /Open Campaign/i }).first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/campaigns\//);
  await expect(page.getByRole('tab', { name: /Targets/i })).toBeVisible();
});
