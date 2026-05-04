import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('engagement exposes regenerate-from-signal action', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/engagement?tab=inbox', 'Engagement');
  expect(routable).toBe(true);

  const regenerateButtons = page.getByRole('button', { name: 'Regenerate from Signal' });
  if ((await regenerateButtons.count()) === 0) {
    await expect(page.locator('body')).toContainText(/No replies|No microsite sessions|No recent activity/i);
    return;
  }

  await regenerateButtons.first().click();
  await expect(page).toHaveURL(/generated-content/);
  await expect(page.locator('body')).toContainText(/Regenerate from/i);
  await page.screenshot({ path: 'test-results/sprint18-learning-loop/engagement-regenerate-action.png', fullPage: true });
});

test('generated content supports side-by-side diff modal', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/generated-content', 'Generated Content');
  expect(routable).toBe(true);

  const diffButtons = page.getByRole('button', { name: /Diff v/i });
  if ((await diffButtons.count()) === 0) {
    await expect(page.locator('body')).toContainText(/No generated one-pagers yet/i);
    return;
  }

  await diffButtons.first().click();
  await expect(page.locator('body')).toContainText(/content diff/i);
  await page.screenshot({ path: 'test-results/sprint18-learning-loop/generated-content-diff-modal.png', fullPage: true });
});

test('work queue exposes learning review workflow tab', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/queue?tab=learning-review', 'Work Queue');
  expect(routable).toBe(true);

  await expect(page.locator('body')).toContainText('Learning Review');
  await page.screenshot({ path: 'test-results/sprint18-learning-loop/queue-learning-review.png', fullPage: true });
});
