// Backfill hs_ideal_customer_profile from tam_tier (A->tier_1, B->tier_2, C->tier_3)
// for every yardflow_tam='in' company, and set hs_is_target_account=true on the
// curated focus list (tam_tier='A' AND num_associated_contacts>=3).
// Dry-run by default; pass `apply` to write. Batch update 100/call.
import { readFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const APPLY = process.argv[2] === 'apply';
const ICP = { A: 'tier_1', B: 'tier_2', C: 'tier_3' };

// Page all yardflow_tam='in' companies via search (under the 10k cap).
let after = undefined;
const rows = [];
do {
  const body = {
    filterGroups: [{ filters: [{ propertyName: 'yardflow_tam', operator: 'EQ', value: 'in' }] }],
    properties: ['tam_tier', 'num_associated_contacts'],
    limit: 200,
    ...(after ? { after } : {}),
  };
  const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', { method: 'POST', headers: H, body: JSON.stringify(body) });
  if (!r.ok) { console.error('search fail', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  const j = await r.json();
  for (const o of j.results) rows.push({ id: o.id, tier: o.properties.tam_tier, contacts: parseInt(o.properties.num_associated_contacts || '0', 10) });
  after = j.paging?.next?.after;
} while (after);

const updates = [];
const counts = { total: rows.length, icp: { tier_1: 0, tier_2: 0, tier_3: 0, none: 0 }, target: 0 };
for (const row of rows) {
  const props = {};
  const icp = ICP[row.tier];
  if (icp) { props.hs_ideal_customer_profile = icp; counts.icp[icp]++; } else { counts.icp.none++; }
  if (row.tier === 'A' && row.contacts >= 3) { props.hs_is_target_account = 'true'; counts.target++; }
  if (Object.keys(props).length) updates.push({ id: row.id, properties: props });
}
console.log(JSON.stringify({ ...counts, toWrite: updates.length, apply: APPLY }, null, 2));

if (APPLY) {
  let ok = 0, fail = 0;
  for (let i = 0; i < updates.length; i += 100) {
    const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', { method: 'POST', headers: H, body: JSON.stringify({ inputs: updates.slice(i, i + 100) }) });
    if (r.ok) ok += updates.slice(i, i + 100).length; else { fail++; console.error('batch fail', r.status, (await r.text()).slice(0, 200)); }
  }
  console.log(`applied: ${ok} updated, ${fail} failed batches`);
}
