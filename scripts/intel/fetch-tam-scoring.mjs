// Fetch the TAM (yardflow_tam='in') companies with the fields needed to score
// every account: existing composite + the TAM classification we'd derive fit
// from. Writes output/intel/tam-scoring.json + prints coverage.
// Run: node scripts/intel/fetch-tam-scoring.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { console.error('no HUBSPOT_ACCESS_TOKEN'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROPS = ['name', 'domain', 'yardflow_tam', 'tam_tier', 'tam_segment', 'tam_facility_count',
  'industry', 'numberofemployees', 'annualrevenue', 'yardflow_composite_score', 'yardflow_fit_score'];

const out = [];
let after, page = 0;
for (;;) {
  // search for tam='in' via the search API (filtered) to avoid scanning all 11.7k
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'yardflow_tam', operator: 'EQ', value: 'in' }] }],
      properties: PROPS, limit: 100, after,
    }),
  });
  if (!res.ok) { if (res.status === 429) { await sleep(2000); continue; } console.error('FAIL', res.status, (await res.text()).slice(0, 200)); break; }
  const data = await res.json();
  for (const c of data.results ?? []) out.push({ id: c.id, ...c.properties });
  page += 1;
  if (page % 10 === 0) process.stderr.write(`  ${out.length}...\n`);
  after = data.paging?.next?.after;
  if (!after) break;
  await sleep(90);
}

mkdirSync(new URL('../../output/intel/', import.meta.url), { recursive: true });
writeFileSync(new URL('../../output/intel/tam-scoring.json', import.meta.url), JSON.stringify({ fetchedAt: new Date().toISOString(), companies: out }, null, 0));

const has = (v) => v != null && v !== '';
const scored = out.filter((c) => has(c.yardflow_composite_score)).length;
const withTier = out.filter((c) => has(c.tam_tier)).length;
const withSeg = out.filter((c) => has(c.tam_segment)).length;
const withFac = out.filter((c) => has(c.tam_facility_count)).length;
const withDomain = out.filter((c) => has(c.domain)).length;
const derivable = out.filter((c) => has(c.tam_tier) || has(c.tam_segment) || has(c.tam_facility_count)).length;
console.log(`TAM='in' fetched: ${out.length}`);
console.log(`  already have composite (corridor run): ${scored}`);
console.log(`  with tam_tier: ${withTier} | tam_segment: ${withSeg} | tam_facility_count: ${withFac} | domain: ${withDomain}`);
console.log(`  fit-derivable (>=1 TAM field): ${derivable}  | NEED scoring + no derivable signal: ${out.length - derivable}`);
const tierDist = {}; for (const c of out) { const t = c.tam_tier || '(none)'; tierDist[t] = (tierDist[t] || 0) + 1; }
console.log('  tier distribution:', JSON.stringify(tierDist));
