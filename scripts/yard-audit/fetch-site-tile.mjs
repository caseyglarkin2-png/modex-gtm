#!/usr/bin/env node
/**
 * Fetch a Google Maps Static satellite image sized to fit a site, and print
 * the exact Web-Mercator transform params so px2ll.mjs can convert traced
 * corner pixels back to lat/lng.
 *
 * Usage:
 *   GOOGLE_MAPS_STATIC_API_KEY=... \
 *     node fetch-site-tile.mjs <lat> <lng> <spanLatDeg> <spanLngDeg> <out.png>
 *
 * Picks the highest zoom at which the site (its bbox span, padded ~35%) still
 * fits inside a 640x640 CSS-px frame, then fetches scale=2 (1280x1280 actual).
 * Prints JSON: { center, zoom, size:[640,640], scale:2, out } to stdout.
 */

const TILE = 256;
const SIZE = 640; // CSS px (each side)
const SCALE = 2;
const PAD = 1.35; // show ~35% margin around the site so corners aren't clipped

const [, , latS, lngS, spanLatS, spanLngS, out] = process.argv;
if (!out) {
  console.error('usage: node fetch-site-tile.mjs <lat> <lng> <spanLatDeg> <spanLngDeg> <out.png>');
  process.exit(1);
}
const lat = Number(latS);
const lng = Number(lngS);
const spanLat = Math.max(Number(spanLatS), 1e-4);
const spanLng = Math.max(Number(spanLngS), 1e-4);

// Degrees of longitude covered by the 640px frame at zoom z: 360*SIZE/(TILE*2^z).
// Latitude degrees per frame is Mercator-compressed by ~cos(lat); approximate
// the lat span similarly and require both to fit with padding.
const need = Math.max(spanLng * PAD, (spanLat * PAD) / Math.cos((lat * Math.PI) / 180));
let zoom = Math.floor(Math.log2((360 * SIZE) / (TILE * need)));
zoom = Math.min(20, Math.max(14, zoom)); // sane clamps for yard imagery

const key = process.env.GOOGLE_MAPS_STATIC_API_KEY;
if (!key) {
  console.error('GOOGLE_MAPS_STATIC_API_KEY not set');
  process.exit(2);
}

const url =
  `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
  `&zoom=${zoom}&size=${SIZE}x${SIZE}&scale=${SCALE}&maptype=satellite&key=${key}`;

const res = await fetch(url);
if (!res.ok) {
  console.error(`fetch failed: HTTP ${res.status}`);
  process.exit(3);
}
const buf = Buffer.from(await res.arrayBuffer());
const { writeFile } = await import('node:fs/promises');
await writeFile(out, buf);

console.log(
  JSON.stringify({ center: { lat, lng }, zoom, size: [SIZE, SIZE], scale: SCALE, out, bytes: buf.length }),
);
