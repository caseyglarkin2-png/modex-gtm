/**
 * Ops closeout (item 13B): a direct send whose Gmail answer was lost (5xx,
 * timeout, unreadable 2xx) leaves an open DIRECT_CLAIMED. That freezes the
 * person (no second send), but it had no way to become truth. It now
 * reconciles against Gmail Sent, bounded; and until it does, mailbox intake
 * still attributes a bounce or reply for that recipient.
 *
 * Unknown never becomes "not sent": absence in Sent writes nothing.
 */
import { describe, expect, it, vi } from 'vitest';
import { DIRECT_CLAIMED, DIRECT_RELEASED, DIRECT_SENT } from '@/lib/gap/execution/draft-ledger';
import { personSendHistoryForDecision, personStepKey } from '@/lib/gap/execution/person-history';
import { UNKNOWN_SEND_MIN_AGE_MS, reconcileUnknownSends, type SentMatch } from '@/lib/gap/execution/unknown-send-reconcile';
import { loadGapSendContext } from '@/lib/gap/replies/gap-mailbox';
import { NOW, db, prismaOf } from './fixtures/seller-db';

const JOEY = 'joey.maggard@kroger.com';
const CLAIMED_AT = new Date(NOW.getTime() - 60 * 60_000);
const KEY = personStepKey(1886, JOEY, 0);

function claim(over: Record<string, unknown> = {}, at = CLAIMED_AT) {
  return { id: `c-${Math.random()}`, kind: DIRECT_CLAIMED, actor: 'casey', subject_type: 'routing_decision', subject_id: 'dec-joey', created_at: at, payload: { idempotencyKey: KEY, claimedAt: at.toISOString(), personaId: 1886, recipient: JOEY, stepIndex: 0, ...over } };
}
const match = (id: string, at = new Date(CLAIMED_AT.getTime() + 20_000)): SentMatch => ({ id, threadId: `t-${id}`, internalDate: at, to: `Joey Maggard <${JOEY}>`, subject: 'Doors versus spots' });

function setup(rows: unknown[]) {
  const d = db();
  d.audit.push(...(rows as never[]));
  return { d, prisma: prismaOf(d) };
}

describe('reconcileUnknownSends', () => {
  it('exactly one message to the recipient in Sent around the claim: DIRECT_SENT reconciled, and the person reads as sent', async () => {
    const { d, prisma } = setup([claim()]);
    const listSent = vi.fn(async () => [match('m-1')]);
    const r = await reconcileUnknownSends(prisma, { now: NOW }, { listSent, mailbox: 'casey@yardflow.ai' });
    expect(r).toMatchObject({ checked: 1, reconciled: 1, stillUnknown: [] });
    expect(listSent).toHaveBeenCalledWith(JOEY, expect.any(Number), expect.any(Number));
    const sent = d.audit.filter((e) => e.kind === DIRECT_SENT);
    expect(sent).toHaveLength(1);
    expect(sent[0].payload).toMatchObject({ idempotencyKey: KEY, gmailSentMessageId: 'm-1', gmailThreadId: 't-m-1', recipient: JOEY, stepIndex: 0, reconciledFromSent: true, subject: 'Doors versus spots', accountName: 'Kroger', hypothesisId: 'hyp-kr' });
    const history = await personSendHistoryForDecision(prisma, 'dec-joey');
    expect(history.unresolvedClaims).toHaveLength(0);
    expect(history.sent.map((s) => s.gmailSentMessageId)).toEqual(['m-1']);
  });

  it('nothing in Sent: NOTHING is written; the claim stays unresolved (unknown is never "not sent") and is reported', async () => {
    const { d, prisma } = setup([claim()]);
    const r = await reconcileUnknownSends(prisma, { now: NOW }, { listSent: vi.fn(async () => []), mailbox: 'casey@yardflow.ai' });
    expect(r).toMatchObject({ checked: 1, reconciled: 0 });
    expect(r.stillUnknown).toEqual([expect.objectContaining({ idempotencyKey: KEY, recipient: JOEY, reason: 'not_in_sent' })]);
    expect(d.audit.some((e) => e.kind === DIRECT_SENT || e.kind === DIRECT_RELEASED)).toBe(false);
    expect((await personSendHistoryForDecision(prisma, 'dec-joey')).unresolvedClaims).toHaveLength(1);
  });

  it('two candidate messages: ambiguous, nothing written', async () => {
    const { d, prisma } = setup([claim()]);
    const r = await reconcileUnknownSends(prisma, { now: NOW }, { listSent: vi.fn(async () => [match('m-1'), match('m-2')]), mailbox: 'casey@yardflow.ai' });
    expect(r.stillUnknown).toEqual([expect.objectContaining({ reason: 'ambiguous_in_sent' })]);
    expect(d.audit.some((e) => e.kind === DIRECT_SENT)).toBe(false);
  });

  it(`a claim younger than ${UNKNOWN_SEND_MIN_AGE_MS / 60_000} minutes may still be on the wire: not touched`, async () => {
    const young = new Date(NOW.getTime() - 60_000);
    const { prisma } = setup([claim({}, young)]);
    const listSent = vi.fn(async () => [match('m-1', young)]);
    const r = await reconcileUnknownSends(prisma, { now: NOW }, { listSent, mailbox: 'casey@yardflow.ai' });
    expect(r.checked).toBe(0);
    expect(listSent).not.toHaveBeenCalled();
  });

  it('a released claim, or one whose send is recorded, is not unknown', async () => {
    const { prisma } = setup([
      claim(),
      { id: 'rel', kind: DIRECT_RELEASED, subject_type: 'routing_decision', subject_id: 'dec-joey', created_at: NOW, payload: { idempotencyKey: KEY } },
      claim({ idempotencyKey: personStepKey(1886, JOEY, 1), stepIndex: 1 }),
      { id: 'snt', kind: DIRECT_SENT, subject_type: 'routing_decision', subject_id: 'dec-joey', created_at: NOW, payload: { idempotencyKey: personStepKey(1886, JOEY, 1), gmailSentMessageId: 'm-9', recipient: JOEY, stepIndex: 1 } },
    ]);
    const listSent = vi.fn(async () => [match('m-1')]);
    const r = await reconcileUnknownSends(prisma, { now: NOW }, { listSent, mailbox: 'casey@yardflow.ai' });
    expect(r.checked).toBe(0);
    expect(listSent).not.toHaveBeenCalled();
  });

  it('a Gmail failure leaves the claim unknown and reports it; it never throws', async () => {
    const { d, prisma } = setup([claim()]);
    const r = await reconcileUnknownSends(prisma, { now: NOW }, { listSent: vi.fn(async () => { throw new Error('Gmail list failed (503)'); }), mailbox: 'casey@yardflow.ai' });
    expect(r.stillUnknown).toEqual([expect.objectContaining({ reason: 'gmail_error' })]);
    expect(d.audit.some((e) => e.kind === DIRECT_SENT)).toBe(false);
  });
});

describe('mailbox intake attributes an unknown-outcome send', () => {
  it('an open claim puts its recipient in the reply and bounce attribution context; a released one does not', async () => {
    const { prisma } = setup([claim()]);
    const ctx = await loadGapSendContext(prisma);
    expect(ctx.bounceRecipients.get(JOEY)).toHaveLength(1);
    expect(ctx.recipients.get(JOEY)).toHaveLength(1);

    const released = setup([claim(), { id: 'rel', kind: DIRECT_RELEASED, subject_type: 'routing_decision', subject_id: 'dec-joey', created_at: NOW, payload: { idempotencyKey: KEY } }]);
    const ctx2 = await loadGapSendContext(released.prisma);
    expect(ctx2.bounceRecipients.get(JOEY)).toBeUndefined();
  });
});
