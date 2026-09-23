/**
 * GAP Prospecting OS: compile the Top100 lane's copy through the message
 * compiler (S3-T10).
 *
 *   npx tsx scripts/gap/compile-top100.ts <laneDir> <outDir> \
 *     [--accounts a,b] [--critic] [--persist] [--now <iso>] [--created-by <who>]
 *   npx tsx scripts/gap/compile-top100.ts <laneDir> <outDir> --summary-only [same flags]
 *
 * Reads every `<laneDir>/data/sequences/*.json` (or only the listed account
 * keys), pairs each with `<laneDir>/data/research/<key>.json`, runs every
 * touch through `compile()` and writes `<outDir>/<key>.json` per account plus
 * `<outDir>/_summary.json`, then prints the per-check table. The lane
 * directory is an argument on purpose; nothing here names it, and nothing is
 * ever written into it.
 *
 * `--summary-only` compiles everything, prints the per-check table and
 * totals, and writes only `<outDir>/_summary.json` (the per-account files
 * are skipped). It is the cheap re-run after a compiler change.
 *
 * Dry run by default: a stub critic answers `review` (R3-14), so the verdict
 * is the deterministic checks alone and a clean step reads review_required,
 * never pass; the report labels `critic: stub` so nobody mistakes the dry
 * run for a judged one. No prisma is touched, and the process exits 0
 * whatever the verdicts are (a reject is a finding, not a failure). Exit 1
 * is reserved for a refusal: `--persist` without `--critic`
 * (`persist_requires_critic`: gate rows must be judged by the real critic),
 * the lane directory is missing (`missing_lane_dir`), `--persist` without
 * GAP_OS_ENABLED (`gap_disabled`) or without a DATABASE_URL
 * (`no_database_url`).
 *
 * `--critic` uses the real clawd client (CLAWD_BASE_URL and MC_API_TOKEN from
 * the environment; the token is never printed). Without `--critic` the token
 * is deleted from the environment before anything loads, and
 * HUBSPOT_ACCESS_TOKEN is always deleted, so no code path can reach HubSpot.
 *
 * `--persist` (with `--critic`) writes one GapCompile row per contact per
 * step through `compile()`; each row's `inputs_snapshot.contract.top100Compile`
 * carries {laneKey, hubspotContactId, personKey, step, stepIndex}, which is
 * the key the enroll-row compile gate (src/lib/gap/routing/enroll-row.ts)
 * reads to decide whether a Top100 contact renders under Enroll or under
 * Skip. `compile()` persists that key, and honours the lane's word range,
 * only when `createdBy` starts with `compile-top100` (R3-3), so
 * `--created-by <who>` is recorded as `compile-top100:<who>`; the summary
 * file carries the value used.
 *
 * Privacy (N11): stdout and `_summary.json` show a person as the HubSpot
 * contact id (else initials), never the lane's persona name; the
 * per-account files in `<outDir>` keep the names and stay local.
 */
const WANT_CRITIC = process.argv.includes('--critic');
if (process.env.HUBSPOT_ACCESS_TOKEN !== undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
if (!WANT_CRITIC && process.env.MC_API_TOKEN !== undefined) delete process.env.MC_API_TOKEN;

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { validateClaimsUsed } from '../../src/lib/gap/claims/validate-claims';
import { COMPILER_VERSION } from '../../src/lib/gap/compiler';
import { compile, type CompileDeps, type CompileResult } from '../../src/lib/gap/compiler/compile';
import { redactWorst } from '../../src/lib/gap/compiler/redact-person';
import { makeCriticClient, type CriticClient } from '../../src/lib/gap/critic-client';
import { isGapOsEnabled } from '../../src/lib/gap/flags';
import {
  TOP100_COMPILE_CREATED_BY,
  buildAccountReport,
  compiledSteps,
  reduceReport,
  toCompileInputs,
  type CompiledStep,
  type LaneResearchFile,
  type LaneSequenceFile,
  type Top100CompileEntry,
} from '../../src/lib/gap/import/top100-compile';

interface Args {
  laneDir: string;
  outDir: string;
  accounts: string[] | null;
  critic: boolean;
  persist: boolean;
  summaryOnly: boolean;
  now: Date;
  createdBy: string;
}

function usage(message?: string): never {
  if (message) console.error(message);
  console.error(
    'usage: npx tsx scripts/gap/compile-top100.ts <laneDir> <outDir> [--accounts a,b] [--critic] [--persist] [--summary-only] [--now <iso>] [--created-by <who>]',
  );
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    laneDir: '',
    outDir: '',
    accounts: null,
    critic: false,
    persist: false,
    summaryOnly: false,
    now: new Date(),
    createdBy: TOP100_COMPILE_CREATED_BY,
  };
  const takeValue = (flag: string, i: number): string => {
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) usage(`${flag} needs a value`);
    return value;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--critic') args.critic = true;
    else if (arg === '--persist') args.persist = true;
    else if (arg === '--summary-only') args.summaryOnly = true;
    else if (arg === '--accounts') {
      args.accounts = takeValue(arg, i).split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      i += 1;
    } else if (arg === '--now') {
      const now = new Date(takeValue(arg, i));
      if (Number.isNaN(now.getTime())) usage('--now must be an ISO date');
      args.now = now;
      i += 1;
    } else if (arg === '--created-by') {
      // compile() keys the adapter path off this prefix (R3-3); never let a
      // custom actor drop the lane rows off the enroll gate's lookup.
      args.createdBy = `${TOP100_COMPILE_CREATED_BY}:${takeValue(arg, i)}`;
      i += 1;
    } else if (arg.startsWith('--')) usage(`unknown argument ${arg}`);
    else if (!args.laneDir) args.laneDir = arg;
    else if (!args.outDir) args.outDir = arg;
    else usage(`unexpected argument ${arg}`);
  }
  if (!args.laneDir) usage('<laneDir> is required');
  if (!args.outDir) usage('<outDir> is required');
  if (args.persist && !args.critic) {
    console.error('persist_requires_critic: --persist writes enroll-gate rows, and the dry-run stub critic never judges them; add --critic');
    process.exit(1);
  }
  return args;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

/**
 * The dry-run critic. It answers `review`, never `pass`: a dry run is the
 * deterministic checks alone, and a step that clears them must still read
 * review_required until the real critic (`--critic`) has judged it (R3-14).
 */
const STUB_CRITIC: CriticClient = {
  score: async () => ({ ok: true, verdict: 'review', score: 0, findings: [] }),
};

function pad(value: string | number, width: number): string {
  const s = String(value);
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

function printTable(summary: ReturnType<typeof reduceReport>): void {
  console.log('');
  console.log(`${pad('check', 7)}${pad('pass', 8)}${pad('review', 8)}${pad('reject', 8)}`);
  for (const [code, counts] of Object.entries(summary.perCheck)) {
    console.log(`${pad(code, 7)}${pad(counts.pass, 8)}${pad(counts.review, 8)}${pad(counts.reject, 8)}`);
  }
  console.log('');
  const t = summary.totals;
  console.log(`verdicts: pass ${t.pass}, review_required ${t.review}, reject ${t.reject} (${t.steps} steps, ${t.accounts} accounts)`);
  if (summary.worst.length > 0) {
    console.log('');
    console.log('worst:');
    for (const w of summary.worst) {
      console.log(`  ${w.account} | ${w.person} | step ${w.step} | ${w.verdict} (${w.failed} failed) | ${w.code}: ${w.detail}`);
    }
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const sequencesDir = path.join(args.laneDir, 'data', 'sequences');
  const researchDir = path.join(args.laneDir, 'data', 'research');
  if (!existsSync(args.laneDir) || !existsSync(sequencesDir)) {
    console.error(`missing_lane_dir: ${sequencesDir} not found`);
    process.exit(1);
  }

  let prisma: any = undefined;
  if (args.persist) {
    if (!isGapOsEnabled()) {
      console.error('gap_disabled: --persist needs GAP_OS_ENABLED=true');
      process.exit(1);
    }
    if (!process.env.DATABASE_URL) {
      console.error('no_database_url: --persist needs DATABASE_URL');
      process.exit(1);
    }
    const mod = await import('../../src/lib/prisma');
    prisma = mod.prisma;
  }

  const critic: CriticClient = args.critic ? makeCriticClient() : STUB_CRITIC;
  const criticLabel = args.critic ? 'clawd' : 'stub';

  let namedPipeline: string[] = [];
  const pipelineFile = path.join(args.laneDir, 'data', 'pipeline_names.json');
  if (existsSync(pipelineFile)) {
    try {
      const raw = readJson<{ names?: unknown }>(pipelineFile);
      if (Array.isArray(raw.names)) namedPipeline = raw.names.filter((n): n is string => typeof n === 'string');
    } catch (error) {
      console.error(`pipeline_names_unreadable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const keys = readdirSync(sequencesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -'.json'.length))
    .filter((k) => !args.accounts || args.accounts.includes(k))
    .sort();
  if (args.accounts) {
    for (const wanted of args.accounts) {
      if (!keys.includes(wanted)) console.error(`no_sequence:${wanted}`);
    }
  }

  mkdirSync(args.outDir, { recursive: true });

  const deps: CompileDeps = {
    critic,
    validateClaims: validateClaimsUsed,
    now: () => args.now,
    ...(prisma ? { prisma } : {}),
  };

  const globalWarnings: string[] = [];
  const allSteps: CompiledStep[] = [];
  const accountWarnings: Record<string, string[]> = {};
  let accountsCompiled = 0;

  for (const key of keys) {
    const researchFile = path.join(researchDir, `${key}.json`);
    if (!existsSync(researchFile)) {
      globalWarnings.push(`no_research:${key}`);
      continue;
    }
    const sequence = readJson<LaneSequenceFile>(path.join(sequencesDir, `${key}.json`));
    const research = readJson<LaneResearchFile>(researchFile);
    const prepared = toCompileInputs(sequence, research, {
      now: args.now,
      claimsValidator: validateClaimsUsed,
      namedPipeline,
      createdBy: args.createdBy,
    });

    const results = new Map<Top100CompileEntry, CompileResult>();
    for (const entry of prepared.inputs) {
      results.set(entry, await compile(entry.input, deps));
    }

    if (!args.summaryOnly) {
      const report = buildAccountReport(prepared, results, { now: args.now, compilerVersion: COMPILER_VERSION, critic: criticLabel });
      writeFileSync(path.join(args.outDir, `${key}.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    }
    allSteps.push(...compiledSteps(prepared, results));
    if (prepared.warnings.length > 0) accountWarnings[key] = prepared.warnings;
    accountsCompiled += 1;
  }

  // N11: stdout and the summary file leave the machine; persona names do not.
  const summary = { ...reduceReport(allSteps), worst: redactWorst(reduceReport(allSteps).worst, allSteps) };
  const summaryFile = {
    schema: 'gap-compile-top100-summary.v1',
    compiledAt: args.now.toISOString(),
    compilerVersion: COMPILER_VERSION,
    critic: criticLabel,
    persisted: args.persist,
    createdBy: args.createdBy,
    summaryOnly: args.summaryOnly,
    laneDir: path.resolve(args.laneDir),
    accountsRequested: keys.length,
    accountsCompiled,
    namedPipelineCount: namedPipeline.length,
    warnings: globalWarnings,
    accountWarnings,
    ...summary,
  };
  writeFileSync(path.join(args.outDir, '_summary.json'), `${JSON.stringify(summaryFile, null, 2)}\n`, 'utf8');

  console.log(
    `compile-top100: ${accountsCompiled}/${keys.length} accounts, ${summary.totals.steps} steps, critic=${criticLabel}, persist=${args.persist}, now=${args.now.toISOString()}`,
  );
  if (globalWarnings.length > 0) console.log(`warnings: ${globalWarnings.join(', ')}`);
  const warningCount = Object.values(accountWarnings).reduce((n, w) => n + w.length, 0);
  if (warningCount > 0) console.log(`account warnings: ${warningCount} across ${Object.keys(accountWarnings).length} accounts (see _summary.json)`);
  printTable(summary);
  console.log(args.summaryOnly ? `\nsummary only: wrote ${path.resolve(path.join(args.outDir, '_summary.json'))}` : `\nwrote ${path.resolve(args.outDir)}`);
  if (prisma?.$disconnect) await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
