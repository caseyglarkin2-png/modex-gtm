// Knock down the ENGAGED review pile (yardflow_tam=review AND num_associated_contacts>=25) by
// class-rule + an explicit override map for the well-known no-industry giants / special cases.
// Aerospace/defense, nuclear, smaller pharma, and unknowns stay `review` for a real look.
// Usage: node scripts/tam/resolve-engaged-review.mjs [apply]
import { readFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const APPLY = process.argv[2] === 'apply';
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const now = '2026-06-11';

// industry -> [verdict, segment|null, tier|null, reason]
const CLASS = {
  MEDICAL_DEVICES: ['in', 'building_materials_industrial', 'B', 'Med-device mfg/distribution; plants + DCs + truck freight'],
  CONSTRUCTION: ['out', null, null, 'General contractor; jobsite-based, not a fixed DC/yard facility network'],
  UTILITIES: ['out', null, null, 'Utility; fleet/service yards but not a freight-shipping facility network'],
  ENVIRONMENTAL_SERVICES: ['in', '3pl_carrier', 'C', 'Waste/enviro ops; transfer stations + heavy fleet/yard activity'],
  FACILITIES_SERVICES: ['out', null, null, 'Facilities/janitorial services; no freight yard'],
  EVENTS_SERVICES: ['out', null, null, 'Events/AV services; no freight yard'],
  MARKET_RESEARCH: ['out', null, null, 'Market research; no freight'],
  INVESTMENT_BANKING: ['out', null, null, 'Financial services; no freight'],
  SEMICONDUCTORS: ['in', 'chemicals_plastics', 'B', 'Semiconductor materials/mfg; plants + cleanroom logistics'],
  RENEWABLES_ENVIRONMENT: ['in', 'building_materials_industrial', 'B', 'Energy-equipment mfg; plants + distribution'],
  COMPUTER_HARDWARE: ['in', 'wholesale_distribution', 'B', 'Electronics OEM; config/distribution centers + returns logistics'],
  PACKAGE_FREIGHT_DELIVERY: ['in', '3pl_carrier', 'A', 'Carrier/parcel/rail; hubs + terminals + drop yards'],
};
const REVIEW_KEEP = new Set(['AVIATION_AEROSPACE', 'DEFENSE_SPACE']);

// explicit per-id overrides (mostly no-industry giants + special cases)
const OV = {
  '9636609190': ['in', 'cpg_food_beverage', 'A', 'Food/bev giant (PepsiCo)'],
  '9636345698': ['in', '3pl_carrier', 'A', '3PL + dedicated fleet (Ryder System)'],
  '55554495512': ['in', 'cpg_food_beverage', 'A', 'Protein processing + cold chain (Tyson Foods)'],
  '9791095436': ['in', 'agriculture_food_processing', 'A', 'Ag processing; ports/elevators (Bunge)'],
  '9636508045': ['in', 'building_materials_industrial', 'B', 'Power-tool mfg + distribution (Milwaukee Tool)'],
  '54062284111': ['in', 'automotive_heavy_mfg', 'A', 'Heavy-equipment mfg; plants + parts DCs (Caterpillar)'],
  '53894120495': ['in', 'paper_packaging', 'A', 'Paper/building-products mfg; mills + DCs (Georgia-Pacific)'],
  '54734205079': ['in', 'cpg_food_beverage', 'A', 'Largest bakery; DSD fleet + plants (Grupo Bimbo)'],
  '54772644388': ['in', 'building_materials_industrial', 'A', 'Diversified industrial mfg; many plants + DCs (3M)'],
  '54774487619': ['in', 'chemicals_plastics', 'A', 'Refining/midstream; terminals (Phillips 66)'],
  '54706117218': ['in', 'wholesale_distribution', 'A', 'Furniture mfg + distribution network (Ashley Furniture)'],
  '54772704310': ['in', 'retail_grocery', 'B', 'Home retail + DCs (Williams-Sonoma)'],
  '54772710987': ['in', 'retail_grocery', 'A', 'Retail + DC network (Canadian Tire)'],
  '54772570015': ['in', 'building_materials_industrial', 'B', 'Power-tool mfg (Techtronic/TTI)'],
  '54771729274': ['in', 'retail_grocery', 'B', 'Apparel; large NA DCs (Levi\'s)'],
  '54772682762': ['in', 'cpg_food_beverage', 'B', 'Food mfg; cold chain (Rich Products)'],
  '54772724408': ['in', 'building_materials_industrial', 'B', 'Materials mfg (W.L. Gore)'],
  '9417755136': ['in', '3pl_carrier', 'A', 'Freight forwarder/3PL (Crane Worldwide Logistics)'],
  '54713981241': ['in', 'wholesale_distribution', 'A', 'Beverage distribution + fleet (Southern Glazer\'s)'],
  '54433038930': ['in', 'cpg_food_beverage', 'A', 'CPG snacks mfg (Mondelez/Mdlz dedup)'],
  '55554498724': ['in', 'cpg_food_beverage', 'B', 'Cosmetics mfg/distribution (Estée Lauder dedup)'],
  '54421984084': ['in', 'cpg_food_beverage', 'B', 'Cosmetics mfg/distribution; plants + DCs (Estée Lauder)'],
  '54406388074': ['in', 'wholesale_distribution', 'B', 'Electronics OEM; config/distribution centers (Dell)'],
  '54771833668': ['in', 'building_materials_industrial', 'B', 'Med-device mfg; plants + DCs (Medtronic)'],
  '54417456395': ['in', 'building_materials_industrial', 'B', 'Med-device mfg/distribution (BD)'],
  '54771954797': ['in', 'chemicals_plastics', 'B', 'Biopharma mfg; plants + cold-chain (Amgen)'],
  '54772663938': ['in', 'building_materials_industrial', 'A', 'Energy-equipment mfg (GE Vernova)'],
  '54773588756': ['in', 'building_materials_industrial', 'A', 'Energy-equipment mfg (GE Vernova)'],
  '54772621363': ['in', 'building_materials_industrial', 'B', 'Generator mfg; plants + distribution (Generac)'],
  '54771949695': ['in', 'ports_intermodal', 'B', 'LNG export terminals (Venture Global LNG)'],
  '54772546200': ['out', null, null, 'Market research; no freight (Circana)'],
  '54772729224': ['out', null, null, 'Financial services; no freight (TD Securities)'],
  '54419816371': ['out', null, null, 'Military (USMC)'],
  '54771783954': ['out', null, null, 'Military (US Army)'],
  '54773782098': ['out', null, null, 'Government (House mail)'],
  '54771868677': ['out', null, null, 'Media/publishing (NY Times)'],
  '54773781925': ['out', null, null, 'Cruise line; no freight yard (Royal Caribbean)'],
  '54728427388': ['out', null, null, 'PR/communications agency (Burson)'],
  '54772657703': ['out', null, null, 'Foodservice/catering services (Compass Group)'],
  '54772685209': ['out', null, null, 'Not a real freight account (ros.com)'],
};

async function* engagedReview() {
  let after = '0';
  for (;;) {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
      method: 'POST', headers: H,
      body: JSON.stringify({
        filterGroups: [{ filters: [
          { propertyName: 'yardflow_tam', operator: 'EQ', value: 'review' },
          { propertyName: 'num_associated_contacts', operator: 'GTE', value: '25' },
        ] }],
        properties: ['name', 'industry', 'num_associated_contacts'], limit: 100, after,
      }),
    });
    const j = await res.json();
    if (!j.results) { console.error('err', JSON.stringify(j).slice(0, 200)); break; }
    for (const r of j.results) yield r;
    after = j.paging?.next?.after; if (!after) break;
  }
}

const counts = { in: 0, out: 0, kept_review: 0 };
let batch = [];
async function flush() { if (APPLY && batch.length) { const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', { method: 'POST', headers: H, body: JSON.stringify({ inputs: batch }) }); if (!r.ok) console.error('write fail', r.status, (await r.text()).slice(0, 150)); } batch = []; }

for await (const c of engagedReview()) {
  const ind = (c.properties.industry || '').toUpperCase();
  let d = OV[c.id] || CLASS[ind] || null;
  if (!d || REVIEW_KEEP.has(ind)) { counts.kept_review++; continue; }
  const [v, seg, tier, reason] = d;
  counts[v]++;
  const props = { yardflow_tam: v, tam_source: 'engaged_review_2026-06-11', tam_evaluated_at: now, tam_reason: reason };
  if (seg) props.tam_segment = seg; if (tier) props.tam_tier = tier;
  batch.push({ id: c.id, properties: props });
  if (batch.length >= 100) await flush();
}
await flush();
console.log(JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRYRUN', counts }, null, 2));
