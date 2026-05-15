#!/usr/bin/env tsx
/**
 * Full-flow NotebookLM recon. Walks: landing → create notebook →
 * paste-text source → after-insert → look for Audio Overview & Video
 * Overview entry points & their customize panels. Captures PNG + HTML
 * + button-summary at each stage so we can write fresh selectors
 * against the live UI.
 *
 *   npx tsx scripts/audio-pipeline/recon-notebooklm.ts              # headless
 *   npx tsx scripts/audio-pipeline/recon-notebooklm.ts --headed      # if sign-in needed
 */
import { openContext, closeContext } from './lib/browser';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const headed = process.argv.includes('--headed');

const TEST_SOURCE = `# Smoke test source

This is a short synthetic memo used to walk the NotebookLM flow during
selector recon. The yard sits between every digital system you've invested
in — TMS, WMS, OMS, ERP — and none of them see what happens between the
guard shack and the dock door.

Tail end of a test source. Three paragraphs is enough for NotebookLM to
treat it as a real source.`;

async function snap(page: import('playwright').Page, label: string) {
  const outDir = resolve(process.cwd(), 'tmp/nblm-recon');
  await mkdir(outDir, { recursive: true });
  const pngPath = resolve(outDir, `${label}.png`);
  const htmlPath = resolve(outDir, `${label}.html`);
  const txtPath = resolve(outDir, `${label}.txt`);
  await page.screenshot({ path: pngPath, fullPage: false }).catch(() => {});
  const html = await page.content();
  await writeFile(htmlPath, html, 'utf8');
  const summary = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('button, [role="button"], [role="menuitem"], textarea, [contenteditable="true"], a').forEach((el) => {
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
  await writeFile(txtPath, summary, 'utf8');
  console.log(`[snap] ${label} png=${pngPath}`);
}

async function tryClick(
  page: import('playwright').Page,
  selectors: string[],
  label: string,
): Promise<string | null> {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log(`[click] ${label}: ${sel}`);
      await loc.click().catch((e) => console.log(`  click failed: ${e}`));
      return sel;
    }
  }
  console.log(`[click] ${label}: NO MATCH`);
  return null;
}

async function main() {
  console.log(`[recon] start headed=${headed}`);
  const ctx = await openContext({ headed });
  try {
    const page = await ctx.newPage();
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await snap(page, '01-landing');

    // Detect sign-in form vs dashboard.
    const onSignIn = await page.locator('input[type="email"], h1:has-text("Sign in"), input#identifierId').first().isVisible().catch(() => false);
    if (onSignIn) {
      console.log('[recon] SIGN-IN REQUIRED. Re-run with --headed to authenticate.');
      await snap(page, '01b-signin');
      return;
    }

    // Try multiple "new notebook" entry points.
    await tryClick(page, [
      'button:has-text("New notebook")',
      'button:has-text("Create new")',
      '[aria-label*="Create new notebook" i]',
      '[aria-label*="New notebook" i]',
      'button[aria-label*="Create" i]',
      'div[role="button"]:has-text("New notebook")',
    ], 'new-notebook');
    await page.waitForTimeout(3000);
    await snap(page, '02-after-new-notebook');

    // Find a paste-text option in the source-type chooser.
    await tryClick(page, [
      'button:has-text("Paste text")',
      'button:has-text("Copied text")',
      'button:has-text("Paste")',
      '[role="button"]:has-text("Paste text")',
      'div[role="button"]:has-text("Text")',
      'button:has-text("Text"):not(:has-text("YouTube"))',
    ], 'paste-text');
    await page.waitForTimeout(2000);
    await snap(page, '03-paste-panel');

    // Fill the textarea.
    const textareaSel = [
      'textarea[aria-label*="paste" i]',
      'textarea[placeholder*="paste" i]',
      'textarea',
      '[contenteditable="true"]',
    ];
    let filled = false;
    for (const sel of textareaSel) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 1500 }).catch(() => false)) {
        await loc.fill(TEST_SOURCE).catch(async () => {
          await loc.click();
          await loc.type(TEST_SOURCE);
        });
        console.log(`[fill] ${sel}`);
        filled = true;
        break;
      }
    }
    if (!filled) console.log('[fill] NO textarea matched');
    await snap(page, '04-paste-filled');

    // Click Insert.
    await tryClick(page, [
      'button:has-text("Insert")',
      'button:has-text("Add")',
      'button:has-text("Upload")',
      'button[aria-label*="Insert" i]',
    ], 'insert');
    await page.waitForTimeout(5000);
    await snap(page, '05-after-insert');

    // After insert, look for Studio panel with Audio Overview / Video Overview.
    await page.waitForTimeout(5000);
    await snap(page, '06-studio-panel');

    // Try to expand Audio Overview studio panel.
    await tryClick(page, [
      'button:has-text("Audio Overview")',
      '[aria-label*="Audio Overview" i]',
      'div:has-text("Audio Overview")',
    ], 'audio-overview-card');
    await page.waitForTimeout(2000);
    await snap(page, '07-audio-overview-expanded');

    // Try the Customize button.
    await tryClick(page, [
      'button:has-text("Customize")',
      '[aria-label*="Customize" i]',
    ], 'audio-customize');
    await page.waitForTimeout(2000);
    await snap(page, '08-audio-customize-panel');

    // Look for the customize textarea.
    const customizeTextareaCandidates = [
      'textarea[aria-label*="prompt" i]',
      'textarea[aria-label*="customize" i]',
      'textarea[placeholder*="topic" i]',
      'textarea[placeholder*="customize" i]',
      'textarea',
    ];
    for (const sel of customizeTextareaCandidates) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`[found] customize textarea: ${sel}`);
        break;
      }
    }

    // Close any modal and look for Video Overview.
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(1500);
    await snap(page, '09-after-escape');

    await tryClick(page, [
      'button:has-text("Video Overview")',
      '[aria-label*="Video Overview" i]',
      'div:has-text("Video Overview")',
    ], 'video-overview-card');
    await page.waitForTimeout(2000);
    await snap(page, '10-video-overview-expanded');

    console.log('[recon] done. Artifacts in tmp/nblm-recon/');
  } finally {
    await closeContext(ctx);
  }
}

main().catch((e) => {
  console.error('[recon] failed:', e);
  process.exit(1);
});
