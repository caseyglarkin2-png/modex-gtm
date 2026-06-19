'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Site } from '@/lib/demo/pack-schema';
import { GEOFENCE_COLORS } from './archetype-palette';
import { DriverJourneyReplay } from './driver-journey-replay';
import { ZoneStreetView } from './zone-street-view';
import { scoreSite } from '@/lib/demo/yard-complexity';

/**
 * #3 — "what this means". Each audit factor maps to one plain, analytical
 * implication for how the yard runs. Observational, not a pitch: we say what
 * the layout implies and let the operator connect it to their day. No em
 * dashes, no hard sell (see voice rules).
 */
const FACTOR_INSIGHTS: Record<string, string> = {
  docks: 'A high dock-door count means many concurrent loads to sequence and assign.',
  trailers: 'A large trailer yard means more standing inventory to locate and move.',
  drop: 'An active drop yard makes spotter moves the dominant task, and sequencing them is where hours are won or lost.',
  guard: 'A staffed gate ties check-in throughput to a person at the lane.',
  sepgate: 'Separate in and out gates split the flow, so both have to stay coordinated.',
  multistep: 'Multi-step check-in adds handoffs before a truck reaches a door.',
  staging: 'Gate staging means trucks hold before and after the gate, a visible queue and a hidden wait.',
  shiprcv: 'Separate ship and receive means two flows to balance against one yard.',
  backup: 'Backup-sensitive docks make door assignment and timing matter more.',
  conn: 'Connectivity gaps slow anything coordinated by radio or paper.',
  fastlane: 'The layout suggests a fast lane is feasible for known, pre-cleared trucks.',
};

const SiteDetailMap = dynamic(() => import('./site-detail-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center bg-slate-900 text-xs uppercase tracking-widest text-slate-400">
      Loading site…
    </div>
  ),
});

interface Props {
  site: Site;
  onClose: () => void;
  /** When true, open directly in replay mode (D3.4 deep-link). */
  autoPlay?: boolean;
}

function metric(label: string, value: string | number | null | undefined): React.ReactNode {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</dt>
      <dd className="mt-0.5 text-sm tabular-nums text-white">{value ?? '—'}</dd>
    </div>
  );
}

export function SiteDetailPanel({ site, onClose, autoPlay = false }: Props) {
  // Replay mode toggle. Default to autoPlay when the URL deep-link said so
  // (D3.4) AND we actually have a scenario to play; otherwise start on the
  // static detail view and let the user opt in via the Watch button.
  const [replayMode, setReplayMode] = useState<boolean>(autoPlay && !!site.scenario);

  if (replayMode && site.scenario) {
    return <DriverJourneyReplay site={site} scenario={site.scenario} onClose={() => setReplayMode(false)} />;
  }

  const gf = site.geofences;
  const legend = [
    { color: GEOFENCE_COLORS.perimeter, label: 'Property line', count: 1 },
    gf.truckGate ? { color: GEOFENCE_COLORS.truckGate, label: 'Truck gate', count: 1 } : null,
    gf.dropYards.length > 0 ? { color: GEOFENCE_COLORS.dropYard, label: 'Drop yard', count: gf.dropYards.length } : null,
    gf.dockAprons.length > 0 ? { color: GEOFENCE_COLORS.dockApron, label: 'Dock apron', count: gf.dockAprons.length } : null,
    gf.staging ? { color: GEOFENCE_COLORS.staging, label: 'Staging', count: 1 } : null,
  ].filter(Boolean) as { color: string; label: string; count: number }[];

  const c = site.classification;
  const ym = site.yardMetrics;

  // Layer 2 — observed vs. modeled provenance. yardMetrics + classification are
  // OBSERVED facts read off imagery; the imagery date is the audit's evidence
  // stamp. Tiles carry no capture date, so the verification block's imageryDate
  // is the single source. When absent we still label values "observed" but omit
  // the date rather than invent one.
  const imageryDate = site.verification?.imageryDate ?? null;
  const observedLabel = imageryDate ? `observed · imagery ${imageryDate}` : 'observed';

  // #3 — per-site read. The factor scoring is shared with the atlas glow (#2)
  // so the map and the panel always tell the same story about a site.
  const { raw: complexityRaw, factors: complexityFactors } = scoreSite(site);
  const complexityLevel =
    complexityRaw >= 4 ? 'Coordination-heavy yard.' : complexityRaw >= 2 ? 'A few moving parts to keep aligned.' : complexityRaw > 0 ? 'A relatively straightforward yard.' : null;
  const insightLines = complexityFactors
    .map((f) => FACTOR_INSIGHTS[f.key])
    .filter((line): line is string => Boolean(line))
    .slice(0, 3);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#00B4FF]/[0.16] px-5 py-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
            {site.archetypeName}
          </div>
          <h2 className="mt-1 truncate text-base font-semibold text-white">{site.name}</h2>
          <div className="mt-0.5 truncate text-xs text-white/70">{site.type}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-white/40 transition hover:bg-[#00B4FF]/[0.08] hover:text-white/85"
          aria-label="Close site panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* The map — the visual moment */}
      <div className="relative h-72 w-full shrink-0 overflow-hidden border-b border-[#00B4FF]/[0.16]">
        <SiteDetailMap site={site} />
        {/* Legend overlay */}
        <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] max-w-[180px] rounded-md border border-[#00B4FF]/[0.16] bg-[#0a0c10]/90 px-3 py-2 text-[11px] backdrop-blur">
          <div className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">Geofence layers</div>
          <ul className="space-y-1">
            {legend.map(({ color, label, count }) => (
              <li key={label} className="flex items-center gap-2 text-white/90">
                <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.7 }} />
                <span>
                  {label}
                  {count > 1 ? ` (${count})` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {/* Watch-replay CTA — only when we have a scenario for this site */}
        {site.scenario && (
          <button
            type="button"
            onClick={() => setReplayMode(true)}
            data-ms-cta-id="demo-watch-replay"
            className="absolute right-2 top-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-3 py-1.5 text-xs font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_22px_rgba(0,180,255,0.32)]"
            style={{ boxShadow: '0 0 0 1px rgba(0, 180, 255, 0.18) inset, 0 6px 18px rgba(0, 0, 0, 0.35)' }}
          >
            ▶ Watch a truck run this
          </button>
        )}
      </div>

      {/* Scrollable detail */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Driver's-eye Street View — ground-level frames anchored to the zones,
            rendered only where the audit found usable pano coverage. */}
        <ZoneStreetView geofences={site.geofences} />

        {/* #3 — "What this means": the analytical read that turns the metric
            grids below into something an operator can act on. Self-suppresses
            on a site with no notable factors (compact offices, small docks). */}
        {insightLines.length > 0 && (
          <section data-ms-section-id="site-what-this-means" className="mb-5">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00B4FF]/85">
                What this means
              </span>
              {/* Layer 2 — this is an inference from the observed counts, not an
                  observed fact. Label it modeled so the line stays honest. */}
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#00B4FF]/70">modeled</span>
            </div>
            <div className="rounded-lg border border-[#00B4FF]/[0.16] bg-[#00B4FF]/[0.04] px-4 py-3">
              {complexityLevel && (
                <p className="mb-2 text-sm font-semibold text-white">{complexityLevel}</p>
              )}
              <ul className="space-y-1.5">
                {insightLines.map((line) => (
                  <li key={line} className="flex gap-2 text-[12.5px] leading-snug text-white/80">
                    <span aria-hidden className="mt-[2px] shrink-0 text-[#00B4FF]/70">›</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {complexityRaw >= 2 && (
                <p className="mt-2.5 border-t border-white/10 pt-2 text-[11.5px] leading-snug text-white/55">
                  The time here is in the moves between gate and dock, not the work at either end.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Full audit detail — the dense metric + classification grids and the
            raw field notes, collapsed by default so the panel leads with the
            plain-language read above. (Progressive disclosure, redesign §detail.) */}
        <details className="group mb-4 rounded-md border border-[#00B4FF]/[0.12] bg-white/[0.02]">
          <summary className="cursor-pointer list-none px-3 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/65 transition hover:text-white">
            <span className="mr-2 inline-block transition-transform group-open:rotate-90">▸</span>
            Show full audit detail
          </summary>
          <div className="border-t border-[#00B4FF]/[0.12] px-4 py-4">
            {/* Yard metrics — OBSERVED counts read off the imagery (Layer 2). */}
            <div className="mb-4">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Yard</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#00C878]/80">{observedLabel}</span>
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {metric('Dock doors', ym.dockDoorCount?.toLocaleString())}
                {metric('Trailers visible', ym.trailersVisible?.toLocaleString())}
                {metric('Parking capacity', ym.trailerParkingCapacity?.toLocaleString())}
                {metric('Truck gates', ym.truckGateCount?.toLocaleString())}
                {metric('Buildings', ym.buildingCount?.toLocaleString())}
                {metric('Site (acres)', ym.siteAreaAcres?.toLocaleString())}
                {metric('Rail served', ym.railServed === null ? '—' : ym.railServed ? 'Yes' : 'No')}
                {metric('Confidence', site.confidence)}
              </dl>
            </div>

            {/* Classification — bands and key booleans, not all 22 fields.
                OBSERVED off the same imagery (Layer 2). */}
            <div className={site.dossierExcerpt ? 'mb-4' : ''}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Classification</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#00C878]/80">{observedLabel}</span>
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {metric('Dock band', c.dockDoors)}
                {metric('Drop band', c.dropArea)}
                {metric('Truck gate', c.truckGate ? 'Yes' : 'No')}
                {metric('Guard shack', c.guardShack ? 'Yes' : 'No')}
                {metric('Remote check-in', c.remoteGs ? 'Yes' : 'No')}
                {metric('Backup-sensitive', c.backupSensitive ? 'Yes' : 'No')}
                {metric('Fast-lane opp', c.fastLaneOpportunity ? 'Yes' : 'No')}
                {metric('Ship/rcv separate', c.shipRcvSeparate ? 'Yes' : 'No')}
                {metric('Setting', c.urbanRural)}
              </dl>
            </div>

            {/* Raw auditor notes (lat/lng, field codes) — provenance value. */}
            {site.dossierExcerpt && (
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Audit field notes</div>
                <p className="whitespace-pre-line font-mono text-[11.5px] leading-relaxed text-white/60">
                  {site.dossierExcerpt}
                </p>
              </div>
            )}
          </div>
        </details>

        {/* B.T9 — Low-confidence fields with sales@freightroll.com mailto.
            "Happy to be corrected" wrapped in a mailto link so prospects
            can fire a templated email with the brand + uncertain fields
            already filled in. (Casey 2026-05-29: use sales@freightroll
            for now; swap to audits@yardflow.ai when the sending domain
            is rebuilt.) */}
        {/* Layer 2 — confessed uncertainty. What orbit can't resolve, named
            plainly, with the on-site audit as the confirming step. Confidence
            is surfaced alongside so a low-confidence read is never silent. */}
        {(site.uncertainFields.length > 0 || site.confidence !== 'high') && (
          <div className="border-t border-[#00B4FF]/[0.16] pt-3">
            <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">
              What we can&rsquo;t see from orbit{' '}
              <span className="text-white/30">·</span>{' '}
              <span className="text-white/55">read confidence: {site.confidence}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-white/55">
              {site.uncertainFields.length > 0
                ? `Imagery couldn't fully resolve ${site.uncertainFields.join(', ')}. `
                : 'A few fields read at lower confidence from imagery alone. '}
              The 30-minute on-site audit confirms it.{' '}
              <a
                href={`mailto:sales@freightroll.com?subject=Audit correction: ${encodeURIComponent(site.name)}&body=${encodeURIComponent(
                  `Site: ${site.name}\nField: \nCorrection: \n\n`,
                )}`}
                data-ms-cta-id="site-audit-correction-mailto"
                className="text-white/75 underline underline-offset-2 transition-colors hover:text-[#00B4FF]"
              >
                Happy to be corrected.
              </a>
            </p>
          </div>
        )}

        <a
          href={site.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white/55 transition hover:text-white"
        >
          Open in Google Maps →
        </a>
      </div>
    </div>
  );
}
