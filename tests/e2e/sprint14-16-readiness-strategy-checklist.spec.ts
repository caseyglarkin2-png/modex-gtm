import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('send dialogs expose recipient readiness and checklist controls', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/generated-content', 'Generated Content');
  expect(routable).toBe(true);

  if (await page.getByText(/No generated one-pagers yet/i).count()) {
    await expect(page.getByText(/No generated one-pagers yet/i)).toBeVisible();
    return;
  }

  const sendButtons = page.getByRole('button', { name: /Preview & Send/i });
  if ((await sendButtons.count()) === 0) {
    await expect(page.locator('body')).toContainText(/No recipients|No generated one-pagers/i);
    return;
  }

  const enabledSendButtons = page.locator('button:has-text("Preview & Send"):not([disabled])');
  if ((await enabledSendButtons.count()) === 0) {
    await expect(page.locator('body')).toContainText(/Recipients: 0|no recipients/i);
    return;
  }

  await enabledSendButtons.first().click();
  await expect(page.locator('body')).toContainText(/Readiness floor/i);
  await expect(page.locator('body')).toContainText(/Automated QA Policy|Content QA Checklist/i);
  await page.screenshot({ path: 'test-results/sprint14-16/readiness-checklist-dialog.png', fullPage: true });
});

test('bulk preview exposes send strategy controls and presets', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/generated-content', 'Generated Content');
  expect(routable).toBe(true);

  const selectAll = page.getByRole('button', { name: /Select All Visible/i });
  if ((await selectAll.count()) > 0) {
    await selectAll.click();
  }

  const bulkButton = page.getByRole('button', { name: /Bulk Preview & Queue Send/i });
  if ((await bulkButton.count()) === 0) {
    await expect(page.locator('body')).toContainText(/No generated one-pagers|no recipients/i);
    return;
  }

  await bulkButton.click();
  await expect(page.locator('body')).toContainText(/Recipient Readiness \+ Send Strategy/i);
  await expect(page.locator('body')).toContainText(/Daily Cap/i);
  await page.screenshot({ path: 'test-results/sprint14-16/strategy-controls-dialog.png', fullPage: true });
});

test('campaign analytics shows checklist coverage panel', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/analytics?tab=campaigns', 'Analytics');
  expect(routable).toBe(true);

  await expect(page.locator('body')).toContainText('Content QA Checklist Coverage');
  await page.screenshot({ path: 'test-results/sprint14-16/checklist-analytics.png', fullPage: true });
});
