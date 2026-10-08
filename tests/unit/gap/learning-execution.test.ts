/**
 * Red team T10: honest Learning. Proofs:
 *   - the denominator is people actually SENT to (and, for rates, whose outcome window closed)
 *   - attribution is the person's first send and survives several routing cards
 *   - small N is suppressed (4/5 is insufficient), with a Wilson interval above
 *   - no metric can improve because unanswered cards disappeared: execution
 *     learning never reads a routing decision
 * Release D review: an outcome must be tied to GAP's own send, be THIS
 * person's, and happen inside the window (B1, S1-S5).
 */
import { describe, expect, it, vi } from 'vitest';
import { buildExecutionLearning, computeExecutionLearning, OUTCOME_WINDOW_DAYS, UNRECORDED, type ContactedPerson } from '@/lib/gap/learning/execution';
import { describeRate, honestRate, RELIABLE_N, wilson } from '@/lib/gap/learning/stats';
import { DIRECT_SENT, DRAFT_SENT, DRAFTED, MANUAL_SENT } from '@/lib/gap/execution/draft-ledger';
import { findManyFrom } from './fixtures/where';

/* eslint-disable @typescript-eslint/no-explicit-any */
const T0 = new Date('2026-09-20T15:00:00Z');
const at = (h: number) => new Date(T0.getTime() + h * 3_600_000);
/** Every window in the fixture has closed. */
const LATER = new Date(T0.getTime() + (OUTCOME_WINDOW_DAYS + 5) * 86_400_000);

function ledgerRow(kind: string, decision: string, payload: Record<string, unknown>, created = T0) {
  return { subject_type: 'routing_decision', subject_id: decision, kind, created_at: created, payload };
}

function world(extra: { inbound?: any[]; dispositions?: any[]; audit?: any[]; hypotheses?: any[]; bids?: any[]; unsubs?: any[] } = {}) {
  const ledger = [
    // A: manual first touch on card d1 (v1, thread tA), then a direct step 1 on a NEWER card d2 (v2).
    ledgerRow(MANUAL_SENT, 'd1', { engine: 'manual', personaId: 1, recipient: 'a@acme.example', hypothesisId: 'hA', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0, gmailThreadId: 'tA', gmailSentMessageId: 'mA0', sentAt: at(0).toISOString() }),
    ledgerRow(DIRECT_SENT, 'd2', { engine: 'gmail_direct', personaId: 1, recipient: 'a@acme.example', hypothesisId: 'hA', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v2', stepIndex: 1, contentHash: 'aaaaaaaaaaaaffff', evidenceTier: 'VERIFIED_FACT', gmailThreadId: 'tA', gmailSentMessageId: 'mA1', sentAt: at(100).toISOString() }),
    // The same Gmail message recorded under a second card: ONE send (review S5).
    ledgerRow(MANUAL_SENT, 'd9', { engine: 'manual', personaId: 1, recipient: 'a@acme.example', hypothesisId: 'hA', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0, gmailThreadId: 'tA', gmailSentMessageId: 'mA0', sentAt: at(0).toISOString() }),
    // B: a Gmail draft that was sent (DRAFTED + DRAFT_SENT).
    ledgerRow(DRAFTED, 'd3', { engine: 'gmail_draft', gmailDraftId: 'g1', personaId: 2, recipient: 'b@beta.example', hypothesisId: 'hB', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0, contentHash: 'bbbbbbbbbbbbffff', evidenceTier: 'VERIFIED_FACT' }),
    ledgerRow(DRAFT_SENT, 'd3', { gmailDraftId: 'g1', gmailSentMessageId: 'm1', gmailThreadId: 'tB', sentAt: at(1).toISOString() }),
    // C: a draft that was NEVER sent: not a person contacted.
    ledgerRow(DRAFTED, 'd4', { engine: 'gmail_draft', gmailDraftId: 'g2', personaId: 3, recipient: 'c@gamma.example', hypothesisId: 'hC', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0 }),
    // D: an internal recipient: never counted.
    ledgerRow(MANUAL_SENT, 'd5', { engine: 'manual', personaId: 4, recipient: 'probe@freightroll.com', hypothesisId: 'hD', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0, sentAt: at(2).toISOString() }),
    // E: sent in thread tE.
    ledgerRow(MANUAL_SENT, 'd6', { engine: 'manual', personaId: 5, recipient: 'e@epsilon.example', hypothesisId: 'hE', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v3', stepIndex: 0, gmailThreadId: 'tE', gmailSentMessageId: 'mE', sentAt: at(3).toISOString() }),
  ];
  const audit = [
    ...ledger,
    // A colleague answered FOR E in E's GAP thread: the mailbox tied it to E (gap_thread).
    { kind: 'mailbox.reply', subject_type: 'gmail_message', subject_id: 'mx', created_at: at(10), payload: { attribution: 'gap_thread', recipients: ['e@epsilon.example'], receivedAt: at(10).toISOString() } },
    ...(extra.audit ?? []),
  ];
  const inbound = extra.inbound ?? [
    { from_email: 'A@acme.example', received_at: at(5), subject: 'Re: doors', thread_id: 'tA' },
    // B wrote BEFORE the send: not a reply to it.
    { from_email: 'b@beta.example', received_at: at(-5), subject: 'Hello', thread_id: 'tB' },
    // B's out-of-office after the send: not a reply.
    { from_email: 'b@beta.example', received_at: at(6), subject: 'Automatic reply: doors', thread_id: 'tB' },
  ];
  const dispositions = extra.dispositions ?? [
    { contact_email: 'a@acme.example', hypothesis_id: 'hA', response_class: 'meeting_accepted', channel: 'email', created_at: at(7), human_confirmed: true },
    { contact_email: 'a@acme.example', hypothesis_id: 'hA', response_class: 'problem_confirmed', channel: 'email', created_at: at(7), human_confirmed: true },
    // An unconfirmed AI suggestion is never an outcome.
    { contact_email: 'b@beta.example', hypothesis_id: 'hB', response_class: 'meeting_accepted', channel: 'email', created_at: at(8), human_confirmed: false },
  ];
  const hypotheses = extra.hypotheses ?? [
    { id: 'hA', status: 'confirmed' },
    { id: 'hB', status: 'active' },
    { id: 'hE', status: 'unresolved' },
  ];
  const bids = extra.bids ?? [{ id: 'b1', hypothesis_id: 'hA', contact_email: 'a@acme.example', type: 'root_cause', human_confirmed: true, supersedes_id: null, created_at: at(8) }];
  const unsubs = extra.unsubs ?? [];
  const throwing = new Proxy({}, { get: (_t, prop) => { throw new Error(`routingDecision.${String(prop)} must never be read`); } });
  const prisma = {
    gapAuditEvent: { findMany: vi.fn(async (args: any) => findManyFrom(audit, args)) },
    inboundMessage: { findMany: vi.fn(async (args: any) => findManyFrom(inbound, args)) },
    conversationDisposition: { findMany: vi.fn(async (args: any) => findManyFrom(dispositions, args)) },
    prospectingHypothesis: { findMany: vi.fn(async (args: any) => findManyFrom(hypotheses, args)) },
    buyerInputData: { findMany: vi.fn(async (args: any) => findManyFrom(bids, args)) },
    unsubscribedEmail: { findMany: vi.fn(async (args: any) => findManyFrom(unsubs, args)) },
    routingDecision: throwing,
  };
  return { prisma };
}

const build = (prisma: any, filters: Record<string, unknown> = {}) => buildExecutionLearning(prisma, { now: LATER, ...filters });

describe('stats: honest rates', () => {
  it('Wilson interval for 20/40 is about 35%-65%; none for n = 0', () => {
    const w = wilson(20, 40)!;
    expect(w.low).toBeCloseTo(0.352, 2);
    expect(w.high).toBeCloseTo(0.648, 2);
    expect(wilson(0, 0)).toBeNull();
  });

  it('PROOF: 4/5 renders insufficient; 0/0 is no data; n >= 20 carries value and interval', () => {
    expect(honestRate(4, 5)).toMatchObject({ status: 'insufficient', value: null, interval: null, numerator: 4, denominator: 5 });
    expect(describeRate(honestRate(4, 5))).toBe(`4/5, early observation (n < ${RELIABLE_N}), not a rate`);
    expect(honestRate(0, 0)).toMatchObject({ status: 'no_data', value: null });
    const r = honestRate(10, 20);
    expect(r).toMatchObject({ status: 'reliable', value: 0.5 });
    expect(r.interval!.low).toBeGreaterThan(0.29);
  });
});

describe('execution learning (red team T10)', () => {
  it('PROOF: the denominator is people actually SENT to: an unsent draft, an internal recipient and a re-filed message never add anyone', async () => {
    const l = await build(world().prisma);
    expect(l.overall.peopleContacted).toBe(3); // A, B, E
    expect(l.overall.sends).toBe(4); // A twice (the re-filed message is the same send), B, E
    expect(l.overall.peopleMatured).toBe(3);
  });

  it('reply / send counts a human reply in the GAP thread, or one the mailbox tied to the person by thread (never an OOO or an earlier message)', async () => {
    const l = await build(world().prisma);
    expect(l.overall.replyPerSend).toMatchObject({ numerator: 2, denominator: 3, status: 'insufficient' }); // A and E
  });

  it('meeting, problem acknowledgement, root cause and truth come from THIS person\'s confirmed truth on a sent hypothesis', async () => {
    const o = (await build(world().prisma)).overall;
    expect(o.meetingPerSend.numerator).toBe(1); // A (B's meeting is an unconfirmed suggestion)
    expect(o.problemAckPerSend.numerator).toBe(1);
    expect(o.rootCausePerSend.numerator).toBe(1);
    expect(o.truthYield.numerator).toBe(1); // A's own verdict resolved hA; hE unresolved is not truth
  });

  it('PROOF: attribution survives multiple routing cards: A is one person, attributed to the FIRST send (card d1, v1, manual)', async () => {
    const l = await build(world().prisma);
    expect(Object.fromEntries(l.bySequenceVersion.map((r) => [r.key, r.metrics.peopleContacted]))).toEqual({ v1: 2, v3: 1 });
    expect(Object.fromEntries(l.byEngine.map((r) => [r.key, r.metrics.peopleContacted]))).toEqual({ manual: 2, gmail_draft: 1 });
    expect(Object.fromEntries(l.byEvidenceTier.map((r) => [r.key, r.metrics.peopleContacted]))).toEqual({ [UNRECORDED]: 2, VERIFIED_FACT: 1 });
  });

  it('PROOF: no metric can move because cards expired or disappeared: execution learning never reads a routing decision', async () => {
    await expect(build(world().prisma)).resolves.toBeTruthy();
  });

  it('a date window selects people by their FIRST send', async () => {
    const l = await build(world().prisma, { from: at(0.5), to: at(50) });
    expect(l.overall.peopleContacted).toBe(2); // B and E; A's first send is outside, its later touch does not pull A in
  });

  it('pure: zero people is no data everywhere', () => {
    const l = computeExecutionLearning([] as ContactedPerson[]);
    expect(l.overall.replyPerSend.status).toBe('no_data');
  });
});

describe('Release D review: outcomes must be tied to GAP, to the person, and to the window', () => {
  it('B1: a reply the mailbox attributed only by ACCOUNT DOMAIN credits nobody', async () => {
    const { prisma } = world({
      inbound: [],
      dispositions: [],
      audit: [{ kind: 'mailbox.reply', subject_type: 'gmail_message', subject_id: 'md', created_at: at(20), payload: { attribution: 'account_domain', recipients: ['a@acme.example', 'b@beta.example'], receivedAt: at(20).toISOString() } }],
    });
    const l = await build(prisma);
    expect(l.overall.replyPerSend.numerator).toBe(1); // only E's thread reply
  });

  // The lead's general defect (2026-10-07): learning read replies by SUBJECT only; it reads the one classification now.
  it('a body-only out-of-office notice in the GAP thread (an ordinary "Re:" subject) is not a reply; a person writing back there is', async () => {
    const notice = { from_email: 'a@acme.example', received_at: at(5), subject: 'Re: doors', thread_id: 'tA', snippet: 'I am out of the office until Monday, October 12, with limited access to email.', body_text: 'I am out of the office until Monday, October 12, with limited access to email.' };
    const ooo = await build(world({ dispositions: [], inbound: [notice] }).prisma);
    expect(ooo.overall.replyPerSend.numerator).toBe(1); // E only: A's notice is no reply
    const person = await build(world({ dispositions: [], inbound: [{ ...notice, snippet: 'Happy to talk. Thursday works.', body_text: 'Happy to talk. Thursday works.' }] }).prisma);
    expect(person.overall.replyPerSend.numerator).toBe(2); // A and E
  });

  it('S1: an inbound message outside the person\'s GAP threads is not a GAP reply', async () => {
    const { prisma } = world({ dispositions: [], inbound: [{ from_email: 'a@acme.example', received_at: at(5), subject: 'Re: HubSpot blast', thread_id: 'hubspot-thread' }] });
    const l = await build(prisma);
    expect(l.overall.replyPerSend.numerator).toBe(1); // E only
  });

  it('S1/S3: a disposition on a hypothesis the person was never sent, or a non-accepted meeting, is no outcome', async () => {
    const { prisma } = world({
      dispositions: [
        { contact_email: 'b@beta.example', hypothesis_id: 'hOther', response_class: 'meeting_accepted', channel: 'email', created_at: at(7), human_confirmed: true },
        { contact_email: 'b@beta.example', hypothesis_id: 'hB', response_class: 'meeting_declined', channel: 'meeting', created_at: at(7), human_confirmed: true },
      ],
    });
    const o = (await build(prisma)).overall;
    expect(o.meetingPerSend.numerator).toBe(0);
  });

  it('S2: a WITHDRAWN hypothesis (rejected without a buyer verdict) is not truth; another person\'s verdict is not this person\'s truth', async () => {
    const { prisma } = world({
      hypotheses: [{ id: 'hA', status: 'confirmed' }, { id: 'hB', status: 'rejected' }, { id: 'hE', status: 'unresolved' }],
      // A's verdict exists; B's hypothesis was simply withdrawn.
    });
    expect((await build(prisma)).overall.truthYield.numerator).toBe(1);
    const noOwnVerdict = world({ dispositions: [], hypotheses: [{ id: 'hA', status: 'confirmed' }] });
    expect((await build(noOwnVerdict.prisma)).overall.truthYield.numerator).toBe(0);
  });

  it('S4: an outcome after the window does not count, and people still inside their window are not in the rate denominator', async () => {
    const late = new Date(T0.getTime() + (OUTCOME_WINDOW_DAYS + 1) * 86_400_000);
    const { prisma } = world({ inbound: [{ from_email: 'b@beta.example', received_at: late, subject: 'Re: doors', thread_id: 'tB' }] });
    expect((await build(prisma)).overall.replyPerSend.numerator).toBe(2); // A and E; B's reply came after the window
    const young = await buildExecutionLearning(world().prisma, { now: at(24) });
    expect(young.overall).toMatchObject({ peopleContacted: 3, peopleMatured: 0 });
    expect(young.overall.replyPerSend.status).toBe('no_data');
  });

  it('opt-outs inside the window are counted (the G1 ceiling input)', async () => {
    const { prisma } = world({ unsubs: [{ email: 'e@epsilon.example', unsubscribed_at: at(30) }] });
    expect((await build(prisma)).overall.optOutPerSend.numerator).toBe(1);
  });
});

describe('queue sends of a GAP enrollment are sends (red team T10)', () => {
  it('a sent modex queue item of a live enrollment adds a person (engine modex_queue); a test enrollment or an unsent item does not', async () => {
    const items = [
      { status: 'sent', to_email: 'q@queue.example', persona_id: 9, owner: 'casey@yardflow.ai', sequence_run_id: 'run-live', sequence_version_id: 'v9', step_index: 0, sent_at: T0, subject: 'S', body: 'B', thread_id: 'tq' },
      { status: 'sent', to_email: 't@queue.example', persona_id: 10, owner: 'casey@yardflow.ai', sequence_run_id: 'run-test', sequence_version_id: 'v9', step_index: 0, sent_at: T0, subject: 'S', body: 'B', thread_id: null },
      { status: 'approved', to_email: 'u@queue.example', persona_id: 11, owner: 'casey@yardflow.ai', sequence_run_id: 'run-live2', sequence_version_id: 'v9', step_index: 0, sent_at: null, subject: 'S', body: 'B', thread_id: null },
    ];
    const runs = [
      { id: 'run-live', hypothesis_id: 'hQ', is_test: false, sender: 'casey@yardflow.ai' },
      { id: 'run-test', hypothesis_id: 'hQ', is_test: true, sender: 'casey@yardflow.ai' },
      { id: 'run-live2', hypothesis_id: 'hQ', is_test: false, sender: 'casey@yardflow.ai' },
    ];
    const prisma = {
      gapAuditEvent: { findMany: vi.fn(async () => []) },
      draftQueueItem: { findMany: vi.fn(async (args: any) => findManyFrom(items, args)) },
      sequenceEnrollment: { findMany: vi.fn(async (args: any) => findManyFrom(runs, args)) },
      inboundMessage: { findMany: vi.fn(async () => []) },
      conversationDisposition: { findMany: vi.fn(async () => []) },
      prospectingHypothesis: { findMany: vi.fn(async () => []) },
      buyerInputData: { findMany: vi.fn(async () => []) },
    };
    const l = await build(prisma);
    expect(l.overall.peopleContacted).toBe(1);
    expect(l.byEngine.map((r) => r.key)).toEqual(['modex_queue']);
  });
});
