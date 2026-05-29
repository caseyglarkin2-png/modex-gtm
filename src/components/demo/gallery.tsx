'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Archetype, IndustryAnchor } from '@/lib/demo/industry-tags';
import { ARCHETYPE_LABELS_TOP, INDUSTRY_ANCHORS } from '@/lib/demo/industry-tags';

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

/* Sprint G9 — Audit-grade disclosure constant. Used twice:
 *   - Gallery hero badge below the H1 (replaces footer-burying the
 *     credibility line; visible above the fold so it lands before the
 *     prospect parses tiles)
 *   - Footer (abbreviated version)
 * When ?demo=1 is on the URL, the hero badge is swapped for a
 * "PRESENTING TO PROSPECT" tag so the rep doesn't see legalese during
 * a meeting. */
const AUDIT_GRADE_DISCLOSURE =
  'Templates render from real prospect audit data — public satellite imagery, modeled geofences, 22-field rubric.';

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
  /** G3 — Optional satellite thumbnail path under /gallery-thumbs/<slug>.png.
   *  Server-supplied when the manifest at public/gallery-thumbs/manifest.json
   *  lists the slug AND the PNG exists. Tile renders the thumb when set,
   *  otherwise falls back to the neon-grid placeholder. */
  thumbSrc?: string;
  /** G3 — Alt text composer for the satellite thumb. Format:
   *  "Audited facility — {brand} in {city}, {state}". */
  thumbAlt?: string;
}

/** Lightweight account summary for the "All audited accounts" directory
 *  below the curated industry tiles. Shape mirrors AccountSummary from
 *  app/demo/page.tsx — kept duplicated here to avoid coupling a client
 *  component to a server-component module. If the shape drifts, update
 *  both. */
export interface AccountSummary {
  slug: string;
  displayName: string;
  archetype: string;
  siteCount: number;
  totalGlobalFootprint: number | null;
  dockDoors: number;
  trailerCapacity: number;
  railServed: number;
  hasThumb: boolean;
}

interface GalleryProps {
  tiles: GalleryTileData[];
  /** Active archetype filter from ?archetype=<id> URL param. Null = "All". (G5) */
  activeArchetype?: Archetype | null;
  /** Total tile count across all archetypes (for "showing N of M" caption). (G5) */
  totalTiles?: number;
  /** Server-read ?demo=1 flag. Threaded so the first paint carries demo state
   *  (filter-chip URLs, credibility badge swap, demo pill) without a
   *  hydration flash. (G5+G6+G9 fix.) */
  initialDemo?: boolean;
  /** Every audited account in public/demo-packs (loaded dynamically in
   *  page.tsx). Powers the "All audited accounts" directory below the
   *  curated 11-tile grid. */
  allAccounts?: AccountSummary[];
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
 * — Open the calculator, Run [Industry] ROI, View Template, filter
 * chips — so trackers stay silenced for the entire demo session.
 *
 * Initializes from a server-supplied prop so the very first paint of
 * the gallery (filter-chip hrefs, credibility-vs-presenting badge,
 * demo pill) is correct. Re-reads from `window.location.search` on
 * mount as a defensive fallback if the server pass was missed or the
 * URL changed via SPA routing.
 */
function useDemoSuffix(initialDemo: boolean): string {
  const [suffix, setSuffix] = useState<string>(initialDemo ? '&demo=1' : '');
  useEffect(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('demo');
      if (!v) return;
      const t = v.trim().toLowerCase();
      if (['1', 'true', 'yes'].includes(t)) setSuffix('&demo=1');
    } catch {
      // location/search unavailable — leave suffix as initial.
    }
  }, []);
  return suffix;
}

export function Gallery({ tiles, activeArchetype = null, totalTiles, initialDemo = false, allAccounts = [] }: GalleryProps) {
  const demoSuffix = useDemoSuffix(initialDemo);
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

      {/* G6 — Demo Mode pill + Reset button, only when ?demo=1. */}
      {demoSuffix.length > 0 ? <DemoPill /> : null}

      <div className="relative z-[1] flex flex-1 flex-col">
        <Hero count={totalTiles ?? tiles.length} demoSuffix={demoSuffix} />
        <main
          className="mx-auto w-full max-w-[1280px] flex-1 px-6 pb-24 max-[480px]:px-[18px]"
          data-ms-section-id="gallery-grid"
        >
          {/* G5 — Archetype filter rail. WAI-ARIA toolbar with roving
              focus. Each chip is a Link that preserves &demo=1. */}
          <ArchetypeFilterRail
            active={activeArchetype}
            demoSuffix={demoSuffix}
            visibleCount={tiles.length}
            totalCount={totalTiles ?? tiles.length}
          />
          {tiles.length > 0 ? (
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
          ) : (
            <EmptyFilterState demoSuffix={demoSuffix} />
          )}
        </main>
        {allAccounts.length > 0 ? (
          <AllAuditedDirectory accounts={allAccounts} demoSuffix={demoSuffix} />
        ) : null}
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
  const isDemo = demoSuffix.length > 0;
  return (
    <header
      className="border-b border-[#00B4FF]/[0.10] backdrop-blur-[2px]"
      data-ms-section-id="gallery-hero"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 pb-12 pt-20 max-[480px]:px-[18px] max-[480px]:pt-14 md:pt-24">
        {/* Eyebrow: pulsing neon dot + mono caps, tracked-out.
            G6.T1b — animate-ping wrapped in motion-safe per the
            reduced-motion guard. */}
        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.30em] text-[#00B4FF]/85 max-[480px]:text-[10px] max-[480px]:tracking-[0.22em]">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="motion-safe:animate-ping absolute inset-0 rounded-full bg-[#00C878] opacity-75" />
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

        {/* G9 — Audit-grade credibility badge. Lives above the fold so
            the prospect knows the data is real before they parse any
            tile. Swapped for a rep-facing tag when ?demo=1. */}
        {isDemo ? (
          <div
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#FF2A00]/[0.40] bg-[#FF2A00]/[0.08] px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.20em] text-[#FF2A00]"
            data-credibility-signal=""
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF2A00]" />
            Presenting to prospect
          </div>
        ) : (
          <div
            className="mt-5 inline-flex max-w-[640px] items-start gap-2 rounded-[10px] border border-[#00B4FF]/[0.20] bg-[#00B4FF]/[0.04] px-3 py-2 text-[12.5px] leading-[1.45] text-white/75"
            data-credibility-signal=""
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden className="mt-[2px] shrink-0 text-[#00B4FF]">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
            </svg>
            <span>
              <span className="text-white/90">{AUDIT_GRADE_DISCLOSURE}</span>
            </span>
          </div>
        )}

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
            data-ms-cta-id="gallery-hero-open-calculator"
            className="group inline-flex min-h-[52px] items-center gap-2 rounded-[12px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-5 text-[14px] font-bold tracking-[0.01em] text-white outline-none transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_28px_rgba(0,180,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00B4FF]"
            style={{
              boxShadow:
                '0 0 0 1px rgba(0, 180, 255, 0.18) inset, 0 10px 28px rgba(0, 0, 0, 0.40), 0 0 22px rgba(0, 180, 255, 0.18)',
            }}
          >
            Open the calculator
            <ArrowRight className="transition-transform group-hover:translate-x-[3px]" />
          </a>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
            or jump to your industry
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
  const { anchor, brand, facilityCount, facilityCountIsGlobal, dockDoors, trailerCapacity, railServed, roiPrefill, thumbSrc, thumbAlt } = tile;

  const roiHref = `${MICROSITE_BASE}/roi?source=demo-gallery&industry=${encodeURIComponent(anchor.id)}&pack=${encodeURIComponent(anchor.slug)}${demoSuffix}`;
  const templateHref = `/demo/${anchor.slug}?from=gallery${demoSuffix}`;
  const counter = `${String(index).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
  const isFirstTile = index === 1;

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
      {/* G3 — Satellite anchor thumbnail. 16:10 above the brand. Fallback
          to a neon-grid placeholder when the thumb is missing. First tile
          gets priority + decoding=sync per LCP rule (G3.T7). */}
      {thumbSrc ? (
        <div className="-mx-5 -mt-5 mb-4 relative aspect-[16/10] overflow-hidden border-b border-[#00B4FF]/[0.16]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt={thumbAlt ?? `Audited facility for ${brand}`}
            width={640}
            height={400}
            loading={isFirstTile ? 'eager' : 'lazy'}
            decoding={isFirstTile ? 'sync' : 'async'}
            fetchPriority={isFirstTile ? 'high' : 'auto'}
            className="h-full w-full object-cover"
          />
          {/* Bottom-gradient overlay for caption legibility. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
            style={{
              background: 'linear-gradient(180deg, transparent, rgba(5, 5, 5, 0.85))',
            }}
          />
          <span className="absolute bottom-2 left-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.20em] text-white/90">
            Audited facility
          </span>
        </div>
      ) : (
        <div
          aria-hidden
          className="-mx-5 -mt-5 mb-4 relative aspect-[16/10] overflow-hidden border-b border-[#00B4FF]/[0.16]"
          style={{
            background: [
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0, 180, 255, 0.10), transparent 70%)',
              'linear-gradient(rgba(0, 180, 255, 0.06) 1px, transparent 1px) 0 0/24px 24px',
              'linear-gradient(90deg, rgba(0, 180, 255, 0.06) 1px, transparent 1px) 0 0/24px 24px',
              'linear-gradient(180deg, #0a0c10, #050505)',
            ].join(','),
          }}
        >
          <span className="absolute bottom-2 left-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.20em] text-white/55">
            Audit imagery pending
          </span>
        </div>
      )}

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
  /* G9 — abbreviated. Hero badge carries the full audit-grade
     disclosure; this footer just confirms your demo reflects your
     network plus the legal caveat on the asterisk. */
  return (
    <footer className="border-t border-[#00B4FF]/[0.10] px-6 py-8 max-[480px]:px-[18px]">
      <div className="mx-auto w-full max-w-[1280px] space-y-3">
        <p className="text-[12.5px] leading-[1.6] text-white/[0.55]">
          Your demo would reflect <span className="text-white">your</span> facilities,
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
   DemoPill — G6. Floating "DEMO · LIVE" badge top-right + "Reset
   Demo" button bottom-left. Mounted only when ?demo=1 is on URL.
   Reset strips ?demo= + ?pack= from the URL and reloads.
   ═══════════════════════════════════════════════════════════════ */

function DemoPill() {
  function onReset() {
    try {
      const url = new URL(window.location.href);
      ['demo', 'pack'].forEach((k) => url.searchParams.delete(k));
      // G6.T6 — fire the demo-mode-shown event via internal sink, NOT
      // HubSpot. Same pattern as DemoBanner on the hub.
      window.dispatchEvent(
        new CustomEvent('yf:event', {
          detail: {
            name: 'gallery_demo_mode_reset',
            props: {},
            sink: 'internal',
          },
        }),
      );
      window.location.href = url.pathname + (url.search || '');
    } catch {
      window.location.href = '/demo';
    }
  }

  // Fire the impression event once on mount.
  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent('yf:event', {
          detail: {
            name: 'gallery_demo_mode_shown',
            props: {},
            sink: 'internal',
          },
        }),
      );
    } catch {
      // swallow
    }
  }, []);

  return (
    <>
      {/* Top-right LIVE pill. */}
      <div
        data-demo-pill=""
        role="status"
        aria-label="Demo mode active"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
        className="fixed top-2 right-2 z-[60] flex items-center gap-2 rounded-full border border-[#00B4FF]/40 bg-[#050505]/80 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-md max-[480px]:text-[9.5px] max-[480px]:tracking-[0.15em] max-[480px]:px-2.5 max-[480px]:py-1"
      >
        <span className="relative inline-flex h-2 w-2">
          <span className="motion-safe:animate-ping absolute inset-0 rounded-full bg-[#00C878] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00C878]" />
        </span>
        <span className="text-[#00B4FF]">Demo</span>
        <span>·</span>
        <span>Live</span>
      </div>

      {/* Bottom-left Reset button. */}
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset demo mode"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
          left: 'calc(env(safe-area-inset-left, 0px) + 14px)',
        }}
        className="fixed z-[60] inline-flex h-10 items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85 shadow-[0_6px_18px_rgba(0,0,0,0.5)] backdrop-blur-md hover:border-[#00B4FF]/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-[#00B4FF]"
      >
        <span aria-hidden>×</span>
        <span>Reset Demo</span>
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ArchetypeFilterRail — G5.
   WAI-ARIA toolbar with roving tabindex. Renders 6 chips:
   All / CPG / Logistics / Manufacturing / Retail / 3PL.
   Each chip is a Link that preserves &demo=1 + &source= +
   &pack= via passthrough on the active URL.
   Active chip uses neon-filled state, inactive uses neon-outlined.
   ═══════════════════════════════════════════════════════════════ */

const FILTER_ORDER: ReadonlyArray<Archetype> = ['cpg', 'logistics', 'manufacturing', 'retail', '3pl'];

function ArchetypeFilterRail({
  active,
  demoSuffix,
  visibleCount,
  totalCount,
}: {
  active: Archetype | null;
  demoSuffix: string;
  visibleCount: number;
  totalCount: number;
}) {
  const [otherParams, setOtherParams] = useState<string>('');

  // Read source / pack / industry from URL once after mount so chip
  // links preserve attribution. demoSuffix is already factored in.
  useEffect(() => {
    try {
      const url = new URLSearchParams(window.location.search);
      const passthrough: string[] = [];
      for (const k of ['source', 'pack', 'industry']) {
        const v = url.get(k);
        if (v) passthrough.push(`${k}=${encodeURIComponent(v)}`);
      }
      setOtherParams(passthrough.length ? '&' + passthrough.join('&') : '');
    } catch {
      // swallow
    }
  }, []);

  // demoSuffix starts with '&' when active; ensure URL builder reads
  // it as a query-string continuation only after the archetype param.
  const demoForUrl = demoSuffix; // already '&demo=1' or '';
  const buildHref = (id: Archetype | null) => {
    if (id === null) {
      // "All" chip: strip archetype but keep demo + passthrough.
      const stripped = demoForUrl.replace(/^&/, '?') + otherParams;
      return `/demo${stripped.length > 0 ? stripped : ''}`;
    }
    return `/demo?archetype=${encodeURIComponent(id)}${demoForUrl}${otherParams}`;
  };

  function onClickAnalytics(id: Archetype | null) {
    try {
      window.dispatchEvent(
        new CustomEvent('yf:event', {
          detail: {
            name: 'gallery_filter_change',
            props: { archetype: id ?? 'all' },
          },
        }),
      );
    } catch {
      // swallow
    }
  }

  const allChips: Array<{ id: Archetype | null; label: string }> = [
    { id: null, label: 'All' },
    ...FILTER_ORDER.map((id) => ({ id, label: ARCHETYPE_LABELS_TOP[id] })),
  ];

  return (
    <div className="mb-6 flex flex-col gap-3" data-ms-section-id="gallery-filter">
      <div
        role="toolbar"
        aria-label="Filter templates by archetype"
        aria-orientation="horizontal"
        className="-mx-1 flex snap-x snap-mandatory overflow-x-auto px-1 py-1"
      >
        {allChips.map((chip) => {
          const isActive = chip.id === active;
          return (
            <Link
              key={chip.id ?? 'all'}
              href={buildHref(chip.id)}
              data-ms-cta-id={`gallery-filter-${chip.id ?? 'all'}`}
              prefetch={false}
              tabIndex={isActive ? 0 : -1}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onClickAnalytics(chip.id)}
              className={`shrink-0 snap-start rounded-full border px-4 py-2 font-mono text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors max-[480px]:text-[12px] mr-2 last:mr-0 ${
                isActive
                  ? 'border-[#00B4FF]/65 bg-[#00B4FF]/[0.20] text-white shadow-[0_0_24px_rgba(0,180,255,0.22)]'
                  : 'border-white/30 bg-transparent text-white/85 hover:border-[#00B4FF]/60 hover:text-white'
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>
      {/* Tile count caption — updates per filter. */}
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/45">
        showing {visibleCount} of {totalCount} templates
      </div>
    </div>
  );
}

function EmptyFilterState({ demoSuffix }: { demoSuffix: string }) {
  return (
    <div
      role="status"
      className="mx-auto flex max-w-[640px] flex-col items-center gap-3 rounded-[18px] border border-[#00B4FF]/[0.16] py-12 text-center"
      style={{ background: 'linear-gradient(180deg, rgba(17, 19, 24, 0.92), rgba(10, 12, 16, 0.92))' }}
    >
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/45">
        Nothing yet for that archetype
      </p>
      <p className="max-w-[420px] text-[14px] leading-[1.55] text-white/[0.72]">
        We have not modeled a representative template in this archetype yet. Browse all 11 templates instead.
      </p>
      <Link
        href={`/demo${demoSuffix.replace(/^&/, '?')}`}
        prefetch={false}
        className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.10] px-4 py-2 text-[13px] font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22]"
        style={{ boxShadow: '0 0 0 1px rgba(0, 180, 255, 0.16) inset, 0 6px 18px rgba(0, 0, 0, 0.35)' }}
      >
        View all templates
        <ArrowRight className="" />
      </Link>
    </div>
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

/* ═══════════════════════════════════════════════════════════════
   AllAuditedDirectory — the long-tail index of every audited
   account beyond the curated 11-industry hero shelf above.

   Reads `allAccounts` from the gallery page, which auto-discovers
   every .json in public/demo-packs. New packs picked up on next
   deploy with zero code change.

   Per-row UI is intentionally compact: brand name + archetype
   chip + 3 numbers + optional "Anchor" marker for accounts that
   also appear in the curated grid above. Click navigates to
   /demo/<slug>, preserving &demo=1 if active.
   ═══════════════════════════════════════════════════════════════ */

function humanArchetype(a: string): string {
  // Pack-level archetype is lowercase-hyphen ("oem-automotive",
  // "logistics-carrier", etc.). Render with title case + spaces.
  return a
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function AllAuditedDirectory({
  accounts,
  demoSuffix,
}: {
  accounts: AccountSummary[];
  demoSuffix: string;
}) {
  const anchorSlugs = useMemo(
    () => new Set(INDUSTRY_ANCHORS.map((a) => a.slug)),
    [],
  );

  // Quick-fire analytics on row click. Demo-mode suppression handled
  // by the global tracker contract — events are still dispatched but
  // the silent sink absorbs them.
  function onRowClick(slug: string) {
    try {
      window.dispatchEvent(
        new CustomEvent('yf:event', {
          detail: {
            name: 'directory_account_click',
            props: { account_slug: slug },
          },
        }),
      );
    } catch {
      // swallow
    }
  }

  return (
    <section
      data-ms-section-id="all-audited-directory"
      className="relative z-[1] mx-auto w-full max-w-[1280px] px-6 pt-4 pb-16 max-[480px]:px-[18px]"
    >
      <header className="mb-7 mt-6 border-t border-white/[0.08] pt-10">
        <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]/85">
          Full index
        </div>
        <h2 className="text-[28px] font-bold tracking-tight text-white max-[480px]:text-[22px]">
          All <span className="text-[#00B4FF]">{accounts.length}</span> audited accounts.
        </h2>
        <p className="mt-2 max-w-[640px] text-[14px] leading-[1.55] text-white/65 max-[480px]:text-[13px]">
          Every name links to its live microsite. Same audit rubric, same satellite imagery, same modeled geofences as the industry templates above. Alphabetical.
        </p>
      </header>
      <ul
        role="list"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-label={`Directory of ${accounts.length} audited accounts`}
      >
        {accounts.map((a) => {
          const isAnchor = anchorSlugs.has(a.slug);
          const siteDisplay = a.totalGlobalFootprint ?? a.siteCount;
          const href = `/demo/${a.slug}${demoSuffix ? '?demo=1' : ''}`;
          return (
            <li key={a.slug}>
              <Link
                href={href}
                data-ms-cta-id={`directory-${a.slug}`}
                prefetch={false}
                onClick={() => onRowClick(a.slug)}
                className="group flex h-full flex-col gap-2 rounded-[12px] border border-white/10 bg-white/[0.025] p-[14px] transition-all hover:border-[#00B4FF]/45 hover:bg-white/[0.05] hover:shadow-[0_0_24px_rgba(0,180,255,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B4FF]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-[14.5px] font-semibold text-white transition-colors group-hover:text-[#00B4FF]">
                    {a.displayName}
                  </span>
                  {isAnchor && (
                    <span
                      className="shrink-0 rounded-full border border-[#00B4FF]/35 bg-[#00B4FF]/[0.06] px-1.5 py-px font-mono text-[8.5px] uppercase tracking-[0.18em] text-[#00B4FF]/90"
                      title="Featured in the industry-template shelf above"
                    >
                      Anchor
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                  {humanArchetype(a.archetype)}
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2 pt-2">
                  <div>
                    <div className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/40">
                      Sites
                    </div>
                    <div className="font-mono text-[12px] text-white/85">
                      {siteDisplay.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/40">
                      Docks
                    </div>
                    <div className="font-mono text-[12px] text-white/85">
                      {a.dockDoors.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/40">
                      Trailers
                    </div>
                    <div className="font-mono text-[12px] text-white/85">
                      {a.trailerCapacity.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
