// scripts/intel/tam-geo/score-pending.ts
import fs from 'node:fs';
import path from 'node:path';
import { REFERENCE_SITES } from '@/lib/discovery/reference-sites';
import { byStatus, append } from './ledger';
import { scoreAccount, type Site } from './score';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'output', 'intel', 'tam-geo', 'scores');
fs.mkdirSync(OUT, { recursive: true });
const refs = REFERENCE_SITES.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name }));
const readRoster = (slug: string) => JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'yard-audits', slug, 'roster.json'), 'utf8'));

const geocoded = byStatus('geocoded');
const allFac: Site[] = [];
const rosters = new Map<string, { facilities: Site[] }>();
for (const r of geocoded) {
  try { const ro = readRoster(r.slug); rosters.set(r.slug, ro); for (const f of ro.facilities ?? []) if (typeof f.lat === 'number') allFac.push(f); } catch { /* */ }
}
let scored = 0;
for (const r of geocoded) {
  const ro = rosters.get(r.slug);
  if (!ro) { append({ ...r, status: 'error', error: 'roster unreadable' }); continue; }
  const s = scoreAccount(ro, refs, r.fit, allFac);
  fs.writeFileSync(path.join(OUT, `${r.slug}.json`), JSON.stringify({ slug: r.slug, domain: r.domain, ...s }, null, 2));
  append({ ...r, status: 'scored', facilities: s.facilities });
  scored += 1;
}
console.log(`scored ${scored} accounts -> output/intel/tam-geo/scores/`);
