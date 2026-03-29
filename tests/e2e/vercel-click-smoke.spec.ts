import { expect, test } from '@playwright/test';

test('core pages load on deployed app', async ({ page }) => {
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
  await page.goto('/studio', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('button', { name: 'Text-to-Speech' })).toBeVisible();

  const hasExpandedStudio = (await page.getByRole('button', { name: 'Asset Pack' }).count()) > 0;

  const checks: Array<{ tab: string; panel: string }> = hasExpandedStudio
    ? [
        { tab: 'Asset Pack', panel: 'Asset Pack Generator' },
        { tab: 'Prompt Lab', panel: 'Multi-Model Prompt Lab' },
        { tab: 'Rehearsal', panel: 'Voice Rehearsal Scoring' },
        { tab: 'Prompt Versions', panel: 'Prompt Version Control' },
        { tab: 'Mission Handoff', panel: 'Mission-Control Handoff' },
        { tab: 'Text-to-Speech', panel: 'Text-to-Speech' },
        { tab: 'Sound Effects', panel: 'Sound Effects Generator' },
        { tab: 'Voice Clone', panel: 'Instant Voice Clone' },
      ]
    : [
        { tab: 'Text-to-Speech', panel: 'Text-to-Speech' },
        { tab: 'Sound Effects', panel: 'Sound Effects Generator' },
        { tab: 'Voice Clone', panel: 'Instant Voice Clone' },
      ];

  for (const check of checks) {
    await page.getByRole('button', { name: check.tab, exact: true }).click();
    await expect(page.getByText(check.panel, { exact: true }).first()).toBeVisible();
  }
});
