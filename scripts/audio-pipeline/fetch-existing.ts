#!/usr/bin/env tsx
/**
 * Open an existing NotebookLM notebook (audio already generated) and
 * download the audio to public/audio/<slug>.m4a.
 *
 *   npx tsx scripts/audio-pipeline/fetch-existing.ts kroger "Kroger Yard Network"
 *
 * Used to grab audio out of notebooks the user (or an earlier pipeline
 * run) has already generated.
 */
import { resolve } from 'node:path';
import { mkdir, rename } from 'node:fs/promises';
import { openContext, closeContext } from './lib/browser';

const slug = process.argv[2];
const titleMatch = process.argv[3];
if (!slug || !titleMatch) {
  console.error('usage: fetch-existing.ts <slug> "<title-regex-fragment>"');
  process.exit(1);
}

async function main() {
  const ctx = await openContext({ headed: false });
  try {
    const page = await ctx.newPage();
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const card = page.locator(`text=/${titleMatch}/i`).first();
    if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) {
      throw new Error(`notebook matching "${titleMatch}" not found in dashboard`);
    }
    await card.click();
    await page.waitForTimeout(6000);

    // Confirm audio is ready.
    const playVisible = await page.locator('button[aria-label="Play"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!playVisible) {
      throw new Error('audio Play button not visible — generation may not have completed');
    }
    console.log('[fetch] audio Play button visible — audio is ready');

    // Click the LAST More button (audio-level).
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.locator('button[aria-label="More"]').last().click();
    await page.waitForTimeout(1500);
    await page.locator('[role="menuitem"]:has-text("Download")').first().click();

    const download = await downloadPromise;
    console.log(`[fetch] download triggered, filename: ${download.suggestedFilename()}`);

    const outPath = resolve(process.cwd(), `public/audio/${slug}.m4a`);
    await mkdir(resolve(outPath, '..'), { recursive: true });
    const tmp = await download.path();
    if (!tmp) throw new Error('download path empty');
    await rename(tmp, outPath);
    console.log(`[fetch] saved to ${outPath}`);
  } finally {
    await closeContext(ctx);
  }
}

main().catch((e) => {
  console.error(`[fetch] FAILED: ${e}`);
  process.exit(1);
});
