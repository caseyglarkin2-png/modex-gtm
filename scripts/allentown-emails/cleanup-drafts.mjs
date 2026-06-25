// Cleanup: for each Allentown recipient, KEEP the newest draft (the embedded-
// photo one) and delete every older YardFlow draft to that person. Only ever
// touches drafts addressed to one of the 46 recipients, so unrelated drafts
// are never selected.
//
//   node scripts/allentown-emails/cleanup-drafts.mjs                 (dry run)
//   node scripts/allentown-emails/cleanup-drafts.mjs --delete --max 1 (delete, 1 recipient)
//   node scripts/allentown-emails/cleanup-drafts.mjs --delete         (delete, all)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { contacts } from './contacts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const DELETE = process.argv.includes('--delete');
const MAXi = process.argv.indexOf('--max');
const MAX = MAXi !== -1 ? parseInt(process.argv[MAXi + 1], 10) : Infinity;
const SAFE_MAX = 25; // a real per-recipient search returns ~5-8; >25 means the filter didn't apply
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function firstVisible(scope, selectors, timeout = 8000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      const loc = scope.locator(sel).first();
      if ((await loc.count()) && (await loc.isVisible().catch(() => false))) return loc;
    }
    await sleep(200);
  }
  throw new Error(`none visible: ${selectors.join(' | ')}`);
}

async function main() {
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {}
  }
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false, channel: 'chrome', viewport: { width: 1280, height: 900 }, args: ['--start-maximized'],
  });
  ctx.setDefaultTimeout(15000);
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto('https://mail.google.com/mail/u/0/#drafts', { waitUntil: 'domcontentloaded' });
  const dl = Date.now() + 120000;
  while (Date.now() < dl) { if (await page.locator('div[gh="cm"]').first().isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(1000);

  const search = page.locator('input[aria-label="Search mail"], input[name="q"]').first();

  const addrs = [...new Set(contacts.map((c) => c.to))].slice(0, MAX);
  let totalDel = 0;
  for (const addr of addrs) {
    // Drive the real search box with actual keystrokes (Gmail ignores JS-set
    // values), then wait for the search route to load before counting.
    await search.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type(`in:drafts to:${addr}`, { delay: 12 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash.includes('search'), null, { timeout: 8000 }).catch(() => {});
    await sleep(2200);

    const rows = page.locator('tr.zA:visible'); // Gmail keeps the hidden drafts list in the DOM too
    const count = await rows.count();
    if (count > SAFE_MAX) { console.log(`${addr}: ${count} (>${SAFE_MAX}) -> SKIP, filter looks wrong`); continue; }
    const del = Math.max(0, count - 1);
    console.log(`${addr}: ${count} draft(s) -> keep 1, delete ${del}`);
    if (!DELETE || del === 0) { totalDel += del; continue; }

    // Keep the newest (row 0): hover the OLDEST visible row and click its
    // row-level Delete icon (revealed on hover), repeat until one remains.
    let removed = 0, safety = 0;
    while (safety++ < 40) {
      const c = await rows.count();
      if (c <= 1) break;
      const oldest = rows.last();
      await oldest.hover();
      await sleep(250);
      const delBtn = oldest.locator('[aria-label="Delete"], [data-tooltip="Delete"]').first();
      await delBtn.click({ force: true });
      removed++;
      await sleep(800);
    }
    console.log(`  -> deleted ${removed}, 1 remains`);
    totalDel += removed;
  }
  console.log(`\n${DELETE ? 'DELETED' : 'WOULD DELETE'} ${totalDel} old draft(s) across ${addrs.length} recipient(s).`);
  await ctx.close();
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
