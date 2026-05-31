import { promises as fs, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { DemoPackSchema, type DemoPack } from '@/lib/demo/pack-schema';
import { INDUSTRY_ANCHORS, type IndustryAnchor, type Archetype } from '@/lib/demo/industry-tags';
import { applyPinOrder, readPinnedSlugs } from '@/lib/demo/gallery-pin';
import { readAuditsThisQuarter } from '@/lib/demo/gallery-flags';
import { Gallery, type GalleryTileData } from '@/components/demo/gallery';
import { MicrositeTracker } from '@/components/microsites/microsite-tracker';
import { buildPublicShareMetadata } from '@/lib/microsites/share';

/**
 * Sprint 2.5 — /demo industry-template gallery.
 *
 * Server component. For each industry anchor, reads the corresponding
 * demo pack JSON off disk and hands the tile metadata to a client-side
 * Gallery component. The client component owns the localStorage hand-off
 * to /roi (D8.1 pattern) — server just hydrates the static data.
 *
 * Public via the middleware `demo` matcher exclusion (no auth). Surfaced
 * from `yardflow.ai/demo` via the flow-state-site rewrite once the legacy
 * `/demo → /contact?intent=demo` redirect is removed.
 */

// ── ROI pre-fill builder ──────────────────────────────────────────────────────
//
// Mirrors src/components/demo/roi-cta-button.tsx buildRoiV2State, but
// runs server-side here so the click handler stays synchronous (no
// pack fetch on click). Keep this in lockstep with that file — if the
// V2 calculator schema drifts, both buildRoiV2State implementations
// need to update together.

const LEGACY_YMS_ADOPTION_BY_VERTICAL: Record<string, number> = {
  cpg: 0.35,
  'grocer-distributor': 0.45,
  '3pl': 0.55,
  retailer: 0.4,
  manufacturer: 0.3,
  'oem-automotive': 0.4,
  beverage: 0.4,
  'logistics-carrier': 0.5,
};

interface RoiV2State {
  asks: {
    totalFacilities: number;
    facilitiesWithYms: number;
    facilitiesWithDropTrailers: number;
    averageMarginPerShipment: number;
  };
  assumptions: {
    withYms: {
      dcFtesPerShift: number;
      dcShifts: number;
      spotterFtesPerShift: number;
      spotterShifts: number;
      shipmentsPerDay: number;
      avgCycleTimeMinutes: number;
      annualFteCost: number;
    };
    dropsNoYms: {
      dcFtesPerShift: number;
      dcShifts: number;
      spotterFtesPerShift: number;
      spotterShifts: number;
      shipmentsPerDay: number;
      avgCycleTimeMinutes: number;
      annualFteCost: number;
    };
    withoutDrops: {
      dcFtesPerShift: number;
      dcShifts: number;
      spotterFtesPerShift: number;
      spotterShifts: number;
      shipmentsPerDay: number;
      avgCycleTimeMinutes: number;
      annualFteCost: number;
    };
  };
}

function buildRoiV2State(pack: DemoPack): RoiV2State {
  const cov = pack.account.coverageNote;
  const total =
    cov?.totalGlobalFootprint ?? cov?.estimatedFootprint ?? pack.account.siteCount;

  const auditedSites = pack.network.sites.length;
  const auditedDrops = pack.network.sites.filter((s) => s.classification.dropYard).length;
  const dropRatio = auditedSites > 0 ? auditedDrops / auditedSites : 0;
  const facilitiesWithDropTrailers = Math.round(total * dropRatio);

  let facilitiesWithYms: number;
  if (typeof cov?.legacyYmsFacilityCount === 'number') {
    facilitiesWithYms = cov.legacyYmsFacilityCount;
  } else {
    const rate = LEGACY_YMS_ADOPTION_BY_VERTICAL[pack.account.archetype] ?? 0.3;
    facilitiesWithYms = Math.round(total * rate);
  }
  facilitiesWithYms = Math.max(0, Math.min(facilitiesWithYms, total));

  return {
    asks: {
      totalFacilities: total,
      facilitiesWithYms,
      facilitiesWithDropTrailers,
      // D.T5 — seed from the per-industry margin default, falling back to
      // the generic 1000 when a pack has no roiDefaults authored.
      averageMarginPerShipment: pack.account.roiDefaults?.averageMarginPerShipment ?? 1000,
    },
    assumptions: {
      withYms: {
        dcFtesPerShift: 2,
        dcShifts: 3,
        spotterFtesPerShift: 2,
        spotterShifts: 3,
        shipmentsPerDay: 200,
        avgCycleTimeMinutes: 60,
        annualFteCost: 60000,
      },
      dropsNoYms: {
        dcFtesPerShift: 1,
        dcShifts: 2,
        spotterFtesPerShift: 2,
        spotterShifts: 2,
        shipmentsPerDay: 125,
        avgCycleTimeMinutes: 60,
        annualFteCost: 60000,
      },
      withoutDrops: {
        dcFtesPerShift: 1,
        dcShifts: 1,
        spotterFtesPerShift: 0,
        spotterShifts: 0,
        shipmentsPerDay: 40,
        avgCycleTimeMinutes: 60,
        annualFteCost: 60000,
      },
    },
  };
}

// ── Pack loader (same pattern as /demo/[account]) ─────────────────────────────

async function loadPack(slug: string): Promise<DemoPack | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    const raw = await fs.readFile(file, 'utf8');
    return DemoPackSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

/* G3 — Gallery thumbnail manifest. Static JSON committed at
 *   public/gallery-thumbs/manifest.json
 * Entries: { slug, anchorId, name, lat, lng }. The PNGs are generated
 * by scripts/generate-gallery-thumbs.mjs (server-side, one-shot).
 * Read once at module load; if missing, Tile renders the placeholder. */
type ThumbManifestEntry = { slug: string; anchorId: string; name: string; lat: number; lng: number };
let THUMB_MANIFEST: ThumbManifestEntry[] = [];
try {
  const manifestRaw = readFileSync(
    path.join(process.cwd(), 'public', 'gallery-thumbs', 'manifest.json'),
    'utf8',
  );
  THUMB_MANIFEST = JSON.parse(manifestRaw) as ThumbManifestEntry[];
} catch {
  // Manifest missing → no thumbs → fallback placeholder. Acceptable.
}
const THUMB_BY_SLUG = new Map(THUMB_MANIFEST.map((m) => [m.slug, m]));

function thumbAvailable(slug: string): boolean {
  if (!THUMB_BY_SLUG.has(slug)) return false;
  try {
    return existsSync(
      path.join(process.cwd(), 'public', 'gallery-thumbs', `${slug}.png`),
    );
  } catch {
    return false;
  }
}

/* ── Account directory summary (post-G8 expansion) ──────────────────────────
 *
 * The 11 industry anchors above are the curated hero shelf. Beyond them,
 * every other audited account in public/demo-packs/*.json has a live
 * microsite at /demo/<slug> already — the gallery just never surfaced
 * them. This summary feeds an "All audited accounts" directory below
 * the curated tiles so every audited account becomes browseable.
 *
 * Lightweight by design: we never need full pack data for the directory
 * row (no ROI prefill, no scenario steps, no site-level audit). Load
 * just enough metadata for a name + 3 numbers + an archetype label.
 */
export interface AccountSummary {
  slug: string;
  displayName: string;
  archetype: string;
  siteCount: number;
  /** C.T1 — number of audited sites (pack.network.sites.length). Summed
   *  across all accounts for the hero "facilities audited" subhead. */
  auditedSites: number;
  totalGlobalFootprint: number | null;
  dockDoors: number;
  trailerCapacity: number;
  railServed: number;
  /** F.T5 — surveyed acreage (network.totals.acres), summed for the hero
   *  "acres surveyed" subtotal. */
  acres: number;
  hasThumb: boolean;
}

async function loadAccountSummary(slug: string): Promise<AccountSummary | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    const raw = await fs.readFile(file, 'utf8');
    const result = DemoPackSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    const pack = result.data;
    const cov = pack.account.coverageNote;
    return {
      slug: pack.account.slug,
      displayName: pack.account.displayName,
      archetype: pack.account.archetype,
      siteCount: pack.account.siteCount,
      auditedSites: pack.network.sites.length,
      totalGlobalFootprint: cov?.totalGlobalFootprint ?? cov?.estimatedFootprint ?? null,
      dockDoors: pack.network.totals.dockDoors,
      trailerCapacity: pack.network.totals.trailerCapacity,
      railServed: pack.network.totals.railServed,
      acres: pack.network.totals.acres,
      hasThumb: thumbAvailable(pack.account.slug),
    };
  } catch {
    return null;
  }
}

async function loadAllAccountSummaries(): Promise<AccountSummary[]> {
  // Auto-discover: scan demo-packs dynamically so any new pack
  // committed to public/demo-packs/<slug>.json picks up automatically
  // on next deploy. No hardcoded list to forget to update.
  const packDir = path.join(process.cwd(), 'public', 'demo-packs');
  let entries: string[] = [];
  try {
    entries = await fs.readdir(packDir);
  } catch {
    return [];
  }
  const slugs = entries.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  const summaries = await Promise.all(slugs.map(loadAccountSummary));
  return summaries
    .filter((s): s is AccountSummary => s !== null)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function loadTile(anchor: IndustryAnchor): Promise<GalleryTileData | null> {
  const pack = await loadPack(anchor.slug);
  if (!pack) return null;

  const cov = pack.account.coverageNote;
  const global = cov?.totalGlobalFootprint ?? cov?.estimatedFootprint ?? null;
  const facilityCount = global ?? pack.account.siteCount;
  const facilityCountIsGlobal = global !== null;

  // G3 thumb wiring.
  const hasThumb = thumbAvailable(anchor.slug);
  const thumbEntry = THUMB_BY_SLUG.get(anchor.slug);
  const thumbSrc = hasThumb ? `/gallery-thumbs/${anchor.slug}.png` : undefined;
  const thumbAlt = hasThumb && thumbEntry
    ? `Audited facility — ${pack.account.displayName}: ${thumbEntry.name}`
    : undefined;

  return {
    anchor,
    brand: pack.account.displayName,
    facilityCount,
    facilityCountIsGlobal,
    dockDoors: pack.network.totals.dockDoors,
    trailerCapacity: pack.network.totals.trailerCapacity,
    railServed: pack.network.totals.railServed,
    roiPrefill: buildRoiV2State(pack),
    thumbSrc,
    thumbAlt,
    surprisingFindings: pack.account.surprisingFindings ?? [],
    builtAt: pack.builtAt,
  };
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicShareMetadata({
    title: 'Industry templates · YardFlow YNS',
    description:
      'See what YardFlow returns for your industry. Sample ROI runs and demo templates for major shippers, 3PLs, retailers, and manufacturers.',
    pathname: '/demo',
    imagePath: '/opengraph-image',
    imageAlt: 'YardFlow industry-template gallery',
    noIndex: false,
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

const VALID_ARCHETYPES: ReadonlyArray<Archetype> = ['cpg', 'logistics', 'manufacturing', 'retail', '3pl'];

function readArchetypeFilter(value: string | string[] | undefined): Archetype | null {
  if (!value) return null;
  const v = (Array.isArray(value) ? value[0] : value).toLowerCase().trim();
  return (VALID_ARCHETYPES as readonly string[]).includes(v) ? (v as Archetype) : null;
}

function readDemoFlag(value: string | string[] | undefined): boolean {
  if (!value) return false;
  const v = (Array.isArray(value) ? value[0] : value).toLowerCase().trim();
  return ['1', 'true', 'yes'].includes(v);
}

export default async function DemoGalleryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  /* G5 — Server-side archetype filter. Reads ?archetype=<id>, narrows
   * INDUSTRY_ANCHORS before loadTile fan-out so we don't waste pack
   * reads on filtered-out anchors. Filter passes through to the client
   * Gallery via the `activeArchetype` prop for chip-state rendering. */
  const params = searchParams ? await searchParams : {};
  const activeArchetype = readArchetypeFilter(params.archetype);
  /* Read demo flag server-side so the initial HTML carries the correct
   * filter-chip URLs (with &demo=1 preserved) and the credibility-vs-
   * presenting badge state. Without this the user sees a hydration
   * flash and any chip click before hydration drops demo mode. */
  const initialDemo = readDemoFlag(params.demo);

  /* G8 — Campaign-pin override from Edge Config. If the key
   * `gallery_pinned_slugs` is set, the matching anchors render first
   * in the listed order; the rest keep their insertion-order tail.
   * Fully optional + graceful: returns the unchanged order when not
   * configured. */
  const pinnedSlugs = await readPinnedSlugs();
  const orderedAnchors = applyPinOrder(INDUSTRY_ANCHORS, pinnedSlugs);
  const visibleAnchors = activeArchetype
    ? orderedAnchors.filter((a) => a.archetype === activeArchetype)
    : orderedAnchors;

  /* Load curated tiles (11 industry anchors) and full account directory
   * (every audited pack) in parallel. The directory feeds the "All
   * audited accounts" section that lives below the curated grid. */
  const [tiles, allAccounts] = await Promise.all([
    Promise.all(visibleAnchors.map((anchor) => loadTile(anchor))).then((arr) =>
      arr.filter((t): t is GalleryTileData => t !== null),
    ),
    loadAllAccountSummaries(),
  ]);

  /* C.T1 / F.T5 — network-wide subtotals across every audited account,
   * computed from allAccounts (already loaded) so they are
   * filter-independent: narrowing by archetype never changes them. */
  const facilitiesAudited = allAccounts.reduce((sum, a) => sum + a.auditedSites, 0);
  const totalDockDoors = allAccounts.reduce((sum, a) => sum + a.dockDoors, 0);
  const totalAcres = allAccounts.reduce((sum, a) => sum + a.acres, 0);

  /* F.T8 — optional "audits this quarter" counter from Edge Config.
   * Null (and the hero line is omitted) when unset or unreachable. */
  const auditsThisQuarter = await readAuditsThisQuarter();

  return (
    <>
      {/*
       * Tracker uses a pseudo-account ("gallery") because the snapshot
       * schema requires `accountSlug` + `accountName`. The /demo gallery
       * is account-agnostic; downstream consumers can detect it via path
       * === '/demo' or accountSlug === 'gallery'.
       */}
      <MicrositeTracker
        accountName="Industry Gallery"
        accountSlug="gallery"
        path="/demo"
        variantSlug="gallery-pageview"
      />
      <Gallery
        tiles={tiles}
        activeArchetype={activeArchetype}
        totalTiles={INDUSTRY_ANCHORS.length}
        initialDemo={initialDemo}
        allAccounts={allAccounts}
        facilitiesAudited={facilitiesAudited}
        totalDockDoors={totalDockDoors}
        totalAcres={totalAcres}
        auditsThisQuarter={auditsThisQuarter}
      />
    </>
  );
}
