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

test('Engagement renders canonical tabs and first-class response workspace', async ({ page }) => {
  await page.goto('/engagement', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Engagement', level: 1 })).toBeVisible();
  await expect(page.getByText('Buyer response, notifications, microsite sessions, and failure triage in one workspace.')).toBeVisible();

  for (const tab of ['Inbox', 'Hot Accounts', 'Microsite Sessions', 'Bounces/Failures', 'Recent Touches']) {
    const tabLocator = page.getByRole('tab', { name: new RegExp(tab, 'i') });
    await expect(tabLocator).toBeVisible();
    await tabLocator.click();
  }

  await page.getByRole('tab', { name: /Inbox/i }).click();
  await expect(page.locator('main').first()).toBeVisible();

  await page.screenshot({ path: 'test-results/engagement-center/engagement-center.png', fullPage: true });
});

test('Engagement triage actions remain actionable from cards when signals exist', async ({ page }) => {
  await page.goto('/engagement?tab=inbox', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Engagement', level: 1 })).toBeVisible();

  const markRead = page.getByRole('button', { name: 'Mark Read' }).first();
  if ((await markRead.count()) > 0) {
    await markRead.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/markRead=/);
  } else {
    await expect(page.locator('body')).toContainText(/No replies or tracked opens\/clicks are available yet|Opened|Clicked|Reply/i);
  }

  const followUp = page.getByRole('button', { name: 'Create Follow-Up' }).first();
  if ((await followUp.count()) > 0) {
    await followUp.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/followUpAccount=/);
    await expect(page.locator('body')).toContainText(/Follow-up created for|Open Activities|Could not create a follow-up/i);
  }

  const openAccount = page.getByRole('button', { name: 'Open Account' }).first();
  if ((await openAccount.count()) > 0) {
    const openAccountLink = openAccount.locator('xpath=ancestor::a[1]');
    await expect(openAccountLink).toHaveAttribute('href', /\/accounts\//);
  }

  await page.goto('/engagement?tab=microsite-sessions', { waitUntil: 'domcontentloaded' });
  const openAsset = page.getByRole('button', { name: 'Open Asset' }).first();
  if ((await openAsset.count()) > 0) {
    const openAssetLink = openAsset.locator('xpath=ancestor::a[1]');
    await expect(openAssetLink).toHaveAttribute('href', /\/for\//);
  } else {
    await expect(page.locator('body')).toContainText(/No microsite sessions are available yet|Microsite/i);
  }
});
