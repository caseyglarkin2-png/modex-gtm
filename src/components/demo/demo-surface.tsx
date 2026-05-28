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
    <div className={mode === 'standalone' ? 'flex min-h-screen flex-col' : 'flex h-[600px] flex-col rounded-lg border border-stone-200 bg-white shadow-sm'}>
      {/*
       * Sprint 2.5 — template framing strip. Only shows when the prospect
       * arrived from the /demo industry gallery. Sets the expectation that
       * this view is a sample rendered from another company's data, not
       * the visitor's own demo.
       */}
      {mode === 'standalone' && fromGallery && (
        <div
          className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2 text-center text-xs text-amber-900"
          role="note"
          data-ms-section-id="gallery-template-strip"
        >
          <strong>Industry template.</strong> Sample demo for {galleryIndustryLabel} operators. Your demo will reflect your actual facilities.{' '}
          <Link
            href="/demo"
            data-ms-cta-id="gallery-back-to-gallery"
            className="underline-offset-2 hover:underline"
          >
            ← Back to gallery
          </Link>
        </div>
      )}
      {/* Header — only in standalone mode */}
      {mode === 'standalone' && (
        <header className="shrink-0 border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-end justify-between gap-6 px-5 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500">
                {fromGallery ? `YardFlow · ${galleryIndustryLabel} template` : 'YardFlow · YNS network audit'}
              </div>
              <h1 className="mt-1 text-xl font-semibold text-stone-900">
                {fromGallery ? galleryHeadline : displayName}
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                <span className="tabular-nums">{scopeBlurb}</span> ·{' '}
                <span className="tabular-nums">{dockDoors.toLocaleString()}</span> dock doors ·{' '}
                <span className="tabular-nums">{trailerCapacity.toLocaleString()}</span> trailer spots ·{' '}
                <span className="tabular-nums">{railServed}</span> rail-served
              </p>
              {fromGallery && (
                <p className="mt-1 text-[11px] text-stone-500">
                  Modeled from a real <span className="italic">{displayName}</span> network audit.
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              {/*
               * Hide the "back to memo" link when the prospect is on a
               * gallery template — the /for/<slug> memo is account-
               * specific copy that doesn't make sense for a gallery
               * visitor who isn't that prospect.
               */}
              {!fromGallery && (
                <Link
                  href={`/for/${pack.account.slug}`}
                  data-ms-cta-id="demo-back-to-memo"
                  className="hidden text-xs uppercase tracking-widest text-stone-500 transition hover:text-stone-900 md:inline"
                >
                  ← Read the full memo
                </Link>
              )}
              <a
                href={`https://yardflow.ai/contact/?intent=audit&utm_source=demo&utm_medium=${fromGallery ? 'gallery-header' : 'demo-header'}&utm_campaign=${pack.account.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                data-ms-cta-id={fromGallery ? 'gallery-pack-book-audit' : 'demo-book-audit'}
                className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-stone-700"
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
                className={`border-b-2 px-3 py-2 text-[12px] uppercase tracking-widest transition ${
                  view === tab.id
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
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
          <aside className="flex w-full shrink-0 flex-col overflow-hidden border-t border-stone-200 bg-white md:w-[400px] md:border-l md:border-t-0">
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
        <footer className="shrink-0 border-t border-stone-200 bg-stone-50 px-5 py-4">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-2 text-xs text-stone-600 md:flex-row md:items-center">
            <span>
              Sourced from public satellite + Street View imagery. Geofences modeled by YardFlow.{' '}
              <Link href={`/for/${pack.account.slug}`} className="underline-offset-2 hover:underline">
                See the full network memo →
              </Link>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-stone-400">YardFlow YNS · {pack.builtAt.slice(0, 10)}</span>
          </div>
        </footer>
      )}
    </div>
  );
}
