import { expect, test, type Page } from '@playwright/test';
import { bootstrapAccountCommandCenterProof } from './helpers/onepager-proof';
import { evaluateAccountCommandCenterPerformance } from '@/lib/proof/account-command-center-performance';
import { buildSeededAccountContentContext } from '@/lib/proof/account-command-center-fixture';

test.describe.configure({ timeout: 180_000 });

async function login(page: Page) {
  let authenticated = false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const csrfRes = await page.request.get('/api/auth/csrf').catch(() => null);
    const contentType = csrfRes?.headers()['content-type'] ?? '';
    if (!csrfRes?.ok() || !contentType.includes('application/json')) {
      await page.waitForTimeout(1000);
      continue;
    }

    const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
    if (!csrfToken) {
      await page.waitForTimeout(1000);
      continue;
    }

    await page.request.post('/api/auth/callback/credentials', {
      form: {
        email: 'casey@freightroll.com',
        csrfToken,
        json: 'true',
      },
      maxRedirects: 0,
    }).catch(() => null);
    authenticated = true;
    break;
  }

  expect(authenticated).toBe(true);
}

test('account page stays within operator-fast interaction budgets', async ({ page }) => {
  await login(page);
  await bootstrapAccountCommandCenterProof(page);

  await page.route('**/api/agent-actions', async (route) => {
    const payload = route.request().postDataJSON() as { action?: string };
    if (payload.action !== 'content_context') {
      await route.fallback();
      return;
    }

    const refreshed = buildSeededAccountContentContext(new Date('2026-05-05T14:00:00.000Z'));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(refreshed),
    });
  });

  const initialStart = Date.now();
  await page.goto('/accounts/e2e-boston-beer-company', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'E2E Boston Beer Company', level: 1 })).toBeVisible();
  const initialLoadMs = Date.now() - initialStart;

  const refreshStart = Date.now();
  const refreshResponse = page.waitForResponse((response) => (
    response.url().includes('/api/agent-actions') && response.request().method() === 'POST'
  ));
  await page.getByRole('button', { name: 'Refresh Intel' }).click();
  await refreshResponse;
  await expect(page.getByRole('button', { name: 'Refresh Intel' })).toBeVisible();
  const refreshMs = Date.now() - refreshStart;

  const composeStart = Date.now();
  await page.getByRole('button', { name: 'Compose Outreach' }).click();
  await expect(page.getByText(/Outreach Shell/i)).toBeVisible();
  const composeOpenMs = Date.now() - composeStart;

  await page.getByRole('button', { name: 'Close' }).first().click();
  await page.getByRole('tab', { name: /Engagement/i }).click();

  const trackerRefreshStart = Date.now();
  await page.getByRole('button', { name: 'Refresh' }).first().click();
  await expect(page.getByText(/Job #/i).first()).toBeVisible();
  const trackerRefreshMs = Date.now() - trackerRefreshStart;

  const evaluation = evaluateAccountCommandCenterPerformance([
    { metric: 'initial_page_load_ms', durationMs: initialLoadMs },
    { metric: 'intel_refresh_ms', durationMs: refreshMs },
    { metric: 'compose_open_ms', durationMs: composeOpenMs },
    { metric: 'send_job_refresh_ms', durationMs: trackerRefreshMs },
  ]);

  expect(evaluation.pass, JSON.stringify(evaluation.failures, null, 2)).toBe(true);
});
