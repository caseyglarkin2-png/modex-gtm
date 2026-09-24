/**
 * recordDisposition (GAP Prospecting OS, Sprint 4, S4-T3).
 *
 * Every dependency with a side effect is injected, and each spy records its
 * name in a shared `calls` list so the section 7 ORDER is asserted, not just
 * the set. The prisma mock's `$transaction` hands the callback a separate
 * `tx` so the test can tell what ran inside the transaction (the row, the
 * BIDs) from what ran after it (every effect).
 *
 * Three mutation proofs this file owns (paste, run, restore):
 *   1. make the service compute effects with `humanConfirmed: true` for an
 *      agent row -> "an agent row has no effects" goes red;
 *   2. replace the `recordUnsubscribe` call with a direct
 *      `persona.updateMany({ data: { do_not_contact: true } })` -> the S4-T1
 *      structural test goes red naming disposition/service.ts, and
 *      "do_not_contact ... recordUnsubscribe" here goes red;
 *   3. pass `effects.resolves` (the caller's class) as `ctx.outcome` instead
 *      of the score's derived outcome -> "resolve passes the DERIVED outcome"
 *      goes red.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordDisposition, stopReasonFor, type RecordDispositionInput } from '@/lib/gap/disposition/service';

/* eslint-disable @typescript-eslint/no-explicit-any */
const NOW = new Date('2026-09-23T15:00:00.000Z');
const LATER = new Date('2026-09-23T15:00:01.000Z');

function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

const HYPOTHESIS = {
  id: 'H1',
  status: 'active',
  account_name: 'Acme Logistics',
  primary_persona_id: 7,
  problem_family: 'hidden_capacity',
  problem_hypothesis: 'My guess is the gate runs on paper.',
  primary_persona: { id: 7, email: 'jordan@acme.example', hubspot_contact_id: 'hs-7', account_name: 'Acme Logistics' },
};

const FULL_HYPOTHESIS = {
  ...HYPOTHESIS,
  persona: 'site_ops',
  secondary_families: [],
  observation: 'They opened a second DC [S:S1].',
  root_cause_hypotheses: ['Gate waiting'],
  impact_hypotheses: ['Fewer turns'],
  why_now: null,
  falsification_questions: ['Do drivers check in at a guard shack?'],
  what_a_no_means: null,
  contrary_evidence: null,
  predicted_buyer_language: null,
  buying_center: null,
  confidence: 60,
  signals: [{ signal_id: 'S1', role: 'primary' }],
};

function makePrisma() {
  let bidSeq = 0;
  const tx = {
    conversationDisposition: {
      create: asyncSpy(async () => ({ id: 'D1' })),
      updateMany: asyncSpy(async () => ({ count: 1 })),
    },
    buyerInputData: {
      create: asyncSpy(async ({ data }: { data: Record<string, unknown> }) => ({ id: `B${++bidSeq}`, ...data })),
    },
  };
  const prisma = {
    prospectingHypothesis: {
      findUnique: asyncSpy(async (args: any) => {
        if (args?.select?.resolution) return { resolution: { problem: 'confirmed', notes: 'disposition:D1', rootCause: 'unknown', impact: 'unknown' } };
        if (args?.include) return FULL_HYPOTHESIS;
        return HYPOTHESIS;
      }),
      update: asyncSpy(async () => ({})),
    },
    persona: { findUnique: asyncSpy(), findFirst: asyncSpy(async () => null) },
    conversationDisposition: {
      findUnique: asyncSpy(async () => null),
      findMany: asyncSpy(async () => [
        { id: 'D1', response_class: 'problem_confirmed', channel: 'call', human_confirmed: true, created_at: NOW, confirmed_at: NOW, metadata: null, ai_suggested: null },
      ]),
    },
    buyerInputData: { findMany: asyncSpy(async () => []), findFirst: asyncSpy(async () => null) },
    sequenceEnrollment: { findMany: asyncSpy(async () => []) },
    gapAuditEvent: { create: asyncSpy(async () => ({ id: 'A' })) },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    tx,
  };
  return prisma;
}
type Prisma = ReturnType<typeof makePrisma>;

function makeDeps() {
  const calls: string[] = [];
  const deps = {
    audit: asyncSpy(async () => ({ stored: true, reviewQueued: false })),
    mirror: asyncSpy(async () => {
      calls.push('mirror');
      return { status: 'written', mirrorId: 'gap:disp:D1', noteId: 'n1' };
    }),
    stopRuns: asyncSpy(async () => {
      calls.push('stopRuns');
      return 2;
    }),
    stopEnrollment: asyncSpy(async (_p: any, id: string) => {
      calls.push(`stop:${id}`);
      return { ok: true, id, status: 'stopped', skipped: 1 };
    }),
    stopEnrollmentsForHypothesis: asyncSpy(async () => {
      calls.push('stopForHypothesis');
      return { stopped: [], pending: [], refused: [] };
    }),
    recordUnsubscribe: asyncSpy(async () => {
      calls.push('unsubscribe');
      return { ok: true, created: true, personaUpdated: 1, hubspot: 'skipped:disabled' };
    }),
    transition: asyncSpy(async (_p: any, _id: string, action: string) => {
      calls.push(`transition:${action}`);
      if (action === 'resolve') return { ok: true, from: 'active', to: 'confirmed', effects: ['set_resolved', 'stop_enrollments:hypothesis_resolved'] };
      if (action === 'close_unresolved') return { ok: true, from: 'active', to: 'unresolved', effects: ['stop_enrollments:manual'] };
      return { ok: false, reason: `ILLEGAL_TRANSITION:${action}` };
    }),
    propose: asyncSpy(async () => {
      calls.push('propose');
      return { ok: true, id: 'H2', status: 'draft' };
    }),
  };
  return { deps, calls };
}

function input(overrides: Partial<RecordDispositionInput> = {}): RecordDispositionInput {
  return {
    hypothesisId: 'H1',
    contactEmail: 'Jordan@Acme.example',
    channel: 'call',
    responseClass: 'problem_confirmed',
    buyerLanguage: 'we lose trailers every week',
    source: { kind: 'call', id: 'call:7:1' },
    actor: 'casey',
    actorKind: 'human',
    now: NOW,
    ...overrides,
  };
}

let prisma: Prisma;
let deps: ReturnType<typeof makeDeps>['deps'];
let calls: string[];

beforeEach(() => {
  prisma = makePrisma();
  ({ deps, calls } = makeDeps());
});

describe('step 1: refusals, before any write', () => {
  it('a taxonomy miss is invalid_body naming the field', async () => {
    const out = await recordDisposition(prisma, input({ responseClass: 'positive_interest' }), deps);
    expect(out).toEqual({ ok: false, kind: 'invalid_body', field: 'responseClass', reason: 'unknown_response_class' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('a call-only class on an email channel is invalid_body', async () => {
    const out = await recordDisposition(prisma, input({ channel: 'email', responseClass: 'voicemail' }), deps);
    expect(out).toMatchObject({ ok: false, kind: 'invalid_body', field: 'responseClass', reason: 'call_only_class' });
  });

  it('an unknown source kind is invalid_body on source.kind', async () => {
    const out = await recordDisposition(prisma, input({ source: { kind: 'fax', id: 'x' } }), deps);
    expect(out).toEqual({ ok: false, kind: 'invalid_body', field: 'source.kind', reason: 'unknown_source_kind' });
  });

  it('hypothesis_not_found and hypothesis_not_active are refusals with zero writes', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValueOnce(null);
    expect(await recordDisposition(prisma, input(), deps)).toEqual({ ok: false, kind: 'refused', reason: 'hypothesis_not_found' });
    prisma.prospectingHypothesis.findUnique.mockResolvedValueOnce({ ...HYPOTHESIS, status: 'approved' });
    expect(await recordDisposition(prisma, input(), deps)).toEqual({ ok: false, kind: 'refused', reason: 'hypothesis_not_active' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('suppressed_target_mismatch when personaId belongs to another account', async () => {
    prisma.persona.findUnique.mockResolvedValueOnce({ id: 99, email: 'jordan@acme.example', hubspot_contact_id: null, account_name: 'Other Co' });
    const out = await recordDisposition(prisma, input({ personaId: 99 }), deps);
    expect(out).toEqual({ ok: false, kind: 'refused', reason: 'suppressed_target_mismatch' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('suppressed_target_mismatch when the email is owned by another account\'s persona', async () => {
    prisma.persona.findFirst.mockResolvedValueOnce({ id: 42, email: 'sam@other.example', hubspot_contact_id: null, account_name: 'Other Co' });
    const out = await recordDisposition(prisma, input({ contactEmail: 'sam@other.example' }), deps);
    expect(out).toEqual({ ok: false, kind: 'refused', reason: 'suppressed_target_mismatch' });
  });

  it('an unknown address on the same account is allowed with persona_id null', async () => {
    prisma.persona.findFirst.mockResolvedValueOnce(null);
    const out = await recordDisposition(prisma, input({ contactEmail: 'new@acme.example', responseClass: 'no_signal', buyerLanguage: null }), deps);
    expect(out.ok).toBe(true);
    expect(prisma.tx.conversationDisposition.create.mock.calls[0][0].data).toMatchObject({ persona_id: null, contact_email: 'new@acme.example' });
  });

  it('a bad BID refuses invalid_body naming bids.<i>.<field> before the transaction', async () => {
    const out = await recordDisposition(prisma, input({ bids: [{ type: 'feeling', rawBuyerLanguage: 'x' }] }), deps);
    expect(out).toEqual({ ok: false, kind: 'invalid_body', field: 'bids.0.type', reason: 'unknown_bid_type' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('an agent cannot adopt an AI suggestion', async () => {
    const out = await recordDisposition(prisma, input({ actorKind: 'agent', actor: 'cron', aiSuggestionId: 'D_ai' }), deps);
    expect(out).toEqual({ ok: false, kind: 'refused', reason: 'agent_cannot_confirm' });
  });

  it('ai_suggestion_mismatch when the AI row is for another source', async () => {
    prisma.conversationDisposition.findUnique.mockResolvedValueOnce({
      id: 'D_ai', hypothesis_id: 'H1', source_kind: 'inbound_message', source_id: 'msg-other', human_confirmed: false, created_by: 'ai', response_class: 'timing', ai_suggested: {},
    });
    const out = await recordDisposition(prisma, input({ aiSuggestionId: 'D_ai', source: { kind: 'inbound_message', id: 'msg-1' }, channel: 'email' }), deps);
    expect(out).toEqual({ ok: false, kind: 'refused', reason: 'ai_suggestion_mismatch' });
  });
});

describe('step 2: the row and its BIDs in one transaction', () => {
  it('writes the lowercased email, the confirmed human row and every BID through captureBid inside tx', async () => {
    const out = await recordDisposition(
      prisma,
      input({
        bids: [
          { type: 'business_problem', rawBuyerLanguage: 'we lose trailers every week' },
          { type: 'metric', rawBuyerLanguage: '40 minutes a truck', numericValue: 40, unit: 'minutes' },
        ],
      }),
      deps,
    );
    expect(out).toMatchObject({ ok: true, dispositionId: 'D1', bidIds: ['B1', 'B2'], humanConfirmed: true });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const row = prisma.tx.conversationDisposition.create.mock.calls[0][0].data;
    expect(row).toMatchObject({
      hypothesis_id: 'H1',
      account_name: 'Acme Logistics',
      persona_id: 7,
      contact_email: 'jordan@acme.example',
      hubspot_contact_id: 'hs-7',
      source_kind: 'call',
      source_id: 'call:7:1',
      channel: 'call',
      response_class: 'problem_confirmed',
      buyer_language: 'we lose trailers every week',
      human_confirmed: true,
      confirmed_by: 'casey',
      confirmed_at: NOW,
      created_by: 'casey',
    });
    expect(row.metadata).toBeUndefined();
    const bids = prisma.tx.buyerInputData.create.mock.calls.map((c) => c[0].data);
    expect(bids).toHaveLength(2);
    expect(bids[0]).toMatchObject({ disposition_id: 'D1', type: 'business_problem', human_confirmed: true, confirmed_by: 'casey', source: 'call', captured_by: 'casey' });
    expect(bids[1]).toMatchObject({ disposition_id: 'D1', type: 'metric', numeric_value: 40, unit: 'minutes', human_confirmed: true });
  });

  it('duplicate_source: a unique collision answers with the existing id and nothing after step 2 runs', async () => {
    prisma.tx.conversationDisposition.create.mockRejectedValueOnce(Object.assign(new Error('unique'), { code: 'P2002' }));
    prisma.conversationDisposition.findUnique.mockResolvedValueOnce({ id: 'D_old' });
    const out = await recordDisposition(prisma, input(), deps);
    expect(out).toEqual({ ok: false, kind: 'refused', reason: 'duplicate_source', existingId: 'D_old' });
    expect(prisma.conversationDisposition.findUnique).toHaveBeenCalledWith({
      where: { source_kind_source_id: { source_kind: 'call', source_id: 'call:7:1' } },
      select: { id: true },
    });
    expect(calls).toEqual([]);
  });

  it('timing stores resumeAt in metadata and leaves the hypothesis active', async () => {
    const out = await recordDisposition(
      prisma,
      input({ responseClass: 'timing', buyerLanguage: null, resumeAt: '2027-01-04T00:00:00.000Z' }),
      deps,
    );
    expect(out.ok).toBe(true);
    expect(prisma.tx.conversationDisposition.create.mock.calls[0][0].data.metadata).toEqual({ resumeAt: '2027-01-04T00:00:00.000Z' });
    expect(calls.some((c) => c.startsWith('transition:'))).toBe(false);
    expect(calls).toEqual(['stopRuns', 'mirror']);
  });

  it('adopting an AI suggestion updates THAT row in place: class set, human_confirmed flipped, agreement recorded, ai_suggested untouched', async () => {
    prisma.conversationDisposition.findUnique.mockResolvedValueOnce({
      id: 'D_ai', hypothesis_id: 'H1', source_kind: 'inbound_message', source_id: 'msg-1', human_confirmed: false, created_by: 'ai', response_class: 'timing',
      ai_suggested: { responseClass: 'timing', bids: [], why: 'said Q1' },
    });
    const out = await recordDisposition(
      prisma,
      input({ aiSuggestionId: 'D_ai', source: { kind: 'inbound_message', id: 'msg-1' }, channel: 'email', responseClass: 'problem_confirmed' }),
      deps,
    );
    expect(out).toMatchObject({ ok: true, dispositionId: 'D_ai' });
    expect(prisma.tx.conversationDisposition.create).not.toHaveBeenCalled();
    const call = prisma.tx.conversationDisposition.updateMany.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'D_ai', human_confirmed: false });
    expect(call.data).toMatchObject({ response_class: 'problem_confirmed', human_confirmed: true, confirmed_by: 'casey', created_by: 'ai' });
    expect(call.data.metadata).toEqual({ aiSuggestion: { id: 'D_ai', responseClass: 'timing', matched: false } });
    expect(call.data).not.toHaveProperty('ai_suggested');
  });
});

describe('step 3 onward: effects in the section 7 order', () => {
  it('problem_confirmed: stop every live enrollment, stopRuns, resolve with the derived outcome, mirror; never unsubscribe', async () => {
    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([
      { id: 'E1', engine: 'modex_draft_queue', status: 'paused' },
      { id: 'E2', engine: 'hubspot_native', status: 'active' },
    ]);
    const out = await recordDisposition(prisma, input(), deps);
    expect(out).toMatchObject({
      ok: true,
      effects: { stopped: ['E1', 'E2'], unsubscribed: false, resolution: { outcome: 'confirmed', confidence: 70 }, mirrored: true },
      refusals: [],
    });
    expect(calls).toEqual(['stop:E1', 'stop:E2', 'stopRuns', 'transition:resolve', 'stopForHypothesis', 'mirror']);
    expect(deps.stopEnrollment.mock.calls[0].slice(1)).toEqual(['E1', 'replied', 'casey', NOW]);
    expect(deps.stopRuns).toHaveBeenCalledWith(prisma, 'jordan@acme.example', 'replied');
    expect(deps.recordUnsubscribe).not.toHaveBeenCalled();
    expect(deps.stopEnrollmentsForHypothesis).toHaveBeenCalledWith(prisma, 'H1', 'hypothesis_resolved', 'casey', NOW);
    // The scored record is MERGED into the resolution the machine wrote (notes kept).
    const merged = prisma.prospectingHypothesis.update.mock.calls[0][0];
    expect(merged.where).toEqual({ id: 'H1' });
    expect(merged.data.resolution).toMatchObject({ problem: 'confirmed', notes: 'disposition:D1', confidence: 70, impact: 'none', rootCause: 'unknown', dispositionIds: ['D1'], scoredBy: 'D1' });
    expect(deps.mirror.mock.calls[0][1]).toMatchObject({ dispositionId: 'D1', hubspotContactId: 'hs-7', responseClass: 'problem_confirmed', confirmedAt: NOW, hypothesisId: 'H1', channel: 'call' });
  });

  it('resolve passes the DERIVED outcome (newest confirmed problem_* row), never the caller\'s class', async () => {
    // A concurrent human confirmed problem_rejected one second later: the buyer's latest answer decides.
    prisma.conversationDisposition.findMany.mockResolvedValueOnce([
      { id: 'D1', response_class: 'problem_confirmed', channel: 'call', human_confirmed: true, created_at: NOW, confirmed_at: NOW },
      { id: 'D9', response_class: 'problem_rejected', channel: 'email', human_confirmed: true, created_at: LATER, confirmed_at: LATER },
    ]);
    deps.transition.mockImplementationOnce(async (_p: any, _id: string, action: string, ctx: any) => {
      calls.push(`transition:${action}:${ctx.outcome}`);
      return { ok: true, from: 'active', to: 'rejected', effects: ['set_resolved', 'stop_enrollments:hypothesis_resolved'] };
    });
    const out = await recordDisposition(prisma, input(), deps);
    expect(calls).toContain('transition:resolve:rejected');
    expect(deps.transition.mock.calls[0][3]).toMatchObject({ outcome: 'rejected', actor: 'casey', now: NOW, reason: 'disposition:D1' });
    expect(out).toMatchObject({ ok: true, effects: { resolution: { outcome: 'rejected', confidence: null } } });
  });

  it('resolution reads only confirmed unsuperseded BIDs and cites them', async () => {
    prisma.buyerInputData.findMany.mockResolvedValueOnce([
      { id: 'B1', type: 'business_problem', raw_buyer_language: 'we lose trailers', numeric_value: null, unit: null, human_confirmed: true, supersedes_id: null, captured_at: NOW },
      { id: 'B2', type: 'root_cause', raw_buyer_language: 'paper gate', numeric_value: null, unit: null, human_confirmed: false, supersedes_id: null, captured_at: NOW },
    ]);
    const out = await recordDisposition(prisma, input(), deps);
    // 70 base (call) + 15 quote = 85; the unconfirmed root cause adds nothing.
    expect(out).toMatchObject({ ok: true, effects: { resolution: { outcome: 'confirmed', confidence: 85 } } });
    expect(prisma.prospectingHypothesis.update.mock.calls[0][0].data.resolution).toMatchObject({ bidIds: ['B1'], quote: true, rootCause: 'unknown' });
  });

  it('do_not_contact: stop with reason dnc, stopRuns, recordUnsubscribe with source gap_disposition, mirror; never resolve', async () => {
    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([{ id: 'E1', engine: 'modex_draft_queue', status: 'active' }]);
    const out = await recordDisposition(prisma, input({ responseClass: 'do_not_contact', buyerLanguage: null }), deps);
    expect(out).toMatchObject({
      ok: true,
      effects: { stopped: ['E1'], unsubscribed: true, resolution: null, mirrored: true },
      refusals: [],
    });
    expect(calls).toEqual(['stop:E1', 'stopRuns', 'unsubscribe', 'mirror']);
    expect(deps.stopEnrollment.mock.calls[0].slice(1)).toEqual(['E1', 'dnc', 'casey', NOW]);
    expect(deps.stopRuns).toHaveBeenCalledWith(prisma, 'jordan@acme.example', 'dnc');
    expect(deps.recordUnsubscribe).toHaveBeenCalledTimes(1);
    expect(deps.recordUnsubscribe.mock.calls[0][1]).toEqual({
      email: 'jordan@acme.example',
      source: 'gap_disposition',
      reason: 'do_not_contact disposition',
      dispositionId: 'D1',
      actor: 'casey',
      now: NOW,
    });
    expect(deps.transition).not.toHaveBeenCalled();
  });

  it('out_of_office touches nothing: no stop, no stopRuns, no unsubscribe, no resolve; the paused run stays paused', async () => {
    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([{ id: 'E1', engine: 'modex_draft_queue', status: 'paused' }]);
    const out = await recordDisposition(prisma, input({ channel: 'email', responseClass: 'out_of_office', buyerLanguage: null }), deps);
    expect(out).toMatchObject({ ok: true, humanConfirmed: true, effects: { stopped: [], unsubscribed: false, resolution: null, mirrored: true }, refusals: [] });
    expect(calls).toEqual(['mirror']);
    expect(prisma.sequenceEnrollment.findMany).not.toHaveBeenCalled();
  });

  it('a call-only class keeps the sequence: voicemail runs no effects', async () => {
    const out = await recordDisposition(prisma, input({ responseClass: 'voicemail', buyerLanguage: null }), deps);
    expect(out).toMatchObject({ ok: true, effects: { stopped: [], unsubscribed: false, resolution: null } });
    expect(calls).toEqual(['mirror']);
  });

  it('an agent row is unconfirmed and has NO effects: nothing after the transaction runs, not even the mirror', async () => {
    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([{ id: 'E1', engine: 'modex_draft_queue', status: 'active' }]);
    const out = await recordDisposition(
      prisma,
      input({ actor: 'cron', actorKind: 'agent', responseClass: 'do_not_contact', buyerLanguage: null, bids: [{ type: 'objection', rawBuyerLanguage: 'stop emailing me' }] }),
      deps,
    );
    expect(out).toEqual({ ok: true, dispositionId: 'D1', bidIds: ['B1'], humanConfirmed: false, effects: 'none', refusals: [] });
    const row = prisma.tx.conversationDisposition.create.mock.calls[0][0].data;
    expect(row).toMatchObject({ human_confirmed: false, confirmed_by: null, confirmed_at: null, created_by: 'cron' });
    expect(prisma.tx.buyerInputData.create.mock.calls[0][0].data).toMatchObject({ human_confirmed: false, confirmed_by: null });
    expect(calls).toEqual([]);
    expect(deps.recordUnsubscribe).not.toHaveBeenCalled();
    expect(deps.transition).not.toHaveBeenCalled();
    expect(deps.mirror).not.toHaveBeenCalled();
  });

  it('a failure after step 2 never rolls back step 1: the stop throws, the row stays, the rest still runs, the refusal is named', async () => {
    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([{ id: 'E1', engine: 'modex_draft_queue', status: 'active' }]);
    deps.stopEnrollment.mockRejectedValueOnce(new Error('engine down'));
    const out = await recordDisposition(prisma, input(), deps);
    expect(out).toMatchObject({ ok: true, dispositionId: 'D1', refusals: [{ step: 'stop', reason: 'engine down' }] });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['transition:resolve', 'stopForHypothesis', 'mirror']);
  });

  it('an enrollment-service refusal on one row is recorded per id and the others still stop', async () => {
    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([
      { id: 'E1', engine: 'modex_draft_queue', status: 'active' },
      { id: 'E2', engine: 'hubspot_native', status: 'active' },
    ]);
    deps.stopEnrollment.mockResolvedValueOnce({ ok: false, reason: 'stale_status' });
    const out = await recordDisposition(prisma, input({ responseClass: 'not_priority', buyerLanguage: null }), deps);
    expect(out).toMatchObject({ ok: true, effects: { stopped: ['E2'] }, refusals: [{ step: 'stop', reason: 'stale_status', id: 'E1' }] });
  });

  it('the mirror is fail-open: a skip or a throw lands in refusals with mirrored false', async () => {
    deps.mirror.mockResolvedValueOnce({ status: 'skipped:gap_mirror_disabled' });
    let out = await recordDisposition(prisma, input({ responseClass: 'no_signal', buyerLanguage: null }), deps);
    expect(out).toMatchObject({ ok: true, effects: { mirrored: false }, refusals: [{ step: 'mirror', reason: 'skipped:gap_mirror_disabled' }] });
    prisma = makePrisma();
    deps.mirror.mockRejectedValueOnce(new Error('hubspot 500'));
    out = await recordDisposition(prisma, input({ responseClass: 'no_signal', buyerLanguage: null }), deps);
    expect(out).toMatchObject({ ok: true, effects: { mirrored: false }, refusals: [{ step: 'mirror', reason: 'hubspot 500' }] });
  });

  it('a machine refusal on resolve is recorded, not thrown, and the mirror still runs', async () => {
    deps.transition.mockResolvedValueOnce({ ok: false, reason: 'stale_status' });
    const out = await recordDisposition(prisma, input(), deps);
    expect(out).toMatchObject({ ok: true, effects: { resolution: null, mirrored: true }, refusals: [{ step: 'resolve', reason: 'stale_status', id: 'H1' }] });
    expect(prisma.prospectingHypothesis.update).not.toHaveBeenCalled();
  });

  it('wrong_person: close_unresolved with the disposition as reason, then a superseding draft with no persona and the same signals', async () => {
    const out = await recordDisposition(prisma, input({ responseClass: 'wrong_person', buyerLanguage: null }), deps);
    expect(out).toMatchObject({ ok: true, effects: { stopped: [], resolution: null, retarget: { closedHypothesisId: 'H1', draftHypothesisId: 'H2' } } });
    expect(calls).toEqual(['stopRuns', 'transition:close_unresolved', 'stopForHypothesis', 'propose', 'mirror']);
    expect(deps.transition.mock.calls[0].slice(1, 4)).toEqual(['H1', 'close_unresolved', { now: NOW, actor: 'casey', reason: 'wrong_person:D1' }]);
    expect(deps.stopEnrollmentsForHypothesis).toHaveBeenCalledWith(prisma, 'H1', 'manual', 'casey', NOW);
    const proposed = deps.propose.mock.calls[0][1];
    expect(proposed).toMatchObject({
      accountName: 'Acme Logistics',
      primaryPersonaId: null,
      problemFamily: 'hidden_capacity',
      observation: 'They opened a second DC [S:S1].',
      signalIds: ['S1'],
      primarySignalId: 'S1',
      createdBy: 'casey',
      metadata: { retarget: { fromHypothesisId: 'H1', dispositionId: 'D1', wrongPersonaId: 7 } },
    });
    expect(prisma.prospectingHypothesis.update).toHaveBeenCalledWith({ where: { id: 'H2' }, data: { supersedes_id: 'H1' } });
    expect(deps.audit.mock.calls.map((c) => c[1].kind)).toContain('disposition.retarget');
  });

  it('referral: audits disposition.referral with the name from metadata and the BID that names the person', async () => {
    prisma.buyerInputData.findFirst.mockResolvedValueOnce({ id: 'B1', metadata: { referral: { name: 'Pat Lee' } } });
    const out = await recordDisposition(
      prisma,
      input({ responseClass: 'referral', buyerLanguage: null, referral: { name: 'Pat Lee', title: 'VP Ops' }, bids: [{ type: 'constraint', rawBuyerLanguage: 'talk to Pat Lee, she owns the yards' }] }),
      deps,
    );
    expect(out).toMatchObject({ ok: true, effects: { referral: { fromBidId: 'B1', name: 'Pat Lee', title: 'VP Ops' } } });
    expect(prisma.tx.conversationDisposition.create.mock.calls[0][0].data.metadata).toEqual({ referral: { name: 'Pat Lee', title: 'VP Ops' } });
    const referralAudit = deps.audit.mock.calls.find((c) => c[1].kind === 'disposition.referral');
    expect(referralAudit?.[1].payload).toMatchObject({ referral: { fromBidId: 'B1', name: 'Pat Lee' }, bidIds: ['B1'] });
    expect(deps.transition).not.toHaveBeenCalled();
  });

  it('audits disposition.recorded after the transaction and disposition.effects at the end', async () => {
    await recordDisposition(prisma, input(), deps);
    const kinds = deps.audit.mock.calls.map((c) => c[1].kind);
    expect(kinds[0]).toBe('disposition.recorded');
    expect(kinds[kinds.length - 1]).toBe('disposition.effects');
    expect(deps.audit.mock.calls[0][1].payload).toMatchObject({ humanConfirmed: true, responseClass: 'problem_confirmed', bidIds: [] });
  });
});

describe('stopReasonFor', () => {
  it('maps do_not_contact to dnc, bounce to bounced, everything else to replied', () => {
    expect(stopReasonFor('do_not_contact')).toBe('dnc');
    expect(stopReasonFor('bounce')).toBe('bounced');
    expect(stopReasonFor('problem_confirmed')).toBe('replied');
    expect(stopReasonFor('timing')).toBe('replied');
  });
});

describe('stale rows in the enrollment query', () => {
  it('a stop_pending row counts as stopped without a second stop request', async () => {
    prisma.sequenceEnrollment.findMany.mockResolvedValueOnce([{ id: 'E1', engine: 'hubspot_native', status: 'stop_pending' }]);
    const out = await recordDisposition(prisma, input({ responseClass: 'meeting_accepted', buyerLanguage: null }), deps);
    expect(out).toMatchObject({ ok: true, effects: { stopped: ['E1'] } });
    expect(deps.stopEnrollment).not.toHaveBeenCalled();
  });

  it('queries live enrollments by the address OR the persona, newest last', async () => {
    await recordDisposition(prisma, input({ responseClass: 'meeting_accepted', buyerLanguage: null }), deps);
    expect(prisma.sequenceEnrollment.findMany.mock.calls[0][0].where).toEqual({
      OR: [{ to_email: 'jordan@acme.example' }, { persona_id: 7 }],
      status: { in: ['active', 'paused', 'stop_pending'] },
    });
  });
});
