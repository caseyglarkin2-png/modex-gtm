import type { Bbox, GeoPolygon, GeoShape, LatLng } from './pack-schema';

/**
 * Read a geofence shape (legacy Bbox or v2 oriented GeoPolygon) uniformly.
 *
 * Schema v2 introduced oriented polygons; existing packs still carry
 * axis-aligned bboxes. These helpers let every renderer (atlas,
 * simulator, driver-replay, site-detail) consume either shape without
 * branching — a Bbox is treated as its 4-corner rectangle ring.
 */

export function isPolygon(s: GeoShape): s is GeoPolygon {
  return (s as GeoPolygon).ring !== undefined;
}

/** The shape's vertex ring as {lat,lng} points (rectangle for a Bbox). */
export function shapeRing(s: GeoShape): LatLng[] {
  if (isPolygon(s)) return s.ring;
  const b = s as Bbox;
  return [
    { lat: b.south, lng: b.west },
    { lat: b.south, lng: b.east },
    { lat: b.north, lng: b.east },
    { lat: b.north, lng: b.west },
  ];
}

/** Leaflet `<Polygon positions>` form: [[lat, lng], ...]. */
export function shapePositions(s: GeoShape): [number, number][] {
  return shapeRing(s).map((p) => [p.lat, p.lng] as [number, number]);
}

/** Axis-aligned bounds of the shape, as Leaflet [[s,w],[n,e]] (for fitBounds). */
export function shapeBounds(s: GeoShape): [[number, number], [number, number]] {
  if (!isPolygon(s)) {
    const b = s as Bbox;
    return [
      [b.south, b.west],
      [b.north, b.east],
    ];
  }
  let south = 90;
  let west = 180;
  let north = -90;
  let east = -180;
  for (const p of s.ring) {
    south = Math.min(south, p.lat);
    north = Math.max(north, p.lat);
    west = Math.min(west, p.lng);
    east = Math.max(east, p.lng);
  }
  return [
    [south, west],
    [north, east],
  ];
}

/** Centroid (vertex average — adequate for placing a truck dot / label). */
export function shapeCentroid(s: GeoShape): LatLng {
  const ring = shapeRing(s);
  const lat = ring.reduce((a, p) => a + p.lat, 0) / ring.length;
  const lng = ring.reduce((a, p) => a + p.lng, 0) / ring.length;
  return { lat, lng };
}
