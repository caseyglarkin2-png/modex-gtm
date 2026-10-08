/**
 * UNANSWERED CALLS (X16, GAP OS sales execution engine, 2026-10-08). Server only.
 *
 * Confirmed unanswered calls to a person since their last substantive answer: the count routing reads to hold a
 * person after MAX_UNANSWERED_CALLS (routing/inputs.ts, red team T8; routing/rules.ts). The disposition service
 * hands it to the commitment builder (X16b: the next call is a follow-up until the hold) and the call brief shows
 * it (X16c: the person's timeline). One reader, so the three never disagree. Soft: a client without the reads
 * answers 0.
 */
import { NON_STOPPING_RESPONSE_CLASSES } from '../taxonomy';
import { UNANSWERED_CALL_CLASSES } from '../routing/inputs';
import { MAX_UNANSWERED_CALLS } from '../routing/rules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export { MAX_UNANSWERED_CALLS };

export async function unansweredCallsFor(prisma: PrismaLike, contactEmail: string): Promise<number> {
  if (typeof prisma?.conversationDisposition?.count !== 'function') return 0;
  const email = contactEmail.trim().toLowerCase();
  if (!email) return 0;
  try {
    const lastSubstantive: { created_at: Date } | null = typeof prisma.conversationDisposition.findFirst === 'function'
      ? await prisma.conversationDisposition.findFirst({ where: { contact_email: email, human_confirmed: true, response_class: { notIn: [...NON_STOPPING_RESPONSE_CLASSES] } }, orderBy: { created_at: 'desc' }, select: { created_at: true } })
      : null;
    const n = await prisma.conversationDisposition.count({
      where: { contact_email: email, human_confirmed: true, channel: 'call', response_class: { in: [...UNANSWERED_CALL_CLASSES] }, ...(lastSubstantive ? { created_at: { gt: lastSubstantive.created_at } } : {}) },
    });
    return typeof n === 'number' ? n : 0;
  } catch {
    return 0;
  }
}

/** Calls left before the routing hold. */
export const callsLeftBeforeHold = (unanswered: number): number => Math.max(0, MAX_UNANSWERED_CALLS - unanswered);
