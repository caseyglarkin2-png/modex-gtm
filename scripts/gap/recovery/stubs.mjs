// CONTROLLED PROVIDER STUBS for the GAP execution-recovery harness (R05, 2026-10-06). Scratch use only.
//
// One local HTTP server that answers, with controlled data, the external boundaries a GAP page or action reads:
//   HubSpot (the SDK base path, HUBSPOT_API_BASE_PATH): company search by domain/name, company batch read,
//     v4 associations (basic page + batch), deal batch read, contact batch read. Deals per account come from a
//     JSON file (STUB_DEALS_FILE: { "<company name>": [{ id, dealname, dealstage, hs_is_closed }] }).
//   clawd (CLAWD_CONTROL_PLANE_URL): the suppression contract (every address clear unless listed in
//     STUB_BLOCKED_FILE) and the autonomy state (global false, every motion false), plus the read endpoints the
//     story readers call (answered empty).
// Every request is appended to STUB_LOG (one JSON line each) so a test can prove what was asked.
//
//   node scripts/gap/recovery/stubs.mjs [port]
import http from 'node:http';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const port = Number(process.argv[2] || process.env.STUB_PORT || 4545);
const log = process.env.STUB_LOG || '';
const dealsFile = process.env.STUB_DEALS_FILE || '';
const blockedFile = process.env.STUB_BLOCKED_FILE || '';
const readJson = (f, fallback) => (f && existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : fallback);

// Companies: one HubSpot company per account name the harness seeds; id = a stable hash of the name. Domain
// `<slug>.example.com` and the name itself both find it, so the real resolver union works unchanged.
const companies = new Map();
function companyFor(name) {
  const key = name.trim().toLowerCase();
  if (!companies.has(key)) {
    let h = 0;
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    companies.set(key, { id: String(900000000 + (h % 100000000)), name: name.trim(), domain: `${key.replace(/[^a-z0-9]+/g, '-')}.example.com` });
  }
  return companies.get(key);
}
function seedCompanies() {
  for (const name of Object.keys(readJson(dealsFile, {}))) companyFor(name);
  for (const name of (process.env.STUB_COMPANIES || '').split('|').filter(Boolean)) companyFor(name);
}
seedCompanies();
const dealsOf = (companyId) => {
  const deals = readJson(dealsFile, {});
  for (const [name, list] of Object.entries(deals)) if (companyFor(name).id === companyId) return list;
  return [];
};
const byDomain = (d) => [...companies.values()].find((c) => c.domain === d.toLowerCase().replace(/^www\./, ''));
const byName = (n) => [...companies.values()].find((c) => c.name.toLowerCase() === n.toLowerCase());
const byId = (id) => [...companies.values()].find((c) => c.id === String(id));

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    seedCompanies();
    const url = new URL(req.url, 'http://x');
    const path = url.pathname;
    let parsed = {};
    try {
      parsed = body ? JSON.parse(body) : {};
    } catch {
      parsed = {};
    }
    if (log) appendFileSync(log, JSON.stringify({ at: new Date().toISOString(), method: req.method, path, body: parsed }) + '\n');

    // ---- clawd ----
    if (path === '/api/suppression/contract') {
      const blocked = new Set(readJson(blockedFile, []).map((e) => String(e).toLowerCase()));
      const emails = Array.isArray(parsed.emails) ? parsed.emails : parsed.email ? [parsed.email] : parsed.to ? [parsed.to] : [];
      return json(res, 200, { ok: true, results: emails.map((email) => ({ email, blocked: blocked.has(String(email).toLowerCase()), reason: blocked.has(String(email).toLowerCase()) ? 'do_not_send' : null })) });
    }
    if (path === '/api/autonomy/state') return json(res, 200, { global: false, motions: { outreach: false, actuator: false, social: false, content: false }, updated_by: 'stub', reason: null });
    if (path.startsWith('/api/')) return json(res, 200, { ok: true, results: [], items: [], threads: [], contacts: [] });

    // ---- HubSpot ----
    if (path === '/crm/v3/objects/companies/search') {
      const results = [];
      for (const g of parsed.filterGroups ?? []) {
        for (const f of g.filters ?? []) {
          const hit = f.propertyName === 'domain' ? byDomain(String(f.value)) : f.propertyName === 'name' ? byName(String(f.value)) : null;
          if (hit && !results.some((r) => r.id === hit.id)) results.push({ id: hit.id, properties: { name: hit.name, domain: hit.domain } });
        }
      }
      return json(res, 200, { total: results.length, results });
    }
    if (path === '/crm/v3/objects/companies/batch/read') {
      const results = (parsed.inputs ?? []).map((i) => byId(i.id)).filter(Boolean).map((c) => ({ id: c.id, properties: { name: c.name, domain: c.domain } }));
      return json(res, 200, { status: 'COMPLETE', results });
    }
    if (path === '/crm/v3/objects/deals/batch/read') {
      const all = [...companies.values()].flatMap((c) => dealsOf(c.id));
      const results = (parsed.inputs ?? [])
        .map((i) => all.find((d) => String(d.id) === String(i.id)))
        .filter(Boolean)
        .map((d) => ({ id: String(d.id), properties: { dealname: d.dealname, dealstage: d.dealstage ?? 'appointmentscheduled', pipeline: 'default', hs_is_closed: d.hs_is_closed ? 'true' : 'false', createdate: '2026-09-01T00:00:00Z', amount: d.amount ?? null, closedate: null, hs_next_step: d.hs_next_step ?? null, notes_last_updated: '2026-10-01T00:00:00Z', hs_lastmodifieddate: '2026-10-01T00:00:00Z' } }));
      return json(res, 200, { status: 'COMPLETE', results });
    }
    if (path === '/crm/v3/objects/contacts/batch/read') return json(res, 200, { status: 'COMPLETE', results: [] });
    if (path === '/crm/v3/objects/deals/search') {
      // The In Deals summary reads every open deal in the portal (deals/in-deals.ts): the file's deals, open ones only.
      const results = [...companies.values()].flatMap((c) => dealsOf(c.id)).filter((d) => !d.hs_is_closed).map((d) => ({ id: String(d.id), properties: { dealname: d.dealname, dealstage: d.dealstage ?? 'appointmentscheduled', pipeline: 'default', hs_is_closed: 'false', notes_last_updated: '2026-10-01T00:00:00Z', hs_lastmodifieddate: '2026-10-01T00:00:00Z', amount: d.amount ?? null, closedate: null, hs_next_step: d.hs_next_step ?? null, createdate: '2026-09-01T00:00:00Z' } }));
      return json(res, 200, { total: results.length, results });
    }
    let m = /^\/crm\/v4\/objects\/companies\/(\d+)\/associations\/(\w+)$/.exec(path);
    if (m) {
      const list = m[2] === 'deals' ? dealsOf(m[1]).map((d) => ({ toObjectId: String(d.id), associationTypes: [{ category: 'HUBSPOT_DEFINED', typeId: 342, label: null }] })) : [];
      return json(res, 200, { results: list });
    }
    m = /^\/crm\/v4\/associations\/(\w+)\/(\w+)\/batch\/read$/.exec(path);
    if (m) {
      const companyOfDeal = (dealId) => [...companies.values()].find((c) => dealsOf(c.id).some((d) => String(d.id) === String(dealId)));
      const results = (parsed.inputs ?? []).map((i) => ({
        _from: { id: String(i.id) },
        to:
          m[1] === 'companies' && m[2] === 'deals'
            ? dealsOf(String(i.id)).map((d) => ({ toObjectId: String(d.id), associationTypes: [] }))
            : m[1] === 'deals' && m[2] === 'companies'
              ? [companyOfDeal(i.id)].filter(Boolean).map((c) => ({ toObjectId: c.id, associationTypes: [] }))
              : [],
      }));
      return json(res, 200, { status: 'COMPLETE', results });
    }
    return json(res, 200, { results: [] });
  });
});
server.listen(port, '127.0.0.1', () => console.log(`stubs listening on http://127.0.0.1:${port}`));
