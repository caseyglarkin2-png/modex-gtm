/**
 * Passive draft -> sent reconciliation (last mile, 2026-09-25).
 *
 * "Check if sent" stays as the manual fallback; this makes execution truth
 * not depend on Casey remembering it. The existing inbox cron
 * (/api/cron/check-inbox, every 5 minutes) calls `reconcilePendingDrafts`
 * once per run:
 *
 *   1. read the ledger: GAP drafts from the last 30 days with no sent or
 *      discarded fate yet (two indexed GapAuditEvent reads, no Gmail calls);
 *   2. reconcile at most `limit` of them, oldest first, through the same
 *      `reconcileDraft` the button uses (drafts.get, then threads.get only
 *      when the draft is gone);
 *   3. append a fate row only when the state changed. A draft still sitting
 *      in Gmail writes nothing, so a rerun is a no-op (idempotent).
 *
 * Read-only toward Gmail. No send, no draft write, no human_action. A failure
 * on one draft is counted and the batch continues.
 */
import { DRAFTED, DRAFT_DISCARDED, DRAFT_SENT, DRAFT_SUBJECT_TYPE } from './draft-ledger';
import { reconcileDraft, type ReconcileDraftDeps } from './draft-reconcile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const PASSIVE_RECONCILE_LIMIT = 25;
export const PASSIVE_RECONCILE_WINDOW_DAYS = 30;

export interface PassiveReconcileReport {
  pending: number;
  checked: number;
  sent: number;
  discarded: number;
  stillDrafted: number;
  errors: string[];
}

export async function reconcilePendingDrafts(
  prisma: PrismaLike,
  input: { now: Date; limit?: number; actor?: string },
  deps: ReconcileDraftDeps = {},
): Promise<PassiveReconcileReport> {
  const limit = Math.max(1, Math.min(100, input.limit ?? PASSIVE_RECONCILE_LIMIT));
  const since = new Date(input.now.getTime() - PASSIVE_RECONCILE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows: Array<{ kind: string; subject_id: string; payload: unknown; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, kind: { in: [DRAFTED, DRAFT_SENT, DRAFT_DISCARDED] }, created_at: { gte: since } },
    orderBy: { created_at: 'asc' },
    select: { kind: true, subject_id: true, payload: true, created_at: true },
    take: 2000,
  });
  const draftIdOf = (p: unknown) => (p && typeof p === 'object' && typeof (p as { gmailDraftId?: unknown }).gmailDraftId === 'string' ? (p as { gmailDraftId: string }).gmailDraftId : null);
  const closed = new Set(rows.filter((r) => r.kind !== DRAFTED).map((r) => draftIdOf(r.payload)).filter(Boolean));
  const pending = rows.filter((r) => r.kind === DRAFTED && draftIdOf(r.payload) && !closed.has(draftIdOf(r.payload)));

  const report: PassiveReconcileReport = { pending: pending.length, checked: 0, sent: 0, discarded: 0, stillDrafted: 0, errors: [] };
  for (const row of pending.slice(0, limit)) {
    report.checked += 1;
    try {
      const r = await reconcileDraft(
        prisma,
        { decisionId: row.subject_id, gmailDraftId: draftIdOf(row.payload)!, actor: input.actor ?? 'cron:gap-draft-reconcile', now: input.now },
        deps,
      );
      if (!r.ok) report.errors.push(`${draftIdOf(row.payload)}:${r.reason}`);
      else if (r.fate === 'sent') report.sent += 1;
      else if (r.fate === 'discarded') report.discarded += 1;
      else report.stillDrafted += 1;
    } catch (err) {
      report.errors.push(`${draftIdOf(row.payload)}:${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return report;
}
