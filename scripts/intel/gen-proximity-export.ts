/**
 * Generate the committed proximity-export snapshot for clawd's sixth ingest
 * stream (GET /api/intel/export/proximity). Run at author time whenever the
 * yard-audit set or the scored prospect set changes:
 *
 *   npx tsx scripts/intel/gen-proximity-export.ts
 *
 * Why precompute + commit: runtime fs reads of output/** are NOT reliably
 * shipped into the Vercel serverless bundle (see src/lib/discovery/data.ts),
 * and the full scored set is gitignored. So the endpoint statically imports the
 * committed JSON this builds. Proximity is standing state: a recompute bumps
 * `generatedAt`, which becomes a new ledger row per the contract.
 *
 * Per named account (the audited set UNION the scored-set accounts):
 *  - composite_score: the COMPLETE discovery score (proximity 0.55 + fit 0.30 +
 *    density 0.15, scaled 0-100), the number clawd fuses into the homescreen,
 *    computed from the account's scored sites. null when the account has no
 *    scored rows (clawd falls back to proximity_score).
 *  - proximity_score / fit_score / corridor_density: the component breakdown.
 *  - nearest_distance_mi: min distance to a live reference site.
 *  - yard_audit: the master-index row + archetype label + recommended_entry
 *    (audited accounts only; null otherwise).
 *  - dossier_url: the account's live /for page (audited accounts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { REFERENCE_SITES } from '../../src/lib/discovery/reference-sites';

const ROOT = process.cwd();
const YA = path.join(ROOT, 'output', 'yard-audits');
const INDEX = path.join(YA, 'YardFlow-Master-Index.csv');
const ARCHKEY = path.join(ROOT, 'scripts', 'yard-audit', 'archetype-key.json');
const PD = path.join(ROOT, 'output', 'prospect-discovery');
const OUT = path.join(ROOT, 'src', 'lib', 'intel', 'export', 'proximity-data.json');

// Discovery composite weights — mirrored from src/lib/discovery/scoring.ts
// (WEIGHT_PRESETS['proximity-led']) + proximityComponent (exp decay, 30mi).
const WEIGHTS = { proximity: 0.55, fit: 0.3, density: 0.15 };
const PROX_DECAY_MI = 30;
const proximityComponent = (mi: number) => Math.exp(-Math.max(0, mi) / PROX_DECAY_MI);
const densityComponent = (raw: number) => Math.min(1, Math.max(0, raw) / 5);

function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Curated account-domain map (clawd resolves by domain, name-fallback otherwise).
const DOMAINS: Record<string, string> = {
  'ab-inbev': 'anheuser-busch.com',
  amazon: 'amazon.com',
  'barnes-noble': 'barnesandnoble.com',
  'bob-evans-farms': 'bobevans.com',
  'boston-beer-company': 'bostonbeer.com',
  campbells: 'campbells.com',
  caterpillar: 'caterpillar.com',
  'cj-logistics-america': 'cjlogisticsamerica.com',
  'coca-cola': 'coca-colacompany.com',
  'constellation-brands': 'cbrands.com',
  'cost-plus-world-market': 'worldmarket.com',
  costco: 'costco.com',
  crowley: 'crowley.com',
  'daimler-truck-north-america': 'daimlertruck.com',
  dannon: 'dannon.com',
  'dhl-supply-chain': 'dhl.com',
  diageo: 'diageo.com',
  fedex: 'fedex.com',
  ford: 'ford.com',
  'frito-lay': 'fritolay.com',
  'general-mills': 'generalmills.com',
  'georgia-pacific': 'gp.com',
  gxo: 'gxo.com',
  'h-e-b': 'heb.com',
  'harris-teeter': 'harristeeter.com',
  honda: 'honda.com',
  'hormel-foods': 'hormelfoods.com',
  'hyundai-motor-america': 'hyundaiusa.com',
  'jm-smucker': 'jmsmucker.com',
  'john-deere': 'deere.com',
  'kenco-logistics': 'kencogroup.com',
  'keurig-dr-pepper': 'keurigdrpepper.com',
  'kimberly-clark': 'kimberly-clark.com',
  'kraft-heinz': 'kraftheinzcompany.com',
  kroger: 'kroger.com',
  mondelez: 'mondelezinternational.com',
  'nestle-usa': 'nestleusa.com',
  'niagara-bottling': 'niagarawater.com',
  'pactiv-evergreen': 'pactivevergreen.com',
  'performance-food-group': 'pfgc.com',
  publix: 'publix.com',
  'sams-club': 'samsclub.com',
  'salson-logistics': 'salson.com',
  'sc-johnson': 'scjohnson.com',
  target: 'target.com',
  'the-home-depot': 'homedepot.com',
  toyota: 'toyota.com',
  unfi: 'unfi.com',
  'universal-logistics': 'universallogistics.com',
  walmart: 'walmart.com',
  'westrock-coffee': 'westrockcoffee.com',
};

// Master-index slug -> microsite-registry slug, where they differ (for /for URL).
const REGISTRY_ALIAS: Record<string, string> = {
  campbells: 'campbell-s',
  'kenco-logistics': 'kenco-logistics-services',
  'universal-logistics': 'universal-logistics-holdings',
};

const archKey = JSON.parse(fs.readFileSync(ARCHKEY, 'utf8')) as {
  archetypes: Array<{ id: string; name: string }>;
};
const ARCH: Record<string, string> = {};
for (const a of archKey.archetypes) ARCH[a.id] = a.name;
function archetypeLabel(raw: string): string | null {
  const id = (raw || '').trim().split(/\s+/)[0];
  if (!id) return null;
  const name = ARCH[id];
  return name ? `${id} (${name})` : raw.trim() || null;
}

function recommendedEntry(slug: string): string | null {
  const p = path.join(YA, slug, `${slug}-sales-summary.md`);
  if (!fs.existsSync(p)) return null;
  const md = fs.readFileSync(p, 'utf8');
  const m = /##\s*Recommended YardFlow entry point\s*\n+([^\n]+)/i.exec(md);
  return m ? m[1].trim() : null;
}

interface Roster {
  account?: string;
  facilities?: Array<{ lat?: number; lng?: number }>;
}
function readRoster(slug: string): Roster | null {
  const p = path.join(YA, slug, 'roster.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Roster;
  } catch {
    return null;
  }
}
function rosterNearestMi(roster: Roster | null): number | null {
  if (!roster?.facilities) return null;
  let min = Infinity;
  for (const f of roster.facilities) {
    if (typeof f.lat !== 'number' || typeof f.lng !== 'number') continue;
    for (const s of REFERENCE_SITES) {
      const d = haversineMi(f.lat, f.lng, s.lat, s.lng);
      if (d < min) min = d;
    }
  }
  return Number.isFinite(min) ? min : null;
}

// ── full scored set: aggregate sites per existingAccountSlug ──────────────────
interface ScoredAgg {
  count: number;
  fit01: number; // mean fitComponent (0..1)
  densityRaw: number; // mean corridorDensity (0..5)
  minDist: number; // min nearest-reference distance (mi)
}
function loadScoredAggregates(): Record<string, ScoredAgg> {
  let file: string | null = null;
  try {
    const dated = fs
      .readdirSync(PD)
      .filter((f) => /^scored-prospects-\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .reverse();
    if (dated.length) file = path.join(PD, dated[0]);
  } catch {
    /* none */
  }
  if (!file) {
    console.warn('no scored-prospects-*.json found; composite_score will be null for all');
    return {};
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    prospects?: Array<Record<string, unknown>>;
  };
  const rows = data.prospects ?? [];
  const acc: Record<string, { n: number; fit: number; dens: number; dist: number }> = {};
  for (const r of rows) {
    const slug = r.existingAccountSlug as string | undefined;
    if (!slug) continue;
    const sb = (r.scoreBreakdown ?? {}) as Record<string, number>;
    const fit01 =
      ((sb.verticalMatch ?? 0) + (sb.enterpriseScale ?? 0) + (sb.networkComplexity ?? 0)) / 75;
    const dens = sb.corridorDensity ?? 0;
    const np = (r.nearestPrimoSite ?? {}) as { distanceMiles?: number };
    const dist = typeof np.distanceMiles === 'number' ? np.distanceMiles : Infinity;
    const a = acc[slug] ?? { n: 0, fit: 0, dens: 0, dist: Infinity };
    a.n += 1;
    a.fit += fit01;
    a.dens += dens;
    if (dist < a.dist) a.dist = dist;
    acc[slug] = a;
  }
  const out: Record<string, ScoredAgg> = {};
  for (const [slug, a] of Object.entries(acc)) {
    out[slug] = {
      count: a.n,
      fit01: a.fit / a.n,
      densityRaw: a.dens / a.n,
      minDist: Number.isFinite(a.dist) ? a.dist : NaN,
    };
  }
  console.log(`scored aggregates: ${Object.keys(out).length} accounts from ${path.basename(file)}`);
  return out;
}

function titleize(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── master index (audited accounts) ──────────────────────────────────────────
interface AuditRow {
  facilities: number;
  truckGated: number;
  dockDoors: number;
  trailerCap: number;
  archRaw: string;
}
function loadAuditRows(): Record<string, AuditRow> {
  const lines = fs.readFileSync(INDEX, 'utf8').trim().split(/\r?\n/);
  const out: Record<string, AuditRow> = {};
  for (const line of lines.slice(1)) {
    const c = line.split(',');
    const slug = c[0];
    if (!slug || slug === 'TOTAL') continue;
    out[slug] = {
      facilities: Number.parseInt(c[1], 10),
      truckGated: Number.parseInt(c[2], 10),
      dockDoors: Number.parseInt(c[7], 10),
      trailerCap: Number.parseInt(c[8], 10),
      archRaw: c[9] ?? '',
    };
  }
  return out;
}

const scored = loadScoredAggregates();
const audits = loadAuditRows();
const slugs = Array.from(new Set([...Object.keys(audits), ...Object.keys(scored)])).sort();

const accounts: unknown[] = [];
let skipped = 0;
let withComposite = 0;
for (const slug of slugs) {
  const audit = audits[slug] ?? null;
  const agg = scored[slug] ?? null;
  const roster = readRoster(slug);

  // distance: prefer the scored set's min (keeps composite + proximity
  // consistent), else the roster-vs-reference min.
  const dist = agg && Number.isFinite(agg.minDist) ? agg.minDist : rosterNearestMi(roster);
  if (dist == null) {
    console.warn(`skip ${slug}: no resolvable distance`);
    skipped += 1;
    continue;
  }

  const proxC = proximityComponent(dist);
  const proximity_score = Math.round(proxC * 100);

  let composite_score: number | null = null;
  let fit_score: number | null = null;
  let corridor_density: number | null = null;
  if (agg) {
    const c =
      WEIGHTS.proximity * proxC +
      WEIGHTS.fit * agg.fit01 +
      WEIGHTS.density * densityComponent(agg.densityRaw);
    composite_score = Math.round(c * 100 * 100) / 100; // 0..100, 2dp
    fit_score = Math.round(agg.fit01 * 100 * 10) / 10;
    corridor_density = Math.round(agg.densityRaw * 10) / 10;
    withComposite += 1;
  }

  const regSlug = REGISTRY_ALIAS[slug] ?? slug;
  accounts.push({
    slug,
    account_name: roster?.account ?? titleize(slug),
    account_domain: DOMAINS[slug] ?? null,
    composite_score,
    proximity_score,
    fit_score,
    corridor_density,
    nearest_distance_mi: Math.round(dist * 10) / 10,
    yard_audit: audit
      ? {
          facilities: Number.isFinite(audit.facilities) ? audit.facilities : null,
          truck_gated_pct:
            Number.isFinite(audit.facilities) && audit.facilities > 0
              ? Math.round((audit.truckGated / audit.facilities) * 100)
              : null,
          dock_doors: Number.isFinite(audit.dockDoors) ? audit.dockDoors : null,
          trailer_cap: Number.isFinite(audit.trailerCap) ? audit.trailerCap : null,
          top_archetype: archetypeLabel(audit.archRaw),
          recommended_entry: recommendedEntry(slug),
        }
      : null,
    dossier_url: audit ? `https://yardflow.ai/for/${regSlug}` : null,
  });
}

(accounts as Array<{ slug: string }>).sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
const data = { generatedAt: new Date().toISOString(), accounts };
fs.writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(
  `wrote ${accounts.length} accounts (${withComposite} with full composite, ${skipped} skipped) to ${path.relative(ROOT, OUT)}`,
);
