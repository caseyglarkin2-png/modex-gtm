/**
 * GAP Prospecting OS: seed the four sequence families (S3-T11).
 *
 *   GAP_OS_ENABLED=true DATABASE_URL=postgresql://... \
 *   npx tsx scripts/gap/seed-families.ts [--apply] [--created-by <who>] [--remote]
 *
 * For each of SEED_FAMILIES (src/lib/gap/sequences/families.ts) it finds or
 * creates the SequenceFamily (engine modex_draft_queue, program gap-seed) by
 * name through `createFamily`, then a draft version through `createVersion`
 * unless a version with the seed's steps hash already exists. It never
 * materializes a runtime Sequence row: that needs a passing GapCompile per
 * step (src/lib/gap/sequences/service.ts). Dry run by default: nothing is
 * written and the report shows what would be. With `--apply` it writes and
 * then re-plans, so the report's `secondRun` shows zero creates.
 *
 * Refuses (exit 1) when GAP_OS_ENABLED is not on (`gap_disabled`), when
 * DATABASE_URL is unset, and, with `--apply`, when DATABASE_URL does not
 * point at 127.0.0.1 or localhost unless `--remote` is passed. No HubSpot
 * client is imported; HUBSPOT_ACCESS_TOKEN and MC_API_TOKEN are deleted from
 * process.env before anything else loads.
 */
for (const name of ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN'] as const) {
  if (process.env[name] !== undefined) delete process.env[name];
}

import { isGapOsEnabled } from '../../src/lib/gap/flags';
import { createFamily } from '../../src/lib/gap/sequence/family';
import { stepsHash } from '../../src/lib/gap/sequence/steps';
import { createVersion } from '../../src/lib/gap/sequence/version';
import { SEED_FAMILIES, SEED_PROGRAM, type SeedFamily } from '../../src/lib/gap/sequences/families';

interface Args {
  apply: boolean;
  createdBy: string;
  remote: boolean;
}

function usage(message?: string): never {
  if (message) console.error(message);
  console.error('usage: npx tsx scripts/gap/seed-families.ts [--apply] [--created-by <who>] [--remote]');
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { apply: false, createdBy: 'gap-seed-families', remote: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--remote') args.remote = true;
    else if (arg === '--created-by') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) usage('--created-by needs a value');
      args.createdBy = value;
      i += 1;
    } else usage(`unknown argument ${arg}`);
  }
  return args;
}

function isLocalDatabase(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]';
  } catch {
    return false;
  }
}

interface FamilyPlan {
  key: string;
  name: string;
  problemFamily: string;
  persona: string;
  stepsHash: string;
  family: { id: string | null; create: boolean };
  version: { id: string | null; version: number | null; create: boolean };
}

async function planFamily(prisma: any, seed: SeedFamily): Promise<FamilyPlan> {
  const hash = stepsHash(seed.steps);
  const existing = await prisma.sequenceFamily.findFirst({
    where: { engine: 'modex_draft_queue', program: SEED_PROGRAM, name: seed.name, archived_at: null },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  });
  if (!existing) {
    return {
      key: seed.key,
      name: seed.name,
      problemFamily: seed.problemFamily,
      persona: seed.persona,
      stepsHash: hash,
      family: { id: null, create: true },
      version: { id: null, version: 1, create: true },
    };
  }
  const versions: Array<{ id: string; version: number; steps_hash: string }> = await prisma.sequenceVersion.findMany({
    where: { family_id: existing.id },
    select: { id: true, version: true, steps_hash: true },
    orderBy: { version: 'asc' },
  });
  const twin = versions.find((v) => v.steps_hash === hash);
  const max = versions.reduce((m, v) => (v.version > m ? v.version : m), 0);
  return {
    key: seed.key,
    name: seed.name,
    problemFamily: seed.problemFamily,
    persona: seed.persona,
    stepsHash: hash,
    family: { id: existing.id, create: false },
    version: twin ? { id: twin.id, version: twin.version, create: false } : { id: null, version: max + 1, create: true },
  };
}

async function applyPlan(prisma: any, seed: SeedFamily, plan: FamilyPlan, createdBy: string): Promise<FamilyPlan> {
  const out: FamilyPlan = { ...plan, family: { ...plan.family }, version: { ...plan.version } };
  let familyId = plan.family.id;
  if (plan.family.create) {
    const created = await createFamily(prisma, {
      name: seed.name,
      engine: 'modex_draft_queue',
      program: SEED_PROGRAM,
      problemFamily: seed.problemFamily,
      persona: seed.persona,
      createdBy,
    });
    if (!created.ok) throw new Error(`createFamily(${seed.key}) refused: ${created.reason}`);
    familyId = created.id;
    out.family.id = familyId;
  }
  if (plan.version.create) {
    const created = await createVersion(prisma, familyId as string, seed.steps, {
      createdBy,
      changeNote: `seed ${seed.key}`,
      provenance: { seed_key: seed.key, source_file: 'src/lib/gap/sequences/families.ts', built_at: new Date().toISOString(), imported_by: createdBy },
    });
    if (!created.ok) throw new Error(`createVersion(${seed.key}) refused: ${created.reason}`);
    out.version.id = created.id;
    out.version.version = created.version;
  }
  return out;
}

function counts(plans: FamilyPlan[]): { families_to_create: number; versions_to_create: number } {
  return {
    families_to_create: plans.filter((p) => p.family.create).length,
    versions_to_create: plans.filter((p) => p.version.create).length,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!isGapOsEnabled()) {
    console.error('refusing to run: gap_disabled (GAP_OS_ENABLED is not on)');
    process.exit(1);
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) usage('DATABASE_URL is required (existing rows are read even in a dry run)');
  if (args.apply && !args.remote && !isLocalDatabase(databaseUrl)) {
    console.error('refusing to apply: DATABASE_URL is not 127.0.0.1 or localhost; pass --remote to seed a non-scratch database');
    process.exit(1);
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma: any = new PrismaClient();
  try {
    const plans: FamilyPlan[] = [];
    for (const seed of SEED_FAMILIES) plans.push(await planFamily(prisma, seed));

    const report: Record<string, unknown> = {
      dryRun: !args.apply,
      program: SEED_PROGRAM,
      databaseHost: new URL(databaseUrl).hostname,
      counts: counts(plans),
      families: plans,
    };

    if (args.apply) {
      const applied: FamilyPlan[] = [];
      for (const seed of SEED_FAMILIES) {
        const plan = plans.find((p) => p.key === seed.key) as FamilyPlan;
        applied.push(await applyPlan(prisma, seed, plan, args.createdBy));
      }
      report.applied = applied;
      const again: FamilyPlan[] = [];
      for (const seed of SEED_FAMILIES) again.push(await planFamily(prisma, seed));
      report.secondRun = { counts: counts(again), families: again };
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
