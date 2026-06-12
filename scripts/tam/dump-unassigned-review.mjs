import { readFileSync, writeFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const H = { Authorization: `Bearer ${TOKEN}` };
const out = [];
let after = '';
for (;;) {
  const url = new URL('https://api.hubapi.com/crm/v3/objects/companies');
  url.searchParams.set('limit', '100');
  url.searchParams.set('properties', 'name,domain,industry,yardflow_tam,num_associated_contacts');
  if (after) url.searchParams.set('after', after);
  const j = await (await fetch(url, { headers: H })).json();
  if (!j.results) break;
  for (const r of j.results) {
    const p = r.properties;
    if (p.yardflow_tam === 'review' && !p.industry) out.push({ id: r.id, name: p.name || '', domain: p.domain || '', contacts: parseInt(p.num_associated_contacts || '0', 10) || 0 });
  }
  after = j.paging?.next?.after; if (!after) break;
}
out.sort((a, b) => b.contacts - a.contacts);
writeFileSync(new URL('./unassigned-review.json', import.meta.url), JSON.stringify(out, null, 0));
console.log('dumped', out.length, 'unassigned review accounts');
console.log('with name or domain:', out.filter(x => x.name || x.domain).length);
