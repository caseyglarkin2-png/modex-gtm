// @vitest-environment node
/**
 * X14 (GAP OS sales execution engine, 2026-10-08): copied is not sent. The mandate's section 10: "A copied email is
 * not a sent email." Three readers disagreed: a copied reply cleared "Answer them" on Work; a copied cold email was
 * recorded (copy_released) and read by nothing. Now a copy stays what it is, and the GAP mailbox cron reconciles it
 * from Sent the way it already closes a by-hand follow-up: a Sent message to that recipient after the copy is the
 * proof, recorded as a reply sent (`reconciledFromSent`) or a manual send, with the Gmail message id; nothing without
 * it. Pinned: a copied reply is still owed its answer until Sent shows it; the reconcile writes the sent row once and
 * then the answer is no longer owed; a copied cold email is recorded as a manual send through the existing recorder
 * on the same proof; an older Sent message (before the copy) never counts; a Gmail error leaves it owed and reports.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { reconcileCopiesFromSent, COPY_LOOKBACK_DAYS } from '@/lib/gap/execution/copies-reconcile';
import { COPY_RELEASED, REPLY_COPIED, REPLY_SENT } from '@/lib/gap/execution/draft-ledger';
import { loadAnsweredReplyIds, loadCopiedReplyIds } from '@/lib/gap/work/recorded-replies';

const NOW = new Date('2026-10-08T20:00:00Z');
const COPIED_AT = new Date('2026-10-08T15:00:00Z');
const FROM = 'ann@kroger-scratch-co-r63.example.com';

function world(over: { inbound?: boolean } = {}) {
  const db = ledgerDb({
    accounts: ['Kroger Scratch Co r63', 'Fedex Scratch Co r63'],
    routingDecisions: [{ id: 'dec-1', hypothesis_id: 'hyp-1', persona_id: 3, account_name: 'Fedex Scratch Co r63', action: 'enroll_gap_sequence', lane: 'work_queue', created_at: new Date('2026-10-08T10:00:00Z') }],
    inbound: over.inbound === false ? [] : [{ id: 'm1', thread_id: 'th-1', from_email: FROM, from_name: 'Ann Scratch', subject: 'Re: doors', snippet: 'Send the comparison', received_at: new Date('2026-10-08T12:00:00Z'), source: 'gmail' }],
    audit: [
      { id: 'c1', kind: REPLY_COPIED, subject_type: 'inbound_message', subject_id: 'm1', actor: 'casey@freightroll.com', created_at: COPIED_AT, payload: { accountName: 'Kroger Scratch Co r63', contentHash: 'h1', at: COPIED_AT.toISOString() } },
      { id: 'c2', kind: COPY_RELEASED, subject_type: 'routing_decision', subject_id: 'dec-1', actor: 'casey@freightroll.com', created_at: COPIED_AT, payload: { recipient: 'glen@fedex-scratch-co-r63.example.com', stepIndex: 0, contentHash: 'h2', at: COPIED_AT.toISOString() } },
    ],
  }, NOW);
  return db;
}

const sent = (id: string, to: string, when: string, subject = 'Re: doors') => ({ id, threadId: `th-${id}`, internalDate: new Date(when), to, subject });

describe('X14: a copied reply stays owed until Sent shows it', () => {
  it('the readers: copied is not answered; the copy is reported as copied, pending', async () => {
    const c = world().client();
    expect(await loadAnsweredReplyIds(c, ['m1'])).toEqual(new Set());
    expect([...(await loadCopiedReplyIds(c, ['m1'])).entries()]).toEqual([['m1', COPIED_AT.toISOString()]]);
  });

  it('the reconcile records the reply sent from Sent (the first message to them after the copy, never an older one), once; then the answer is no longer owed', async () => {
    const db = world();
    const listSent = vi.fn(async (to: string) => (to === FROM ? [sent('old', FROM, '2026-10-08T14:00:00Z'), sent('g1', FROM, '2026-10-08T15:10:00Z'), sent('g2', FROM, '2026-10-08T16:00:00Z')] : []));
    const r = await reconcileCopiesFromSent(db.client(), { now: NOW }, { listSent, recordManual: vi.fn(async () => ({ ledgerId: 'x', humanAction: 'recorded' as const })) });
    expect(r.replies).toMatchObject({ checked: 1, reconciled: 1 });
    const rows = db.store.gapAuditEvent.filter((e) => e.kind === REPLY_SENT);
    expect(rows).toHaveLength(1);
    expect(rows[0].subject_id).toBe('m1');
    expect(rows[0].payload).toMatchObject({ inboundMessageId: 'm1', recipient: FROM, gmailSentMessageId: 'g1', gmailThreadId: 'th-g1', reconciledFromSent: true, accountName: 'Kroger Scratch Co r63' });
    expect(await loadAnsweredReplyIds(db.client(), ['m1'])).toEqual(new Set(['m1']));
    // Idempotent: a second run writes nothing.
    const again = await reconcileCopiesFromSent(db.client(), { now: NOW }, { listSent, recordManual: vi.fn() });
    expect(again.replies).toMatchObject({ checked: 0, reconciled: 0 });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === REPLY_SENT)).toHaveLength(1);
  });

  it('nothing in Sent after the copy: the reply stays owed; a Gmail error is reported and nothing is written', async () => {
    const db = world();
    const r = await reconcileCopiesFromSent(db.client(), { now: NOW }, { listSent: vi.fn(async () => [sent('old', FROM, '2026-10-08T14:00:00Z')]), recordManual: vi.fn() });
    expect(r.replies).toMatchObject({ checked: 1, reconciled: 0 });
    expect(await loadAnsweredReplyIds(db.client(), ['m1'])).toEqual(new Set());
    const err = await reconcileCopiesFromSent(db.client(), { now: NOW }, { listSent: vi.fn(async () => { throw new Error('gmail 503'); }), recordManual: vi.fn() });
    expect(err.replies.unknown).toEqual([{ id: 'm1', reason: 'gmail_error', detail: 'gmail 503' }]);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === REPLY_SENT)).toHaveLength(0);
  });
});

describe('X14: a copied cold email becomes a manual send on the same proof', () => {
  it('a Sent message to the recipient after the copy is handed to the existing manual-send recorder with the Gmail id; none means nothing; a copy older than the lookback is not checked', async () => {
    const db = world();
    const recordManual = vi.fn(async (_prisma: unknown, _input: unknown) => ({ ledgerId: 'ms-1', humanAction: 'recorded' as const }));
    const listSent = vi.fn(async (to: string) => (to.startsWith('glen@') ? [sent('g9', 'glen@fedex-scratch-co-r63.example.com', '2026-10-08T15:30:00Z', 'Doors versus spots')] : []));
    const r = await reconcileCopiesFromSent(db.client(), { now: NOW }, { listSent, recordManual });
    expect(r.copies).toMatchObject({ checked: 1, reconciled: 1 });
    expect(recordManual).toHaveBeenCalledTimes(1);
    const arg = recordManual.mock.calls[0][1] as unknown as { decisionId: string; stepIndex: number; match: { message: { id: string; to: string } } };
    expect(arg).toMatchObject({ decisionId: 'dec-1', stepIndex: 0, match: { message: { id: 'g9', to: 'glen@fedex-scratch-co-r63.example.com' } } });
    const none = await reconcileCopiesFromSent(db.client(), { now: NOW }, { listSent: vi.fn(async () => []), recordManual: vi.fn() });
    expect(none.copies).toMatchObject({ reconciled: 0 });
    const stale = world();
    stale.store.gapAuditEvent[1].created_at = new Date(NOW.getTime() - (COPY_LOOKBACK_DAYS + 1) * 86_400_000);
    const old = await reconcileCopiesFromSent(stale.client(), { now: NOW }, { listSent: vi.fn(async () => []), recordManual: vi.fn() });
    expect(old.copies.checked).toBe(0);
  });
});
