'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { ProspectRow, Corridor } from '@/lib/discovery/types';
import { REFERENCE_SITES, PROXIMITY_RING_MILES } from '@/lib/discovery/reference-sites';
import { selectMapMarkers } from '@/lib/discovery/map-markers';

const TIER_COLORS: Record<string, string> = {
  A: '#10b981',
  B: '#f59e0b',
  C: '#f97316',
  D: '#737373',
};

const REFERENCE_COLOR = '#22d3ee'; // cyan — live YardFlow reference sites

// Leaflet renders one SVG node per marker; ~8.7k markers tanks pan/zoom. Cap to
// a marker budget, but never drop a Tier A: selectMapMarkers keeps every Tier A
// (a sellable site must never hide on the map) and fills the rest by worklist
// rank. See src/lib/discovery/map-markers.ts.
const MAX_MARKERS = 1500;

interface Props {
  prospects: ProspectRow[];
  corridors: Corridor[];
  onSelectProspect?: (placeId: string) => void;
}

function FitToBounds({ prospects }: { prospects: ProspectRow[] }) {
  const map = useMap();
  useEffect(() => {
    if (prospects.length === 0) return;
    const lats = prospects.map((p) => p.lat);
    const lngs = prospects.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40], animate: false },
    );
  }, [map, prospects]);
  return null;
}

export default function CorridorMapInner({ prospects, corridors, onSelectProspect }: Props) {
  const corridorList = useMemo(
    () => corridors.filter((c) => c.center.lat && c.center.lng),
    [corridors],
  );

  // Keep every Tier A, then fill the marker budget by worklist rank (order preserved).
  const shown = useMemo(() => selectMapMarkers(prospects, MAX_MARKERS), [prospects]);
  const capped = shown.length < prospects.length;

  return (
    /* `isolate` keeps Leaflet's panes/controls + the z-[1000] legends in their own
       stacking context, so they never paint over app overlays (the email composer,
       dropdowns, the drawer) that portal to body at a lower z-index. */
    <div className="relative isolate h-full w-full" role="region" aria-label="Corridor map: prospects and live YardFlow reference sites">
      {capped && (
        <div className="pointer-events-none absolute right-2 top-2 z-[1000] rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white/85 backdrop-blur-sm">
          Showing {shown.length.toLocaleString()} of {prospects.length.toLocaleString()} — every Tier A kept, rest by rank. Filter to narrow.
        </div>
      )}

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] space-y-1 rounded-md bg-black/70 px-2 py-1.5 text-[10px] text-white/85 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: REFERENCE_COLOR }} />
          Live YardFlow site (Primo)
        </div>
        <div className="flex items-center gap-2">
          {(['A', 'B', 'C'] as const).map((t) => (
            <span key={t} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: TIER_COLORS[t] }} />
              {t}
            </span>
          ))}
          <span className="text-white/55">· rings 5/25/50 mi</span>
        </div>
      </div>

      <MapContainer
        style={{ width: '100%', height: '100%', background: '#0f172a' }}
        center={[39.5, -98.35]}
        zoom={4}
        scrollWheelZoom
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
          maxZoom={19}
        />
        <FitToBounds prospects={shown} />

        {/* Corridor hulls */}
        {corridorList.map((c) => (
          <Circle
            key={`corridor-${c.name}`}
            center={[c.center.lat, c.center.lng]}
            radius={c.radiusMiles * 1609.34}
            pathOptions={{
              color: 'rgba(0,180,255,0.25)',
              fillColor: 'rgba(0,180,255,0.06)',
              fillOpacity: 0.6,
              weight: 1,
            }}
          />
        ))}

        {/* Reference proximity rings (5/25/50 mi) — aligned to the scoring bands */}
        {REFERENCE_SITES.map((site) =>
          PROXIMITY_RING_MILES.map((mi) => (
            <Circle
              key={`ring-${site.name}-${mi}`}
              center={[site.lat, site.lng]}
              radius={mi * 1609.34}
              pathOptions={{
                color: REFERENCE_COLOR,
                opacity: 0.16,
                weight: 1,
                fill: false,
                dashArray: '3 5',
              }}
            />
          )),
        )}

        {/* Prospect markers */}
        {shown.map((p) => (
          <CircleMarker
            key={p.placeId}
            center={[p.lat, p.lng]}
            radius={p.tier === 'A' ? 7 : p.tier === 'B' ? 5 : 4}
            pathOptions={{
              color: '#ffffff',
              weight: 1,
              fillColor: TIER_COLORS[p.tier] ?? TIER_COLORS.D,
              fillOpacity: 0.85,
            }}
            eventHandlers={{
              click: () => onSelectProspect?.(p.placeId),
            }}
          >
            <Popup>
              <div className="bg-[#101218] text-white -m-[14px] -mb-[15px] rounded-[4px] px-3 py-2">
                <div className="text-xs font-medium">{p.name}</div>
                <div className="text-[11px] text-white/55">{p.cityState}</div>
                <div className="mt-1 text-[11px] text-white/70">
                  Score {p.icpScore} · Tier {p.tier} · {p.nearestPrimoDistance.toFixed(1)} mi to Primo
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Reference site markers (drawn last so they sit on top) */}
        {REFERENCE_SITES.map((site) => (
          <CircleMarker
            key={`ref-${site.name}`}
            center={[site.lat, site.lng]}
            radius={6}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: REFERENCE_COLOR,
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="bg-[#101218] text-white -m-[14px] -mb-[15px] rounded-[4px] px-3 py-2">
                <div className="text-xs font-medium">{site.name}</div>
                <div className="text-[11px] text-white/55">{site.city}, {site.state}</div>
                <div className="mt-1 text-[11px]" style={{ color: REFERENCE_COLOR }}>
                  Live YardFlow reference site
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
