/**
 * Phase 0.5 — Facility discovery extractor.
 *
 * Given an account, assembles a starting facilities.json from local sources:
 *   - src/lib/data/accounts.json        — facility_count, facility_types, HQ
 *   - src/lib/data/facility-facts.json  — source-verified facility counts
 *   - docs/research/<...>-dossier.md     — named plant / DC mentions
 *
 * Output: output/yard-audits/<slug>/facilities.json
 *
 * This is a SCAFFOLD. The dossier scan is a regex over prose: it will miss
 * sites the dossier doesn't name and over-capture HQ / non-yard locations.
 * Phase 1 enriches the list via web search up to the 30-site cap and prunes
 * false positives.
 *
 * Run: npx tsx scripts/yard-audit/extract-facilities.ts "<account name>"
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const RESEARCH_DIR = join(ROOT, 'docs', 'research');
const TODAY = new Date().toISOString().slice(0, 10);

const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]);

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

interface Account {
  name: string;
  parent_brand?: string;
  hq_location?: string;
  facility_count?: string;
  facility_types?: string[];
}

interface FacilityFact {
  account: string;
  facilityCount?: string;
  scope?: string;
}

interface Candidate {
  name: string;
  city: string;
  state: string;
  confidence: 'high' | 'medium';
  likelyHq: boolean;
  context: string;
  mapsSearchUrl: string;
  satelliteUrl: null;
}

/** Match an account to its dossier file by normalized company-suffix. */
function findDossier(accountName: string): string | null {
  if (!existsSync(RESEARCH_DIR)) return null;
  const target = normalize(accountName);
  const files = readdirSync(RESEARCH_DIR).filter((f) => f.endsWith('-dossier.md'));
  // Dossiers are named <person>-<company>-dossier.md — the company sits at the
  // end, so a normalized endsWith is the precise match.
  for (const f of files) {
    if (normalize(f.replace(/-dossier\.md$/, '')).endsWith(target)) {
      return join(RESEARCH_DIR, f);
    }
  }
  // Looser fallback.
  for (const f of files) {
    if (normalize(f).includes(target)) return join(RESEARCH_DIR, f);
  }
  return null;
}

// "City, ST" — city is 1-4 capitalized words ("of" allowed mid-name; hyphens
// only join capitalized parts, so "Multi-million-dollar Minster" can't match).
const WORD = String.raw`[A-Z][A-Za-z]*\.?(?:-[A-Z][A-Za-z]*)*`;
const CITY_STATE = new RegExp(
  String.raw`(${WORD}(?:\s+(?:of\s+)?${WORD}){0,3}),\s*([A-Z]{2})\b`,
  'g',
);

function extractCandidates(dossier: string, account: Account): Candidate[] {
  const hqCity = (account.hq_location ?? '').split(',')[0].trim().toLowerCase();
  const brand = account.parent_brand || account.name;

  // Bolded spans (**...**) are the dossier's deliberate plant call-outs.
  const boldRanges: Array<[number, number]> = [];
  for (const m of dossier.matchAll(/\*\*([^*]+)\*\*/g)) {
    boldRanges.push([m.index!, m.index! + m[0].length]);
  }
  const isBold = (i: number) => boldRanges.some(([a, b]) => i >= a && i < b);

  const seen = new Map<string, Candidate>();
  for (const m of dossier.matchAll(CITY_STATE)) {
    const city = m[1].trim();
    const state = m[2];
    if (!US_STATES.has(state)) continue;
    if (city.length < 3 || US_STATES.has(city.toUpperCase())) continue; // "CA, CO" guard
    const key = `${city.toLowerCase()}|${state}`;
    if (seen.has(key)) continue;
    const idx = m.index!;
    seen.set(key, {
      name: `${brand} - ${city}`,
      city,
      state,
      confidence: isBold(idx) ? 'high' : 'medium',
      likelyHq: city.toLowerCase() === hqCity,
      context: dossier.slice(Math.max(0, idx - 60), idx + 90).replace(/\s+/g, ' ').trim(),
      mapsSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${brand} ${city} ${state}`)}`,
      satelliteUrl: null,
    });
  }
  return [...seen.values()];
}

function main(): void {
  const accountArg = process.argv.slice(2).join(' ').trim();
  if (!accountArg) {
    console.error('Usage: npx tsx scripts/yard-audit/extract-facilities.ts "<account name>"');
    process.exit(1);
  }

  const accounts: Account[] = JSON.parse(
    readFileSync(join(ROOT, 'src/lib/data/accounts.json'), 'utf8'),
  );
  const facts: FacilityFact[] = JSON.parse(
    readFileSync(join(ROOT, 'src/lib/data/facility-facts.json'), 'utf8'),
  );

  const account: Account =
    accounts.find((a) => normalize(a.name) === normalize(accountArg)) ?? { name: accountArg };
  const fact = facts.find((f) => normalize(f.account) === normalize(account.name));
  const slug = slugify(account.name);

  const dossierPath = findDossier(account.name);
  const candidates = dossierPath
    ? extractCandidates(readFileSync(dossierPath, 'utf8'), account)
    : [];

  const outDir = join(ROOT, 'output', 'yard-audits', slug);
  mkdirSync(outDir, { recursive: true });

  const out = {
    account: account.name,
    slug,
    generatedAt: TODAY,
    sourceDossier: dossierPath ? dossierPath.slice(ROOT.length + 1) : null,
    parentBrand: account.parent_brand ?? null,
    hqLocation: account.hq_location ?? null,
    facilityCount: {
      repo: account.facility_count ?? null,
      verified: fact?.facilityCount ?? null,
      verifiedScope: fact?.scope ?? null,
    },
    facilityTypes: account.facility_types ?? [],
    siteCap: 30,
    candidateFacilities: candidates,
    needsWebSearch: true,
    notes: dossierPath
      ? `${candidates.length} candidate site(s) regex-extracted from dossier prose — verify each. Web-search Phase 1 fills toward the 30-site cap. Candidates with likelyHq:true are probably headquarters, not yards.`
      : `No dossier matched for "${account.name}". The facility list must be built from web search in Phase 1.`,
  };

  writeFileSync(join(outDir, 'facilities.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote output/yard-audits/${slug}/facilities.json`);
  console.log(`  account: ${account.name} | dossier: ${dossierPath ? 'found' : 'NOT FOUND'} | candidates: ${candidates.length}`);
  for (const c of candidates) {
    console.log(`  - [${c.confidence}${c.likelyHq ? ', likelyHQ' : ''}] ${c.city}, ${c.state}`);
  }
}

main();
