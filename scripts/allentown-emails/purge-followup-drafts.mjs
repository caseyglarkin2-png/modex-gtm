// Delete any leftover "Re:" draft replies to the 38 follow-up recipients
// (created by Escape during testing). Scoped to subject:Re + a known recipient
// so it never touches the original-batch drafts or anything unrelated.
//
//   node scripts/allentown-emails/purge-followup-drafts.mjs            (dry run)
//   node scripts/allentown-emails/purge-followup-drafts.mjs --delete   (delete)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { followups } from './followups.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const DELETE = process.argv.includes('--delete');
const SAFE_MAX = 10;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) { try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {} }
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, channel: 'chrome', viewport: { width: 1280, height: 900 }, args: ['--start-maximized'] });
ctx.setDefaultTimeout(15000);
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto('https://mail.google.com/mail/u/0/#drafts', { waitUntil: 'domcontentloaded' });
const dl = Date.now() + 120000;
while (Date.now() < dl) { if (await page.locator('div[gh="cm"]').first().isVisible().catch(() => false)) break; await sleep(300); }
await sleep(1000);
const search = page.locator('input[aria-label="Search mail"], input[name="q"]').first();

let total = 0;
for (const c of followups) {
  await search.click();
  await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
  await page.keyboard.type(`in:drafts to:${c.to} subject:Re`, { delay: 10 });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash.includes('search'), null, { timeout: 8000 }).catch(() => {});
  await sleep(1600);
  const rows = page.locator('tr.zA:visible');
  const count = await rows.count();
  if (count === 0) continue;
  if (count > SAFE_MAX) { console.log(`${c.to}: ${count} (>${SAFE_MAX}) -> SKIP`); continue; }
  console.log(`${c.to}: ${count} draft reply(ies)`);
  if (!DELETE) { total += count; continue; }
  let safety = 0;
  while (safety++ < 20) {
    const cur = await rows.count();
    if (cur === 0) break;
    const r = rows.first();
    await r.hover(); await sleep(250);
    await r.locator('[aria-label="Delete"], [data-tooltip="Delete"]').first().click({ force: true });
    total++;
    await sleep(700);
  }
}
console.log(`\n${DELETE ? 'DELETED' : 'WOULD DELETE'} ${total} draft reply(ies).`);
await ctx.close();
