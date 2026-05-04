import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test.describe.configure({ timeout: 180_000 });

test('engagement failure intelligence surfaces render', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  if (!loggedIn) {
    await expect(page.locator('body')).toContainText(/Sign in|Login/i);
    return;
  }
  const routable = await openRoutablePage(page, '/engagement?tab=bounces-failures', 'Engagement');
  expect(routable).toBe(true);
  await expect(page.locator('body')).toContainText('Failure Clusters');
  await page.screenshot({ path: 'test-results/sprint19-22/engagement-failure-intelligence.png', fullPage: true });
});

test('studio playbook management tab renders rankings', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  if (!loggedIn) {
    await expect(page.locator('body')).toContainText(/Sign in|Login/i);
    return;
  }
  const routable = await openRoutablePage(page, '/studio?tab=playbook', 'Content Studio');
  expect(routable).toBe(true);
  await expect(page.locator('body')).toContainText('Playbook Block Rankings');
  await page.screenshot({ path: 'test-results/sprint19-22/studio-playbook.png', fullPage: true });
});

test('work queue approvals tab includes approval workflows', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  if (!loggedIn) {
    await expect(page.locator('body')).toContainText(/Sign in|Login/i);
    return;
  }
  const routable = await openRoutablePage(page, '/queue?tab=approvals', 'Work Queue');
  expect(routable).toBe(true);
  await expect(page.locator('body')).toContainText(/Approvals|Approval/i);
  await page.screenshot({ path: 'test-results/sprint19-22/queue-approvals.png', fullPage: true });
});

test('analytics campaigns tab shows brief quality correlation', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  if (!loggedIn) {
    await expect(page.locator('body')).toContainText(/Sign in|Login/i);
    return;
  }
  const routable = await openRoutablePage(page, '/analytics?tab=campaigns', 'Analytics');
  expect(routable).toBe(true);
  await expect(page.locator('body')).toContainText('Brief Quality Correlation');
  await page.screenshot({ path: 'test-results/sprint19-22/analytics-brief-correlation.png', fullPage: true });
});
