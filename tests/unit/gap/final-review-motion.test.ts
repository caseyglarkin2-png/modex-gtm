/**
 * Phase 2 final review P1s on ONE cold email motion per account:
 *   - a buyer at the account ANSWERED: no colleague unlocks "with no response"
 *   - a first touch whose outcome is unrecorded (claimed, not reconciled) and a
 *     live enrollment both hold the account
 *   - an untriaged reply from ANY company domain at the account pauses it
 *   - first touches at one account are serialized under an account lock
 */
import { describe, expect, it, vi } from 'vitest';
import { accountMotionRefusal, loadAccountFirstTouches, CONVERSATION_RESPONSE_CLASSES } from '@/lib/gap/motion/load';
import { computeAccountMotion } from '@/lib/gap/motion/account-motion';
import { accountRepliedRecently } from '@/lib/gap/replies/account-reply';
import { claimSendKey, personStepKey } from '@/lib/gap/execution/person-history';
import { DIRECT_CLAIMED, DIRECT_RELEASED, DIRECT_SENT } from '@/lib/gap/execution/draft-ledger';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const ACCOUNT = 'PepsiCo';

function prismaWith(opts: { dispositions?: unknown[]; ledger?: unknown[]; enrollments?: unknown[]; inbound?: unknown[]; people?: unknown[] }) {
  return {
    conversationDisposition: { findMany: vi.fn(async () => opts.dispositions ?? []) },
    routingDecision: { findMany: vi.fn(async () => [{ id: 'dec-a', account_name: ACCOUNT }, { id: 'dec-b', account_name: ACCOUNT }]) },
    gapAuditEvent: { findMany: vi.fn(async () => opts.ledger ?? []) },
    sequenceEnrollment: { findMany: vi.fn(async () => opts.enrollments ?? []) },
    persona: { findMany: vi.fn(async () => opts.people ?? []) },
    unsubscribedEmail: { findMany: vi.fn(async () => []) },
    inboundMessage: { findMany: vi.fn(async () => opts.inbound ?? []) },
  };
}

describe('a buyer answered: the account is in a conversation', () => {
  const answered = (cls: string, who = 'vp@pepsico.com') => ({ account_name: ACCOUNT, contact_email: who, response_class: cls, created_at: new Date('2026-09-20T12:00:00Z') });

  it('a colleague of someone who said not_priority is refused, however long ago the first touch was', async () => {
    const r = await accountMotionRefusal(prismaWith({ dispositions: [answered('not_priority')] }), { accountName: ACCOUNT, personaId: 2, email: 'dir@pepsico.com', now: NOW });
    expect(r).toMatchObject({ owner: 'vp@pepsico.com', unlockAt: 'never automatically' });
    expect(r?.detail).toBe("vp@pepsico.com at this account answered (not priority, 2026-09-20). The account is in a conversation: a cold first touch to anyone else there is your call, not the queue's.");
  });

  it('every real answer holds; a referral, a voicemail or no signal does not', () => {
    for (const c of ['problem_confirmed', 'problem_rejected', 'meeting_accepted', 'existing_solution', 'do_not_contact']) expect(CONVERSATION_RESPONSE_CLASSES.has(c)).toBe(true);
    for (const c of ['referral', 'voicemail', 'no_answer', 'gatekeeper', 'no_signal', 'out_of_office', 'bounce', 'wrong_person']) expect(CONVERSATION_RESPONSE_CLASSES.has(c)).toBe(false);
  });

  it('the cockpit holds every email card and says why', () => {
    const card = (id: string, pid: number) => ({ id, action: 'one_off_email', account: { name: ACCOUNT }, persona: { id: pid, displayName: `P${pid}`, title: 'Director', email: `p${pid}@pepsico.com`, personaKey: null }, hypothesis: null, createdAt: NOW });
    const m = computeAccountMotion({ accountName: ACCOUNT, readyEmailCards: [card('c1', 1), card('c2', 2)], choice: null, firstTouches: [], replyHold: null, conversation: { who: 'vp@pepsico.com', responseClass: 'meeting_accepted', at: '2026-09-20T12:00:00.000Z' }, now: NOW });
    expect(m.state).toBe('in_conversation');
    expect(m.heldCardIds).toEqual(['c1', 'c2']);
    expect(m.headline).toMatch(/^In a conversation: vp@pepsico.com answered \(meeting accepted, 2026-09-20\)/);
  });
});

describe('an unrecorded send or a live enrollment holds the account', () => {
  const claimed = (decision: string, pid: number, to: string) => ({
    id: `cl-${decision}`,
    kind: DIRECT_CLAIMED,
    subject_id: decision,
    payload: { idempotencyKey: personStepKey(pid, to, 0), claimedAt: '2026-09-27T12:00:00.000Z', personaId: pid, recipient: to, stepIndex: 0 },
    created_at: new Date('2026-09-27T12:00:00Z'),
  });

  it('a claim with no SENT and no RELEASED is an outstanding first touch', async () => {
    const t = await loadAccountFirstTouches(prismaWith({ ledger: [claimed('dec-a', 1, 'vp@pepsico.com')] }), [ACCOUNT], NOW);
    expect(t.get(ACCOUNT)).toEqual([{ personaId: 1, recipient: 'vp@pepsico.com', sentAt: '2026-09-27T12:00:00.000Z', released: false, outstanding: true }]);
    const r = await accountMotionRefusal(prismaWith({ ledger: [claimed('dec-a', 1, 'vp@pepsico.com')] }), { accountName: ACCOUNT, personaId: 2, email: 'dir@pepsico.com', now: NOW });
    expect(r?.detail).toMatch(/or the unrecorded send is reconciled/);
  });

  it('a released claim holds nobody', async () => {
    const rel = { id: 'rel-1', kind: DIRECT_RELEASED, subject_id: 'dec-a', payload: { idempotencyKey: personStepKey(1, 'vp@pepsico.com', 0) }, created_at: new Date('2026-09-27T12:01:00Z') };
    const t = await loadAccountFirstTouches(prismaWith({ ledger: [claimed('dec-a', 1, 'vp@pepsico.com'), rel] }), [ACCOUNT], NOW);
    expect(t.get(ACCOUNT) ?? []).toEqual([]);
  });

  it('a claim that was sent is one sent touch, not also an outstanding one', async () => {
    const sent = { id: 'sent-1', kind: DIRECT_SENT, subject_id: 'dec-a', payload: { idempotencyKey: personStepKey(1, 'vp@pepsico.com', 0), gmailSentMessageId: 'g-1', personaId: 1, recipient: 'vp@pepsico.com', stepIndex: 0, sentAt: '2026-09-27T12:00:05.000Z', accountName: ACCOUNT }, created_at: new Date('2026-09-27T12:00:05Z') };
    const t = await loadAccountFirstTouches(prismaWith({ ledger: [claimed('dec-a', 1, 'vp@pepsico.com'), sent] }), [ACCOUNT], NOW);
    expect(t.get(ACCOUNT)).toEqual([{ personaId: 1, recipient: 'vp@pepsico.com', sentAt: '2026-09-27T12:00:05.000Z', released: false }]);
  });

  it('a live enrollment queued in the lookback is a first touch', async () => {
    const p = prismaWith({ enrollments: [{ account_name: ACCOUNT, persona_id: 1, to_email: 'VP@pepsico.com', created_at: new Date('2026-09-26T12:00:00Z') }] });
    const t = await loadAccountFirstTouches(p, [ACCOUNT], NOW);
    expect(t.get(ACCOUNT)).toEqual([{ personaId: 1, recipient: 'vp@pepsico.com', sentAt: '2026-09-26T12:00:00.000Z', released: false }]);
    expect(p.sequenceEnrollment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ is_test: false, legacy: false }) }));
  });

  it('an unresolved claim is attributed from its own row, not only its key', async () => {
    const legacy = { id: 'cl-old', kind: DIRECT_CLAIMED, subject_id: 'dec-a', payload: { idempotencyKey: 'gmail_direct:dec-a:v1:0:abc', claimedAt: '2026-09-27T12:00:00.000Z', personaId: 1, recipient: 'VP@pepsico.com', stepIndex: 0 }, created_at: new Date('2026-09-27T12:00:00Z') };
    const t = await loadAccountFirstTouches(prismaWith({ ledger: [legacy] }), [ACCOUNT], NOW);
    expect(t.get(ACCOUNT)).toEqual([{ personaId: 1, recipient: 'vp@pepsico.com', sentAt: '2026-09-27T12:00:00.000Z', released: false, outstanding: true }]);
  });
});

describe('an untriaged reply from ANY company domain at the account pauses it', () => {
  it('a fritolay.com reply holds a first touch to a pepsico.com colleague', async () => {
    const prisma = prismaWith({
      people: [{ email: 'owner@fritolay.com' }, { email: 'someone@gmail.com' }],
      inbound: [{ id: 'm1', from_email: 'owner@fritolay.com', subject: 'Re: yards', received_at: new Date('2026-09-27T12:00:00Z') }],
    });
    const r = await accountRepliedRecently(prisma, 'dir@pepsico.com', NOW, { accountName: ACCOUNT });
    expect(r).toMatchObject({ from_email: 'owner@fritolay.com' });
    const where = (prisma.inboundMessage.findMany.mock.calls as unknown as Array<[{ where: { OR: unknown[] } }]>)[0][0].where;
    expect(where.OR).toEqual([{ from_email: { endsWith: '@fritolay.com', mode: 'insensitive' } }, { from_email: { endsWith: '@pepsico.com', mode: 'insensitive' } }]);
  });
});

describe('first touches at one account are serialized', () => {
  it('the claim takes the account lock and refuses when a colleague claimed first', async () => {
    const locks: string[] = [];
    const tx = {
      ...prismaWith({ ledger: [{ id: 'cl-a', kind: DIRECT_CLAIMED, subject_id: 'dec-a', payload: { idempotencyKey: personStepKey(1, 'vp@pepsico.com', 0), claimedAt: '2026-09-28T14:59:59.000Z', personaId: 1, recipient: 'vp@pepsico.com', stepIndex: 0 }, created_at: new Date('2026-09-28T14:59:59Z') }] }),
      $executeRaw: vi.fn(async (strings: TemplateStringsArray, key: string) => {
        locks.push(key);
        return 1;
      }),
      gapAuditEvent: {
        findMany: vi.fn(async ({ where }: { where: { subject_id?: { in?: string[] } } }) =>
          !(where.subject_id?.in ?? []).includes('dec-a')
            ? []
            : [{ id: 'cl-a', kind: DIRECT_CLAIMED, subject_id: 'dec-a', payload: { idempotencyKey: personStepKey(1, 'vp@pepsico.com', 0), claimedAt: '2026-09-28T14:59:59.000Z', personaId: 1, recipient: 'vp@pepsico.com', stepIndex: 0 }, created_at: new Date('2026-09-28T14:59:59Z') }],
        ),
        create: vi.fn(),
      },
      routingDecision: { findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => ('account_name' in where ? [{ id: 'dec-a', account_name: ACCOUNT }, { id: 'dec-b', account_name: ACCOUNT }] : [{ id: 'dec-b' }])) },
    };
    const prisma = { $transaction: async (fn: (t: unknown) => unknown) => fn(tx) };
    const r = await claimSendKey(prisma, { key: personStepKey(2, 'dir@pepsico.com', 0), decisionId: 'dec-b', personaId: 2, recipient: 'dir@pepsico.com', stepIndex: 0, actor: 'c@x', now: NOW, accountName: ACCOUNT });
    expect(r).toMatchObject({ claimed: false, state: 'account_motion' });
    expect(locks).toContain('gap_send_account:pepsico');
    expect(tx.gapAuditEvent.create).not.toHaveBeenCalled();
  });
});
