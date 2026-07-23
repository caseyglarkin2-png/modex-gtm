import { readFileSync, readdirSync } from 'node:fs';
const TOKEN = readFileSync('C:/Users/casey/secrets/hubspot-private-app-token.txt','utf8').trim();
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const APPLY = process.argv[2] === 'apply';
const now = '2026-07-20';
const SEG = new Set(['cpg_food_beverage','retail_grocery','3pl_carrier','building_materials_industrial','chemicals_plastics','paper_packaging','ecommerce_parcel','cold_chain','ports_intermodal','automotive_heavy_mfg','agriculture_food_processing','wholesale_distribution']);
// Match BOTH shapes: the original id-keyed files (backlog-verdicts-N.jsonl) and
// the Batch-B files (backlogB-verdicts-N.jsonl), which carry {domain,...} with
// NO id. Batch-B was silently stranded on two bugs: this regex excluded it, and
// the loop below required v.id. Both are fixed here.
const files = readdirSync('.').filter(f => /^backlogB?-verdicts-\d+\.jsonl$/.test(f));

// Resolve a domain to its HubSpot company id (read-only search), cached so a
// repeated domain costs one call. Returns null when no company matches — the
// caller counts that as `unresolved` and skips it, never writing blindly.
const domainCache = new Map();
async function resolveDomainToId(domain) {
  const key = String(domain).trim().toLowerCase();
  if (domainCache.has(key)) return domainCache.get(key);
  let id = null;
  try {
    const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
      method: 'POST', headers: H,
      body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: key }] }], properties: ['domain'], limit: 1 }),
    });
    if (r.ok) { const d = await r.json(); id = d.results?.[0]?.id ?? null; }
    else if (r.status === 429) { await new Promise(s=>setTimeout(s,1000)); return resolveDomainToId(domain); }
  } catch { id = null; }
  domainCache.set(key, id);
  await new Promise(s => setTimeout(s, 120)); // gentle on the search rate limit
  return id;
}

const updates = []; const counts = { in:0, out:0, review:0, bad:0, unresolved:0 };
for (const f of files) for (const line of readFileSync(f,'utf8').split('\n')) {
  if (!line.trim()) continue;
  let v; try { v = JSON.parse(line); } catch { counts.bad++; continue; }
  if (!['in','out','review'].includes(v.verdict)) { counts.bad++; continue; }
  // Resolve the record id from either shape. Domain-keyed lines (Batch-B) are
  // looked up; a domain with no matching company is counted unresolved, not written.
  let id = v.id ? String(v.id) : null;
  if (!id && v.domain) {
    id = await resolveDomainToId(v.domain);
    if (!id) { counts.unresolved++; continue; }
  }
  if (!id) { counts.bad++; continue; }
  counts[v.verdict]++;
  if (v.verdict === 'review') continue;
  const props = { yardflow_tam: v.verdict, tam_source: 'backlog_research_2026-07-20', tam_evaluated_at: now, tam_reason: (v.reason||'').slice(0,300) };
  if (v.verdict === 'in') { props.na_operating='true'; if (SEG.has(v.segment)) props.tam_segment=v.segment; if (['A','B','C'].includes(v.tier)) props.tam_tier=v.tier; }
  updates.push({ id, properties: props });
}
const seen=new Map(); for(const u of updates) seen.set(u.id,u); const out=[...seen.values()];
console.log(JSON.stringify({ files: files.length, counts, toWrite: out.length }, null, 1));
if (!APPLY) { console.log('DRY RUN — re-run with `apply`'); process.exit(0); }
let ok=0;
for (let i=0;i<out.length;i+=100){
  const r=await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update',{method:'POST',headers:H,body:JSON.stringify({inputs:out.slice(i,i+100)})});
  if(r.ok) ok+=out.slice(i,i+100).length; else console.error('fail',r.status,(await r.text()).slice(0,150));
  await new Promise(r=>setTimeout(r,300));
}
console.log('applied:',ok);
