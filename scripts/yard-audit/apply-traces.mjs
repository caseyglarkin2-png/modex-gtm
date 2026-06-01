#!/usr/bin/env node
/**
 * Apply vision-traced fractional geofences to an account's audited site JSONs.
 *
 * Reads (from /tmp/pilot-tiles/<slug>/):
 *   transforms.json  — per-site { id, center, zoom, size }
 *   traces.json      — per-site { perimeter, truckGate, dropYards, dockAprons,
 *                                 staging, svGate } as fraction arrays
 * For each site:
 *   - converts fraction rings -> [{lat,lng}] via the exact Web-Mercator
 *     transform (px2ll math, inlined)
 *   - resolves Street View at svGate (on the road), aimed at the perimeter
 *     centroid (the facility), via sv-meta.mjs
 *   - rewrites output/yard-audits/<slug>/sites/<id>.json IN PLACE, preserving
 *     every other field, replacing geofences and adding streetViewMeta
 *
 * Usage: node apply-traces.mjs <slug>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const TILE = 256;
const slug = process.argv[2];
if (!slug) {
  console.error('usage: node apply-traces.mjs <slug>');
  process.exit(1);
}
const base = `/tmp/pilot-tiles/${slug}`;
const transforms = JSON.parse(readFileSync(`${base}/transforms.json`, 'utf8'));
const traces = JSON.parse(readFileSync(`${base}/traces.json`, 'utf8'));
const tById = new Map(transforms.map((t) => [t.id, t]));

function projectFull(lat, lng, z) {
  const scale = TILE * 2 ** z;
  const siny = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return { x: ((lng + 180) / 360) * scale, y: (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * scale };
}
function unprojectFull(x, y, z) {
  const scale = TILE * 2 ** z;
  const lng = (x / scale) * 360 - 180;
  const latRad = 2 * Math.atan(Math.exp((0.5 - y / scale) * 2 * Math.PI)) - Math.PI / 2;
  return { lat: (latRad * 180) / Math.PI, lng };
}
function fracPtToLL(t, [fx, fy]) {
  const [w, h] = t.size;
  const c = projectFull(t.center.lat, t.center.lng, t.zoom);
  const { lat, lng } = unprojectFull(c.x + (fx - 0.5) * w, c.y + (fy - 0.5) * h, t.zoom);
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}
const ring = (t, pts) => (pts && pts.length >= 3 ? { ring: pts.map((p) => fracPtToLL(t, p)) } : null);
const centroid = (r) => ({
  lat: r.ring.reduce((a, p) => a + p.lat, 0) / r.ring.length,
  lng: r.ring.reduce((a, p) => a + p.lng, 0) / r.ring.length,
});

// Build the Street View query list across all sites (one batched call).
const svQueries = [];
const svPlan = {}; // id -> { gateLL, aim }
for (const [id, tr] of Object.entries(traces)) {
  const t = tById.get(id);
  if (!t || !tr.svGate) continue;
  const gateLL = fracPtToLL(t, tr.svGate);
  const perim = ring(t, tr.perimeter);
  const aim = perim ? centroid(perim) : gateLL;
  svPlan[id] = { gateLL, aim };
  svQueries.push({ key: id, lat: gateLL.lat, lng: gateLL.lng, aimLat: aim.lat, aimLng: aim.lng });
}
let svResult = {};
if (svQueries.length) {
  const r = execFileSync('node', ['scripts/yard-audit/sv-meta.mjs'], { input: JSON.stringify(svQueries), encoding: 'utf8' });
  svResult = JSON.parse(r);
}

let changed = 0;
for (const [id, tr] of Object.entries(traces)) {
  const t = tById.get(id);
  if (!t) {
    console.warn(`no transform for ${id} — skipped`);
    continue;
  }
  const path = `output/yard-audits/${slug}/sites/${id}.json`;
  const site = JSON.parse(readFileSync(path, 'utf8'));

  const perimeter = ring(t, tr.perimeter);
  if (!perimeter) {
    console.warn(`${id}: no valid perimeter — left unchanged`);
    continue;
  }
  const truckGate = ring(t, tr.truckGate);
  const dropYards = (tr.dropYards || []).map((r) => ring(t, r)).filter(Boolean);
  const dockAprons = (tr.dockAprons || []).map((r) => ring(t, r)).filter(Boolean);
  const staging = ring(t, tr.staging);

  const geofences = { perimeter, truckGate, dropYards, dockAprons, staging };

  // Street View: the arrival frame applies to the entrance — attach to both
  // perimeter (arrival) and truckGate when a gate ring exists.
  const sv = svResult[id];
  if (sv && sv.hasCoverage) {
    geofences.streetViewMeta = { perimeter: sv, ...(truckGate ? { truckGate: sv } : {}) };
  }

  site.geofences = geofences;
  writeFileSync(path, JSON.stringify(site, null, 2) + '\n');
  changed++;
  const svTxt = sv ? (sv.hasCoverage ? `SV✓ h${sv.heading}` : 'SV✗') : 'SV—';
  console.log(
    `${id}: perim ${perimeter.ring.length}v · gate ${truckGate ? truckGate.ring.length + 'v' : '—'} · drops ${dropYards.length} · aprons ${dockAprons.length} · ${svTxt}`,
  );
}
console.log(`\n✓ ${changed}/${Object.keys(traces).length} sites updated for ${slug}`);
