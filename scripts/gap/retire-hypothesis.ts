/**
 * Ops closeout 11: retire ONE hypothesis through the existing legal state
 * machine, never by editing it.
 *
 *   npx tsx scripts/gap/retire-hypothesis.ts <id> --reason "<why>"            dry run (default)
 *   npx tsx scripts/gap/retire-hypothesis.ts <id> --reason "<why>" --apply    close it
 *
 * The move is the audited `close_unresolved` transition (active ->
 * unresolved): not a resolution, no buyer truth, the narrative and its
 * signals untouched (the evidence stays available to research), every send
 * record against it untouched. It prints what it will do, and what it did.
 */
import { PrismaClient } from '@prisma/client';
import { transitionHypothesis } from '../../src/lib/gap/hypothesis/service';

const ACTOR = 'ops-closeout-2026-09-27';

async function main() {
  const [id] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const r = process.argv.indexOf('--reason');
  const reason = r > 0 ? process.argv[r + 1] : '';
  const apply = process.argv.includes('--apply');
  if (!id || !reason) throw new Error('usage: <hypothesisId> --reason "<why>" [--apply]');
  const prisma = new PrismaClient();
  try {
    const h = await prisma.prospectingHypothesis.findUnique({ where: { id }, select: { id: true, account_name: true, status: true, primary_persona_id: true } });
    if (!h) throw new Error(`hypothesis ${id} not found`);
    const sends = await prisma.gapAuditEvent.count({ where: { kind: { startsWith: 'execution.gmail_' }, payload: { path: ['hypothesisId'], equals: id } } });
    console.log(JSON.stringify({ id: h.id, account: h.account_name, status: h.status, persona: h.primary_persona_id, sendRecordsKept: sends, action: 'close_unresolved', reason, apply }));
    if (!apply) return;
    const out = await transitionHypothesis(prisma, id, 'close_unresolved', { now: new Date(), actor: ACTOR, reason });
    console.log(JSON.stringify(out.ok ? { ok: true, from: out.from, to: out.to } : { ok: false, reason: out.reason }));
    if (!out.ok) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
