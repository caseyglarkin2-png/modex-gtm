#!/usr/bin/env node
/**
 * Resolve per-zone Street View metadata + camera heading.
 *
 * Input (stdin JSON): [{ "key": "truckGate", "lat": <num>, "lng": <num>,
 *                         "aimLat": <num?>, "aimLng": <num?> }, ...]
 *   lat/lng = WHERE to look for a pano (put this on the public road for a real
 *   driver's-eye frame). aimLat/aimLng (optional) = what to point the camera AT
 *   (e.g. the facility entrance); defaults to lat/lng when omitted.
 *
 * For each zone: query the Street View metadata endpoint at lat/lng. If a pano
 * exists (`status: OK`), emit `hasCoverage: true`, the `pano_id`, and a
 * `heading` (0-359) pointing FROM the pano's actual location TOWARD the aim
 * point. No pano -> `hasCoverage: false`.
 *
 * Output (stdout JSON): { "truckGate": {heading,pano,hasCoverage}, ... }
 *
 * Key resolution: process.env.GOOGLE_MAPS_STATIC_API_KEY, else .env.local.
 */
import { readFileSync } from 'node:fs';

function loadKey() {
  if (process.env.GOOGLE_MAPS_STATIC_API_KEY) return process.env.GOOGLE_MAPS_STATIC_API_KEY;
  try {
    const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
    const m = env.match(/^GOOGLE_MAPS_STATIC_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  return null;
}

function bearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = (Math.atan2(y, x) * 180) / Math.PI;
  // round THEN wrap, so 359.6 -> 360 -> 0 (never lands on the invalid 360)
  return Math.round((θ + 360) % 360) % 360;
}

const key = loadKey();
if (!key) {
  console.error('no GOOGLE_MAPS_STATIC_API_KEY (env or .env.local)');
  process.exit(2);
}

let buf = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) buf += chunk;
const zones = JSON.parse(buf);

const out = {};
for (const z of zones) {
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${z.lat},${z.lng}&key=${key}`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    if (j.status === 'OK' && j.location && j.pano_id) {
      const aimLat = z.aimLat ?? z.lat;
      const aimLng = z.aimLng ?? z.lng;
      out[z.key] = {
        heading: bearing(j.location.lat, j.location.lng, aimLat, aimLng),
        pano: j.pano_id,
        hasCoverage: true,
      };
    } else {
      out[z.key] = { heading: 0, pano: '', hasCoverage: false };
    }
  } catch {
    out[z.key] = { heading: 0, pano: '', hasCoverage: false };
  }
}
process.stdout.write(JSON.stringify(out));
