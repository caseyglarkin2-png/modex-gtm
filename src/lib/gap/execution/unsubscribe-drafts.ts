/**
 * Ops closeout (item 8): an unsubscribe invalidates the GAP-created Gmail
 * drafts still addressed to that recipient.
 *
 * The send gate already refuses an unsubscribed recipient, but a GAP draft
 * sitting in Gmail is a human bypass: Send in Gmail and it goes. Only drafts
 * GAP created and can positively identify are touched: a DRAFTED ledger row
 * for this exact recipient whose gmailDraftId has no SENT or DISCARDED fate,
 * deleted in the GAP mailbox it was created in. Nothing else in Gmail is
 * ever deleted.
 *
 * Fail-soft by contract. The unsubscribe, the do-not-contact mirror and the
 * send refusal never depend on Gmail. When Gmail fails, when the draft is
 * already gone (which may mean it was SENT, so it is never assumed discarded),
 * or when no GAP mailbox is configured, a DRAFT_INVALIDATION_PENDING row is
 * left for reconciliation.
 */
import type { GmailSender } from '@/lib/email/gmail-sender';
import { DRAFT_DISCARDED, DRAFTED, DRAFT_SUBJECT_TYPE, appendLedger, listDraftRecords } from './draft-ledger';

/* eslint-disable @typescript-eslint/no-explicit-any */
type PrismaLike = any;

export const DRAFT_INVALIDATION_PENDING = 'execution.gmail_draft_invalidation_pending' as const;

export interface GapDraftInvalidation {
  found: number;
  deleted: number;
  pending: number;
}

export interface InvalidateDeps {
  deleteDraft?: (draftId: string, sender: GmailSender) => Promise<'deleted' | 'not_found'>;
  sender?: GmailSender | null;
  now?: Date;
  actor?: string;
}

export async function invalidateGapDraftsFor(prisma: PrismaLike, rawEmail: string, deps: InvalidateDeps = {}): Promise<GapDraftInvalidation> {
  const email = rawEmail.trim().toLowerCase();
  const now = deps.now ?? new Date();
  const actor = deps.actor ?? 'system:unsubscribe';
  const sender = deps.sender !== undefined ? deps.sender : (await import('./gap-sender')).gapGmailSender();
  const deleteDraft = deps.deleteDraft ?? (async (id: string, s: GmailSender) => (await import('@/lib/email/gmail-inbox')).deleteGmailDraft(id, s));

  // Every card that ever drafted to this recipient (the seller path stores the lowercased address).
  const rows: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({
    where: { kind: DRAFTED, subject_type: DRAFT_SUBJECT_TYPE, payload: { path: ['recipient'], equals: email } },
    select: { subject_id: true },
  });
  const decisions = [...new Set(rows.map((r) => r.subject_id))];

  const out: GapDraftInvalidation = { found: 0, deleted: 0, pending: 0 };
  for (const decisionId of decisions) {
    const outstanding = (await listDraftRecords(prisma, decisionId)).filter(
      (r) => r.fate === 'drafted' && String(r.drafted.recipient ?? '').toLowerCase() === email,
    );
    for (const r of outstanding) {
      out.found += 1;
      const gmailDraftId = r.drafted.gmailDraftId;
      const pending = async (reason: string, detail?: string) => {
        out.pending += 1;
        await prisma.gapAuditEvent.create({
          data: { kind: DRAFT_INVALIDATION_PENDING, actor, subject_type: DRAFT_SUBJECT_TYPE, subject_id: decisionId, payload: { gmailDraftId, recipient: email, reason, detail: detail ?? null, at: now.toISOString() } },
          select: { id: true },
        });
      };
      if (!sender) {
        await pending('no_gap_mailbox');
        continue;
      }
      let result: 'deleted' | 'not_found';
      try {
        result = await deleteDraft(gmailDraftId, sender);
      } catch (e) {
        await pending('gmail_error', e instanceof Error ? e.message : String(e));
        continue;
      }
      if (result === 'not_found') {
        await pending('draft_not_found_reconcile');
        continue;
      }
      await appendLedger(prisma, DRAFT_DISCARDED, actor, decisionId, {
        status: 'discarded',
        routingDecisionId: decisionId,
        gmailDraftId,
        reconciledAt: now.toISOString(),
        reason: 'recipient_unsubscribed',
      });
      out.deleted += 1;
    }
  }
  return out;
}
