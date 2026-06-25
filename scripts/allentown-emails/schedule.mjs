// Schedule the 46 Allentown drafts via Gmail Schedule-send, staggered every
// 2 minutes starting 7:30 AM ET (account TZ confirmed Eastern). Drafts become
// scheduled messages (Google's servers send them).
//
//   node scripts/allentown-emails/schedule.mjs --test       (schedule the zz-test draft only)
//   node scripts/allentown-emails/schedule.mjs --max 1       (first real contact only)
//   node scripts/allentown-emails/schedule.mjs               (all 46)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { contacts } from './contacts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TEST = process.argv.includes('--test');
const MAXi = process.argv.indexOf('--max');
const MAX = MAXi !== -1 ? parseInt(process.argv[MAXi + 1], 10) : Infinity;

const DATE = 'Jun 5, 2026';
const START_MIN = 7 * 60 + 30; // 7:30 AM
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
  await page.goto('https://mail.google.com/mail/u/0/#drafts', { waitUntil: 'domcontentloaded' });
  const dl = Date.now() + 120000;
  while (Date.now() < dl) { if (await page.locator('div[gh="cm"]').first().isVisible().catch(() => false)) break; await sleep(300); }
  await sleep(1000);
  const search = page.locator('input[aria-label="Search mail"], input[name="q"]').first();

  async function waitClosed() { const t = Date.now() + 8000; while (Date.now() < t) { if ((await page.locator('div[role="dialog"]').count()) === 0) return; await sleep(250); } }

  async function scheduleOne(query, label, timeStr) {
    await waitClosed();
    await search.click();
    await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type(query, { delay: 12 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash.includes('search'), null, { timeout: 8000 }).catch(() => {});
    await sleep(1800);
    const row = page.locator('tr.zA:visible').first();
    if (!(await row.count())) { console.log(`NOT FOUND: ${label}`); return false; }
    await row.click();
    await sleep(1600);

    await (await firstVisible(page, ['[aria-label="More send options"]'], 8000)).click();
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

    await page.getByRole('button', { name: 'Schedule send' }).first().click();
    await waitClosed();
    await sleep(800);
    console.log(`scheduled ${label} -> ${DATE} ${timeStr}`);
    return true;
  }

  if (TEST) {
    await scheduleOne('in:drafts subject:zz-schedule-test', 'TEST(self)', fmtTime(START_MIN));
    await page.goto('https://mail.google.com/mail/u/0/#scheduled', { waitUntil: 'domcontentloaded' });
    await sleep(2500);
    await page.screenshot({ path: path.resolve(REPO, 'tmp/scheduled-folder.png') });
    console.log('Screenshot of Scheduled folder saved.');
    await ctx.close();
    return;
  }

  const list = contacts.slice(0, MAX);
  let n = 0, ok = 0;
  for (const c of list) {
    const t = fmtTime(START_MIN + STEP * n);
    n++;
    try { if (await scheduleOne(`in:drafts to:${c.to}`, `[${n}] ${c.to}`, t)) ok++; }
    catch (e) {
      console.log(`  FAILED ${c.to}: ${e.message}`);
      const shot = `tmp/sched-error-${n}.png`;
      await page.screenshot({ path: path.resolve(REPO, shot) }).catch(() => {});
      // recover: close any open compose and continue
      for (let k = 0; k < 3; k++) { await page.keyboard.press('Escape').catch(() => {}); await sleep(300); }
      await waitClosed();
    }
  }
  console.log(`Done. Scheduled ${ok}/${list.length}.`);
  await ctx.close();
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
