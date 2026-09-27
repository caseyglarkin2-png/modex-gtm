/**
 * Red team T10: honest Learning. Proofs:
 *   - the reply/send denominator is people actually SENT to (the send ledger)
 *   - attribution is the person's first send and survives several routing cards
 *   - small N is suppressed (4/5 is insufficient), with a Wilson interval above
 *   - no metric can improve because unanswered cards disappeared: execution
 *     learning never reads a routing decision
 */
import { describe, expect, it, vi } from 'vitest';
import { buildExecutionLearning, computeExecutionLearning, UNRECORDED, type ContactedPerson } from '@/lib/gap/learning/execution';
import { describeRate, honestRate, RELIABLE_N, wilson } from '@/lib/gap/learning/stats';
import { DIRECT_SENT, DRAFT_SENT, DRAFTED, MANUAL_SENT } from '@/lib/gap/execution/draft-ledger';
import { findManyFrom } from './fixtures/where';

/* eslint-disable @typescript-eslint/no-explicit-any */
const T0 = new Date('2026-09-20T15:00:00Z');
const at = (h: number) => new Date(T0.getTime() + h * 3_600_000);

function ledgerRow(kind: string, decision: string, payload: Record<string, unknown>, created = T0) {
  return { subject_type: 'routing_decision', subject_id: decision, kind, created_at: created, payload };
}

function world() {
  const ledger = [
    // A: manual first touch on card d1 (v1), then a direct step 1 on a NEWER card d2 (v2).
    ledgerRow(MANUAL_SENT, 'd1', { engine: 'manual', personaId: 1, recipient: 'a@acme.example', hypothesisId: 'hA', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0, sentAt: at(0).toISOString() }),
    ledgerRow(DIRECT_SENT, 'd2', { engine: 'gmail_direct', personaId: 1, recipient: 'a@acme.example', hypothesisId: 'hA', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v2', stepIndex: 1, contentHash: 'aaaaaaaaaaaaffff', evidenceTier: 'VERIFIED_FACT', sentAt: at(100).toISOString() }),
    // B: a Gmail draft that was sent (DRAFTED + DRAFT_SENT).
    ledgerRow(DRAFTED, 'd3', { engine: 'gmail_draft', gmailDraftId: 'g1', personaId: 2, recipient: 'b@beta.example', hypothesisId: 'hB', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0, contentHash: 'bbbbbbbbbbbbffff', evidenceTier: 'VERIFIED_FACT' }),
    ledgerRow(DRAFT_SENT, 'd3', { gmailDraftId: 'g1', gmailSentMessageId: 'm1', sentAt: at(1).toISOString() }),
    // C: a draft that was NEVER sent: not a person contacted.
    ledgerRow(DRAFTED, 'd4', { engine: 'gmail_draft', gmailDraftId: 'g2', personaId: 3, recipient: 'c@gamma.example', hypothesisId: 'hC', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0 }),
    // D: an internal recipient: never counted.
    ledgerRow(MANUAL_SENT, 'd5', { engine: 'manual', personaId: 4, recipient: 'probe@freightroll.com', hypothesisId: 'hD', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0, sentAt: at(2).toISOString() }),
    // E: sent, no outcome at all.
    ledgerRow(MANUAL_SENT, 'd6', { engine: 'manual', personaId: 5, recipient: 'e@epsilon.example', hypothesisId: 'hE', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v3', stepIndex: 0, sentAt: at(3).toISOString() }),
  ];
  const audit = [
    ...ledger,
    // A colleague answered FOR E: attributed to E by the GAP mailbox.
    { kind: 'mailbox.reply', subject_type: 'gmail_message', subject_id: 'mx', created_at: at(10), payload: { recipients: ['e@epsilon.example'], receivedAt: at(10).toISOString() } },
  ];
  const inbound = [
    { from_email: 'A@acme.example', received_at: at(5), subject: 'Re: doors' },
    // B wrote BEFORE the send: not a reply to it.
    { from_email: 'b@beta.example', received_at: at(-5), subject: 'Hello' },
    // B's out-of-office after the send: not a reply.
    { from_email: 'b@beta.example', received_at: at(6), subject: 'Automatic reply: doors' },
  ];
  const dispositions = [
    { contact_email: 'a@acme.example', response_class: 'meeting_accepted', channel: 'email', created_at: at(7), human_confirmed: true },
    { contact_email: 'a@acme.example', response_class: 'problem_confirmed', channel: 'email', created_at: at(7), human_confirmed: true },
    // An unconfirmed AI suggestion is never an outcome.
    { contact_email: 'b@beta.example', response_class: 'meeting_accepted', channel: 'email', created_at: at(8), human_confirmed: false },
  ];
  const hypotheses = [
    { id: 'hA', status: 'confirmed' },
    { id: 'hB', status: 'active' },
    { id: 'hE', status: 'unresolved' },
  ];
  const bids = [{ id: 'b1', hypothesis_id: 'hA', type: 'root_cause', human_confirmed: true, supersedes_id: null }];
  const throwing = new Proxy({}, { get: (_t, prop) => { throw new Error(`routingDecision.${String(prop)} must never be read`); } });
  const prisma = {
    gapAuditEvent: { findMany: vi.fn(async (args: any) => findManyFrom(audit, args)) },
    inboundMessage: { findMany: vi.fn(async (args: any) => findManyFrom(inbound, args)) },
    conversationDisposition: { findMany: vi.fn(async (args: any) => findManyFrom(dispositions, args)) },
    prospectingHypothesis: { findMany: vi.fn(async (args: any) => findManyFrom(hypotheses, args)) },
    buyerInputData: { findMany: vi.fn(async (args: any) => findManyFrom(bids, args)) },
    routingDecision: throwing,
  };
  return { prisma };
}

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
  it('PROOF: the denominator is people actually SENT to: an unsent draft and an internal recipient are not people contacted', async () => {
    const { prisma } = world();
    const l = await buildExecutionLearning(prisma);
    expect(l.overall.peopleContacted).toBe(3); // A, B, E
    expect(l.overall.sends).toBe(4); // A twice, B, E
  });

  it('reply / send counts a human reply AFTER the first send (a colleague answering counts; an OOO or an earlier message does not)', async () => {
    const { prisma } = world();
    const l = await buildExecutionLearning(prisma);
    expect(l.overall.replyPerSend).toMatchObject({ numerator: 2, denominator: 3, status: 'insufficient' }); // A and E
  });

  it('meeting, problem acknowledgement, root cause and truth yield come from confirmed human truth only', async () => {
    const { prisma } = world();
    const o = (await buildExecutionLearning(prisma)).overall;
    expect(o.meetingPerSend.numerator).toBe(1); // A (B's meeting is an unconfirmed suggestion)
    expect(o.problemAckPerSend.numerator).toBe(1);
    expect(o.rootCausePerSend.numerator).toBe(1);
    expect(o.truthYield.numerator).toBe(1); // hA confirmed; hE unresolved is not truth
  });

  it('PROOF: attribution survives multiple routing cards: A is one person, attributed to the FIRST send (card d1, v1, manual)', async () => {
    const { prisma } = world();
    const l = await buildExecutionLearning(prisma);
    const v = Object.fromEntries(l.bySequenceVersion.map((r) => [r.key, r.metrics.peopleContacted]));
    expect(v).toEqual({ v1: 2, v3: 1 }); // A (first send v1) and B; E on v3. No v2 row: A's later card does not re-attribute.
    expect(Object.fromEntries(l.byEngine.map((r) => [r.key, r.metrics.peopleContacted]))).toEqual({ manual: 2, gmail_draft: 1 });
    expect(Object.fromEntries(l.byEvidenceTier.map((r) => [r.key, r.metrics.peopleContacted]))).toEqual({ [UNRECORDED]: 2, VERIFIED_FACT: 1 });
    expect(l.byCopyVersion.map((r) => r.key).sort()).toEqual(['bbbbbbbbbbbb', UNRECORDED].sort());
  });

  it('PROOF: no metric can move because cards expired or disappeared: execution learning never reads a routing decision', async () => {
    const { prisma } = world();
    // routingDecision is a proxy that throws on any access.
    await expect(buildExecutionLearning(prisma)).resolves.toBeTruthy();
  });

  it('a date window selects people by their FIRST send (a later touch never moves a person in or out)', async () => {
    const { prisma } = world();
    const l = await buildExecutionLearning(prisma, { from: at(0.5), to: at(50) });
    expect(l.overall.peopleContacted).toBe(2); // B (first at +1h) and E (+3h); A's first send (+0h) is outside, its +100h touch does not pull A in
  });

  it('pure: zero people is no data everywhere, never a fabricated rate', () => {
    const l = computeExecutionLearning([] as ContactedPerson[]);
    expect(l.overall.peopleContacted).toBe(0);
    expect(l.overall.replyPerSend.status).toBe('no_data');
  });
});

describe('queue sends of a GAP enrollment are sends (red team T10)', () => {
  it('a sent modex queue item of a live enrollment adds a person (engine modex_queue); a test enrollment or an unsent item does not', async () => {
    const items = [
      { status: 'sent', to_email: 'q@queue.example', persona_id: 9, owner: 'casey@yardflow.ai', sequence_run_id: 'run-live', sequence_version_id: 'v9', step_index: 0, sent_at: T0, subject: 'S', body: 'B' },
      { status: 'sent', to_email: 't@queue.example', persona_id: 10, owner: 'casey@yardflow.ai', sequence_run_id: 'run-test', sequence_version_id: 'v9', step_index: 0, sent_at: T0, subject: 'S', body: 'B' },
      { status: 'approved', to_email: 'u@queue.example', persona_id: 11, owner: 'casey@yardflow.ai', sequence_run_id: 'run-live2', sequence_version_id: 'v9', step_index: 0, sent_at: null, subject: 'S', body: 'B' },
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
    const l = await buildExecutionLearning(prisma);
    expect(l.overall.peopleContacted).toBe(1);
    expect(l.byEngine.map((r) => r.key)).toEqual(['modex_queue']);
    expect(l.bySequenceVersion.map((r) => r.key)).toEqual(['v9']);
  });
});
