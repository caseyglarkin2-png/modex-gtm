/**
 * GAP Prospecting OS: import PIC charts as DRAFT hypotheses plus signals.
 *
 *   npx tsx scripts/gap/import-pics.ts --dir <pics dir> [--slug honda] [--apply] [--created-by <who>]
 *
 * Dry run by default: plans every chart and prints what WOULD be created
 * without opening a database (`account: unresolved`). With `--apply`,
 * DATABASE_URL must be set; signals are registered, hypotheses are proposed
 * as draft (never activated), and rows the buyer said on tape become
 * unconfirmed BIDs. Re-running with --apply creates nothing new.
 *
 * The pics directory is an argument on purpose. Do not hardcode it.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { applyPlan, createBid, type ApplyDeps, type ApplyReport } from '../../src/lib/gap/import/apply';
import { planPicImport, type PicLike, type PicPlan } from '../../src/lib/gap/import/pic';
import { registerSignal } from '../../src/lib/gap/signals/registry';

interface Args {
  dir: string;
  slug: string | null;
  apply: boolean;
  createdBy: string;
}

function usage(message?: string): never {
  if (message) console.error(message);
  console.error('usage: npx tsx scripts/gap/import-pics.ts --dir <pics dir> [--slug <slug>] [--apply] [--created-by <who>]');
  process.exit(2);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dir: '', slug: null, apply: false, createdBy: 'pic-import' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) usage(`${arg} needs a value`);
      i += 1;
      return value;
    };
    if (arg === '--dir') args.dir = next();
    else if (arg === '--slug') args.slug = next();
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--created-by') args.createdBy = next();
    else usage(`unknown argument ${arg}`);
  }
  if (!args.dir) usage('--dir is required');
  return args;
}

function loadPics(dir: string, slug: string | null): PicLike[] {
  const files = slug
    ? [`${slug}.json`]
    : readdirSync(dir)
        .filter((name) => name.endsWith('.json'))
        .sort();
  const pics: PicLike[] = [];
  for (const name of files) {
    const raw = JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as Partial<PicLike>;
    if (typeof raw.slug !== 'string' || typeof raw.displayName !== 'string' || !Array.isArray(raw.rows)) {
      console.error(`skip ${name}: not a PIC chart (needs slug, displayName, rows)`);
      continue;
    }
    pics.push(raw as PicLike);
  }
  return pics;
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

interface ChartResult {
  slug: string;
  account: string;
  hubspotCompanyId: string | null | 'unresolved';
  summary: PicPlan['summary'];
  report: ApplyReport;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const pics = loadPics(args.dir, args.slug);
  if (pics.length === 0) usage(`no PIC charts found in ${args.dir}`);

  let prisma: any = null;
  let deps = DRY_DEPS;
  if (args.apply) {
    if (!process.env.DATABASE_URL) usage('--apply needs DATABASE_URL in the environment');
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    deps = await liveDeps();
  }

  const now = new Date();
  const results: ChartResult[] = [];
  try {
    for (const pic of pics) {
      let hubspotCompanyId: string | null | 'unresolved' = 'unresolved';
      if (prisma) {
        const account = await prisma.account.findFirst({
          where: { name: pic.displayName },
          select: { hubspot_company_id: true },
        });
        hubspotCompanyId = account?.hubspot_company_id ?? null;
      }
      const plan = planPicImport(pic, {
        accountName: pic.displayName,
        hubspotCompanyId: hubspotCompanyId === 'unresolved' ? null : hubspotCompanyId,
        now,
        registeredBy: args.createdBy,
      });
      const report = await applyPlan(prisma, plan, deps, { dryRun: !args.apply, createdBy: args.createdBy });
      results.push({ slug: plan.slug, account: pic.displayName, hubspotCompanyId, summary: plan.summary, report });
    }
  } finally {
    if (prisma) await prisma.$disconnect();
  }

  console.log(JSON.stringify({ dryRun: !args.apply, dir: args.dir, charts: results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
