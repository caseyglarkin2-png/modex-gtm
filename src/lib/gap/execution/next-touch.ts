/**
 * The manual multi-touch loop: what is the NEXT touch for this card, and is
 * it allowed (last mile, 2026-09-25).
 *
 * Read-only. It never drafts, sends or schedules anything; it answers the
 * question the action pack, the draft service and the queue all ask:
 *
 *   not_started   no GAP email for this card has been proven SENT yet
 *   waiting       touch N was sent; touch N+1 is due at `dueAt` (future)
 *   due           touch N+1 is due now; the action pack prepares it
 *   complete      every step of the pinned SequenceVersion has been sent
 *   stopped       a stop rule fired (replied, unsubscribed, do-not-contact,
 *                 invalid address, meeting booked); nothing more is prepared
 *   unknown       reply truth could not be read; fail closed, prepare nothing
 *
 * Truth sources, all existing: the PERSON's send history across every routing
 * card (person-history.ts; execution.gmail_draft_sent / manual / direct rows
 * carry the Gmail-proven send time), the pinned SequenceVersion's step
 * delays (business or calendar days after the PRIOR send, the seed cadence
 * 0/4/5/6), the Gmail thread of the sent message in the SAME mailbox it was
 * sent from (a reply there from the recipient), InboundMessage and
 * ConversationDisposition (the reply paths that already exist), the persona
 * row and the unsubscribe table, and the routing comms reader
 * (meeting booked). An out-of-office auto-reply is not a reply
 * (NON_STOPPING_RESPONSE_CLASSES).
 */
import { getGmailThreadMessages as defaultGetThread, type GmailThreadMessageMeta } from '@/lib/email/gmail-inbox';
import type { GmailSender } from '@/lib/email/gmail-sender';
import { readComms } from '../routing/inputs';
import { HARD_INVALID_STATUSES } from '../suppression/provenance';
import { isHardBounceStatus } from '@/lib/email/bounce';
import { addBusinessDays } from '../sequence/business-days';
import { parseSteps } from '../sequence/steps';
import { NON_STOPPING_RESPONSE_CLASSES } from '../taxonomy';
import { personSendHistoryForDecision } from './person-history';
import { gapGmailSender } from './gap-sender';
import { AUTO_REPLY_SUBJECT, DELIVERY_BLOCKED_KIND, FREEMAIL_DOMAINS } from '../replies/domains';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

const DAY_MS = 24 * 60 * 60 * 1000;

export type StopReason = 'replied' | 'unsubscribed' | 'do_not_contact' | 'invalid_address' | 'delivery_blocked' | 'meeting_booked';

export interface SentTouch {
  stepIndex: number;
  sentAt: string;
  subject: string;
  gmailSentMessageId: string;
  gmailThreadId: string | null;
}

export type NextTouch =
  | { state: 'not_started' }
  | { state: 'waiting' | 'due'; stepIndex: number; dueAt: string; sent: SentTouch[]; threadFrom: SentTouch; pendingDraftId: string | null }
  | { state: 'complete'; sent: SentTouch[] }
  | { state: 'stopped'; reason: StopReason; detail: string; sent: SentTouch[] }
  | { state: 'unknown'; detail: string; sent: SentTouch[] };

export interface NextTouchDeps {
  getThread?: (threadId: string, sender?: GmailSender) => Promise<GmailThreadMessageMeta[]>;
  gapSender?: () => GmailSender | null;
}

function addresses(header: string): string[] {
  return (header.match(/[^\s<>,;"']+@[^\s<>,;"']+/g) ?? []).map((a) => a.toLowerCase());
}

/** Pure: the due time of `step` after the prior send. */
export function dueAfter(priorSentAt: Date, delay: { value: number; unit: string }): Date {
  return delay.unit === 'calendar_days' ? new Date(priorSentAt.getTime() + delay.value * DAY_MS) : addBusinessDays(priorSentAt, delay.value);
}

/** Pure (red team T9): a real (non auto-reply) message in the thread after the first send from anyone but our own mailbox. */
export function threadReplyFromOther(thread: readonly GmailThreadMessageMeta[], own: ReadonlySet<string>, since: Date): GmailThreadMessageMeta | null {
  return (
    thread.find(
      (m) =>
        !m.labelIds.includes('SENT') &&
        !m.labelIds.includes('DRAFT') &&
        m.internalDate.getTime() > since.getTime() &&
        addresses(m.from).length > 0 &&
        !addresses(m.from).some((a) => own.has(a)) &&
        !/^(mailer-daemon|postmaster|mail-delivery-subsystem)@/i.test(addresses(m.from)[0] ?? '') &&
        !AUTO_REPLY_SUBJECT.test(m.subject ?? ''),
    ) ?? null
  );
}

/** Pure: a real (non auto-reply) message from the recipient in the thread after the first send. */
export function recipientReplied(thread: readonly GmailThreadMessageMeta[], recipient: string, since: Date): GmailThreadMessageMeta | null {
  const r = recipient.toLowerCase();
  return (
    thread.find(
      (m) =>
        !m.labelIds.includes('SENT') &&
        !m.labelIds.includes('DRAFT') &&
        m.internalDate.getTime() > since.getTime() &&
        addresses(m.from).includes(r) &&
        !AUTO_REPLY_SUBJECT.test(m.subject ?? ''),
    ) ?? null
  );
}

export async function computeNextTouch(prisma: PrismaLike, decisionId: string, now: Date, deps: NextTouchDeps = {}): Promise<NextTouch> {
  // The PERSON's history across every routing card (red team T2), never this card's alone.
  const history = await personSendHistoryForDecision(prisma, decisionId);
  const sent: SentTouch[] = history.sent.map((s) => ({ stepIndex: s.stepIndex, sentAt: s.sentAt, subject: s.subject, gmailSentMessageId: s.gmailSentMessageId, gmailThreadId: s.gmailThreadId }));
  if (sent.length === 0) return { state: 'not_started' };

  const first = sent[0];
  const last = sent[sent.length - 1];
  const lastSend = history.sent[history.sent.length - 1];
  const anchorPersona = history.personaId ?? history.sent.find((s) => s.personaId !== null)?.personaId ?? null;
  const recipient = (history.recipient || history.sent[0].recipient).toLowerCase();
  const sequenceVersionId = lastSend.sequenceVersionId ?? history.sent.find((s) => s.sequenceVersionId)?.sequenceVersionId ?? null;

  // Stop rules that need no Gmail read.
  const persona = anchorPersona !== null ? await prisma.persona.findUnique({ where: { id: anchorPersona }, select: { do_not_contact: true, email_status: true } }) : null;
  if (persona?.do_not_contact) return { state: 'stopped', reason: 'do_not_contact', detail: 'This person is marked do not contact.', sent };
  if (persona && (isHardBounceStatus(persona.email_status) || HARD_INVALID_STATUSES.has(String(persona.email_status ?? '').trim().toLowerCase()))) {
    return { state: 'stopped', reason: 'invalid_address', detail: 'The address is marked invalid.', sent };
  }
  const unsub = await prisma.unsubscribedEmail.findFirst({ where: { email: { equals: recipient, mode: 'insensitive' } }, select: { id: true } });
  if (unsub) return { state: 'stopped', reason: 'unsubscribed', detail: 'The recipient unsubscribed.', sent };

  const firstSentAt = new Date(first.sentAt);
  // Release C re-review S4: the recipient's server refused a GAP email for
  // policy (5.7.x and similar). The address may be fine, so nothing is marked
  // do-not-contact, but the next touch waits for a human instead of hitting
  // the same wall.
  const blocked = prisma.gapAuditEvent?.findFirst
    ? await prisma.gapAuditEvent.findFirst({
        where: { subject_type: 'recipient', subject_id: recipient, kind: DELIVERY_BLOCKED_KIND, created_at: { gt: firstSentAt } },
        select: { payload: true },
      })
    : null;
  if (blocked) {
    const status = (blocked.payload as { status?: unknown } | null)?.status;
    return { state: 'stopped', reason: 'delivery_blocked', detail: `The recipient's server refused an earlier email${typeof status === 'string' ? ` (${status})` : ''}. Check the address and the block before anything else goes out.`, sent };
  }
  const disposition = await prisma.conversationDisposition.findFirst({
    where: { contact_email: recipient, created_at: { gt: firstSentAt }, response_class: { notIn: [...NON_STOPPING_RESPONSE_CLASSES] } },
    select: { response_class: true },
  });
  if (disposition) return { state: 'stopped', reason: 'replied', detail: `Buyer replied (${String(disposition.response_class).replace(/_/g, ' ')}).`, sent };
  const inbound = await prisma.inboundMessage.findFirst({
    where: { from_email: { equals: recipient, mode: 'insensitive' }, received_at: { gt: firstSentAt } },
    select: { subject: true },
  });
  if (inbound && !AUTO_REPLY_SUBJECT.test(inbound.subject ?? '')) return { state: 'stopped', reason: 'replied', detail: 'Buyer replied.', sent };
  // Red team T9: someone else at the account replied after the first send (a
  // colleague, an assistant). Hold the sequence for a human read; a shared
  // consumer domain says nothing about the account.
  const domain = recipient.split('@')[1] ?? '';
  if (domain && !FREEMAIL_DOMAINS.has(domain)) {
    const colleague = await prisma.inboundMessage.findFirst({
      where: { from_email: { endsWith: `@${domain}`, mode: 'insensitive' }, received_at: { gt: firstSentAt } },
      select: { subject: true, from_email: true },
      orderBy: { received_at: 'asc' },
    });
    if (colleague && !AUTO_REPLY_SUBJECT.test(colleague.subject ?? '')) {
      return { state: 'stopped', reason: 'replied', detail: `Someone at ${domain} (${colleague.from_email}) replied after the first touch. Read it before anything else goes out.`, sent };
    }
  }

  const comms = await readComms(prisma, recipient);
  if (comms.meetingBooked) return { state: 'stopped', reason: 'meeting_booked', detail: 'A meeting is booked.', sent };

  // The Gmail thread in the SAME mailbox the email was sent from.
  if (last.gmailThreadId) {
    let thread: GmailThreadMessageMeta[];
    try {
      const sender = (deps.gapSender ?? gapGmailSender)() ?? undefined;
      thread = await (deps.getThread ?? defaultGetThread)(last.gmailThreadId, sender);
    } catch (err) {
      return { state: 'unknown', detail: `Could not read the Gmail thread (${err instanceof Error ? err.message : String(err)}).`, sent };
    }
    const reply = recipientReplied(thread, recipient, firstSentAt);
    if (reply) return { state: 'stopped', reason: 'replied', detail: 'Buyer replied in the Gmail thread.', sent };
    // Red team T9: anyone else writing into the GAP thread (a colleague cc'd
    // in, a forward answered) is a reply too; only our own mailbox is not.
    const own = new Set([...history.sent.map((s) => (s.senderIdentity ?? '').toLowerCase()), ((deps.gapSender ?? gapGmailSender)()?.userEmail ?? '').toLowerCase()].filter(Boolean));
    const other = threadReplyFromOther(thread, own, firstSentAt);
    if (other) return { state: 'stopped', reason: 'replied', detail: `A reply in the Gmail thread from ${addresses(other.from)[0] ?? 'someone else'}.`, sent };
  }

  const version = sequenceVersionId ? await prisma.sequenceVersion.findUnique({ where: { id: sequenceVersionId }, select: { steps: true } }) : null;
  const parsed = version ? parseSteps(version.steps) : null;
  const steps = parsed && parsed.ok ? parsed.steps.steps : [];
  const next = last.stepIndex + 1;
  if (next >= steps.length) return { state: 'complete', sent };

  const dueAt = dueAfter(new Date(last.sentAt), steps[next].delay);
  const pending = history.drafts.find((r) => r.fate === 'drafted' && (r.drafted.stepIndex ?? 0) === next);
  return {
    state: now.getTime() >= dueAt.getTime() ? 'due' : 'waiting',
    stepIndex: next,
    dueAt: dueAt.toISOString(),
    sent,
    threadFrom: last,
    pendingDraftId: pending?.drafted.gmailDraftId ?? null,
  };
}
