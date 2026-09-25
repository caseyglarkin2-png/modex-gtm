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

export type DraftObservation =
  | { fate: 'drafted' }
  | { fate: 'sent'; sentMessageId: string; sentAt: Date }
  | { fate: 'discarded' };

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
  return { fate: 'discarded' };
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

  if (obs.fate === 'drafted') return { ok: true, gmailDraftId: input.gmailDraftId, fate: 'drafted', changed: false };
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
  await appendLedger(prisma, DRAFT_DISCARDED, input.actor, input.decisionId, {
    status: 'discarded',
    routingDecisionId: input.decisionId,
    gmailDraftId: input.gmailDraftId,
    reconciledAt: input.now.toISOString(),
  });
  return { ok: true, gmailDraftId: input.gmailDraftId, fate: 'discarded', changed: true };
}
