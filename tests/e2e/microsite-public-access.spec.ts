import { expect, test } from '@playwright/test';

/**
 * M1.4 — public-access smoke for the YNS microsite.
 *
 * Asserts that yardflow.ai/for/[account] resolves to the modex-gtm-rendered
 * microsite via the flow-state-klbt next.config.js rewrite. This crosses two
 * Vercel projects (yardflow.ai → flow-state-klbt → modex-gtm proxy), so it
 * runs against the production yardflow.ai host directly rather than the
 * modex-gtm baseURL fixture.
 *
 * The modex-gtm side (where this spec lives) is also asserted independently
 * — /for/[account] must be fully public there (no auth gate) for the rewrite
 * to render anything.
 */

const PROD_PUBLIC_HOST = process.env.YARDFLOW_PUBLIC_BASE_URL ?? 'https://yardflow.ai';
const PROD_INTERNAL_HOST = process.env.MODEX_GTM_BASE_URL ?? 'https://modex-gtm.vercel.app';

const SAMPLE_ACCOUNTS = ['general-mills', 'frito-lay', 'dannon'];

test.describe('YNS microsite public access', () => {
  for (const account of SAMPLE_ACCOUNTS) {
    test(`yardflow.ai/for/${account} renders the microsite`, async ({ page }) => {
      const response = await page.goto(`${PROD_PUBLIC_HOST}/for/${account}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), 'public host should serve the microsite').toBe(200);

      const title = await page.title();
      expect(title.toLowerCase(), 'page title mentions YardFlow + the account').toMatch(/yardflow/);
      expect(title.toLowerCase()).toMatch(new RegExp(account.replace('-', '[ -]')));

      const heading = page.locator('h1').first();
      await expect(heading, 'first H1 renders').toBeVisible();

      const html = await page.content();
      expect(html, 'YardFlow brand markers present in the rendered HTML').toMatch(/YardFlow/);
    });

    test(`modex-gtm.vercel.app/for/${account} is public (no auth gate)`, async ({ page }) => {
      const response = await page.goto(`${PROD_INTERNAL_HOST}/for/${account}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), 'internal host serves the microsite without redirecting to /login').toBe(200);
      expect(page.url(), 'final URL stays on /for/[account]; no auth redirect').not.toMatch(/\/login/);

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });
  }

  test('MicrositeTracker beacon path proxies through to modex-gtm /api/microsites/track', async ({ page }) => {
    const trackRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/microsites/track')) trackRequests.push(url);
    });

    await page.goto(`${PROD_PUBLIC_HOST}/for/general-mills`, { waitUntil: 'networkidle' });
    // The tracker debounces; give it a tick to flush.
    await page.waitForTimeout(2_000);

    const trackerHits = trackRequests.filter((url) =>
      url.startsWith(PROD_PUBLIC_HOST) || url.startsWith(PROD_INTERNAL_HOST),
    );
    expect(
      trackerHits.length,
      'MicrositeTracker beacon either fired against yardflow.ai (rewrite) or directly modex-gtm (cross-project)',
    ).toBeGreaterThan(0);
  });
});
