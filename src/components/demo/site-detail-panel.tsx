'use client';

import dynamic from 'next/dynamic';
import type { Site } from '@/lib/demo/pack-schema';
import { GEOFENCE_COLORS } from './archetype-palette';

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
}

function metric(label: string, value: string | number | null | undefined): React.ReactNode {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-sm tabular-nums text-stone-900">{value ?? '—'}</dd>
    </div>
  );
}

const LAYER_LEGEND: { color: string; label: string; count?: number }[] = [];

export function SiteDetailPanel({ site, onClose }: Props) {
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
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-stone-500">
            Archetype {site.archetype} · {site.archetypeName}
          </div>
          <h2 className="mt-1 truncate text-base font-semibold text-stone-900">{site.name}</h2>
          <div className="mt-0.5 truncate text-xs text-stone-600">{site.type}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          aria-label="Close site panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* The map — the visual moment */}
      <div className="relative h-72 w-full shrink-0 overflow-hidden border-b border-stone-200">
        <SiteDetailMap site={site} />
        {/* Legend overlay */}
        <div className="pointer-events-none absolute bottom-2 left-2 max-w-[180px] rounded-md bg-white/90 px-3 py-2 text-[11px] backdrop-blur">
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-stone-500">Geofence layers</div>
          <ul className="space-y-1">
            {legend.map(({ color, label, count }) => (
              <li key={label} className="flex items-center gap-2 text-stone-800">
                <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.7 }} />
                <span>
                  {label}
                  {count > 1 ? ` (${count})` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Scrollable detail */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Yard metrics */}
        <div className="mb-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Yard</div>
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
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-500">Classification</div>
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
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-500">From our dossier</div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{site.dossierExcerpt}</p>
          </div>
        )}

        {/* Uncertain fields footer */}
        {site.uncertainFields.length > 0 && (
          <p className="border-t border-stone-200 pt-3 text-[11px] text-stone-500">
            Low-confidence fields: {site.uncertainFields.join(', ')}. Imagery couldn't resolve these — happy to be corrected.
          </p>
        )}

        <a
          href={site.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-stone-500 transition hover:text-stone-900"
        >
          Open in Google Maps →
        </a>
      </div>
    </div>
  );
}
