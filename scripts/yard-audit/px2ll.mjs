#!/usr/bin/env node
/**
 * Deterministic pixel -> lat/lng for Google Maps Static images.
 *
 * The audit vision agents identify property-corner PIXELS on a fetched
 * satellite image; this converts them to geographic coordinates using the
 * exact Web-Mercator transform implied by the image's center/zoom/size/scale.
 * Keeping the trig here (not in the model) is what makes the oriented polygons
 * accurate and repeatable.
 *
 * Input (stdin JSON):
 *   {
 *     "center": { "lat": <num>, "lng": <num> },  // image center (the Static API center=)
 *     "zoom": <int>,                              // Static API zoom=
 *     "size": [<w>, <h>],                         // Static API size= in CSS px (e.g. [640,640])
 *     "points": [[fx,fy], ...]                    // FRACTIONS of the frame, 0..1
 *   }                                             //   fx: 0=left edge, 1=right edge
 *                                                 //   fy: 0=top edge,  1=bottom edge
 * Output (stdout JSON): [[lat,lng], ...]  // same order, rounded to 6 dp
 *
 * Fractions (not absolute pixels) make tracing resolution-independent: a vision
 * agent estimates "this corner is 43% across, 30% down" regardless of how the
 * image was downscaled for display. The frame is always the square Static-API
 * viewport centered on `center` at `zoom`.
 */

const TILE = 256;

function projectFull(lat, lng, z) {
  const scale = TILE * 2 ** z; // world size in px at this zoom
  const siny = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  const x = ((lng + 180) / 360) * scale;
  const y = (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function unprojectFull(x, y, z) {
  const scale = TILE * 2 ** z;
  const lng = (x / scale) * 360 - 180;
  const latRad = 2 * Math.atan(Math.exp((0.5 - y / scale) * 2 * Math.PI)) - Math.PI / 2;
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

function fracToLatLng({ center, zoom, size, points }) {
  const [wCss, hCss] = size;
  const c = projectFull(center.lat, center.lng, zoom); // center in world px
  return points.map(([fx, fy]) => {
    const worldX = c.x + (fx - 0.5) * wCss;
    const worldY = c.y + (fy - 0.5) * hCss;
    const { lat, lng } = unprojectFull(worldX, worldY, zoom);
    return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
  });
}

// ── self-test: `node px2ll.mjs --selftest` ──────────────────────────────────
if (process.argv.includes('--selftest')) {
  const center = { lat: 40.575, lng: -75.629 };
  const cfg = { center, zoom: 18, size: [640, 640] };
  // frac (0.5,0.5) = frame center must map back to center.
  const [[lat, lng]] = fracToLatLng({ ...cfg, points: [[0.5, 0.5]] });
  const dLat = Math.abs(lat - center.lat);
  const dLng = Math.abs(lng - center.lng);
  const ok = dLat < 1e-5 && dLng < 1e-5;
  const [[, lngE]] = fracToLatLng({ ...cfg, points: [[1.0, 0.5]] }); // right edge = +320 css px east
  console.log(JSON.stringify({ centerRoundTrip: { lat, lng, dLat, dLng, ok }, rightEdgeLng: lngE }, null, 2));
  process.exit(ok ? 0 : 1);
}

// ── stdin mode ──────────────────────────────────────────────────────────────
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (buf += d));
process.stdin.on('end', () => {
  const cfg = JSON.parse(buf);
  process.stdout.write(JSON.stringify(fracToLatLng(cfg)));
});
