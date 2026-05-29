#!/usr/bin/env node
/**
 * Sprint G3 — gallery thumbnail generator.
 *
 * One-shot script. Reads the anchor manifest at
 * `public/gallery-thumbs/manifest.json` and fetches one satellite
 * image per anchor facility from Google Static Maps. Writes the PNGs
 * to `public/gallery-thumbs/<slug>.png` so Vercel serves them from
 * its static CDN. No Blob storage, no runtime fetches, no token gates.
 *
 * Refresh policy: regenerate when audits change. The Tile component
 * loads each thumb via `next/image` with `loading="lazy"` (except the
 * first tile which gets `priority`), so re-deploys cache-bust
 * automatically via the deploy hash query.
 *
 * Run locally:
 *
 *   GOOGLE_MAPS_STATIC_API_KEY=AIza... node scripts/generate-gallery-thumbs.mjs
 *
 * Or with a `.env.local` already loaded:
 *
 *   node --env-file=.env.local scripts/generate-gallery-thumbs.mjs
 *
 * If your existing key has HTTP-referrer restrictions, you have two
 * options:
 *
 *   1. Create a separate server-side key in Google Cloud Console
 *      with NO referrer/IP restrictions (acceptable since this script
 *      runs once per refresh, not in prod). Use that key for this
 *      script only. Rotate / delete after use.
 *
 *   2. Temporarily remove restrictions on the existing key, run
 *      the script, re-add restrictions. ~30 seconds in the Console.
 *
 * The script is idempotent: re-running overwrites the PNGs. To add a
 * new pack, append to `manifest.json` and re-run.
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const apiKey = process.env.GOOGLE_MAPS_STATIC_API_KEY;
if (!apiKey) {
  console.error('Missing GOOGLE_MAPS_STATIC_API_KEY. See script header.');
  process.exit(1);
}

const manifestPath = path.join(process.cwd(), 'public', 'gallery-thumbs', 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('Missing manifest at', manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const outDir = path.join(process.cwd(), 'public', 'gallery-thumbs');

async function fetchOne({ slug, lat, lng }) {
  return new Promise((resolve, reject) => {
    const url =
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${lat},${lng}` +
      `&zoom=17` +
      `&size=640x400` +
      `&scale=2` +
      `&maptype=satellite` +
      `&key=${apiKey}`;
    const out = path.join(outDir, `${slug}.png`);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () =>
            reject(new Error(`${slug}: HTTP ${res.statusCode} ${body.slice(0, 200)}`)),
          );
          return;
        }
        const file = fs.createWriteStream(out);
        res.pipe(file);
        file.on('finish', () => {
          const stat = fs.statSync(out);
          resolve({ slug, bytes: stat.size });
        });
        file.on('error', reject);
      })
      .on('error', reject);
  });
}

let ok = 0;
let fail = 0;
for (const m of manifest) {
  try {
    const r = await fetchOne(m);
    console.log('OK  ', r.slug, '->', r.bytes, 'bytes');
    ok++;
  } catch (e) {
    console.log('FAIL', m.slug, e.message);
    fail++;
  }
  // Polite rate limit — 5 req/sec ceiling for Static Maps.
  await new Promise((r) => setTimeout(r, 220));
}

console.log('');
console.log('summary:', ok, 'ok,', fail, 'failed');
process.exit(fail === 0 ? 0 : 1);
