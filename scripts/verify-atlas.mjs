#!/usr/bin/env node
/**
 * Self-verifies the YNS Network Atlas (`/demo/<account>` default view).
 *
 * Headless Chromium drives:
 *   1. Load /demo/mondelez-international (default = atlas view)
 *   2. Wait for the dynamic Leaflet chunk to mount
 *   3. Read `.leaflet-container` size, marker count, tile-load count
 *   4. Confirm the side panel populated (featuredSite SiteDetailPanel
 *      or, if no featured site, the ArchetypeMixChart)
 *   5. Save a screenshot to tmp/atlas-verify.png
 *   6. Print a PASS/FAIL verdict
 *
 * Mirrors the verify-sim-map.mjs pattern — same structure, same
 * Playwright + bundled chromium runner, no extra installs.
 *
 * Usage: `node scripts/verify-atlas.mjs [url]`
 *   defaults to https://modex-gtm.vercel.app/demo/mondelez-international
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.argv[2] || 'https://modex-gtm.vercel.app/demo/mondelez-international';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleLogs = [];
page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
const pageErrors = [];
page.on('pageerror', (err) => pageErrors.push(err.message));

console.log(`→ navigating to ${BASE}`);
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
// Atlas's FitBounds + tile loading typically settles within 1s.
await page.waitForTimeout(1500);

const mapBox = await page.locator('.leaflet-container').first().boundingBox().catch(() => null);
const tileImgs = await page.locator('.leaflet-tile').count();
const tileImgsLoaded = await page.locator('.leaflet-tile-loaded').count();
// Atlas uses Marker (DivIcon SVG) — class `leaflet-marker-icon`.
const markerCount = await page.locator('.leaflet-marker-icon').count();
// Side panel: either the SiteDetailPanel (h2 with site name) or the
// ArchetypeMixChart (header "Archetype mix"). Featured Mondelez site
// is set so SiteDetailPanel should be visible by default.
const sitePanelHeading = await page.locator('h2').first().textContent().catch(() => null);
const archetypeMixVisible = await page.locator('text=Archetype mix').isVisible().catch(() => false);
const coverageHonestyVisible = await page.locator('text=Coverage', { exact: false }).first().isVisible().catch(() => false);

console.log('');
console.log('━━━ ATLAS DIAGNOSTICS ━━━');
console.log(`leaflet-container size:    ${mapBox ? `${mapBox.width}x${mapBox.height}` : 'NOT FOUND'}`);
console.log(`leaflet tile <img> count:  ${tileImgs}  (loaded: ${tileImgsLoaded})`);
console.log(`marker icon count:         ${markerCount}`);
console.log(`right-panel heading:       ${sitePanelHeading ?? '(none)'}`);
console.log(`ArchetypeMix fallback:     ${archetypeMixVisible}`);
console.log(`Coverage banner visible:   ${coverageHonestyVisible}`);
console.log('');
if (pageErrors.length) {
  console.log('━━━ pageerror events ━━━');
  pageErrors.forEach((e) => console.log(e));
  console.log('');
}
const errLogs = consoleLogs.filter((l) => l.startsWith('[error]'));
if (errLogs.length) {
  console.log('━━━ console errors ━━━');
  errLogs.forEach((l) => console.log(l));
  console.log('');
}

const shotPath = 'tmp/atlas-verify.png';
await page.screenshot({ path: shotPath, fullPage: false });
console.log(`screenshot: ${shotPath}`);

// Mondelez has 22 sites — the atlas should render all of them.
const ok =
  mapBox &&
  mapBox.height > 100 &&
  mapBox.width > 100 &&
  tileImgs > 0 &&
  markerCount >= 22 &&
  (sitePanelHeading !== null || archetypeMixVisible);

console.log('');
console.log(ok ? '✅ PASS — atlas renders with tiles + markers + side panel' : '❌ FAIL — see diagnostics above');

writeFileSync('tmp/atlas-verify.json', JSON.stringify({
  ok,
  mapBox,
  tileImgs,
  tileImgsLoaded,
  markerCount,
  sitePanelHeading,
  archetypeMixVisible,
  coverageHonestyVisible,
  pageErrors,
  errLogs,
}, null, 2));

await browser.close();
process.exit(ok ? 0 : 1);
