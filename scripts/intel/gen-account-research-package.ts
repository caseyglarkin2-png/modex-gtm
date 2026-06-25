/**
 * Package EVERYTHING we have on account-based research into one consolidated,
 * account-keyed dataset for clawd to map onto HubSpot (Company + Facility +
 * Contact records). Joins: discovery scores + the yard-audit corpus (per-site
 * metrics, 22-field classification, dossiers) + the buying-committee personas.
 *
 *   npx tsx scripts/intel/gen-account-research-package.ts
 *
 * Output: output/intel/account-research-package/account-research.json
 * (geofence rings excluded for size; raw site JSON paths referenced instead).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const YA = path.join(ROOT, 'output', 'yard-audits');
const OUTDIR = path.join(ROOT, 'output', 'intel', 'account-research-package');
fs.mkdirSync(OUTDIR, { recursive: true });

const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(the|inc|llc|corp|co|company|usa|na)\b/g, '').replace(/\s+/g, ' ').trim();

// ── scores per slug (from the committed proximity snapshot) ──────────────────
const prox = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'lib', 'intel', 'export', 'proximity-data.json'), 'utf8')) as {
  accounts: Array<{ slug: string; account_name: string; account_domain: string | null; composite_score: number | null; proximity_score: number; fit_score: number | null; corridor_density: number | null; nearest_distance_mi: number; yard_audit: Record<string, unknown> | null; dossier_url: string | null }>;
};
const proxBySlug = new Map(prox.accounts.map((a) => [a.slug, a]));

// ── personas grouped by account (normalized name) ────────────────────────────
interface Persona { account?: string; name?: string; title?: string; function?: string; seniority?: string; role_in_deal?: string; email?: string; phone?: string; linkedin_url?: string; persona_status?: string; why_this_persona?: string }
const personas = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'lib', 'data', 'personas.json'), 'utf8')) as Persona[];
const personasByAccount = new Map<string, Persona[]>();
for (const p of personas) {
  const k = norm(p.account ?? '');
  if (!k) continue;
  const g = personasByAccount.get(k) ?? [];
  g.push(p);
  personasByAccount.set(k, g);
}

// ── per-site detail (metrics + classification, no geofence rings) ────────────
interface SiteOut {
  idx: number; name: string; type: string; lat: number | null; lng: number | null;
  maps_url?: string; confidence?: string; yard_metrics?: unknown; classification?: unknown;
  raw_site_json: string; // path for geofences / full detail
}
function readSites(slug: string): SiteOut[] {
  const dir = path.join(YA, slug, 'sites');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f, i) => {
    let d: Record<string, unknown> = {};
    try { d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { /* skip */ }
    const coords = (d.coords ?? {}) as { lat?: number; lng?: number };
    return {
      idx: i + 1,
      name: String(d.name ?? f),
      type: String(d.type ?? ''),
      lat: typeof coords.lat === 'number' ? coords.lat : null,
      lng: typeof coords.lng === 'number' ? coords.lng : null,
      maps_url: d.mapsUrl as string | undefined,
      confidence: d.confidence as string | undefined,
      yard_metrics: d.yardMetrics,
      classification: d.classification,
      raw_site_json: path.relative(ROOT, path.join(dir, f)),
    };
  });
}

function salesSummaryPath(slug: string): string | null {
  const p = path.join(YA, slug, `${slug}-sales-summary.md`);
  return fs.existsSync(p) ? path.relative(ROOT, p) : null;
}
function dossierDir(slug: string): string | null {
  const p = path.join(YA, slug, 'dossiers');
  return fs.existsSync(p) ? path.relative(ROOT, p) : null;
}
function rosterName(slug: string): string | null {
  const p = path.join(YA, slug, 'roster.json');
  if (!fs.existsSync(p)) return null;
  try { return (JSON.parse(fs.readFileSync(p, 'utf8')) as { account?: string }).account ?? null; } catch { return null; }
}

const slugs = fs.readdirSync(YA, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
const accounts = [];
for (const slug of slugs) {
  const sites = readSites(slug);
  if (!sites.length) continue;
  const name = rosterName(slug) ?? prox.accounts.find((a) => a.slug === slug)?.account_name ?? slug;
  const p = proxBySlug.get(slug);
  const contacts = personasByAccount.get(norm(name)) ?? [];
  accounts.push({
    slug,
    account_name: name,
    domain: p?.account_domain ?? null,
    scores: p ? {
      composite: p.composite_score, proximity: p.proximity_score, fit: p.fit_score,
      corridor_density: p.corridor_density, nearest_distance_mi: p.nearest_distance_mi,
      nearest_primo_site: (p.yard_audit as Record<string, unknown> | null) ? undefined : undefined,
    } : null,
    yard_aggregate: p?.yard_audit ?? null,
    dossier_url: p?.dossier_url ?? null,
    corpus: { sales_summary: salesSummaryPath(slug), dossier_dir: dossierDir(slug), site_count: sites.length },
    sites,
    contacts: contacts.map((c) => ({ name: c.name, title: c.title, function: c.function, seniority: c.seniority, role_in_deal: c.role_in_deal, email: c.email, phone: c.phone, linkedin_url: c.linkedin_url, status: c.persona_status, why: c.why_this_persona })),
  });
}

const pkg = { generatedAt: new Date().toISOString(), schemaVersion: 1, accountCount: accounts.length, accounts };
fs.writeFileSync(path.join(OUTDIR, 'account-research.json'), JSON.stringify(pkg, null, 2));
const totalSites = accounts.reduce((n, a) => n + a.sites.length, 0);
const totalContacts = accounts.reduce((n, a) => n + a.contacts.length, 0);
const withScores = accounts.filter((a) => a.scores).length;
const withContacts = accounts.filter((a) => a.contacts.length).length;
console.log(`account-research.json: ${accounts.length} accounts, ${totalSites} sites, ${totalContacts} contacts`);
console.log(`  ${withScores} with scores, ${withContacts} with committee contacts`);
console.log(`  -> ${path.relative(ROOT, path.join(OUTDIR, 'account-research.json'))}`);
