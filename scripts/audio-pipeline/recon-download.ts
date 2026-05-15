#!/usr/bin/env tsx
/**
 * Download-only recon — opens the existing Kroger notebook (audio
 * already generated), clicks the audio-level More menu, and snaps the
 * menu options so we can find the Download menuitem selector.
 */
import { openContext, closeContext } from './lib/browser';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function snap(page: import('playwright').Page, label: string) {
  const outDir = resolve(process.cwd(), 'tmp/nblm-download-recon');
  await mkdir(outDir, { recursive: true });
  await page.screenshot({ path: resolve(outDir, `${label}.png`), fullPage: false }).catch(() => {});
  await writeFile(resolve(outDir, `${label}.html`), await page.content(), 'utf8').catch(() => {});
  const summary = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('button, [role="button"], [role="menuitem"], textarea, audio, a').forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') ?? '';
      const aria = el.getAttribute('aria-label') ?? '';
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 100);
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

    // Find the Kroger notebook row and click it.
    const kroger = page.locator('text=/Kroger Yard Network Operating Layer/i').first();
    if (await kroger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await kroger.click();
    } else {
      console.log('[recon] could not find Kroger notebook in dashboard');
    }
    await page.waitForTimeout(6000);
    await snap(page, '02-notebook-opened');

    // The audio overview should already be generated. Try to find its inline
    // More button — it's the LAST aria="More" button on the page (after Play).
    const allMoreCount = await page.locator('button[aria-label="More"]').count();
    console.log(`[probe] More buttons total: ${allMoreCount}`);
    const playVisible = await page.locator('button[aria-label="Play"]').first().isVisible().catch(() => false);
    console.log(`[probe] Play button visible: ${playVisible}`);

    // Click the LAST More button (audio-level).
    await page.locator('button[aria-label="More"]').last().click();
    await page.waitForTimeout(2000);
    await snap(page, '03-audio-more-menu');

    // Snap the menu items now visible.
    const menuItems = await page.evaluate(() => {
      const out: { tag: string; role: string; aria: string; text: string }[] = [];
      document.querySelectorAll('[role="menuitem"], [role="menu"] button, .mat-mdc-menu-item').forEach((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        out.push({
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') ?? '',
          aria: el.getAttribute('aria-label') ?? '',
          text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
        });
      });
      return out;
    });
    console.log('[recon] menu items after clicking audio More:');
    for (const m of menuItems) {
      console.log(`  ${m.tag} role="${m.role}" aria="${m.aria}" text="${m.text}"`);
    }

    console.log('[recon] done. Artifacts in tmp/nblm-download-recon/');
  } finally {
    await closeContext(ctx);
  }
}

main().catch((e) => {
  console.error('[recon] failed:', e);
  process.exit(1);
});
