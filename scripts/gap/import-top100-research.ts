/**
 * GAP Prospecting OS: import Top100 research.v1 files as DRAFT hypotheses
 * plus FACT signals.
 *
 *   npx tsx scripts/gap/import-top100-research.ts --dir <top100 root> [--key honda-com] [--apply] [--run-id <id>] [--created-by <who>]
 *
 * `<top100 root>` holds `run_manifest.json` (its `run_id` names the run
 * unless --run-id overrides it) and `data/research/<key>.json`. Dry run by
 * default: plans and prints what WOULD be created without opening a database.
 * With `--apply`, DATABASE_URL must be set; FACT evidence is registered as
 * signals and one hypothesis per file is proposed as draft, never activated.
 * Re-running with --apply creates nothing new.
 *
 * The top100 root is an argument on purpose. Do not hardcode it.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { applyPlan, createBid, type ApplyDeps, type ApplyReport } from '../../src/lib/gap/import/apply';
import {
  planTop100ResearchImport,
  type ResearchPlan,
  type ResearchV1Like,
} from '../../src/lib/gap/import/top100-research';
import { registerSignal } from '../../src/lib/gap/signals/registry';

interface Args {
  dir: string;
  key: string | null;
  apply: boolean;
  runId: string | null;
  createdBy: string;
}

function usage(message?: string): never {
  if (message) console.error(message);
  console.error(
    'usage: npx tsx scripts/gap/import-top100-research.ts --dir <top100 root> [--key <key>] [--apply] [--run-id <id>] [--created-by <who>]',
  );
  process.exit(2);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dir: '', key: null, apply: false, runId: null, createdBy: 'top100-import' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) usage(`${arg} needs a value`);
      i += 1;
      return value;
    };
    if (arg === '--dir') args.dir = next();
    else if (arg === '--key') args.key = next();
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--run-id') args.runId = next();
    else if (arg === '--created-by') args.createdBy = next();
    else usage(`unknown argument ${arg}`);
  }
  if (!args.dir) usage('--dir is required');
  return args;
}

function resolveRunId(dir: string, override: string | null): string {
  if (override) return override;
  const manifestPath = path.join(dir, 'run_manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { run_id?: unknown };
    if (typeof manifest.run_id === 'string' && manifest.run_id.trim()) return manifest.run_id.trim();
  }
  usage(`no run_manifest.json with run_id under ${dir}; pass --run-id`);
}

function loadResearch(dir: string, key: string | null): ResearchV1Like[] {
  const researchDir = path.join(dir, 'data', 'research');
  if (!existsSync(researchDir)) usage(`${researchDir} does not exist`);
  const files = key
    ? [`${key}.json`]
    : readdirSync(researchDir)
        .filter((name) => name.endsWith('.json'))
        .sort();
  const out: ResearchV1Like[] = [];
  for (const name of files) {
    const raw = JSON.parse(readFileSync(path.join(researchDir, name), 'utf8')) as Partial<ResearchV1Like> & {
      schema?: string;
    };
    if (raw.schema !== 'research.v1' || typeof raw.key !== 'string' || !Array.isArray(raw.evidence) || !raw.causal_chain) {
      console.error(`skip ${name}: not a research.v1 file`);
      continue;
    }
    out.push(raw as ResearchV1Like);
  }
  return out;
}

/** Deps that must never be reached in a dry run. */
const DRY_DEPS: ApplyDeps = {
  registerSignal: async () => {
    throw new Error('dry run reached registerSignal');
  },
  proposeHypothesis: async () => {
    throw new Error('dry run reached proposeHypothesis');
  },
  createBid: async () => {
    throw new Error('dry run reached createBid');
  },
};

async function liveDeps(): Promise<ApplyDeps> {
  const service = await import('../../src/lib/gap/hypothesis/service');
  return { registerSignal, proposeHypothesis: service.proposeHypothesis, createBid };
}

interface FileResult {
  key: string;
  account: string;
  hubspotCompanyId: string | null;
  summary: ResearchPlan['summary'];
  report: ApplyReport;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const runId = resolveRunId(args.dir, args.runId);
  const files = loadResearch(args.dir, args.key);
  if (files.length === 0) usage(`no research.v1 files found under ${args.dir}`);

  let prisma: any = null;
  let deps = DRY_DEPS;
  if (args.apply) {
    if (!process.env.DATABASE_URL) usage('--apply needs DATABASE_URL in the environment');
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    deps = await liveDeps();
  }

  const now = new Date();
  const results: FileResult[] = [];
  try {
    for (const research of files) {
      const hubspotCompanyId = research.company_id?.trim() ? research.company_id.trim() : null;
      const plan = planTop100ResearchImport(research, {
        runId,
        accountName: research.name,
        hubspotCompanyId,
        now,
        registeredBy: args.createdBy,
      });
      const report = await applyPlan(prisma, plan, deps, { dryRun: !args.apply, createdBy: args.createdBy });
      results.push({ key: plan.key, account: research.name, hubspotCompanyId, summary: plan.summary, report });
    }
  } finally {
    if (prisma) await prisma.$disconnect();
  }

  console.log(JSON.stringify({ dryRun: !args.apply, runId, dir: args.dir, files: results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
