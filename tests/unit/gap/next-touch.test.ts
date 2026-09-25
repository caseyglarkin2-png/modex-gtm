import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/gap/routing/inputs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gap/routing/inputs')>();
  return { ...actual, readComms: vi.fn(async () => ({ meetingBooked: globalThis.__meeting === true })) };
});
declare global {
  // eslint-disable-next-line no-var
  var __meeting: boolean | undefined;
}

import { computeNextTouch, dueAfter, recipientReplied } from '@/lib/gap/execution/next-touch';
import { DRAFTED, DRAFT_SENT } from '@/lib/gap/execution/draft-ledger';
import { SEED_FAMILIES } from '@/lib/gap/sequences/families';

const HC = SEED_FAMILIES.find((f) => f.key === 'hidden_capacity')!;
const SENT_AT = new Date('2026-09-24T15:00:00.000Z'); // Thursday

function ledger(sentSteps: number[], extra: Record<string, unknown> = {}) {
  const audit: any[] = [];
  for (const step of sentSteps) {
    audit.push({ id: `d${step}`, kind: DRAFTED, subject_type: 'routing_decision', subject_id: 'dec-1', created_at: new Date(SENT_AT.getTime() - 3_600_000 + step), payload: { gmailDraftId: `r${step}`, stepIndex: step, recipient: 'joey.maggard@kroger.com', personaId: 1886, sequenceVersionId: 'v1', subject: step === 0 ? 'Doors versus spots' : 'Re: Doors versus spots', bodySnapshot: `body ${step}`, senderIdentity: 'casey@yardflow.ai', createdAt: SENT_AT.toISOString() } });
    audit.push({ id: `s${step}`, kind: DRAFT_SENT, subject_type: 'routing_decision', subject_id: 'dec-1', created_at: new Date(SENT_AT.getTime() + step), payload: { gmailDraftId: `r${step}`, gmailSentMessageId: `m${step}`, gmailThreadId: 't1', sentAt: new Date(SENT_AT.getTime() + step * 86_400_000 * 5).toISOString() } });
  }
  return {
    gapAuditEvent: { findMany: vi.fn(async ({ where }: any) => audit.filter((a) => a.subject_id === where.subject_id && where.kind.in.includes(a.kind)).sort((a, b) => b.created_at - a.created_at)) },
    persona: { findUnique: vi.fn(async () => ({ do_not_contact: false, email_status: 'unverified', ...(extra.persona as object) })) },
    unsubscribedEmail: { findFirst: vi.fn(async () => (extra.unsub ? { id: 'u' } : null)) },
    conversationDisposition: { findFirst: vi.fn(async ({ where }: any) => (extra.disposition && !where.response_class.notIn.includes(extra.disposition) ? { response_class: extra.disposition } : null)) },
    inboundMessage: { findFirst: vi.fn(async () => (extra.inbound ? { subject: extra.inbound } : null)) },
    sequenceVersion: { findUnique: vi.fn(async () => ({ steps: HC.steps })) },
  };
}

const YF = () => ({ serviceAccountJson: '{}', userEmail: 'casey@yardflow.ai' });
const noThread = async () => [];

describe('cadence', () => {
  it('step 2 of the seed family is 4 business days after the prior send (Thu Sep 24 -> Wed Sep 30)', () => {
    expect(HC.steps.steps[1].delay).toEqual({ value: 4, unit: 'business_days' });
    expect(dueAfter(SENT_AT, HC.steps.steps[1].delay).toISOString().slice(0, 10)).toBe('2026-09-30');
    expect(dueAfter(SENT_AT, { value: 3, unit: 'calendar_days' }).toISOString().slice(0, 10)).toBe('2026-09-27');
  });
});

describe('computeNextTouch', () => {
  it('nothing proven sent: not_started', async () => {
    expect(await computeNextTouch(ledger([]), 'dec-1', SENT_AT, { gapSender: YF, getThread: noThread })).toEqual({ state: 'not_started' });
  });

  it('touch 1 sent: touch 2 is WAITING before its due date and DUE on it (never early)', async () => {
    const before = await computeNextTouch(ledger([0]), 'dec-1', new Date('2026-09-28T12:00:00Z'), { gapSender: YF, getThread: noThread });
    expect(before).toMatchObject({ state: 'waiting', stepIndex: 1 });
    expect(before.state === 'waiting' && before.dueAt.slice(0, 10)).toBe('2026-09-30');
    const on = await computeNextTouch(ledger([0]), 'dec-1', new Date('2026-09-30T16:00:00Z'), { gapSender: YF, getThread: noThread });
    expect(on).toMatchObject({ state: 'due', stepIndex: 1 });
    expect(on.state === 'due' && on.threadFrom).toMatchObject({ gmailThreadId: 't1', gmailSentMessageId: 'm0' });
  });

  it('a buyer reply in the Gmail thread (read from the SENDING mailbox) stops the sequence; an auto-reply does not', async () => {
    const getThread = vi.fn(async () => [{ id: 'x', labelIds: ['INBOX'], internalDate: new Date(SENT_AT.getTime() + 3_600_000), to: 'casey@yardflow.ai', from: 'Joey Maggard <joey.maggard@kroger.com>', subject: 'Re: Doors versus spots' }]);
    const r = await computeNextTouch(ledger([0]), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread });
    expect(r).toMatchObject({ state: 'stopped', reason: 'replied' });
    expect((getThread.mock.calls[0] as unknown[])[1]).toMatchObject({ userEmail: 'casey@yardflow.ai' });
    const ooo = async () => [{ id: 'x', labelIds: ['INBOX'], internalDate: new Date(SENT_AT.getTime() + 60_000), to: 'c', from: 'joey.maggard@kroger.com', subject: 'Automatic reply: Doors versus spots' }];
    expect(await computeNextTouch(ledger([0]), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread: ooo })).toMatchObject({ state: 'due' });
    expect(recipientReplied([], 'a@b.c', SENT_AT)).toBeNull();
  });

  it.each([
    [{ persona: { do_not_contact: true } }, 'do_not_contact'],
    [{ persona: { email_status: 'hard_bounce' } }, 'invalid_address'],
    [{ unsub: true }, 'unsubscribed'],
    [{ disposition: 'problem_rejected' }, 'replied'],
    [{ inbound: 'Re: Doors versus spots' }, 'replied'],
  ])('stop rule %j -> %s (no further draft is prepared)', async (extra, reason) => {
    expect(await computeNextTouch(ledger([0], extra), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread: noThread })).toMatchObject({ state: 'stopped', reason });
  });

  it('an out_of_office disposition is not a stop (existing NON_STOPPING contract)', async () => {
    expect(await computeNextTouch(ledger([0], { disposition: 'out_of_office' }), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread: noThread })).toMatchObject({ state: 'due' });
  });

  it('meeting booked stops the sequence', async () => {
    globalThis.__meeting = true;
    try {
      expect(await computeNextTouch(ledger([0]), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread: noThread })).toMatchObject({ state: 'stopped', reason: 'meeting_booked' });
    } finally {
      globalThis.__meeting = false;
    }
  });

  it('unreadable thread is UNKNOWN (fail closed), never "no reply"', async () => {
    expect(await computeNextTouch(ledger([0]), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread: async () => { throw new Error('503'); } })).toMatchObject({ state: 'unknown' });
  });

  it('every step sent: complete', async () => {
    expect(await computeNextTouch(ledger([0, 1, 2, 3]), 'dec-1', new Date('2026-12-01T00:00:00Z'), { gapSender: YF, getThread: noThread })).toMatchObject({ state: 'complete' });
  });
});
