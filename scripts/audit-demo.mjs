#!/usr/bin/env node
/**
 * Demo asset audit — walks the entire YNS Live Demo experience for one
 * account from the prospect's vantage point, captures screenshots and
 * visible text from each surface, and dumps findings to tmp/audit/.
 *
 * Tests the FULL JOURNEY:
 *   1. Microsite (/for/<account>) — landing page with demo CTA
 *   2. Atlas (/demo/<account>) — network atlas view, default landing
 *   3. Atlas with marker click — site detail panel
 *   4. Sim (?view=sim) — KPI dashboard, baseline state
 *   5. Sim with "Severe weather" preset — visual stress contrast
 *   6. Sim with "With YNS" toggle — value compression
 *   7. Replay (?play=1) — driver journey, baseline mode
 *   8. Replay with "With YNS" toggle — time delta
 *
 * Also captures mobile (375x812) for surfaces 2,4,7.
 *
 * Usage: node scripts/audit-demo.mjs [account-slug]
 *   default: mondelez-international
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const slug = process.argv[2] || 'mondelez-international';
const BASE = `https://modex-gtm.vercel.app`;
const OUT = 'tmp/audit';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function capture(label, url, viewport, interactions) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const consoleLogs = [];
  page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  console.log(`\n── ${label}  ${viewport.width}x${viewport.height}`);
  console.log(`   ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  if (interactions) await interactions(page);
  await page.waitForTimeout(800);
  const shotName = `${OUT}/${label}.png`;
  await page.screenshot({ path: shotName, fullPage: false });
  const visibleText = await page
    .evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 5000))
    .catch(() => '');
  const errs = consoleLogs.filter((l) => l.startsWith('[error]')).slice(0, 5);
  console.log(`   shot:   ${shotName}`);
  console.log(`   errs:   ${errs.length}`);
  if (errs.length) errs.forEach((e) => console.log(`     ${e.slice(0, 200)}`));
  await ctx.close();
  return { label, url, viewport, visibleText, errs };
}

const results = [];
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 375, height: 812 };

// 1. Microsite (the prospect's entry point — the memo that links to the demo)
results.push(await capture('01-microsite-desktop', `${BASE}/for/${slug}`, DESKTOP));

// 2. Atlas default view — desktop & mobile
results.push(await capture('02-atlas-desktop', `${BASE}/demo/${slug}`, DESKTOP));
results.push(await capture('03-atlas-mobile', `${BASE}/demo/${slug}`, MOBILE));

// 4. Atlas with a non-featured marker clicked (test the click→detail flow)
results.push(
  await capture('04-atlas-marker-click', `${BASE}/demo/${slug}`, DESKTOP, async (page) => {
    // Click a marker that's NOT the featured site — pick the 5th marker so we
    // exercise the "click changes selection" path.
    const markers = page.locator('.leaflet-marker-icon');
    const count = await markers.count();
    if (count > 4) await markers.nth(4).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  }),
);

// 5. Sim default (Live network preset)
results.push(await capture('05-sim-desktop-live', `${BASE}/demo/${slug}?view=sim`, DESKTOP));
results.push(await capture('06-sim-mobile-live', `${BASE}/demo/${slug}?view=sim`, MOBILE));

// 6. Sim with "Severe weather" preset clicked (the stress scenario)
results.push(
  await capture('07-sim-severe-weather', `${BASE}/demo/${slug}?view=sim`, DESKTOP, async (page) => {
    const severe = page.getByRole('button', { name: /Severe weather/ });
    await severe.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  }),
);

// 7. Sim "With YNS" toggle (the value moment — same scenario, YNS on)
results.push(
  await capture('08-sim-severe-weather-with-yns', `${BASE}/demo/${slug}?view=sim`, DESKTOP, async (page) => {
    const severe = page.getByRole('button', { name: /Severe weather/ });
    await severe.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    const yns = page.getByRole('button', { name: 'With YNS' });
    await yns.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  }),
);

// 8. Replay — desktop + mobile (the "watch your truck run" moment)
const replayUrl = `${BASE}/demo/${slug}?site=07-mondelez-richmond-distribution-center&play=1`;
results.push(await capture('09-replay-desktop', replayUrl, DESKTOP));
results.push(await capture('10-replay-mobile', replayUrl, MOBILE));

// 9. Replay With YNS toggled (the time-compression moment)
results.push(
  await capture('11-replay-with-yns', replayUrl, DESKTOP, async (page) => {
    const yns = page.getByRole('button', { name: 'With YNS' });
    await yns.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }),
);

writeFileSync(`${OUT}/audit-results.json`, JSON.stringify(results, null, 2));

console.log(`\n──────────────────────────────────────────`);
console.log(`Audit captured ${results.length} surfaces.`);
console.log(`Open ${OUT}/ to review screenshots.`);
console.log(`Combined JSON: ${OUT}/audit-results.json`);

await browser.close();
