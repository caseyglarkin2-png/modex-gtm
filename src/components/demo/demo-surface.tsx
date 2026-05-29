'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ArchetypeId, DemoPack } from '@/lib/demo/pack-schema';
import { getIndustryFromSlug } from '@/lib/demo/industry-tags';
import { NetworkAtlas } from './network-atlas';
import { SiteDetailPanel } from './site-detail-panel';
import { ArchetypeMixChart } from './archetype-mix-chart';
import { CoverageHonesty } from './coverage-honesty';
import { NetworkSimulator } from './network-simulator';

/**
 * Top-level client surface for /demo/[account]. Manages cross-component
 * state (selected site, archetype filter), lays out the two columns.
 *
 * `mode === 'embed'` strips the header and footer for use inside the
 * existing /for/[account] microsites (D2.8). In that mode the surface
 * is purely the atlas + click-to-detail; the microsite owns the chrome.
 */

type View = 'atlas' | 'sim';

interface Props {
  pack: DemoPack;
  mode: 'standalone' | 'embed';
  /** Initial selected site — populated from `?site=` search param. */
  initialSiteId?: string | null;
  /** When true, auto-open the selected site in replay mode (D3.4 `?play=1`). */
  autoPlay?: boolean;
  /** Initial view — populated from `?view=` search param. */
  initialView?: View;
  /**
   * Sprint 2.5 — set when the prospect arrived via the /demo industry
   * gallery (?from=gallery). Renders a template-framing strip and
   * softens the account-specific brand chrome, so a casual gallery
   * visitor sees "this is a sample for [Industry] operators" instead
   * of mistaking the pack for their own demo.
   */
  fromGallery?: boolean;
}

export function DemoSurface({
  pack,
  mode,
  initialSiteId = null,
  autoPlay = false,
  initialView = 'atlas',
  fromGallery = false,
}: Props) {
  const [view, setView] = useState<View>(initialView);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(initialSiteId);
  const [archetypeFilter, setArchetypeFilter] = useState<Set<ArchetypeId> | null>(null);
  // Once a user manually closes the auto-play, we should not re-open it on
  // the next click — track whether the autoPlay flag has been consumed.
  const [autoPlayConsumed, setAutoPlayConsumed] = useState(false);
  const shouldAutoPlay = autoPlay && !autoPlayConsumed && selectedSiteId === initialSiteId;

  const toggleArchetype = (archetype: ArchetypeId) => {
    setArchetypeFilter((prev) => {
      // Treat "no filter" as "all selected" — clicking one inverts to single-select
      const current = prev ?? new Set(Object.keys(pack.network.archetypeMix) as ArchetypeId[]);
      const next = new Set(current);
      if (next.has(archetype)) {
        next.delete(archetype);
      } else {
        next.add(archetype);
      }
      // Empty set means "show none" — reset to null (= all) on second toggle of last selected
      if (next.size === 0) return null;
      // If all archetypes are now selected, drop the filter entirely to keep state clean
      const total = Object.keys(pack.network.archetypeMix).length;
      if (next.size === total) return null;
      return next;
    });
  };

  const selectedSite = selectedSiteId ? pack.network.sites.find((s) => s.id === selectedSiteId) ?? null : null;

  const { displayName, siteCount, coverageNote } = pack.account;
  const { dockDoors, trailerCapacity, railServed } = pack.network.totals;

  // Sprint 2.5 — resolve the industry label for the template strip
  // when the prospect arrived from the gallery. Fall back to the
  // pack's archetype if the slug isn't in the anchor list (shouldn't
  // happen for the 11 anchors, but handles edge cases like an email
  // CTA that picks a non-anchor pack and still passes ?from=gallery).
  const galleryIndustry = fromGallery ? getIndustryFromSlug(pack.account.slug) : null;
  const galleryIndustryLabel = galleryIndustry?.label ?? pack.account.archetype;
  const galleryHeadline = `Sample ${galleryIndustryLabel} Template`;

  // Scope blurb for the header — be honest when our audit covers a
  // subset of the prospect's full network. For Mondelez we audit 22 NA
  // sites; the global footprint is ~160. Saying just "22 facilities"
  // reads to a Mondelez exec as "you mapped 14% of our network and are
  // pretending it's the whole thing." The audit IS NA-scoped and the
  // banner explains why; this header now matches the banner's framing.
  const scopeBlurb =
    coverageNote?.totalGlobalFootprint && coverageNote.totalGlobalFootprint > siteCount
      ? `${siteCount} of ~${coverageNote.totalGlobalFootprint} facilities${coverageNote.auditedScope ? ` (${coverageNote.auditedScope} scope)` : ''}`
      : coverageNote?.estimatedFootprint && coverageNote.estimatedFootprint > siteCount
        ? `${siteCount} of ~${coverageNote.estimatedFootprint} facilities${coverageNote.auditedScope ? ` (${coverageNote.auditedScope} scope)` : ''}`
        : `${siteCount} facilities audited`;

  return (
    <div
      className={mode === 'standalone' ? 'flex min-h-screen flex-col bg-[#050505] text-white' : 'flex h-[600px] flex-col rounded-lg border border-[#00B4FF]/[0.16] shadow-[0_24px_64px_rgba(0,0,0,0.40)]'}
      style={mode === 'embed' ? { background: 'linear-gradient(180deg, rgba(17, 19, 24, 0.92), rgba(10, 12, 16, 0.92))' } : undefined}
    >
      {/*
       * Sprint 2.5 — template framing strip. Only shows when the prospect
       * arrived from the /demo industry gallery. Sets the expectation that
       * this view is a sample rendered from another company's data, not
       * the visitor's own demo.
       */}
      {mode === 'standalone' && fromGallery && (
        <div
          className="shrink-0 border-b border-[#00B4FF]/[0.20] bg-[#00B4FF]/[0.08] px-5 py-2 text-center text-xs text-[#00B4FF]"
          role="note"
          data-ms-section-id="gallery-template-strip"
        >
          <strong className="text-white">Industry template.</strong> Sample demo for {galleryIndustryLabel} operators. Your demo will reflect your actual facilities.{' '}
          <Link
            href="/demo"
            data-ms-cta-id="gallery-back-to-gallery"
            className="text-white underline underline-offset-2 hover:text-[#00B4FF]"
          >
            ← Back to gallery
          </Link>
        </div>
      )}
      {/* Header — only in standalone mode */}
      {mode === 'standalone' && (
        <header className="shrink-0 border-b border-[#00B4FF]/[0.10] backdrop-blur-[2px]">
          <div className="mx-auto flex max-w-5xl items-end justify-between gap-6 px-5 py-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.20em] text-[#00B4FF]/85">
                {fromGallery ? `YardFlow · ${galleryIndustryLabel} template` : 'YardFlow · YNS network audit'}
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-white">
                {fromGallery ? galleryHeadline : displayName}
              </h1>
              <p className="mt-1 text-sm text-white/70">
                <span className="tabular-nums">{scopeBlurb}</span> ·{' '}
                <span className="tabular-nums">{dockDoors.toLocaleString()}</span> dock doors ·{' '}
                <span className="tabular-nums">{trailerCapacity.toLocaleString()}</span> trailer spots ·{' '}
                <span className="tabular-nums">{railServed}</span> rail-served
              </p>
              {/* A.T5 — brand attribution strip. Sits below the scope/metrics
                  subhead, above any gallery-framing line. Clarifies that we
                  are not the prospect's vendor + names where the data came
                  from. Quiets the rare "wait, are you Coke's vendor?" beat
                  during cold prospect meetings, and provides trademark
                  nominative-fair-use cover. */}
              <p
                data-attribution-strip
                className="mt-1 text-[11px] leading-relaxed text-stone-500"
              >
                Public audit. Not affiliated with{' '}
                <span className="text-stone-400">{displayName}</span>. Data from
                satellite imagery + public records.
              </p>
              {fromGallery && (
                <p className="mt-1 text-[11px] text-white/55">
                  Modeled from a real <span className="italic">{displayName}</span> network audit.
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              {!fromGallery && (
                <Link
                  href={`/for/${pack.account.slug}`}
                  data-ms-cta-id="demo-back-to-memo"
                  className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-[#00B4FF] md:inline"
                >
                  ← Read the full memo
                </Link>
              )}
              <a
                href={`https://yardflow.ai/contact/?intent=audit&utm_source=demo&utm_medium=${fromGallery ? 'gallery-header' : 'demo-header'}&utm_campaign=${pack.account.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                data-ms-cta-id={fromGallery ? 'gallery-pack-book-audit' : 'demo-book-audit'}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-3 py-1.5 text-xs font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_22px_rgba(0,180,255,0.32)]"
                style={{ boxShadow: '0 0 0 1px rgba(0, 180, 255, 0.18) inset, 0 6px 18px rgba(0, 0, 0, 0.35)' }}
              >
                Book a network audit →
              </a>
            </div>
          </div>
          {/* View tab toggle */}
          <div className="mx-auto flex max-w-5xl gap-1 px-5">
            {(
              [
                { id: 'atlas', label: 'Network atlas' },
                { id: 'sim', label: 'Network simulator' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={`border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  view === tab.id
                    ? 'border-[#00B4FF] text-[#00B4FF]'
                    : 'border-transparent text-white/55 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <CoverageHonesty pack={pack} />
        </header>
      )}

      {/* Atlas view: split — map + donut/site-panel */}
      {view === 'atlas' && (
        <main className="flex flex-1 flex-col overflow-hidden md:flex-row">
          <div className="relative h-[400px] flex-1 md:h-auto">
            <NetworkAtlas
              pack={pack}
              selectedSiteId={selectedSiteId}
              archetypeFilter={archetypeFilter}
              onSelectSite={setSelectedSiteId}
            />
          </div>
          <aside
            className="flex w-full shrink-0 flex-col overflow-hidden border-t border-[#00B4FF]/[0.10] md:w-[400px] md:border-l md:border-t-0"
            style={{ background: 'linear-gradient(180deg, rgba(17, 19, 24, 0.92), rgba(10, 12, 16, 0.92))' }}
          >
            {selectedSite ? (
              <SiteDetailPanel
                site={selectedSite}
                onClose={() => {
                  setSelectedSiteId(null);
                  setAutoPlayConsumed(true);
                }}
                autoPlay={shouldAutoPlay}
              />
            ) : (
              <ArchetypeMixChart pack={pack} archetypeFilter={archetypeFilter} onToggleArchetype={toggleArchetype} />
            )}
          </aside>
        </main>
      )}

      {/* Simulator view: full-width map + controls */}
      {view === 'sim' && (
        <main className="flex flex-1 overflow-hidden">
          <NetworkSimulator pack={pack} />
        </main>
      )}

      {/* Footer — only in standalone mode */}
      {mode === 'standalone' && (
        <footer
          className="shrink-0 border-t border-[#00B4FF]/[0.10] px-5 py-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        >
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-2 text-xs text-white/55 md:flex-row md:items-center">
            <span>
              Sourced from public satellite + Street View imagery. Geofences modeled by YardFlow.{' '}
              <Link href={`/for/${pack.account.slug}`} className="text-white underline underline-offset-2 hover:text-[#00B4FF]">
                See the full network memo →
              </Link>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">YardFlow YNS · {pack.builtAt.slice(0, 10)}</span>
          </div>
        </footer>
      )}
    </div>
  );
}
