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
    // Leaflet caches container size at MapContainer init. The simulator
    // is a lazy-mounted tab, so we cannot assume the container had its
    // final size when Leaflet first measured it — call invalidateSize()
    // before fitBounds() and skip fitting if the container is somehow
    // still 0x0 (avoids NaN center/zoom on a malformed layout).
    const fit = () => {
      map.invalidateSize({ animate: false });
      const sz = map.getSize();
      if (sz.x > 0 && sz.y > 0) {
        map.fitBounds(
          [
            [s, w],
            [n, e],
          ],
          { padding: [40, 40], animate: false },
        );
      }
    };
    fit();
    // Belt-and-suspenders: re-fit at 100ms and 500ms in case anything
    // slow-loads (fonts, images) and shifts layout after first paint.
    const t1 = setTimeout(fit, 100);
    const t2 = setTimeout(fit, 500);
    const onResize = () => map.invalidateSize({ animate: false });
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
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
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
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
                <div className="bg-[#101218] text-white -m-[14px] -mb-[15px] rounded-[4px] px-3 py-2">
                  <div className="text-xs font-medium text-white">{s.name}</div>
                  <div className="text-[11px] text-white/70">
                    {RISK_LABELS[s.riskLevel]} · utilization {Math.round(s.utilization * 100)}%
                  </div>
                  <div className="mt-1 text-[11px] text-white/55 tabular-nums">
                    {Math.round(s.demand)} demand / {Math.round(s.effectiveCapacity)} capacity moves·day
                  </div>
                  {s.weatherAffected && (
                    <div className="mt-1 text-[11px] font-medium text-amber-400">⚠ Weather-affected region</div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
