/**
 * Gmail draft -> sent reconciliation (final pass, 2026-09-25).
 *
 * The primitive already exists: a draft created through the API lives in a
 * Gmail thread (`drafts.create` returns its threadId). When Casey sends it
 * from Gmail, `drafts.get` stops resolving that draft id and a message
 * labelled SENT, addressed to the same recipient, appears in the same thread.
 * Two read calls (`getGmailDraftState`, `getGmailThreadMessages` in
 * src/lib/email/gmail-inbox.ts) answer the question; no polling subsystem, no
 * cron, no webhook. It runs when Casey asks ("Check if sent" on the card or
 * action pack), per draft.
 *
 *   draft still exists                         -> drafted (unchanged, nothing written)
 *   draft gone, a SENT message to the recipient
 *   in its thread at/after the draft was made  -> sent: append DRAFT_SENT with the
 *                                                 NEW sent message id; the draft id is
 *                                                 kept as supersedesEngineId, never
 *                                                 reused as the message id
 *   draft gone, nothing sent                   -> discarded: append DRAFT_DISCARDED
 *
 * Execution truth only. It never writes `human_action`: "I emailed" stays
 * Casey's own statement, and the sent row is the evidence beside it.
 */

import {
  getGmailDraftState as defaultGetDraftState,
  getGmailThreadMessages as defaultGetThread,
  type GmailDraftState,
  type GmailThreadMessageMeta,
} from '@/lib/email/gmail-inbox';
import { gmailSenderAddress, type GmailSender } from '@/lib/email/gmail-sender';
import { gapGmailSender } from './gap-sender';
import {
  appendLedger,
  DRAFT_DISCARDED,
  DRAFT_SUBJECT_TYPE,
  DRAFT_VANISHED,
  DRAFT_SENT,
  listDraftRecords,
  type DraftedPayload,
  type DraftFate,
  type DraftSentPayload,
} from './draft-ledger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** Clock skew allowance between our `createdAt` and Gmail's internalDate. */
const SKEW_MS = 2 * 60 * 1000;

/**
 * What Gmail shows for one draft. `gone` is NOT a fate: a draft leaves Drafts
 * the moment Casey presses Send (undo window) or schedules it. Only
 * reconcileDraft turns a sustained `gone` into `discarded`.
 */
export type DraftObservation =
  | { fate: 'drafted' }
  | { fate: 'sent'; sentMessageId: string; sentAt: Date }
  | { fate: 'scheduled' }
  | { fate: 'gone' };

/** How long a draft must stay gone, with no SENT or SCHEDULED message, before it reads as discarded. */
export const DRAFT_VANISH_GRACE_MS = 2 * 60 * 60 * 1000;

function addresses(header: string): string[] {
  return (header.match(/[^\s<>,;"']+@[^\s<>,;"']+/g) ?? []).map((a) => a.toLowerCase());
}

/** Pure. */
export function observeDraft(
  drafted: Pick<DraftedPayload, 'recipient' | 'createdAt'>,
  draftState: GmailDraftState,
  threadMessages: readonly GmailThreadMessageMeta[],
): DraftObservation {
  if (draftState.exists) return { fate: 'drafted' };
  const since = new Date(drafted.createdAt).getTime() - SKEW_MS;
  const recipient = drafted.recipient.toLowerCase();
  const sent = threadMessages
    .filter((m) => m.labelIds.includes('SENT') && !m.labelIds.includes('DRAFT'))
    .filter((m) => m.internalDate.getTime() >= since)
    .filter((m) => addresses(m.to).includes(recipient))
    .sort((a, b) => a.internalDate.getTime() - b.internalDate.getTime())[0];
  if (sent && sent.id) return { fate: 'sent', sentMessageId: sent.id, sentAt: sent.internalDate };
  // Gmail "Schedule send": out of Drafts, labelled SCHEDULED, not sent yet. It WILL send.
  const scheduled = threadMessages.some((m) => m.labelIds.includes('SCHEDULED') && addresses(m.to).includes(recipient));
  if (scheduled) return { fate: 'scheduled' };
  return { fate: 'gone' };
}

export interface ReconcileDraftDeps {
  getDraftState?: (draftId: string, sender?: GmailSender) => Promise<GmailDraftState>;
  getThread?: (threadId: string, sender?: GmailSender) => Promise<GmailThreadMessageMeta[]>;
  gapSender?: () => GmailSender | null;
  envMailbox?: () => string;
}

export type ReconcileDraftResult =
  | { ok: true; gmailDraftId: string; fate: DraftFate; changed: boolean; sent?: DraftSentPayload }
  | { ok: false; reason: 'draft_not_found' | 'gmail_unreadable' | 'sender_mailbox_mismatch'; detail?: string };

export async function reconcileDraft(
  prisma: PrismaLike,
  input: { decisionId: string; gmailDraftId: string; actor: string; now: Date },
  deps: ReconcileDraftDeps = {},
): Promise<ReconcileDraftResult> {
  const record = (await listDraftRecords(prisma, input.decisionId)).find((d) => d.drafted.gmailDraftId === input.gmailDraftId);
  if (!record) return { ok: false, reason: 'draft_not_found' };
  if (record.fate !== 'drafted') {
    return { ok: true, gmailDraftId: input.gmailDraftId, fate: record.fate, changed: false, ...(record.sent ? { sent: record.sent } : {}) };
  }

  // Read the draft back from the SAME mailbox it was created in. If the GAP
  // mailbox changed since, refuse rather than read the wrong inbox.
  const gapSender = (deps.gapSender ?? gapGmailSender)();
  const mailbox = gapSender?.userEmail ?? (deps.envMailbox ?? gmailSenderAddress)();
  if (record.drafted.senderIdentity.toLowerCase() !== mailbox.toLowerCase()) {
    return { ok: false, reason: 'sender_mailbox_mismatch', detail: `draft was created in ${record.drafted.senderIdentity}, reading ${mailbox}` };
  }
  const sender = gapSender ?? undefined;

  let obs: DraftObservation;
  try {
    const state = await (deps.getDraftState ?? defaultGetDraftState)(input.gmailDraftId, sender);
    const thread = state.exists || !record.drafted.gmailThreadId ? [] : await (deps.getThread ?? defaultGetThread)(record.drafted.gmailThreadId, sender);
    obs = observeDraft(record.drafted, state, thread);
  } catch (err) {
    // Unreadable is not "discarded": write nothing, say so.
    return { ok: false, reason: 'gmail_unreadable', detail: err instanceof Error ? err.message : String(err) };
  }

  // Still a draft, or scheduled to send: outstanding either way; nothing to write.
  if (obs.fate === 'drafted' || obs.fate === 'scheduled') return { ok: true, gmailDraftId: input.gmailDraftId, fate: 'drafted', changed: false };
  if (obs.fate === 'sent') {
    const sent: DraftSentPayload = {
      engine: 'gmail_direct',
      status: 'sent',
      routingDecisionId: input.decisionId,
      gmailDraftId: input.gmailDraftId,
      gmailSentMessageId: obs.sentMessageId,
      gmailThreadId: record.drafted.gmailThreadId,
      sentAt: obs.sentAt.toISOString(),
      reconciledAt: input.now.toISOString(),
    };
    await appendLedger(prisma, DRAFT_SENT, input.actor, input.decisionId, sent as unknown as Record<string, unknown>);
    return { ok: true, gmailDraftId: input.gmailDraftId, fate: 'sent', changed: true, sent };
  }
  // Gone with no SENT and no SCHEDULED: maybe deleted, maybe mid-send (undo
  // window). First sighting records the vanish and keeps the draft
  // outstanding; only a vanish older than the grace window discards.
  const vanished = ((await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, subject_id: input.decisionId, kind: DRAFT_VANISHED },
    select: { payload: true, created_at: true },
    orderBy: { created_at: 'asc' },
  })) as Array<{ payload: unknown; created_at: Date }>).filter(
    (r) => (r.payload as { gmailDraftId?: unknown } | null)?.gmailDraftId === input.gmailDraftId,
  );
  if (vanished.length === 0) {
    await appendLedger(prisma, DRAFT_VANISHED, input.actor, input.decisionId, {
      gmailDraftId: input.gmailDraftId,
      routingDecisionId: input.decisionId,
      observedAt: input.now.toISOString(),
    });
    return { ok: true, gmailDraftId: input.gmailDraftId, fate: 'drafted', changed: false };
  }
  const firstSeen = new Date(String((vanished[0].payload as { observedAt?: unknown }).observedAt ?? vanished[0].created_at.toISOString()));
  if (input.now.getTime() - firstSeen.getTime() < DRAFT_VANISH_GRACE_MS) {
    return { ok: true, gmailDraftId: input.gmailDraftId, fate: 'drafted', changed: false };
  }
  await appendLedger(prisma, DRAFT_DISCARDED, input.actor, input.decisionId, {
    status: 'discarded',
    routingDecisionId: input.decisionId,
    gmailDraftId: input.gmailDraftId,
    reconciledAt: input.now.toISOString(),
  });
  return { ok: true, gmailDraftId: input.gmailDraftId, fate: 'discarded', changed: true };
}
