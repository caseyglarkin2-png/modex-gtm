// Tier-1 cold batch: compose a fresh email per prospect (To + Bcc + subject +
// body with the proof frame pasted inline), then Schedule-send for Mon Jun 8
// 2026, staggered every 2 min from 9:00 AM ET (after the Allentown reply-bumps,
// which run 7:30-8:44, so the two campaigns don't collide in one window).
//
//   node scripts/allentown-emails/compose-schedule-tier1.mjs --dry --max 1   (compose+fill, screenshot, discard - nothing scheduled)
//   node scripts/allentown-emails/compose-schedule-tier1.mjs --max 1         (schedule first only)
//   node scripts/allentown-emails/compose-schedule-tier1.mjs                 (all 36)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { contacts, BCC } from './tier1-contacts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const PHOTO_PATH = path.join(REPO, 'output', 'prospect-discovery', 'tier1-proof-image.jpg');
const PHOTO_B64 = fs.readFileSync(PHOTO_PATH).toString('base64');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DRY = process.argv.includes('--dry');
const MAXi = process.argv.indexOf('--max');
const MAX = MAXi !== -1 ? parseInt(process.argv[MAXi + 1], 10) : Infinity;
// --idx 6,24,28 : schedule ONLY these original-array indices, each at its
// index-based time slot (START + 2*idx). Used to re-schedule corrected rows.
const IDXi = process.argv.indexOf('--idx');
const IDX = IDXi !== -1 ? process.argv[IDXi + 1].split(',').map((x) => parseInt(x, 10)) : null;

const DATE = 'Jun 8, 2026';
const START_MIN = 9 * 60;   // 9:00 AM ET
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
  throw new Error('none visible: ' + sels.join(' | '));
}

async function main() {
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) { try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {} }
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, channel: 'chrome', viewport: { width: 1280, height: 900 }, args: ['--start-maximized'] });
  ctx.setDefaultTimeout(15000);
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://mail.google.com' });
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto('https://mail.google.com/mail/u/0/#inbox', { waitUntil: 'domcontentloaded' });
  const compose = await firstVisible(page, ['div[gh="cm"]', 'div[role="button"]:has-text("Compose")'], 300000);
  await sleep(1000);

  async function waitClosed() { const t = Date.now() + 8000; while (Date.now() < t) { if ((await page.locator('div[role="dialog"]').count()) === 0) return; await sleep(250); } }
  async function killNotifBar() {
    for (const s of ['span:has-text("No thanks")', 'div[role="button"]:has-text("No thanks")']) {
      const l = page.locator(s).last();
      if (await l.count().catch(() => 0) && await l.isVisible().catch(() => false)) { await l.click({ force: true }).catch(() => {}); await sleep(400); return; }
    }
  }
  async function openSendMenu(dialog) {
    const more = await firstVisible(dialog, ['[aria-label="More send options"]'], 8000);
    for (let i = 0; i < 5; i++) {
      await more.click({ force: true });
      await sleep(800);
      if ((await page.locator('[role="menuitem"]:visible').count()) > 0) return true;
      await page.mouse.move(640, 280); await sleep(300);
    }
    return false;
  }

  async function doOne(c, timeStr, n) {
    await waitClosed();
    await compose.click();
    const dialog = await firstVisible(page, ['div[role="dialog"]'], 10000);
    await sleep(900);

    const to = await firstVisible(dialog, ['input[aria-label^="To"]', 'textarea[name="to"]'], 8000);
    await to.fill(c.to); await page.keyboard.press('Enter'); await sleep(300);

    await page.keyboard.press('Control+Shift+B'); await sleep(650);
    try { const b = await firstVisible(dialog, ['input[aria-label="BCC recipients"]', 'input[aria-label^="Bcc"]', 'input[aria-label*="Bcc"]'], 2500); await b.click({ force: true }); } catch {}
    await page.keyboard.type(BCC); await page.keyboard.press('Enter'); await sleep(300);

    const subj = await firstVisible(dialog, ['input[name="subjectbox"]'], 8000);
    await subj.fill(c.subject); await sleep(250);

    const body = await firstVisible(dialog, ['div[aria-label="Message Body"]', 'div[role="textbox"][g_editable="true"]'], 8000);
    await body.click({ force: true });
    await body.evaluate((el, blocks) => {
      const ref = el.firstChild;
      const TXT = 'margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a';
      for (const b of blocks) {
        const p = document.createElement('p');
        if (b && b.img) { p.id = '__photo_here__'; p.style.cssText = 'margin:16px 0'; p.appendChild(document.createElement('br')); }
        else { p.style.cssText = TXT; p.textContent = b; }
        el.insertBefore(p, ref);
      }
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }, c.blocks);

    // paste proof frame inline at the marker
    await body.evaluate((el) => {
      const m = el.querySelector('#__photo_here__');
      const sel = window.getSelection(); const r = document.createRange();
      r.selectNodeContents(m); r.collapse(true);
      sel.removeAllRanges(); sel.addRange(r); el.focus();
    });
    await page.evaluate(async (b64) => {
      const bin = atob(b64); const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const jpeg = new Blob([arr], { type: 'image/jpeg' });
      const bmp = await createImageBitmap(jpeg);
      const canvas = document.createElement('canvas');
      canvas.width = bmp.width; canvas.height = bmp.height;
      canvas.getContext('2d').drawImage(bmp, 0, 0);
      const png = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    }, PHOTO_B64);
    await page.keyboard.press('Control+V');
    await sleep(2200); // let Gmail upload + embed
    console.log(`  [${c.to}] composed`);

    if (DRY) {
      await page.screenshot({ path: path.resolve(REPO, `tmp/tier1-dry-${n}.png`) });
      console.log(`DRY ${c.to}: composed + image (screenshot saved, not scheduled)`);
      const discard = await firstVisible(dialog, ['[aria-label="Discard draft"]'], 4000).catch(() => null);
      if (discard) await discard.click({ force: true }).catch(() => {});
      await waitClosed();
      return true;
    }

    await killNotifBar(); await sleep(300);
    if (!(await openSendMenu(dialog))) throw new Error('send menu did not open');
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
    await waitClosed(); await sleep(800);
    console.log(`scheduled ${c.to} -> ${DATE} ${timeStr}`);
    return true;
  }

  // Each entry: { c, slot } where slot is the time-offset index.
  const entries = IDX
    ? IDX.map((i) => ({ c: contacts[i], slot: i }))
    : contacts.slice(0, MAX).map((c, i) => ({ c, slot: i }));
  let n = 0, ok = 0;
  for (const { c, slot } of entries) {
    const t = fmtTime(START_MIN + STEP * slot);
    n++;
    try { if (await doOne(c, t, n)) ok++; }
    catch (e) {
      console.log(`  FAILED ${c.to}: ${String(e.message).split('\n')[0]}`);
      await page.screenshot({ path: path.resolve(REPO, `tmp/tier1-error-${n}.png`) }).catch(() => {});
      for (let k = 0; k < 5; k++) { await page.keyboard.press('Escape').catch(() => {}); await sleep(300); }
      await waitClosed();
    }
  }
  console.log(`\nDone. ${DRY ? 'Dry-composed' : 'Scheduled'} ${ok}/${entries.length}.`);
  await ctx.close();
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
