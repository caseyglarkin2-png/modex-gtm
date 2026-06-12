// TAM accounts the engine can't qualify because nobody's home: yardflow_tam=in with <3 contacts.
// Output: CSV sorted Tier A first, for Apollo (credits reset 2026-06-27) / clawd sourcing.
import { readFileSync, writeFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const H = { Authorization: `Bearer ${TOKEN}` };
const rows = [];
let after = '';
for (;;) {
  const url = new URL('https://api.hubapi.com/crm/v3/objects/companies');
  url.searchParams.set('limit', '100');
  url.searchParams.set('properties', 'name,domain,yardflow_tam,tam_tier,tam_segment,num_associated_contacts');
  if (after) url.searchParams.set('after', after);
  const j = await (await fetch(url, { headers: H })).json();
  if (!j.results) break;
  for (const r of j.results) {
    const p = r.properties;
    const n = parseInt(p.num_associated_contacts || '0', 10) || 0;
    if (p.yardflow_tam === 'in' && n < 3)
      rows.push({ id: r.id, name: p.name || '', domain: p.domain || '', tier: p.tam_tier || 'C', segment: p.tam_segment || '', contacts: n });
  }
  after = j.paging?.next?.after; if (!after) break;
}
const tierRank = { A: 0, B: 1, C: 2 };
rows.sort((a, b) => (tierRank[a.tier] ?? 3) - (tierRank[b.tier] ?? 3) || a.contacts - b.contacts || a.name.localeCompare(b.name));
const csv = ['id,name,domain,tier,segment,contacts', ...rows.map((r) => [r.id, `"${r.name.replace(/"/g, '""')}"`, r.domain, r.tier, r.segment, r.contacts].join(','))].join('\n');
writeFileSync(new URL('../../output/tam/coverage-worklist-2026-06-12.csv', import.meta.url), csv);
const byTier = rows.reduce((m, r) => ((m[r.tier] = (m[r.tier] || 0) + 1), m), {});
const zero = rows.filter((r) => r.contacts === 0).length;
console.log(JSON.stringify({ total: rows.length, zeroContacts: zero, byTier }, null, 1));
