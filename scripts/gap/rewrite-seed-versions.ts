/**
 * Red team T7 remediation: remove the fixture follow-ups (steps 1-3 citing
 * other companies' sites: Fontana, Columbus, Bluewater, Reno) from the LIVE
 * seeded sequence versions, which are drafts, by rewriting them in place to
 * the honest single-touch seeds in src/lib/gap/sequences/families.ts.
 *
 *   npx tsx scripts/gap/rewrite-seed-versions.ts            dry run (default)
 *   npx tsx scripts/gap/rewrite-seed-versions.ts --apply    rewrite
 *
 * Uses the existing `updateVersionSteps` service (drafts only; a frozen or
 * retired version is refused; the actor lands in provenance.edited_by) and
 * writes one GapAuditEvent per rewrite with the before/after hashes and step
 * counts. Nothing is deleted; frozen versions are never touched. Idempotent:
 * a version already at the seed hash is a no-op.
 *
 * Writes docs/gap/t7-seed-rewrite.md (the receipt) on --apply.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { SEED_FAMILIES, SEED_PROGRAM } from '../../src/lib/gap/sequences/families';
import { updateVersionSteps } from '../../src/lib/gap/sequence/version';
import { stepsHash } from '../../src/lib/gap/sequence/steps';

const ACTOR = 'redteam-t7-remediation';

async function main() {
  const apply = process.argv.includes('--apply');
  const now = new Date();
  const prisma = new PrismaClient();
  const rows: string[] = [];
  try {
    for (const seed of SEED_FAMILIES) {
      const family = await prisma.sequenceFamily.findFirst({
        where: { engine: 'modex_draft_queue', program: SEED_PROGRAM, name: seed.name, archived_at: null },
        orderBy: { created_at: 'asc' },
        select: { id: true },
      });
      if (!family) {
        rows.push(`| ${seed.name} | (no family) | | | | skipped |`);
        continue;
      }
      const versions = await prisma.sequenceVersion.findMany({
        where: { family_id: family.id },
        orderBy: { version: 'asc' },
        select: { id: true, version: true, status: true, steps: true, steps_hash: true },
      });
      const target = stepsHash(seed.steps);
      for (const v of versions) {
        const before = ((v.steps as { steps?: unknown[] } | null)?.steps ?? []).length;
        if (v.status !== 'draft') {
          rows.push(`| ${seed.name} | ${v.id} v${v.version} | ${v.status} | ${before} | | untouched (not draft) |`);
          continue;
        }
        if (v.steps_hash === target) {
          rows.push(`| ${seed.name} | ${v.id} v${v.version} | draft | ${before} | ${seed.steps.steps.length} | already honest |`);
          continue;
        }
        if (!apply) {
          rows.push(`| ${seed.name} | ${v.id} v${v.version} | draft | ${before} | ${seed.steps.steps.length} | would rewrite |`);
          continue;
        }
        const r = await updateVersionSteps(prisma, v.id, seed.steps, ACTOR, now);
        if (r.ok && r.changed) {
          await prisma.gapAuditEvent.create({
            data: {
              kind: 'sequence.version_rewritten',
              actor: ACTOR,
              subject_type: 'sequence_version',
              subject_id: v.id,
              payload: { reason: 'red team T7: fixture follow-ups citing other companies removed; honest single-touch', beforeHash: v.steps_hash, afterHash: r.stepsHash, beforeSteps: before, afterSteps: seed.steps.steps.length, at: now.toISOString() },
            },
          });
        }
        rows.push(`| ${seed.name} | ${v.id} v${v.version} | draft | ${before} | ${seed.steps.steps.length} | ${r.ok ? (r.changed ? 'rewritten' : 'no-op') : `refused: ${r.reason}`} |`);
      }
    }
    const doc = [
      '# T7 remediation: live seeded versions rewritten to honest single-touch',
      '',
      `<!-- verified:${now.toISOString().slice(0, 10)} -->`,
      '',
      `Written by \`scripts/gap/rewrite-seed-versions.ts\` (${apply ? 'APPLY' : 'DRY RUN'}) at ${now.toISOString()}.`,
      'Service: `updateVersionSteps` (drafts only), actor `' + ACTOR + '`, one `sequence.version_rewritten` audit event per rewrite.',
      '',
      '| family | version | status | steps before | steps after | outcome |',
      '| --- | --- | --- | --- | --- | --- |',
      ...rows,
      '',
    ].join('\n');
    if (apply) writeFileSync('docs/gap/t7-seed-rewrite.md', doc);
    console.log(doc);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
