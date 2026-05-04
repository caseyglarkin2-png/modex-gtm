import { expect, test } from '@playwright/test';
import { loginAsCasey } from './helpers/session';

test.describe.configure({ timeout: 240_000 });
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

test('account command center exposes live intel actions and returns contact discovery plus draft output', async ({ page }) => {
  await page.goto('/accounts/john-deere', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Agent Intel')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh Intel' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build Committee' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Find More Contacts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Draft Outreach' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate With Intel' })).toBeVisible();

  await page.getByRole('button', { name: 'Find More Contacts' }).click();
  await expect(page.getByRole('dialog')).toContainText(/Find More Contacts for John Deere/i);
  await expect(page.getByText(/Found \d+ live contacts for John Deere|Loaded live company context for John Deere/i)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Top Contacts')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Draft Outreach' }).click();
  await expect(page.getByRole('dialog')).toContainText(/Draft Outreach for John Deere/i);
  await expect(page.getByText(/draft is ready for John Deere/i)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Draft Preview')).toBeVisible({ timeout: 60_000 });
});

test('one-pager generation keeps live intel on by default from the account surface', async ({ page }) => {
  await page.goto('/accounts/john-deere', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Generate With Intel' }).click();
  await expect(page.getByRole('dialog')).toContainText(/YardFlow One-Pager/i);

  const liveIntelToggle = page.getByLabel('Use latest live intel');
  await expect(liveIntelToggle).toBeChecked();

  await page.getByRole('button', { name: 'Generate One-Pager' }).click();
  await expect(page.getByText(/Context used/i)).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(/YardFlow/i).first()).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole('link', { name: 'Open Workspace' })).toBeVisible();
});
