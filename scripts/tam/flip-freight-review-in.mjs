// Casey's correction: low engagement = how far we've prospected, NOT whether it's TAM. Flip all
// review accounts that already sit in a FREIGHT vertical to `in` (the vertical is the signal;
// scale refined later). A few non-freight verticals that landed in review go `out`. Unassigned/
// unmapped stay review for free web research. Uses the LIST endpoint (reliable pagination).
// Usage: node scripts/tam/flip-freight-review-in.mjs [apply]
import { readFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const APPLY = process.argv[2] === 'apply';
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const now = '2026-06-11';

const FREIGHT = {
  RETAIL: 'retail_grocery', WHOLESALE: 'wholesale_distribution', CONSUMER_GOODS: 'wholesale_distribution',
  CONSUMER_ELECTRONICS: 'wholesale_distribution', APPAREL_FASHION: 'retail_grocery', FURNITURE: 'wholesale_distribution',
  TEXTILES: 'wholesale_distribution', LUXURY_GOODS_JEWELRY: 'wholesale_distribution', SPORTING_GOODS: 'wholesale_distribution',
  COSMETICS: 'cpg_food_beverage', BUSINESS_SUPPLIES_AND_EQUIPMENT: 'wholesale_distribution',
  FOOD_BEVERAGES: 'cpg_food_beverage', FOOD_PRODUCTION: 'agriculture_food_processing', FARMING: 'agriculture_food_processing',
  DAIRY: 'agriculture_food_processing', TRANSPORTATION_TRUCKING_RAILROAD: '3pl_carrier',
  LOGISTICS_AND_SUPPLY_CHAIN: '3pl_carrier', WAREHOUSING: '3pl_carrier', MARITIME: 'ports_intermodal',
  AUTOMOTIVE: 'automotive_heavy_mfg', MACHINERY: 'automotive_heavy_mfg', MECHANICAL_OR_INDUSTRIAL_ENGINEERING: 'building_materials_industrial',
  ELECTRICAL_ELECTRONIC_MANUFACTURING: 'automotive_heavy_mfg', INDUSTRIAL_AUTOMATION: 'building_materials_industrial',
  SHIPBUILDING: 'automotive_heavy_mfg', RAILROAD_MANUFACTURE: 'automotive_heavy_mfg',
  BUILDING_MATERIALS: 'building_materials_industrial', GLASS_CERAMICS_CONCRETE: 'building_materials_industrial',
  MINING_METALS: 'building_materials_industrial', CHEMICALS: 'chemicals_plastics', PLASTICS: 'chemicals_plastics',
  OIL_ENERGY: 'chemicals_plastics', PACKAGING_AND_CONTAINERS: 'paper_packaging', PAPER_FOREST_PRODUCTS: 'paper_packaging',
  PRINTING: 'paper_packaging',
};
const OUT = { AIRLINES_AVIATION: 'Passenger/air carrier; not a freight-yard network', CAPITAL_MARKETS: 'Financial services; no freight', CIVIC_SOCIAL_ORGANIZATION: 'Nonprofit/civic; no freight' };

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

const all = [];
for await (const c of review()) all.push(c);
const counts = { in: 0, out: 0, left_review: 0 };
const updates = [];
for (const c of all) {
  const ind = (c.properties.industry || '').toUpperCase();
  if (FREIGHT[ind]) {
    counts.in++;
    updates.push({ id: c.id, properties: { yardflow_tam: 'in', tam_tier: 'C', tam_segment: FREIGHT[ind], na_operating: 'true', tam_source: 'freight_vertical_2026-06-11', tam_evaluated_at: now, tam_reason: `Freight vertical (${ind.toLowerCase()}); in TAM by vertical, scale to confirm` } });
  } else if (OUT[ind]) {
    counts.out++;
    updates.push({ id: c.id, properties: { yardflow_tam: 'out', tam_source: 'freight_vertical_2026-06-11', tam_evaluated_at: now, tam_reason: OUT[ind] } });
  } else counts.left_review++;
}
if (APPLY) for (let i = 0; i < updates.length; i += 100) {
  const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', { method: 'POST', headers: H, body: JSON.stringify({ inputs: updates.slice(i, i + 100) }) });
  if (!r.ok) console.error('fail', r.status, (await r.text()).slice(0, 120));
}
console.log(JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRYRUN', reviewTotal: all.length, counts }, null, 2));
