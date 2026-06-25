// One-time HubSpot login in a persistent Playwright profile (same pattern as the
// Gmail profile). Casey logs in by hand in the window that opens; the session is
// saved to tmp/hubspot-pw-profile and reused by later HubSpot UI automation.
//
//   node scripts/hubspot/login.mjs
//
// Leaves the window open ~20 min. Once you see "LOGIN DETECTED" in the console
// the session is saved; you can close the window any time after that.

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'hubspot-pw-profile');
const PORTAL = '3819073';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(PROFILE_DIR, { recursive: true });
for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) { try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {} }

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false, channel: 'chrome', viewport: { width: 1280, height: 900 }, args: ['--start-maximized'],
});
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto('https://app.hubspot.com/login', { waitUntil: 'domcontentloaded' });
console.log('Opened HubSpot login. Please sign in (use the account on portal ' + PORTAL + ').');

// Poll for a logged-in URL (inside the portal, not on a /login or /oauth page).
const deadline = Date.now() + 20 * 60 * 1000;
let detected = false;
while (Date.now() < deadline) {
  const url = page.url();
  if (/app\.hubspot\.com\/(?!login|oauth)/.test(url) && (url.includes(`/${PORTAL}`) || /\/(contacts|reports|crm|dashboard|user-guide|home)\b/.test(url))) {
    if (!detected) { detected = true; console.log('LOGIN DETECTED:', url); console.log('Session saved to the profile. You can close the window now (or leave it).'); }
  }
  await sleep(2000);
}
console.log('Keepalive elapsed; closing.');
await ctx.close();
