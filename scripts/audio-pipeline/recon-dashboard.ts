#!/usr/bin/env tsx
/**
 * List every notebook on the NotebookLM dashboard with its title and
 * source count, so we can see which notebook holds a given account's
 * video. Newest notebooks render first.
 */
import { openContext, closeContext } from './lib/browser';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const ctx = await openContext({ headed: false });
  try {
    const page = await ctx.newPage();
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    await mkdir(resolve(process.cwd(), 'tmp'), { recursive: true });
    await page.screenshot({ path: resolve(process.cwd(), 'tmp/recon-dashboard.png'), fullPage: true }).catch(() => {});

    // Grab every row/card of the notebook list.
    const rows = await page.evaluate(() => {
      const out: string[] = [];
      // Try table rows first, then card grid.
      const seen = new Set<string>();
      document.querySelectorAll('tr, [role="row"], a[href*="/notebook/"], [class*="notebook"]').forEach((el) => {
        const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ');
        if (text.length > 8 && text.length < 200 && !seen.has(text)) {
          seen.add(text);
          out.push(text);
        }
      });
      return out;
    });
    console.log(`[dashboard] ${rows.length} candidate rows:`);
    for (const r of rows) console.log(`  ${r}`);
  } finally {
    await closeContext(ctx);
  }
}

main().catch((e) => {
  console.error('[recon-dashboard] failed:', e);
  process.exit(1);
});
