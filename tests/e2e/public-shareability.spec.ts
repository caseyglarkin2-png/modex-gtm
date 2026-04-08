import { expect, test } from '@playwright/test';

const publicRouteCases = [
  {
    label: 'Frito-Lay overview route',
    path: '/for/frito-lay',
    expectedHeading: 'Frito-Lay yard execution brief',
  },
  {
    label: 'Frito-Lay named-person route',
    path: '/for/frito-lay/bob-fanslow',
    expectedHeading: 'Bob, the daily yard scramble is still stealing time from the team.',
  },
  {
    label: 'General Mills overview route',
    path: '/for/general-mills',
    expectedHeading: 'General Mills yard execution brief',
  },
  {
    label: 'General Mills named-person route',
    path: '/for/general-mills/zoe-bracey',
    expectedHeading: 'Zoe, the customer promise breaks at the dock before it breaks on the shelf.',
  },
  {
    label: 'Frito-Lay proposal route',
    path: '/proposal/frito-lay',
    expectedHeading: 'Frito-Lay yard execution proposal',
  },
  {
    label: 'General Mills proposal route',
    path: '/proposal/general-mills',
    expectedHeading: 'General Mills yard execution proposal',
  },
] as const;

const socialImageCases = [
  {
    label: 'Frito-Lay overview social image',
    path: '/for/frito-lay/opengraph-image',
  },
  {
    label: 'Frito-Lay named-person social image',
    path: '/for/frito-lay/bob-fanslow/opengraph-image',
  },
  {
    label: 'General Mills overview social image',
    path: '/for/general-mills/opengraph-image',
  },
  {
    label: 'General Mills named-person social image',
    path: '/for/general-mills/zoe-bracey/opengraph-image',
  },
  {
    label: 'Frito-Lay proposal social image',
    path: '/proposal/frito-lay/opengraph-image',
  },
  {
    label: 'General Mills proposal social image',
    path: '/proposal/general-mills/opengraph-image',
  },
] as const;

for (const routeCase of publicRouteCases) {
  test(`${routeCase.label} stays public without auth session fetches`, async ({ page }) => {
    let authSessionRequests = 0;

    await page.route('**/api/auth/session', async (handlerRoute) => {
      authSessionRequests += 1;
      await handlerRoute.continue();
    });

    const response = await page.goto(routeCase.path, { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { name: routeCase.expectedHeading, exact: true }).first()).toBeVisible();
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    expect(authSessionRequests).toBe(0);
  });
}

for (const imageCase of socialImageCases) {
  test(`${imageCase.label} renders publicly`, async ({ page }) => {
    const response = await page.request.get(imageCase.path);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).byteLength).toBeGreaterThan(1000);
  });
}