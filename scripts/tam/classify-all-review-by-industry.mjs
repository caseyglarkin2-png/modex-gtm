// Classify ALL review accounts on MERIT (industry), not engagement. Low contact count = how far
// we've prospected, NOT whether it's TAM. Applies the industry class-rules to every yardflow_tam=
// review record with a known mapped industry. Unassigned/no-industry stay review (need Apollo
// enrichment next). Usage: node scripts/tam/classify-all-review-by-industry.mjs [apply]
import { readFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const APPLY = process.argv[2] === 'apply';
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const now = '2026-06-11';

// industry -> [verdict, segment|null, tier|null, reason]. IN industries are facility/freight-bearing
// at the company level; tier left to C by default (scale refined later via Apollo). OUT = non-freight.
const CLASS = {
  MEDICAL_DEVICES: ['in', 'building_materials_industrial', 'C', 'Med-device mfg/distribution; plants/DCs'],
  PHARMACEUTICALS: ['in', 'chemicals_plastics', 'C', 'Pharma mfg; plants + cold-chain distribution'],
  ENVIRONMENTAL_SERVICES: ['in', '3pl_carrier', 'C', 'Waste/enviro ops; transfer stations + fleet'],
  RENEWABLES_ENVIRONMENT: ['in', 'building_materials_industrial', 'C', 'Energy-equipment mfg; plants + distribution'],
  SEMICONDUCTORS: ['in', 'chemicals_plastics', 'C', 'Semiconductor materials/mfg; cleanroom logistics'],
  COMPUTER_HARDWARE: ['in', 'wholesale_distribution', 'C', 'Electronics OEM; config/distribution centers'],
  PACKAGE_FREIGHT_DELIVERY: ['in', '3pl_carrier', 'B', 'Carrier/parcel/rail; hubs + terminals'],
  SUPERMARKETS: ['in', 'retail_grocery', 'B', 'Grocery; DC network + fleet'],
  CONSUMER_ELECTRONICS: ['in', 'wholesale_distribution', 'C', 'Consumer electronics; distribution centers'],
  CONSTRUCTION: ['out', null, null, 'General contractor; jobsite-based, not a fixed DC/yard network'],
  UTILITIES: ['out', null, null, 'Utility; fleet/service yards but not a freight-shipping network'],
  FACILITIES_SERVICES: ['out', null, null, 'Facilities/janitorial services; no freight yard'],
  EVENTS_SERVICES: ['out', null, null, 'Events/AV services; no freight yard'],
  MARKET_RESEARCH: ['out', null, null, 'Market research; no freight'],
  INVESTMENT_BANKING: ['out', null, null, 'Financial services; no freight'],
  TRANSLATION_AND_LOCALIZATION: ['out', null, null, 'Language services; no freight'],
  PUBLIC_RELATIONS_AND_COMMUNICATIONS: ['out', null, null, 'PR/communications; no freight'],
  VETERINARY: ['out', null, null, 'Veterinary practices; no freight'],
  INTERNATIONAL_AFFAIRS: ['out', null, null, 'Government/international org; no freight'],
  INTERNATIONAL_TRADE_AND_DEVELOPMENT: ['out', null, null, 'International dev/finance; no freight'],
};

// LIST endpoint (reliable full pagination; HubSpot search pagination is flaky past ~1k). Filter to review in code.
async function* review() {
  let after = '';
  for (;;) {
    const url = new URL('https://api.hubapi.com/crm/v3/objects/companies');
    url.searchParams.set('limit', '100');
    url.searchParams.set('properties', 'name,industry,yardflow_tam');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url, { headers: H });
    const j = await res.json();
    if (!j.results) { console.error('err', JSON.stringify(j).slice(0, 150)); break; }
    for (const r of j.results) if (r.properties.yardflow_tam === 'review') yield r;
    after = j.paging?.next?.after; if (!after) break;
  }
}

// READ everything first (stable; no writes mutating the review filter mid-pagination), then write.
const all = [];
for await (const c of review()) all.push(c);

const counts = { in: 0, out: 0, left_review: 0 };
const updates = [];
for (const c of all) {
  const d = CLASS[(c.properties.industry || '').toUpperCase()];
  if (!d) { counts.left_review++; continue; }
  const [v, seg, tier, reason] = d; counts[v]++;
  const props = { yardflow_tam: v, tam_source: 'review_industry_2026-06-11', tam_evaluated_at: now, tam_reason: reason };
  if (seg) props.tam_segment = seg; if (tier) props.tam_tier = tier;
  updates.push({ id: c.id, properties: props });
}
if (APPLY) {
  for (let i = 0; i < updates.length; i += 100) {
    const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', { method: 'POST', headers: H, body: JSON.stringify({ inputs: updates.slice(i, i + 100) }) });
    if (!r.ok) console.error('fail', r.status, (await r.text()).slice(0, 120));
  }
}
console.log(JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRYRUN', readTotal: all.length, counts }, null, 2));
