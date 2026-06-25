// Dump TAM-tagged companies for connection matching: name, domain, tier, intent.
import { readFileSync, writeFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const OUT = 'C:\\Users\\casey\\yardflow-hubspot\\tam-index.json';

let after, rows = [];
do {
  const body = {
    filterGroups: [{ filters: [{ propertyName: 'yardflow_tam', operator: 'EQ', value: 'in' }] }],
    properties: ['name', 'domain', 'tam_tier', 'tam_segment', 'intent_score', 'hs_is_target_account', 'num_associated_contacts'],
    limit: 200,
    ...(after ? { after } : {}),
  };
  const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', { method: 'POST', headers: H, body: JSON.stringify(body) });
  if (!r.ok) { console.error('fail', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  const j = await r.json();
  for (const o of j.results) {
    const p = o.properties;
    rows.push({ id: o.id, name: p.name || '', domain: (p.domain || '').toLowerCase(), tier: p.tam_tier || '', segment: p.tam_segment || '', intent: parseInt(p.intent_score || '0', 10), target: p.hs_is_target_account === 'true', contacts: parseInt(p.num_associated_contacts || '0', 10) });
  }
  after = j.paging?.next?.after;
  if (rows.length % 1000 < 200) console.error(rows.length);
} while (after);

writeFileSync(OUT, JSON.stringify(rows, null, 2));
console.log(JSON.stringify({ total: rows.length, withDomain: rows.filter((r) => r.domain).length, tierA: rows.filter((r) => r.tier === 'A').length }, null, 2));
