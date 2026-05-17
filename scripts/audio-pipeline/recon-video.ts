#!/usr/bin/env tsx
/**
 * Recon the studio-panel state of a notebook that has a COMPLETED video
 * overview, so we can write correct video-download selectors. Pass a
 * title fragment for a notebook known to have a generated video.
 *
 *   npx tsx scripts/audio-pipeline/recon-video.ts "Kraft Heinz"
 */
import { openContext, closeContext } from './lib/browser';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const titleMatch = process.argv[2] ?? 'Kraft Heinz';

async function snap(page: import('playwright').Page, label: string) {
  const outDir = resolve(process.cwd(), 'tmp/nblm-recon-video');
  await mkdir(outDir, { recursive: true });
  await page.screenshot({ path: resolve(outDir, `${label}.png`), fullPage: false }).catch(() => {});
  await writeFile(resolve(outDir, `${label}.html`), await page.content(), 'utf8').catch(() => {});
  const summary = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('button, [role="button"], [role="menuitem"], video, audio, a').forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') ?? '';
      const aria = el.getAttribute('aria-label') ?? '';
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 90);
      out.push(`${tag} role="${role}" aria="${aria}" text="${text}"`);
    });
    return out.join('\n');
  });
  await writeFile(resolve(outDir, `${label}.txt`), summary, 'utf8').catch(() => {});
  console.log(`[snap] ${label}`);
}

async function main() {
  const ctx = await openContext({ headed: false });
  try {
    const page = await ctx.newPage();
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await snap(page, '01-dashboard');

    const card = page.locator(`text=/${titleMatch}/i`).first();
    if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(`[recon-video] notebook matching "${titleMatch}" not found`);
      return;
    }
    await card.click();
    await page.waitForTimeout(6000);
    await snap(page, '02-notebook-opened');

    // Enumerate every More button + its surrounding context.
    const moreContext = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll('button[aria-label="More"]').forEach((btn, i) => {
        // Walk up to find a recognizable container label.
        let ctx = '';
        let node: HTMLElement | null = btn as HTMLElement;
        for (let depth = 0; depth < 6 && node; depth++) {
          const t = (node.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 120);
          if (t) ctx = t;
          node = node.parentElement;
        }
        const rect = (btn as HTMLElement).getBoundingClientRect();
        out.push(`More[${i}] y=${Math.round(rect.y)} context="${ctx}"`);
      });
      return out.join('\n');
    });
    console.log('[recon-video] More buttons + context:');
    console.log(moreContext);

    // Look for video / audio media elements.
    const videoCount = await page.locator('video').count();
    const audioCount = await page.locator('audio').count();
    console.log(`[recon-video] <video>=${videoCount}, <audio>=${audioCount}`);

    // Try each More button and snap its menu.
    const moreButtons = page.locator('button[aria-label="More"]');
    const n = await moreButtons.count();
    for (let i = 0; i < n; i++) {
      await moreButtons.nth(i).click().catch(() => {});
      await page.waitForTimeout(1200);
      const items = await page.evaluate(() => {
        const out: string[] = [];
        document.querySelectorAll('[role="menuitem"]').forEach((el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.width < 1) return;
          out.push((el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60));
        });
        return out;
      });
      console.log(`[recon-video] More[${i}] menu items: ${JSON.stringify(items)}`);
      await snap(page, `03-more-${i}-menu`);
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(800);
    }

    console.log('[recon-video] done. Artifacts in tmp/nblm-recon-video/');
  } finally {
    await closeContext(ctx);
  }
}

main().catch((e) => {
  console.error('[recon-video] failed:', e);
  process.exit(1);
});
