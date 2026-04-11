import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  // Get CSRF token from NextAuth
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  // Authenticate via credentials provider directly
  await page.request.post('/api/auth/callback/credentials', {
    form: {
      email: 'casey@freightroll.com',
      csrfToken,
      json: 'true',
    },
  });
}

test.describe('Full Platform Audit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard loads and shows key metrics', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('body')).toContainText('Target');
    await expect(page.locator('body')).toContainText('Pipeline');
    await expect(page.locator('body')).toContainText('Execution Pulse');
    await expect(page.locator('body')).toContainText("Today's Focus");
  });

  test('Accounts page: table, search, add account', async ({ page }) => {
    await page.goto('/accounts');
    await expect(page.locator('body')).toContainText('All target accounts');
    await expect(page.locator('body')).toContainText('Priority Triage Board');
    await expect(page.locator('body')).toContainText('Needs outreach');

    // Check table loaded
    await expect(page.locator('table')).toBeVisible();

    // Check add account button exists
    await expect(page.getByRole('button', { name: /Add Account/i })).toBeVisible();
  });

  test('Account detail page: tabs and AI actions', async ({ page }) => {
    await page.goto('/accounts');
    // Click first account row
    await page.locator('table tbody tr').first().click();

    // Check hero card
    await expect(page.locator('body')).toContainText('Score:');

    // Check AI action buttons exist (flexible text matching)
    await expect(page.locator('body')).toContainText('One-Pager');
    await expect(page.locator('body')).toContainText('Outreach');

    // Check tabs exist
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Personas/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Waves/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Brief/i })).toBeVisible();

    // Click through tabs
    await page.getByRole('tab', { name: /Personas/i }).click();
    await expect(page.locator('body')).toContainText('Personas');
  });

  test('Queue page: captures and actions', async ({ page }) => {
    await page.goto('/queue');
    await expect(page.locator('body')).toContainText('Queue');
    await expect(page.locator('body')).toContainText('Follow-Up Sprint Board');
    await expect(page.locator('body')).toContainText('Ready to work');
  });

  test('Activities page: activity log', async ({ page }) => {
    await page.goto('/activities');
    await expect(page.locator('body')).toContainText('Activities');
    await expect(page.locator('body')).toContainText('outreach and engagement');
    await expect(page.locator('body')).toContainText('Execution Queue');
    await expect(page.locator('body')).toContainText('Due this week');
  });

  test('Meetings page: table and book meeting', async ({ page }) => {
    await page.goto('/meetings');
    await expect(page.locator('h1').first()).toContainText('Meetings');
    await expect(page.getByRole('button', { name: /Book Meeting/i })).toBeVisible();
    await expect(page.locator('body')).toContainText('Meeting Prep Queue');
    await expect(page.locator('body')).toContainText('Upcoming This Week');
  });

  test('Personas page: list view', async ({ page }) => {
    await page.goto('/personas');
    await expect(page.locator('body')).toContainText('Personas');
  });

  test('Intel page: actionable intel list', async ({ page }) => {
    await page.goto('/intel');
    await expect(page.locator('body')).toContainText('Actionable Intel');
  });

  test('Briefs page: meeting briefs grid', async ({ page }) => {
    await page.goto('/briefs');
    await expect(page.locator('h1')).toContainText('Meeting Briefs');
    await expect(page.locator('body')).toContainText('Prep Priority Board');
    await expect(page.locator('body')).toContainText('Coverage Gap');
  });

  test('Waves page: campaign waves', async ({ page }) => {
    await page.goto('/waves');
    await expect(page.locator('h1')).toContainText('Outreach Waves');
    await expect(page.locator('body')).toContainText('Wave 0');
  });

  test('Analytics page: KPIs and metrics', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('h1')).toContainText('Analytics');
    await expect(page.locator('body')).toContainText('Emails Sent');
    await expect(page.locator('body')).toContainText('Open Rate');
    await expect(page.locator('body')).toContainText('Pipeline');

    // Check email analytics link
    await expect(page.getByRole('button', { name: /Email Analytics/i })).toBeVisible();
  });

  test('Email Analytics page loads', async ({ page }) => {
    await page.goto('/analytics/emails');
    await expect(page.locator('h1')).toContainText('Email Analytics');
    await expect(page.locator('body')).toContainText('Total Sent');
    await expect(page.locator('body')).toContainText('Delivery Rate');
    await expect(page.locator('body')).toContainText('Open Rate');
    await expect(page.locator('body')).toContainText('Bounce Rate');
  });

  test('Studio page: all tabs render', async ({ page }) => {
    await page.goto('/studio');
    await expect(page.locator('h1')).toContainText('Studio');

    const tabs = [
      'Asset Pack',
      'Full Sequence',
      'One-Pager',
      'History',
      'Prompt Lab',
      'Rehearsal',
      'Prompt Versions',
      'Mission Handoff',
    ];

    for (const tab of tabs) {
      await expect(page.getByRole('button', { name: tab, exact: true }).first()).toBeVisible();
    }
  });

  test('Search page loads', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('body')).toContainText('Search');
  });

  test('Capture page loads', async ({ page }) => {
    await page.goto('/capture');
    await expect(page.locator('body')).toContainText('Capture');
  });

  test('QR page loads', async ({ page }) => {
    await page.goto('/qr');
    await expect(page.locator('body')).toContainText('QR');
  });

  test('Audit Routes page loads', async ({ page }) => {
    await page.goto('/audit-routes');
    await expect(page.locator('body')).toContainText('Routes');
  });

  test('Navigation: all nav links work', async ({ page }) => {
    await page.goto('/');

    const navLinks = [
      { text: 'Dashboard', url: '/' },
      { text: 'Accounts', url: '/accounts' },
      { text: 'Queue', url: '/queue' },
      { text: 'Activities', url: '/activities' },
      { text: 'Meetings', url: '/meetings' },
      { text: 'Analytics', url: '/analytics' },
      { text: 'Studio', url: '/studio' },
    ];

    for (const link of navLinks) {
      await page.getByRole('link', { name: link.text }).click();
      await expect(page).toHaveURL(new RegExp(link.url));
    }
  });
});
