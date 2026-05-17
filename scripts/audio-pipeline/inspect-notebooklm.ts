#!/usr/bin/env tsx
/**
 * Diagnostic — open NotebookLM with the cached profile, click through
 * the "create notebook → add source" flow, and snapshot the page at
 * each stage so we can read the real selectors.
 *
 * Run with `--headed` if a re-sign-in pops up.
 */

import { openContext, closeContext } from './lib/browser';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

async function snap(page: import('playwright').Page, label: string) {
  const outDir = resolve(process.cwd(), 'tmp/nblm-inspect');
  await mkdir(outDir, { recursive: true });
  const pngPath = resolve(outDir, `${label}.png`);
  const htmlPath = resolve(outDir, `${label}.html`);
  const txtPath = resolve(outDir, `${label}.txt`);
  await page.screenshot({ path: pngPath, fullPage: true }).catch(() => {});
  const html = await page.content();
  await writeFile(htmlPath, html, 'utf8');
  // Lightweight readable summary: every visible button + text input.
  const summary = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('button, [role="button"], [role="menuitem"], textarea, [contenteditable="true"]').forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') ?? '';
      const aria = el.getAttribute('aria-label') ?? '';
      const text = (el.textContent ?? '').trim().slice(0, 80);
      out.push(`${tag}[role=${role}] aria="${aria}" text="${text}"`);
    });
    return out.join('\n');
  });
  await writeFile(txtPath, summary, 'utf8');
  console.log(`SNAP ${label}: ${pngPath}`);
}

async function main() {
  const ctx = await openContext({ headed: true });
  try {
    const page = await ctx.newPage();
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await snap(page, '01-landing');

    // Try to start a new notebook. Common entry points.
    const newNotebookCandidates = [
      'button:has-text("Create new")',
      'button:has-text("New notebook")',
      'button:has-text("Create")',
      'button[aria-label*="Create" i]',
      'a:has-text("New notebook")',
    ];
    let opened = false;
    for (const sel of newNotebookCandidates) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible().catch(() => false)) {
        console.log(`CLICK ${sel}`);
        await loc.click();
        opened = true;
        break;
      }
    }
    if (!opened) console.log('NO "create new notebook" button matched — may already be inside a new notebook view');
    await page.waitForTimeout(3000);
    await snap(page, '02-after-create-click');

    // Look for the source-type chooser (PDF, Text, Google Doc, etc.).
    await page.waitForTimeout(2000);
    await snap(page, '03-source-chooser');

    // Try clicking on a Text/Paste option.
    const pasteCandidates = [
      'button:has-text("Paste text")',
      'button:has-text("Copied text")',
      'button:has-text("Text")',
      '[role="menuitem"]:has-text("Paste")',
      '[role="menuitem"]:has-text("Text")',
      'div:has-text("Paste text")',
    ];
    for (const sel of pasteCandidates) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible().catch(() => false)) {
        console.log(`CLICK paste candidate ${sel}`);
        await loc.click();
        break;
      }
    }
    await page.waitForTimeout(2000);
    await snap(page, '04-after-paste-click');

    console.log('Inspect complete. Review tmp/nblm-inspect/*.png and *.txt.');
  } finally {
    await closeContext(ctx);
  }
}

main().catch((e) => {
  console.error('inspect failed:', e);
  process.exit(1);
});
