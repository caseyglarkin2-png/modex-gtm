// Drives Chrome (your logged-in Gmail) to create Allentown drafts with the
// pilot photo embedded inline (pasted as a real image). Drafts only — nothing sent.
//
// Usage:
//   node scripts/allentown-emails/build-drafts.mjs --limit 1 --shot tmp/d.png
//   node scripts/allentown-emails/build-drafts.mjs --start 3        (resume)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { contacts, BCC } from './contacts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const PHOTO_PATH = path.join(REPO, 'tmp', 'allentown-pilot.jpg');
const PHOTO_B64 = fs.readFileSync(PHOTO_PATH).toString('base64'); // read once, in Node

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const START = parseInt(arg('start', '0'), 10);
const LIMIT = parseInt(arg('limit', String(contacts.length)), 10);
const SHOT = arg('shot', '');
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
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://mail.google.com' });
  const page = ctx.pages()[0] || (await ctx.newPage());

  console.log('Opening Gmail…');
  await page.goto('https://mail.google.com/mail/u/0/#inbox', { waitUntil: 'domcontentloaded' });
  console.log('Waiting for Gmail to be logged in (Compose button)…');
  const compose = await firstVisible(page, ['div[gh="cm"]', 'div[role="button"]:has-text("Compose")'], 300000);
  console.log('Logged in. Building drafts…');

  async function waitClosed() {
    const t = Date.now() + 8000;
    while (Date.now() < t) {
      if ((await page.locator('div[role="dialog"]').count()) === 0) return;
      await sleep(250);
    }
  }

  async function doContact(c, n) {
    await waitClosed();
    await compose.click();
    const dialog = await firstVisible(page, ['div[role="dialog"]'], 10000);
    await sleep(900);

    // To
    const to = await firstVisible(dialog, ['input[aria-label^="To"]', 'textarea[name="to"]'], 8000);
    await to.fill(c.to);
    await page.keyboard.press('Enter');
    await sleep(300);

    // Bcc — Ctrl+Shift+B opens AND focuses the field; type into it
    await page.keyboard.press('Control+Shift+B');
    await sleep(650);
    try { const b = await firstVisible(dialog, ['input[aria-label^="Bcc"]', 'input[aria-label*="Bcc"]'], 2500); await b.click({ force: true }); } catch {}
    await page.keyboard.type(BCC);
    await page.keyboard.press('Enter');
    await sleep(300);

    // Subject — fill() focuses+sets without a fragile pre-click
    const subj = await firstVisible(dialog, ['input[name="subjectbox"]'], 8000);
    await subj.fill(c.subject);
    await sleep(250);

    // Body — text blocks with a marker paragraph where the photo goes
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

    // Photo — paste the real file inline at the marker (true embedded image)
    await body.evaluate((el) => {
      const m = el.querySelector('#__photo_here__');
      const sel = window.getSelection();
      const r = document.createRange();
      r.selectNodeContents(m); r.collapse(true);
      sel.removeAllRanges(); sel.addRange(r);
      el.focus();
    });
    await page.evaluate(async (b64) => {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const jpeg = new Blob([arr], { type: 'image/jpeg' });
      const bmp = await createImageBitmap(jpeg); // clipboard write only supports png
      const canvas = document.createElement('canvas');
      canvas.width = bmp.width; canvas.height = bmp.height;
      canvas.getContext('2d').drawImage(bmp, 0, 0);
      const png = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    }, PHOTO_B64);
    await page.keyboard.press('Control+V');
    await sleep(2000); // let Gmail upload + embed the pasted image

    if (SHOT && n === START + 1) {
      await page.screenshot({ path: path.resolve(REPO, SHOT) });
      console.log(`Screenshot saved: ${SHOT}`);
    }

    const close = await firstVisible(dialog, ['[aria-label="Save & close"]', 'img[aria-label="Save & close"]'], 6000);
    await close.click({ force: true });
    await waitClosed();
  }

  const slice = contacts.slice(START, START + LIMIT);
  let n = START;
  for (const c of slice) {
    n++;
    console.log(`[${n}/${contacts.length}] ${c.to}`);
    try {
      await doContact(c, n);
      console.log('  saved draft');
    } catch (err) {
      console.log(`  hiccup (${err.message}); retrying once…`);
      for (let k = 0; k < 3; k++) { await page.keyboard.press('Escape').catch(() => {}); await sleep(300); }
      await waitClosed();
      try {
        await doContact(c, n);
        console.log('  saved draft (retry)');
      } catch (err2) {
        const shot = `tmp/draft-error-${n}.png`;
        await page.screenshot({ path: path.resolve(REPO, shot) }).catch(() => {});
        console.log(`  FAILED on ${c.to}: ${err2.message} (screenshot: ${shot})`);
        throw err2;
      }
    }
  }

  console.log(`Done. Created ${slice.length} draft(s).`);
  if (!SHOT) await ctx.close();
  else console.log('Leaving browser open for review.');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
