'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { ProspectRow, Corridor } from '@/lib/discovery/types';

const TIER_COLORS: Record<string, string> = {
  A: '#10b981',
  B: '#f59e0b',
  C: '#f97316',
  D: '#737373',
};

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

  return (
    <MapContainer
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      center={[39.5, -98.35]}
      zoom={4}
      scrollWheelZoom
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
      />
      <FitToBounds prospects={prospects} />

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

      {prospects.map((p) => (
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
    </MapContainer>
  );
}
