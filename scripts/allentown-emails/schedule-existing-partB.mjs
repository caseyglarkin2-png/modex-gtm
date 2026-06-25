// Recovery: schedule the already-built Part B Thursday DRAFTS (compose succeeded,
// only the schedule-send click failed). Opens each draft from the Drafts folder
// and schedules it for the given date, staggered 7:30 AM ET +2 min by slice index.
// Uses the robust dismiss-notif-bar + force-open-menu flow proven 37/37 on tier1.
//
//   node scripts/allentown-emails/schedule-existing-partB.mjs --date "Jun 11, 2026" --from 18 --to 37

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { contacts } from './batch2-partB-contacts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function argv(name, def) { const i = process.argv.indexOf(name); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def; }
const DATE = argv('--date', 'Jun 11, 2026');
const FROM = parseInt(argv('--from', '0'), 10);
const TO = parseInt(argv('--to', String(contacts.length)), 10);
const START_MIN = 7 * 60 + 30;
const STEP = 2;
function fmtTime(mins) { const h24 = Math.floor(mins / 60), m = mins % 60; const ampm = h24 < 12 ? 'AM' : 'PM'; let h = h24 % 12; if (h === 0) h = 12; return `${h}:${String(m).padStart(2, '0')} ${ampm}`; }
async function firstVisible(scope, sels, t = 8000) { const dl = Date.now() + t; while (Date.now() < dl) { for (const s of sels) { const l = scope.locator(s).first(); if ((await l.count()) && (await l.isVisible().catch(() => false))) return l; } await sleep(200); } throw new Error('none visible: ' + sels.join(' | ')); }

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

  async function killNotifBar() {
    for (const s of ['span:has-text("No thanks")', 'div[role="button"]:has-text("No thanks")']) {
      const l = page.locator(s).last();
      if (await l.count().catch(() => 0) && await l.isVisible().catch(() => false)) { await l.click({ force: true }).catch(() => {}); await sleep(400); return; }
    }
  }
  async function openSendMenu() {
    const more = await firstVisible(page, ['[aria-label="More send options"]']);
    for (let i = 0; i < 6; i++) {
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
    await page.keyboard.type(`in:drafts to:${c.to}`, { delay: 12 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash.includes('search'), null, { timeout: 8000 }).catch(() => {});
    await sleep(1700);
    const row = page.locator('tr.zA:visible').first();
    if (!(await row.count())) { console.log(`NOT FOUND: ${c.to}`); return false; }
    await row.click();
    await sleep(2000);
    const body = page.locator('div[aria-label="Message Body"]:visible').last();
    await body.waitFor({ state: 'visible', timeout: 8000 });

    await killNotifBar(); await sleep(300);
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

  const slice = contacts.slice(FROM, TO);
  let i = 0, ok = 0;
  for (const c of slice) {
    const t = fmtTime(START_MIN + STEP * i);
    i++;
    try { if (await scheduleDraft(c, t)) ok++; }
    catch (e) {
      console.log(`  FAILED ${c.to}: ${String(e.message).split('\n')[0]}`);
      await page.screenshot({ path: path.resolve(REPO, `tmp/partB-recover-error-${FROM + i}.png`) }).catch(() => {});
      for (let k = 0; k < 5; k++) { await page.keyboard.press('Escape').catch(() => {}); await sleep(300); }
    }
  }
  console.log(`\nDone. Scheduled ${ok}/${slice.length} for ${DATE}.`);
  await ctx.close();
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
