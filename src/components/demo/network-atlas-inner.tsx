'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ArchetypeId, DemoPack } from '@/lib/demo/pack-schema';
import { ARCHETYPE_COLORS } from './archetype-palette';

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

function makeIcon(color: string, selected: boolean): L.DivIcon {
  const size = selected ? 22 : 16;
  const stroke = selected ? '#0f172a' : '#ffffff';
  const strokeW = selected ? 3 : 2;
  return L.divIcon({
    className: 'demo-site-marker',
    html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - strokeW / 2}" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}" />
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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

  return (
    <MapContainer
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      center={[39.5, -98.35]}
      zoom={4}
      scrollWheelZoom
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        maxZoom={19}
      />
      <FitBounds bbox={pack.network.bbox} />
      <ClosePopupOnSelectChange selectedSiteId={selectedSiteId} />
      {visibleSites.map((site) => (
        <Marker
          key={site.id}
          position={[site.center.lat, site.center.lng]}
          icon={makeIcon(ARCHETYPE_COLORS[site.archetype], site.id === selectedSiteId)}
          eventHandlers={{
            click: () => onSelectSite(site.id === selectedSiteId ? null : site.id),
          }}
        >
          <Popup>
            <div className="text-xs font-medium">{site.name}</div>
            <div className="text-[11px] text-stone-500">{site.type}</div>
            <div className="mt-1 text-[11px] text-stone-600">
              Archetype {site.archetype} · {site.archetypeName}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
