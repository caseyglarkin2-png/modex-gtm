// Schedule the already-built reply-bump DRAFTS (body + Bcc already present from
// the prior run; only the schedule-send click had failed). For each contact:
// open the existing draft from the Drafts folder, dismiss the notifications bar
// (it occludes the Send row), force-open the send-options menu, and Schedule
// send for Mon Jun 8 2026 staggered every 2 min from 7:30 AM ET.
//
// If a draft is missing its bump body (e.g. Webb), it is inserted first.
//
//   node scripts/allentown-emails/schedule-existing-drafts.mjs --max 1   (first contact)
//   node scripts/allentown-emails/schedule-existing-drafts.mjs           (all 38)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { followups } from './followups.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MAXi = process.argv.indexOf('--max');
const MAX = MAXi !== -1 ? parseInt(process.argv[MAXi + 1], 10) : Infinity;

const DATE = 'Jun 8, 2026';
const START_MIN = 7 * 60 + 30;
const STEP = 2;
function fmtTime(mins) {
  const h24 = Math.floor(mins / 60), m = mins % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  let h = h24 % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}
async function firstVisible(scope, sels, t = 8000) {
  const dl = Date.now() + t;
  while (Date.now() < dl) { for (const s of sels) { const l = scope.locator(s).first(); if ((await l.count()) && (await l.isVisible().catch(() => false))) return l; } await sleep(200); }
  throw new Error('none visible: ' + sels.join('|'));
}

async function main() {
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) { try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {} }
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, channel: 'chrome', viewport: { width: 1280, height: 900 }, args: ['--start-maximized'] });
  ctx.setDefaultTimeout(15000);
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto('https://mail.google.com/mail/u/0/#drafts', { waitUntil: 'domcontentloaded' });
  const dl = Date.now() + 120000;
  while (Date.now() < dl) { if (await page.locator('div[gh="cm"]').first().isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(1000);
  const search = page.locator('input[aria-label="Search mail"], input[name="q"]').first();

  // The "No thanks" on the desktop-notifications bar is a clickable span (NOT role=button).
  async function killNotifBar() {
    for (const s of ['span:has-text("No thanks")', 'div[role="button"]:has-text("No thanks")']) {
      const l = page.locator(s).last();
      if (await l.count().catch(() => 0) && await l.isVisible().catch(() => false)) { await l.click({ force: true }).catch(() => {}); await sleep(400); return; }
    }
  }
  // Force-click the send-options arrow; retry until the menu actually opens.
  async function openSendMenu() {
    const more = await firstVisible(page, ['[aria-label="More send options"]']);
    for (let i = 0; i < 5; i++) {
      await more.click({ force: true });
      await sleep(800);
      if ((await page.locator('[role="menuitem"]:visible').count()) > 0) return true;
      await page.mouse.move(640, 280); await sleep(300);
    }
    return false;
  }

  async function scheduleDraft(c, timeStr) {
    await search.click();
    await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type(`in:drafts to:${c.to} subject:Re`, { delay: 12 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash.includes('search'), null, { timeout: 8000 }).catch(() => {});
    await sleep(1700);
    const row = page.locator('tr.zA:visible').first();
    if (!(await row.count())) { console.log(`NOT FOUND: ${c.to}`); return false; }
    await row.click();
    await sleep(2000);
    const body = page.locator('div[aria-label="Message Body"]:visible').last();
    await body.waitFor({ state: 'visible', timeout: 8000 });

    // back-fill the bump body if this draft is missing it (e.g. Webb)
    const txt = (await body.innerText().catch(() => '')) || '';
    const probe = (c.blocks[1] || '').slice(0, 24);
    if (probe && !txt.includes(probe)) {
      await body.evaluate((el, blocks) => {
        const frag = document.createDocumentFragment();
        for (const p of blocks) { const d = document.createElement('div'); d.textContent = p; frag.appendChild(d); const sp = document.createElement('div'); sp.appendChild(document.createElement('br')); frag.appendChild(sp); }
        el.insertBefore(frag, el.firstChild);
      }, c.blocks);
      console.log(`  [${c.to}] body back-filled`);
      await sleep(500);
    }

    await killNotifBar();
    await sleep(300);
    if (!(await openSendMenu())) throw new Error('send menu did not open');
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
    const confirm = await firstVisible(page, ['button:has-text("Schedule send")', 'div[role="button"]:has-text("Schedule send")'], 6000);
    await confirm.click({ force: true });
    await sleep(1300);
    console.log(`scheduled ${c.to} -> ${DATE} ${timeStr}`);
    return true;
  }

  const list = followups.slice(0, MAX);
  let n = 0, ok = 0;
  for (const c of list) {
    const t = fmtTime(START_MIN + STEP * n);
    n++;
    try { if (await scheduleDraft(c, t)) ok++; }
    catch (e) {
      console.log(`  FAILED ${c.to}: ${String(e.message).split('\n')[0]}`);
      await page.screenshot({ path: path.resolve(REPO, `tmp/sched-exist-error-${n}.png`) }).catch(() => {});
      for (let k = 0; k < 5; k++) { await page.keyboard.press('Escape').catch(() => {}); await sleep(300); }
    }
  }
  console.log(`\nDone. Scheduled ${ok}/${list.length}.`);
  await ctx.close();
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
