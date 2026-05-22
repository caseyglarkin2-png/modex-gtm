#!/usr/bin/env node
/**
 * Inspect the exact `roi-v2-state` localStorage shape that the V2
 * calculator writes / reads on yardflow.ai/roi.
 *
 * D8.1 depends on us writing the SAME shape from the demo, so the
 * calculator picks up our pre-filled values on mount. Run this script
 * monthly to detect drift; commit the output as a reference snapshot.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

console.log('→ navigating to https://yardflow.ai/roi/');
await page.goto('https://yardflow.ai/roi/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Read whatever the calculator has stored. If nothing yet (fresh visit),
// we need to trigger a state write — change one input by 1 and snapshot.
const initial = await page.evaluate(() => localStorage.getItem('roi-v2-state'));
console.log('\nINITIAL localStorage["roi-v2-state"]:');
console.log(initial ? initial.slice(0, 4000) : '(empty — calc hasn\'t persisted yet)');

// Touch the facility count input to force a state write
const facilityInput = page.locator('input[type="number"]').first();
const before = await facilityInput.inputValue();
await facilityInput.fill(String(Number(before) + 1));
await page.waitForTimeout(800);
await facilityInput.fill(before);
await page.waitForTimeout(800);

const afterTouch = await page.evaluate(() => localStorage.getItem('roi-v2-state'));
console.log('\nAFTER TOUCHING INPUT localStorage["roi-v2-state"]:');
if (afterTouch) {
  try {
    const parsed = JSON.parse(afterTouch);
    console.log(JSON.stringify(parsed, null, 2));
    // Save snapshot for type generation
    const fs = await import('node:fs');
    fs.writeFileSync('tmp/roi-v2-state.snapshot.json', JSON.stringify(parsed, null, 2));
    console.log('\n→ saved snapshot to tmp/roi-v2-state.snapshot.json');
  } catch {
    console.log(afterTouch);
  }
} else {
  console.log('(still empty)');
}

await browser.close();
