/**
 * Generate the committed proximity-export snapshot for clawd's sixth ingest
 * stream (GET /api/intel/export/proximity). Run at author time whenever the
 * yard-audit set or reference sites change:
 *
 *   npx tsx scripts/intel/gen-proximity-export.ts
 *
 * Why precompute + commit: runtime fs reads of output/** are NOT reliably
 * shipped into the Vercel serverless bundle (see src/lib/discovery/data.ts),
 * so the endpoint statically imports the committed JSON instead. Proximity is
 * standing state, so a build-time snapshot is the correct shape: a recompute
 * writes a new `generatedAt`, which becomes a new ledger row per the contract.
 *
 * Joins, per account in output/yard-audits/YardFlow-Master-Index.csv:
 *  - nearest_distance_mi: min haversine(account roster facility, REFERENCE_SITES)
 *  - proximity_score: proximityComponent(nearest_distance_mi) * 100 (the pure
 *    proximity axis, mirrored from src/lib/discovery/scoring.ts; fit/density
 *    are nullable v2 enrichment from the full scored set)
 *  - yard_audit: the master-index row + archetype label + recommended_entry
 *  - dossier_url: the account's live /for page
 */
import fs from 'node:fs';
import path from 'node:path';
import { REFERENCE_SITES } from '../../src/lib/discovery/reference-sites';

const ROOT = process.cwd();
const YA = path.join(ROOT, 'output', 'yard-audits');
const INDEX = path.join(YA, 'YardFlow-Master-Index.csv');
const ARCHKEY = path.join(ROOT, 'scripts', 'yard-audit', 'archetype-key.json');
const OUT = path.join(ROOT, 'src', 'lib', 'intel', 'export', 'proximity-data.json');

// proximityComponent mirrored from src/lib/discovery/scoring.ts (exp decay, 30mi).
const PROX_DECAY_MI = 30;
const proximityComponent = (mi: number) => Math.exp(-Math.max(0, mi) / PROX_DECAY_MI);

function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.7613; // earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Curated account-domain map for the audited accounts (clawd resolves by domain,
// name-fallback otherwise). Keyed on the master-index slug.
const DOMAINS: Record<string, string> = {
  'ab-inbev': 'anheuser-busch.com',
  'barnes-noble': 'barnesandnoble.com',
  'bob-evans-farms': 'bobevans.com',
  'boston-beer-company': 'bostonbeer.com',
  campbells: 'campbells.com',
  caterpillar: 'caterpillar.com',
  'cj-logistics-america': 'cjlogisticsamerica.com',
  'coca-cola': 'coca-colacompany.com',
  'constellation-brands': 'cbrands.com',
  'cost-plus-world-market': 'worldmarket.com',
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
  honda: 'honda.com',
  'hormel-foods': 'hormelfoods.com',
  'hyundai-motor-america': 'hyundaiusa.com',
  'jm-smucker': 'jmsmucker.com',
  'john-deere': 'deere.com',
  'kenco-logistics': 'kencogroup.com',
  'keurig-dr-pepper': 'keurigdrpepper.com',
  'kimberly-clark': 'kimberly-clark.com',
  'kraft-heinz': 'kraftheinzcompany.com',
  mondelez: 'mondelezinternational.com',
  'nestle-usa': 'nestleusa.com',
  'niagara-bottling': 'niagarawater.com',
  'pactiv-evergreen': 'pactivevergreen.com',
  'performance-food-group': 'pfgc.com',
  'salson-logistics': 'salson.com',
  'sc-johnson': 'scjohnson.com',
  'the-home-depot': 'homedepot.com',
  toyota: 'toyota.com',
  unfi: 'unfi.com',
  'universal-logistics': 'universallogistics.com',
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

/** "#3 (8)" -> "#3 (No Gate / No GS)". Falls back to the raw value. */
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

function nearestMi(facilities: Array<{ lat?: number; lng?: number }>): number | null {
  let min = Infinity;
  for (const f of facilities) {
    if (typeof f.lat !== 'number' || typeof f.lng !== 'number') continue;
    for (const s of REFERENCE_SITES) {
      const d = haversineMi(f.lat, f.lng, s.lat, s.lng);
      if (d < min) min = d;
    }
  }
  return Number.isFinite(min) ? min : null;
}

function titleize(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const lines = fs.readFileSync(INDEX, 'utf8').trim().split(/\r?\n/);
const accounts: unknown[] = [];
let skipped = 0;
for (const line of lines.slice(1)) {
  const cols = line.split(',');
  const slug = cols[0];
  if (!slug || slug === 'TOTAL') continue;
  const facilities = Number.parseInt(cols[1], 10);
  const truckGated = Number.parseInt(cols[2], 10);
  const dockDoors = Number.parseInt(cols[7], 10);
  const trailerCap = Number.parseInt(cols[8], 10);
  const archRaw = cols[9] ?? '';

  const roster = readRoster(slug);
  const dist = roster?.facilities ? nearestMi(roster.facilities) : null;
  if (dist == null) {
    console.warn(`skip ${slug}: no resolvable facility coordinates`);
    skipped += 1;
    continue;
  }
  const regSlug = REGISTRY_ALIAS[slug] ?? slug;
  accounts.push({
    slug,
    account_name: roster?.account ?? titleize(slug),
    account_domain: DOMAINS[slug] ?? null,
    proximity_score: Math.round(proximityComponent(dist) * 100),
    nearest_distance_mi: Math.round(dist * 10) / 10,
    corridor_density: null,
    fit_score: null,
    yard_audit: {
      facilities: Number.isFinite(facilities) ? facilities : null,
      truck_gated_pct:
        Number.isFinite(facilities) && facilities > 0
          ? Math.round((truckGated / facilities) * 100)
          : null,
      dock_doors: Number.isFinite(dockDoors) ? dockDoors : null,
      trailer_cap: Number.isFinite(trailerCap) ? trailerCap : null,
      top_archetype: archetypeLabel(archRaw),
      recommended_entry: recommendedEntry(slug),
    },
    dossier_url: `https://yardflow.ai/for/${regSlug}`,
  });
}

(accounts as Array<{ slug: string }>).sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
const data = { generatedAt: new Date().toISOString(), accounts };
fs.writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${accounts.length} accounts (${skipped} skipped) to ${path.relative(ROOT, OUT)}`);
