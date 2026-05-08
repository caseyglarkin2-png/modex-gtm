#!/usr/bin/env node
/**
 * Sprint M3.7 — bulk migration: replace each account file's
 * `sections: [...]` literal with `sections: []` so M3.10 can strip the
 * legacy section types from the schema union without typecheck regressions.
 *
 * Why empty (not auto-generated literals)? The M3.8 compat adapter
 * (`resolveMemoSections`) already returns the 5 memo sections at runtime
 * for any account with < 3 native memo entries. Embedding generated
 * literals here would freeze a snapshot of the auto-generation in source
 * — better to keep a single source of truth.
 *
 * What this preserves: imports, computed values (facility count
 * helpers), people, personVariants, proofBlocks, theme, signals — only
 * the `sections` array initializer is replaced. The legacy block is
 * preserved as a `// LEGACY SECTIONS (preserved for reference) ` comment
 * so M3.2-M3.6 hand-authoring can lift wording back into memo sections
 * without re-research.
 *
 * Idempotent: running this twice is a no-op (replacement only happens
 * when the sections array contains a legacy entry like `type: 'hero'`).
 *
 * Pure JS (no TS/esbuild) so it runs on the WSL/Windows-mount setup.
 *
 * Usage:
 *   node scripts/migrate-microsite-sections.mjs            # dry run
 *   node scripts/migrate-microsite-sections.mjs --write    # apply
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ACCOUNTS_DIR = join(process.cwd(), 'src/lib/microsites/accounts');
const SECTIONS_KEY = '\n  sections: [';

const LEGACY_TYPES = [
  'hero',
  'problem',
  'stakes',
  'solution',
  'how-it-works',
  'proof',
  'differentiation',
  'fit',
  'objection-handling',
  'cta',
];

function findSectionsBlock(source) {
  const idx = source.indexOf(SECTIONS_KEY);
  if (idx === -1) return null;
  const arrayStart = idx + SECTIONS_KEY.length - 1;
  let i = arrayStart + 1;
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
      else if (ch === '[') depth += 1;
      else if (ch === ']') depth -= 1;
    }
    i += 1;
  }
  if (depth !== 0) return null;
  return { start: arrayStart, end: i };
}

function containsLegacySection(blockText) {
  for (const t of LEGACY_TYPES) {
    if (new RegExp(`type:\\s*['"]${t}['"]`).test(blockText)) return true;
  }
  return false;
}

function countTopLevelEntries(blockText) {
  return (blockText.match(/^\s{4}\{\s*\n\s+type:\s*['"][a-z-]+['"]/gm) ?? []).length;
}

function migrateFile(filePath, write) {
  const source = readFileSync(filePath, 'utf8');
  const block = findSectionsBlock(source);
  if (!block) return { file: filePath, status: 'skipped-no-sections' };
  const blockText = source.slice(block.start, block.end);
  if (blockText === '[]') return { file: filePath, status: 'skipped-already-empty' };
  if (!containsLegacySection(blockText)) return { file: filePath, status: 'skipped-no-legacy' };

  const removed = countTopLevelEntries(blockText);
  const preservedComment =
    `// LEGACY SECTIONS (preserved for reference — M3.2-M3.6 may lift prose into memo sections)\n` +
    `/*\n${blockText
      .split('\n')
      .map((line) => ` * ${line}`)
      .join('\n')}\n */\n`;

  const next = source.slice(0, block.start) + '[]' + source.slice(block.end);

  const exportIdx = next.indexOf('\nexport const ');
  const withComment =
    exportIdx === -1
      ? `${preservedComment}\n${next}`
      : `${next.slice(0, exportIdx + 1)}${preservedComment}\n${next.slice(exportIdx + 1)}`;

  if (write) {
    writeFileSync(filePath, withComment, 'utf8');
  }

  return {
    file: filePath,
    status: 'migrated',
    removedSectionCount: removed,
  };
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const files = readdirSync(ACCOUNTS_DIR)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => join(ACCOUNTS_DIR, f));

  const results = files.map((f) => migrateFile(f, write));

  const summary = {
    total: results.length,
    migrated: results.filter((r) => r.status === 'migrated').length,
    alreadyEmpty: results.filter((r) => r.status === 'skipped-already-empty').length,
    noSections: results.filter((r) => r.status === 'skipped-no-sections').length,
    noLegacy: results.filter((r) => r.status === 'skipped-no-legacy').length,
  };

  for (const r of results) {
    const file = r.file.split('/').slice(-2).join('/');
    if (r.status === 'migrated') {
      console.log(`✓ ${file}  (removed ${r.removedSectionCount ?? '?'} legacy sections)`);
    } else {
      console.log(`· ${file}  (${r.status})`);
    }
  }

  console.log('\nSummary:', summary);

  if (!write) {
    console.log('\n(dry-run — re-run with --write to apply changes)');
  }
}

main();
