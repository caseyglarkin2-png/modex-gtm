/**
 * GAP OS dogfood, Phase 3: Inland26 reconciliation, READ-ONLY, against
 * production, using the current (post Phase 2) identity state.
 *
 * Evidence is the same six HubSpot EMAILS engagements already verified by
 * hand in docs/gap/inland26-runtime-reconcile-dry-run.md (portal 3819073,
 * read-only, owner 85093129). This script re-classifies that same evidence
 * through the REAL production-backed reconciler (`reconcileOne`, real
 * identity context, real ProspectingHypothesis/SequenceEnrollment/
 * ConversationDisposition reads) instead of the by-hand classification the
 * prior session did when no production DATABASE_URL was available.
 *
 * Writes nothing. Recording a MATCHED result as a GAP-local reconciliation
 * row is a deliberate, separate write step (not in this script).
 */
import { PrismaClient } from '@prisma/client';
import { loadIdentityContext } from '../../src/lib/gap/identity/service';
import { resolveIdentity } from '../../src/lib/gap/identity/resolve';
import { reconcileOne, type EngineEvidence, type ReconcilerDeps } from '../../src/lib/gap/execution/reconciler';

const prisma = new PrismaClient();

function realDeps(prisma: PrismaClient): ReconcilerDeps {
  return {
    resolveIdentity: async (input) => resolveIdentity(await loadIdentityContext(prisma), input),
    findAlreadyImported: async (engine, engineEventId) => {
      const row = await prisma.conversationDisposition.findFirst({
        where: { source_kind: `reconcile:${engine}`, source_id: engineEventId },
        select: { enrollment_id: true, hypothesis_id: true },
      });
      return row?.enrollment_id ? { id: row.enrollment_id, hypothesis_id: row.hypothesis_id } : null;
    },
    findHypothesis: async (accountName) => {
      const row = await prisma.prospectingHypothesis.findFirst({ where: { account_name: accountName }, select: { id: true } });
      return row ?? null;
    },
    findEnrollments: async (accountName, contactEmail) => {
      const rows = await prisma.sequenceEnrollment.findMany({
        where: { account_name: accountName, to_email: contactEmail },
        select: { id: true, hypothesis_id: true },
      });
      return rows;
    },
  };
}

// The six evidence rows verified by hand 2026-09-24 (see the dry-run doc).
// engineEventId is a stable synthetic id (no real HubSpot engagement id was
// captured in that doc); this script's job is to classify by ACCOUNT NAME
// identity resolution, which is what changed since that dry run (Phase 2
// bootstrap), not to re-derive engagement ids.
const EVIDENCE: EngineEvidence[] = [
  { engine: 'manual', rawAccountName: 'Walmart', contactEmail: 'chris.anderson0@walmart.com', engineEventId: 'inland26:walmart:chris.anderson0', occurredAt: new Date('2026-09-24T15:17:07Z') },
  { engine: 'manual', rawAccountName: 'Tyson Foods', contactEmail: 'ryan.heman@tyson.com', engineEventId: 'inland26:tyson:ryan.heman', occurredAt: new Date('2026-09-24T15:36:50Z') },
  { engine: 'manual', rawAccountName: 'Tyson Foods', contactEmail: 'damian.elsken@tyson.com', engineEventId: 'inland26:tyson:damian.elsken', occurredAt: new Date('2026-09-24T15:37:47Z') },
  { engine: 'manual', rawAccountName: 'Tyson Foods', contactEmail: 'todd.skidmore@tyson.com', engineEventId: 'inland26:tyson:todd.skidmore', occurredAt: new Date('2026-09-24T15:37:54Z') },
  { engine: 'manual', rawAccountName: 'Walmart', contactEmail: 'nichole.sanko@walmart.com', engineEventId: 'inland26:walmart:nichole.sanko', occurredAt: new Date('2026-09-24T17:10:03Z') },
  { engine: 'manual', rawAccountName: 'Walmart', contactEmail: 'ivy.barney@walmart.com', engineEventId: 'inland26:walmart:ivy.barney', occurredAt: new Date('2026-09-24T18:31:03Z') },
];

async function main() {
  const deps = realDeps(prisma);
  const results = [];
  for (const evidence of EVIDENCE) {
    const result = await reconcileOne(evidence, deps);
    results.push(result);
    console.log(`${evidence.engineEventId}: ${result.outcome}${result.detail ? ` (${result.detail})` : ''} account=${result.accountName ?? 'null'} hypothesis=${result.hypothesisId ?? 'null'} enrollment=${result.enrollmentId ?? 'null'}`);
  }
  console.log('\nJSON:', JSON.stringify(results));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
