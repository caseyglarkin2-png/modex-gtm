/**
 * GAP Prospecting OS: import the modex Draft Queue's legacy sequences as
 * families, frozen v1 versions and legacy enrollments, and stamp the
 * sequence items with their version (S3-T5).
 *
 *   GAP_OS_ENABLED=true DATABASE_URL=... \
 *   npx tsx scripts/gap/import-modex-legacy.ts [--apply] [--created-by <who>]
 *
 * Loads every `sequences` row and every DraftQueueItem with a sequence_id
 * from Prisma, loads the ledger rows that already exist, runs the pure
 * planner (`src/lib/gap/import/modex-legacy.ts`) and prints counts plus
 * warnings. Dry run by default: nothing is written. With `--apply`, every
 * write happens inside one transaction: families, versions and enrollments
 * with createMany skipDuplicates (each has a unique or a primary key the
 * plan's deterministic ids hit on a re-run), then the item stamps with
 * `draftQueueItem.updateMany` guarded by `sequence_version_id: null`, so an
 * item stamped by anything else is never overwritten. The output reports
 * both the planned and the written counts, then re-plans and prints the
 * second run's counts, which must be zero.
 *
 * Refuses (exit 1) when GAP_OS_ENABLED is not on (`gap_disabled`) or when
 * DATABASE_URL is unset. Stopped legacy runs carry stop_reason
 * `legacy_unknown` (the only legacy reason the SQL CHECK accepts); the
 * items' own `skipped_reason` is the evidence of why, and the report shows
 * it as `stopped_because`. No HubSpot client is imported; HUBSPOT_ACCESS_TOKEN and MC_API_TOKEN are
 * deleted from process.env before anything else loads, so no code path could
 * reach HubSpot even by accident.
 */
for (const name of ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN'] as const) {
  if (process.env[name] !== undefined) delete process.env[name];
}

import { isGapOsEnabled } from '../../src/lib/gap/flags';
import {
  planModexLegacy,
  type ExistingEnrollment,
  type ExistingFamily,
  type ExistingState,
  type ExistingVersion,
  type LegacySequenceItem,
  type LegacySequenceRow,
  type ModexLegacyPlan,
} from '../../src/lib/gap/import/modex-legacy';
import { LIVE_ENROLLMENT_STATUSES } from '../../src/lib/gap/sequence/family';

interface Args {
  apply: boolean;
  createdBy: string;
}

function usage(message?: string): never {
  if (message) console.error(message);
  console.error('usage: npx tsx scripts/gap/import-modex-legacy.ts [--apply] [--created-by <who>]');
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { apply: false, createdBy: 'modex-legacy-import' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--created-by') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) usage('--created-by needs a value');
      args.createdBy = value;
      i += 1;
    } else usage(`unknown argument ${arg}`);
  }
  return args;
}

const ITEM_SELECT = {
  id: true,
  to_email: true,
  account_name: true,
  persona_id: true,
  owner: true,
  status: true,
  sequence_id: true,
  sequence_run_id: true,
  step_index: true,
  sequence_version_id: true,
  created_at: true,
  updated_at: true,
  sent_at: true,
} as const;

async function loadSource(prisma: any): Promise<{ sequences: LegacySequenceRow[]; items: LegacySequenceItem[] }> {
  const sequences: LegacySequenceRow[] = await prisma.sequence.findMany({
    select: { id: true, name: true, owner: true, steps: true, created_at: true },
    orderBy: { id: 'asc' },
  });
  const items: LegacySequenceItem[] = await prisma.draftQueueItem.findMany({
    where: { sequence_id: { not: null } },
    select: ITEM_SELECT,
    orderBy: { id: 'asc' },
  });
  return { sequences, items };
}

async function loadExisting(prisma: any, items: LegacySequenceItem[]): Promise<ExistingState> {
  const familyRows: Array<{ id: string; legacy_sequence_id: number | null }> = await prisma.sequenceFamily.findMany({
    where: { legacy_sequence_id: { not: null } },
    select: { id: true, legacy_sequence_id: true },
  });
  const familiesByLegacyId: Record<string, ExistingFamily> = {};
  for (const f of familyRows) {
    if (f.legacy_sequence_id !== null) familiesByLegacyId[String(f.legacy_sequence_id)] = { id: f.id, legacy_sequence_id: f.legacy_sequence_id };
  }
  const familyIds = familyRows.map((f) => f.id);

  const versionsByFamilyId: Record<string, ExistingVersion[]> = {};
  if (familyIds.length > 0) {
    const versionRows: ExistingVersion[] = await prisma.sequenceVersion.findMany({
      where: { family_id: { in: familyIds } },
      select: { id: true, family_id: true, version: true, status: true },
    });
    for (const v of versionRows) (versionsByFamilyId[v.family_id] ??= []).push(v);
  }

  const runIds = [...new Set(items.map((i) => i.sequence_run_id).filter((r): r is string => typeof r === 'string' && r.length > 0))];
  const enrollmentsById: Record<string, ExistingEnrollment> = {};
  if (runIds.length > 0) {
    const rows: ExistingEnrollment[] = await prisma.sequenceEnrollment.findMany({
      where: { id: { in: runIds } },
      select: { id: true },
    });
    for (const e of rows) enrollmentsById[e.id] = e;
  }

  const emails = [...new Set(items.map((i) => i.to_email.trim().toLowerCase()).filter(Boolean))];
  const activeEmails = new Set<string>();
  if (emails.length > 0) {
    const live: Array<{ to_email: string }> = await prisma.sequenceEnrollment.findMany({
      where: { to_email: { in: emails }, status: { in: [...LIVE_ENROLLMENT_STATUSES] } },
      select: { to_email: true },
    });
    for (const e of live) activeEmails.add(e.to_email);
  }

  const names = [...new Set(items.map((i) => i.account_name).filter(Boolean))];
  const accountRows: Array<{ name: string }> = names.length
    ? await prisma.account.findMany({ where: { name: { in: names } }, select: { name: true } })
    : [];

  return { familiesByLegacyId, versionsByFamilyId, enrollmentsById, accountNames: new Set(accountRows.map((a) => a.name)), activeEmails };
}

interface ApplyCounts {
  families_written: number;
  versions_written: number;
  enrollments_written: number;
  items_stamped: number;
  items_stamp_skipped: number;
}

async function applyPlan(prisma: any, plan: ModexLegacyPlan): Promise<ApplyCounts> {
  return prisma.$transaction(async (tx: any) => {
    const out: ApplyCounts = { families_written: 0, versions_written: 0, enrollments_written: 0, items_stamped: 0, items_stamp_skipped: 0 };

    if (plan.families.length > 0) {
      const r = await tx.sequenceFamily.createMany({
        data: plan.families.map((f) => ({
          id: f.id,
          engine: f.engine,
          legacy_sequence_id: f.legacy_sequence_id,
          name: f.name,
          created_by: f.created_by,
        })),
        skipDuplicates: true,
      });
      out.families_written = r.count;
    }

    if (plan.versions.length > 0) {
      const r = await tx.sequenceVersion.createMany({
        data: plan.versions.map((v) => ({
          id: v.id,
          family_id: v.family_id,
          version: v.version,
          steps: v.steps,
          steps_hash: v.steps_hash,
          status: v.status,
          provenance: v.provenance,
          frozen_at: v.frozen_at ? new Date(v.frozen_at) : null,
          frozen_by_enrollment_id: null,
          created_by: v.created_by,
        })),
        skipDuplicates: true,
      });
      out.versions_written = r.count;
    }

    if (plan.enrollments.length > 0) {
      const r = await tx.sequenceEnrollment.createMany({
        data: plan.enrollments.map((e) => ({
          id: e.id,
          engine: e.engine,
          family_id: e.family_id,
          sequence_version_id: e.sequence_version_id,
          account_name: e.account_name,
          persona_id: e.persona_id,
          to_email: e.to_email,
          sender: e.sender,
          owner: e.owner,
          status: e.status,
          stop_reason: e.stop_reason,
          stopped_at: e.stopped_at ? new Date(e.stopped_at) : null,
          stopped_by: e.stop_reason ? e.enrolled_by : null,
          completed_at: e.completed_at ? new Date(e.completed_at) : null,
          current_step_index: e.current_step_index,
          rendered_steps: null,
          rendered_steps_hash: null,
          is_test: e.is_test,
          legacy: true,
          enrolled_by: e.enrolled_by,
          enrolled_at: new Date(e.enrolled_at),
        })),
        skipDuplicates: true,
      });
      out.enrollments_written = r.count;
    }

    const idsByVersion = new Map<string, number[]>();
    for (const s of plan.itemStamps) (idsByVersion.get(s.sequence_version_id) ?? idsByVersion.set(s.sequence_version_id, []).get(s.sequence_version_id)!).push(s.id);
    for (const [versionId, ids] of idsByVersion) {
      const r = await tx.draftQueueItem.updateMany({
        where: { id: { in: ids }, sequence_version_id: null },
        data: { sequence_version_id: versionId },
      });
      out.items_stamped += r.count;
    }
    out.items_stamp_skipped = plan.itemStamps.length - out.items_stamped;
    return out;
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!isGapOsEnabled()) {
    console.error('refusing to run: gap_disabled (GAP_OS_ENABLED is not on)');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) usage('DATABASE_URL is required (existing rows are read even in a dry run)');

  const { PrismaClient } = await import('@prisma/client');
  const prisma: any = new PrismaClient();
  try {
    const { sequences, items } = await loadSource(prisma);
    const existing = await loadExisting(prisma, items);
    const plan = planModexLegacy({ sequences, items, existing, opts: { now: new Date(), importedBy: args.createdBy } });

    const report: Record<string, unknown> = {
      dryRun: !args.apply,
      counts: plan.counts,
      warnings: plan.warnings,
      enrollments: plan.enrollments.map((e) => ({ id: e.id, status: e.status, stop_reason: e.stop_reason, stopped_because: e.stopped_because, is_test: e.is_test, items: e.item_ids.length })),
    };

    if (args.apply) {
      report.applied = await applyPlan(prisma, plan);
      const after = await loadSource(prisma);
      const again = planModexLegacy({
        sequences: after.sequences,
        items: after.items,
        existing: await loadExisting(prisma, after.items),
        opts: { now: new Date(), importedBy: args.createdBy },
      });
      report.secondRunCounts = again.counts;
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
