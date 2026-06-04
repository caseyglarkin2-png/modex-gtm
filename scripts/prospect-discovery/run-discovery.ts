/**
 * Prospect Discovery Pipeline Orchestrator
 *
 * Runs the full prospect discovery pipeline end-to-end:
 *   1. Corridor heatmap analysis (identify dense industrial corridors)
 *   2. Places scanner (discover new facilities near Primo sites)
 *   3. Score and rank (score discoveries against YardFlow ICP)
 *
 * Usage:
 *   npx tsx scripts/prospect-discovery/run-discovery.ts --full
 *   npx tsx scripts/prospect-discovery/run-discovery.ts --quick
 *   npx tsx scripts/prospect-discovery/run-discovery.ts --anchor "Breinigsville PA"
 *   npx tsx scripts/prospect-discovery/run-discovery.ts --heatmap-only
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPTS_DIR = join(ROOT, 'scripts', 'prospect-discovery');
const OUTPUT_DIR = join(ROOT, 'output', 'prospect-discovery');

// ── Types ────────────────────────────────────────────────────────────────

type Mode = 'full' | 'quick' | 'anchor' | 'heatmap-only';

interface PipelineOptions {
  mode: Mode;
  anchorName?: string;
}

interface StepResult {
  name: string;
  success: boolean;
  durationSeconds: number;
  error?: string;
}

interface CorridorHeatmapOutput {
  generatedAt: string;
  totalFacilitiesLoaded: number;
  totalRosters: number;
  corridorCount: number;
  corridors: {
    name: string;
    facilityCount: number;
    accountCount: number;
    verticalCount: number;
    nearestPrimoMiles: number;
    priority: number;
    scanPriority: number;
  }[];
}

// ── Utilities ────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
}

function banner(text: string): void {
  const line = '='.repeat(text.length + 4);
  console.log(`\n${line}`);
  console.log(`  ${text}`);
  console.log(`${line}\n`);
}

function stepHeader(stepNum: number, totalSteps: number, name: string): void {
  console.log(`\n[${'='.repeat(stepNum)}${'-'.repeat(totalSteps - stepNum)}] Step ${stepNum}/${totalSteps}: ${name}`);
  console.log('-'.repeat(60));
}

function runStep(
  name: string,
  command: string,
): StepResult {
  const t0 = Date.now();
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: ROOT,
      timeout: 600_000, // 10 minute timeout per step
    });
    const duration = (Date.now() - t0) / 1000;
    return { name, success: true, durationSeconds: duration };
  } catch (err) {
    const duration = (Date.now() - t0) / 1000;
    const message = err instanceof Error ? err.message : String(err);
    return { name, success: false, durationSeconds: duration, error: message };
  }
}

// ── Argument parsing ─────────────────────────────────────────────────────

function parseArgs(): PipelineOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npx tsx scripts/prospect-discovery/run-discovery.ts [mode]

Modes:
  --full            Run full pipeline: heatmap -> places scanner (all anchors) -> score & rank
  --quick           Run quick pipeline: heatmap -> places scanner (top 5 corridors) -> score & rank
  --anchor "Name"   Run single anchor: heatmap -> places scanner (one anchor) -> score & rank
  --heatmap-only    Run corridor heatmap analysis only

Options:
  --help, -h        Show this help
`);
    process.exit(0);
  }

  if (args.includes('--heatmap-only')) {
    return { mode: 'heatmap-only' };
  }

  if (args.includes('--full')) {
    return { mode: 'full' };
  }

  if (args.includes('--quick')) {
    return { mode: 'quick' };
  }

  const anchorIdx = args.indexOf('--anchor');
  if (anchorIdx !== -1) {
    const anchorName = args[anchorIdx + 1];
    if (!anchorName) {
      console.error('Error: --anchor requires a name argument (e.g., --anchor "Breinigsville PA")');
      process.exit(1);
    }
    return { mode: 'anchor', anchorName };
  }

  console.error('Error: specify a mode (--full, --quick, --anchor "Name", or --heatmap-only)');
  process.exit(1);
}

// ── Pipeline steps ───────────────────────────────────────────────────────

function getTopCorridorAnchors(n: number): string[] {
  const heatmapPath = join(OUTPUT_DIR, 'corridor-heatmap.json');
  if (!existsSync(heatmapPath)) {
    console.warn('Warning: corridor-heatmap.json not found; cannot determine top corridors.');
    return [];
  }

  try {
    const data: CorridorHeatmapOutput = JSON.parse(readFileSync(heatmapPath, 'utf8'));
    // Return the names of the top N corridors by scan priority
    return data.corridors
      .sort((a, b) => a.scanPriority - b.scanPriority)
      .slice(0, n)
      .map((c) => c.name);
  } catch {
    console.warn('Warning: failed to parse corridor-heatmap.json.');
    return [];
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

function main(): void {
  const opts = parseArgs();
  const pipelineStart = Date.now();
  const results: StepResult[] = [];

  const modeLabel = opts.mode === 'anchor'
    ? `anchor: ${opts.anchorName}`
    : opts.mode;

  banner(`Prospect Discovery Pipeline [${modeLabel}]`);

  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Mode: ${modeLabel}`);
  console.log(`Working directory: ${ROOT}`);

  // Determine total steps
  const totalSteps = opts.mode === 'heatmap-only' ? 1 : 3;

  // ── Step 1: Corridor Heatmap ──────────────────────────────────────────

  stepHeader(1, totalSteps, 'Corridor Heatmap Analysis');

  const heatmapScript = join(SCRIPTS_DIR, 'corridor-heatmap.ts');
  if (!existsSync(heatmapScript)) {
    console.error(`Error: corridor-heatmap.ts not found at ${heatmapScript}`);
    process.exit(1);
  }

  const heatmapResult = runStep(
    'Corridor Heatmap',
    `npx tsx ${heatmapScript}`,
  );
  results.push(heatmapResult);

  if (heatmapResult.success) {
    console.log(`\nStep 1 completed in ${formatDuration(heatmapResult.durationSeconds)}.`);
  } else {
    console.error(`\nStep 1 FAILED after ${formatDuration(heatmapResult.durationSeconds)}.`);
    console.error(`Error: ${heatmapResult.error}`);
    if (opts.mode === 'heatmap-only') {
      process.exit(1);
    }
    console.log('Continuing to next step despite heatmap failure...');
  }

  if (opts.mode === 'heatmap-only') {
    printSummary(results, pipelineStart);
    return;
  }

  // ── Step 2: Places Scanner ────────────────────────────────────────────

  stepHeader(2, totalSteps, 'Google Places Corridor Scanner');

  const scannerScript = join(SCRIPTS_DIR, 'places-scanner.ts');
  if (!existsSync(scannerScript)) {
    console.error(`Warning: places-scanner.ts not found at ${scannerScript}`);
    console.error('Skipping places scanner step — will try to score existing data.');
    results.push({
      name: 'Places Scanner',
      success: false,
      durationSeconds: 0,
      error: 'Script not found',
    });
  } else {
    let scannerCmd = `npx tsx ${scannerScript}`;

    if (opts.mode === 'anchor' && opts.anchorName) {
      scannerCmd += ` --anchor "${opts.anchorName}"`;
    } else if (opts.mode === 'quick') {
      // In quick mode, scan only the top 5 corridor anchors
      // The places scanner currently only supports --anchor for a single Primo site,
      // so we run it once per top corridor anchor
      const topCorridors = getTopCorridorAnchors(5);
      if (topCorridors.length > 0) {
        console.log(`Quick mode: scanning top ${topCorridors.length} corridor areas.`);
        console.log(`Corridors: ${topCorridors.join(', ')}\n`);

        // For quick mode, we run the scanner with --dry-run first to show plan,
        // then run it without args (it uses Primo anchors, not corridor names)
        // Since the scanner uses Primo sites as anchors, we just run the full scan
        // The corridor heatmap identifies areas, the scanner covers Primo-adjacent ones
        console.log('Note: places-scanner uses Primo site anchors by default.');
        console.log('Running full anchor scan (Primo-adjacent corridors)...\n');
      }
      // Run full scan for quick mode too (scanner is anchor-based, not corridor-based)
    }

    const scannerResult = runStep('Places Scanner', scannerCmd);
    results.push(scannerResult);

    if (scannerResult.success) {
      console.log(`\nStep 2 completed in ${formatDuration(scannerResult.durationSeconds)}.`);
    } else {
      console.error(`\nStep 2 FAILED after ${formatDuration(scannerResult.durationSeconds)}.`);
      console.error('Will attempt to score any existing scan data...');
    }
  }

  // ── Step 3: Score and Rank ────────────────────────────────────────────

  stepHeader(3, totalSteps, 'Score and Rank Prospects');

  const scoreScript = join(SCRIPTS_DIR, 'score-and-rank.ts');
  if (!existsSync(scoreScript)) {
    console.error(`Warning: score-and-rank.ts not found at ${scoreScript}`);
    results.push({
      name: 'Score & Rank',
      success: false,
      durationSeconds: 0,
      error: 'Script not found',
    });
  } else {
    const scoreResult = runStep('Score & Rank', `npx tsx ${scoreScript}`);
    results.push(scoreResult);

    if (scoreResult.success) {
      console.log(`\nStep 3 completed in ${formatDuration(scoreResult.durationSeconds)}.`);
    } else {
      console.error(`\nStep 3 FAILED after ${formatDuration(scoreResult.durationSeconds)}.`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────

  printSummary(results, pipelineStart);
}

function printSummary(results: StepResult[], pipelineStart: number): void {
  const totalDuration = (Date.now() - pipelineStart) / 1000;

  banner('Pipeline Summary');

  console.log('Step Results:');
  console.log('-'.repeat(60));

  for (const r of results) {
    const status = r.success ? 'PASS' : 'FAIL';
    const icon = r.success ? '[+]' : '[X]';
    console.log(
      `  ${icon} ${r.name.padEnd(25)} ${status.padEnd(6)} ${formatDuration(r.durationSeconds)}`,
    );
    if (!r.success && r.error) {
      // Truncate long error messages
      const errShort = r.error.length > 100
        ? r.error.slice(0, 100) + '...'
        : r.error;
      console.log(`      Error: ${errShort}`);
    }
  }

  console.log('-'.repeat(60));
  console.log(`Total pipeline time: ${formatDuration(totalDuration)}`);
  console.log(`Finished: ${new Date().toISOString()}`);

  // Show output files
  const outputFiles = [
    'corridor-heatmap.json',
    'corridor-scan-*.json',
    'scored-prospects.json',
    'prospects-for-hubspot.csv',
  ];

  console.log('\nOutput files:');
  for (const pattern of outputFiles) {
    if (pattern.includes('*')) {
      // Glob-like check: just see if anything matching exists
      try {
        const { readdirSync } = require('node:fs');
        const prefix = pattern.split('*')[0];
        const files = readdirSync(OUTPUT_DIR).filter((f: string) => f.startsWith(prefix));
        for (const f of files) {
          console.log(`  ${join(OUTPUT_DIR, f)}`);
        }
      } catch {
        // ignore
      }
    } else {
      const fullPath = join(OUTPUT_DIR, pattern);
      if (existsSync(fullPath)) {
        console.log(`  ${fullPath}`);
      }
    }
  }

  const allPassed = results.every((r) => r.success);
  const anyPassed = results.some((r) => r.success);

  if (allPassed) {
    console.log('\nAll steps completed successfully.');
  } else if (anyPassed) {
    const failCount = results.filter((r) => !r.success).length;
    console.log(`\n${failCount} step(s) failed. Review errors above.`);
  } else {
    console.log('\nAll steps failed. Check configuration and dependencies.');
  }

  process.exit(allPassed ? 0 : 1);
}

main();
