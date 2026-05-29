'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Site } from '@/lib/demo/pack-schema';
import { GEOFENCE_COLORS } from './archetype-palette';
import { DriverJourneyReplay } from './driver-journey-replay';

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

const LAYER_LEGEND: { color: string; label: string; count?: number }[] = [];

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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#00B4FF]/[0.16] px-5 py-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
            Archetype {site.archetype} · {site.archetypeName}
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
        <div className="pointer-events-none absolute bottom-2 left-2 max-w-[180px] rounded-md border border-[#00B4FF]/[0.16] bg-[#0a0c10]/90 px-3 py-2 text-[11px] backdrop-blur">
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
        {/* Yard metrics */}
        <div className="mb-4">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Yard</div>
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

        {/* Classification — only the bands and key booleans, not all 22 fields */}
        <div className="mb-4">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Classification</div>
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

        {/* Dossier excerpt */}
        {site.dossierExcerpt && (
          <div className="mb-4">
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">From our dossier</div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">{site.dossierExcerpt}</p>
          </div>
        )}

        {/* Uncertain fields footer */}
        {site.uncertainFields.length > 0 && (
          <p className="border-t border-[#00B4FF]/[0.16] pt-3 text-[11px] text-white/55">
            Low-confidence fields: {site.uncertainFields.join(', ')}. Imagery couldn't resolve these — happy to be corrected.
          </p>
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
