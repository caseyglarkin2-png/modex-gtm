/**
 * READ-ONLY audit: one person's GAP send history across every routing card,
 * and what the newest email card for them would now offer (red team T2).
 *
 *   npx tsx scripts/gap/audit-person-history.ts <personaId>
 *
 * Every query runs inside a Postgres READ ONLY transaction: this script
 * cannot write, and it never calls Gmail (the thread read is stubbed empty,
 * so a reply in Gmail would not show here; the report says so).
 */
import { PrismaClient } from '@prisma/client';
import { personSendHistoryForDecision } from '../../src/lib/gap/execution/person-history';
import { computeNextTouch } from '../../src/lib/gap/execution/next-touch';

const EMAIL_ACTIONS = ['enroll_gap_sequence', 'one_off_email'];

async function main() {
  const personaId = Number(process.argv[2]);
  if (!Number.isInteger(personaId)) throw new Error('usage: audit-person-history.ts <personaId>');
  const prisma = new PrismaClient();
  try {
    const report = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
        const cards = await tx.routingDecision.findMany({
          where: { persona_id: personaId },
          orderBy: { created_at: 'asc' },
          select: { id: true, action: true, lane: true, rule_id: true, created_at: true, human_action: true },
        });
        const emailCards = cards.filter((c) => EMAIL_ACTIONS.includes(c.action));
        const newest = emailCards.at(-1) ?? cards.at(-1) ?? null;
        if (!newest) return { personaId, cards: 0 };
        const history = await personSendHistoryForDecision(tx, newest.id);
        const touch = await computeNextTouch(tx, newest.id, new Date(), { getThread: async () => [], gapSender: () => null });
        const step0 = history.sent.find((s) => s.stepIndex === 0);
        return {
          personaId,
          recipient: history.recipient,
          cards: cards.length,
          emailCards: emailCards.map((c) => ({ id: c.id, action: c.action, created_at: c.created_at, human_action: c.human_action })),
          newestCard: { id: newest.id, action: newest.action, rule: newest.rule_id, created_at: newest.created_at },
          decisionsInHistory: history.decisionIds.length,
          sent: history.sent.map((s) => ({ step: s.stepIndex, engine: s.engine, card: s.decisionId, sentAt: s.sentAt, gmailSentMessageId: s.gmailSentMessageId })),
          drafts: history.drafts.map((d) => ({ step: d.drafted.stepIndex ?? 0, fate: d.fate, card: d.decisionId })),
          unresolvedClaims: history.unresolvedClaims,
          nextTouchOnNewestCard: touch,
          step0OnNewestCard: step0 ? `REFUSED first_touch_already_sent (sent ${step0.sentAt} via ${step0.engine} on card ${step0.decisionId})` : 'no step 0 on record',
          note: 'Gmail thread not read (stub): a Gmail-thread reply would stop the sequence and is not reflected here.',
        };
      },
      { timeout: 60_000 },
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
