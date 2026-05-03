import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 240_000 });
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

async function expectHealthyWorkspace(page: Page) {
  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Page Not Found');
  await expect(page.locator('body')).not.toContainText('Application error');
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test('operator can complete canonical RevOps OS journey with consolidated nav', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText(/Home|Daily Cockpit/i);

  const aside = page.locator('aside');
  await expect(aside).toBeVisible();
  for (const label of ['Home', 'Accounts', 'Contacts', 'Campaigns', 'Engagement', 'Work Queue', 'Content Studio', 'Pipeline', 'Analytics', 'Ops']) {
    await expect(aside.getByRole('link', { name: label })).toBeVisible();
  }
  for (const obsolete of ['Dashboard', 'Personas', 'Outreach Waves', 'Campaign HQ', 'Generated Content', 'Creative Studio']) {
    await expect(aside.getByText(obsolete)).toHaveCount(0);
  }
  await page.screenshot({ path: 'test-results/revops-operator-journey/sidebar-consolidated.png', fullPage: true });

  await aside.locator('a[href="/queue"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/queue(?:[?#].*)?$/);
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText(/Work Queue|My Work/i);

  await aside.locator('a[href="/accounts"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/accounts(?:[?#].*)?$/);
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText(/Account|Priority/i);

  const accountLink = page.locator('main a[href^="/accounts/"]').first();
  await expect(accountLink).toBeVisible();
  await accountLink.click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/accounts\/[^/?#]+/);
  await expect(page.locator('main')).toContainText(/Account Command Center|Account/);

  await aside.locator('a[href="/contacts"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/contacts(?:[?#].*)?$/);
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText(/Contacts|Readiness/i);

  await aside.locator('a[href="/campaigns"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/campaigns(?:[?#].*)?$/);
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText(/Campaigns|GTM/i);

  const campaignLink = page.locator('main a[href^="/campaigns/"]').filter({ hasText: /Open|View|Campaign|MODEX/i }).first();
  if (await campaignLink.count()) {
    await campaignLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/campaigns\/[^/?#]+/);
  }

  await aside.locator('a[href="/studio"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/studio(?:[?#].*)?$/);
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText(/Content Studio|Studio/i);

  await aside.locator('a[href="/engagement"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/engagement(?:[?#].*)?$/);
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText(/Engagement|Inbox/i);

  await aside.locator('a[href="/pipeline"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/pipeline(?:[?#].*)?$/);
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText(/Pipeline|Stage/i);

  await aside.locator('a[href="/analytics"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/analytics(?:[?#].*)?$/);
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText(/Analytics|Performance/i);

  await aside.locator('a[href="/ops"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/ops(?:[?#].*)?$/);
  await expectHealthyWorkspace(page);
  await expect(page.locator('body')).toContainText('Proof Ledger');

  await page.screenshot({ path: 'test-results/revops-operator-journey/revops-operator-journey.png', fullPage: true });
});
