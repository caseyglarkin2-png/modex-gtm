import { expect, test } from '@playwright/test';
import { loginAsCasey } from './helpers/session';

test('generated content page renders filters and workspace', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  await page.goto('/generated-content', { waitUntil: 'domcontentloaded' });
  const heading = page.locator('h1');
  await expect(heading).not.toHaveText('Page Not Found');

  await expect(heading).toContainText('Generated Content');
  await expect(page.getByPlaceholder('Search accounts/campaigns')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear Filters' })).toBeVisible();
  await expect(page.getByText(/account card\(s\) visible/i)).toBeVisible();

  const accountCards = page.locator('a[href^="/accounts/"]');
  if ((await accountCards.count()) > 0) {
    const previewButton = page.getByRole('button', { name: /Preview/i }).first();
    await expect(previewButton).toBeVisible();
    await previewButton.click();
    await expect(page.locator('body')).toContainText(/Preview the selected generated one-pager version/i);
    await page.keyboard.press('Escape');

    await page.getByPlaceholder('Search accounts/campaigns').fill('acme');
    await expect(page.getByText(/account card\(s\) visible/i)).toBeVisible();
  } else {
    await expect(page.getByText(/No generated one-pagers yet/i)).toBeVisible();
  }
});
