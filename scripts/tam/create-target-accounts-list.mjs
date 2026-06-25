// Create a DYNAMIC company Active List of the Target Accounts (hs_is_target_account=true).
import { readFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const body = {
  name: 'Target Accounts (Tier A) — by Intent',
  objectTypeId: '0-2',
  processingType: 'DYNAMIC',
  filterBranch: {
    filterBranchType: 'OR',
    filterBranches: [{
      filterBranchType: 'AND',
      filters: [{
        filterType: 'PROPERTY',
        property: 'hs_is_target_account',
        operation: { operationType: 'BOOL', operator: 'IS_EQUAL_TO', value: true },
      }],
      filterBranches: [],
    }],
    filters: [],
  },
};

const r = await fetch('https://api.hubapi.com/crm/v3/lists', { method: 'POST', headers: H, body: JSON.stringify(body) });
const j = await r.json();
if (!r.ok) { console.error('FAIL', r.status, JSON.stringify(j).slice(0, 400)); process.exit(1); }
console.log(JSON.stringify({ listId: j.list?.listId, name: j.list?.name, size: j.list?.size, processingStatus: j.list?.processingStatus }, null, 2));
