// Create the YardFlow discovery-score company properties via the private-app
// token (server-side; idempotent). These put the full corridor-fit + yard-audit
// intel on every company record, beside intent_score / trigger_score / TAM, so
// clawd, the modex UI, and Casey all read one shared record.
// Run: node scripts/intel/ensure-score-properties.mjs
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { console.error('no HUBSPOT_ACCESS_TOKEN'); process.exit(1); }

const GROUP = 'companyinformation';

const props = [
  { name: 'yardflow_composite_score', label: 'YardFlow Composite Score', type: 'number', fieldType: 'number',
    description: 'Complete discovery score (proximity 0.55 + fit 0.30 + density 0.15, 0-100). The primary corridor-fit ranking number.' },
  { name: 'yardflow_proximity_score', label: 'YardFlow Proximity Score', type: 'number', fieldType: 'number',
    description: 'Proximity axis 0-100: closeness to the nearest live Primo reference site.' },
  { name: 'yardflow_fit_score', label: 'YardFlow Fit Score', type: 'number', fieldType: 'number',
    description: 'ICP fit 0-100: vertical + enterprise scale + network complexity.' },
  { name: 'yardflow_corridor_density', label: 'YardFlow Corridor Density', type: 'number', fieldType: 'number',
    description: 'Live prospect sites within the account’s 5-mile corridor (the work-one-corridor lever).' },
  { name: 'yardflow_nearest_primo_mi', label: 'YardFlow Nearest Primo (mi)', type: 'number', fieldType: 'number',
    description: 'Miles from the account’s nearest facility to the nearest live Primo reference site.' },
  { name: 'yardflow_nearest_primo_site', label: 'YardFlow Nearest Primo Site', type: 'string', fieldType: 'text',
    description: 'Name of the nearest live Primo reference site (the corridor anchor for the "we’re live N miles away" angle).' },
  { name: 'yardflow_yard_facilities', label: 'YardFlow Yard Facilities', type: 'number', fieldType: 'number',
    description: 'Audited facility count for the account.' },
  { name: 'yardflow_yard_gated_pct', label: 'YardFlow Yard Gated %', type: 'number', fieldType: 'number',
    description: 'Percent of audited facilities that are truck-gated.' },
  { name: 'yardflow_yard_dock_doors', label: 'YardFlow Yard Dock Doors', type: 'number', fieldType: 'number',
    description: 'Total dock doors across the audited facilities.' },
  { name: 'yardflow_yard_trailer_cap', label: 'YardFlow Yard Trailer Capacity', type: 'number', fieldType: 'number',
    description: 'Total trailer-parking capacity across the audited facilities.' },
  { name: 'yardflow_yard_archetype', label: 'YardFlow Yard Archetype', type: 'string', fieldType: 'text',
    description: 'Dominant yard archetype, e.g. "#3 (No Gate / No GS)".' },
  { name: 'yardflow_yard_entry', label: 'YardFlow Recommended Entry', type: 'string', fieldType: 'textarea',
    description: 'Recommended YardFlow entry point from the account’s yard-audit sales summary.' },
  { name: 'yardflow_dossier_url', label: 'YardFlow Dossier URL', type: 'string', fieldType: 'text',
    description: 'Link to the account’s /for page / yard-audit dossier.' },
  { name: 'yardflow_score_at', label: 'YardFlow Score Updated At', type: 'datetime', fieldType: 'date',
    description: 'When the discovery scores on this record were last computed.' },
];

let created = 0, exists = 0, failed = 0;
for (const p of props) {
  const body = { name: p.name, label: p.label, type: p.type, fieldType: p.fieldType, groupName: GROUP, description: p.description };
  const res = await fetch('https://api.hubapi.com/crm/v3/properties/companies', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) { console.log(`created ${p.name}`); created += 1; }
  else {
    const txt = await res.text();
    if (res.status === 409 || /already exists/i.test(txt)) { console.log(`exists  ${p.name}`); exists += 1; }
    else { console.error(`FAIL    ${p.name}: ${res.status} ${txt.slice(0, 160)}`); failed += 1; }
  }
}
console.log(`done: ${created} created, ${exists} existed, ${failed} failed`);
