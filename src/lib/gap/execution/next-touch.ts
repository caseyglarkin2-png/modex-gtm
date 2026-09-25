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
 * Truth sources, all existing: the draft ledger (execution.gmail_draft_sent
 * rows carry the Gmail-proven send time), the pinned SequenceVersion's step
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
import { addBusinessDays } from '../sequence/business-days';
import { parseSteps } from '../sequence/steps';
import { NON_STOPPING_RESPONSE_CLASSES } from '../taxonomy';
import { DRAFT_SUBJECT_TYPE, DIRECT_SENT, listDraftRecords, MANUAL_SENT, type DraftRecord, type ManualSentPayload } from './draft-ledger';
import { gapGmailSender } from './gap-sender';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

const DAY_MS = 24 * 60 * 60 * 1000;
const AUTO_REPLY_SUBJECT = /^\s*(automatic reply|auto[- ]?reply|autoreply|out of (the )?office|ooo\b|auto:)/i;

export type StopReason = 'replied' | 'unsubscribed' | 'do_not_contact' | 'invalid_address' | 'meeting_booked';

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

function sentTouches(records: DraftRecord[]): SentTouch[] {
  return records
    .filter((r) => r.fate === 'sent' && r.sent)
    .map((r) => ({
      stepIndex: typeof r.drafted.stepIndex === 'number' ? r.drafted.stepIndex : 0,
      sentAt: r.sent!.sentAt,
      subject: r.drafted.subject,
      gmailSentMessageId: r.sent!.gmailSentMessageId,
      gmailThreadId: r.sent!.gmailThreadId,
    }))
    .sort((a, b) => a.stepIndex - b.stepIndex || a.sentAt.localeCompare(b.sentAt));
}

/** Sends recorded without a draft: by hand (MANUAL_SENT) or by SEND FROM YARDFLOW (DIRECT_SENT), as touches. */
async function manualTouches(prisma: PrismaLike, decisionId: string): Promise<Array<{ touch: SentTouch; payload: ManualSentPayload }>> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const rows: Array<{ payload: unknown }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, subject_id: decisionId, kind: { in: [MANUAL_SENT, DIRECT_SENT] } },
    select: { payload: true },
  });
  return rows
    .map((r) => r.payload as ManualSentPayload)
    .filter((p) => p && typeof p.gmailSentMessageId === 'string')
    .map((p) => ({ payload: p, touch: { stepIndex: p.stepIndex ?? 0, sentAt: p.sentAt, subject: p.subject, gmailSentMessageId: p.gmailSentMessageId, gmailThreadId: p.gmailThreadId ?? null } }));
}

export async function computeNextTouch(prisma: PrismaLike, decisionId: string, now: Date, deps: NextTouchDeps = {}): Promise<NextTouch> {
  const records = await listDraftRecords(prisma, decisionId);
  const manual = await manualTouches(prisma, decisionId);
  const sent = [...sentTouches(records), ...manual.map((m) => m.touch)].sort((a, b) => a.stepIndex - b.stepIndex || a.sentAt.localeCompare(b.sentAt));
  if (sent.length === 0) return { state: 'not_started' };

  const first = sent[0];
  const last = sent[sent.length - 1];
  const draftAnchor = records.find((r) => r.fate === 'sent')?.drafted;
  const anchor = draftAnchor ?? { recipient: manual[0].payload.recipient, personaId: manual[0].payload.personaId, sequenceVersionId: manual[0].payload.sequenceVersionId };
  const recipient = anchor.recipient.toLowerCase();

  // Stop rules that need no Gmail read.
  const persona = await prisma.persona.findUnique({ where: { id: anchor.personaId }, select: { do_not_contact: true, email_status: true } });
  if (persona?.do_not_contact) return { state: 'stopped', reason: 'do_not_contact', detail: 'This person is marked do not contact.', sent };
  if (persona && HARD_INVALID_STATUSES.has(String(persona.email_status ?? '').toLowerCase())) {
    return { state: 'stopped', reason: 'invalid_address', detail: 'The address is marked invalid.', sent };
  }
  const unsub = await prisma.unsubscribedEmail.findFirst({ where: { email: { equals: recipient, mode: 'insensitive' } }, select: { id: true } });
  if (unsub) return { state: 'stopped', reason: 'unsubscribed', detail: 'The recipient unsubscribed.', sent };

  const firstSentAt = new Date(first.sentAt);
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
  }

  const version = await prisma.sequenceVersion.findUnique({ where: { id: anchor.sequenceVersionId }, select: { steps: true } });
  const parsed = version ? parseSteps(version.steps) : null;
  const steps = parsed && parsed.ok ? parsed.steps.steps : [];
  const next = last.stepIndex + 1;
  if (next >= steps.length) return { state: 'complete', sent };

  const dueAt = dueAfter(new Date(last.sentAt), steps[next].delay);
  const pending = records.find((r) => r.fate === 'drafted' && (r.drafted.stepIndex ?? 0) === next);
  return {
    state: now.getTime() >= dueAt.getTime() ? 'due' : 'waiting',
    stepIndex: next,
    dueAt: dueAt.toISOString(),
    sent,
    threadFrom: last,
    pendingDraftId: pending?.drafted.gmailDraftId ?? null,
  };
}
