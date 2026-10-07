// CONTROLLED PROVIDER STUBS for the GAP execution-recovery harness (R05, 2026-10-06). Scratch use only.
//
// One local HTTP server that answers, with controlled data, the external boundaries a GAP page or action reads:
//   HubSpot (the SDK base path, HUBSPOT_API_BASE_PATH): company search by domain/name, company batch read,
//     v4 associations (basic page + batch), deal batch read, contact batch read. Deals per account come from a
//     JSON file (STUB_DEALS_FILE: { "<company name>": [{ id, dealname, dealstage, hs_is_closed, contacts?,
//     hs_next_step?, amount? }] }). R50: `contacts` lists the HubSpot contact ids on the deal, so two deals under one
//     company can each carry their own person (deal -> contacts and contact -> deals associations answer from it).
//   clawd (CLAWD_CONTROL_PLANE_URL): the suppression contract (every address clear unless listed in
//     STUB_BLOCKED_FILE) and the autonomy state (global false, every motion false), plus the read endpoints the
//     story readers call (answered empty).
//   R54 writes (only an approved CRM change with GAP_HUBSPOT_MIRROR_ENABLED on ever calls them): note and task
//     create (kept in memory, each also appended to STUB_WRITES_FILE), note and task search by a token in the body,
//     a deal's properties with their history, a deal property update. The control endpoint POST /__stub/control
//     `{ failWrites: true | false | 'after_write' }` makes every write fail (503), or keep the write and lose the
//     answer (504) the way a provider timeout after acceptance looks; POST /__stub/deal-property
//     `{ dealId, property, value, sourceType }` plays a human editing the deal in HubSpot; GET /__stub/writes lists
//     what was written. STUB_FAIL_WRITES=1 starts in the failing mode.
// Every request is appended to STUB_LOG (one JSON line each) so a test can prove what was asked.
//
//   node scripts/gap/recovery/stubs.mjs [port]
import http from 'node:http';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const port = Number(process.argv[2] || process.env.STUB_PORT || 4545);
const log = process.env.STUB_LOG || '';
const dealsFile = process.env.STUB_DEALS_FILE || '';
const writesFile = process.env.STUB_WRITES_FILE || '';
// R54: the written objects, the deal property overrides (with history) and the failure mode.
const written = { notes: [], tasks: [] };
const dealProps = new Map(); // dealId -> { [property]: [{ value, timestamp, sourceType }] newest first }
let failWrites = process.env.STUB_FAIL_WRITES === '1' ? true : false;
let nextObjectId = 500000;
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
    companies.set(key, { id: String(900000000 + (h % 100000000)), name: name.trim(), domain: `${key.replace(/[^a-z0-9]+/g, '-')}.example.com`, yardflow_tam: 'in', tam_tier: 'A' });
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
// R54: a deal's next step as the stub holds it now (an approved change or a human edit, else the deals file).
const nextStepOf = (d) => dealProps.get(String(d.id))?.hs_next_step?.[0]?.value ?? d.hs_next_step ?? null;
const allDeals = () => [...companies.values()].flatMap((c) => dealsOf(c.id));
const contactsOf = (dealId) => (allDeals().find((d) => String(d.id) === String(dealId))?.contacts ?? []).map(String);
const dealsOfContact = (contactId) => allDeals().filter((d) => (d.contacts ?? []).map(String).includes(String(contactId)));
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
    if (path === '/api/autonomy/state') return json(res, 200, { global: true, motions: { outreach: true, actuator: true, social: true, content: true }, updated_by: 'stub', reason: null });
    // The congruence critic (critic-client.ts): a controlled PASS so the compiler's deterministic checks decide; a
    // harness wanting a block sets STUB_CRITIC=block.
    if (path === '/api/critic/score') {
      const verdict = process.env.STUB_CRITIC === 'block' ? 'block' : 'pass';
      return json(res, 200, { verdict, hard_block: verdict === 'block', score: verdict === 'block' ? 20 : 96, counts: { block: verdict === 'block' ? 1 : 0, warn: 0 }, violations: verdict === 'block' ? [{ rule: 'stub', severity: 'block', message: 'blocked by the harness' }] : [], artifact_type: 'email', used_llm: false, edge: { verdict, hard_block: verdict === 'block', score: verdict === 'block' ? 20 : 96, violations: [] } });
    }
    if (path.startsWith('/api/')) return json(res, 200, { ok: true, results: [], items: [], threads: [], contacts: [] });

    // ---- R54: the harness controls and the write endpoints ----
    if (path === '/__stub/control' && req.method === 'POST') {
      if ('failWrites' in parsed) failWrites = parsed.failWrites;
      return json(res, 200, { failWrites });
    }
    if (path === '/__stub/writes') return json(res, 200, written);
    if (path === '/__stub/deal-property' && req.method === 'POST') {
      const hist = dealProps.get(String(parsed.dealId)) ?? {};
      hist[parsed.property] = [{ value: parsed.value, timestamp: new Date().toISOString(), sourceType: parsed.sourceType ?? 'CRM_UI' }, ...(hist[parsed.property] ?? [])];
      dealProps.set(String(parsed.dealId), hist);
      return json(res, 200, { ok: true });
    }
    const write = (kind, body) => {
      if (failWrites === true) return json(res, 503, { status: 'error', message: 'stub: HubSpot is unavailable' });
      const obj = { id: String((nextObjectId += 1)), kind, properties: body.properties ?? {}, associations: body.associations ?? [], at: new Date().toISOString() };
      written[kind].push(obj);
      if (writesFile) appendFileSync(writesFile, JSON.stringify(obj) + '\n');
      if (failWrites === 'after_write') return json(res, 504, { status: 'error', message: 'stub: the answer was lost after the write' });
      return json(res, 201, { id: obj.id, properties: obj.properties, createdAt: obj.at, updatedAt: obj.at, archived: false });
    };
    if (path === '/crm/v3/objects/notes' && req.method === 'POST') return write('notes', parsed);
    if (path === '/crm/v3/objects/tasks' && req.method === 'POST') return write('tasks', parsed);
    let search = /^\/crm\/v3\/objects\/(notes|tasks)\/search$/.exec(path);
    if (search) {
      const prop = search[1] === 'notes' ? 'hs_note_body' : 'hs_task_body';
      const tokens = (parsed.filterGroups ?? []).flatMap((g) => (g.filters ?? []).filter((f) => f.propertyName === prop).map((f) => String(f.value)));
      const results = written[search[1]].filter((o) => tokens.some((t) => String(o.properties[prop] ?? '').includes(t))).map((o) => ({ id: o.id, properties: { [prop]: o.properties[prop] } }));
      return json(res, 200, { total: results.length, results });
    }
    let dealOne = /^\/crm\/v3\/objects\/deals\/(\d+)$/.exec(path);
    if (dealOne && req.method === 'GET') {
      const d = allDeals().find((x) => String(x.id) === dealOne[1]);
      if (!d) return json(res, 404, { status: 'error', message: 'not found' });
      const wanted = (url.searchParams.get('properties') ?? '').split(',').filter(Boolean);
      const hist = dealProps.get(dealOne[1]) ?? {};
      const base = { hs_next_step: nextStepOf(d), dealname: d.dealname };
      const properties = {};
      const propertiesWithHistory = {};
      for (const p of wanted) {
        const h = hist[p] ?? (base[p] != null ? [{ value: base[p], timestamp: '2026-10-01T00:00:00.000Z', sourceType: 'CRM_UI' }] : []);
        properties[p] = h[0]?.value ?? null;
        propertiesWithHistory[p] = h;
      }
      return json(res, 200, { id: dealOne[1], properties, propertiesWithHistory, createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', archived: false });
    }
    if (dealOne && req.method === 'PATCH') {
      if (failWrites === true) return json(res, 503, { status: 'error', message: 'stub: HubSpot is unavailable' });
      const hist = dealProps.get(dealOne[1]) ?? {};
      for (const [p, v] of Object.entries(parsed.properties ?? {})) hist[p] = [{ value: v, timestamp: new Date().toISOString(), sourceType: 'INTEGRATION' }, ...(hist[p] ?? [])];
      dealProps.set(dealOne[1], hist);
      const obj = { id: dealOne[1], kind: 'deal_update', properties: parsed.properties ?? {}, at: new Date().toISOString() };
      if (writesFile) appendFileSync(writesFile, JSON.stringify(obj) + '\n');
      return json(res, 200, { id: dealOne[1], properties: parsed.properties ?? {}, createdAt: '2026-09-01T00:00:00Z', updatedAt: obj.at, archived: false });
    }

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
    let single = /^\/crm\/v3\/objects\/companies\/(\d+)$/.exec(path);
    if (single && req.method === 'GET') {
      const c = byId(single[1]);
      if (!c) return json(res, 404, { status: 'error', message: 'not found' });
      return json(res, 200, { id: c.id, properties: { name: c.name, domain: c.domain, yardflow_tam: c.yardflow_tam, tam_tier: c.tam_tier, hs_lastmodifieddate: '2026-10-01T00:00:00Z' } });
    }
    if (path === '/crm/v3/objects/companies/batch/read') {
      const results = (parsed.inputs ?? []).map((i) => byId(i.id)).filter(Boolean).map((c) => ({ id: c.id, properties: { name: c.name, domain: c.domain, yardflow_tam: c.yardflow_tam, tam_tier: c.tam_tier } }));
      return json(res, 200, { status: 'COMPLETE', results });
    }
    if (path === '/crm/v3/objects/deals/batch/read') {
      const all = [...companies.values()].flatMap((c) => dealsOf(c.id));
      const results = (parsed.inputs ?? [])
        .map((i) => all.find((d) => String(d.id) === String(i.id)))
        .filter(Boolean)
        .map((d) => ({ id: String(d.id), properties: { dealname: d.dealname, dealstage: d.dealstage ?? 'appointmentscheduled', pipeline: 'default', hs_is_closed: d.hs_is_closed ? 'true' : 'false', createdate: '2026-09-01T00:00:00Z', amount: d.amount ?? null, closedate: null, hs_next_step: nextStepOf(d), notes_last_updated: '2026-10-01T00:00:00Z', hs_lastmodifieddate: '2026-10-01T00:00:00Z' } }));
      return json(res, 200, { status: 'COMPLETE', results });
    }
    if (path === '/crm/v3/objects/contacts/batch/read') return json(res, 200, { status: 'COMPLETE', results: [] });
    if (path === '/crm/v3/objects/deals/search') {
      // The In Deals summary reads every open deal in the portal (deals/in-deals.ts): the file's deals, open ones only.
      const results = [...companies.values()].flatMap((c) => dealsOf(c.id)).filter((d) => !d.hs_is_closed).map((d) => ({ id: String(d.id), properties: { dealname: d.dealname, dealstage: d.dealstage ?? 'appointmentscheduled', pipeline: 'default', hs_is_closed: 'false', notes_last_updated: '2026-10-01T00:00:00Z', hs_lastmodifieddate: '2026-10-01T00:00:00Z', amount: d.amount ?? null, closedate: null, hs_next_step: nextStepOf(d), createdate: '2026-09-01T00:00:00Z' } }));
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
        from: { id: String(i.id) },
        to:
          m[1] === 'companies' && m[2] === 'deals'
            ? dealsOf(String(i.id)).map((d) => ({ toObjectId: String(d.id), associationTypes: [] }))
            : m[1] === 'deals' && m[2] === 'companies'
              ? [companyOfDeal(i.id)].filter(Boolean).map((c) => ({ toObjectId: c.id, associationTypes: [] }))
              : m[1] === 'deals' && m[2] === 'contacts'
                ? contactsOf(i.id).map((k) => ({ toObjectId: k, associationTypes: [] }))
                : m[1] === 'contacts' && m[2] === 'deals'
                  ? dealsOfContact(i.id).map((d) => ({ toObjectId: String(d.id), associationTypes: [] }))
                  : [],
      }));
      return json(res, 200, { status: 'COMPLETE', results });
    }
    return json(res, 200, { results: [] });
  });
});
server.listen(port, '127.0.0.1', () => console.log(`stubs listening on http://127.0.0.1:${port}`));
