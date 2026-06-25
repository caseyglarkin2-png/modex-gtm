// Remove specific scheduled messages by subject phrase (row-hover Delete →
// Trash, won't send, recoverable). Used to pause the duplicate Webb email and
// clean up the zz test.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'gmail-pw-profile');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TARGETS = ['a living terminal yard', 'zz-schedule-test'];

for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) { try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {} }
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, channel: 'chrome', viewport: { width: 1280, height: 900 } });
ctx.setDefaultTimeout(15000);
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto('https://mail.google.com/mail/u/0/#scheduled', { waitUntil: 'domcontentloaded' });
const dl = Date.now() + 60000;
while (Date.now() < dl) { if (await page.locator('div[gh="cm"]').first().isVisible().catch(() => false)) break; await sleep(300); }
await sleep(1500);

for (const phrase of TARGETS) {
  const row = page.locator('tr.zA:visible', { hasText: phrase }).first();
  if (!(await row.count())) { console.log(`not found: "${phrase}"`); continue; }
  await row.hover(); await sleep(400);
  await row.locator('[aria-label="Delete"], [data-tooltip="Delete"]').first().click({ force: true });
  await sleep(1000);
  console.log(`removed scheduled: "${phrase}"`);
}
await sleep(800);
console.log('REMAINING SCHEDULED:', JSON.stringify(await page.locator('tr.zA:visible').allInnerTexts()));
await ctx.close();
