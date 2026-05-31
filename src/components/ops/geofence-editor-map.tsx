'use client';

import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Geofence annotation map (Sprint B). Native react-leaflet vertex editing
 * — no leaflet-draw (can't add deps in this env). Renders all layers as
 * polygons; the selected layer's vertices are draggable handles. Map
 * clicks add a vertex (Add mode); vertex clicks delete (Remove mode).
 */

export interface EditorLayer {
  key: string;
  label: string;
  color: string;
  ring: { lat: number; lng: number }[];
}

type Mode = 'move' | 'add' | 'remove';

function vertexIcon(color: string, active: boolean): L.DivIcon {
  const r = active ? 7 : 5;
  return L.divIcon({
    className: 'gf-vertex',
    html: `<div style="width:${r * 2}px;height:${r * 2}px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.4)"></div>`,
    iconSize: [r * 2, r * 2],
    iconAnchor: [r, r],
  });
}

function MapClick({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function GeofenceEditorMap({
  layers,
  selectedKey,
  mode,
  center,
  onVertexDrag,
  onAddVertex,
  onRemoveVertex,
}: {
  layers: EditorLayer[];
  selectedKey: string | null;
  mode: Mode;
  center: { lat: number; lng: number };
  onVertexDrag: (key: string, index: number, lat: number, lng: number) => void;
  onAddVertex: (lat: number, lng: number) => void;
  onRemoveVertex: (key: string, index: number) => void;
}) {
  const selected = layers.find((l) => l.key === selectedKey) ?? null;

  return (
    <MapContainer
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      center={[center.lat, center.lng]}
      zoom={17}
      scrollWheelZoom
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={20}
      />
      {mode === 'add' && selectedKey ? <MapClick onClick={onAddVertex} /> : null}

      {/* All layers as polygons; selected is bold, others dimmed. */}
      {layers.map((l) => {
        const isSel = l.key === selectedKey;
        if (l.ring.length < 2) return null;
        return (
          <Polygon
            key={l.key}
            positions={l.ring.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: l.color,
              weight: isSel ? 3 : 1.5,
              fillOpacity: isSel ? 0.18 : 0.06,
              dashArray: l.key === 'perimeter' ? '5 5' : undefined,
            }}
          />
        );
      })}

      {/* Draggable vertices for the selected layer only. */}
      {selected?.ring.map((p, i) => (
        <Marker
          key={`${selected.key}-${i}`}
          position={[p.lat, p.lng]}
          draggable={mode === 'move'}
          icon={vertexIcon(selected.color, true)}
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onVertexDrag(selected.key, i, ll.lat, ll.lng);
            },
            click: () => {
              if (mode === 'remove') onRemoveVertex(selected.key, i);
            },
          }}
        />
      ))}
    </MapContainer>
  );
}
