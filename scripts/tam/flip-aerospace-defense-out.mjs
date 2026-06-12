// Casey's call: aerospace/defense primes are OUT of TAM (huge plants but low truck-throughput +
// secured/long-cycle sales motion). Flip all AVIATION_AEROSPACE / DEFENSE_SPACE companies + the
// named no-industry defense/nuclear records to out.
// Usage: node scripts/tam/flip-aerospace-defense-out.mjs [apply]
import { readFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const APPLY = process.argv[2] === 'apply';
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const now = '2026-06-11';
const REASON = 'Aerospace/defense: facility-heavy but low truck-throughput + secured/long-cycle motion - out of TAM (Casey 2026-06-11)';

// no-industry named defense/aero/nuclear records
const NAMED = ['54772698408', '55554505071', '54772582517', '54756924313', '54773744811'];

async function searchIds(industry) {
  const ids = []; let after = '0';
  for (;;) {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
      method: 'POST', headers: H,
      body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'industry', operator: 'EQ', value: industry }] }], properties: ['name'], limit: 100, after }),
    });
    const j = await res.json();
    if (!j.results) break;
    for (const r of j.results) ids.push(r.id);
    after = j.paging?.next?.after; if (!after) break;
  }
  return ids;
}

const ids = new Set(NAMED);
for (const ind of ['AVIATION_AEROSPACE', 'DEFENSE_SPACE']) (await searchIds(ind)).forEach((id) => ids.add(id));
const all = [...ids];
console.log(`${all.length} aerospace/defense records -> out`);

if (APPLY) {
  for (let i = 0; i < all.length; i += 100) {
    const inputs = all.slice(i, i + 100).map((id) => ({ id, properties: { yardflow_tam: 'out', tam_tier: '', tam_segment: '', tam_source: 'aero_defense_out_2026-06-11', tam_evaluated_at: now, tam_reason: REASON } }));
    const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', { method: 'POST', headers: H, body: JSON.stringify({ inputs }) });
    if (!r.ok) console.error('fail', r.status, (await r.text()).slice(0, 150));
  }
  console.log('applied');
}
