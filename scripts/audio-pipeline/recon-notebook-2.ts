#!/usr/bin/env tsx
/**
 * Second recon pass — open the existing test notebook (created by the
 * first recon) and capture: (a) the Customize Audio Overview modal, and
 * (b) the post-generation Audio Overview player UI (download button,
 * etc.). The first recon left a notebook titled "The Yard: Logistics'
 * Digital Blind Spot" with audio generation in progress.
 */
import { openContext, closeContext } from './lib/browser';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const headed = process.argv.includes('--headed');

async function snap(page: import('playwright').Page, label: string) {
  const outDir = resolve(process.cwd(), 'tmp/nblm-recon-2');
  await mkdir(outDir, { recursive: true });
  await page.screenshot({ path: resolve(outDir, `${label}.png`), fullPage: false }).catch(() => {});
  await writeFile(resolve(outDir, `${label}.html`), await page.content(), 'utf8');
  const summary = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('button, [role="button"], textarea, [contenteditable="true"], a, audio, video').forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') ?? '';
      const aria = el.getAttribute('aria-label') ?? '';
      const dataTid = el.getAttribute('data-testid') ?? '';
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 100);
      out.push(`${tag} role="${role}" aria="${aria}" data-testid="${dataTid}" text="${text}"`);
    });
    return out.join('\n');
  });
  await writeFile(resolve(outDir, `${label}.txt`), summary, 'utf8');
  console.log(`[snap] ${label}`);
}

async function main() {
  console.log(`[recon-2] start headed=${headed}`);
  const ctx = await openContext({ headed });
  try {
    const page = await ctx.newPage();
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await snap(page, '01-dashboard');

    // Find and click the existing notebook.
    const notebookCardSelectors = [
      'a[aria-label*="Yard" i]',
      'a:has-text("The Yard")',
      'div[role="button"]:has-text("The Yard")',
      'a:has-text("Digital Blind Spot")',
    ];
    let opened = false;
    for (const sel of notebookCardSelectors) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`[click] notebook card: ${sel}`);
        await loc.click();
        opened = true;
        break;
      }
    }
    if (!opened) {
      console.log('[recon-2] could not find existing test notebook. Trying first card.');
      await page.locator('a[href*="/notebook/"]').first().click().catch(() => {});
    }
    await page.waitForTimeout(5000);
    await snap(page, '02-notebook-opened');

    // Click Customize Audio Overview chevron — this should open the audio customize modal.
    await page.locator('button[aria-label="Customize Audio Overview"]').first().click().catch((e) =>
      console.log(`audio customize click failed: ${e}`),
    );
    await page.waitForTimeout(3000);
    await snap(page, '03-audio-customize-modal');

    // Find the customize textarea.
    const customizeAudio = await page.locator('textarea[aria-label*="audio" i]').first().getAttribute('aria-label').catch(() => null);
    console.log(`[probe] audio customize textarea aria-label: ${customizeAudio}`);

    // Close modal.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);
    await snap(page, '04-after-close-audio-customize');

    // Look for the generated audio overview player. Once generation completes,
    // the Studio panel shows the audio player + download option.
    // Try to find any audio player or "download" button or any item under Audio.
    await snap(page, '05-studio-state');

    // Probe for known audio-overview output indicators.
    const probeSelectors = [
      'audio',
      'button[aria-label*="Download" i]',
      'button[aria-label*="More" i]:not([aria-label*="summary" i])',
      'button:has-text("Download")',
      '[role="menuitem"]:has-text("Download")',
      'div:has-text("Generating Audio Overview")',
      'div:has-text("Yard")', // any title shown for the generated audio
    ];
    for (const sel of probeSelectors) {
      const count = await page.locator(sel).count();
      console.log(`[probe] ${sel} count=${count}`);
    }

    // Click the more-options/menu icon for the audio output if present.
    // The audio overview entry should appear in the studio panel after gen.
    await page.locator('button[aria-label*="More" i]').first().click().catch(() => {
      console.log('no More button visible');
    });
    await page.waitForTimeout(2000);
    await snap(page, '06-after-more-click');

    console.log('[recon-2] done. Artifacts in tmp/nblm-recon-2/');
  } finally {
    await closeContext(ctx);
  }
}

main().catch((e) => {
  console.error('[recon-2] failed:', e);
  process.exit(1);
});
