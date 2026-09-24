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
} = {}) {
  return {
    prospectingHypothesis: { findMany: asyncSpy(async () => overrides.hypotheses ?? []) },
    conversationDisposition: { findMany: asyncSpy(async () => overrides.dispositions ?? []) },
    buyerInputData: { findMany: asyncSpy(async () => overrides.bids ?? []) },
    prospectingSignal: { groupBy: asyncSpy(async () => overrides.signalCounts ?? []) },
  };
}

describe('loadLearningInputs: AI/unconfirmed exclusion', () => {
  it('queries dispositions with human_confirmed: true (structural: an AI-suggested row can never reach a metric)', async () => {
    const prisma = makePrisma();
    await loadLearningInputs(prisma);
    expect(prisma.conversationDisposition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { human_confirmed: true } }),
    );
  });

  it('an unconfirmed root_cause BID never marks a hypothesis root-cause-confirmed', async () => {
    const prisma = makePrisma({
      hypotheses: [{ id: 'H1', status: 'confirmed', account_name: 'Acme', problem_family: 'hidden_capacity', persona: 'site_ops', sequence_family_id: null, sequence_version_id: null, account: { tier: 'Tier 1' }, signals: [] }],
      dispositions: [{ id: 'D1', hypothesis_id: 'H1', response_class: 'problem_confirmed', channel: 'call', root_cause_class: null, impact_class: null, enrollment: null }],
      bids: [{ id: 'B1', hypothesis_id: 'H1', type: 'root_cause', human_confirmed: false, supersedes_id: null, numeric_value: null, unit: null }],
    });
    const { conversations } = await loadLearningInputs(prisma);
    expect(conversations[0].rootCauseConfirmed).toBe(false);
  });

  it('a correction that supersedes a confirmed BID removes the old evidence even while the correction itself sits unconfirmed', async () => {
    const prisma = makePrisma({
      hypotheses: [{ id: 'H1', status: 'confirmed', account_name: 'Acme', problem_family: 'hidden_capacity', persona: 'site_ops', sequence_family_id: null, sequence_version_id: null, account: null, signals: [] }],
      dispositions: [{ id: 'D1', hypothesis_id: 'H1', response_class: 'problem_confirmed', channel: 'call', root_cause_class: null, impact_class: null, enrollment: null }],
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
      hypotheses: [{ id: 'H1', status: 'confirmed', account_name: 'Acme', problem_family: 'hidden_capacity', persona: 'site_ops', sequence_family_id: null, sequence_version_id: null, account: null, signals: [] }],
      dispositions: [{ id: 'D1', hypothesis_id: 'H1', response_class: 'problem_confirmed', channel: 'email', root_cause_class: null, impact_class: null, enrollment: { sender: 'casey@freightroll.com' } }],
      bids: [{ id: 'B1', hypothesis_id: 'H1', type: 'metric', human_confirmed: true, supersedes_id: null, numeric_value: 40, unit: 'minutes/shift' }],
    });
    const { conversations } = await loadLearningInputs(prisma);
    expect(conversations[0]).toMatchObject({ impactAcknowledged: true, impactQuantified: true, sender: 'casey@freightroll.com' });
  });

  it('sequence family and version ride along on the hypothesis row (sequence-version attribution)', async () => {
    const prisma = makePrisma({
      hypotheses: [
        { id: 'H1', status: 'confirmed', account_name: 'Acme', problem_family: 'hidden_capacity', persona: 'site_ops', sequence_family_id: 'F1', sequence_version_id: 'V1', account: null, signals: [{ role: 'primary', signal: { type: 'acquisition' } }] },
      ],
    });
    const { hypotheses } = await loadLearningInputs(prisma);
    expect(hypotheses[0]).toMatchObject({ sequenceFamilyId: 'F1', sequenceVersionId: 'V1', primarySignalType: 'acquisition' });
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
