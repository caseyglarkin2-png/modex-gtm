#!/usr/bin/env node
/**
 * Self-verifies the YNS Driver Journey Replay
 * (deep-link `?site=...&play=1`).
 *
 * Headless Chromium drives:
 *   1. Load /demo/<account>?site=<featured>&play=1 — Mondelez featured
 *      is '07-mondelez-richmond-distribution-center' (archetype #3, 4
 *      steps, ~50min baseline → ~44min YNS)
 *   2. Wait for the replay panel to mount (DriverJourneyReplay, not
 *      the static SiteDetailPanel)
 *   3. Assert: "Driver journey · Archetype" header, Step counter,
 *      Without/With YNS toggle, narration card, totals grid, map
 *   4. Click "With YNS" — narration eyebrow flips to "With YNS"
 *   5. Click "Replay" — step counter returns to 1
 *   6. Save a screenshot to tmp/replay-verify.png
 *   7. Print PASS/FAIL
 *
 * Mirrors verify-sim-map.mjs / verify-atlas.mjs — same Playwright +
 * bundled chromium runner, no extra installs.
 *
 * Usage: `node scripts/verify-replay.mjs [url]`
 *   defaults to a deep-link into Mondelez's featured site replay.
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const DEFAULT =
  'https://modex-gtm.vercel.app/demo/mondelez-international?site=07-mondelez-richmond-distribution-center&play=1';
const BASE = process.argv[2] || DEFAULT;

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
// Replay's Inner is dynamic-imported; the rAF loop kicks off after mount.
await page.waitForTimeout(1500);

const driverJourneyHeading = await page
  .locator('text=Driver journey')
  .first()
  .isVisible()
  .catch(() => false);
const withoutYnsBtn = page.getByRole('button', { name: 'Without YNS' });
const withYnsBtn = page.getByRole('button', { name: 'With YNS' });
const withoutYnsVisible = await withoutYnsBtn.isVisible().catch(() => false);
const withYnsVisible = await withYnsBtn.isVisible().catch(() => false);
const stepCounterTextInitial = await page.locator('text=/^Step \\d+ \\/ \\d+/').first().textContent().catch(() => null);
// Replay button — DriverJourneyReplay renders one literal "⟲ Replay"
// button. Match it by the exact prefix character to avoid grabbing any
// other element that happens to contain the substring "Replay".
const replayBtn = page.locator('button:has-text("⟲ Replay")').first();
const replayBtnVisible = await replayBtn.isVisible().catch(() => false);
const totalsThisRunVisible = await page.locator('text=This run').first().isVisible().catch(() => false);
const totalsSavesVisible = await page.locator('text=YNS saves').first().isVisible().catch(() => false);
const mapBox = await page.locator('.leaflet-container').first().boundingBox().catch(() => null);
const tileImgs = await page.locator('.leaflet-tile').count();
const tileImgsLoaded = await page.locator('.leaflet-tile-loaded').count();

// Confirm the mode toggle works: click "With YNS" and re-read the
// narration eyebrow. Should flip from "Without YNS · ..." → "With YNS · ...".
const narrationBefore = await page
  .locator('text=/Without YNS · /')
  .first()
  .textContent()
  .catch(() => null);
let withYnsClickError = null;
await withYnsBtn.click({ timeout: 5000 }).catch((e) => {
  withYnsClickError = String(e?.message ?? e);
});
await page.waitForTimeout(300);
const narrationAfter = await page
  .locator('text=/With YNS · /')
  .first()
  .textContent()
  .catch(() => null);
const modeToggleWorks = !!narrationAfter && narrationAfter !== narrationBefore;

// Confirm the Replay button restarts. The animation will run past
// "Step 1" within a second (step 1's move is 600ms in replay-time), so
// instead of a one-shot read at a fixed delay, poll the counter every
// 50ms for up to 1.5s and record the minimum step number observed.
// Pass = we saw "Step 1" at some point in that window.
let replayClickError = null;
await replayBtn.click({ timeout: 5000 }).catch((e) => {
  replayClickError = String(e?.message ?? e);
});
let stepCounterAfterReplay = null;
let replayResets = false;
for (let i = 0; i < 30; i++) {
  stepCounterAfterReplay = await page
    .locator('text=/^Step \\d+ \\/ \\d+/')
    .first()
    .textContent()
    .catch(() => null);
  if (stepCounterAfterReplay?.startsWith('Step 1')) {
    replayResets = true;
    break;
  }
  await page.waitForTimeout(50);
}

console.log('');
console.log('━━━ REPLAY DIAGNOSTICS ━━━');
console.log(`"Driver journey" heading:  ${driverJourneyHeading}`);
console.log(`Without YNS / With YNS:    ${withoutYnsVisible} / ${withYnsVisible}`);
console.log(`mode toggle flips eyebrow: ${modeToggleWorks}`);
console.log(`step counter (initial):    ${stepCounterTextInitial ?? '(none)'}`);
console.log(`replay button visible:     ${replayBtnVisible}`);
console.log(`replay button resets step: ${replayResets}`);
console.log(`totals (This run / YNS saves): ${totalsThisRunVisible} / ${totalsSavesVisible}`);
console.log(`leaflet-container size:    ${mapBox ? `${mapBox.width}x${mapBox.height}` : 'NOT FOUND'}`);
console.log(`leaflet tile count:        ${tileImgs}  (loaded: ${tileImgsLoaded})`);
if (withYnsClickError) console.log(`With YNS click error:      ${withYnsClickError}`);
if (replayClickError) console.log(`Replay click error:        ${replayClickError}`);
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

const shotPath = 'tmp/replay-verify.png';
await page.screenshot({ path: shotPath, fullPage: false });
console.log(`screenshot: ${shotPath}`);

const ok =
  driverJourneyHeading &&
  withoutYnsVisible &&
  withYnsVisible &&
  modeToggleWorks &&
  !!stepCounterTextInitial &&
  replayBtnVisible &&
  replayResets &&
  totalsThisRunVisible &&
  totalsSavesVisible &&
  mapBox &&
  mapBox.height > 100 &&
  tileImgs > 0;

console.log('');
console.log(ok ? '✅ PASS — replay renders, mode toggle + restart work' : '❌ FAIL — see diagnostics above');

writeFileSync('tmp/replay-verify.json', JSON.stringify({
  ok,
  driverJourneyHeading,
  withoutYnsVisible,
  withYnsVisible,
  modeToggleWorks,
  withYnsClickError,
  replayClickError,
  narrationBefore,
  narrationAfter,
  stepCounterTextInitial,
  stepCounterAfterReplay,
  replayResets,
  replayBtnVisible,
  totalsThisRunVisible,
  totalsSavesVisible,
  mapBox,
  tileImgs,
  tileImgsLoaded,
  pageErrors,
  errLogs,
}, null, 2));

await browser.close();
process.exit(ok ? 0 : 1);
