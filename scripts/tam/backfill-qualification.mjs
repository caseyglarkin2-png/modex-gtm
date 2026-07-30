// One-time MQL/SQL backfill across the TAM — direct + chunked (no cron, no CRON_SECRET, no 5-min limit).
// Mirrors src/lib/revops/qualification/model.ts exactly. dry-run by default; `apply` writes
// lifecyclestage + yardflow_qual_verdict. Slack is intentionally OFF for the historical backfill
// (the ongoing cron fires #yardflow-intent for genuinely-new SQLs). Usage: node scripts/tam/backfill-qualification.mjs [apply]
import { readFileSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const APPLY = process.argv[2] === 'apply';
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const now = new Date().toISOString();

// --- model (mirror of model.ts) ---
const SENIOR = new Set(['executive', 'vp', 'director', 'owner', 'partner']);
const OPS_TITLE = ['operations', 'supply chain', 'transportation', 'transport', 'logistics', 'warehouse', 'distribution', 'fleet', 'freight', 'dock', 'yard', 'procurement', 'planning'];
const num = (s) => { const n = parseFloat(s); return Number.isNaN(n) ? 0 : n; };
const hasRole = (c) => {
  if (SENIOR.has((c.hs_seniority || '').toLowerCase())) return true;
  if ((c.hs_role || '').toLowerCase() === 'operations') return true;
  const t = ` ${(c.jobtitle || '').toLowerCase()} `;
  return OPS_TITLE.some((k) => t.includes(k)) || t.includes(' dc ');
};
const hasIntent = (c) => num(c.intent_score) >= 1 || !!c.last_intent_at || !!c.last_intent_source || !!c.hs_sales_email_last_replied || !!c.engagements_last_meeting_booked || (num(c.hs_email_open) >= 2 && num(c.hs_email_replied) >= 1);
// lifecycle rank: only promote UP
const RANK = { lead: 0, '28942939': 1, '22575941': 2, '28840312': 3, marketingqualifiedlead: 4, salesqualifiedlead: 5, customer: 6 };
const MQL = 'marketingqualifiedlead', SQL = 'salesqualifiedlead';

// --- fetch TAM companies WITH contacts (list endpoint = reliable) ---
async function tamCompanyIds() {
  const ids = []; let after = '';
  for (;;) {
    const url = new URL('https://api.hubapi.com/crm/v3/objects/companies');
    url.searchParams.set('limit', '100');
    url.searchParams.set('properties', 'yardflow_tam,num_associated_contacts,name');
    if (after) url.searchParams.set('after', after);
    const j = await (await fetch(url, { headers: H })).json();
    if (!j.results) break;
    for (const r of j.results) {
      if (r.properties.yardflow_tam === 'in' && (parseInt(r.properties.num_associated_contacts || '0', 10) || 0) >= 1)
        ids.push({ id: r.id, name: r.properties.name || '' });
    }
    after = j.paging?.next?.after; if (!after) break;
  }
  return ids;
}
async function assocContactIds(companyId) {
  const ids = []; let after;
  do {
    const u = new URL(`https://api.hubapi.com/crm/v4/objects/companies/${companyId}/associations/contacts`);
    u.searchParams.set('limit', '500'); if (after) u.searchParams.set('after', after);
    const j = await (await fetch(u, { headers: H })).json();
    if (!j.results) break;
    for (const a of j.results) ids.push(String(a.toObjectId));
    after = j.paging?.next?.after;
  } while (after);
  return ids;
}
const CP = ['lifecyclestage', 'hs_seniority', 'hs_role', 'jobtitle', 'intent_score', 'last_intent_at', 'last_intent_source', 'hs_sales_email_last_replied', 'hs_email_open', 'hs_email_replied', 'engagements_last_meeting_booked', 'yardflow_qual_verdict', 'firstname', 'lastname'];
async function readContacts(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 100) {
    const j = await (await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/read', { method: 'POST', headers: H, body: JSON.stringify({ inputs: ids.slice(i, i + 100).map((id) => ({ id })), properties: CP }) })).json();
    for (const r of (j.results || [])) out.push({ id: r.id, ...r.properties });
  }
  return out;
}
async function writeBatch(updates) {
  for (let i = 0; i < updates.length; i += 100) {
    const r = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/update', { method: 'POST', headers: H, body: JSON.stringify({ inputs: updates.slice(i, i + 100) }) });
    if (!r.ok) console.error('write fail', r.status, (await r.text()).slice(0, 150));
  }
}

// --- run ---
// Lifecycle gate (Casey 2026-06-12): verdict marker for ALL qualified; lifecycle promotion only
// for SQLs (always) and MQLs with a PULSE (any email engagement). Cold ops-directors keep their
// stage; the verdict field marks them as the priority pool.
const hasPulse = (c) => num(c.hs_email_open) >= 1 || num(c.hs_email_replied) >= 1;

const companies = await tamCompanyIds();
console.error(`TAM companies with contacts: ${companies.length}`);
const counts = { evaluated: 0, mqlLifecycle: 0, mqlVerdictOnly: 0, sqlPromote: 0, alreadyOk: 0, notEligible: 0 };
const sqlNames = [];
const seen = new Set();
let updates = [];
let ci = 0;
for (const co of companies) {
  ci++;
  if (ci % 200 === 0) console.error(`  ${ci}/${companies.length} companies, mqlLC=${counts.mqlLifecycle} mqlV=${counts.mqlVerdictOnly} sql=${counts.sqlPromote}`);
  let cids; try { cids = await assocContactIds(co.id); } catch { continue; }
  if (!cids.length) continue;
  const contacts = await readContacts(cids);
  for (const c of contacts) {
    if (seen.has(c.id)) continue; seen.add(c.id); counts.evaluated++;
    if (!hasRole(c)) { counts.notEligible++; continue; }
    const rank = RANK[c.lifecyclestage] ?? 0;
    const verdict = hasIntent(c) ? 'sql' : 'mql';
    const props = { yardflow_qual_verdict: verdict, yardflow_qual_evaluated_at: now };
    if (verdict === 'sql' && rank < RANK[SQL]) {
      props.lifecyclestage = SQL; counts.sqlPromote++;
      if (sqlNames.length < 15) sqlNames.push(`${(c.firstname || '') + ' ' + (c.lastname || '')}`.trim() + ` @ ${co.name}`);
    } else if (verdict === 'mql' && rank < RANK[MQL]) {
      if (hasPulse(c)) { props.lifecyclestage = MQL; counts.mqlLifecycle++; }
      else counts.mqlVerdictOnly++;
    } else counts.alreadyOk++;
    if (props.lifecyclestage || c.yardflow_qual_verdict !== verdict) updates.push({ id: c.id, properties: props });
  }
  if (APPLY && updates.length >= 500) { await writeBatch(updates); updates = []; }
}
if (APPLY && updates.length) await writeBatch(updates);

// One Slack summary for the SQL batch, to the OPS channel.
//
// Rewritten 2026-07-30. This block used to be a rogue second sender: it scraped
// SLACK_WEBHOOK_URL out of the .env text with a regex and POSTed directly, which
// meant it bypassed BOTH the sendSlackNotification chokepoint and the
// NOTIFICATIONS_PAUSED kill switch. Pausing notifications did not pause this.
//
// It also posted a roster of contact names, the exact thing the per-SQL identity
// ping was deleted for. Deleting buildSqlAlert in src/ would have left this
// behind still doing it, from a script nobody would think to check.
//
// Now: counts only, ops channel, and it honours the pause switch. This is a
// manual historical batch job reporting on itself, so ops is the right home even
// though the subject matter is prospects.
if (APPLY && counts.sqlPromote > 0) {
  const paused = /^(1|true|yes|on)$/i.test((process.env.NOTIFICATIONS_PAUSED ?? '').trim());
  const hook =
    (env.match(/SLACK_OPS_WEBHOOK_URL\s*=\s*"?([^"\n\r]+)"?/) || [])[1] ||
    (env.match(/SLACK_WEBHOOK_URL\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
  if (paused) {
    console.error('slack summary skipped: NOTIFICATIONS_PAUSED');
  } else if (hook) {
    const text = `Qualification backfill: ${counts.sqlPromote} contacts promoted to SQL (TAM fit + role + intent)\nWho: HubSpot > contacts where YardFlow Qualification Verdict = SQL`;
    await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }).catch(() => {});
    console.error('slack summary sent (ops)');
  }
}
console.log(JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRYRUN', companiesWithContacts: companies.length, ...counts }, null, 2));
