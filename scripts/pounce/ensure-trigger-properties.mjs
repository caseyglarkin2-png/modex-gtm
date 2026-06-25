// Create the YardFlow pounce trigger-heat company properties via the private-app
// token (server-side; idempotent). Mirrors the intent properties (intent_score /
// last_intent_at / last_intent_source) so a company record reads engagement
// intent AND announced-news trigger heat side by side.
// Run: node scripts/pounce/ensure-trigger-properties.mjs
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { console.error('no HUBSPOT_ACCESS_TOKEN'); process.exit(1); }

const GROUP = 'companyinformation';
const opt = (label, value, i) => ({ label, value, displayOrder: i, hidden: false });

// The pounce taxonomy categories (src/lib/pounce/score.ts), as a filterable enum.
const CATEGORIES = [
  ['AUTONOMY', 'autonomy'], ['YARD_DIRECT', 'yard_direct'], ['DIGITAL_OPS', 'digital_ops'],
  ['NETWORK_CAPEX', 'network_capex'], ['COST_RESTRUCTURE', 'cost_restructure'],
  ['LEADERSHIP', 'leadership'], ['FREIGHT', 'freight'],
];

const props = [
  { name: 'trigger_score', label: 'Trigger Score', type: 'number', fieldType: 'number',
    description: 'Pounce trigger score of the most recent hot trigger for this account (taxonomy-weighted; >=8 is ping-tier). Higher = more pounce-able news.' },
  { name: 'last_trigger_at', label: 'Last Trigger At', type: 'datetime', fieldType: 'date',
    description: 'Timestamp of the most recent hot pounce trigger (announced news) detected for this account.' },
  { name: 'last_trigger_headline', label: 'Last Trigger Headline', type: 'string', fieldType: 'text',
    description: 'Headline of the most recent hot pounce trigger, readable directly on the record.' },
  { name: 'last_trigger_source', label: 'Last Trigger Source', type: 'string', fieldType: 'text',
    description: 'Channel + publisher that surfaced the latest trigger (e.g. news / x / earnings, with the source name).' },
  { name: 'last_trigger_url', label: 'Last Trigger URL', type: 'string', fieldType: 'text',
    description: 'Direct link to the most recent trigger story, so it is one click from the company record.' },
  { name: 'last_trigger_category', label: 'Last Trigger Category', type: 'enumeration', fieldType: 'select',
    description: 'Pounce taxonomy category the latest trigger fired on, for filtered lists/workflows (e.g. all accounts with an AUTONOMY trigger).',
    options: CATEGORIES.map(([label, value], i) => opt(label, value, i)) },
];

for (const p of props) {
  const body = { name: p.name, label: p.label, type: p.type, fieldType: p.fieldType, groupName: GROUP, description: p.description, ...(p.options ? { options: p.options } : {}) };
  const res = await fetch('https://api.hubapi.com/crm/v3/properties/companies', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) { console.log(`created ${p.name}`); }
  else {
    const txt = await res.text();
    if (res.status === 409 || /already exists/i.test(txt)) console.log(`exists  ${p.name}`);
    else console.error(`FAIL    ${p.name}: ${res.status} ${txt.slice(0, 200)}`);
  }
}
console.log('done');
