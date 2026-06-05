/**
 * Build a TARGET-ACCOUNTS list (company level, not contacts): near-reference
 * facilities deduped to one row per company, with the proximity hook, for a
 * downstream agent to source the right contacts (Apollo / HubSpot / browser).
 *
 * No Persona-table contact matching here — that is the noisy part. We only emit
 * the account + facility + nearest live YardFlow site + distance.
 *
 *   npx tsx scripts/discovery/build-target-accounts.ts [--max 120] [--max-mi 50]
 */
import fs from 'fs';
import path from 'path';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { rankWorklist, DEFAULT_WEIGHTS } from '@/lib/discovery/scoring';
import { REFERENCE_SITES } from '@/lib/discovery/reference-sites';

function flag(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const MAX = Number(flag('max', '120'));
const MAX_MI = Number(flag('max-mi', '50'));

const GENERIC = new Set(['the', 'and', 'inc', 'llc', 'corp', 'company', 'co', 'group', 'logistics', 'distribution', 'warehouse', 'transport', 'transportation', 'services', 'supply', 'chain', 'foods', 'food', 'north', 'america', 'us', 'usa', 'international']);
const companyKey = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const brandToken = (s: string) => companyKey(s).split(' ').find((w) => w.length >= 3 && !GENERIC.has(w)) ?? null;

const STOREFRONT_RE = /drop ?box|\bstore\b|kiosk|locker|kinko|onsite|on-site|service ?point|access ?point|print|retail|ship ?center|office\b|notary|mailbox/i;
// Not enterprise yard targets — churches, schools, govt, charities, parcel/3PL storefronts.
const NONTARGET_RE = /church|nazarene|assumption|parish|ministry|diocese|college|university|\bschool\b|academy|\bva\b|veterans|county|city of|department of|govern|food bank|relief|charit|hospital|clinic|medical cent|fire dept|sheriff|library|amazon|fedex|\bups\b|usps|self storage|public storage/i;

function nearestLiveSite(name: string): string {
  const s = REFERENCE_SITES.find((r) => r.name === name);
  return s ? `${s.city}, ${s.state}` : '';
}
const csvCell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

/** Brand tokens already covered by a prior send-queue wave (exclude them). */
function priorWaveTokens(dir: string): Set<string> {
  const out = new Set<string>();
  let files: string[] = [];
  try { files = fs.readdirSync(dir).filter((f) => /^send-queue.*\.csv$/.test(f)); } catch { /* none */ }
  for (const f of files) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
    const head = (lines[0] ?? '').split(',').map((h) => h.replace(/"/g, '').trim().toLowerCase());
    const ci = head.indexOf('company');
    // Quick scan: company is the 4th column; pull it from each record's first line.
    for (const l of lines.slice(1)) {
      const m = l.match(/^("(?:[^"]|"")*"),("(?:[^"]|"")*"),("(?:[^"]|"")*"),("(?:[^"]|"")*")/);
      if (m && ci >= 0) {
        const co = m[ci + 1]?.replace(/^"|"$/g, '').replace(/""/g, '"') ?? '';
        const tok = brandToken(co);
        if (tok) out.add(tok);
      }
    }
  }
  return out;
}

function main() {
  const output = loadLatestScored();
  if (!output) throw new Error('no scored discovery data');
  const ranked = rankWorklist(buildCuratedRows(output), DEFAULT_WEIGHTS);
  const near = ranked.filter((r) => r.nearestPrimoDistance <= MAX_MI);

  const dir = 'output/prospect-discovery';
  const excludeTok = priorWaveTokens(dir);
  const seen = new Set<string>(excludeTok);
  const rows: typeof near = [];
  for (const r of near) {
    if (rows.length >= MAX) break;
    if (r.confidence === 'low' || STOREFRONT_RE.test(r.name) || NONTARGET_RE.test(r.name)) continue;
    const tok = brandToken(r.name);
    if (!tok || seen.has(tok)) continue;
    seen.add(tok);
    rows.push(r);
  }

  const csv = [['company_or_facility', 'facility_city_state', 'segment', 'icp_tier', 'icp_score', 'distance_mi', 'nearest_live_site', 'corridor'].join(',')];
  for (const r of rows) {
    csv.push([
      csvCell(r.name), csvCell(r.cityState), csvCell(r.segment), csvCell(r.tier),
      String(r.icpScore), r.nearestPrimoDistance.toFixed(1), csvCell(nearestLiveSite(r.nearestPrimoName)), csvCell(r.corridor),
    ].join(','));
  }
  const out = path.join(dir, 'target-accounts-near-reference-2026-06-05.csv');
  fs.writeFileSync(out, csv.join('\n'));
  console.log(`target accounts written: ${rows.length} (excluded ${excludeTok.size} prior-wave company tokens)`);
  console.log(`  CSV: ${out}`);
  for (const r of rows) console.log(`  ${r.nearestPrimoDistance.toFixed(1).padStart(4)}mi  ${r.name.slice(0, 46).padEnd(46)} ${r.cityState}`);
}
main();
