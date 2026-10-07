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
import { LEGACY_HC } from './fixtures/legacy-hc';
import { GmailThreadMissingError } from '@/lib/email/gmail-inbox';
import { findFirstFrom, findManyFrom } from './fixtures/where';

const HC = LEGACY_HC; // four steps: the multi-touch mechanics (seeds are single-touch since red team T7)
const SENT_AT = new Date('2026-09-24T15:00:00.000Z'); // Thursday

function ledger(sentSteps: number[], extra: Record<string, unknown> = {}) {
  const audit: any[] = [];
  for (const step of sentSteps) {
    audit.push({ id: `d${step}`, kind: DRAFTED, subject_type: 'routing_decision', subject_id: 'dec-1', created_at: new Date(SENT_AT.getTime() - 3_600_000 + step), payload: { gmailDraftId: `r${step}`, stepIndex: step, recipient: 'joey.maggard@kroger.com', personaId: 1886, sequenceVersionId: 'v1', subject: step === 0 ? 'Doors versus spots' : 'Re: Doors versus spots', bodySnapshot: `body ${step}`, senderIdentity: 'casey@yardflow.ai', createdAt: SENT_AT.toISOString() } });
    audit.push({ id: `s${step}`, kind: DRAFT_SENT, subject_type: 'routing_decision', subject_id: 'dec-1', created_at: new Date(SENT_AT.getTime() + step), payload: { gmailDraftId: `r${step}`, gmailSentMessageId: `m${step}`, gmailThreadId: 't1', sentAt: new Date(SENT_AT.getTime() + step * 86_400_000 * 5).toISOString() } });
  }
  if (extra.blocked) {
    // Release C re-review S4: a policy DSN recorded for this recipient after the first send.
    audit.push({ id: 'blk', kind: 'mailbox.delivery_blocked', subject_type: 'recipient', subject_id: 'joey.maggard@kroger.com', created_at: new Date(SENT_AT.getTime() + 3_600_000), payload: { status: '5.7.1' } });
  }
  return {
    gapAuditEvent: { findMany: vi.fn(async (args: any) => findManyFrom(audit, args)), findFirst: vi.fn(async (args: any) => findFirstFrom(audit, args)) },
    routingDecision: {
      findUnique: vi.fn(async ({ where }: any) => (where.id === 'dec-1' ? { id: 'dec-1', persona_id: 1886 } : null)),
      findMany: vi.fn(async (args: any) => findManyFrom([{ id: 'dec-1', persona_id: 1886 }], args)),
    },
    persona: {
      findUnique: vi.fn(async () => ({ email: 'joey.maggard@kroger.com', do_not_contact: false, email_status: 'unverified', ...(extra.persona as object) })),
      findMany: vi.fn(async (args: any) => findManyFrom([{ id: 1886, email: 'joey.maggard@kroger.com' }], args)),
    },
    unsubscribedEmail: { findFirst: vi.fn(async () => (extra.unsub ? { id: 'u' } : null)) },
    conversationDisposition: { findFirst: vi.fn(async ({ where }: any) => (extra.disposition && !where.response_class.notIn.includes(extra.disposition) ? { response_class: extra.disposition } : null)) },
    inboundMessage: {
      findFirst: vi.fn(async () => (extra.inbound ? { subject: extra.inbound } : null)),
      findMany: vi.fn(async () => (extra.inbound ? [{ subject: extra.inbound, snippet: (extra.inboundText as string | undefined) ?? null, body_text: (extra.inboundText as string | undefined) ?? null, from_email: 'joey.maggard@kroger.com' }] : [])),
    },
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
    [{ blocked: true }, 'delivery_blocked'],
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

describe('manual send (Joey Maggard, sent by hand from casey@yardflow.ai)', async () => {
  const { matchManualSend } = await import('@/lib/gap/execution/manual-send');
  const { MANUAL_SENT } = await import('@/lib/gap/execution/draft-ledger');
  const rendered = {
    recipient: 'joey.maggard@kroger.com',
    subject: 'Doors versus spots',
    body: 'Hi Joey,\nAirports do not pour runways when the taxiway is the problem. KR 10-Q (2026-06-26) mentions: capital expenditure.\n\nMy guess is the doors are no longer the constraint. The spots are, and the tractor hunting for the right trailer is where the new capacity waits.\n\nHow many doors sit empty on a normal Tuesday because nobody can say where the trailer is?\n\nCasey Larkin, YardFlow by FreightRoll',
  };
  const real = {
    id: '1a0da5d97f8142c0', threadId: '1a0da5c10f51fe73', to: 'joey.maggard@kroger.com', subject: 'doors versus spots', sentAt: '2026-09-25T20:59:19.000Z', rfcMessageId: '<x@mail.gmail.com>',
    text: 'Hi Joey,\r\nAirports do not pour runways when the taxiway is the problem. KR 10-Q\r\n(2026-06-26) mentions: capital expenditure.\r\n\r\nMy guess is the doors are no longer the constraint. The spots are, and the\r\ntractor hunting for the right trailer is where the new capacity waits.\r\n\r\nHow many doors sit empty on a normal Tuesday because nobody can say where\r\nthe trailer is?\r\n\r\nHappy Friday,\r\nCasey Larkin · *Founding AE*, YardFlow by FreightRoll · c. 410-236-7434',
  };

  it('matches the real sent message uniquely (case-insensitive subject, wrapped body, Casey own sign-off)', () => {
    expect(matchManualSend(rendered, [real])).toMatchObject({ kind: 'match', message: { id: '1a0da5d97f8142c0' } });
  });

  it('two matching sends are ambiguous and are returned, never guessed; different copy is no match', () => {
    expect(matchManualSend(rendered, [real, { ...real, id: 'dup' }])).toMatchObject({ kind: 'ambiguous' });
    expect(matchManualSend(rendered, [{ ...real, text: 'A different email entirely about something else.' }])).toMatchObject({ kind: 'none' });
  });

  it('a manual send anchors the next touch on the REAL sent time with no draft record (Fri Sep 25 -> Thu Oct 1)', async () => {
    const audit = [{ id: 'm', kind: MANUAL_SENT, subject_type: 'routing_decision', subject_id: 'dec-1', created_at: new Date(), payload: { engine: 'manual', stepIndex: 0, recipient: 'joey.maggard@kroger.com', personaId: 1886, sequenceVersionId: 'v1', subject: 'doors versus spots', gmailSentMessageId: real.id, gmailThreadId: real.threadId, sentAt: real.sentAt } }];
    const p = ledger([]);
    p.gapAuditEvent.findMany = vi.fn(async (args: any) => findManyFrom(audit, args)) as any;
    const t = await computeNextTouch(p, 'dec-1', new Date('2026-09-28T12:00:00Z'), { gapSender: YF, getThread: noThread });
    expect(t).toMatchObject({ state: 'waiting', stepIndex: 1, threadFrom: { gmailSentMessageId: '1a0da5d97f8142c0', gmailThreadId: '1a0da5c10f51fe73' } });
    expect(t.state === 'waiting' && t.dueAt.slice(0, 10)).toBe('2026-10-01');
    expect(audit.some((a) => (a.kind as string) === DRAFTED)).toBe(false);
  });
});

describe('SEND FROM YARDFLOW anchors the multi-touch loop', async () => {
  const { DIRECT_SENT } = await import('@/lib/gap/execution/draft-ledger');
  const row = { id: 'x', kind: DIRECT_SENT, subject_type: 'routing_decision', subject_id: 'dec-1', created_at: new Date(), payload: { engine: 'gmail_direct', stepIndex: 0, recipient: 'joey.maggard@kroger.com', personaId: 1886, sequenceVersionId: 'v1', subject: 'Doors versus spots', gmailSentMessageId: 'msg-1', gmailThreadId: 'thr-1', sentAt: SENT_AT.toISOString() } };
  const withDirect = (extra: Record<string, unknown> = {}) => {
    const p = ledger([], extra);
    p.gapAuditEvent.findMany = vi.fn(async (args: any) => findManyFrom([row], args)) as any;
    return p;
  };
  it('touch 2 waits on the real sent time; nothing is auto-sent', async () => {
    const t = await computeNextTouch(withDirect(), 'dec-1', new Date('2026-09-28T12:00:00Z'), { gapSender: YF, getThread: noThread });
    expect(t).toMatchObject({ state: 'waiting', stepIndex: 1, threadFrom: { gmailSentMessageId: 'msg-1', gmailThreadId: 'thr-1' } });
  });
  it('a buyer reply stops the remaining touches', async () => {
    expect(await computeNextTouch(withDirect({ inbound: 'Re: Doors versus spots' }), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread: noThread })).toMatchObject({ state: 'stopped', reason: 'replied' });
  });
});

describe('T9: a reply from someone else at the account stops the sequence', () => {
  it('a colleague writing into the GAP thread (not our mailbox, not auto) stops it', async () => {
    const p = ledger([0]);
    const thread = [{ id: 'x', labelIds: ['INBOX'], internalDate: new Date('2026-09-26T10:00:00Z'), to: 'casey@yardflow.ai', from: 'Pat Lee <pat.lee@kroger.com>', subject: 'Re: Doors versus spots' }];
    const t = await computeNextTouch(p, 'dec-1', new Date('2026-09-28T12:00:00Z'), { gapSender: YF, getThread: async () => thread });
    expect(t).toMatchObject({ state: 'stopped', reason: 'replied' });
    expect(t.state === 'stopped' && t.detail).toContain('pat.lee@kroger.com');
  });

  it('our own mailbox and a bounce notice in the thread do not stop it', async () => {
    const p = ledger([0]);
    const thread = [
      { id: 'o', labelIds: ['INBOX'], internalDate: new Date('2026-09-26T10:00:00Z'), to: 'x', from: 'Casey Larkin <casey@yardflow.ai>', subject: 'fwd' },
      { id: 'd', labelIds: ['INBOX'], internalDate: new Date('2026-09-26T11:00:00Z'), to: 'x', from: 'Mail Delivery Subsystem <mailer-daemon@googlemail.com>', subject: 'Delivery Status Notification (Failure)' },
    ];
    const t = await computeNextTouch(p, 'dec-1', new Date('2026-09-28T12:00:00Z'), { gapSender: YF, getThread: async () => thread });
    expect(t).toMatchObject({ state: 'waiting' });
  });

  it('a stored human reply from the account domain after the first send stops it; a consumer domain never does', async () => {
    const p: any = ledger([0]);
    p.inboundMessage.findMany = vi.fn(async ({ where }: { where: { from_email: { endsWith?: string } } }) => (where.from_email.endsWith === '@kroger.com' ? [{ subject: 'Saw your note to Joey', snippet: null, body_text: null, from_email: 'pat.lee@kroger.com' }] : []));
    const t = await computeNextTouch(p, 'dec-1', new Date('2026-09-28T12:00:00Z'), { gapSender: YF, getThread: noThread });
    expect(t).toMatchObject({ state: 'stopped', reason: 'replied' });
    expect(t.state === 'stopped' && t.detail).toContain('kroger.com');
  });
});

// The lead's general defect (2026-10-07): the follow-up stop read replies by SUBJECT only; it now reads the one
// classification the card and the hold read (replies/classify.ts isPersonReply).
describe('the follow-up stop reads the message, never its subject alone', () => {
  it('a body-only out-of-office notice (an ordinary "Re:" subject) does not stop the follow-up; a person writing back does', async () => {
    const notice = 'I am out of the office until Monday, October 12, with limited access to email.';
    const ooo = await computeNextTouch(ledger([0], { inbound: 'Re: Doors versus spots', inboundText: notice }), 'dec-1', new Date('2026-09-28T12:00:00Z'), { gapSender: YF, getThread: noThread });
    expect(ooo.state).not.toBe('stopped');
    const reply = await computeNextTouch(ledger([0], { inbound: 'Re: Doors versus spots', inboundText: 'Happy to talk. Thursday works for a call.' }), 'dec-1', new Date('2026-09-28T12:00:00Z'), { gapSender: YF, getThread: noThread });
    expect(reply).toMatchObject({ state: 'stopped', reason: 'replied' });
    // A person's reply behind a notice still stops it (the first message after the send is not the only one read).
    const p = ledger([0]);
    p.inboundMessage.findMany = vi.fn(async () => [
      { subject: 'Re: Doors versus spots', snippet: notice, body_text: notice, from_email: 'joey.maggard@kroger.com' },
      { subject: 'Re: Doors versus spots', snippet: 'Back now. Can you send the comparison?', body_text: 'Back now. Can you send the comparison?', from_email: 'joey.maggard@kroger.com' },
    ]);
    expect(await computeNextTouch(p, 'dec-1', new Date('2026-09-28T12:00:00Z'), { gapSender: YF, getThread: noThread })).toMatchObject({ state: 'stopped', reason: 'replied' });
  });

  it('in the Gmail thread too: a notice read from its snippet is not a reply; a person is', () => {
    const at = new Date(SENT_AT.getTime() + 3_600_000);
    const msg = (snippet: string) => ({ id: 'm', labelIds: ['INBOX'], internalDate: at, to: 'casey@yardflow.ai', from: 'Joey <joey.maggard@kroger.com>', subject: 'Re: Doors versus spots', snippet });
    expect(recipientReplied([msg('I am out of the office until Monday, October 12, with limited access to email.')], 'joey.maggard@kroger.com', SENT_AT)).toBeNull();
    expect(recipientReplied([msg('Happy to talk. Thursday works.')], 'joey.maggard@kroger.com', SENT_AT)).toMatchObject({ id: 'm' });
  });
});

describe('ops closeout 13D: a thread Gmail no longer has', () => {
  it('is UNKNOWN reply truth (nothing prepared), never "no reply" (due)', async () => {
    const missing = vi.fn(async () => { throw new GmailThreadMissingError('t-0'); });
    const r = await computeNextTouch(ledger([0]), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread: missing });
    expect(r.state).toBe('unknown');
    expect((r as { detail: string }).detail).toMatch(/not found/);
  });
});

describe('ops closeout 14: one bounce vocabulary for every execution plane', () => {
  it.each(['bounced', 'hard_bounce', 'hard_bounced', 'HARD_BOUNCE', 'invalid'])('email_status %s stops the sequence even without do_not_contact', async (status) => {
    const r = await computeNextTouch(ledger([0], { persona: { email_status: status } }), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread: noThread });
    expect(r).toMatchObject({ state: 'stopped', reason: 'invalid_address' });
  });

  it.each(['unverified', 'verified', 'replied'])('email_status %s does not', async (status) => {
    const r = await computeNextTouch(ledger([0], { persona: { email_status: status } }), 'dec-1', new Date('2026-10-01T00:00:00Z'), { gapSender: YF, getThread: noThread });
    expect(r.state).not.toBe('stopped');
  });
});
