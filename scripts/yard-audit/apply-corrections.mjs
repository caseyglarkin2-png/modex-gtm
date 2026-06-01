#!/usr/bin/env node
/**
 * Apply QA perimeter corrections: convert vision-traced fractional perimeters
 * (from /tmp/qa/<slug>/corrections.json) to lat/lng via the site's tile
 * transform and splice them into the audited site JSON's geofences.perimeter.
 * Other geofences (gate/drops/aprons/staging) + streetViewMeta are preserved.
 *
 * Usage: node apply-corrections.mjs <auditSlug>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const TILE = 256;
const slug = process.argv[2];
const base = `/tmp/qa/${slug}`;
const corrections = JSON.parse(readFileSync(`${base}/corrections.json`, 'utf8'));
const tf = JSON.parse(readFileSync(`/tmp/pilot-tiles/${slug}/transforms.json`, 'utf8'));
const tById = new Map(tf.map((t) => [t.id, t]));

function projectFull(lat, lng, z) {
  const s = TILE * 2 ** z;
  const siny = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return { x: ((lng + 180) / 360) * s, y: (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * s };
}
function unprojectFull(x, y, z) {
  const s = TILE * 2 ** z;
  return { lat: ((2 * Math.atan(Math.exp((0.5 - y / s) * 2 * Math.PI)) - Math.PI / 2) * 180) / Math.PI, lng: (x / s) * 360 - 180 };
}
function fracToLL(t, [fx, fy]) {
  const [w, h] = t.size;
  const c = projectFull(t.center.lat, t.center.lng, t.zoom);
  const { lat, lng } = unprojectFull(c.x + (fx - 0.5) * w, c.y + (fy - 0.5) * h, t.zoom);
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

let n = 0;
for (const [id, corr] of Object.entries(corrections)) {
  const t = tById.get(id);
  if (!t || !corr.perimeter || corr.perimeter.length < 3) { console.warn('skip', id); continue; }
  const path = `output/yard-audits/${slug}/sites/${id}.json`;
  const site = JSON.parse(readFileSync(path, 'utf8'));
  site.geofences.perimeter = { ring: corr.perimeter.map((p) => fracToLL(t, p)) };
  writeFileSync(path, JSON.stringify(site, null, 2) + '\n');
  n++;
  console.log(`corrected ${id}: perimeter -> ${corr.perimeter.length}v oriented`);
}
console.log(`\n✓ ${n} perimeters corrected for ${slug}`);
