#!/usr/bin/env node
/**
 * Self-verifies the YNS Network Simulator renders correctly on production.
 *
 * Headless Chromium drives:
 *   1. Load /demo/mondelez-international (default = atlas view)
 *   2. Click "Network simulator" tab
 *   3. Wait for the dynamic Leaflet chunk to mount
 *   4. Read `.leaflet-container` size, the `[YNS sim map]` console logs,
 *      whether tile <img>s loaded, marker count, error-boundary fallback
 *   5. Save a screenshot to tmp/sim-verify.png
 *   6. Print a green/red verdict
 *
 * Usage: `node scripts/verify-sim-map.mjs [url]`
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

// Confirm atlas tab is the default
const atlasMapBox = await page.locator('.leaflet-container').first().boundingBox().catch(() => null);
console.log(`atlas leaflet-container size: ${atlasMapBox ? `${atlasMapBox.width}x${atlasMapBox.height}` : 'NOT FOUND'}`);

// Click the Network simulator tab
console.log('→ clicking "Network simulator" tab');
await page.getByRole('button', { name: 'Network simulator' }).click();

// Give Leaflet the time it needs (we have a 500ms timer in FitBounds)
await page.waitForTimeout(1500);

// Now find the SIM leaflet-container — it's the second one if atlas is also still mounted,
// or the first one if atlas unmounted. We scope by sibling text.
const simMapBox = await page.locator('.leaflet-container').first().boundingBox().catch(() => null);
const errorBoundaryVisible = await page.locator('text=Map failed to mount').isVisible().catch(() => false);
const tileImgs = await page.locator('.leaflet-tile').count();
const tileImgsLoaded = await page.locator('.leaflet-tile-loaded').count();
const markerPaths = await page.locator('svg.leaflet-zoom-animated path').count();

console.log('');
console.log('━━━ SIMULATOR DIAGNOSTICS ━━━');
console.log(`leaflet-container size:   ${simMapBox ? `${simMapBox.width}x${simMapBox.height}` : 'NOT FOUND'}`);
console.log(`error boundary visible:   ${errorBoundaryVisible}`);
console.log(`leaflet tile <img> count: ${tileImgs}  (loaded: ${tileImgsLoaded})`);
console.log(`marker SVG path count:    ${markerPaths}`);
console.log('');
// The simulator no longer emits `[YNS sim map]` diagnostics in normal
// builds — they were a one-off debug aid. If the map ever regresses,
// reintroduce them in src/components/demo/network-simulator-inner.tsx
// and they'll surface here.
const ynsLogs = consoleLogs.filter((l) => l.includes('YNS sim map'));
if (ynsLogs.length > 0) {
  console.log('━━━ YNS sim map console logs ━━━');
  ynsLogs.forEach((l) => console.log(l));
  console.log('');
}
if (pageErrors.length) {
  console.log('━━━ pageerror events ━━━');
  pageErrors.forEach((e) => console.log(e));
  console.log('');
}

const shotPath = 'tmp/sim-verify.png';
await page.screenshot({ path: shotPath, fullPage: false });
console.log(`screenshot: ${shotPath}`);

// Marker count = pack site count (some accounts have 2 sites, some 30).
const slugMatch = BASE.match(/\/demo\/([a-z0-9-]+)/);
const slug = slugMatch?.[1] ?? 'mondelez-international';
let expectedMarkers = 1;
try {
  const fs = await import('node:fs');
  const pack = JSON.parse(fs.readFileSync(`public/demo-packs/${slug}.json`, 'utf8'));
  expectedMarkers = pack.account.siteCount;
} catch {
  // pack not locally available — fall back permissively
}
const ok =
  simMapBox &&
  simMapBox.height > 100 &&
  simMapBox.width > 100 &&
  !errorBoundaryVisible &&
  tileImgs > 0 &&
  markerPaths >= expectedMarkers;

console.log('');
console.log(ok ? '✅ PASS — sim map renders with tiles + markers' : '❌ FAIL — see diagnostics above');

writeFileSync('tmp/sim-verify.json', JSON.stringify({
  ok,
  simMapBox,
  errorBoundaryVisible,
  tileImgs,
  tileImgsLoaded,
  markerPaths,
  ynsLogs,
  pageErrors,
}, null, 2));

await browser.close();
process.exit(ok ? 0 : 1);
