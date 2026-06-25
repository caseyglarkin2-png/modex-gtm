/**
 * The full deduped ACCOUNT list (every unique company from the scan, collapsed
 * by name), with cross-reference keys filled in wherever we know them: resolved
 * domain + HubSpot company id + already-in-HubSpot flag. This is the master
 * account list clawd maps from — it does the authoritative canonical resolution,
 * this gives it the deduped universe + the keys we already have.
 *
 *   npx tsx scripts/intel/gen-deduped-accounts.ts
 * Output: output/intel/account-research-package/deduped-accounts.csv
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { rankWorklist, DEFAULT_WEIGHTS } from '@/lib/discovery/scoring';
import type { RankedRow } from '@/lib/discovery/scoring';

const ROOT = process.cwd();
const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

const FACILITY = /\b(distribution center|distribution|dc|warehouse|whse|fulfillment|fulfilment|fc|plant|facility|facilities|brewery|cidery|mill|terminal|drop box|dropbox|smartpost|ship center|shipping|freight|logistics center|logistics|campus|cold storage|bottling|cannery|factory|complex|annex|depot|processing|export|import)\b/g;
const LEGAL = /\b(inc|llc|corp|corporation|co|company|companies|soup|ltd|limited|holdings|holding|group|usa|us|na|north america|americas|international|intl|global|worldwide|services|svcs|solutions)\b/g;
function companyKey(name: string): string {
  let s = (name || '').toLowerCase().replace(/\s[-–—].*$/, '').replace(/,.*$/, '').replace(/\(.*?\)/g, ' ');
  s = s.replace(FACILITY, ' ').replace(LEGAL, ' ').replace(/[^a-z0-9& ]+/g, ' ').replace(/\b\d+\b/g, ' ').replace(/\s+/g, ' ').trim().replace(/\ss$/, '');
  return s;
}
const isSafe = (k: string) => k.length >= 4 && k.split(' ').length <= 5;

// HubSpot canonical index
interface HsCo { id: string; name: string; domain: string }
const hs = JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'intel', 'hubspot-companies.json'), 'utf8')) as { companies: HsCo[] };
const hsByDomain = new Map<string, HsCo>(), hsByKey = new Map<string, HsCo>();
for (const c of hs.companies) {
  if (c.domain) hsByDomain.set(c.domain.toLowerCase(), c);
  const k = companyKey(c.name);
  if (c.domain && k && isSafe(k) && !hsByKey.has(k)) hsByKey.set(k, c);
}

// known account domains + clawd-enriched domains (best available)
const knownDomain = new Map<string, string>();
try {
  const prox = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'lib', 'intel', 'export', 'proximity-data.json'), 'utf8')) as { accounts: Array<{ slug: string; account_domain: string | null }> };
  for (const a of prox.accounts) if (a.account_domain) knownDomain.set(a.slug, a.account_domain);
} catch { /* */ }
const enrichedDomain = new Map<string, string>();
try {
  const csv = fs.readFileSync(path.join(ROOT, '..', 'Downloads', 'net-new-candidates-domains-filled.csv'), 'utf8').split(/\r?\n/);
  for (const line of csv.slice(1)) {
    const m = line.match(/^("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),/);
    if (!m) continue;
    const name = m[1].replace(/^"|"$/g, '').replace(/""/g, '"');
    const dom = m[2].replace(/^"|"$/g, '').trim().toLowerCase();
    if (name && dom) enrichedDomain.set(companyKey(name), dom);
  }
} catch { /* */ }

const ranked = rankWorklist(buildCuratedRows(loadLatestScored()!), DEFAULT_WEIGHTS);
const groups = new Map<string, RankedRow[]>();
for (const r of ranked) {
  const k = companyKey(r.name) || r.name.toLowerCase();
  (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
}

const TR: Record<string, number> = { A: 3, B: 2, C: 1, D: 0 };
const rows = [...groups.entries()].map(([key, rs]) => {
  const best = rs.reduce((a, b) => (b.worklistScore > a.worklistScore ? b : a));
  const slug = best.micrositeSlug ?? best.existingAccountSlug;
  // resolve domain: known account -> clawd-enriched -> HubSpot name match
  let domain = (slug && knownDomain.get(slug)) || enrichedDomain.get(key) || (isSafe(key) ? hsByKey.get(key)?.domain : undefined) || '';
  domain = (domain || '').toLowerCase();
  const hsCo = (domain && hsByDomain.get(domain)) || (isSafe(key) ? hsByKey.get(key) : undefined);
  return {
    company: rs.map((r) => r.name).sort((a, b) => a.length - b.length)[0],
    domain,
    hubspot_company_id: hsCo?.id ?? '',
    in_hubspot: hsCo ? 'yes' : 'no',
    composite: round(best.worklistScore),
    tier: [...new Set(rs.map((r) => r.tier))].sort((a, b) => TR[b] - TR[a])[0],
    sites: rs.length,
    city_state: best.cityState,
    nearest_primo: best.nearestPrimoName,
  };
}).sort((a, b) => b.composite - a.composite);

const esc = (s: string) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
const hdr = 'company,domain,hubspot_company_id,in_hubspot,composite,tier,sites,city_state,nearest_primo';
const csv = [hdr, ...rows.map((r) => [esc(r.company), r.domain, r.hubspot_company_id, r.in_hubspot, r.composite, r.tier, r.sites, esc(r.city_state), esc(r.nearest_primo)].join(','))].join('\n') + '\n';
const out = path.join(ROOT, 'output', 'intel', 'account-research-package', 'deduped-accounts.csv');
fs.writeFileSync(out, csv);
try { fs.writeFileSync(path.join(ROOT, '..', 'Downloads', 'deduped-accounts.csv'), csv); } catch { /* */ }

const withDomain = rows.filter((r) => r.domain).length;
const inHs = rows.filter((r) => r.in_hubspot === 'yes').length;
console.log(`deduped accounts: ${rows.length}  (with domain: ${withDomain}, already in HubSpot: ${inHs}, net of those: ${rows.length - inHs})`);
console.log(`  -> ${path.relative(ROOT, out)} (+ Downloads)`);
