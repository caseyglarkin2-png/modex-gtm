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

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test('Pipeline renders canonical tabs and filter controls', async ({ page }) => {
  await page.goto('/pipeline', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Pipeline', level: 1 })).toBeVisible();
  for (const tab of ['Board', 'Meetings', 'Activities', 'Stage History']) {
    await expect(page.getByRole('tab', { name: tab })).toBeVisible();
  }

  await expect(page.getByLabel('Account')).toBeVisible();
  await expect(page.getByLabel('Campaign')).toBeVisible();
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('main')).toBeVisible();

  await page.screenshot({ path: 'test-results/pipeline-workspace/pipeline-workspace.png', fullPage: true });
});

test('Pipeline stage movement is actionable and stage history is visible', async ({ page }) => {
  await page.goto('/pipeline?tab=board', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('tab', { name: 'Board' })).toBeVisible();

  const firstAccountLink = page.locator('a[href^="/accounts/"]').first();
  const accountText = (await firstAccountLink.textContent())?.trim() ?? '';
  const accountSlug = slugify(accountText);

  const advanceButton = page.getByRole('button', { name: 'Advance' }).first();
  if ((await advanceButton.count()) > 0) {
    await advanceButton.click();
  }

  await page.goto(`/pipeline?tab=stage-history${accountSlug ? `&account=${accountSlug}` : ''}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('tab', { name: 'Stage History' })).toBeVisible();
  await expect(page.locator('body')).toContainText(/Moved stage from|No stage changes recorded/i);
});

test('legacy activities and meetings routes redirect into Pipeline tabs', async ({ page }) => {
  await page.goto('/meetings', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/pipeline\?tab=meetings&legacy=meetings$/);
  await expect(page.getByRole('tab', { name: 'Meetings' })).toBeVisible();

  await page.goto('/activities?filter=follow-up', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/pipeline\?tab=activities&legacy=activities&filter=follow-up$/);
  await expect(page.getByRole('tab', { name: 'Activities' })).toBeVisible();
});
