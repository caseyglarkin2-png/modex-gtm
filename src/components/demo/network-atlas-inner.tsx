'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ArchetypeId, DemoPack } from '@/lib/demo/pack-schema';
import { ARCHETYPE_COLORS } from './archetype-palette';
import { networkIntensities } from '@/lib/demo/yard-complexity';

/** Brand cyan used for the complexity glow — signal, not alarm. */
const GLOW = '#00B4FF';

/**
 * The Leaflet bits live in a dedicated `*-inner.tsx` because Leaflet
 * touches `window` at module import time. The outer `network-atlas.tsx`
 * dynamically imports this with `ssr: false`, so the module never loads
 * on the server.
 */

interface Props {
  pack: DemoPack;
  selectedSiteId: string | null;
  archetypeFilter: Set<ArchetypeId> | null;
  onSelectSite: (siteId: string | null) => void;
}

/**
 * Marker = archetype-colored core dot + a soft cyan glow whose radius and
 * opacity scale with the site's audit-complexity intensity (0..1). Brighter
 * means more moving parts in the yard, relative to this network. `seed` keeps
 * the radial-gradient id unique so glows don't cross-reference in the DOM.
 */
function makeIcon(color: string, selected: boolean, intensity: number, seed: string): L.DivIcon {
  const core = selected ? 11 : 8;
  const stroke = selected ? '#0f172a' : '#ffffff';
  const strokeW = selected ? 3 : 2;
  const glow = Math.round(intensity * 14); // px halo beyond the core
  const pad = glow + strokeW + 1;
  const size = (core + pad) * 2;
  const c = size / 2;
  const id = `glow-${seed}`;
  // Solid out to the core edge, then fade to transparent across the halo.
  const corePct = Math.round((core / (core + glow)) * 100);
  const glowAlpha = (0.55 * intensity).toFixed(3);
  const halo =
    glow > 0
      ? `<defs><radialGradient id="${id}" cx="50%" cy="50%" r="50%">
           <stop offset="${corePct}%" stop-color="${GLOW}" stop-opacity="${glowAlpha}" />
           <stop offset="100%" stop-color="${GLOW}" stop-opacity="0" />
         </radialGradient></defs>
         <circle cx="${c}" cy="${c}" r="${core + glow}" fill="url(#${id})" />`
      : '';
  return L.divIcon({
    className: 'demo-site-marker',
    html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${halo}
      <circle cx="${c}" cy="${c}" r="${core}" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}" />
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [c, c],
  });
}

function FitBounds({ bbox }: { bbox: [number, number, number, number] }) {
  const map = useMap();
  useEffect(() => {
    const [w, s, e, n] = bbox;
    map.fitBounds(
      [
        [s, w],
        [n, e],
      ],
      { padding: [40, 40], animate: false },
    );
  }, [map, bbox]);
  return null;
}

/**
 * Close any open Leaflet popup when the selected site changes externally
 * (e.g., user clicks a different marker, or closes the side panel). The
 * popup duplicates info already shown in the side panel; if we leave it
 * open it obscures other markers and reads as a stale overlay. This
 * component lives inside MapContainer so it can call useMap().
 */
function ClosePopupOnSelectChange({ selectedSiteId }: { selectedSiteId: string | null }) {
  const map = useMap();
  useEffect(() => {
    map.closePopup();
  }, [map, selectedSiteId]);
  return null;
}

export default function NetworkAtlasInner({ pack, selectedSiteId, archetypeFilter, onSelectSite }: Props) {
  const visibleSites = useMemo(() => {
    if (!archetypeFilter || archetypeFilter.size === 0) return pack.network.sites;
    return pack.network.sites.filter((s) => archetypeFilter.has(s.archetype));
  }, [pack.network.sites, archetypeFilter]);

  // #2 — audit-complexity intensity per site, normalized across the network.
  const intensities = useMemo(() => networkIntensities(pack.network.sites), [pack.network.sites]);

  // Only surface the legend when the audit actually found a spread of
  // complexity to show — otherwise the glow legend would over-claim.
  const hasGlow = useMemo(
    () => [...intensities.values()].some((v) => v.intensity > 0.05 && v.raw > 0),
    [intensities],
  );

  return (
    <div className="relative h-full w-full">
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
        <FitBounds bbox={pack.network.bbox} />
        <ClosePopupOnSelectChange selectedSiteId={selectedSiteId} />
        {visibleSites.map((site) => {
          const ci = intensities.get(site.id);
          const intensity = site.id === selectedSiteId ? Math.max(ci?.intensity ?? 0, 0.12) : ci?.intensity ?? 0;
          return (
            <Marker
              key={site.id}
              position={[site.center.lat, site.center.lng]}
              icon={makeIcon(ARCHETYPE_COLORS[site.archetype], site.id === selectedSiteId, intensity, site.id)}
              // K.T4 — accessible name for the role=button marker (axe
              // aria-command-name). Title + alt resolve to the site name.
              title={site.name}
              alt={`${site.name} site marker`}
              eventHandlers={{
                click: () => onSelectSite(site.id === selectedSiteId ? null : site.id),
              }}
            >
              <Popup>
                <div className="bg-[#101218] text-white -m-[14px] -mb-[15px] rounded-[4px] px-3 py-2">
                  <div className="text-xs font-medium text-white">{site.name}</div>
                  <div className="text-[11px] text-white/55">{site.type}</div>
                  <div className="mt-1 text-[11px] text-white/70">
                    Archetype {site.archetype} · {site.archetypeName}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* #2 legend — states plainly what the glow encodes, and that it's
          relative to this network. Tactful and factual, not a pitch.
          pointer-events-none so it never intercepts map drags. */}
      {hasGlow && (
        <div
          className="pointer-events-none absolute bottom-2 left-2 z-[1000] max-w-[220px] rounded-md border border-white/10 bg-[#0a0c10]/85 px-2.5 py-2 backdrop-blur"
          data-atlas-legend
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-white/35" />
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ background: `radial-gradient(circle, ${GLOW} 30%, rgba(0,180,255,0.15) 70%, transparent)` }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">simple → complex</span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-white/55">
            Glow = audit-read yard complexity (gates, drop yard, dock scale), relative across this network.
          </p>
        </div>
      )}
    </div>
  );
}
