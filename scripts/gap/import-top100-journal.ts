/**
 * GAP Prospecting OS: import the Top100 lane journal as families, versions,
 * copy events and legacy enrollment attribution (S3-T4).
 *
 *   GAP_OS_ENABLED=true DATABASE_URL=... \
 *   npx tsx scripts/gap/import-top100-journal.ts <laneDir> [--apply] [--created-by <who>]
 *
 * Reads `<laneDir>/crm_changes.jsonl` and `<laneDir>/run_manifest.json`
 * (the lane directory is an argument on purpose; nothing here names it),
 * loads the existing ledger rows from Prisma, runs the pure planner and
 * prints counts plus warnings. Dry run by default: nothing is written.
 * With `--apply`, every write happens inside one transaction: families and
 * versions with createMany, copy events with createMany skipDuplicates, and
 * enrollment attribution through a raw UPDATE guarded by
 * `legacy = true AND engine = 'hubspot_native' AND rendered_steps IS NULL`.
 * That is exactly the backfill arm of the GAP_ENROLLMENT_PIN trigger (R3-1):
 * the three attribution columns (`sequence_version_id`, `rendered_steps`,
 * `rendered_steps_hash`) may change once, in one statement, on a HubSpot
 * legacy row that has no rendered copy yet, to a version of the row's own
 * family, and never again. The output reports both the planned and the
 * written counts.
 *
 * Refuses (exit 1) when GAP_OS_ENABLED is not on (`gap_disabled`), when
 * DATABASE_URL is unset, or when the lane files are missing. No HubSpot
 * client is imported; HUBSPOT_ACCESS_TOKEN and MC_API_TOKEN are deleted from
 * process.env before anything else loads, so no code path could reach
 * HubSpot even by accident.
 */
for (const name of ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN'] as const) {
  if (process.env[name] !== undefined) delete process.env[name];
}

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { isGapOsEnabled } from '../../src/lib/gap/flags';
import {
  parseJournal,
  planTop100Journal,
  type ExistingEnrollment,
  type ExistingFamily,
  type ExistingState,
  type ExistingVersion,
  type JournalPlan,
} from '../../src/lib/gap/import/top100-journal';
import { readManifest } from '../../src/lib/gap/top100/reader';

interface Args {
  laneDir: string;
  apply: boolean;
  createdBy: string;
}

function usage(message?: string): never {
  if (message) console.error(message);
  console.error('usage: npx tsx scripts/gap/import-top100-journal.ts <laneDir> [--apply] [--created-by <who>]');
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { laneDir: '', apply: false, createdBy: 'top100-journal-import' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--created-by') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) usage('--created-by needs a value');
      args.createdBy = value;
      i += 1;
    } else if (arg.startsWith('--')) usage(`unknown argument ${arg}`);
    else if (!args.laneDir) args.laneDir = arg;
    else usage(`unexpected argument ${arg}`);
  }
  if (!args.laneDir) usage('<laneDir> is required');
  return args;
}

async function loadExisting(prisma: any, accountNames: string[]): Promise<ExistingState> {
  const familyRows: Array<{ id: string; hubspot_sequence_id: string | null }> = await prisma.sequenceFamily.findMany({
    where: { engine: 'hubspot_native', hubspot_sequence_id: { not: null } },
    select: { id: true, hubspot_sequence_id: true },
  });
  const familiesByHubspotId: Record<string, ExistingFamily> = {};
  for (const f of familyRows) {
    if (f.hubspot_sequence_id) familiesByHubspotId[f.hubspot_sequence_id] = { id: f.id, hubspot_sequence_id: f.hubspot_sequence_id };
  }
  const familyIds = familyRows.map((f) => f.id);

  const versionsByFamilyId: Record<string, ExistingVersion[]> = {};
  if (familyIds.length > 0) {
    const versionRows: Array<ExistingVersion & { steps: unknown }> = await prisma.sequenceVersion.findMany({
      where: { family_id: { in: familyIds } },
      select: { id: true, family_id: true, version: true, status: true, provenance: true, created_at: true, steps: true },
    });
    for (const v of versionRows) {
      (versionsByFamilyId[v.family_id] ??= []).push(v);
    }
  }

  const copyRows: Array<{ hubspot_contact_id: string; property: string; ts: Date }> = await prisma.sequenceCopyEvent.findMany({
    select: { hubspot_contact_id: true, property: true, ts: true },
  });
  const copyEventKeys = new Set(copyRows.map((c) => `${c.hubspot_contact_id}|${c.property}|${c.ts.toISOString()}`));

  const enrollmentsByKey: Record<string, ExistingEnrollment> = {};
  if (familyIds.length > 0) {
    const enrollmentRows: ExistingEnrollment[] = await prisma.sequenceEnrollment.findMany({
      where: { family_id: { in: familyIds } },
      select: { id: true, engine: true, family_id: true, hubspot_contact_id: true, enrolled_at: true, sequence_version_id: true, rendered_steps: true },
    });
    for (const e of enrollmentRows) enrollmentsByKey[e.id] = e;
  }

  const accountRows: Array<{ name: string }> = accountNames.length
    ? await prisma.account.findMany({ where: { name: { in: accountNames } }, select: { name: true } })
    : [];

  return { familiesByHubspotId, versionsByFamilyId, copyEventKeys, enrollmentsByKey, accountNames: new Set(accountRows.map((a) => a.name)) };
}

interface ApplyCounts {
  families_written: number;
  versions_written: number;
  copy_events_written: number;
  enrollments_written: number;
  enrollments_pending_backfill: number;
}

async function applyPlan(prisma: any, plan: JournalPlan): Promise<ApplyCounts> {
  const { Prisma } = await import('@prisma/client');
  return prisma.$transaction(async (tx: any) => {
    const out: ApplyCounts = { families_written: 0, versions_written: 0, copy_events_written: 0, enrollments_written: 0, enrollments_pending_backfill: 0 };

    if (plan.families.length > 0) {
      const r = await tx.sequenceFamily.createMany({
        data: plan.families.map((f) => ({
          id: f.id,
          engine: f.engine,
          program: f.program,
          account_name: f.account_name,
          hubspot_sequence_id: f.hubspot_sequence_id,
          hubspot_portal_id: f.hubspot_portal_id,
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
          hubspot_template_ids: v.hubspot_template_ids,
          provenance: v.provenance,
          change_note: v.change_note,
          frozen_at: v.frozen_at ? new Date(v.frozen_at) : null,
          frozen_by_enrollment_id: null,
          created_by: v.created_by,
        })),
        skipDuplicates: true,
      });
      out.versions_written = r.count;
    }

    if (plan.copyEvents.length > 0) {
      const r = await tx.sequenceCopyEvent.createMany({
        data: plan.copyEvents.map((e) => ({
          id: e.id,
          hubspot_contact_id: e.hubspotContactId,
          account_key: e.accountKey,
          property: e.property,
          step_index: e.stepIndex,
          field: e.field,
          old_value: e.oldValue,
          new_value: e.newValue,
          ts: e.ts,
          evidence: e.evidence ?? null,
          revision: e.revision ?? null,
          readback: e.readback ?? null,
          result: e.result ?? null,
          pushed_by: e.pushedBy ?? null,
          source: e.source,
        })),
        skipDuplicates: true,
      });
      out.copy_events_written = r.count;
    }

    for (const u of plan.enrollmentUpdates) {
      const n: number = await tx.$executeRaw(
        Prisma.sql`UPDATE sequence_enrollments
                   SET sequence_version_id = ${u.sequence_version_id},
                       rendered_steps = ${JSON.stringify(u.rendered_steps)}::jsonb,
                       rendered_steps_hash = ${u.rendered_steps_hash}
                   WHERE id = ${u.id} AND legacy = true AND engine = 'hubspot_native' AND rendered_steps IS NULL`,
      );
      out.enrollments_written += n;
    }
    out.enrollments_pending_backfill = plan.enrollmentUpdates.length - out.enrollments_written;
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

  const journalPath = path.join(args.laneDir, 'crm_changes.jsonl');
  const manifestPath = path.join(args.laneDir, 'run_manifest.json');
  if (!existsSync(journalPath)) usage(`missing ${journalPath}`);
  if (!existsSync(manifestPath)) usage(`missing ${manifestPath}`);

  const journalRows = parseJournal(readFileSync(journalPath, 'utf8'));
  const manifest = readManifest(readFileSync(manifestPath, 'utf8'));

  const { PrismaClient } = await import('@prisma/client');
  const prisma: any = new PrismaClient();
  try {
    const accountNames = Object.values(manifest.accounts).map((a) => a.name).filter(Boolean);
    const existing = await loadExisting(prisma, accountNames);
    const plan = planTop100Journal({ journalRows, manifest, existing, opts: { now: new Date(), importedBy: args.createdBy } });

    const report: Record<string, unknown> = {
      dryRun: !args.apply,
      laneDir: args.laneDir,
      manifestWarnings: manifest.warnings,
      counts: plan.counts,
      warnings: plan.warnings,
      enrollmentUpdates: plan.enrollmentUpdates.map((u) => ({ id: u.id, sequence_version_id: u.sequence_version_id, rendered_steps_hash: u.rendered_steps_hash })),
    };

    if (args.apply) {
      report.applied = await applyPlan(prisma, plan);
      const again = planTop100Journal({
        journalRows,
        manifest,
        existing: await loadExisting(prisma, accountNames),
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
