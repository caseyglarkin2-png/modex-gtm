'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { IndustryAnchor } from '@/lib/demo/industry-tags';

/**
 * Sprint 2.5 — Industry-template gallery surface.
 * Redesigned 2026-05-29 — dark/neon "operator's network console"
 *
 * Client component because the "Run [Industry] ROI" CTA writes a
 * pre-fill payload to `localStorage['roi-v2-state']` before navigating
 * to yardflow.ai/roi — same D8.1 hand-off the in-demo RoiCtaButton uses.
 *
 * Aesthetic: matches the YardFlow hub (yardflow.ai/). Dark void
 * background, neon-cyan accents, monospace metrics. Each tile reads as
 * a facility readout in a network operations console, not a marketing
 * card. The 4 metrics (Facilities / Dock doors / Trailer spots /
 * Rail-served) are the dominant visual element — math first, prose
 * second.
 */

const ROI_STATE_KEY = 'roi-v2-state';
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

/* ═══════════════════════════════════════════════════════════════
   Gallery — top-level layout.
   Layered backdrop matches yardflow.ai/hub: radial neon washes
   over void, plus a dual-axis grid masked to a radial center.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Read `?demo=1` from the current URL. When a sales rep bookmarks
 * `yardflow.ai/demo?demo=1` (or `&demo=1` on a deep link), we want the
 * demo-mode flag to follow them through every CTA on this surface
 * — Run [Industry] ROI, View Template, hero "Run a Sample ROI" — so
 * trackers stay silenced for the entire demo session instead of just
 * the landing.
 *
 * Read via window.location (deferred to after mount) instead of
 * useSearchParams() so the gallery does not require a Suspense
 * boundary in the page tree. Returns the suffix to append
 * (`&demo=1` or `''`). Inert for plain prospect traffic.
 */
function useDemoSuffix(): string {
  const [suffix, setSuffix] = useState('');
  useEffect(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('demo');
      if (!v) return;
      const t = v.trim().toLowerCase();
      if (['1', 'true', 'yes'].includes(t)) setSuffix('&demo=1');
    } catch {
      // location/search unavailable — leave suffix empty.
    }
  }, []);
  return suffix;
}

export function Gallery({ tiles }: GalleryProps) {
  const demoSuffix = useDemoSuffix();
  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#050505] text-white"
      style={{
        // Apply Mona Sans (loaded by the root layout as --font-memo-sans)
        // so prose inherits a proper operator sans. The Tailwind
        // `font-mono` utility resolves to system mono — SF Mono on macOS,
        // Consolas on Windows — which reads operator-grade on every OS.
        fontFamily:
          'var(--font-memo-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Fixed atmospheric backdrop — matches /hub aesthetic exactly. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            'radial-gradient(ellipse 1000px 600px at 20% 10%, rgba(0, 180, 255, 0.08), transparent 60%)',
            'radial-gradient(ellipse 800px 500px at 80% 80%, rgba(192, 140, 255, 0.04), transparent 60%)',
          ].join(','),
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden md:block"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(0, 180, 255, 0.06) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(0, 180, 255, 0.06) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 80%)',
        }}
      />

      <div className="relative z-[1] flex flex-1 flex-col">
        <Hero count={tiles.length} demoSuffix={demoSuffix} />
        <main
          className="mx-auto w-full max-w-[1280px] flex-1 px-6 pb-24 max-[480px]:px-[18px]"
          data-ms-section-id="gallery-grid"
        >
          <div
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            role="list"
            aria-label="Industry templates"
          >
            {tiles.map((tile, i) => (
              <Tile
                key={tile.anchor.id}
                tile={tile}
                index={i + 1}
                total={tiles.length}
                demoSuffix={demoSuffix}
              />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Hero — terse, math-first.
   No marketing copy, no chips, no bullets. Just: eyebrow, headline
   with neon span, single supporting line, one CTA.
   ═══════════════════════════════════════════════════════════════ */

function Hero({ count, demoSuffix }: { count: number; demoSuffix: string }) {
  return (
    <header
      className="border-b border-[#00B4FF]/[0.10] backdrop-blur-[2px]"
      data-ms-section-id="gallery-hero"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 pb-12 pt-20 max-[480px]:px-[18px] max-[480px]:pt-14 md:pt-24">
        {/* Eyebrow: pulsing neon dot + mono caps, tracked-out. */}
        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.30em] text-[#00B4FF]/85 max-[480px]:text-[10px] max-[480px]:tracking-[0.22em]">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#00C878] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00C878]" />
          </span>
          <span>One Network · {count} Industry Archetypes · Live</span>
        </div>

        {/* H1 — wins the page. Black weight, tight tracking, neon span. */}
        <h1 className="mt-5 max-w-[920px] font-black leading-[1.04] tracking-[-0.04em] text-[clamp(40px,6vw,72px)] [text-wrap:balance] max-[480px]:mt-4 max-[480px]:text-[clamp(36px,9vw,52px)]">
          Pick your industry.
          <br />
          See{' '}
          <span className="text-[#00B4FF]" style={{ textShadow: '0 0 32px rgba(0, 180, 255, 0.30)' }}>
            your numbers.
          </span>
        </h1>

        {/* Body — single line, steel, no fluff. */}
        <p className="mt-5 max-w-[660px] text-[16px] leading-[1.55] text-white/[0.72] max-[480px]:text-[15px]">
          Each template runs the YardFlow protocol against an audited prospect&apos;s
          facility data. The numbers below are real — public satellite imagery,
          modeled geofences, classification rubric.
        </p>

        {/* Single CTA. The per-tile CTAs do the heavy lifting. */}
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <a
            href={`${MICROSITE_BASE}/roi?source=demo-gallery${demoSuffix}`}
            target="_blank"
            rel="noopener noreferrer"
            data-ms-cta-id="gallery-hero-run-roi"
            className="group inline-flex min-h-[52px] items-center gap-2 rounded-[12px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-5 text-[14px] font-bold tracking-[0.01em] text-white outline-none transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_28px_rgba(0,180,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00B4FF]"
            style={{
              boxShadow:
                '0 0 0 1px rgba(0, 180, 255, 0.18) inset, 0 10px 28px rgba(0, 0, 0, 0.40), 0 0 22px rgba(0, 180, 255, 0.18)',
            }}
          >
            Run a Sample ROI
            <ArrowRight className="transition-transform group-hover:translate-x-[3px]" />
          </a>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
            or pick an industry below
          </span>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tile — facility readout.
   Metric grid is the hero. Brand and blurb are intentionally
   small. Hover state energizes the card border + glow.
   ═══════════════════════════════════════════════════════════════ */

function Tile({
  tile,
  index,
  total,
  demoSuffix,
}: {
  tile: GalleryTileData;
  index: number;
  total: number;
  demoSuffix: string;
}) {
  const { anchor, brand, facilityCount, facilityCountIsGlobal, dockDoors, trailerCapacity, railServed, roiPrefill } = tile;

  const roiHref = `${MICROSITE_BASE}/roi?source=demo-gallery&industry=${encodeURIComponent(anchor.id)}&pack=${encodeURIComponent(anchor.slug)}${demoSuffix}`;
  const templateHref = `/demo/${anchor.slug}?from=gallery${demoSuffix}`;
  const counter = `${String(index).padStart(2, '0')}/${String(total).padStart(2, '0')}`;

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
      className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[#00B4FF]/[0.16] p-5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] hover:border-[#00B4FF]/[0.50] hover:shadow-[0_24px_64px_rgba(0,0,0,0.40),0_0_40px_rgba(0,180,255,0.18)]"
      role="listitem"
      data-ms-section-id={`gallery-tile-${anchor.id}`}
      style={{
        background:
          'linear-gradient(180deg, rgba(17, 19, 24, 0.92), rgba(10, 12, 16, 0.92))',
      }}
    >
      {/* Top divider — terminal-thin gradient line, just a hairline of neon. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.28), transparent)',
        }}
      />

      {/* Header row: counter (left) + industry chip with status dot (right). */}
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
          {counter}
        </span>
        <span className="inline-flex items-center gap-[6px] font-mono text-[10px] font-semibold uppercase tracking-[0.20em] text-[#00B4FF]/80">
          <span
            className="inline-block h-[5px] w-[5px] rounded-full bg-[#00B4FF]"
            style={{ boxShadow: '0 0 6px rgba(0, 180, 255, 0.7)' }}
          />
          {anchor.label}
        </span>
      </div>

      {/* Brand wordmark — secondary to the metrics below. */}
      <h2 className="mt-4 text-[20px] font-bold tracking-[-0.015em] leading-[1.15] text-white">
        {brand}
      </h2>

      {/* Blurb — small, steel, clamped so the layout stays tight. */}
      <p className="mt-2 line-clamp-2 text-[12.5px] leading-[1.55] text-white/[0.55]">
        {anchor.blurb}
      </p>

      {/* Metric readout — the hero of the card. Big mono numbers, mono caps labels. */}
      <dl
        className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-[#00B4FF]/[0.10] pt-5"
        aria-label={`Network audit metrics for ${brand}`}
      >
        <Metric label="Facilities" value={facilityCount.toLocaleString()} sliced={!facilityCountIsGlobal} />
        <Metric label="Dock doors" value={dockDoors.toLocaleString()} />
        <Metric label="Trailer spots" value={trailerCapacity.toLocaleString()} />
        <Metric label="Rail-served" value={railServed.toString()} />
      </dl>

      {/* CTA cluster — primary neon-filled, secondary neon-outlined. */}
      <div className="mt-6 flex flex-1 items-end gap-2">
        <a
          href={roiHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleRoiClick}
          data-ms-cta-id={`gallery-run-roi-${anchor.id}`}
          data-ms-cta-industry={anchor.id}
          data-ms-cta-pack={anchor.slug}
          className="group/cta inline-flex min-h-[44px] flex-1 items-center justify-center gap-[6px] rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.10] px-3 text-center text-[13px] font-bold tracking-[0.01em] text-white outline-none transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_22px_rgba(0,180,255,0.32)] focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-[#00B4FF]"
          style={{
            boxShadow:
              '0 0 0 1px rgba(0, 180, 255, 0.16) inset, 0 6px 18px rgba(0, 0, 0, 0.35)',
          }}
        >
          <span className="truncate">Run {anchor.label} ROI</span>
          <ArrowRight className="transition-transform group-hover/cta:translate-x-[3px]" />
        </a>
        <Link
          href={templateHref}
          data-ms-cta-id={`gallery-view-template-${anchor.id}`}
          data-ms-cta-industry={anchor.id}
          data-ms-cta-pack={anchor.slug}
          className="group/cta inline-flex min-h-[44px] flex-1 items-center justify-center gap-[6px] rounded-[10px] border border-white/15 bg-transparent px-3 text-center text-[13px] font-semibold tracking-[0.01em] text-white/85 outline-none transition-all hover:border-[#00B4FF]/55 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-[#00B4FF]"
        >
          <span>View Template</span>
          <ArrowRight className="transition-transform group-hover/cta:translate-x-[3px]" />
        </Link>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Metric — single (label, value) cell inside a tile.
   Mono everything, tabular-nums for clean alignment between
   tiles when stacked vertically.
   ═══════════════════════════════════════════════════════════════ */

function Metric({ label, value, sliced = false }: { label: string; value: string; sliced?: boolean }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </dt>
      <dd className="flex items-baseline gap-1 font-mono text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums text-white transition-colors duration-200 group-hover:text-[#00B4FF] max-[480px]:text-[22px]">
        {value}
        {sliced ? (
          <span
            aria-hidden
            className="text-[14px] font-bold text-[#FF2A00]/80"
            title="Audited slice — full network may be larger"
          >
            *
          </span>
        ) : null}
      </dd>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Footer — terse legal + caveats.
   Same dark treatment, mono everything.
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="border-t border-[#00B4FF]/[0.10] px-6 py-8 max-[480px]:px-[18px]">
      <div className="mx-auto w-full max-w-[1280px] space-y-3">
        <p className="text-[12.5px] leading-[1.6] text-white/[0.55]">
          Templates render from actual prospect audit data — public satellite
          imagery, Street-View probes, geofences modeled by YardFlow. Your
          demo would reflect <span className="text-white">your</span> facilities,
          your archetype mix, and your network shape.
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          <span className="text-[#FF2A00]/70">*</span> audited slice — full
          network footprint quoted where global counts are available.
          {' · '}
          <span className="text-white/55">YardFlow YNS · industry templates</span>
        </p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ArrowRight — inline SVG icon, no external dependency.
   The 4px circle on the tail mirrors the hub's FlowArrow.
   ═══════════════════════════════════════════════════════════════ */

function ArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M4 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="12" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
