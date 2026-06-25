// Cancel/delete specific SCHEDULED tier-1 messages by (old) recipient address,
// so the corrected versions can be re-scheduled. Row-hover Delete in #scheduled
// moves them to Trash (won't send, recoverable). Pass addresses as args.
//
//   node scripts/allentown-emails/delete-scheduled-tier1.mjs a@x.com b@y.com ...

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ADDRS = process.argv.slice(2).filter((a) => a.includes('@'));
if (!ADDRS.length) { console.error('no addresses given'); process.exit(1); }

for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) { try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {} }
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, channel: 'chrome', viewport: { width: 1280, height: 900 }, args: ['--start-maximized'] });
ctx.setDefaultTimeout(15000);
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto('https://mail.google.com/mail/u/0/#scheduled', { waitUntil: 'domcontentloaded' });
const dl = Date.now() + 120000;
while (Date.now() < dl) { if (await page.locator('div[gh="cm"]').first().isVisible().catch(() => false)) break; await sleep(300); }
await sleep(1200);
const search = page.locator('input[aria-label="Search mail"], input[name="q"]').first();

let removed = 0;
for (const addr of ADDRS) {
  await search.click();
  await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
  await page.keyboard.type(`in:scheduled to:${addr}`, { delay: 12 });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.hash.includes('search'), null, { timeout: 8000 }).catch(() => {});
  await sleep(1800);
  const rows = page.locator('tr.zA:visible');
  const count = await rows.count();
  if (count === 0) { console.log(`NOT FOUND scheduled: ${addr}`); continue; }
  if (count > 3) { console.log(`${addr}: ${count} rows (>3) -> SKIP, filter looks wrong`); continue; }
  let safety = 0;
  while (safety++ < 5) {
    const cur = await rows.count();
    if (cur === 0) break;
    const r = rows.first();
    await r.hover(); await sleep(300);
    await r.locator('[aria-label="Delete"], [data-tooltip="Delete"]').first().click({ force: true });
    removed++;
    await sleep(900);
  }
  console.log(`removed scheduled: ${addr}`);
}
console.log(`\nDeleted ${removed} scheduled message(s).`);
await ctx.close();
