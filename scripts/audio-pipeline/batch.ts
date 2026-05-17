#!/usr/bin/env tsx
/**
 * Sequential batch runner for the audio pipeline.
 *
 *   npx tsx scripts/audio-pipeline/batch.ts
 *
 * Runs the 12 remaining accounts from the 2026-05-13 batch manifest in
 * order. Headless (uses cached Google profile). Logs per-account result
 * to ./tmp/batch-2026-05-13.log. Continues past failures so a single
 * NotebookLM quota or selector issue does not abort the rest of the run.
 *
 * Each successful account creates its own PR (handled by the pipeline's
 * git stage).
 */
import { execSync, spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ACCOUNTS = [
  'dannon',
  'frito-lay',
  'ab-inbev',
  'coca-cola',
  'kimberly-clark',
  'the-home-depot',
  'john-deere',
  'kenco-logistics-services',
  'hormel-foods',
  'gxo',
  'crowley',
  'mondelez-international',
];

mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true });
const LOG_PATH = resolve(process.cwd(), 'tmp/batch-2026-05-13.log');

function log(line: string): void {
  const stamped = `${new Date().toISOString()} ${line}\n`;
  process.stdout.write(stamped);
  appendFileSync(LOG_PATH, stamped, 'utf8');
}

async function main() {
  log(`batch start — ${ACCOUNTS.length} accounts`);
  const results: Array<{ slug: string; status: 'ok' | 'fail'; ms: number; err?: string }> = [];

  for (const slug of ACCOUNTS) {
    log(`▶ ${slug}: starting`);
    const t0 = Date.now();
    try {
      // Headed mode is required: NotebookLM's audio element only attaches
      // to the DOM when the page is in a visible browser context. Headless
      // browsers throttle media element initialization, so the audio
      // download never materializes. Each account run pops a Chromium
      // window — the cached profile authenticates automatically, the
      // script drives the UI, no human interaction needed.
      const out = spawnSync(
        'npx',
        ['tsx', 'scripts/audio-pipeline/run.ts', '--account', slug, '--headed'],
        {
          stdio: 'inherit',
          shell: true,
          env: { ...process.env },
        },
      );
      const ms = Date.now() - t0;
      if (out.status === 0) {
        log(`✓ ${slug}: complete (${(ms / 1000).toFixed(0)}s)`);
        results.push({ slug, status: 'ok', ms });
      } else {
        log(`✗ ${slug}: failed (exit ${out.status}, ${(ms / 1000).toFixed(0)}s)`);
        results.push({ slug, status: 'fail', ms, err: `exit ${out.status}` });
      }
    } catch (err) {
      const ms = Date.now() - t0;
      log(`✗ ${slug}: error — ${(err as Error).message}`);
      results.push({ slug, status: 'fail', ms, err: (err as Error).message });
    }
    // Reset to main so the next run starts from a clean tree.
    try {
      execSync('git checkout main && git pull --ff-only', { stdio: 'inherit' });
    } catch {
      log(`! ${slug}: could not return to main cleanly — check git status`);
    }
  }

  log('--- batch summary ---');
  for (const r of results) {
    log(`${r.status === 'ok' ? '✓' : '✗'} ${r.slug.padEnd(28)} ${(r.ms / 1000).toFixed(0)}s ${r.err ?? ''}`);
  }
  const ok = results.filter((r) => r.status === 'ok').length;
  log(`batch complete: ${ok}/${results.length} succeeded`);
}

main().catch((err) => {
  log(`batch crashed: ${(err as Error).message}`);
  process.exit(1);
});
