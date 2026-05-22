#!/usr/bin/env node
/**
 * Scrape yardflow.ai/roi (the approved ROI model) and yardflow.ai/YNS
 * (the sales deck hub) exhaustively. Outputs to tmp/scrape/.
 *
 *   - Full HTML
 *   - All <input>, <select>, <button> with attrs
 *   - All inline scripts (the model formulas live here)
 *   - All visible text
 *   - Computed default outputs
 *   - Full-page screenshots
 *   - For ROI: try moving each slider and observe output change
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('tmp/scrape', { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await ctx.newPage();

async function dumpPage(label, url) {
  console.log(`\n══ ${label} — ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForTimeout(1500);

  // Full HTML
  const html = await page.content();
  writeFileSync(`tmp/scrape/${label}.html`, html);

  // Visible text
  const text = await page.evaluate(() => document.body.innerText);
  writeFileSync(`tmp/scrape/${label}.txt`, text);

  // All <script type=module|nothing> sources + inline content
  const scripts = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script')).map((s) => ({
      src: s.src || null,
      type: s.type || null,
      inline: s.src ? null : (s.textContent || '').slice(0, 60000),
    })),
  );
  writeFileSync(`tmp/scrape/${label}.scripts.json`, JSON.stringify(scripts, null, 2));

  // All form controls
  const controls = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('input, select, textarea').forEach((el) => {
      const r = el.getBoundingClientRect();
      out.push({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        id: el.id || null,
        name: el.getAttribute('name'),
        ariaLabel: el.getAttribute('aria-label'),
        labelText:
          (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()) || null,
        precedingText: el.closest('label')?.textContent?.trim() || null,
        value: el.value,
        defaultValue: el.defaultValue,
        min: el.getAttribute('min'),
        max: el.getAttribute('max'),
        step: el.getAttribute('step'),
        placeholder: el.getAttribute('placeholder'),
        options:
          el.tagName === 'SELECT'
            ? Array.from(el.options).map((o) => ({ value: o.value, label: o.textContent }))
            : null,
        visible: r.width > 0 && r.height > 0,
      });
    });
    return out;
  });
  writeFileSync(`tmp/scrape/${label}.controls.json`, JSON.stringify(controls, null, 2));
  console.log(`  ${controls.length} form controls`);

  // All buttons and links with href
  const interactives = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, a[href]').forEach((el) => {
      const r = el.getBoundingClientRect();
      out.push({
        tag: el.tagName.toLowerCase(),
        href: el.getAttribute('href') || null,
        text: (el.textContent || '').trim().slice(0, 200),
        ariaLabel: el.getAttribute('aria-label') || null,
        dataAttrs: Object.fromEntries(
          Array.from(el.attributes)
            .filter((a) => a.name.startsWith('data-'))
            .map((a) => [a.name, a.value]),
        ),
        visible: r.width > 0 && r.height > 0,
      });
    });
    return out;
  });
  writeFileSync(`tmp/scrape/${label}.interactive.json`, JSON.stringify(interactives, null, 2));
  console.log(`  ${interactives.length} buttons/links`);

  // All text nodes that look like numbers in context (KPI tiles, totals)
  const numericNodes = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      if (el.children.length > 0) return; // leaf only
      const t = (el.textContent || '').trim();
      if (/^\$?[0-9][0-9,.]*[KMB%]?( *[a-zA-Z]+)?$/.test(t) && t.length < 50) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          // Walk up to find a likely label
          let label = null;
          let cur = el.parentElement;
          for (let i = 0; i < 3 && cur && !label; i++, cur = cur.parentElement) {
            label =
              cur.querySelector('[class*="label"], [class*="title"], [class*="metric"]')?.textContent?.trim() || null;
          }
          out.push({ value: t, label });
        }
      }
    });
    return out;
  });
  writeFileSync(`tmp/scrape/${label}.numerics.json`, JSON.stringify(numericNodes, null, 2));
  console.log(`  ${numericNodes.length} numeric-looking text nodes`);

  // Full-page screenshot
  await page.screenshot({ path: `tmp/scrape/${label}.png`, fullPage: true });
  console.log(`  screenshot saved`);

  return { controls, interactives, numerics: numericNodes };
}

const roi = await dumpPage('roi', 'https://www.yardflow.ai/roi/');
await dumpPage('roi-no-trailing-slash', 'https://www.yardflow.ai/roi');
const yns = await dumpPage('YNS', 'https://www.yardflow.ai/YNS/');
await dumpPage('YNS-slides', 'https://www.yardflow.ai/YNS/slides/');

// Try the ROI calculator: if there are sliders, move them and observe output deltas.
if (roi.controls.some((c) => c.type === 'range')) {
  console.log('\n══ ROI slider perturbation test');
  await page.goto('https://www.yardflow.ai/roi/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const sliders = await page.locator('input[type="range"]').all();
  console.log(`Found ${sliders.length} sliders to perturb`);

  // Read baseline output
  const baselineNumerics = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      if (el.children.length > 0) return;
      const t = (el.textContent || '').trim();
      if (/^\$[0-9][0-9,.]*[KMB]?$/.test(t)) {
        out.push(t);
      }
    });
    return out;
  });
  writeFileSync('tmp/scrape/roi-baseline-numerics.json', JSON.stringify(baselineNumerics, null, 2));
  console.log(`  baseline numerics: ${baselineNumerics.join(' / ')}`);

  // Move each slider one at a time
  for (let i = 0; i < sliders.length; i++) {
    const slider = sliders[i];
    const before = await slider.evaluate((el) => el.value);
    const min = await slider.evaluate((el) => el.min);
    const max = await slider.evaluate((el) => el.max);
    const label = await slider.evaluate((el) => {
      const lbl = el.closest('label')?.textContent || el.getAttribute('aria-label') || '';
      return lbl.trim().slice(0, 80);
    });
    // Move to max
    await slider.fill(String(max));
    await page.waitForTimeout(500);
    const numericsAfter = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('*').forEach((el) => {
        if (el.children.length > 0) return;
        const t = (el.textContent || '').trim();
        if (/^\$[0-9][0-9,.]*[KMB]?$/.test(t)) out.push(t);
      });
      return out;
    });
    console.log(`  slider ${i} "${label}" ${before} → ${max} | output: ${numericsAfter.join(' / ')}`);
    // Reset
    await slider.fill(before);
    await page.waitForTimeout(300);
  }
}

await browser.close();
console.log('\nAll dumps in tmp/scrape/');
