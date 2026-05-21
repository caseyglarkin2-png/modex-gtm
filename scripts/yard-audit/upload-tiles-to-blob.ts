#!/usr/bin/env tsx
/**
 * D2.0 — Upload pre-fetched satellite tiles to Vercel Blob.
 *
 * Run this AFTER provisioning a Blob store in the Vercel dashboard and
 * adding `BLOB_READ_WRITE_TOKEN` to `.env.local`. Replays every local
 * tile JPEG under public/demo-packs/tiles/<slug>/ to Blob and rewrites
 * the matching `Site.tiles[zoom].url` in the pack to the immutable
 * blob URL. Re-validates each pack against `DemoPackSchema` before
 * writing.
 *
 * Usage:
 *   npx tsx scripts/yard-audit/upload-tiles-to-blob.ts <auditSlug>
 *   npx tsx scripts/yard-audit/upload-tiles-to-blob.ts --all
 *
 * The script is idempotent: blobs are content-addressed (immutable URLs),
 * so re-runs return the same URL without re-uploading. Cheap to retry.
 *
 * Cost: ~484 MB across 1,644 JPEGs × $0.15/GB/mo = ~$0.07/mo. Egress free.
 *
 * Why tiles ship to Blob and not the deploy bundle: Vercel deploy uploads
 * 484 MB of tile binaries on every push. Blob hosts them once.
 *
 * Why the demo route still works without running this: Leaflet + ESRI
 * World Imagery is the default tile source. Blob tiles are a future
 * imagery-quality upgrade (Google Static Maps z18 is crisper than ESRI
 * at the same zoom) — not a hard dependency.
 */

import { readFile, writeFile, readdir, existsSync, statSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { put } from '@vercel/blob';
import { DemoPackSchema, type DemoPack } from '../../src/lib/demo/pack-schema';
import { resolveByAuditSlug, allEntries } from './slug-map';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACK_ROOT = join(ROOT, 'public', 'demo-packs');

function loadToken(): string {
  const env = require('node:fs').readFileSync(join(ROOT, '.env.local'), 'utf8') as string;
  const m = env.match(/^BLOB_READ_WRITE_TOKEN=(.+)$/m);
  if (!m || !m[1].trim()) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN missing from .env.local — provision a Blob store via\n' +
        '  vercel.com/dashboard/stores → Create → Blob,\n' +
        'then pull the env via `vercel env pull` (CLI) or copy from the dashboard.',
    );
  }
  return m[1].trim();
}

interface UploadStats {
  uploaded: number;
  skipped: number;
  failed: number;
}

async function uploadAccountTiles(auditSlug: string, token: string): Promise<UploadStats> {
  const { micrositeSlug, displayName } = resolveByAuditSlug(auditSlug);
  const packPath = join(PACK_ROOT, `${micrositeSlug}.json`);
  if (!existsSync(packPath)) {
    console.warn(`  ✗ no pack at ${packPath} — run build-demo-pack.ts first`);
    return { uploaded: 0, skipped: 0, failed: 1 };
  }
  const tileDir = join(PACK_ROOT, 'tiles', micrositeSlug);
  if (!existsSync(tileDir)) {
    console.warn(`  · no local tiles for ${displayName} — run fetch-demo-tiles.ts first`);
    return { uploaded: 0, skipped: 0, failed: 0 };
  }

  console.log(`▶ uploading ${displayName} tiles to Blob`);
  const pack: DemoPack = JSON.parse(await fs.readFile(packPath, 'utf8'));
  const stats: UploadStats = { uploaded: 0, skipped: 0, failed: 0 };

  for (const site of pack.network.sites) {
    if (!site.tiles) continue;
    for (const [zoomStr, tile] of Object.entries(site.tiles)) {
      // Already on Blob — skip
      if (tile.url.startsWith('https://')) {
        stats.skipped++;
        continue;
      }
      const localPath = join(ROOT, 'public', tile.url.replace(/^\//, ''));
      if (!existsSync(localPath)) {
        console.warn(`  ✗ ${site.id}-z${zoomStr}: file not found at ${localPath}`);
        stats.failed++;
        continue;
      }
      try {
        const buf = await fs.readFile(localPath);
        const blobPath = `demo-tiles/${micrositeSlug}/${site.id}-z${zoomStr}.jpg`;
        const result = await put(blobPath, buf, {
          access: 'public',
          token,
          contentType: 'image/jpeg',
          // `addRandomSuffix: false` makes the path deterministic so re-runs
          // overwrite-in-place instead of leaking N copies of the same tile.
          addRandomSuffix: false,
          allowOverwrite: true,
        });
        tile.url = result.url;
        stats.uploaded++;
      } catch (e) {
        console.warn(`  ✗ ${site.id}-z${zoomStr}: ${e instanceof Error ? e.message : String(e)}`);
        stats.failed++;
      }
    }
  }

  // Re-validate + write pack
  const validated = DemoPackSchema.parse(pack);
  await fs.writeFile(packPath, JSON.stringify(validated, null, 2));
  console.log(`  uploaded ${stats.uploaded}, skipped ${stats.skipped}, failed ${stats.failed}`);
  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const slug = args.find((a) => !a.startsWith('--'));

  if (!all && !slug) {
    console.error('usage: npx tsx scripts/yard-audit/upload-tiles-to-blob.ts <auditSlug> | --all');
    process.exit(1);
  }

  const token = loadToken();
  const targets = all ? allEntries().map((e) => e.auditSlug) : [slug!];
  const totals: UploadStats = { uploaded: 0, skipped: 0, failed: 0 };

  for (const t of targets) {
    try {
      const s = await uploadAccountTiles(t, token);
      totals.uploaded += s.uploaded;
      totals.skipped += s.skipped;
      totals.failed += s.failed;
    } catch (e) {
      console.warn(`✗ ${t}: ${e instanceof Error ? e.message : String(e)}`);
      totals.failed++;
    }
  }

  console.log(`\n══ totals: uploaded ${totals.uploaded}, skipped ${totals.skipped}, failed ${totals.failed} ══`);
  if (totals.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
