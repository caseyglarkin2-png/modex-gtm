// Create the YardFlow TAM company properties via the private-app token (server-side; idempotent).
// Run: node scripts/tam/ensure-tam-properties.mjs
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { console.error('no HUBSPOT_ACCESS_TOKEN'); process.exit(1); }

const GROUP = 'companyinformation';
const opt = (label, value, i) => ({ label, value, displayOrder: i, hidden: false });

const SEGMENTS = [
  'cpg_food_beverage', 'retail_grocery', '3pl_carrier', 'building_materials_industrial',
  'chemicals_plastics', 'paper_packaging', 'ecommerce_parcel', 'cold_chain',
  'ports_intermodal', 'automotive_heavy_mfg', 'agriculture_food_processing', 'wholesale_distribution',
];

const props = [
  { name: 'yardflow_tam', label: 'YardFlow TAM', type: 'enumeration', fieldType: 'select',
    options: [opt('In', 'in', 0), opt('Review', 'review', 1), opt('Out', 'out', 2)] },
  { name: 'tam_tier', label: 'TAM Tier', type: 'enumeration', fieldType: 'select',
    options: [opt('A - National network / enterprise', 'A', 0), opt('B - Multi-site', 'B', 1), opt('C - Single big yard / small multi-site', 'C', 2)] },
  { name: 'tam_segment', label: 'TAM Segment', type: 'enumeration', fieldType: 'select',
    options: SEGMENTS.map((s, i) => opt(s.replace(/_/g, ' '), s, i)) },
  { name: 'tam_facility_count', label: 'TAM Facility Count (est)', type: 'number', fieldType: 'number' },
  { name: 'tam_reason', label: 'TAM Reason', type: 'string', fieldType: 'textarea' },
  { name: 'tam_source', label: 'TAM Source', type: 'string', fieldType: 'text' },
  { name: 'tam_evaluated_at', label: 'TAM Evaluated At', type: 'datetime', fieldType: 'date' },
  { name: 'na_operating', label: 'NA Operating', type: 'enumeration', fieldType: 'booleancheckbox',
    options: [opt('Yes', 'true', 0), opt('No', 'false', 1)] },
];

for (const p of props) {
  const body = { name: p.name, label: p.label, type: p.type, fieldType: p.fieldType, groupName: GROUP, ...(p.options ? { options: p.options } : {}) };
  const res = await fetch('https://api.hubapi.com/crm/v3/properties/companies', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) { console.log(`created ${p.name}`); }
  else {
    const txt = await res.text();
    if (res.status === 409 || /already exists/i.test(txt)) console.log(`exists  ${p.name}`);
    else console.error(`FAIL    ${p.name}: ${res.status} ${txt.slice(0, 160)}`);
  }
}
console.log('done');
