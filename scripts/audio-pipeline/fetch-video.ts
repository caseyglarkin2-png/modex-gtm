#!/usr/bin/env tsx
/**
 * Open an existing NotebookLM notebook and download its Video Overview
 * (.mp4) to public/audio/<slug>-video.mp4.
 *
 *   npx tsx scripts/audio-pipeline/fetch-video.ts kroger "Kroger"
 *
 * NotebookLM studio outputs all share an identical More menu (Rename /
 * Download / Share / ...), so a video output cannot be distinguished
 * from an audio output by selector alone. Strategy: iterate every More
 * button newest-first, trigger Download, and inspect the suggested
 * filename — keep the first `.mp4`, discard everything else. In a clean
 * pipeline notebook (1 source + 1 audio + 1 video) this finds the
 * video on the first or second try.
 */
import { resolve } from 'node:path';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { openContext, closeContext } from './lib/browser';

const slug = process.argv[2];
const titleMatch = process.argv[3];
if (!slug || !titleMatch) {
  console.error('usage: fetch-video.ts <slug> "<title-regex-fragment>"');
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
      console.log(`[${slug}] SKIP: notebook matching "${titleMatch}" not found`);
      return;
    }
    await card.click();
    await page.waitForTimeout(6000);

    const moreButtons = page.locator('button[aria-label="More"]');
    const n = await moreButtons.count();
    console.log(`[${slug}] ${n} More buttons on page`);
    // A clean pipeline notebook: source-More + audio-More (+ video-More
    // once video exists). 2 = audio only, 3+ = audio + video. The
    // brute-force loop below confirms by inspecting downloaded
    // extensions, so we only bail when there's clearly nothing.
    if (n < 2) {
      console.log(`[${slug}] SKIP: only ${n} More buttons — nothing to download`);
      return;
    }

    // Iterate newest-first (last More buttons are the most recent studio
    // outputs; video is generated after audio so it's near the end).
    let savedMp4 = false;
    for (let i = n - 1; i >= 0 && !savedMp4; i--) {
      try {
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        await moreButtons.nth(i).click();
        await page.waitForTimeout(1200);
        const dl = page.locator('[role="menuitem"]:has-text("Download")').first();
        if (!(await dl.isVisible({ timeout: 2000 }).catch(() => false))) {
          // This More menu has no Download (e.g. a source). Close and skip.
          await page.keyboard.press('Escape').catch(() => {});
          await page.waitForTimeout(400);
          continue;
        }
        await dl.click();
        const download = await downloadPromise;
        const filename = download.suggestedFilename();
        if (filename.toLowerCase().endsWith('.mp4')) {
          const outPath = resolve(process.cwd(), `public/audio/${slug}-video.mp4`);
          await mkdir(resolve(outPath, '..'), { recursive: true });
          const tmp = await download.path();
          if (!tmp) throw new Error('download path empty');
          await rename(tmp, outPath);
          console.log(`[${slug}] SAVED video: ${filename} -> ${outPath}`);
          savedMp4 = true;
        } else {
          // Not the video — discard the downloaded file.
          const tmp = await download.path().catch(() => null);
          if (tmp) await unlink(tmp).catch(() => {});
          console.log(`[${slug}]   More[${i}] -> ${filename} (not mp4, discarded)`);
        }
      } catch (e) {
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(400);
        console.log(`[${slug}]   More[${i}] -> error: ${String(e).slice(0, 80)}`);
      }
    }

    if (!savedMp4) {
      console.log(`[${slug}] SKIP: no .mp4 output found across ${n} More menus`);
    }
  } finally {
    await closeContext(ctx);
  }
}

main().catch((e) => {
  console.error(`[${slug}] FAILED: ${e}`);
  process.exit(1);
});
