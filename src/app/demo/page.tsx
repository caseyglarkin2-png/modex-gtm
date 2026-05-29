import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { DemoPackSchema, type DemoPack } from '@/lib/demo/pack-schema';
import { INDUSTRY_ANCHORS, type IndustryAnchor, type Archetype } from '@/lib/demo/industry-tags';
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
      averageMarginPerShipment: 1000,
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

async function loadTile(anchor: IndustryAnchor): Promise<GalleryTileData | null> {
  const pack = await loadPack(anchor.slug);
  if (!pack) return null;

  const cov = pack.account.coverageNote;
  const global = cov?.totalGlobalFootprint ?? cov?.estimatedFootprint ?? null;
  const facilityCount = global ?? pack.account.siteCount;
  const facilityCountIsGlobal = global !== null;

  return {
    anchor,
    brand: pack.account.displayName,
    facilityCount,
    facilityCountIsGlobal,
    dockDoors: pack.network.totals.dockDoors,
    trailerCapacity: pack.network.totals.trailerCapacity,
    railServed: pack.network.totals.railServed,
    roiPrefill: buildRoiV2State(pack),
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
  const visibleAnchors = activeArchetype
    ? INDUSTRY_ANCHORS.filter((a) => a.archetype === activeArchetype)
    : INDUSTRY_ANCHORS;

  const tiles = (
    await Promise.all(visibleAnchors.map((anchor) => loadTile(anchor)))
  ).filter((t): t is GalleryTileData => t !== null);

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
      <Gallery tiles={tiles} activeArchetype={activeArchetype} totalTiles={INDUSTRY_ANCHORS.length} />
    </>
  );
}
