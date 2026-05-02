import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('generated content bulk preview shows selected items and guard flow', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/generated-content', 'Generated Content');
  expect(routable).toBe(true);

  const selectAllButton = page.getByRole('button', { name: /Select All Visible|Clear Selection/i });
  await expect(selectAllButton).toBeVisible();

  if (await page.getByText(/No generated one-pagers yet/i).count()) {
    await expect(page.getByText(/No generated one-pagers yet/i)).toBeVisible();
    return;
  }

  await page.getByRole('button', { name: /Select All Visible/i }).click();

  const bulkButton = page.getByRole('button', { name: /Bulk Preview & Queue Send/i });
  if ((await bulkButton.count()) === 0) {
    await expect(page.locator('body')).toContainText(/no recipients|No generated one-pagers yet/i);
    return;
  }
  await bulkButton.click();

  await expect(page.getByRole('heading', { name: 'Bulk Preview' })).toBeVisible();
  await expect(page.locator('body')).toContainText(/Review selected generated content/i);

  const acknowledge = page.getByRole('checkbox', { name: /I acknowledge this warning/i });
  if ((await acknowledge.count()) > 0) {
    const queueButton = page.getByRole('button', { name: 'Queue Async Send Job' });
    await expect(queueButton).toBeDisabled();
    await acknowledge.first().check();
    await expect(queueButton).toBeEnabled();
  }
});
