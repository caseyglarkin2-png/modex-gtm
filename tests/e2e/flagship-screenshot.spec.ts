import { expect, test } from '@playwright/test';

const screenshotDir = 'screenshots/shareability-audit/s7b-t4';

const routeCases = [
  {
    path: '/for/frito-lay',
    heading: 'Frito-Lay yard execution brief',
    fileStem: 'for-frito-lay',
  },
  {
    path: '/for/frito-lay/bob-fanslow',
    heading: 'Bob, the daily yard scramble is still stealing time from the team.',
    fileStem: 'for-frito-lay-bob-fanslow',
  },
  {
    path: '/proposal/frito-lay',
    heading: 'Frito-Lay yard execution proposal',
    fileStem: 'proposal-frito-lay',
  },
  {
    path: '/for/general-mills',
    heading: 'General Mills yard execution brief',
    fileStem: 'for-general-mills',
  },
  {
    path: '/for/general-mills/zoe-bracey',
    heading: 'Zoe, the customer promise breaks at the dock before it breaks on the shelf.',
    fileStem: 'for-general-mills-zoe-bracey',
  },
  {
    path: '/proposal/general-mills',
    heading: 'General Mills yard execution proposal',
    fileStem: 'proposal-general-mills',
  },
] as const;

const viewportCases = [
  {
    label: 'desktop',
    viewport: { width: 1440, height: 1200 },
  },
  {
    label: 'tablet',
    viewport: { width: 768, height: 1024 },
  },
  {
    label: 'mobile',
    viewport: { width: 390, height: 844 },
  },
] as const;

for (const viewportCase of viewportCases) {
  test(`capture ${viewportCase.label} flagship screenshots`, async ({ page }) => {
    await page.setViewportSize(viewportCase.viewport);

    for (const routeCase of routeCases) {
      const response = await page.goto(routeCase.path, { waitUntil: 'domcontentloaded' });

      expect(response).not.toBeNull();
      expect(response?.status()).toBe(200);

      await expect(page.getByRole('heading', { name: routeCase.heading, exact: true }).first()).toBeVisible();
      await page.waitForLoadState('networkidle', { timeout: 10_000 });

      await page.screenshot({
        path: `${screenshotDir}/${viewportCase.label}-${routeCase.fileStem}.png`,
        fullPage: true,
      });
    }
  });
}