'use client';

import Link from 'next/link';
import type { IndustryAnchor } from '@/lib/demo/industry-tags';

/**
 * Sprint 2.5 — Industry-template gallery surface.
 *
 * Client component because the "Run [Industry] ROI" CTA writes a
 * pre-fill payload to `localStorage['roi-v2-state']` before navigating
 * to yardflow.ai/roi — same D8.1 hand-off the in-demo RoiCtaButton uses.
 * Server-side we read each pack's roi-relevant numbers and pass them
 * through as the `roiPrefill` blob; the click handler just stringifies
 * and writes.
 *
 * Aesthetic: matches the stone/white palette of DemoSurface so the
 * jump from /demo to /demo/<slug> feels continuous.
 */

const ROI_STATE_KEY = 'roi-v2-state';
const ROI_URL = 'https://yardflow.ai/roi/';
const MICROSITE_BASE = process.env.NEXT_PUBLIC_MICROSITE_BASE_URL || 'https://yardflow.ai';

// ── Pre-fill shape — kept in lockstep with src/components/demo/roi-cta-button.tsx ──
interface ArchetypeAssumptions {
  dcFtesPerShift: number;
  dcShifts: number;
  spotterFtesPerShift: number;
  spotterShifts: number;
  shipmentsPerDay: number;
  avgCycleTimeMinutes: number;
  annualFteCost: number;
}

interface RoiV2State {
  asks: {
    totalFacilities: number;
    facilitiesWithYms: number;
    facilitiesWithDropTrailers: number;
    averageMarginPerShipment: number;
  };
  assumptions: {
    withYms: ArchetypeAssumptions;
    dropsNoYms: ArchetypeAssumptions;
    withoutDrops: ArchetypeAssumptions;
  };
}

export interface GalleryTileData {
  anchor: IndustryAnchor;
  /** From pack.account.displayName — the wordmark text shown on the tile. */
  brand: string;
  /** From pack.account.coverageNote.totalGlobalFootprint ?? estimatedFootprint ?? siteCount. */
  facilityCount: number;
  /** Whether the facilityCount is the global footprint (vs the audit slice). */
  facilityCountIsGlobal: boolean;
  /** Total dock doors from the audited network. */
  dockDoors: number;
  /** Trailer-spot total. */
  trailerCapacity: number;
  /** Number of rail-served sites in the audit slice. */
  railServed: number;
  /** RoiV2State pre-fill, computed server-side from the pack. */
  roiPrefill: RoiV2State;
}

interface GalleryProps {
  tiles: GalleryTileData[];
}

export function Gallery({ tiles }: GalleryProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Hero />
      <main
        className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-10"
        data-ms-section-id="gallery-grid"
      >
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
          role="list"
          aria-label="Industry templates"
        >
          {tiles.map((tile) => (
            <Tile key={tile.anchor.id} tile={tile} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <header className="border-b border-stone-200 bg-stone-50">
      <div
        className="mx-auto max-w-6xl px-5 py-12 md:py-16"
        data-ms-section-id="gallery-hero"
      >
        <div className="text-[10px] uppercase tracking-widest text-stone-500">
          Industry Templates
        </div>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-stone-900 md:text-4xl">
          See what YardFlow returns for your industry&apos;s operators.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-stone-600">
          Each template runs the full protocol against a real prospect&apos;s
          facility data. Open one to see what a YardFlow rollout looks like
          for your industry.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={`${MICROSITE_BASE}/roi?source=demo-gallery`}
            target="_blank"
            rel="noopener noreferrer"
            data-ms-cta-id="gallery-hero-run-roi"
            className="inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stone-700"
          >
            Run a Sample ROI →
          </a>
          <span className="text-xs text-stone-500">
            Or pick an industry below to pre-fill the calculator with that
            archetype&apos;s network shape.
          </span>
        </div>
      </div>
    </header>
  );
}

function Tile({ tile }: { tile: GalleryTileData }) {
  const { anchor, brand, facilityCount, facilityCountIsGlobal, dockDoors, trailerCapacity, railServed, roiPrefill } = tile;

  const roiHref = `${MICROSITE_BASE}/roi?source=demo-gallery&industry=${encodeURIComponent(anchor.id)}&pack=${encodeURIComponent(anchor.slug)}`;
  const templateHref = `/demo/${anchor.slug}?from=gallery`;

  function handleRoiClick() {
    // D8.1-pattern hand-off: write to same-origin localStorage on
    // yardflow.ai before the anchor navigates. The V2 calculator's
    // mount-time hydrate sees the pre-fill and boots with this
    // industry's numbers instead of the default.
    try {
      window.localStorage.setItem(ROI_STATE_KEY, JSON.stringify(roiPrefill));
    } catch {
      // localStorage unavailable — calculator falls back to defaults.
      // URL params (industry/pack) still flow through for attribution.
    }
  }

  return (
    <article
      className="group flex flex-col rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md"
      role="listitem"
      data-ms-section-id={`gallery-tile-${anchor.id}`}
    >
      <div className="text-[10px] uppercase tracking-widest text-stone-500">
        {anchor.label}
      </div>
      <h2 className="mt-2 text-lg font-semibold leading-tight text-stone-900">
        {brand}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-stone-600">{anchor.blurb}</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-stone-100 pt-4 text-xs">
        <div>
          <dt className="text-stone-500">Facilities</dt>
          <dd className="mt-0.5 tabular-nums text-stone-900">
            {facilityCount.toLocaleString()}
            {facilityCountIsGlobal ? '' : '*'}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Dock doors</dt>
          <dd className="mt-0.5 tabular-nums text-stone-900">
            {dockDoors.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Trailer spots</dt>
          <dd className="mt-0.5 tabular-nums text-stone-900">
            {trailerCapacity.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Rail-served</dt>
          <dd className="mt-0.5 tabular-nums text-stone-900">{railServed}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-1 items-end gap-2">
        <a
          href={roiHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleRoiClick}
          data-ms-cta-id={`gallery-run-roi-${anchor.id}`}
          data-ms-cta-industry={anchor.id}
          data-ms-cta-pack={anchor.slug}
          className="flex-1 rounded-md bg-stone-900 px-3 py-2 text-center text-xs font-medium text-white shadow-sm transition hover:bg-stone-700"
        >
          Run {anchor.label} ROI →
        </a>
        <Link
          href={templateHref}
          data-ms-cta-id={`gallery-view-template-${anchor.id}`}
          data-ms-cta-industry={anchor.id}
          data-ms-cta-pack={anchor.slug}
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-center text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-900"
        >
          View Template →
        </Link>
      </div>
    </article>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50 px-5 py-6">
      <div className="mx-auto max-w-6xl text-xs text-stone-600">
        <p>
          These templates are rendered from actual prospect audit data
          (public satellite + Street-View imagery, geofences modeled by
          YardFlow). Your demo would reflect <strong>your</strong> facilities,
          your archetype mix, and your network shape.
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-stone-400">
          * audited slice — full network footprint quoted where global counts are
          available. YardFlow YNS · industry templates.
        </p>
      </div>
    </footer>
  );
}
