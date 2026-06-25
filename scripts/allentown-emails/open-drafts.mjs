// Opens a few Allentown drafts in Gmail for visual review, then leaves the
// browser open. Pass addresses as args, or use the defaults below.
//   node scripts/allentown-emails/open-drafts.mjs joe.nichols@wakefern.com ...

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ADDRS = process.argv.slice(2).filter((a) => a.includes('@'));
const toOpen = ADDRS.length ? ADDRS : ['joe.nichols@wakefern.com', 'geoff.goetz@kehe.com', 'david.brodish@amcor.com'];

for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
  try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {}
}
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, channel: 'chrome', viewport: { width: 1280, height: 900 }, args: ['--start-maximized'] });
ctx.setDefaultTimeout(15000);
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto('https://mail.google.com/mail/u/0/#drafts', { waitUntil: 'domcontentloaded' });
const dl = Date.now() + 120000;
while (Date.now() < dl) { if (await page.locator('div[gh="cm"]').first().isVisible().catch(() => false)) break; await sleep(300); }
await sleep(1000);

const search = page.locator('input[aria-label="Search mail"], input[name="q"]').first();
async function waitClosed() { const t = Date.now() + 6000; while (Date.now() < t) { if ((await page.locator('div[role="dialog"]').count()) === 0) return; await sleep(250); } }

for (let i = 0; i < toOpen.length; i++) {
  const addr = toOpen[i];
  const last = i === toOpen.length - 1;
  try {
    await waitClosed();
    await search.click();
    await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type(`in:drafts to:${addr}`, { delay: 12 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash.includes('search'), null, { timeout: 8000 }).catch(() => {});
    await sleep(2000);
    const row = page.locator('tr.zA:visible').first();
    if (!(await row.count())) { console.log(`NOT FOUND: ${addr}`); continue; }
    await row.click();
    await sleep(1800);
    await page.screenshot({ path: path.resolve(REPO, `tmp/review-${i + 1}.png`) });
    console.log(`opened + shot: ${addr}`);
    if (!last) { // close so the next row is clickable; leave the last one open
      const close = page.locator('[aria-label="Save & close"]').first();
      if (await close.count()) await close.click({ force: true });
      await waitClosed();
    }
  } catch (e) { console.log(`skip ${addr}: ${e.message}`); }
}
console.log('Done. Browser will stay open ~45 min for your review.');
await sleep(45 * 60 * 1000); // keep the process alive so the window stays open
await ctx.close();
