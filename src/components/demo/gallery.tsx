'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getSavedTemplates, toggleSavedTemplate, clearSavedTemplates } from '@/lib/demo/saved-templates';
import type { Archetype, IndustryAnchor } from '@/lib/demo/industry-tags';
import { ARCHETYPE_LABELS_TOP, INDUSTRY_ANCHORS } from '@/lib/demo/industry-tags';
import { ProvenanceLink } from './provenance-modal';

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
const AUDIT_REQUEST_ENDPOINT = '/api/microsites/audit-request';

/** H.T3 — module-level dedup so each tile fires its dwell event at most
 *  once per page session (survives re-renders, resets on reload). */
const dwellFired = new Set<string>();

const MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * F.T4 — format a pack `builtAt` ISO datetime as "Mon YYYY". Parses the
 * ISO date parts directly (not new Date()) so server and client render
 * the same string regardless of timezone.
 */
function formatAuditMonth(iso?: string): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return null;
  const monthIdx = Number(m[2]) - 1;
  if (monthIdx < 0 || monthIdx > 11) return null;
  return `${MONTHS_ABBR[monthIdx]} ${m[1]}`;
}

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
  /** C.T4 — Up to 3 quantified audit findings (Phase B authoring).
   *  The first is revealed on tile hover over the satellite thumb. */
  surprisingFindings?: string[];
  /** F.T4 — ISO datetime the pack was built; renders an "Audited {Mon
   *  YYYY}" badge on the tile. */
  builtAt?: string;
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
  /** C.T1 — audited site count (pack.network.sites.length). */
  auditedSites: number;
  totalGlobalFootprint: number | null;
  dockDoors: number;
  trailerCapacity: number;
  railServed: number;
  /** F.T5 — surveyed acreage. */
  acres: number;
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
  /** C.T1 — Total audited facilities across all packs, computed
   *  server-side. Rendered in the hero subhead. Filter-independent so
   *  the number never changes when the prospect narrows by archetype. */
  facilitiesAudited?: number;
  /** F.T5 — network-wide subtotals for the hero. */
  totalDockDoors?: number;
  totalAcres?: number;
  /** F.T8 — optional Edge Config counter; line omitted when null. */
  auditsThisQuarter?: number | null;
  /** J.T3 — true when a campaign pin (gallery_pinned_slugs) is active;
   *  stamps tile + filter events with pinned_cohort. */
  pinnedCohort?: boolean;
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

/**
 * C.T9 — Subtle background-grid parallax.
 *
 * Returns a ref to attach to the fixed grid layer. On scroll, translates
 * the grid by a small fraction of scrollY (capped at 24px total drift)
 * so the void reads as having depth without inducing motion sickness.
 *
 * Reduced-motion: the listener never attaches, so the grid stays static
 * and the transform is never set. Throttled via requestAnimationFrame to
 * stay on the compositor thread (transform only, no layout/paint).
 */
function useParallaxGrid() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let prefersReduced = false;
    try {
      prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      // matchMedia unavailable — treat as no-preference.
    }
    if (prefersReduced) return;

    const MAX_DRIFT = 24; // px — keep the shift gentle.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const drift = Math.min(window.scrollY * 0.03, MAX_DRIFT);
        el.style.transform = `translate3d(0, ${drift}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

/**
 * E.T8 — dependency-free fuzzy match for the "find your industry" search.
 * Token-AND over brand, industry label, top archetype, and blurb. Covers
 * "fed" -> FedEx, "beverage" -> Coca-Cola, "snacks" -> Frito-Lay. (City
 * search would need site-level data threaded into the tile; noted as a
 * follow-up since the tile payload does not carry cities today.)
 */
function tileMatchesQuery(tile: GalleryTileData, q: string): boolean {
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    tile.brand,
    tile.anchor.label,
    tile.anchor.archetype ?? '',
    tile.anchor.blurb,
  ]
    .join(' ')
    .toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

export function Gallery({ tiles, activeArchetype = null, totalTiles, initialDemo = false, allAccounts = [], facilitiesAudited = 0, totalDockDoors = 0, totalAcres = 0, auditsThisQuarter = null, pinnedCohort = false }: GalleryProps) {
  const demoSuffix = useDemoSuffix(initialDemo);
  // E.T8 — client-side search query, filters the (already archetype-
  // filtered) tiles live.
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim().toLowerCase();
  const displayedTiles = useMemo(
    () => (trimmedQuery ? tiles.filter((t) => tileMatchesQuery(t, trimmedQuery)) : tiles),
    [tiles, trimmedQuery],
  );
  // H.T4 — saved-template bookmarks (localStorage, read after mount).
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => setSaved(getSavedTemplates()), []);
  const onToggleSave = useCallback((slug: string) => setSaved(toggleSavedTemplate(slug)), []);
  const onClearSaved = useCallback(() => {
    clearSavedTemplates();
    setSaved([]);
  }, []);
  const isDemo = demoSuffix.length > 0;
  const savedSet = useMemo(() => new Set(saved), [saved]);
  // C.T9 — subtle background-grid parallax. Sets a transform on the
  // grid layer keyed off scroll, capped at 24px drift, only when the
  // visitor has no reduced-motion preference. Static otherwise.
  const gridRef = useParallaxGrid();
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
        ref={gridRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden will-change-transform md:block"
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
      {/*
        Subtle operator-grade grain. SVG fractalNoise rendered into a
        200×200 data URI, tiled. ~0.6KB total payload, no extra
        request. Opacity capped at 0.04 so it sits *under* perception
        on a calm scene but lights up the eye when the prospect leans
        in — the difference between "render" and "scope."
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.04 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          backgroundSize: '200px 200px',
        }}
      />

      {/* G6 — Demo Mode pill + Reset button, only when ?demo=1. */}
      {demoSuffix.length > 0 ? <DemoPill /> : null}

      <div className="relative z-[1] flex flex-1 flex-col">
        <Hero
          count={totalTiles ?? tiles.length}
          facilitiesAudited={facilitiesAudited}
          totalDockDoors={totalDockDoors}
          totalAcres={totalAcres}
          auditsThisQuarter={auditsThisQuarter}
          demoSuffix={demoSuffix}
        />
        <main
          className="mx-auto w-full max-w-[1280px] flex-1 px-6 pb-24 max-[480px]:px-[18px]"
          data-ms-section-id="gallery-grid"
        >
          {/* G5 — Archetype filter rail. WAI-ARIA toolbar with roving
              focus. Each chip is a Link that preserves &demo=1. */}
          {saved.length > 0 ? (
            <SavedTemplatesBanner saved={saved} tiles={tiles} demoSuffix={demoSuffix} onClear={onClearSaved} />
          ) : null}
          <IndustrySearch query={query} onChange={setQuery} resultCount={displayedTiles.length} />
          <ArchetypeFilterRail
            active={activeArchetype}
            demoSuffix={demoSuffix}
            visibleCount={displayedTiles.length}
            totalCount={totalTiles ?? tiles.length}
            pinnedCohort={pinnedCohort}
          />
          {displayedTiles.length > 0 ? (
            <div
              className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
              role="list"
              aria-label="Industry templates"
            >
              {displayedTiles.map((tile, i) => (
                <Tile
                  key={tile.anchor.id}
                  tile={tile}
                  index={i + 1}
                  total={displayedTiles.length}
                  demoSuffix={demoSuffix}
                  filterActive={activeArchetype !== null}
                  isSaved={savedSet.has(tile.anchor.slug)}
                  onToggleSave={onToggleSave}
                  isDemo={isDemo}
                  pinnedCohort={pinnedCohort}
                />
              ))}
            </div>
          ) : (
            <EmptyFilterState demoSuffix={demoSuffix} query={trimmedQuery} onClearQuery={() => setQuery('')} isDemo={isDemo} />
          )}
          {/* H.T2 — latent-demand capture below the grid. */}
          <DontSeeYourBrand isDemo={isDemo} />
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

function Hero({
  count,
  facilitiesAudited,
  totalDockDoors,
  totalAcres,
  auditsThisQuarter,
  demoSuffix,
}: {
  count: number;
  facilitiesAudited: number;
  totalDockDoors: number;
  totalAcres: number;
  auditsThisQuarter: number | null;
  demoSuffix: string;
}) {
  const isDemo = demoSuffix.length > 0;

  // C.T2 — secondary CTA scrolls to the tile grid. Uses the existing
  // [data-ms-section-id="gallery-grid"] anchor on <main>. Smooth scroll;
  // browsers honor prefers-reduced-motion for this automatically.
  function scrollToGrid(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    try {
      document
        .querySelector('[data-ms-section-id="gallery-grid"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      // querySelector/scrollIntoView unavailable — anchor href fallback.
    }
  }
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

        {/* C.T1 — live audit subhead. Filter-independent numbers, server
            rendered so there is no hydration shift. Reads as the receipt
            behind the "See your numbers" promise in the H1 below. */}
        <p className="mt-3 text-[14px] font-medium tracking-[0.01em] text-white/70 max-[480px]:text-[13px]">
          <span className="font-bold text-white">{count}</span> industries
          {' · '}
          <span className="font-bold text-white">{facilitiesAudited.toLocaleString()}</span> facilities audited
          {' · '}
          <span className="text-[#00B4FF]">ROI in 30 seconds</span>
        </p>

        {/* F.T5 — network-wide audit subtotal. Reinforces the scale of the
            modeled data behind the templates. */}
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
          <span className="tabular-nums text-white/70">{totalDockDoors.toLocaleString()}</span> dock doors modeled
          {' · '}
          <span className="tabular-nums text-white/70">{Math.round(totalAcres).toLocaleString()}</span> acres surveyed
        </p>

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

        {/* F.T7 — category line + F.T1 provenance trigger + F.T8 counter. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
            Built for the yard. Not a module of your TMS.
          </span>
          <ProvenanceLink />
          {auditsThisQuarter ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00C878]" />
              <span className="tabular-nums text-white/80">{auditsThisQuarter}</span> new audits this quarter
            </span>
          ) : null}
        </div>

        {/* Body — single line, steel, no fluff. */}
        <p className="mt-5 max-w-[660px] text-[16px] leading-[1.55] text-white/[0.72] max-[480px]:text-[15px]">
          Each template runs the YardFlow protocol against an audited prospect&apos;s
          facility data. The numbers below are real — public satellite imagery,
          modeled geofences, classification rubric.
        </p>

        {/* C.T2 — two distinct CTAs. Primary (neon-filled) opens the
            calculator; secondary (neon-outlined) scrolls to the tile grid.
            Stack vertically on mobile. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
          <a
            href={`${MICROSITE_BASE}/roi?source=demo-gallery${demoSuffix}`}
            target="_blank"
            rel="noopener noreferrer"
            data-ms-cta-id="gallery-hero-open-calculator"
            className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[12px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-5 text-[14px] font-bold tracking-[0.01em] text-white outline-none transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_28px_rgba(0,180,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00B4FF]"
            style={{
              boxShadow:
                '0 0 0 1px rgba(0, 180, 255, 0.18) inset, 0 10px 28px rgba(0, 0, 0, 0.40), 0 0 22px rgba(0, 180, 255, 0.18)',
            }}
          >
            Open the calculator
            <ArrowRight className="transition-transform group-hover:translate-x-[3px]" />
          </a>
          <a
            href="#gallery-grid"
            onClick={scrollToGrid}
            data-ms-cta-id="gallery-hero-browse-industries"
            className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[12px] border border-white/20 bg-transparent px-5 text-[14px] font-semibold tracking-[0.01em] text-white/85 outline-none transition-all hover:border-[#00B4FF]/55 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#00B4FF]"
          >
            Browse industries below
            <span className="transition-transform group-hover:translate-y-[2px]" aria-hidden>↓</span>
          </a>
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
  filterActive = false,
  isSaved = false,
  onToggleSave,
  isDemo = false,
  pinnedCohort = false,
}: {
  tile: GalleryTileData;
  index: number;
  total: number;
  demoSuffix: string;
  filterActive?: boolean;
  isSaved?: boolean;
  onToggleSave?: (slug: string) => void;
  isDemo?: boolean;
  pinnedCohort?: boolean;
}) {
  // H.T3 — debounced tile-dwell event, once per tile per session.
  const dwellTimerRef = useRef<number | null>(null);
  const onDwellEnter = () => {
    if (isDemo || dwellFired.has(tile.anchor.slug)) return;
    dwellTimerRef.current = window.setTimeout(() => {
      dwellFired.add(tile.anchor.slug);
      try {
        window.dispatchEvent(
          new CustomEvent('yf:event', {
            detail: {
              name: 'gallery_tile_dwell',
              props: {
                anchor_slug: tile.anchor.slug,
                anchor_archetype: tile.anchor.archetype,
                dwell_ms: 800,
                ...(pinnedCohort ? { pinned_cohort: true } : {}),
              },
            },
          }),
        );
      } catch {
        // swallow
      }
    }, 800);
  };
  const onDwellLeave = () => {
    if (dwellTimerRef.current) {
      window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  };
  const { anchor, brand, facilityCount, facilityCountIsGlobal, dockDoors, trailerCapacity, railServed, roiPrefill, thumbSrc, thumbAlt, surprisingFindings, builtAt } = tile;
  const firstFinding = surprisingFindings?.[0];
  const auditedMonth = formatAuditMonth(builtAt);

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
      className={`tile-rise group relative flex flex-col overflow-hidden rounded-[16px] border border-[#00B4FF]/[0.16] p-5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] hover:border-[#00B4FF]/[0.50] hover:shadow-[0_24px_64px_rgba(0,0,0,0.40),0_0_40px_rgba(0,180,255,0.18)]${filterActive ? ' tile-pulse' : ''}`}
      role="listitem"
      onMouseEnter={onDwellEnter}
      onMouseLeave={onDwellLeave}
      data-ms-section-id={`gallery-tile-${anchor.id}`}
      data-archetype={anchor.archetype}
      style={{
        background:
          'linear-gradient(180deg, rgba(17, 19, 24, 0.92), rgba(10, 12, 16, 0.92))',
        // C.T3 — staggered entrance. The animation itself only exists
        // inside the prefers-reduced-motion: no-preference media query
        // (globals.css .tile-rise), so this delay is inert under reduced
        // motion and tiles render at full opacity immediately.
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* G3 — Satellite anchor thumbnail. 16:10 above the brand. Fallback
          to a neon-grid placeholder when the thumb is missing. First tile
          gets priority + decoding=sync per LCP rule (G3.T7). */}
      {thumbSrc ? (
        <div className="-mx-5 -mt-5 mb-4 relative aspect-[16/10] overflow-hidden border-b border-[#00B4FF]/[0.16]">
          {/* C.T5 — subtle satellite pan on hover. 1.02x over 600ms,
              centered origin. motion-safe: gates out reduced-motion. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt={thumbAlt ?? `Audited facility for ${brand}`}
            width={640}
            height={400}
            loading={isFirstTile ? 'eager' : 'lazy'}
            decoding={isFirstTile ? 'sync' : 'async'}
            fetchPriority={isFirstTile ? 'high' : 'auto'}
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-out motion-safe:group-hover:scale-[1.02]"
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
          {/* C.T4 — hover-reveal first surprising finding. Gated to
              hover-capable devices via @media (hover: hover) so touch
              screens never trigger it. pointer-events-none keeps the
              tile link fully clickable. */}
          {firstFinding ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end p-3 opacity-0 transition-opacity duration-200 [@media(hover:hover)]:group-hover:opacity-100"
              style={{
                minHeight: '66%',
                background: 'linear-gradient(180deg, transparent, rgba(5, 5, 5, 0.92) 55%)',
              }}
            >
              <span className="line-clamp-3 text-[14px] font-semibold leading-snug text-white">
                {firstFinding}
              </span>
            </div>
          ) : null}
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

      {/* F.T4 — audit-date badge. Provenance signal: when this network was
          last modeled. */}
      {auditedMonth ? (
        <span className="absolute right-3 top-3 z-[2] rounded-full border border-[#00B4FF]/35 bg-[#050505]/80 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">
          Audited {auditedMonth}
        </span>
      ) : null}

      {/* H.T4 — save-this-template bookmark. */}
      {onToggleSave ? (
        <button
          type="button"
          onClick={() => onToggleSave(anchor.slug)}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove ${brand} from saved templates` : `Save ${brand} template`}
          data-ms-cta-id={`gallery-bookmark-${anchor.id}`}
          className={`absolute left-3 top-3 z-[2] inline-flex h-7 w-7 items-center justify-center rounded-full border bg-[#050505]/80 text-[13px] backdrop-blur-sm transition-colors ${
            isSaved
              ? 'border-[#00B4FF]/70 text-[#00B4FF]'
              : 'border-white/20 text-white/60 hover:border-[#00B4FF]/60 hover:text-white'
          }`}
        >
          <span aria-hidden>{isSaved ? '★' : '☆'}</span>
        </button>
      ) : null}

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
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
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
          /* E.T5 — warm only the first 3 microsite routes. Beyond the
             fold the prefetch cost outweighs the hit rate. */
          prefetch={index <= 3}
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
        {/* F.T6 — provenance attribution + modal trigger (same modal as
            the hero F.T1 trigger). */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
          <span>Public audit data. Not affiliated with featured brands.</span>
          <ProvenanceLink />
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
  pinnedCohort = false,
}: {
  active: Archetype | null;
  demoSuffix: string;
  visibleCount: number;
  totalCount: number;
  pinnedCohort?: boolean;
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

  // J.T2 — standardized filter event with visible_count + source.
  // J.T3 — pinned_cohort flag included only when a campaign pin is active.
  function fireFilterApplied(id: Archetype | null, source: 'click' | 'url') {
    try {
      const props: Record<string, unknown> = {
        archetype: id ?? 'all',
        visible_count: visibleCount,
        source,
      };
      if (pinnedCohort) props.pinned_cohort = true;
      window.dispatchEvent(new CustomEvent('yf:event', { detail: { name: 'gallery_filter_applied', props } }));
    } catch {
      // swallow
    }
  }

  // J.T2 — URL-driven initial filter emits one event with source 'url'.
  useEffect(() => {
    if (active !== null) fireFilterApplied(active, 'url');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A.T2 — chip count badges. Counts derive from the canonical anchor
  // list so adding a 12th anchor in industry-tags.ts auto-updates the
  // chip badges. Server-side stable — no hydration flash.
  const counts: Record<Archetype, number> = useMemo(() => {
    const out: Record<Archetype, number> = { cpg: 0, logistics: 0, manufacturing: 0, retail: 0, '3pl': 0 };
    for (const a of INDUSTRY_ANCHORS) {
      if (a.archetype && a.archetype in out) out[a.archetype as Archetype] += 1;
    }
    return out;
  }, []);

  const allChips: Array<{ id: Archetype | null; label: string; count: number }> = [
    { id: null, label: 'All', count: INDUSTRY_ANCHORS.length },
    ...FILTER_ORDER.map((id) => ({ id, label: ARCHETYPE_LABELS_TOP[id], count: counts[id] })),
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
              onClick={() => fireFilterApplied(chip.id, 'click')}
              className={`shrink-0 snap-start rounded-full border px-4 py-2 font-mono text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors max-[480px]:text-[12px] mr-2 last:mr-0 ${
                isActive
                  ? 'border-[#00B4FF]/65 bg-[#00B4FF]/[0.20] text-white shadow-[0_0_24px_rgba(0,180,255,0.22)]'
                  : 'border-white/30 bg-transparent text-white/85 hover:border-[#00B4FF]/60 hover:text-white'
              }`}
            >
              {chip.label}
              <span
                className={`ml-1.5 font-normal ${isActive ? 'text-white/70' : 'text-white/55'}`}
                aria-hidden
              >
                ({chip.count})
              </span>
              <span className="sr-only">{`, ${chip.count} ${chip.count === 1 ? 'template' : 'templates'}`}</span>
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

/* ═══════════════════════════════════════════════════════════════
   IndustrySearch — E.T8. Client-side "find your industry" box.
   Filters the tile grid live (token-AND over brand / industry label /
   archetype / blurb). Type=search for native clear affordance.
   ═══════════════════════════════════════════════════════════════ */

function IndustrySearch({
  query,
  onChange,
  resultCount,
}: {
  query: string;
  onChange: (v: string) => void;
  resultCount: number;
}) {
  return (
    <div className="mb-4" data-ms-section-id="gallery-search">
      <label className="relative block">
        <span className="sr-only">Find your industry</span>
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a brand or vertical. Try fedex, beverage, snacks."
          aria-label="Find your industry"
          data-gallery-search-input
          className="w-full rounded-[12px] border border-white/15 bg-white/[0.03] py-2.5 pl-10 pr-4 text-[14px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#00B4FF]/60 focus-visible:outline-2 focus-visible:outline-offset-[2px] focus-visible:outline-[#00B4FF]"
        />
      </label>
      {query.trim().length > 0 ? (
        <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45" role="status">
          {resultCount} {resultCount === 1 ? 'match' : 'matches'}
        </div>
      ) : null}
    </div>
  );
}

function EmptyFilterState({
  demoSuffix,
  query = '',
  onClearQuery,
  isDemo = false,
}: {
  demoSuffix: string;
  query?: string;
  onClearQuery?: () => void;
  isDemo?: boolean;
}) {
  const isSearch = query.length > 0;
  return (
    <div
      role="status"
      className="mx-auto flex max-w-[640px] flex-col items-center gap-3 rounded-[18px] border border-[#00B4FF]/[0.16] py-12 text-center"
      style={{ background: 'linear-gradient(180deg, rgba(17, 19, 24, 0.92), rgba(10, 12, 16, 0.92))' }}
    >
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/45">
        {isSearch ? 'No template matches that search' : 'Nothing yet for that archetype'}
      </p>
      <p className="max-w-[420px] text-[14px] leading-[1.55] text-white/[0.72]">
        {isSearch
          ? `Nothing matched "${query}". Clear the search to see every template, or request an audit for your industry.`
          : 'We have not modeled a representative template in this archetype yet. Browse all 11 templates instead.'}
      </p>
      {isSearch && onClearQuery ? (
        <button
          type="button"
          onClick={onClearQuery}
          className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-transparent px-4 py-2 text-[13px] font-semibold text-white/85 transition-all hover:border-[#00B4FF]/55 hover:text-white"
        >
          Clear search
        </button>
      ) : (
        <Link
          href={`/demo${demoSuffix.replace(/^&/, '?')}`}
          prefetch={false}
          className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-transparent px-4 py-2 text-[13px] font-semibold text-white/85 transition-all hover:border-[#00B4FF]/55 hover:text-white"
        >
          View all templates
          <ArrowRight className="" />
        </Link>
      )}
      {/* C.T6 — capture latent demand for un-modeled archetypes. */}
      <a
        href={`${MICROSITE_BASE}/contact?intent=custom-audit&source=gallery-empty-filter`}
        target="_blank"
        rel="noopener noreferrer"
        data-ms-cta-id="gallery-empty-filter-audit-request"
        className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.10] px-4 py-2 text-[13px] font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22]"
        style={{ boxShadow: '0 0 0 1px rgba(0, 180, 255, 0.16) inset, 0 6px 18px rgba(0, 0, 0, 0.35)' }}
      >
        Want this in your industry? Book a 30-min audit
        <ArrowRight className="" />
      </a>
      {/* H.T1 — inline 2-field audit-request form. */}
      <AuditRequestForm variant="industry" source="gallery-empty-filter" isDemo={isDemo} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AuditRequestForm — H.T1 / H.T2 shared lead-capture form.
   variant "industry": industry + email. variant "brand": company +
   role + email. Posts to /api/microsites/audit-request; the endpoint
   no-ops under demo so a rep's presentation never creates a real lead.
   ═══════════════════════════════════════════════════════════════ */

function AuditRequestForm({
  variant,
  source,
  isDemo,
  onSubmitted,
}: {
  variant: 'industry' | 'brand';
  source: string;
  isDemo: boolean;
  onSubmitted?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  async function submit() {
    if (status === 'submitting') return;
    setStatus('submitting');
    try {
      const res = await fetch(AUDIT_REQUEST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          industry: variant === 'industry' ? industry : undefined,
          company: variant === 'brand' ? company : undefined,
          role: variant === 'brand' ? role : undefined,
          source,
          demo: isDemo,
        }),
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('done');
      onSubmitted?.();
    } catch {
      setStatus('error');
    }
  }

  const inputClass =
    'w-full rounded-[10px] border border-white/15 bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#00B4FF]/60';

  if (status === 'done') {
    return (
      <p role="status" className="mt-4 text-[13px] text-[#00C878]">
        Thanks. We will be in touch about auditing your network.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="mt-4 flex w-full max-w-[420px] flex-col gap-2"
    >
      {variant === 'industry' ? (
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Your industry"
          required
          className={inputClass}
        />
      ) : (
        <>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            required
            className={inputClass}
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Your role"
            className={inputClass}
          />
        </>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        required
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        data-ms-cta-id={`audit-request-submit-${variant}`}
        className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-4 py-2 text-[13px] font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Request an audit'}
      </button>
      {status === 'error' ? (
        <p role="status" className="text-[12px] text-[#FF2A00]/80">
          Something went wrong. Please try again.
        </p>
      ) : null}
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SavedTemplatesBanner — H.T4. Lists bookmarked templates above the
   grid with quick links and a clear-all.
   ═══════════════════════════════════════════════════════════════ */

function SavedTemplatesBanner({
  saved,
  tiles,
  demoSuffix,
  onClear,
}: {
  saved: string[];
  tiles: GalleryTileData[];
  demoSuffix: string;
  onClear: () => void;
}) {
  const bySlug = useMemo(() => new Map(tiles.map((t) => [t.anchor.slug, t])), [tiles]);
  return (
    <div
      data-saved-templates-banner
      className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[12px] border border-[#00B4FF]/25 bg-[#00B4FF]/[0.05] px-4 py-2.5 text-[12.5px] text-white/75"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00B4FF]/85">You saved</span>
      {saved.map((slug, i) => (
        <span key={slug}>
          <Link
            href={`/demo/${slug}?from=gallery${demoSuffix}`}
            prefetch={false}
            className="text-white transition-colors hover:text-[#00B4FF]"
          >
            {bySlug.get(slug)?.brand ?? slug}
          </Link>
          {i < saved.length - 1 ? <span className="text-white/30">,</span> : null}
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-white/50 transition-colors hover:text-white"
      >
        Clear all
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DontSeeYourBrand — H.T2. Latent-demand CTA below the tile grid; opens
   a modal with the brand-variant audit-request form.
   ═══════════════════════════════════════════════════════════════ */

function DontSeeYourBrand({ isDemo }: { isDemo: boolean }) {
  const [open, setOpen] = useState(false);

  function openModal() {
    if (!isDemo) {
      try {
        window.dispatchEvent(
          new CustomEvent('yf:event', {
            detail: { name: 'gallery_custom_audit_requested', props: { source: 'gallery-dont-see-brand' } },
          }),
        );
      } catch {
        // swallow
      }
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="mt-12 flex flex-col items-center gap-3 border-t border-white/[0.08] pt-10 text-center">
      <p className="text-[15px] text-white/75">
        Don&apos;t see your brand? We can audit your network in 5 business days.
      </p>
      <button
        type="button"
        onClick={openModal}
        data-ms-cta-id="gallery-dont-see-brand"
        className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.10] px-4 py-2 text-[13px] font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22]"
        style={{ boxShadow: '0 0 0 1px rgba(0, 180, 255, 0.16) inset, 0 6px 18px rgba(0, 0, 0, 0.35)' }}
      >
        Request a custom audit
        <ArrowRight className="" />
      </button>

      {open ? (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Request a custom audit"
            className="relative w-full max-w-[460px] rounded-[16px] border border-[#00B4FF]/[0.30] p-6 text-left text-white"
            style={{
              background: 'linear-gradient(180deg, rgba(17, 19, 24, 0.98), rgba(10, 12, 16, 0.98))',
              boxShadow: '0 0 0 1px rgba(0,180,255,0.12) inset, 0 24px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[18px] font-bold text-white">Request a custom audit</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[12px] text-white/70 transition-colors hover:border-[#00B4FF]/55 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-[13px] leading-[1.5] text-white/65">
              Tell us where to send your network audit. Same rubric, same satellite imagery as the templates here.
            </p>
            <AuditRequestForm variant="brand" source="gallery-dont-see-brand" isDemo={isDemo} />
          </div>
        </div>
      ) : null}
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
                    <div className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/60">
                      Sites
                    </div>
                    <div className="font-mono text-[12px] text-white/85">
                      {siteDisplay.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/60">
                      Docks
                    </div>
                    <div className="font-mono text-[12px] text-white/85">
                      {a.dockDoors.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/60">
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
