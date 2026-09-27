/**
 * Final red team (buyer lens): a first-touch card is a snapshot. Routing runs
 * on a schedule, so a card minted before the person moved still reads "email"
 * until the next run. A cold first touch from it would ignore what happened
 * since: a call where they answered, their own email, another email we sent,
 * a sequence or an Outbox draft already working them.
 *
 * `personMovedSince` names the first such event after the card, or null. The
 * step-0 gate (seller-draft.ts) refuses `decision_stale` on any of them, in
 * draft and send mode alike. Non-substantive call outcomes (no answer,
 * voicemail, gatekeeper, out of office) are not movement.
 */
import { NON_SUBSTANTIVE_RESPONSE_CLASSES } from '../learning/metrics';

/* eslint-disable @typescript-eslint/no-explicit-any */
type PrismaLike = any;

const IN_FLIGHT_ENROLLMENT = ['active', 'paused', 'stop_pending'];
const IN_FLIGHT_DRAFT = ['draft', 'approved', 'sending'];

const day = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

export async function personMovedSince(
  prisma: PrismaLike,
  input: { email: string; personaId: number | null; since: Date },
): Promise<string | null> {
  const email = input.email.trim().toLowerCase();
  const { since } = input;
  const ci = { equals: email, mode: 'insensitive' as const };

  const disposition = await prisma.conversationDisposition.findFirst({
    where: { contact_email: ci, human_confirmed: true, created_at: { gt: since }, response_class: { notIn: [...NON_SUBSTANTIVE_RESPONSE_CLASSES] } },
    orderBy: { created_at: 'asc' },
    select: { response_class: true, created_at: true },
  });
  if (disposition) return `A ${String(disposition.response_class).replace(/_/g, ' ')} outcome was recorded ${day(disposition.created_at)}, after this card.`;

  const inbound = await prisma.inboundMessage.findFirst({
    where: { from_email: ci, received_at: { gt: since } },
    orderBy: { received_at: 'asc' },
    select: { received_at: true },
  });
  if (inbound) return `They wrote in ${day(inbound.received_at)}, after this card.`;

  const emailed = await prisma.emailLog.findFirst({
    where: { to_email: ci, sent_at: { gt: since } },
    orderBy: { sent_at: 'asc' },
    select: { sent_at: true },
  });
  if (emailed) return `They were emailed ${day(emailed.sent_at)}, after this card.`;

  const enrollment = await prisma.sequenceEnrollment.findFirst({
    where: {
      is_test: false,
      status: { in: IN_FLIGHT_ENROLLMENT },
      OR: [{ to_email: ci }, ...(input.personaId != null ? [{ persona_id: input.personaId }] : [])],
    },
    select: { status: true },
  });
  if (enrollment) return `A sequence enrollment for them is ${enrollment.status}.`;

  const queued = await prisma.draftQueueItem.findFirst({
    where: { to_email: ci, status: { in: IN_FLIGHT_DRAFT } },
    select: { status: true },
  });
  if (queued) return `An Outbox draft to them is ${queued.status}.`;

  return null;
}
