// Mark + count TAM confidence.
//
// 72% of the yardflow_tam='in' set was tagged by industry rule / engagement proxy,
// not by verified freight ground truth. tam_source already records HOW each account
// was tagged, but as free text no gate can read. This derives a structured
// tam_confidence from tam_source so downstream gates CAN prefer verified TAM, and
// prints the counts by verdict x confidence.
//
// It does NOT re-tag yardflow_tam and does NOT remove anyone. It only fills the new
// tam_confidence field. Default is a dry-run that just reports counts.
//
// Usage:
//   node scripts/tam/mark-tam-confidence.mjs           (dry-run: count + report only)
//   node scripts/tam/mark-tam-confidence.mjs apply     (also write tam_confidence)
//
// Run scripts/tam/ensure-tam-properties.mjs once first so tam_confidence exists.
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { console.error('no HUBSPOT_ACCESS_TOKEN'); process.exit(1); }
const APPLY = process.argv[2] === 'apply';
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// Map a tam_source string to a structured confidence bucket. Prefix-matched so
// future ground-truth sources (facility_verified_*, manual_*) resolve correctly
// without editing existing tagged rows.
function confidenceFor(source) {
  const s = (source || '').toLowerCase();
  if (!s) return 'unverified';
  if (/^(facility_verified|facility_facts|manual|verified|ground_truth)/.test(s)) return 'ground_truth';
  if (/^(web_research|backlog_research|apollo)/.test(s)) return 'web_research';
  if (/^(industry_rule|review_industry|freight_vertical|engaged_review|aero_defense)/.test(s)) return 'rule_proxy';
  return 'unverified';
}

// Paginate ALL companies via the LIST endpoint (no 10k search-window cap); keep
// only rows that already carry a yardflow_tam verdict.
async function* taggedCompanies() {
  let after = '';
  for (;;) {
    const url = new URL('https://api.hubapi.com/crm/v3/objects/companies');
    url.searchParams.set('limit', '100');
    url.searchParams.set('properties', 'name,yardflow_tam,tam_source,tam_confidence');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url, { headers: H });
    const j = await res.json();
    if (!j.results) { console.error('list error', JSON.stringify(j).slice(0, 300)); break; }
    for (const r of j.results) {
      if (!r.properties.yardflow_tam) continue;
      yield r;
    }
    after = j.paging?.next?.after;
    if (!after) break;
  }
}

// counts[verdict][confidence] = n
const counts = {};
const bump = (verdict, conf) => {
  counts[verdict] ??= {};
  counts[verdict][conf] = (counts[verdict][conf] || 0) + 1;
};

let processed = 0;
let toWrite = 0;
let batch = [];

async function flush() {
  if (!APPLY || batch.length === 0) { batch = []; return; }
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', {
    method: 'POST', headers: H, body: JSON.stringify({ inputs: batch }),
  });
  if (!res.ok) console.error('batch update fail', res.status, (await res.text()).slice(0, 200));
  batch = [];
}

for await (const c of taggedCompanies()) {
  const verdict = c.properties.yardflow_tam;
  const conf = confidenceFor(c.properties.tam_source);
  bump(verdict, conf);
  processed++;
  if (c.properties.tam_confidence !== conf) {
    toWrite++;
    batch.push({ id: c.id, properties: { tam_confidence: conf } });
    if (batch.length >= 100) await flush();
  }
}
await flush();

// Surface the headline: of the 'in' set, how much is verified vs proxy.
const inSet = counts.in || {};
const inTotal = Object.values(inSet).reduce((a, b) => a + b, 0);
const proxyShare = inTotal ? Math.round(((inSet.rule_proxy || 0) / inTotal) * 100) : 0;

console.log(JSON.stringify({
  mode: APPLY ? 'APPLY' : 'DRYRUN',
  processed,
  wouldWriteOrWrote: toWrite,
  countsByVerdictAndConfidence: counts,
  inSet: { total: inTotal, ...inSet, rule_proxy_pct: proxyShare },
}, null, 2));