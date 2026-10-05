/**
 * DISCARD ONE GAP-CREATED GMAIL DRAFT (owner resolution, 2026-10-05). PepsiCo: a pre-operator-first first-touch
 * draft to a VP Supply Chain held the account's one cold motion while the operator sat unreachable in HubSpot. The
 * remediation is a seller control, governed:
 *
 *   the server proves, before anything touches Gmail, that GAP created the draft (a DRAFTED ledger row on THIS
 *   routing decision with THIS gmailDraftId), that the decision, the ledger row and the request agree on the account,
 *   the person and the recipient, that the draft is still outstanding, and that the mailbox is the one it was created
 *   in. Only then is that one draft id deleted. A draft Gmail no longer has is NOT read as discarded (it may have been
 *   sent): it goes to the ordinary reconciliation, which records sent / vanished / discarded by its own rules.
 *
 * Never deletes any other Gmail draft. Appends execution.gmail_draft_discarded with a truthful reason (never
 * "unsubscribe"). The person's identity is untouched.
 */
import type { GmailSender } from '@/lib/email/gmail-sender';
import { gapGmailSender } from './gap-sender';
import { appendLedger, DRAFT_DISCARDED, listDraftRecords } from './draft-ledger';
import { reconcileDraft, type ReconcileDraftDeps } from './draft-reconcile';
import type { GmailDraftState } from '@/lib/email/gmail-inbox';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DISCARD_REASONS = ['stale_pre_operator_who_draft', 'wrong_person', 'copy_outdated', 'seller_discard'] as const;
export type DiscardReason = (typeof DISCARD_REASONS)[number];

export const DISCARD_REASON_LABEL: Record<DiscardReason, string> = {
  stale_pre_operator_who_draft: 'Stale: drafted before operator-first WHO; a better owner is on record',
  wrong_person: 'Wrong person for this account',
  copy_outdated: 'The copy is outdated',
  seller_discard: 'Discarded by the seller',
};

export interface DiscardDraftInput {
  decisionId: string;
  gmailDraftId: string;
  /** The recipient the seller sees; must equal the ledger's (a mismatch means the wrong draft). */
  recipient: string;
  reason: DiscardReason;
  note?: string | null;
  actor: string;
  now: Date;
}

export interface DiscardDraftDeps extends ReconcileDraftDeps {
  deleteDraft?: (draftId: string, sender: GmailSender) => Promise<'deleted' | 'not_found'>;
  getDraftState?: (draftId: string, sender?: GmailSender) => Promise<GmailDraftState>;
  gapSender?: () => GmailSender | null;
  reconcile?: typeof reconcileDraft;
}

export type DiscardDraftResult =
  | { ok: true; action: 'discarded'; gmailDraftId: string; recipient: string; ledgerId: string }
  | { ok: true; action: 'reconciled'; gmailDraftId: string; fate: 'drafted' | 'sent' | 'discarded'; detail: string }
  | { ok: true; action: 'none'; gmailDraftId: string; fate: 'sent' | 'discarded'; detail: string }
  | { ok: false; reason: 'draft_not_found' | 'decision_not_found' | 'draft_mismatch' | 'recipient_mismatch' | 'invalid_reason' | 'gap_sender_unconfigured' | 'sender_mailbox_mismatch' | 'gmail_unreadable' | 'reconcile_failed'; detail?: string };

export async function discardGapDraft(prisma: PrismaLike, input: DiscardDraftInput, deps: DiscardDraftDeps = {}): Promise<DiscardDraftResult> {
  if (!DISCARD_REASONS.includes(input.reason)) return { ok: false, reason: 'invalid_reason' };
  const records = await listDraftRecords(prisma, input.decisionId);
  const record = records.find((r) => r.drafted.gmailDraftId === input.gmailDraftId);
  if (!record) return { ok: false, reason: 'draft_not_found', detail: `No GAP ledger row says GAP created draft ${input.gmailDraftId} on decision ${input.decisionId}. Nothing in Gmail is touched.` };
  const decision: { id: string; account_name: string; persona_id: number | null } | null = await prisma.routingDecision.findUnique({ where: { id: input.decisionId }, select: { id: true, account_name: true, persona_id: true } });
  if (!decision) return { ok: false, reason: 'decision_not_found' };
  const d = record.drafted;
  // The decision, the ledger row and the request must agree on the account, the person and the recipient.
  if (d.routingDecisionId !== decision.id || d.accountName !== decision.account_name || (decision.persona_id !== null && d.personaId !== decision.persona_id)) {
    return { ok: false, reason: 'draft_mismatch', detail: `ledger says ${d.accountName} / person ${d.personaId} on ${d.routingDecisionId}; the decision is ${decision.account_name} / person ${decision.persona_id}.` };
  }
  const recipient = String(d.recipient ?? '').trim().toLowerCase();
  if (recipient !== String(input.recipient ?? '').trim().toLowerCase()) return { ok: false, reason: 'recipient_mismatch', detail: `the draft is addressed to ${recipient}.` };
  if (record.fate !== 'drafted') return { ok: true, action: 'none', gmailDraftId: input.gmailDraftId, fate: record.fate, detail: record.fate === 'sent' ? `Already sent${record.sent?.sentAt ? ` ${record.sent.sentAt}` : ''}: nothing to discard.` : 'Already recorded as discarded.' };

  const sender = (deps.gapSender ?? gapGmailSender)();
  if (!sender) return { ok: false, reason: 'gap_sender_unconfigured' };
  if (String(d.senderIdentity ?? '').toLowerCase() !== sender.userEmail.toLowerCase()) return { ok: false, reason: 'sender_mailbox_mismatch', detail: `the draft was created in ${d.senderIdentity}; the GAP mailbox is ${sender.userEmail}.` };

  let state: GmailDraftState;
  try {
    state = await (deps.getDraftState ?? (async (id: string, s?: GmailSender) => (await import('@/lib/email/gmail-inbox')).getGmailDraftState(id, s)))(input.gmailDraftId, sender);
  } catch (e) {
    return { ok: false, reason: 'gmail_unreadable', detail: e instanceof Error ? e.message : String(e) };
  }
  if (state.exists) {
    let outcome: 'deleted' | 'not_found';
    try {
      outcome = await (deps.deleteDraft ?? (async (id: string, s: GmailSender) => (await import('@/lib/email/gmail-inbox')).deleteGmailDraft(id, s)))(input.gmailDraftId, sender);
    } catch (e) {
      return { ok: false, reason: 'gmail_unreadable', detail: `delete failed: ${e instanceof Error ? e.message : String(e)}` };
    }
    if (outcome === 'deleted') {
      const ledgerId = await appendLedger(prisma, DRAFT_DISCARDED, input.actor, input.decisionId, {
        status: 'discarded',
        routingDecisionId: input.decisionId,
        gmailDraftId: input.gmailDraftId,
        reconciledAt: input.now.toISOString(),
        reason: input.reason,
        note: input.note ?? null,
        discardedBy: input.actor,
        recipient,
        accountName: d.accountName,
        personaId: d.personaId,
      });
      return { ok: true, action: 'discarded', gmailDraftId: input.gmailDraftId, recipient, ledgerId };
    }
    // Raced out from under us: fall through to reconciliation (never "discarded" by inference).
  }
  const r = await (deps.reconcile ?? reconcileDraft)(prisma, { decisionId: input.decisionId, gmailDraftId: input.gmailDraftId, actor: input.actor, now: input.now }, deps);
  if (!r.ok) return { ok: false, reason: 'reconcile_failed', detail: `${r.reason}${r.detail ? `: ${r.detail}` : ''}` };
  const detail = r.fate === 'sent' ? `Gmail shows it was SENT${r.sent?.sentAt ? ` ${r.sent.sentAt}` : ''}; recorded as sent, nothing discarded.` : r.fate === 'discarded' ? 'Gone from Gmail long enough with nothing sent: recorded as discarded.' : 'Gone from Drafts just now (an undo window or a send in flight): still outstanding until it stays gone.';
  return { ok: true, action: 'reconciled', gmailDraftId: input.gmailDraftId, fate: r.fate, detail };
}
