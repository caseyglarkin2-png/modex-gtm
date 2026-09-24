/**
 * `loadLearningInputs` / `buildLearningReport` (GAP Prospecting OS, Sprint 5).
 *
 * Two mutation proofs this file owns (paste, run, restore):
 *   1. drop `where: { human_confirmed: true }` from the
 *      conversationDisposition.findMany call in query.ts -> the structural
 *      assertion below goes red naming the query.
 *   2. feed selectConfirmedBids the confirmed-only subset instead of every
 *      BID row -> the "unconfirmed correction still supersedes" behavior is
 *      unreachable and the superseded-root-cause fixture below goes red.
 */
import { describe, expect, it, vi } from 'vitest';

import { buildLearningReport, loadLearningInputs } from '@/lib/gap/learning/query';

/* eslint-disable @typescript-eslint/no-explicit-any */
function asyncSpy(impl: (...args: any[]) => Promise<any>) {
  return vi.fn<(...args: any[]) => Promise<any>>(impl);
}

function makePrisma(overrides: {
  hypotheses?: any[];
  dispositions?: any[];
  bids?: any[];
  signalCounts?: any[];
  enrollments?: any[];
} = {}) {
  return {
    prospectingHypothesis: { findMany: asyncSpy(async () => overrides.hypotheses ?? []) },
    conversationDisposition: { findMany: asyncSpy(async () => overrides.dispositions ?? []) },
    buyerInputData: { findMany: asyncSpy(async () => overrides.bids ?? []) },
    prospectingSignal: { groupBy: asyncSpy(async () => overrides.signalCounts ?? []) },
    sequenceEnrollment: { findMany: asyncSpy(async () => overrides.enrollments ?? []) },
  };
}

/** A disposition row with sane defaults; only override what a test cares about. */
function disposition(over: Record<string, unknown> = {}) {
  return {
    id: 'D1', hypothesis_id: 'H1', response_class: 'problem_confirmed', channel: 'call',
    root_cause_class: null, impact_class: null, contact_email: 'buyer@acme.example', enrollment: null,
    ...over,
  };
}

function hypothesis(over: Record<string, unknown> = {}) {
  return {
    id: 'H1', status: 'confirmed', account_name: 'Acme', problem_family: 'hidden_capacity',
    persona: 'site_ops', account: { tier: 'Tier 1' }, signals: [],
    ...over,
  };
}

describe('loadLearningInputs: AI/unconfirmed exclusion', () => {
  it('queries dispositions with human_confirmed: true and the is_test OR gate (structural: an AI-suggested or internal-test row can never reach a metric)', async () => {
    const prisma = makePrisma();
    await loadLearningInputs(prisma);
    expect(prisma.conversationDisposition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { human_confirmed: true, OR: [{ enrollment_id: null }, { enrollment: { is_test: false } }] },
      }),
    );
  });

  it('an unconfirmed root_cause BID never marks a hypothesis root-cause-confirmed', async () => {
    const prisma = makePrisma({
      hypotheses: [hypothesis()],
      dispositions: [disposition()],
      bids: [{ id: 'B1', hypothesis_id: 'H1', type: 'root_cause', human_confirmed: false, supersedes_id: null, numeric_value: null, unit: null }],
    });
    const { conversations } = await loadLearningInputs(prisma);
    expect(conversations[0].rootCauseConfirmed).toBe(false);
  });

  it('a correction that supersedes a confirmed BID removes the old evidence even while the correction itself sits unconfirmed', async () => {
    const prisma = makePrisma({
      hypotheses: [hypothesis()],
      dispositions: [disposition()],
      bids: [
        { id: 'B1', hypothesis_id: 'H1', type: 'root_cause', human_confirmed: true, supersedes_id: null, numeric_value: null, unit: null },
        { id: 'B2', hypothesis_id: 'H1', type: 'root_cause', human_confirmed: false, supersedes_id: 'B1', numeric_value: null, unit: null },
      ],
    });
    const { conversations } = await loadLearningInputs(prisma);
    // B1 is superseded by B2, and B2 is unconfirmed, so neither counts: fail closed.
    expect(conversations[0].rootCauseConfirmed).toBe(false);
  });

  it('a confirmed impact BID with a numeric value and unit marks the conversation quantified and acknowledged', async () => {
    const prisma = makePrisma({
      hypotheses: [hypothesis()],
      dispositions: [disposition({ channel: 'email', enrollment: { sender: 'casey@freightroll.com' } })],
      bids: [{ id: 'B1', hypothesis_id: 'H1', type: 'metric', human_confirmed: true, supersedes_id: null, numeric_value: 40, unit: 'minutes/shift' }],
    });
    const { conversations } = await loadLearningInputs(prisma);
    expect(conversations[0]).toMatchObject({ impactAcknowledged: true, impactQuantified: true, sender: 'casey@freightroll.com' });
  });

  it('a root-cause BID confirmed on one conversation marks EVERY problem-confirming conversation of that hypothesis true (deliberate hypothesis-wide fan-out, not per-conversation or time-ordered)', async () => {
    const prisma = makePrisma({
      hypotheses: [hypothesis()],
      dispositions: [
        disposition({ id: 'D1', channel: 'email' }),
        disposition({ id: 'D2', response_class: 'problem_partially_confirmed', channel: 'call' }),
      ],
      // The root-cause BID is tied to D2 (the LATER conversation); D1 (earlier) still reads confirmed.
      bids: [{ id: 'B1', hypothesis_id: 'H1', type: 'root_cause', human_confirmed: true, supersedes_id: null, numeric_value: null, unit: null }],
    });
    const { conversations } = await loadLearningInputs(prisma);
    const d1 = conversations.find((c) => c.id === 'D1');
    const d2 = conversations.find((c) => c.id === 'D2');
    expect(d1?.rootCauseConfirmed).toBe(true);
    expect(d2?.rootCauseConfirmed).toBe(true);
  });

  /**
   * B8 (Opus adversarial review, 2026-09-24). Before this fix, sequence
   * family/version came from ProspectingHypothesis.sequence_family_id /
   * .sequence_version_id, columns no code writes, so bySequenceFamily and
   * bySequenceVersion were always empty in production. The real attribution
   * is SequenceEnrollment.hypothesis_id. Mutate the fix back to reading the
   * hypothesis row's own columns and this goes RED (the enrollment fixture
   * below carries F1/V1; the hypothesis row does not).
   */
  it('sequence family and version are attributed through sequence_enrollments.hypothesis_id, not the hypothesis row', async () => {
    const prisma = makePrisma({
      hypotheses: [hypothesis({ account: null, signals: [{ role: 'primary', signal: { type: 'acquisition' } }] })],
      enrollments: [{ hypothesis_id: 'H1', family_id: 'F1', sequence_version_id: 'V1', enrolled_at: new Date('2026-09-01T00:00:00.000Z') }],
    });
    const { hypotheses } = await loadLearningInputs(prisma);
    expect(hypotheses[0]).toMatchObject({ sequenceFamilyId: 'F1', sequenceVersionId: 'V1', primarySignalType: 'acquisition' });
  });

  it('B8: the newest enrollment wins when a hypothesis has more than one', async () => {
    const prisma = makePrisma({
      hypotheses: [hypothesis()],
      enrollments: [
        { hypothesis_id: 'H1', family_id: 'F1', sequence_version_id: 'V1', enrolled_at: new Date('2026-09-10T00:00:00.000Z') },
        { hypothesis_id: 'H1', family_id: 'F2', sequence_version_id: 'V2', enrolled_at: new Date('2026-09-01T00:00:00.000Z') },
      ],
    });
    const { hypotheses } = await loadLearningInputs(prisma);
    // Rows arrive orderBy enrolled_at desc; the query itself supplies that
    // order (asserted below), so the fixture is already newest-first.
    expect(hypotheses[0]).toMatchObject({ sequenceFamilyId: 'F1', sequenceVersionId: 'V1' });
    expect(prisma.sequenceEnrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { enrolled_at: 'desc' } }),
    );
  });

  it('a hypothesis with no enrollment reads sequenceFamilyId/sequenceVersionId as null', async () => {
    const prisma = makePrisma({ hypotheses: [hypothesis()] });
    const { hypotheses } = await loadLearningInputs(prisma);
    expect(hypotheses[0]).toMatchObject({ sequenceFamilyId: null, sequenceVersionId: null });
  });

  /**
   * B9 (Opus adversarial review, 2026-09-24): the is_test exclusion is
   * pushed into the `where` clause itself (proven structurally above,
   * exactly like human_confirmed), because a mock at this layer cannot
   * simulate what Postgres would filter. Mutate the where clause back to
   * `{ human_confirmed: true }` alone and that structural test goes RED.
   *
   * The internal-recipient exclusion is the one predicate this file DOES
   * apply after the fetch (the FROM_EMAIL override is an env read, not
   * expressible as a Prisma where). Proven directly, not via the where
   * clause assertion above.
   */
  it('B9: a confirmed disposition from an internal recipient is excluded even though it passed the where clause', async () => {
    const prisma = makePrisma({
      hypotheses: [hypothesis()],
      dispositions: [
        disposition({ id: 'D1', contact_email: 'buyer@acme.example' }),
        disposition({ id: 'D_internal', contact_email: 'casey@freightroll.com' }),
      ],
    });
    const { conversations } = await loadLearningInputs(prisma);
    expect(conversations.map((c) => c.id)).toEqual(['D1']);
  });
});

describe('buildLearningReport', () => {
  it('assembles the funnel and every breakdown with counts, over a zero-data prisma without throwing', async () => {
    const prisma = makePrisma();
    const report = await buildLearningReport(prisma);
    expect(report.counts).toEqual({ hypotheses: 0, conversations: 0 });
    expect(report.funnel.resolutionRate).toEqual({ value: null, n: 0, numerator: 0, denominator: 0 });
    expect(report.dispositionDistribution).toEqual([]);
    expect(report.signalYield).toEqual([]);
  });

  it('groups a resolved hypothesis into its problem family and TAM tier breakdowns', async () => {
    const prisma = makePrisma({
      hypotheses: [{ id: 'H1', status: 'confirmed', account_name: 'Acme', problem_family: 'hidden_capacity', persona: 'site_ops', sequence_family_id: null, sequence_version_id: null, account: { tier: 'Tier 1' }, signals: [] }],
      dispositions: [{ id: 'D1', hypothesis_id: 'H1', response_class: 'problem_confirmed', channel: 'call', root_cause_class: null, impact_class: null, enrollment: null }],
      signalCounts: [{ type: 'acquisition', _count: { _all: 3 } }],
    });
    const report = await buildLearningReport(prisma);
    expect(report.byProblemFamily.find((r) => r.key === 'hidden_capacity')?.funnel.resolutionRate.numerator).toBe(1);
    expect(report.byTamTier.find((r) => r.key === 'Tier 1')?.funnel.resolutionRate.numerator).toBe(1);
    expect(report.signalYield).toEqual([{ signalType: 'acquisition', signalCount: 3, hypothesisCount: 0, rate: { value: 0, n: 3, numerator: 0, denominator: 3 } }]);
  });
});
