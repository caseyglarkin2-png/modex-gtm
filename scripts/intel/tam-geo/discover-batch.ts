// scripts/intel/tam-geo/discover-batch.ts
import fs from 'node:fs';
import path from 'node:path';
import { byStatus, append, load } from './ledger';

const ROOT = process.cwd();
const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '20');
const rosterPath = (slug: string) => path.join(ROOT, 'output', 'yard-audits', slug, 'roster.json');

// Reconcile: any pending account whose roster.json now exists -> advance to 'roster'.
let advanced = 0;
for (const r of byStatus('pending')) {
  if (fs.existsSync(rosterPath(r.slug))) {
    let n = 0;
    try { n = (JSON.parse(fs.readFileSync(rosterPath(r.slug), 'utf8')).facilities ?? []).length; } catch { /* */ }
    append({ ...r, status: 'roster', facilities: n });
    advanced += 1;
  }
}

// Emit the next batch to research (accounts still pending with NO roster).
const next = byStatus('pending').filter((r) => !fs.existsSync(rosterPath(r.slug))).slice(0, limit);
console.log(`reconciled ${advanced} new rosters. Next ${next.length} to discover:`);
for (const r of next) console.log(`  ${r.slug}\t${r.name}\t${r.domain ?? ''}`);
console.log(`\nDispatch one discovery agent per row using scripts/yard-audit/discovery-prompt.md; each writes output/yard-audits/<slug>/roster.json. Re-run this to reconcile.`);
