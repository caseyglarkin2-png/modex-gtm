/**
 * Standardize our scored prospects to HubSpot's company architecture: match every
 * curated SITE to its canonical HubSpot company (domain first, then clean name),
 * collapse site-level dups up to that one record (no 50 Amazons), aggregate the
 * best composite per company, and stamp the 14 yardflow_* score properties.
 *
 *   npx tsx scripts/intel/canonicalize-stamp.ts --dry-run   # match report, no writes
 *   npx tsx scripts/intel/canonicalize-stamp.ts             # live batch stamp
 *
 * Confidence: domain match = high; clean-name exact match to a canonical HubSpot
 * company = medium. Generic/short keys are skipped. Existing companies only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { rankWorklist, DEFAULT_WEIGHTS, fitComponent, proximityComponent } from '@/lib/discovery/scoring';
import type { RankedRow } from '@/lib/discovery/scoring';

const ROOT = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const round = (n: number, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;
const TOKEN = (readFileSync(path.join(ROOT, '.env.local'), 'utf8').match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) { process.stderr.write('no HUBSPOT_ACCESS_TOKEN\n'); process.exit(1); }

// ── company-name normalization (same key for sites + HubSpot names) ──────────
const FACILITY = /\b(distribution center|distribution|dc|warehouse|whse|fulfillment|fulfilment|fc|plant|facility|facilities|brewery|cidery|mill|terminal|drop box|dropbox|smartpost|smart post|ship center|shipping|freight|logistics center|logistics|campus|cold storage|bottling|cannery|factory|complex|annex|depot)\b/g;
const LEGAL = /\b(inc|llc|corp|corporation|co|company|companies|ltd|limited|holdings|holding|group|usa|us|na|north america|americas|international|intl|global|worldwide|services|svcs)\b/g;
function companyKey(name: string): string {
  let s = (name || '').toLowerCase();
  s = s.replace(/\s[-–—].*$/, '').replace(/,.*$/, '').replace(/\(.*?\)/g, ' ');
  s = s.replace(FACILITY, ' ').replace(LEGAL, ' ');
  s = s.replace(/[^a-z0-9& ]+/g, ' ').replace(/\b\d+\b/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}
// Keys too generic to match safely on name alone.
const GENERIC = new Set(['', 'the', 'us', 'amazon web', 'general', 'national', 'american', 'united', 'standard', 'global', 'pacific', 'central', 'first', 'midwest']);
const isSafeKey = (k: string) => k.length >= 4 && !GENERIC.has(k) && k.split(' ').length <= 5;

// ── HubSpot canonical index ──────────────────────────────────────────────────
interface HsCo { id: string; name: string; domain: string; tam: string }
const hs = JSON.parse(readFileSync(path.join(ROOT, 'output', 'intel', 'hubspot-companies.json'), 'utf8')) as { companies: HsCo[] };
const byDomain = new Map<string, HsCo>();
const byKey = new Map<string, HsCo[]>();
for (const c of hs.companies) {
  if (c.domain && !byDomain.has(c.domain)) byDomain.set(c.domain, c);
  const k = companyKey(c.name);
  if (!k) continue;
  const arr = byKey.get(k) ?? [];
  arr.push(c);
  byKey.set(k, arr);
}
// Canonical pick when a name-key maps to several HubSpot companies: TAM=in, then
// has-domain, then shortest name.
function canonical(cands: HsCo[]): HsCo {
  return [...cands].sort((a, b) =>
    (Number(b.tam === 'in') - Number(a.tam === 'in')) ||
    (Number(!!b.domain) - Number(!!a.domain)) ||
    (a.name.length - b.name.length))[0];
}

// Known account domains (the audited/microsite set) — high-confidence by domain.
const proxData = JSON.parse(readFileSync(path.join(ROOT, 'src', 'lib', 'intel', 'export', 'proximity-data.json'), 'utf8')) as {
  generatedAt: string;
  accounts: Array<{ slug: string; account_domain: string | null; yard_audit: Record<string, unknown> | null; dossier_url: string | null }>;
};
const slugDomain = new Map<string, string>();
const slugYard = new Map<string, { yard: Record<string, unknown> | null; dossier: string | null }>();
for (const a of proxData.accounts) {
  if (a.account_domain) slugDomain.set(a.slug, a.account_domain);
  slugYard.set(a.slug, { yard: a.yard_audit, dossier: a.dossier_url });
}

// ── match + aggregate ────────────────────────────────────────────────────────
const output = loadLatestScored();
if (!output) throw new Error('no scored set');
const ranked = rankWorklist(buildCuratedRows(output), DEFAULT_WEIGHTS);

interface Match { co: HsCo; best: RankedRow; composite: number; sites: number; via: 'domain' | 'name'; slug?: string }
const byCompany = new Map<string, Match>();
const unmatchedRows: RankedRow[] = [];
let unmatched = 0, ambiguous = 0, skippedGeneric = 0;
for (const r of ranked) {
  const slug = r.micrositeSlug ?? r.existingAccountSlug;
  let co: HsCo | undefined;
  let via: 'domain' | 'name' = 'name';
  const dom = slug ? slugDomain.get(slug) : undefined;
  if (dom && byDomain.has(dom)) { co = byDomain.get(dom); via = 'domain'; }
  if (!co) {
    const k = companyKey(r.name);
    if (!isSafeKey(k)) { skippedGeneric += 1; continue; }
    // Match ONLY to domain-bearing canonical records (skip HubSpot's own
    // site-level dup junk, which has no domain). Exact key first, then a
    // brand-prefix fallback so "pepsico mt creek" collapses to "pepsico".
    const domained = (key: string) => (byKey.get(key) ?? []).filter((c) => c.domain);
    let cands = domained(k);
    if (!cands.length) {
      const toks = k.split(' ');
      for (let n = Math.min(toks.length, 3); n >= 1 && !cands.length; n--) {
        const prefix = toks.slice(0, n).join(' ');
        if (!isSafeKey(prefix)) continue;
        cands = domained(prefix);
      }
    }
    if (cands.length) { if (cands.length > 1) ambiguous += 1; co = canonical(cands); via = 'name'; }
  }
  if (!co) { unmatched += 1; unmatchedRows.push(r); continue; }
  const prev = byCompany.get(co.id);
  if (!prev) byCompany.set(co.id, { co, best: r, composite: r.worklistScore, sites: 1, via, slug });
  else { prev.sites += 1; if (r.worklistScore > prev.composite) { prev.best = r; prev.composite = r.worklistScore; prev.via = via; prev.slug = slug; } }
}

const matches = [...byCompany.values()].sort((a, b) => b.composite - a.composite);
process.stderr.write(`\nscored sites: ${ranked.length}\n`);
process.stderr.write(`matched to ${matches.length} canonical HubSpot companies (${matches.filter((m) => m.via === 'domain').length} by domain, ${matches.filter((m) => m.via === 'name').length} by name)\n`);
process.stderr.write(`unmatched sites: ${unmatched} · skipped generic: ${skippedGeneric} · ambiguous-name (took canonical): ${ambiguous}\n`);
const amazon = matches.find((m) => /amazon/i.test(m.co.name));
if (amazon) process.stderr.write(`Amazon collapse: ${amazon.sites} sites -> "${amazon.co.name}" (${amazon.co.domain}) composite ${round(amazon.composite, 2)}\n`);
process.stderr.write('\ntop 12 canonical matches:\n');
for (const m of matches.slice(0, 12)) process.stderr.write(`  ${round(m.composite, 2)}  ${m.co.name}  [${m.co.domain || 'no-domain'}]  ${m.sites} sites  via ${m.via}\n`);

function props(m: Match): Record<string, string> {
  const r = m.best;
  const p: Record<string, string> = {
    yardflow_composite_score: String(round(m.composite, 2)),
    yardflow_proximity_score: String(Math.round(proximityComponent(r.nearestPrimoDistance) * 100)),
    yardflow_fit_score: String(round(fitComponent(r) * 100, 1)),
    yardflow_corridor_density: String(r.corridorDensity),
    yardflow_nearest_primo_mi: String(round(r.nearestPrimoDistance, 1)),
    yardflow_nearest_primo_site: r.nearestPrimoName,
    yardflow_score_at: proxData.generatedAt,
  };
  const yd = m.slug ? slugYard.get(m.slug) : undefined;
  if (yd?.dossier) p.yardflow_dossier_url = yd.dossier;
  const y = yd?.yard as Record<string, number | string | null> | null | undefined;
  if (y) {
    if (y.facilities != null) p.yardflow_yard_facilities = String(y.facilities);
    if (y.truck_gated_pct != null) p.yardflow_yard_gated_pct = String(y.truck_gated_pct);
    if (y.dock_doors != null) p.yardflow_yard_dock_doors = String(y.dock_doors);
    if (y.trailer_cap != null) p.yardflow_yard_trailer_cap = String(y.trailer_cap);
    if (y.top_archetype) p.yardflow_yard_archetype = String(y.top_archetype);
    if (y.recommended_entry) p.yardflow_yard_entry = String(y.recommended_entry);
  }
  return p;
}

if (dryRun) {
  // Characterize the unmatched (the "is it really net-new?" question). Roll up
  // to unique company-keys so we count companies, not sites.
  const uKey = new Map<string, { tier: string; conf: string; seg: string; comp: number; sites: number; name: string; city: string; nearest: string; mi: number }>();
  for (const r of unmatchedRows) {
    const k = companyKey(r.name) || r.name.toLowerCase();
    const prev = uKey.get(k);
    if (!prev || r.worklistScore > prev.comp) {
      uKey.set(k, { tier: r.tier, conf: r.confidence, seg: r.segment, comp: r.worklistScore, sites: (prev?.sites ?? 0) + 1, name: r.name, city: r.cityState, nearest: r.nearestPrimoName, mi: r.nearestPrimoDistance });
    } else { prev.sites += 1; }
  }
  const u = [...uKey.values()];
  const tier: Record<string, number> = {}, conf: Record<string, number> = {}, seg: Record<string, number> = {};
  for (const c of u) { tier[c.tier] = (tier[c.tier] ?? 0) + 1; conf[c.conf] = (conf[c.conf] ?? 0) + 1; seg[c.seg] = (seg[c.seg] ?? 0) + 1; }
  const qualified = u.filter((c) => c.conf !== 'low' && (c.tier === 'A' || c.tier === 'B'));
  process.stderr.write(`\n── UNMATCHED analysis (${unmatchedRows.length} sites -> ${u.length} unique companies) ──\n`);
  process.stderr.write(`by tier: ${JSON.stringify(tier)}\n`);
  process.stderr.write(`by confidence: ${JSON.stringify(conf)}\n`);
  process.stderr.write(`by segment: ${JSON.stringify(seg)}\n`);
  process.stderr.write(`QUALIFIED candidates (conf!=low AND tier A/B): ${qualified.length}\n`);
  process.stderr.write(`sample qualified:\n`);
  for (const c of qualified.sort((a, b) => b.comp - a.comp).slice(0, 12)) process.stderr.write(`  ${round(c.comp, 1)} [${c.tier}/${c.conf}/${c.seg}] ${c.name}\n`);

  // Write the hand-off CSV for clawd to resolve domains -> modex cross-references.
  const esc = (s: string) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const sorted = qualified.sort((a, b) => b.comp - a.comp);
  const header = 'prospect_name,domain,composite,tier,confidence,segment,sites,city_state,nearest_primo_site,nearest_mi,already_in_hubspot,notes';
  const lines = sorted.map((c) =>
    [esc(c.name), '', round(c.comp, 2), c.tier, c.conf, c.seg, c.sites, esc(c.city), esc(c.nearest), round(c.mi, 1), '', ''].join(','),
  );
  const csv = `${header}\n${lines.join('\n')}\n`;
  const out1 = path.join(ROOT, 'output', 'intel', 'net-new-candidates-for-enrichment.csv');
  const out2 = path.join(ROOT, '..', 'Downloads', 'net-new-candidates-for-enrichment.csv');
  fs.writeFileSync(out1, csv);
  try { fs.writeFileSync(out2, csv); } catch { /* downloads */ }
  process.stderr.write(`\nwrote ${sorted.length} candidates -> output/intel/net-new-candidates-for-enrichment.csv (+ Downloads)\n`);
  console.log(`\n=== DRY RUN: would stamp ${matches.length} canonical companies; ${qualified.length} qualified unmatched candidates exported (no writes) ===`);
  process.exit(0);
}

// ── live: batch update (100/batch) ───────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
async function stamp() {
  const inputs = matches.map((m) => ({ id: m.co.id, properties: props(m) }));
  let updated = 0, failed = 0;
  for (let i = 0; i < inputs.length; i += 100) {
    const batch = inputs.slice(i, i + 100);
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: batch }),
    });
    if (res.ok) { updated += batch.length; process.stderr.write(`  batch ${i / 100 + 1}: +${batch.length} (${updated} total)\n`); }
    else if (res.status === 429) { await sleep(2000); i -= 100; }
    else { failed += batch.length; process.stderr.write(`  batch ${i / 100 + 1} FAILED ${res.status}: ${(await res.text()).slice(0, 160)}\n`); }
    await sleep(200);
  }
  console.log(`\n=== STAMP complete: ${updated} canonical companies stamped, ${failed} failed ===`);
}
stamp();
