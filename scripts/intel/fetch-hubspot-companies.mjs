// Pull the canonical HubSpot company universe (id, name, domain) into a local
// index, so we can standardize our scored prospects against HubSpot's
// architecture (one record per real company) instead of inventing our own.
// Run: node scripts/intel/fetch-hubspot-companies.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { console.error('no HUBSPOT_ACCESS_TOKEN'); process.exit(1); }

const OUT = new URL('../../output/intel/hubspot-companies.json', import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const companies = [];
let after = undefined;
let page = 0;
for (;;) {
  const url = new URL('https://api.hubapi.com/crm/v3/objects/companies');
  url.searchParams.set('limit', '100');
  url.searchParams.set('properties', 'name,domain,yardflow_tam');
  if (after) url.searchParams.set('after', after);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) {
    if (res.status === 429) { await sleep(2000); continue; } // rate limit, retry
    console.error('FAIL', res.status, (await res.text()).slice(0, 200));
    break;
  }
  const data = await res.json();
  for (const c of data.results ?? []) {
    companies.push({
      id: c.id,
      name: c.properties?.name ?? '',
      domain: (c.properties?.domain ?? '').toLowerCase(),
      tam: c.properties?.yardflow_tam ?? '',
    });
  }
  page += 1;
  if (page % 10 === 0) process.stderr.write(`  ${companies.length} companies...\n`);
  after = data.paging?.next?.after;
  if (!after) break;
  await sleep(80);
}

import { mkdirSync } from 'node:fs';
mkdirSync(new URL('../../output/intel/', import.meta.url), { recursive: true });
writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), companies }, null, 0));
const withDomain = companies.filter((c) => c.domain).length;
const tamIn = companies.filter((c) => c.tam === 'in').length;
console.log(`fetched ${companies.length} companies (${withDomain} with domain, ${tamIn} TAM=in) -> output/intel/hubspot-companies.json`);
