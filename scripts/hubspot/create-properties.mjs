// Create the two Contact properties for the A/B reporting (single-line text).
// HubSpot derives the internal name from the label: "Yardflow Experiment Id" ->
// yardflow_experiment_id, "Yardflow Variant" -> yardflow_variant. Verified after
// via the HubSpot MCP get_properties.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO, 'tmp', 'hubspot-pw-profile');
const PORTAL = '3819073';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROPS = [
  { label: 'Yardflow Experiment Id', desc: 'A/B subject-line experiment id from the modex-gtm draft queue (experiment_id).' },
  { label: 'Yardflow Variant', desc: 'A/B variant arm (variant_key) for the send, e.g. A or B.' },
];

for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) { try { fs.rmSync(path.join(PROFILE_DIR, f), { force: true }); } catch {} }
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, channel: 'chrome', viewport: { width: 1400, height: 900 }, args: ['--start-maximized'] });
ctx.setDefaultTimeout(30000);
const page = ctx.pages()[0] || (await ctx.newPage());

async function createProp(p, i) {
  await page.goto(`https://app.hubspot.com/property-settings/${PORTAL}/properties?type=0-1`, { waitUntil: 'domcontentloaded' });
  await sleep(4500);
  if (page.url().includes('/login')) throw new Error('NOT AUTHENTICATED - session expired');
  await page.locator('[data-test-id="create-property-button"]').first().click();
  const labelInput = page.locator('[data-test-id="property-label-input"]').first();
  await labelInput.waitFor({ state: 'visible', timeout: 15000 });
  await labelInput.click();
  await labelInput.fill(p.label);
  await sleep(800);
  // confirm: the footer "Create property" (distinct from the open trigger). Pick the
  // last enabled match.
  const confirm = page.getByRole('button', { name: 'Create property', exact: true });
  const n = await confirm.count();
  let clicked = false;
  for (let k = n - 1; k >= 0; k--) {
    const b = confirm.nth(k);
    if ((await b.isVisible().catch(() => false)) && (await b.isEnabled().catch(() => false))) {
      const dt = await b.getAttribute('data-test-id').catch(() => '');
      if (dt === 'create-property-button') continue; // skip the open trigger
      await b.click(); clicked = true; break;
    }
  }
  if (!clicked) { await confirm.last().click({ force: true }); }
  await sleep(3500);
  await page.screenshot({ path: path.resolve(REPO, `tmp/hs-created-${i}.png`) });
  console.log(`submitted: ${p.label}`);
}

let ok = 0;
for (let i = 0; i < PROPS.length; i++) {
  try { await createProp(PROPS[i], i); ok++; }
  catch (e) { console.log(`FAILED ${PROPS[i].label}: ${String(e.message).split('\n')[0]}`); await page.screenshot({ path: path.resolve(REPO, `tmp/hs-create-fail-${i}.png`) }).catch(() => {}); }
}
console.log(`Done. Submitted ${ok}/${PROPS.length}.`);
await sleep(1500);
await ctx.close();
