#!/usr/bin/env node
/**
 * Fetch all satellite tiles for one account into /tmp/pilot-tiles/<slug>/,
 * writing sites.json (id/name/center/span) + transforms.json (per-site
 * center/zoom/size) for the trace agent + apply-traces to consume.
 *
 * Usage: GOOGLE_MAPS_STATIC_API_KEY=... node fetch-account-tiles.mjs <slug>
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const slug = process.argv[2];
if (!slug) { console.error('usage: node fetch-account-tiles.mjs <slug>'); process.exit(1); }
const dir = `output/yard-audits/${slug}/sites`;
const out = `/tmp/pilot-tiles/${slug}`;
mkdirSync(out, { recursive: true });

const files = readdirSync(dir).filter((f) => /^\d\d-.+\.json$/.test(f)).sort();
const sites = [];
for (const f of files) {
  const s = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  if (!s.coords || s.coords.lat == null) { console.error('skip (no coords):', f); continue; }
  const g = s.geofences && s.geofences.perimeter;
  let spanLat = 0.004, spanLng = 0.004;
  if (g && g.south != null) { spanLat = Math.abs(g.north - g.south); spanLng = Math.abs(g.east - g.west); }
  else if (g && g.ring) { const la = g.ring.map((p) => p.lat), ln = g.ring.map((p) => p.lng); spanLat = Math.max(...la) - Math.min(...la); spanLng = Math.max(...ln) - Math.min(...ln); }
  sites.push({ file: f, id: f.replace(/\.json$/, ''), name: s.name, lat: s.coords.lat, lng: s.coords.lng, spanLat: +spanLat.toFixed(5), spanLng: +spanLng.toFixed(5) });
}
writeFileSync(`${out}/sites.json`, JSON.stringify(sites, null, 2));

const tf = [];
for (const s of sites) {
  const o = `${out}/${s.id}.png`;
  try {
    const r = execFileSync('node', ['scripts/yard-audit/fetch-site-tile.mjs', String(s.lat), String(s.lng), String(s.spanLat), String(s.spanLng), o], { encoding: 'utf8' });
    const t = JSON.parse(r); t.id = s.id; t.name = s.name; tf.push(t);
  } catch (e) { console.error('FETCH FAIL', s.id, String(e.message).slice(0, 80)); }
}
writeFileSync(`${out}/transforms.json`, JSON.stringify(tf, null, 2));
console.log(`${slug}: ${tf.length}/${sites.length} tiles -> ${out}`);
