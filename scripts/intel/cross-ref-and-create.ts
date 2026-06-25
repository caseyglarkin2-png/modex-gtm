/**
 * Cross-reference clawd's domain-enriched net-new candidates against the
 * canonical HubSpot company universe, then:
 *   - domain ALREADY in HubSpot  -> stamp the score set on the existing record
 *   - domain NOT in HubSpot       -> create one canonical company (name+domain+scores)
 *   - excluded (our own footprint / no domain) -> skip
 *
 *   npx tsx scripts/intel/cross-ref-and-create.ts --dry-run   # report split, no writes
 *   npx tsx scripts/intel/cross-ref-and-create.ts             # stamp existing + create net-new
 *
 * Input: Downloads/net-new-candidates-domains-filled.csv (clawd-filled).
 * HARD EXCLUDE: Nestlé Waters / BlueTriton / Primo = our reference customer's
 * own footprint, never a prospect (clawd flagged these).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const round = (n: number, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;
const TOKEN = (readFileSync(path.join(ROOT, '.env.local'), 'utf8').match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { process.stderr.write('no HUBSPOT_ACCESS_TOKEN\n'); process.exit(1); }

const CSV = path.join(ROOT, '..', 'Downloads', 'net-new-candidates-domains-filled.csv');
const PROX_DECAY_MI = 30;
const proximityScore = (mi: number) => Math.round(Math.exp(-Math.max(0, mi) / PROX_DECAY_MI) * 100);

// our own reference-customer footprint — never a prospect
const OWN = /nestl[eé]\s*water|blue\s*triton|bluetriton|\bprimo\b/i;

// company-name normalization (to catch dups whose resolved domain is off, e.g.
// "The Campbell Soup Company" -> snyderslance.com but Campbell is already in HS)
const FACILITY = /\b(distribution center|distribution|dc|warehouse|whse|fulfillment|fulfilment|fc|plant|facility|facilities|brewery|cidery|mill|terminal|drop box|dropbox|smartpost|ship center|shipping|freight|logistics center|logistics|campus|cold storage|bottling|cannery|factory|complex|annex|depot|processing|export|import)\b/g;
const LEGAL = /\b(inc|llc|corp|corporation|co|company|companies|soup|ltd|limited|holdings|holding|group|usa|us|na|north america|americas|international|intl|global|worldwide|services|svcs|solutions)\b/g;
function companyKey(name: string): string {
  let s = (name || '').toLowerCase();
  s = s.replace(/\s[-–—].*$/, '').replace(/,.*$/, '').replace(/\(.*?\)/g, ' ');
  s = s.replace(FACILITY, ' ').replace(LEGAL, ' ');
  s = s.replace(/[^a-z0-9& ]+/g, ' ').replace(/\b\d+\b/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/\ss$/, ''); // trailing possessive: "campbell s" -> "campbell"
  return s;
}
const GENERIC = new Set(['', 'the', 'us', 'general', 'national', 'american', 'united', 'standard', 'global', 'pacific', 'central', 'first', 'midwest', 'metropolitan', 'empire', 'progressive']);
const isSafeKey = (k: string) => k.length >= 4 && !GENERIC.has(k) && k.split(' ').length <= 4;

// minimal RFC-4180 CSV parser (handles quoted fields w/ commas + escaped quotes)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c === '\r') { /* skip */ }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const rows = parseCsv(readFileSync(CSV, 'utf8'));
const header = rows[0].map((h) => h.trim());
const col = (name: string) => header.indexOf(name);
const ci = { name: col('prospect_name'), domain: col('domain'), comp: col('composite'), tier: col('tier'), city: col('city_state'), nearest: col('nearest_primo_site'), mi: col('nearest_mi'), notes: col('notes') };

interface Cand { name: string; domain: string; comp: number; tier: string; city: string; nearest: string; mi: number }
const byDomain = new Map<string, Cand>();
let excludedOwn = 0, noDomain = 0;
for (const r of rows.slice(1)) {
  if (!r.length || !r[ci.name]) continue;
  const name = (r[ci.name] || '').trim();
  const domain = (r[ci.domain] || '').trim().toLowerCase();
  const notes = (r[ci.notes] || '').trim();
  if (OWN.test(name) || OWN.test(notes)) { excludedOwn += 1; continue; }
  if (!domain) { noDomain += 1; continue; }
  const comp = Number(r[ci.comp]) || 0;
  const cand: Cand = { name, domain, comp, tier: r[ci.tier] || '', city: (r[ci.city] || '').trim(), nearest: (r[ci.nearest] || '').trim(), mi: Number(r[ci.mi]) || 0 };
  const prev = byDomain.get(domain);
  if (!prev || cand.comp > prev.comp) byDomain.set(domain, cand);
}

// HubSpot canonical index
interface HsCo { id: string; name: string; domain: string }
const hs = JSON.parse(readFileSync(path.join(ROOT, 'output', 'intel', 'hubspot-companies.json'), 'utf8')) as { companies: HsCo[] };
const hsByDomain = new Map<string, HsCo>();
const hsByKey = new Map<string, HsCo>();
for (const c of hs.companies) {
  if (c.domain) hsByDomain.set(c.domain.toLowerCase(), c);
  const k = companyKey(c.name);
  if (c.domain && k && isSafeKey(k) && !hsByKey.has(k)) hsByKey.set(k, c);
}

const existing: Array<{ cand: Cand; co: HsCo }> = [];
const netNew: Cand[] = [];
const heldDup: Array<{ cand: Cand; co: HsCo }> = [];
for (const cand of byDomain.values()) {
  const co = hsByDomain.get(cand.domain);
  if (co) { existing.push({ cand, co }); continue; }
  // domain not in HubSpot — but does the NAME already match a HubSpot company?
  // (catches mis-resolved domains that would otherwise create a dup record)
  const k = companyKey(cand.name);
  const nameMatch = isSafeKey(k) ? hsByKey.get(k) : undefined;
  if (nameMatch) heldDup.push({ cand, co: nameMatch });
  else netNew.push(cand);
}

function scoreProps(c: Cand): Record<string, string> {
  return {
    yardflow_composite_score: String(round(c.comp, 2)),
    yardflow_proximity_score: String(proximityScore(c.mi)),
    yardflow_nearest_primo_mi: String(round(c.mi, 1)),
    yardflow_nearest_primo_site: c.nearest,
    yardflow_score_at: new Date().toISOString().slice(0, 10),
  };
}
const cityState = (c: Cand) => { const m = /^(.*?),\s*([A-Z]{2})$/.exec(c.city); return m ? { city: m[1], state: m[2] } : {}; };

process.stderr.write(`\ncandidates with domain: ${byDomain.size}  (excluded own-footprint: ${excludedOwn}, no-domain held/blank: ${noDomain})\n`);
process.stderr.write(`-> ALREADY in HubSpot by domain (stamp): ${existing.length}\n`);
process.stderr.write(`-> name matches an existing record despite a different domain (HOLD, likely dup): ${heldDup.length}\n`);
process.stderr.write(`-> genuine NET-NEW (create): ${netNew.length}\n\n`);
process.stderr.write(`HELD as likely dup (mis-resolved domain, NOT created):\n`);
for (const h of heldDup.sort((a, b) => b.cand.comp - a.cand.comp)) process.stderr.write(`  ${h.cand.name} [${h.cand.domain}]  ~=  existing "${h.co.name}" [${h.co.domain}]\n`);
process.stderr.write(`\nnet-new to create (${netNew.length}):\n`);
for (const n of netNew.sort((a, b) => b.comp - a.comp)) process.stderr.write(`  ${round(n.comp, 1)} [${n.tier}] ${n.name} [${n.domain}] ${n.city}\n`);

if (dryRun) { console.log(`\n=== DRY RUN: ${existing.length} stamp, ${netNew.length} create, ${heldDup.length} held-dup, ${excludedOwn} own-footprint excluded (no writes) ===`); process.exit(0); }

const doCreate = process.argv.includes('--create');
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
import { writeFileSync } from 'node:fs';
async function run() {
  // 1) stamp existing (batch update) — always safe (domain matched a real record)
  let stamped = 0;
  const upd = existing.map((e) => ({ id: e.co.id, properties: scoreProps(e.cand) }));
  for (let i = 0; i < upd.length; i += 100) {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', {
      method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: upd.slice(i, i + 100) }),
    });
    if (res.ok) stamped += upd.slice(i, i + 100).length;
    else process.stderr.write(`stamp batch failed ${res.status}: ${(await res.text()).slice(0, 140)}\n`);
    await sleep(200);
  }

  // 2) net-new: export a review list by default; only create with --create.
  const esc = (s: string) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const reviewCsv = `name,domain,composite,tier,city_state,nearest_primo_site,nearest_mi\n` +
    netNew.sort((a, b) => b.comp - a.comp).map((c) => [esc(c.name), c.domain, round(c.comp, 2), c.tier, esc(c.city), esc(c.nearest), round(c.mi, 1)].join(',')).join('\n') + '\n';
  const rp1 = path.join(ROOT, 'output', 'intel', 'net-new-to-create-review.csv');
  writeFileSync(rp1, reviewCsv);
  try { writeFileSync(path.join(ROOT, '..', 'Downloads', 'net-new-to-create-review.csv'), reviewCsv); } catch { /* dl */ }

  let created = 0;
  if (doCreate) {
    const cre = netNew.map((c) => ({ properties: { name: c.name, domain: c.domain, ...cityState(c), ...scoreProps(c) } }));
    for (let i = 0; i < cre.length; i += 100) {
      const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/create', {
        method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: cre.slice(i, i + 100) }),
      });
      if (res.ok) created += cre.slice(i, i + 100).length;
      else process.stderr.write(`create batch failed ${res.status}: ${(await res.text()).slice(0, 200)}\n`);
      await sleep(250);
    }
  }
  console.log(`\n=== DONE: stamped ${stamped} existing${doCreate ? `, created ${created} net-new` : `; ${netNew.length} net-new exported for review (run with --create to create)`} (${excludedOwn} own-footprint excluded) ===`);
}
run();
