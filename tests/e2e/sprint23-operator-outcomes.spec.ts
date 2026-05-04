import { expect, test } from '@playwright/test';
import { loginAsCasey, openRoutablePage } from './helpers/session';

test('engagement cards expose quick outcome actions and can log one outcome', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/engagement?tab=recent-touches', 'Engagement');
  expect(routable).toBe(true);

  const positiveButtons = page.getByRole('button', { name: 'positive' });
  if ((await positiveButtons.count()) === 0) {
    await expect(page.locator('body')).toContainText(/No recent activity|No replies|No microsite sessions/i);
    return;
  }

  await positiveButtons.first().click();
  await expect(page.locator('body')).toContainText(/Outcome positive logged for/i);
  await page.screenshot({ path: 'test-results/sprint23-operator-outcomes/engagement-outcome-logged.png', fullPage: true });
});

test('analytics shows operator outcome trend dashboard', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/analytics?tab=overview', 'Analytics');
  expect(routable).toBe(true);

  await expect(page.locator('body')).toContainText('Operator Outcome Trends (28d)');
  await expect(page.locator('body')).toContainText('Prompt/Playbook Feedback Weight');
  await page.screenshot({ path: 'test-results/sprint23-operator-outcomes/analytics-outcome-trends.png', fullPage: true });
});

test('work queue includes outcome audit remediation tab', async ({ page }) => {
  const loggedIn = await loginAsCasey(page);
  expect(loggedIn).toBe(true);

  const routable = await openRoutablePage(page, '/queue?tab=outcome-audit', 'Work Queue');
  expect(routable).toBe(true);

  await expect(page.locator('body')).toContainText('Outcome Audit');
  await page.screenshot({ path: 'test-results/sprint23-operator-outcomes/queue-outcome-audit.png', fullPage: true });
});
