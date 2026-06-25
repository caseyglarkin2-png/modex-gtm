// Schedule the 48-hour reply-bumps. For each surviving contact: open the
// original SENT thread, click Reply, insert the bump copy above the quote,
// add Bcc (HubSpot logging), then Schedule-send for Mon Jun 8 2026, staggered
// every 2 min from 7:30 AM ET. The reply threads on the original (Gmail AND
// Outlook) and the pilot photo rides along quoted beneath.
//
//   node scripts/allentown-emails/schedule-followups.mjs --dry --max 1   (one contact, fill but DON'T schedule, screenshot, discard)
//   node scripts/allentown-emails/schedule-followups.mjs --max 1         (schedule first contact only)
//   node scripts/allentown-emails/schedule-followups.mjs                 (schedule all 38)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { followups, BCC } from './followups.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DRY = process.argv.includes('--dry');
const MAXi = process.argv.indexOf('--max');
const MAX = MAXi !== -1 ? parseInt(process.argv[MAXi + 1], 10) : Infinity;

const DATE = 'Jun 8, 2026';
const START_MIN = 7 * 60 + 30; // 7:30 AM ET
const STEP = 2;
function fmtTime(mins) {
  const h24 = Math.floor(mins / 60), m = mins % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  let h = h24 % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

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
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) { try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {} }
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, channel: 'chrome', viewport: { width: 1280, height: 900 }, args: ['--start-maximized'] });
  ctx.setDefaultTimeout(15000);
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto('https://mail.google.com/mail/u/0/#search/in%3Asent', { waitUntil: 'domcontentloaded' });
  const dl = Date.now() + 120000;
  while (Date.now() < dl) { if (await page.locator('div[gh="cm"]').first().isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(1000);
  // Dismiss the "Enable desktop notifications" bar that overlays the bottom Reply control.
  for (const t of ['No thanks', 'Dismiss', 'No, thanks']) {
    const b = page.getByRole('button', { name: t }).first();
    if (await b.count().catch(() => 0)) { await b.click().catch(() => {}); await sleep(300); }
  }
  const search = page.locator('input[aria-label="Search mail"], input[name="q"]').first();

  // The latest visible inline reply body (a reply opens a contenteditable textbox).
  function replyBody() { return page.locator('div[aria-label="Message Body"]:visible, div[role="textbox"][aria-label*="Message"]:visible').last(); }

  async function bumpOne(c, timeStr, n) {
    // 1) find + open the original sent thread
    await search.click();
    await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type(`in:sent to:${c.to}`, { delay: 12 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash.includes('search'), null, { timeout: 8000 }).catch(() => {});
    await sleep(1800);
    const row = page.locator('tr.zA:visible').first();
    if (!(await row.count())) { console.log(`NOT FOUND: ${c.to}`); return false; }
    await row.click();
    await sleep(1600);
    console.log(`  [${c.to}] thread open`);

    // 2) click Reply (exact, not "Reply all"/"Forward"). The bottom-of-thread
    // control is a span[role="link"] with text "Reply"; fall back to the
    // per-message header icon button[aria-label="Reply"].
    {
      const replyLink = page.getByRole('link', { name: 'Reply', exact: true }).first();
      const replyBtn = page.locator('button[aria-label="Reply"]').first();
      const deadline = Date.now() + 8000;
      let clicked = false;
      while (Date.now() < deadline && !clicked) {
        if ((await replyLink.count()) && (await replyLink.isVisible().catch(() => false))) { await replyLink.click(); clicked = true; break; }
        if ((await replyBtn.count())) { await replyBtn.click({ force: true }); clicked = true; break; }
        await sleep(200);
      }
      if (!clicked) throw new Error('Reply control not found');
    }
    await sleep(1200);
    const body = replyBody();
    await body.waitFor({ state: 'visible', timeout: 8000 });
    console.log(`  [${c.to}] reply open`);

    // 3) Bcc the HubSpot logger
    await body.click();
    await page.keyboard.press('Control+Shift+b');
    await sleep(500);
    const bcc = await firstVisible(page, ['input[aria-label="BCC recipients"]', 'input[aria-label="Bcc recipients"]', 'input[name="bcc"]', 'textarea[name="bcc"]'], 6000);
    await bcc.click(); await page.keyboard.type(BCC, { delay: 10 }); await page.keyboard.press('Tab');
    await sleep(400);
    console.log(`  [${c.to}] bcc set`);

    // 4) insert the bump copy as DOM nodes above the quote (Trusted-Types blocks innerHTML)
    const bodyEl = replyBody();
    await bodyEl.evaluate((el, blocks) => {
      const frag = document.createDocumentFragment();
      for (const p of blocks) {
        const d = document.createElement('div');
        d.textContent = p;
        frag.appendChild(d);
        const sp = document.createElement('div');
        sp.appendChild(document.createElement('br'));
        frag.appendChild(sp);
      }
      el.insertBefore(frag, el.firstChild);
    }, c.blocks);
    await sleep(400);
    console.log(`  [${c.to}] body inserted`);

    // 5) Schedule send (force-click: a transient tooltip span can overlap the arrow)
    await (await firstVisible(page, ['[aria-label="More send options"]'], 8000)).click({ force: true });
    await sleep(700);
    await page.getByRole('menuitem', { name: /Schedule send/i }).first().click();
    await sleep(1100);
    await page.getByText('Pick date & time').first().click();
    await sleep(1200);
    const dateInput = await firstVisible(page, ['input[aria-label="Date"]'], 6000);
    await dateInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.type(DATE, { delay: 8 }); await page.keyboard.press('Tab');
    await sleep(300);
    const timeInput = await firstVisible(page, ['input[aria-label="Time"]'], 6000);
    await timeInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.type(timeStr, { delay: 8 }); await page.keyboard.press('Tab');
    await sleep(400);

    if (DRY) {
      await page.screenshot({ path: path.resolve(REPO, `tmp/followup-dry-${n}.png`) });
      console.log(`DRY ${c.to}: filled reply + Bcc + ${DATE} ${timeStr} (screenshot saved, not scheduled)`);
      // close schedule dialog, then discard the stray reply draft
      await page.keyboard.press('Escape'); await sleep(500);
      const discard = page.locator('[aria-label="Discard draft"]').first();
      if (await discard.count()) { await discard.click({ force: true }).catch(() => {}); }
      await sleep(800);
      return true;
    }

    await page.getByRole('button', { name: 'Schedule send' }).first().click();
    await sleep(1200);
    console.log(`scheduled ${c.to} -> ${DATE} ${timeStr}`);
    return true;
  }

  const list = followups.slice(0, MAX);
  let n = 0, ok = 0;
  for (const c of list) {
    const t = fmtTime(START_MIN + STEP * n);
    n++;
    try { if (await bumpOne(c, t, n)) ok++; }
    catch (e) {
      console.log(`  FAILED ${c.to}: ${e.message}`);
      await page.screenshot({ path: path.resolve(REPO, `tmp/followup-error-${n}.png`) }).catch(() => {});
      for (let k = 0; k < 4; k++) { await page.keyboard.press('Escape').catch(() => {}); await sleep(300); }
    }
  }
  console.log(`\nDone. ${DRY ? 'Dry-filled' : 'Scheduled'} ${ok}/${list.length}.`);
  if (DRY) { console.log('Review tmp/followup-dry-*.png, then re-run without --dry.'); await sleep(8000); }
  await ctx.close();
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
