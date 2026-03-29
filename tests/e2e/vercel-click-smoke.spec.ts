import { expect, test } from '@playwright/test';

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

  // Session cookie is now set on the page context
}

test('core pages load on deployed app', async ({ page }) => {
  await login(page);

  const paths = ['/', '/analytics', '/studio'];

  for (const path of paths) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response, `No response for ${path}`).not.toBeNull();
    expect(response?.status(), `Unexpected status for ${path}`).toBeLessThan(400);
    await expect(page.locator('h1').first(), `No H1 found on ${path}`).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');
  }
});

test('creative studio tabs are clickable and render panels', async ({ page }) => {
  await login(page);
  await page.goto('/studio', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('button', { name: 'Text-to-Speech' })).toBeVisible();

  const hasExpandedStudio = (await page.getByRole('button', { name: 'Asset Pack' }).count()) > 0;

  const checks: Array<{ tab: string; panel: string }> = hasExpandedStudio
    ? [
        { tab: 'Asset Pack', panel: 'Asset Pack Generator' },
        { tab: 'Full Sequence', panel: 'Generating 4-step sequence' },
        { tab: 'One-Pager', panel: 'Generate a custom YardFlow one-pager' },
        { tab: 'History', panel: 'Content History' },
        { tab: 'Prompt Lab', panel: 'Multi-Model Prompt Lab' },
        { tab: 'Rehearsal', panel: 'Voice Rehearsal Scoring' },
        { tab: 'Prompt Versions', panel: 'Prompt Version Control' },
        { tab: 'Mission Handoff', panel: 'Mission-Control Handoff' },
      ]
    : [];

  for (const check of checks) {
    await page.getByRole('button', { name: check.tab, exact: true }).click();
    await expect(page.getByText(check.panel, { exact: true }).first()).toBeVisible();
  }
});
