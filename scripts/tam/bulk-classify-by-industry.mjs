// Smart tier-1 TAM pass: classify every company from the HubSpot `industry` field + an
// engagement/scale proxy. Freight-heavy industry + scale -> in; non-freight -> out; ambiguous
// or unknown -> review (that's where targeted Apollo/web research goes next). Conservative:
// bias to `review` over a wrong in/out. Does NOT touch already-tagged companies.
//
// Usage: node scripts/tam/bulk-classify-by-industry.mjs [apply]   (default = dry-run)
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { console.error('no HUBSPOT_ACCESS_TOKEN'); process.exit(1); }
const APPLY = process.argv[2] === 'apply';
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// industry -> { v: verdict-if-scaled, seg } . verdict 'in' (freight, gate on scale), 'out', 'review'.
const FREIGHT = {
  RETAIL: 'retail_grocery', WHOLESALE: 'wholesale_distribution', CONSUMER_GOODS: 'wholesale_distribution',
  CONSUMER_ELECTRONICS: 'wholesale_distribution', APPAREL_FASHION: 'retail_grocery', FURNITURE: 'wholesale_distribution',
  TEXTILES: 'wholesale_distribution', LUXURY_GOODS_JEWELRY: 'wholesale_distribution', SPORTING_GOODS: 'wholesale_distribution',
  FOOD_BEVERAGES: 'cpg_food_beverage', FOOD_PRODUCTION: 'agriculture_food_processing', FARMING: 'agriculture_food_processing',
  TRANSPORTATION_TRUCKING_RAILROAD: '3pl_carrier', LOGISTICS_AND_SUPPLY_CHAIN: '3pl_carrier', MARITIME: 'ports_intermodal',
  AUTOMOTIVE: 'automotive_heavy_mfg', MACHINERY: 'automotive_heavy_mfg', MECHANICAL_OR_INDUSTRIAL_ENGINEERING: 'building_materials_industrial',
  ELECTRICAL_ELECTRONIC_MANUFACTURING: 'automotive_heavy_mfg', INDUSTRIAL_AUTOMATION: 'building_materials_industrial',
  AVIATION_AEROSPACE: 'automotive_heavy_mfg', AIRLINES_AVIATION: 'automotive_heavy_mfg', DEFENSE_SPACE: 'automotive_heavy_mfg',
  BUILDING_MATERIALS: 'building_materials_industrial', GLASS_CERAMICS_CONCRETE: 'building_materials_industrial',
  MINING_METALS: 'building_materials_industrial', CHEMICALS: 'chemicals_plastics', PLASTICS: 'chemicals_plastics',
  OIL_ENERGY: 'chemicals_plastics', PACKAGING_AND_CONTAINERS: 'paper_packaging', PAPER_FOREST_PRODUCTS: 'paper_packaging',
  PRINTING: 'paper_packaging', BUSINESS_SUPPLIES_AND_EQUIPMENT: 'wholesale_distribution',
};
const OUT = new Set([
  'COMPUTER_SOFTWARE', 'INFORMATION_TECHNOLOGY_AND_SERVICES', 'INFORMATION_SERVICES', 'COMPUTER_NETWORK_SECURITY',
  'E_LEARNING', 'ONLINE_MEDIA', 'INTERNET', 'FINANCIAL_SERVICES', 'BANKING', 'INVESTMENT_MANAGEMENT', 'ACCOUNTING',
  'INSURANCE', 'HOSPITAL_HEALTH_CARE', 'MENTAL_HEALTH_CARE', 'ALTERNATIVE_MEDICINE', 'INDIVIDUAL_FAMILY_SERVICES',
  'HEALTH_WELLNESS_AND_FITNESS', 'PRIMARY_SECONDARY_EDUCATION', 'HIGHER_EDUCATION', 'RESEARCH', 'DESIGN',
  'ARCHITECTURE_PLANNING', 'PROFESSIONAL_TRAINING_COACHING', 'RESTAURANTS', 'HOSPITALITY', 'LEISURE_TRAVEL_TOURISM',
  'GAMBLING_CASINOS', 'SPORTS', 'MUSIC', 'PUBLISHING', 'ENTERTAINMENT', 'HUMAN_RESOURCES', 'OUTSOURCING_OFFSHORING',
  'LEGAL_SERVICES', 'GOVERNMENT_RELATIONS', 'EXECUTIVE_OFFICE', 'MANAGEMENT_CONSULTING', 'MARKETING_AND_ADVERTISING',
  'SECURITY_AND_INVESTIGATIONS', 'LAW_ENFORCEMENT', 'PUBLIC_SAFETY', 'MILITARY', 'LEGISLATIVE_OFFICE', 'REAL_ESTATE',
  'CONSUMER_SERVICES', 'CIVIL_ENGINEERING', 'STAFFING_AND_RECRUITING', 'VENTURE_CAPITAL_PRIVATE_EQUITY',
  'NONPROFIT_ORGANIZATION_MANAGEMENT', 'POLITICAL_ORGANIZATION', 'PHILANTHROPY', 'RELIGIOUS_INSTITUTIONS',
  'TELECOMMUNICATIONS', 'BROADCAST_MEDIA', 'MOTION_PICTURES_AND_FILM', 'FINE_ART', 'PERFORMING_ARTS',
]);
// ambiguous -> review (need facility/freight research): CONSTRUCTION, UTILITIES, MEDICAL_DEVICES, PHARMACEUTICALS,
// ENVIRONMENTAL_SERVICES, FACILITIES_SERVICES, RENEWABLES_ENVIRONMENT, '' / Unassigned, anything not mapped.

const tierFor = (n) => (n >= 100 ? 'A' : n >= 20 ? 'B' : 'C');

function classify(industry, contacts) {
  const ind = (industry || '').toUpperCase();
  if (FREIGHT[ind]) {
    // freight-heavy: needs scale. engaged book (>=5 contacts) -> in; otherwise review (verify size).
    if (contacts >= 5) return { v: 'in', seg: FREIGHT[ind], tier: tierFor(contacts) };
    return { v: 'review', seg: FREIGHT[ind], reason: 'freight vertical, scale unconfirmed' };
  }
  if (OUT.has(ind)) return { v: 'out', reason: `non-freight vertical (${ind.toLowerCase()})` };
  return { v: 'review', reason: ind ? `ambiguous vertical (${ind.toLowerCase()})` : 'no industry' };
}

// paginate ALL companies via the LIST endpoint (no 10k search-window cap); skip already-tagged in code.
async function* allCompanies() {
  let after = '';
  for (;;) {
    const url = new URL('https://api.hubapi.com/crm/v3/objects/companies');
    url.searchParams.set('limit', '100');
    url.searchParams.set('properties', 'name,industry,num_associated_contacts,yardflow_tam');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url, { headers: H });
    const j = await res.json();
    if (!j.results) { console.error('list error', JSON.stringify(j).slice(0, 300)); break; }
    for (const r of j.results) {
      if (r.properties.yardflow_tam) continue; // already tagged -> skip
      yield r;
    }
    after = j.paging?.next?.after;
    if (!after) break;
  }
}

const counts = { in: 0, out: 0, review: 0 };
const segCounts = {};
let batch = [];
let processed = 0;
const now = '2026-06-11';

async function flush() {
  if (!APPLY || batch.length === 0) { batch = []; return; }
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', {
    method: 'POST', headers: H, body: JSON.stringify({ inputs: batch }),
  });
  if (!res.ok) console.error('batch update fail', res.status, (await res.text()).slice(0, 200));
  batch = [];
}

for await (const c of allCompanies()) {
  const contacts = parseInt(c.properties.num_associated_contacts || '0', 10) || 0;
  const r = classify(c.properties.industry, contacts);
  counts[r.v]++;
  if (r.seg) segCounts[r.seg] = (segCounts[r.seg] || 0) + 1;
  processed++;
  const props = { yardflow_tam: r.v, tam_source: 'industry_rule_2026-06-11', tam_evaluated_at: now,
    tam_reason: r.reason || `${c.properties.industry} + ${contacts} contacts -> ${r.v}` };
  if (r.seg) props.tam_segment = r.seg;
  if (r.tier) props.tam_tier = r.tier;
  batch.push({ id: c.id, properties: props });
  if (batch.length >= 100) await flush();
}
await flush();

console.log(JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRYRUN', processed, counts, segCounts }, null, 2));
