#!/usr/bin/env node
/**
 * Sprint M3.10 (data half) — strip `ctaOverride: { ... }` blocks from
 * personVariants in every account .ts file, plus drop the now-unused
 * `BOOKING_LINK` constant if no live references remain. Schema/runtime
 * removal happens in companion edits to schema.ts and rules.ts.
 *
 * The memo template doesn't render meeting CTAs — Casey's directive
 * was: prospects come to us via the existing /roi/ calculator, not
 * through embedded calendar links. Per-person CTA overrides are a
 * mechanism the new template has no use for.
 *
 * Idempotent. Run twice → second run reports 0 changes.
 *
 * Usage:
 *   node scripts/strip-cta-override.mjs            # dry run
 *   node scripts/strip-cta-override.mjs --write    # apply
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ACCOUNTS_DIR = join(process.cwd(), 'src/lib/microsites/accounts');

function findCtaOverrideBlocks(source) {
  const matches = [];
  const re = /\n([ \t]+)ctaOverride:\s*\{/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const lineStart = m.index + 1;
    const braceOpen = m.index + m[0].length - 1;
    let i = braceOpen + 1;
    let depth = 1;
    let inString = null;
    let inTemplate = 0;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      const prev = source[i - 1];
      if (inString) {
        if (ch === inString && prev !== '\\') inString = null;
      } else if (inTemplate > 0) {
        if (ch === '`' && prev !== '\\') inTemplate -= 1;
        else if (ch === '$' && source[i + 1] === '{') {
          let braceDepth = 1;
          i += 2;
          while (i < source.length && braceDepth > 0) {
            const c2 = source[i];
            if (c2 === '{') braceDepth += 1;
            else if (c2 === '}') braceDepth -= 1;
            i += 1;
          }
          continue;
        }
      } else {
        if (ch === '"' || ch === "'") inString = ch;
        else if (ch === '`') inTemplate += 1;
        else if (ch === '{') depth += 1;
        else if (ch === '}') depth -= 1;
      }
      i += 1;
    }
    if (depth !== 0) continue;
    let end = i;
    if (source[end] === ',') end += 1;
    if (source[end] === '\n') end += 1;
    matches.push({ start: lineStart, end });
  }
  return matches;
}

function stripBlocks(source, blocks) {
  if (blocks.length === 0) return source;
  let next = '';
  let cursor = 0;
  for (const b of blocks) {
    next += source.slice(cursor, b.start);
    cursor = b.end;
  }
  next += source.slice(cursor);
  return next;
}

function dropUnusedBookingLink(source) {
  const constRe = /^const BOOKING_LINK = '[^']+';\n/m;
  const declMatch = constRe.exec(source);
  if (!declMatch) return { source, dropped: false };
  const after = source.replace(constRe, '');
  const stripComments = after
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  if (/\bBOOKING_LINK\b/.test(stripComments)) return { source, dropped: false };
  return { source: after, dropped: true };
}

function processFile(filePath, write) {
  const original = readFileSync(filePath, 'utf8');
  const blocks = findCtaOverrideBlocks(original);
  if (blocks.length === 0) {
    return { file: filePath, status: 'skipped-no-cta-override' };
  }
  const stripped = stripBlocks(original, blocks);
  const { source: final, dropped } = dropUnusedBookingLink(stripped);
  if (write) writeFileSync(filePath, final, 'utf8');
  return {
    file: filePath,
    status: 'stripped',
    overrideCount: blocks.length,
    droppedBookingLink: dropped,
  };
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const files = readdirSync(ACCOUNTS_DIR)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => join(ACCOUNTS_DIR, f));

  const results = files.map((f) => processFile(f, write));

  for (const r of results) {
    const file = r.file.split('/').slice(-2).join('/');
    if (r.status === 'stripped') {
      console.log(
        `✓ ${file}  (stripped ${r.overrideCount} ctaOverride blocks${
          r.droppedBookingLink ? ', dropped BOOKING_LINK' : ''
        })`,
      );
    } else {
      console.log(`· ${file}  (${r.status})`);
    }
  }

  const summary = {
    total: results.length,
    stripped: results.filter((r) => r.status === 'stripped').length,
    untouched: results.filter((r) => r.status !== 'stripped').length,
    bookingLinksDropped: results.filter((r) => r.droppedBookingLink).length,
  };
  console.log('\nSummary:', summary);
  if (!write) console.log('\n(dry-run — re-run with --write to apply changes)');
}

main();
