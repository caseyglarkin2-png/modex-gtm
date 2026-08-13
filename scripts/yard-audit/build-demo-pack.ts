#!/usr/bin/env tsx
/**
 * D1.1 — Build a YNS Demo Pack for one account.
 *
 * Reads:
 *   output/yard-audits/<auditSlug>/roster.json
 *   output/yard-audits/<auditSlug>/sites/NN-*.json
 *   output/yard-audits/<auditSlug>/dossiers/NN-*.md  (for excerpt)
 *
 * Emits:
 *   public/demo-packs/<micrositeSlug>.json   (validated against DemoPackSchema)
 *
 * Usage:
 *   npx tsx scripts/yard-audit/build-demo-pack.ts <auditSlug>
 *   # e.g. npx tsx scripts/yard-audit/build-demo-pack.ts mondelez
 *
 * Tiles + clawd research are layered on by separate scripts (D1.2 / D1.3).
 * If those files already exist on disk, this builder will merge them in.
 */

import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DemoPackSchema,
  type DemoPack,
  type Site,
  type SiteGeofences,
  type GeoShape,
  type Tile,
  type ArchetypeId,
  type Confidence,
  type ZoneStreetView,
} from '../../src/lib/demo/pack-schema';
import { shapeBounds } from '../../src/lib/demo/geofence-geometry';
import { buildScenario } from '../../src/lib/demo/scenarios';
import { resolveByAuditSlug } from './slug-map';
import { evidenceFailure } from './evidence.ts';

// ── Paths ───────────────────────────────────────────────────────────────────

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUDIT_ROOT = join(ROOT, 'output', 'yard-audits');
const OUT_ROOT = join(ROOT, 'public', 'demo-packs');

// ── Helpers ─────────────────────────────────────────────────────────────────

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T = unknown>(p: string): Promise<T> {
  return JSON.parse(await readFile(p, 'utf8')) as T;
}

/**
 * Extract a plain-text excerpt from a dossier markdown file. Drops the
 * front-matter metadata block (lines starting with `**`), finds the first
 * `## ` heading, then returns the prose under it up to ~800 chars or the
 * next heading — whichever hits first.
 */
function dossierExcerpt(md: string, maxChars = 800): string {
  const lines = md.split(/\r?\n/);
  let i = 0;
  // Skip H1 + metadata lines (everything until first H2)
  while (i < lines.length && !lines[i]!.startsWith('## ')) i++;
  i++; // skip the H2 line itself
  const buf: string[] = [];
  let chars = 0;
  for (; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith('## ')) break;
    buf.push(line);
    chars += line.length + 1;
    if (chars >= maxChars) break;
  }
  return buf
    .join('\n')
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italics
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .trim();
}

/**
 * Grow the network bbox tuple [west, south, east, north] to include a geofence
 * shape — bbox OR oriented polygon. Uses `shapeBounds` (which returns Leaflet
 * [[s,w],[n,e]]) so a `{ring}` perimeter no longer yields NaN. Replaces the old
 * bbox-only `expandBbox`, which read `.west/.south/...` off the shape directly.
 */
function expandShape(
  into: [number, number, number, number] | null,
  shape: GeoShape,
): [number, number, number, number] {
  const [[s, w], [n, e]] = shapeBounds(shape);
  if (!into) return [w, s, e, n];
  return [Math.min(into[0], w), Math.min(into[1], s), Math.max(into[2], e), Math.max(into[3], n)];
}

/** Compute archetypeMix from the sites — counts per archetype id. */
function computeArchetypeMix(sites: Site[]): Record<string, number> {
  const mix: Record<string, number> = {};
  for (const s of sites) {
    mix[s.archetype] = (mix[s.archetype] ?? 0) + 1;
  }
  return mix;
}

/** Compute network totals from per-site yardMetrics. Nulls treated as 0. */
function computeTotals(sites: Site[]) {
  let dockDoors = 0;
  let trailerCapacity = 0;
  let gates = 0;
  let railServed = 0;
  let acres = 0;
  for (const s of sites) {
    dockDoors += s.yardMetrics.dockDoorCount ?? 0;
    trailerCapacity += s.yardMetrics.trailerParkingCapacity ?? 0;
    gates += s.yardMetrics.truckGateCount ?? 0;
    if (s.yardMetrics.railServed === true) railServed += 1;
    acres += s.yardMetrics.siteAreaAcres ?? 0;
  }
  return { dockDoors, trailerCapacity, gates, railServed, acres };
}

// ── Per-site loader ─────────────────────────────────────────────────────────

interface RawSiteJson {
  name: string;
  type: string;
  coords: { lat: number; lng: number };
  geofences: {
    perimeter?: GeoShape; // stub sites are missing this; bbox OR oriented polygon
    truckGate?: GeoShape | null;
    dropYards?: GeoShape[];
    dockAprons?: GeoShape[];
    staging?: GeoShape | null;
    streetViewMeta?: SiteGeofences['streetViewMeta']; // per-zone ground-level camera info
  };
  yardMetrics: Site['yardMetrics']; // nullable fields
  classification: Site['classification'];
  confidence: Confidence;
  uncertainFields?: string[];
  fieldNotes?: Record<string, unknown>; // booleans get filtered downstream
  mapsUrl: string;
  method?: string;
}

interface AssignedArchetypeRow {
  /** Site filename id, e.g. "01-nabisco-richmond-biscuit-bakery" */
  id: string;
  archetype: ArchetypeId;
  archetypeName: string;
}

/**
 * Read an archetype label out of the per-account CSV — it's the only place
 * `assignArchetype()` results are persisted alongside the site id. CSV
 * format (from `scripts/yard-audit/generate-csv.ts`):
 *   row1 = group header, row2 = column header, row3+ = data, then blanks,
 *   then summary block. We only need Name → archetype + archetypeName.
 */
async function loadArchetypes(auditDir: string, auditSlug: string): Promise<Map<string, { archetype: ArchetypeId; archetypeName: string }>> {
  const csvPath = join(auditDir, `${auditSlug}-location-breakdown.csv`);
  const out = new Map<string, { archetype: ArchetypeId; archetypeName: string }>();
  if (!(await exists(csvPath))) return out;
  const text = await readFile(csvPath, 'utf8');
  const lines = text.split(/\r?\n/);
  // Find header row, then walk data rows until first blank
  let dataStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.startsWith('Name,')) {
      dataStart = i + 1;
      break;
    }
  }
  if (dataStart < 0) return out;
  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) break;
    const cells = parseCsvLine(line);
    const name = cells[0] ?? '';
    const archetype = (cells[2] ?? '').trim() as ArchetypeId;
    const archetypeName = (cells[3] ?? '').trim();
    if (!name || !archetype) continue;
    out.set(name, { archetype, archetypeName });
  }
  return out;
}

/** Minimal CSV cell splitter — handles double-quoted fields with embedded commas. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuote = true;
    } else if (c === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

// In-memory cache keyed by micrositeSlug — sidecar is one file per account.
const sidecarCache = new Map<string, Record<string, Record<string, Omit<Tile, 'zoom'>>>>();

async function loadSidecar(micrositeSlug: string): Promise<Record<string, Record<string, Omit<Tile, 'zoom'>>>> {
  if (sidecarCache.has(micrositeSlug)) return sidecarCache.get(micrositeSlug)!;
  const sidecarPath = join(OUT_ROOT, 'tiles', micrositeSlug, '_tiles.json');
  if (!(await exists(sidecarPath))) {
    sidecarCache.set(micrositeSlug, {});
    return {};
  }
  const parsed = JSON.parse(await readFile(sidecarPath, 'utf8'));
  sidecarCache.set(micrositeSlug, parsed);
  return parsed;
}

async function loadTiles(micrositeSlug: string, siteId: string): Promise<Record<string, Tile> | undefined> {
  const sidecar = await loadSidecar(micrositeSlug);
  const forSite = sidecar[siteId];
  if (!forSite) return undefined;
  const out: Record<string, Tile> = {};
  for (const [zoomStr, entry] of Object.entries(forSite)) {
    out[zoomStr] = { ...entry, zoom: Number(zoomStr) };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Sanitize the auditor-written `streetViewMeta` so it validates against
 * `ZoneStreetView` (heading in [0,360), pano min length 1). Auditors sometimes
 * emit a zone with an empty `pano` (no usable Street View), a `heading` of
 * exactly 360, or a single `dropYards`/`dockApron` object instead of an array.
 * We drop pano-less zones (they can't render a walkthrough anyway), wrap stray
 * objects into arrays, and fold heading into range. Returns undefined when
 * nothing usable remains so the key is omitted entirely.
 */
type RawZone = { heading?: number; pano?: string; hasCoverage?: boolean };
function cleanZone(z: RawZone | null | undefined): ZoneStreetView | undefined {
  if (!z || typeof z.pano !== 'string' || z.pano.length < 1) return undefined;
  const heading = ((Number(z.heading ?? 0) % 360) + 360) % 360;
  return { heading, pano: z.pano, hasCoverage: z.hasCoverage === true };
}
function cleanZoneArray(v: unknown): ZoneStreetView[] | undefined {
  const arr = Array.isArray(v) ? v : v && typeof v === 'object' ? [v] : [];
  const cleaned = arr.map((z) => cleanZone(z as RawZone)).filter((z): z is ZoneStreetView => z != null);
  return cleaned.length > 0 ? cleaned : undefined;
}
function sanitizeStreetViewMeta(svm: unknown): SiteGeofences['streetViewMeta'] | undefined {
  if (!svm || typeof svm !== 'object') return undefined;
  const raw = svm as Record<string, unknown>;
  const out: NonNullable<SiteGeofences['streetViewMeta']> = {};
  const perimeter = cleanZone(raw.perimeter as RawZone);
  const truckGate = cleanZone(raw.truckGate as RawZone);
  const staging = cleanZone(raw.staging as RawZone);
  const dropYards = cleanZoneArray(raw.dropYards);
  const dockAprons = cleanZoneArray(raw.dockAprons);
  if (perimeter) out.perimeter = perimeter;
  if (truckGate) out.truckGate = truckGate;
  if (staging) out.staging = staging;
  if (dropYards) out.dropYards = dropYards;
  if (dockAprons) out.dockAprons = dockAprons;
  return Object.keys(out).length > 0 ? out : undefined;
}

async function buildSite(
  auditDir: string,
  micrositeSlug: string,
  file: string,
  archetypeByName: Map<string, { archetype: ArchetypeId; archetypeName: string }>,
): Promise<Site | null> {
  const id = file.replace(/\.json$/, ''); // e.g. "01-nabisco-richmond-biscuit-bakery"
  const raw = await readJson<RawSiteJson>(join(auditDir, 'sites', file));

  // Filter out stub sites (unresolved address, no public imagery). They
  // exist in the roster but can't render a geofence overlay — the demo's
  // entire reason for existing — so we drop them from the pack. Their
  // count flows into CoverageNote.droppedStubCount.
  if (!raw.geofences || !raw.geofences.perimeter) return null;

  const dossierPath = join(auditDir, 'dossiers', `${id}.md`);
  const excerpt = (await exists(dossierPath)) ? dossierExcerpt(await readFile(dossierPath, 'utf8')) : undefined;

  const arch = archetypeByName.get(raw.name);
  if (!arch) {
    throw new Error(`No archetype row for site "${raw.name}" in CSV — re-run generate-csv.ts`);
  }

  const geofences: SiteGeofences = {
    perimeter: raw.geofences.perimeter,
    truckGate: raw.geofences.truckGate ?? null,
    dropYards: raw.geofences.dropYards ?? [],
    dockAprons: raw.geofences.dockAprons ?? [],
    staging: raw.geofences.staging ?? null,
    ...((): { streetViewMeta?: SiteGeofences['streetViewMeta'] } => {
      const svm = sanitizeStreetViewMeta(raw.geofences.streetViewMeta);
      return svm ? { streetViewMeta: svm } : {};
    })(),
  };

  const tiles = await loadTiles(micrositeSlug, id);

  // Some round-2 site JSONs have stray non-string values in fieldNotes
  // (e.g. `railServed: false` — the auditor wrote a boolean instead of
  // an evidence string). Keep only the string-valued entries.
  const cleanedFieldNotes: Record<string, string> | undefined = raw.fieldNotes
    ? Object.fromEntries(
        Object.entries(raw.fieldNotes).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
      )
    : undefined;

  const site: Site = {
    id,
    name: raw.name,
    type: raw.type,
    archetype: arch.archetype,
    archetypeName: arch.archetypeName,
    confidence: raw.confidence,
    uncertainFields: raw.uncertainFields ?? [],
    center: { lat: raw.coords.lat, lng: raw.coords.lng },
    geofences,
    yardMetrics: raw.yardMetrics,
    classification: raw.classification,
    mapsUrl: raw.mapsUrl,
    ...(excerpt ? { dossierExcerpt: excerpt } : {}),
    ...(tiles ? { tiles } : {}),
    ...(cleanedFieldNotes && Object.keys(cleanedFieldNotes).length > 0 ? { fieldNotes: cleanedFieldNotes } : {}),
    ...((raw as { verification?: Site['verification'] }).verification
      ? { verification: (raw as { verification?: Site['verification'] }).verification }
      : {}),
  };

  // D3.1 — attach the driver-journey replay template, gracefully omitted
  // when the site's geofences don't fit the archetype's required layers.
  const scenario = buildScenario(site);
  if (scenario) site.scenario = scenario;

  return site;
}

// ── FOV (field-of-view) verification build gate ──────────────────────────────
// Quarantines sites whose `verification` block is missing/invalid or whose
// verdict is `rejected` so a divested/closed/unverified yard can never ship in
// a demo pack. Two modes via FOV_GATE env:
//   warn    (default) — log + report flagged sites but KEEP them (so existing
//                        packs don't empty out before the Task 0.4 backfill)
//   enforce            — DROP flagged sites; if the hero (featuredSiteId) is
//                        flagged, refuse to build (exit 1)
// In BOTH modes an fov-report.md is (over)written per build.
//
// It used to overwrite verification-rejections.md, which is where the audit
// agents put their hand-written, cited rejection research. 56 of those files
// exist (2,719 lines); 53 still hold Tier-1/Tier-2 sourcing on why a site was
// excluded. A single pack build replaces each with a five-line stub, and
// nothing in the repo reads the file, so it only ever cost evidence.
//
// This is not hypothetical and it is not fully in the future:
//   - modex-gtm-demo-aplus is sitting on 51 such files, uncommitted:
//     2,438 lines of citations deleted, 188 lines of stub added.
//   - THREE are already stubbed on origin/main — ball, crowley, kroger. Ball
//     never had research; crowley's 40-line version survives at 19e7c6aa and
//     kroger's 21-line version at 313132cd. Recover with
//     `git show <sha>:output/yard-audits/<slug>/verification-rejections.md`,
//     but check them against the current site list first — kroger dropped 3
//     closed sites in a4ae6ef9 after that evidence was written.
//   - Two stub headings exist ("# FOV warn report" and "# FOV enforce report"),
//     so any recovery sweep must match both.
//
// Generated output now gets its own filename, and .gitignore keeps it out.
function fovGate(slug: string, featuredSiteId: string | undefined, sites: Site[]): Site[] {
  const mode = process.env.FOV_GATE === 'enforce' ? 'enforce' : 'warn';
  const kept: Site[] = [];
  const flagged: { id: string; reason: string }[] = [];

  for (const s of sites) {
    const v = (s as unknown as { verification?: any }).verification;
    // The rule itself lives in ./evidence.ts. It used to be inline here and
    // re-implemented from memory in tests and audit scripts, which is how a
    // rule drifts into three slightly different rules.
    const failure = evidenceFailure(slug, v);
    if (failure) {
      flagged.push({
        id: s.id,
        reason: failure === 'rejected' ? v.rationale || 'rejected' : `failed FOV gate: ${failure}`,
      });
      if (mode === 'enforce') continue; // drop it
    }
    kept.push(s);
  }

  // Write the rejections report (overwrite each build).
  const dir = join(AUDIT_ROOT, slug);
  const lines =
    `# FOV ${mode} report — ${slug}\n\n` +
    (flagged.length ? flagged.map((f) => `- ${f.id}: ${f.reason}`).join('\n') : '_none_') +
    '\n';
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'fov-report.md'), lines);
  } catch {
    /* report write is best-effort */
  }

  if (flagged.length) {
    console.warn(`⚠ FOV ${mode}: ${flagged.length} site(s) flagged for ${slug}`);
    for (const f of flagged) console.warn(`    - ${f.id}: ${f.reason}`);
  }

  // Never ship a pack whose hero failed verification.
  if (mode === 'enforce' && featuredSiteId && flagged.some((f) => f.id === featuredSiteId)) {
    console.error(
      `FOV: featured/hero site ${featuredSiteId} failed verification for ${slug} — refusing to build.`,
    );
    process.exit(1);
  }

  return mode === 'enforce' ? kept : sites; // warn mode keeps all
}

// ── Main ────────────────────────────────────────────────────────────────────

// FROZEN packs are live in a specific prospect's hands (sent links). A pipeline
// rebuild must NEVER silently change their hero, counts, or totals. Both this
// script and build-all-packs skip them unless explicitly forced.
const FROZEN_PACKS = new Set(['crowley', 'dannon']);

async function main() {
  const auditSlug = process.argv[2];
  if (!auditSlug) {
    console.error('usage: npx tsx scripts/yard-audit/build-demo-pack.ts <auditSlug>');
    process.exit(1);
  }
  if (FROZEN_PACKS.has(auditSlug) && !process.env.FORCE_REBUILD && !process.argv.includes('--force')) {
    console.warn(`⛔ ${auditSlug} is FROZEN (live with a prospect) — skipping rebuild. Pass --force or FORCE_REBUILD=1 to override.`);
    return;
  }
  const entry = resolveByAuditSlug(auditSlug);
  const { micrositeSlug, displayName, archetype, estimatedFootprint, coverageNote } = entry;

  const auditDir = join(AUDIT_ROOT, auditSlug);
  if (!(await exists(auditDir))) {
    throw new Error(`Audit folder not found: ${auditDir}`);
  }

  console.log(`▶ building pack for ${displayName}  [audit=${auditSlug}  microsite=${micrositeSlug}]`);

  // Load all per-site JSONs
  const sitesDir = join(auditDir, 'sites');
  const siteFiles = (await readdir(sitesDir)).filter((f) => /^\d{2}-.+\.json$/.test(f)).sort();
  if (siteFiles.length === 0) throw new Error(`No site JSONs found in ${sitesDir}`);

  const archetypeByName = await loadArchetypes(auditDir, auditSlug);
  if (archetypeByName.size === 0) {
    throw new Error(`No archetypes loaded from CSV in ${auditDir} — run generate-csv.ts first`);
  }

  const sites: Site[] = [];
  let droppedStubCount = 0;
  for (const f of siteFiles) {
    const site = await buildSite(auditDir, micrositeSlug, f, archetypeByName);
    if (site === null) droppedStubCount++;
    else sites.push(site);
  }

  if (sites.length === 0) {
    throw new Error(
      `No audited sites for ${auditSlug} — all ${siteFiles.length} site JSONs are stubs (missing geofences.perimeter). Pack not written.`,
    );
  }

  // Network bbox: union of all per-site perimeters
  let networkBbox: [number, number, number, number] | null = null;
  for (const s of sites) {
    networkBbox = expandShape(networkBbox, s.geofences.perimeter);
  }
  if (!networkBbox) throw new Error('No sites produced — cannot compute bbox');

  const archetypeMix = computeArchetypeMix(sites);
  const totals = computeTotals(sites);

  const auditedCount = sites.length;
  const capHit = auditedCount === 30;

  // FOV verification gate FIRST: quarantine unverified/rejected sites, then
  // derive the hero + network fields ONLY from the verified set (so a divested/
  // closed site can never become the featured hero or skew the totals).
  const gatedSites = fovGate(auditSlug, undefined, sites);
  let gatedBbox = networkBbox;
  let gatedMix = archetypeMix;
  let gatedTotals = totals;
  if (gatedSites.length !== sites.length) {
    gatedBbox = null;
    for (const s of gatedSites) gatedBbox = expandShape(gatedBbox, s.geofences.perimeter);
    if (!gatedBbox) throw new Error(`No sites survived the FOV gate for ${auditSlug} — pack not written.`);
    gatedMix = computeArchetypeMix(gatedSites);
    gatedTotals = computeTotals(gatedSites);
  }
  const gatedCount = gatedSites.length;

  // Pick the featured site for the demo's first impression, from the VERIFIED
  // set: the site whose archetype is the biggest cluster (most common reality),
  // with the highest `dockDoorCount` tie-breaker (visual proof of scale).
  const archetypeRanks = Object.entries(gatedMix).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
  const topArchetype = archetypeRanks[0]?.[0] as ArchetypeId | undefined;
  const featuredSiteId = topArchetype
    ? gatedSites
        .filter((s) => s.archetype === topArchetype)
        .sort((a, b) => (b.yardMetrics.dockDoorCount ?? 0) - (a.yardMetrics.dockDoorCount ?? 0))[0]?.id
    : undefined;

  const pack: DemoPack = {
    schemaVersion: '2',
    builtAt: new Date().toISOString(),
    account: {
      slug: micrositeSlug,
      displayName,
      archetype,
      siteCount: gatedCount,
      ...(featuredSiteId ? { featuredSiteId } : {}),
      coverageNote: {
        auditedCount: gatedCount,
        estimatedFootprint: estimatedFootprint ?? null,
        droppedStubCount,
        capHit,
        note:
          coverageNote ??
          (capHit
            ? `We audited the ${auditedCount} largest facilities by throughput${droppedStubCount > 0 ? ` (${droppedStubCount} additional facilities couldn't be resolved from public sources)` : ''}. The wider network follows the same archetype distribution.`
            : `Audited all ${auditedCount} identifiable facilities${droppedStubCount > 0 ? ` (${droppedStubCount} additional were unresolvable from public sources)` : ''}.`),
      },
    },
    research: null, // D1.3 will populate
    network: {
      bbox: gatedBbox,
      archetypeMix: gatedMix,
      totals: gatedTotals,
      sites: gatedSites,
    },
  };

  // Preserve GTM-authored fields that this builder does NOT compute, so a
  // geofence / Street-View regen never silently drops them again. This is the
  // bug that wiped roiDefaults + dossierIntro + surprisingFindings across every
  // pack (regen 32dfbaa): the build emits only audit-derived fields, so any
  // out-of-band content layered on afterward is lost on the next rebuild.
  // Canonical sources still exist as re-runnable patches/restores
  // (patch-roi-defaults.mjs, patch-global-footprints.mjs,
  // restore-pack-narrative.mjs); this just keeps the content across a plain
  // rebuild so the validate:packs gate stays green without a manual re-run.
  const outPath = join(OUT_ROOT, `${micrositeSlug}.json`);
  if (await exists(outPath)) {
    const prev = await readJson<DemoPack>(outPath).catch(() => null);
    if (prev?.account) {
      const a = prev.account;
      if (a.dossierIntro != null) pack.account.dossierIntro = a.dossierIntro;
      if (Array.isArray(a.surprisingFindings)) pack.account.surprisingFindings = a.surprisingFindings;
      if (a.roiDefaults != null) pack.account.roiDefaults = a.roiDefaults;
      if (a.teardownVideoSrc != null) pack.account.teardownVideoSrc = a.teardownVideoSrc;
      // Sticky hero: keep a hand-set featuredSiteId (e.g. crowley -> Talleyrand)
      // across rebuilds, as long as that site still survives the gate. Without
      // this, the builder would recompute the hero to the biggest-dock site.
      if (a.featuredSiteId && pack.network.sites.some((s) => s.id === a.featuredSiteId)) {
        pack.account.featuredSiteId = a.featuredSiteId;
      }
      // Phase 2/3 core-sample fields (network denominator + sample rationale).
      if (a.networkCount != null) pack.account.networkCount = a.networkCount;
      if (a.networkCountSource != null) pack.account.networkCountSource = a.networkCountSource;
      if (a.networkCountAsOf != null) pack.account.networkCountAsOf = a.networkCountAsOf;
      if (a.sampleRationale != null) pack.account.sampleRationale = a.sampleRationale;
      // coverageNote: keep the patch-global-footprints overrides (scope /
      // footprint / legacy-YMS / curated note) while letting the builder's
      // freshly-computed audited counts stand.
      const prevCov = a.coverageNote;
      const cov = pack.account.coverageNote;
      if (prevCov && cov) {
        if (prevCov.estimatedFootprint != null) cov.estimatedFootprint = prevCov.estimatedFootprint;
        if (prevCov.note) cov.note = prevCov.note;
        if (prevCov.totalGlobalFootprint != null) cov.totalGlobalFootprint = prevCov.totalGlobalFootprint;
        if (prevCov.auditedScope != null) cov.auditedScope = prevCov.auditedScope;
        if (prevCov.legacyYmsFacilityCount != null) cov.legacyYmsFacilityCount = prevCov.legacyYmsFacilityCount;
      }
    }
    if (prev?.research != null && pack.research == null) pack.research = prev.research;
  }

  // Validate
  const validated = DemoPackSchema.parse(pack);

  // Write
  await mkdir(OUT_ROOT, { recursive: true });
  await writeFile(outPath, JSON.stringify(validated, null, 2));

  // Stats
  const bytes = (await stat(outPath)).size;
  console.log(`✓ wrote ${outPath}`);
  console.log(`  ${gatedSites.length} sites · ${gatedTotals.dockDoors} dock doors · ${gatedTotals.trailerCapacity} trailer spots · ${gatedTotals.railServed} rail-served`);
  if (droppedStubCount > 0) console.log(`  ${droppedStubCount} stub sites dropped (missing perimeter)`);
  console.log(`  bbox [${networkBbox.map((n) => n.toFixed(3)).join(', ')}]`);
  console.log(`  archetype mix:`, archetypeMix);
  console.log(`  size: ${(bytes / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
