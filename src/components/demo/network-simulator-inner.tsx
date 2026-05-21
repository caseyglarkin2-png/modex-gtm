'use client';

import { Fragment, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { NetworkSimState } from '@/lib/demo/network-sim';
import { RISK_COLORS, RISK_LABELS } from '@/lib/demo/network-sim';
import type { BboxTuple } from '@/lib/demo/pack-schema';

/**
 * The Leaflet bits live in a dedicated `*-inner.tsx` because Leaflet
 * touches `window` at module import time. The outer
 * `network-simulator.tsx` dynamically imports this with `ssr: false`.
 *
 * This file is intentionally structured the same way as
 * `network-atlas-inner.tsx` — top-level MapContainer (no Fragment, no
 * inline <style>) — because the atlas hydrates correctly and the
 * simulator was hitting a Turbopack/React 19 edge case where a Fragment
 * with a sibling <style> tag was dropping the dynamic-chunk CSS bundle.
 * The simPulse keyframes for critical-site halos live in globals.css.
 */

interface Props {
  state: NetworkSimState;
  bbox: BboxTuple;
  selectedSiteId: string | null;
  onSelectSite: (siteId: string | null) => void;
}

function FitBounds({ bbox }: { bbox: BboxTuple }) {
  const map = useMap();
  useEffect(() => {
    const [w, s, e, n] = bbox;
    // Leaflet caches container size at init. Force a recompute on the
    // next animation frame so the map has the real container dimensions
    // (the simulator is a lazy-mounted tab, so we cannot assume the
    // container had its final size when Leaflet first measured it).
    const raf = requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
      map.fitBounds(
        [
          [s, w],
          [n, e],
        ],
        { padding: [40, 40], animate: false },
      );
    });
    // Window resize is a cheap insurance for orientation changes and
    // sidebar/drawer toggles that may shift the container later.
    const onResize = () => map.invalidateSize({ animate: false });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [map, bbox]);
  return null;
}

/**
 * Marker size scales with demand so the eye reads both magnitude (radius)
 * and stress (color) simultaneously. Min radius 5px so the smallest
 * site is still clickable on the network-wide map.
 */
function radiusForDemand(demand: number, maxDemand: number): number {
  if (maxDemand <= 0) return 5;
  const ratio = demand / maxDemand;
  return 5 + Math.sqrt(ratio) * 12;
}

/**
 * Critical sites get an extra "halo" marker that pulses via the
 * `.sim-pulse` keyframe in globals.css. Layered underneath the main
 * marker so it doesn't intercept clicks.
 */
function CritHalo({ lat, lng, radius }: { lat: number; lng: number; radius: number }) {
  return (
    <CircleMarker
      center={[lat, lng]}
      radius={radius * 2}
      interactive={false}
      pathOptions={{
        color: RISK_COLORS.critical,
        fillColor: RISK_COLORS.critical,
        fillOpacity: 0.15,
        weight: 0,
        className: 'sim-pulse',
      }}
    />
  );
}

export default function NetworkSimulatorInner({ state, bbox, selectedSiteId, onSelectSite }: Props) {
  const maxDemand = useMemo(() => Math.max(...state.sites.map((s) => s.demand), 1), [state]);

  return (
    <MapContainer
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      center={[39.5, -98.35]}
      zoom={4}
      scrollWheelZoom
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
      />
      <FitBounds bbox={bbox} />

      {state.sites.map((s) => {
        const r = radiusForDemand(s.demand, maxDemand);
        const color = RISK_COLORS[s.riskLevel];
        const isSelected = s.siteId === selectedSiteId;
        return (
          <Fragment key={s.siteId}>
            {s.riskLevel === 'critical' && <CritHalo lat={s.center.lat} lng={s.center.lng} radius={r} />}
            <CircleMarker
              center={[s.center.lat, s.center.lng]}
              radius={r}
              pathOptions={{
                color: isSelected ? '#0f172a' : '#ffffff',
                fillColor: color,
                fillOpacity: 0.85,
                weight: isSelected ? 3 : 1.5,
                className: s.weatherAffected ? 'sim-marker weather-affected' : 'sim-marker',
              }}
              eventHandlers={{
                click: () => onSelectSite(s.siteId === selectedSiteId ? null : s.siteId),
              }}
            >
              <Popup>
                <div className="text-xs font-medium">{s.name}</div>
                <div className="text-[11px] text-stone-600">
                  {RISK_LABELS[s.riskLevel]} · utilization {Math.round(s.utilization * 100)}%
                </div>
                <div className="mt-1 text-[11px] text-stone-500 tabular-nums">
                  {Math.round(s.demand)} demand / {Math.round(s.effectiveCapacity)} capacity moves·day
                </div>
                {s.weatherAffected && (
                  <div className="mt-1 text-[11px] font-medium text-amber-700">⚠ Weather-affected region</div>
                )}
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
