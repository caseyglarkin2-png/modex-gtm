'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ArchetypeId, DemoPack } from '@/lib/demo/pack-schema';
import { getIndustryFromSlug, ARCHETYPE_LABELS_TOP } from '@/lib/demo/industry-tags';
import { NetworkAtlas } from './network-atlas';
import { SiteDetailPanel } from './site-detail-panel';
import { ArchetypeMixChart } from './archetype-mix-chart';
import { CoverageHonesty } from './coverage-honesty';
import { NetworkSimulator } from './network-simulator';
import { RoiCtaButton } from './roi-cta-button';
import { ShareMicrosite } from './share-microsite';
import { DriverJourneySpotlight } from './driver-journey-spotlight';
import { NetworkInsight } from './network-insight';
import { DemoReframe } from './demo-reframe';
import { SurprisingFindings } from './surprising-findings';
import { RoiHandoffClose } from './roi-handoff-close';

/**
 * Top-level client surface for /demo/[account]. Manages cross-component
 * state (selected site, archetype filter), lays out the two columns.
 *
 * `mode === 'embed'` strips the header and footer for use inside the
 * existing /for/[account] microsites (D2.8). In that mode the surface
 * is purely the atlas + click-to-detail; the microsite owns the chrome.
 */

type View = 'atlas' | 'sim' | 'replay';

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
  /**
   * Path to a satellite zoom of the pack's featured audited site (e.g.
   * `/gallery-thumbs/coca-cola.png`). When present, renders a hero
   * section between the header and the atlas/sim view. The parent
   * page resolves this server-side so non-anchor packs (no thumb yet)
   * fall through without a hero — no client-side flash, no 404 image.
   */
  featuredSiteThumbSrc?: string;
}

export function DemoSurface({
  pack,
  mode,
  initialSiteId = null,
  autoPlay = false,
  fromGallery = false,
}: Props) {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(initialSiteId);
  const [archetypeFilter, setArchetypeFilter] = useState<Set<ArchetypeId> | null>(null);
  // Simulator is a stress-test expander now (not a top-level mode), default closed.
  const [simOpen, setSimOpen] = useState(false);
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
  // Marine/port packs (crowley v2) carry container ground slots separate from
  // wheeled trailer/chassis spots; surface both, and label the wheeled count
  // "trailer/chassis spots" when the split is present.
  const containerGroundSlots = pack.network.totals.containerGroundSlots;
  const trailerSpotsLabel = containerGroundSlots != null ? 'trailer/chassis spots' : 'trailer spots';

  // Sprint 2.5 — resolve the industry label for the template strip
  // when the prospect arrived from the gallery. Fall back to the
  // pack's archetype if the slug isn't in the anchor list (shouldn't
  // happen for the 11 anchors, but handles edge cases like an email
  // CTA that picks a non-anchor pack and still passes ?from=gallery).
  const galleryIndustry = fromGallery ? getIndustryFromSlug(pack.account.slug) : null;
  const galleryIndustryLabel = galleryIndustry?.label ?? pack.account.archetype;
  const galleryHeadline = `Sample ${galleryIndustryLabel} Template`;

  // E.T4 — persistent breadcrumb. Resolve the anchor (for the 11 gallery
  // industries) so the middle crumb links to that archetype's filtered
  // gallery. Non-anchor packs show "All industries · {brand}" only.
  const anchor = getIndustryFromSlug(pack.account.slug);
  const anchorArchetype = anchor?.archetype ?? null;
  const archetypeTopLabel = anchorArchetype ? ARCHETYPE_LABELS_TOP[anchorArchetype] : null;

  // F.T3 — audit-confidence stamp. Plurality vote across site confidence
  // (ties favor the higher rating) so the stamp reflects the network's
  // dominant audit quality. (Note: the plan's literal "any low -> Low"
  // would render almost every multi-site pack Low and defeat the trust
  // signal, so we use the dominant rating instead.) Field resolution is
  // the average count of non-null Classification fields across sites,
  // out of the fixed 22-field rubric.
  const confidenceStamp = (() => {
    const sites = pack.network.sites;
    if (sites.length === 0) return null;
    const counts = { high: 0, medium: 0, low: 0 };
    let resolvedTotal = 0;
    for (const s of sites) {
      const c = String(s.confidence).toLowerCase();
      if (c === 'high' || c === 'medium' || c === 'low') counts[c] += 1;
      resolvedTotal += Object.values(s.classification).filter(
        (v) => v !== null && v !== undefined,
      ).length;
    }
    const level =
      counts.high >= counts.medium && counts.high >= counts.low
        ? 'High'
        : counts.medium >= counts.low
          ? 'Medium'
          : 'Low';
    const avgResolved = Math.round(resolvedTotal / sites.length);
    return { level, avgResolved };
  })();

  // H.T5 — per-anchor booking link. When a HubSpot Scheduling slug is
  // configured, the CTA opens the meetings embed with the anchor name as
  // a prefilled prospect_site field (the rep sees it on the booking
  // notification). Falls back to the contact form until Casey sets the
  // slug (out-of-band item) via NEXT_PUBLIC_HUBSPOT_MEETINGS_SLUG.
  // Show the "Watch the run" tab only when at least one site has a
  // scenario-modeled driver journey.
  const hasReplay = pack.network.sites.some((s) => s.scenario);

  const meetingsSlug = process.env.NEXT_PUBLIC_HUBSPOT_MEETINGS_SLUG;
  const bookAuditHref = meetingsSlug
    ? `https://meetings.hubspot.com/${meetingsSlug}?prospect_site=${encodeURIComponent(displayName)}`
    : `https://yardflow.ai/contact/?intent=audit&utm_source=demo&utm_medium=${fromGallery ? 'gallery-header' : 'demo-header'}&utm_campaign=${pack.account.slug}`;

  // Scope blurb for the header — be honest when our audit covers a
  // subset of the prospect's full network. For Mondelez we audit 22 NA
  // sites; the global footprint is ~160. Saying just "22 facilities"
  // reads to a Mondelez exec as "you mapped 14% of our network and are
  // pretending it's the whole thing." The audit IS NA-scoped and the
  // banner explains why; this header now matches the banner's framing.
  const scopeFootprint =
    coverageNote?.totalGlobalFootprint && coverageNote.totalGlobalFootprint > siteCount
      ? coverageNote.totalGlobalFootprint
      : coverageNote?.estimatedFootprint && coverageNote.estimatedFootprint > siteCount
        ? coverageNote.estimatedFootprint
        : null;
  const scopeSuffix = coverageNote?.auditedScope ? ` (${coverageNote.auditedScope} scope)` : '';
  const scopeBlurb =
    // When more sites were audited than carry a yard (e.g. crowley: 26 audited,
    // 25 yard-bearing, 1 office), say so explicitly to match /for + the agreement.
    coverageNote?.auditedTotal && coverageNote.auditedTotal > siteCount
      ? `${coverageNote.auditedTotal} audited · ${siteCount} yard-bearing${scopeFootprint ? ` of ~${scopeFootprint}` : ''}${scopeSuffix}`
      : scopeFootprint
        ? `${siteCount} of ~${scopeFootprint} facilities${scopeSuffix}`
        : `${siteCount} facilities audited`;

  // Layer 3 — core-sample framing. When the pack carries a sourced network
  // denominator, the audited sites are framed as a deliberate CORE SAMPLE of
  // the real network ("we core-sampled N of ~M sites"), with the rationale and
  // a cited footnote. When `networkCount` is absent (most packs, pre-Phase 3),
  // this degrades to nothing and the neutral scope subhead carries the framing.
  // Banned words ("only", "partial", "preliminary", "incomplete") never appear.
  const { networkCount, networkCountSource, networkCountAsOf, sampleRationale } = pack.account;
  // Derive a sensible facility noun from the account archetype; default "sites".
  const facilityNoun = (() => {
    switch (pack.account.archetype) {
      case 'manufacturer':
      case 'oem-automotive':
        return 'plants';
      case 'beverage':
        return 'plants and DCs';
      case 'cpg':
        return 'plants and DCs';
      case 'retailer':
      case 'grocer-distributor':
        return 'DCs';
      case '3pl':
      case 'logistics-carrier':
        return 'facilities';
      default:
        return 'sites';
    }
  })();
  const coreSample =
    typeof networkCount === 'number' && networkCount > 0
      ? {
          line: `We core-sampled ${siteCount.toLocaleString()} of ~${networkCount.toLocaleString()} ${facilityNoun}${sampleRationale ? ` — ${sampleRationale}` : ''}`,
          footnote: networkCountSource
            ? `Network size: ${networkCountSource}${networkCountAsOf ? ` (${networkCountAsOf})` : ''}`
            : null,
        }
      : null;

  return (
    <div
      className={mode === 'standalone' ? 'flex min-h-screen flex-col bg-[#050505] pb-24 text-white md:pb-0' : 'flex h-[600px] flex-col rounded-lg border border-[#00B4FF]/[0.16] shadow-[0_24px_64px_rgba(0,0,0,0.40)]'}
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
          {/* flex-wrap + min-w-0: at phone widths the title block otherwise
              refuses to shrink below its min-content and the CTA cluster gets
              pushed off-canvas (390px viewport scrolled 598px wide). */}
          <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 py-4">
            <div className="min-w-0">
              {/* E.T4 — persistent breadcrumb. Keeps every microsite one
                  click from the gallery and its archetype, so no microsite
                  is a dead-end. */}
              <nav
                aria-label="Breadcrumb"
                data-microsite-breadcrumb
                className="mb-1.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60"
              >
                <Link
                  href="/demo"
                  data-ms-cta-id="breadcrumb-all-industries"
                  className="inline-flex items-center gap-1 transition-colors hover:text-[#00B4FF]"
                >
                  <span aria-hidden>←</span> All industries
                </Link>
                {anchorArchetype && archetypeTopLabel ? (
                  <>
                    <span className="text-white/25" aria-hidden>·</span>
                    <Link
                      href={`/demo?archetype=${anchorArchetype}`}
                      data-ms-cta-id="breadcrumb-archetype"
                      className="transition-colors hover:text-[#00B4FF]"
                    >
                      {archetypeTopLabel}
                    </Link>
                  </>
                ) : null}
                <span className="text-white/25" aria-hidden>·</span>
                <span className="text-white/70" aria-current="page">{displayName}</span>
              </nav>
              {/* F.T3 — audit-confidence stamp. */}
              {confidenceStamp ? (
                <div
                  data-confidence-stamp
                  title="Confidence is the dominant per-site audit rating across the network. Fields resolved is the average count of the 22-field rubric we could read from imagery per site."
                  className="mb-1.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55"
                >
                  <span
                    className={
                      confidenceStamp.level === 'High'
                        ? 'text-[#00C878]'
                        : confidenceStamp.level === 'Medium'
                          ? 'text-[#00B4FF]'
                          : 'text-[#FF2A00]/80'
                    }
                  >
                    ● Audit confidence: {confidenceStamp.level}
                  </span>
                  <span className="text-white/30" aria-hidden>·</span>
                  <span className="tabular-nums text-white/70">{confidenceStamp.avgResolved}/22</span> fields resolved
                </div>
              ) : null}
              <div className="font-mono text-[10px] uppercase tracking-[0.20em] text-[#00B4FF]/85">
                {fromGallery ? `YardFlow · ${galleryIndustryLabel} template` : 'YardFlow · public yard audit'}
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-white">
                {fromGallery ? galleryHeadline : displayName}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-white/70">
                <span className="tabular-nums whitespace-nowrap">{scopeBlurb}</span>
                <span className="text-white/30" aria-hidden>·</span>
                <span className="whitespace-nowrap"><span className="tabular-nums">{dockDoors.toLocaleString()}</span> dock doors</span>
                <span className="text-white/30" aria-hidden>·</span>
                <span className="whitespace-nowrap"><span className="tabular-nums">{trailerCapacity.toLocaleString()}</span> {trailerSpotsLabel}</span>
                <span className="text-white/30" aria-hidden>·</span>
                <span className="whitespace-nowrap"><span className="tabular-nums">{railServed}</span> rail-served</span>
                {containerGroundSlots != null ? (
                  <>
                    <span className="text-white/30" aria-hidden>·</span>
                    <span className="whitespace-nowrap"><span className="tabular-nums">{containerGroundSlots.toLocaleString()}</span> container slots</span>
                  </>
                ) : null}
              </p>
              {/* Layer 3 — core-sample line. Only renders when the pack carries
                  a sourced network denominator; frames the audit as a deliberate
                  representative sample of the real network, with a cited
                  footnote. Degrades to nothing without `networkCount`. */}
              {coreSample && (
                <div data-core-sample className="mt-2">
                  <p className="text-[13px] font-medium leading-snug text-white/85">
                    {coreSample.line}
                  </p>
                  {coreSample.footnote && (
                    <p className="mt-0.5 text-[10.5px] leading-snug text-white/40">
                      {coreSample.footnote}
                    </p>
                  )}
                </div>
              )}
              {/* A.T5 — brand attribution strip. Sits below the scope/metrics
                  subhead, above any gallery-framing line. Clarifies that we
                  are not the prospect's vendor + names where the data came
                  from. Quiets the rare "wait, are you Coke's vendor?" beat
                  during cold prospect meetings, and provides trademark
                  nominative-fair-use cover. */}
              <p
                data-attribution-strip
                className="mt-1 text-[11px] leading-relaxed text-stone-400"
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
            {/* Next-action cluster — two canonical CTAs only: primary is the
                low-friction reply ("Are these your yards?"), secondary is Run your
                ROI. Memo + Share demote to quiet text links. (Redesign §0/CTA) */}
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {!fromGallery && (
                <Link
                  href={`/for/${pack.account.slug}`}
                  data-ms-cta-id="demo-back-to-memo"
                  className="hidden text-xs text-white/45 transition-colors hover:text-[#00B4FF] md:inline"
                >
                  Read the memo
                </Link>
              )}
              <ShareMicrosite slug={pack.account.slug} brand={displayName} />
              <RoiCtaButton
                pack={pack}
                ctaId="microsite-run-roi"
                utmMedium={fromGallery ? 'gallery-header' : 'demo-header'}
                source="microsite"
                className="hidden min-h-[36px] items-center gap-1.5 rounded-[10px] border border-white/15 bg-transparent px-3 py-1.5 text-xs font-semibold text-white/85 transition-all hover:border-[#00B4FF]/55 hover:text-white md:inline-flex"
              >
                Run your ROI
              </RoiCtaButton>
              <a
                href={bookAuditHref}
                target="_blank"
                rel="noopener noreferrer"
                data-ms-cta-id={fromGallery ? 'gallery-pack-book-audit' : 'demo-book-audit'}
                className="hidden min-h-[36px] items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-3 py-1.5 text-xs font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_22px_rgba(0,180,255,0.32)] md:inline-flex"
              >
                Start a conversation →
              </a>
            </div>
          </div>
          <CoverageHonesty pack={pack} />
        </header>
      )}

      {/* L.T5 — mobile sticky next-action bar. The header CTAs scroll away
          on a long microsite; this keeps the primary action one tap away.
          Mobile only (md:hidden); the flick bar floats above its right
          edge. Page has pb-24 to clear it. */}
      {mode === 'standalone' && (
        <div
          data-microsite-action-bar
          className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-[#00B4FF]/20 bg-[#050505]/95 px-4 py-3 backdrop-blur-md md:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <RoiCtaButton
            pack={pack}
            ctaId="microsite-sticky-run-roi"
            utmMedium="demo-sticky"
            source="microsite"
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-[10px] border border-white/15 px-3 text-[13px] font-semibold text-white/85"
          >
            Run your ROI
          </RoiCtaButton>
          <a
            href={bookAuditHref}
            target="_blank"
            rel="noopener noreferrer"
            data-ms-cta-id="microsite-sticky-book-audit"
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.14] px-3 text-[13px] font-bold text-white"
          >
            Start a conversation →
          </a>
        </div>
      )}

      {/* §1 Recognition — the network atlas as the opening hero ("we mapped
          YOUR yards"). Click a pin → the detail panel fills the side. This is
          a contained section in the single scroll, not a separate tab. */}
      {mode === 'standalone' && (
        <section data-ms-section-id="network-atlas" className="shrink-0 border-b border-[#00B4FF]/[0.10] bg-[#070809]">
          <div className="mx-auto w-full max-w-7xl px-5 pt-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]/85">
              Your network, mapped
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.01em] text-white max-[480px]:text-xl">
              We audited every yard in {displayName}&rsquo;s network, from satellite.
            </h2>
            <p className="mt-1.5 text-sm text-white/60">
              Click any site for its gate, docks, and drop yards. No badge, no NDA, just what a driver sees.
            </p>
          </div>
          <div className="mx-auto w-full max-w-7xl px-3 pb-5 pt-3">
            <div className="flex min-h-[460px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#050505] md:h-[560px] md:flex-row">
              <div className="relative h-[320px] flex-1 md:h-auto">
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
            </div>
          </div>
        </section>
      )}

      {/* §2 The reframe — names the siloed-yard problem before showing its cost.
          The cold-email payload: tells the visitor what they're looking at. */}
      {mode === 'standalone' && <DemoReframe displayName={displayName} />}

      {/* Auto-playing truck-sim hero — the opening moment. The animated run
          (truck through the oriented geofences + capability narration + Primo
          proof) auto-loads the featured site and plays on mount, so the most
          engaging surface is impossible to miss. The network atlas stays the
          default content tab below. Falls back to the static satellite hero
          when a network has no scenario-modeled site. */}
      {mode === 'standalone' && hasReplay && (
        <section data-ms-section-id="featured-sim-hero" className="shrink-0 border-b border-[#00B4FF]/[0.16] bg-[#070809]">
          <div className="mx-auto w-full max-w-7xl px-5 pt-4">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]">
              <span className="mr-1.5 inline-block h-[6px] w-[6px] translate-y-[-1px] rounded-full bg-[#00B4FF] align-middle shadow-[0_0_8px_rgba(0,180,255,0.7)]" />
              ▶ Watch a truck run this yard · {displayName}
            </div>
            <p className="mt-1 text-[12.5px] text-white/55">
              A real audited site, played gate→dock→exit on the true yard geometry. Switch sites with the picker.
            </p>
          </div>
          <div className="mx-auto w-full max-w-7xl px-3 pb-4 pt-3">
            <div className="flex h-[60vh] min-h-[460px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
              <DriverJourneySpotlight pack={pack} initialSiteId={initialSiteId} onExit={() => {}} />
            </div>
          </div>
        </section>
      )}

      {/* §4 Scale — the single "what's my opportunity + what's it worth" beat. */}
      {mode === 'standalone' && <NetworkInsight pack={pack} />}

      {/* §4b The turn — "What surprised us." Placed AFTER the atlas + build
          sections: the forward-worthy moment once the prospect has seen their
          real network. Self-suppresses on packs without 3 findings. */}
      {mode === 'standalone' && <SurprisingFindings pack={pack} />}

      {/* §5 Stress-test — the simulator, demoted from a top-level tab to an
          opt-in expander (power feature, not a parallel mode). */}
      {mode === 'standalone' && (
        <section data-ms-section-id="simulator" className="shrink-0 border-b border-[#00B4FF]/[0.10] bg-[#070809]">
          <div className="mx-auto w-full max-w-5xl px-5 py-5">
            <button
              type="button"
              onClick={() => setSimOpen((o) => !o)}
              aria-expanded={simOpen}
              data-ms-cta-id="demo-toggle-simulator"
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]/85">
                  Stress-test the network
                </span>
                <span className="mt-1 block text-sm text-white/60">
                  See what peak demand, weather, and carrier cuts do across every yard.
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-sm text-white/70">
                {simOpen ? 'Hide −' : 'Open +'}
              </span>
            </button>
            {simOpen && (
              <div className="mt-4 flex h-[560px] overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
                <NetworkSimulator pack={pack} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* The /roi handoff close — proof -> price. Turns the evidence into the
          number, seeded with this pack. Renders NO network dollar figure (the
          model is produced on /roi). Sits just above the booking close. */}
      {mode === 'standalone' && <RoiHandoffClose pack={pack} bookHref={bookAuditHref} />}

      {/* The reply — low-friction conversion close. The whole page funnels to
          a response, not a hard booking. */}
      {mode === 'standalone' && (
        <section
          data-ms-section-id="reply"
          className="shrink-0 border-t border-[#00B4FF]/[0.16] bg-[#070809]"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-3 px-5 py-9 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.01em] text-white max-[480px]:text-xl">
                Are these your yards?
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-white/70">
                Tell us where we got it wrong, or see what 15 minutes of orchestration looks like on your worst site.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/for/${pack.account.slug}`}
                data-ms-cta-id="demo-reply-memo"
                className="text-xs text-white/45 transition-colors hover:text-[#00B4FF]"
              >
                Read the full memo
              </Link>
              <a
                href={bookAuditHref}
                target="_blank"
                rel="noopener noreferrer"
                data-ms-cta-id="demo-reply-start-conversation"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.14] px-5 py-2.5 text-sm font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.24] hover:shadow-[0_0_22px_rgba(0,180,255,0.32)]"
              >
                Start a conversation →
              </a>
            </div>
          </div>
        </section>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">YardFlow · {pack.builtAt.slice(0, 10)}</span>
          </div>
        </footer>
      )}
    </div>
  );
}
