// scripts/intel/tam-geo/seed-ledger.ts
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from './slugify';
import { load, append } from './ledger';

const tam = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'output', 'intel', 'tam-scoring.json'), 'utf8'));
const tierA = (tam.companies as Array<Record<string, string>>).filter((c) => c.tam_tier === 'A');
const have = load();
const seen = new Set(have.keys());
let seeded = 0;
for (const c of tierA) {
  let slug = slugify(c.name || c.id);
  if (seen.has(slug)) {
    // disambiguate name-collisions so every Tier-A account gets its own roster:
    // prefer the domain's primary label, else a numeric suffix.
    const dom = (c.domain || '').split('.')[0].replace(/[^a-z0-9]+/g, '');
    let cand = dom ? `${slug}-${dom}` : slug;
    let i = 2;
    while (seen.has(cand)) cand = `${slug}-${i++}`;
    slug = cand;
  }
  if (have.has(slug)) continue; // already seeded on a prior run
  seen.add(slug);
  append({ slug, name: c.name ?? '', domain: (c.domain || '').toLowerCase() || null, tier: 'A',
    fit: c.yardflow_fit_score != null && c.yardflow_fit_score !== '' ? Number(c.yardflow_fit_score) : null,
    status: 'pending' });
  seeded += 1;
}
console.log(`Tier-A accounts: ${tierA.length} | seeded: ${seeded} | already in ledger: ${tierA.length - seeded}`);
