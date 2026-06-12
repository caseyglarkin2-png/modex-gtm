#!/usr/bin/env tsx
/**
 * Pounce Engine — local backfill runner (Phase 1, Task 5).
 *
 *   npx tsx scripts/pounce/backfill.ts [hours=336] [minScore=6] [slug]
 *
 * Runs the same scan the cron runs, but locally and report-only: writes
 * output/pounce/report-<date>.md (ranked, linked, human) + .json (machine).
 * Use before authoring any /for spear (the news gate) and for launch audits.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPounceScan } from '../../src/lib/pounce/scan';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const hours = Number(process.argv[2]) || 336;
const minScore = Number(process.argv[3]) || 6;
const slug = process.argv[4];

async function main() {
const result = await runPounceScan({ hours, minScore, slugs: slug ? [slug] : undefined });

const date = new Date().toISOString().slice(0, 10);
const outDir = join(ROOT, 'output', 'pounce');
mkdirSync(outDir, { recursive: true });

const byAccount = new Map<string, typeof result.triggers>();
for (const t of result.triggers) {
  const list = byAccount.get(t.account) ?? [];
  list.push(t);
  byAccount.set(t.account, list);
}
const ranked = [...byAccount.entries()].sort(
  (a, b) => Math.max(...b[1].map((t) => t.score)) - Math.max(...a[1].map((t) => t.score)),
);

const lines: string[] = [
  `# Pounce report — ${date}`,
  '',
  `Window: last ${hours}h · min score ${minScore} · ${result.accountsScanned} accounts scanned · ${result.itemsSeen} items seen · ${result.triggers.length} triggers`,
  '',
];
for (const [account, ts] of ranked) {
  lines.push(`## ${account} (top score ${Math.max(...ts.map((t) => t.score))})`);
  for (const t of ts.slice(0, 5)) {
    lines.push(
      `- **${t.score}** [${t.categories.join(', ')}] ${t.title} — ${t.source}, ${t.publishedAt.slice(0, 10)}`,
      `  ${t.url}`,
      `  Spear: https://yardflow.ai/for/${t.slug}/`,
    );
  }
  lines.push('');
}
if (result.errors.length) {
  lines.push('## Errors', ...result.errors.map((e) => `- ${e}`), '');
}

const mdPath = join(outDir, `report-${date}.md`);
writeFileSync(mdPath, lines.join('\n'));
writeFileSync(join(outDir, `report-${date}.json`), JSON.stringify(result, null, 2));
console.log(`${result.triggers.length} triggers across ${ranked.length} accounts -> ${mdPath}`);
for (const [account, ts] of ranked.slice(0, 10)) {
  console.log(`  ${Math.max(...ts.map((t) => t.score))}  ${account}: ${ts[0].title.slice(0, 80)}`);
}
}

main();
