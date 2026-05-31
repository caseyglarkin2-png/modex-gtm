'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoShape, Site } from '@/lib/demo/pack-schema';
import { shapeBounds, shapePositions } from '@/lib/demo/geofence-geometry';
import { GEOFENCE_COLORS } from './archetype-palette';

/**
 * The visual moment — a zoomed-in interactive satellite view of one
 * facility with the 5 geofence layers overlaid as colored rectangles.
 *
 * Each layer gets its own color and stroke; the perimeter is rendered
 * underneath so the smaller in-yard features (gate, dock, drop) sit
 * cleanly on top. Fill alpha is kept low (15–25%) so satellite features
 * remain readable through the overlay.
 */

interface Props {
  site: Site;
}

function FitToPerimeter({ perimeter }: { perimeter: GeoShape }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(shapeBounds(perimeter), { padding: [20, 20], animate: false });
  }, [map, perimeter]);
  return null;
}

export default function SiteDetailMapInner({ site }: Props) {
  return (
    <MapContainer
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      // Initial center/zoom is replaced immediately by FitToPerimeter; values here
      // exist only to satisfy Leaflet's constructor.
      center={[site.center.lat, site.center.lng]}
      zoom={17}
      scrollWheelZoom
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
      />
      <FitToPerimeter perimeter={site.geofences.perimeter} />

      <Polygon
        positions={shapePositions(site.geofences.perimeter)}
        pathOptions={{ color: GEOFENCE_COLORS.perimeter, weight: 2, fillOpacity: 0.05, dashArray: '4 4' }}
      />
      {site.geofences.dropYards.map((b, i) => (
        <Polygon
          key={`drop-${i}`}
          positions={shapePositions(b)}
          pathOptions={{ color: GEOFENCE_COLORS.dropYard, weight: 3, fillOpacity: 0.2 }}
        />
      ))}
      {site.geofences.dockAprons.map((b, i) => (
        <Polygon
          key={`dock-${i}`}
          positions={shapePositions(b)}
          pathOptions={{ color: GEOFENCE_COLORS.dockApron, weight: 3, fillOpacity: 0.22 }}
        />
      ))}
      {site.geofences.staging && (
        <Polygon
          positions={shapePositions(site.geofences.staging)}
          pathOptions={{ color: GEOFENCE_COLORS.staging, weight: 3, fillOpacity: 0.22 }}
        />
      )}
      {/* Truck gate on top so it remains the most obvious feature */}
      {site.geofences.truckGate && (
        <Polygon
          positions={shapePositions(site.geofences.truckGate)}
          pathOptions={{ color: GEOFENCE_COLORS.truckGate, weight: 3, fillOpacity: 0.3 }}
        />
      )}
    </MapContainer>
  );
}
