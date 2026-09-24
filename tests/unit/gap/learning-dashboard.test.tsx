/**
 * <LearningDashboard> (GAP Prospecting OS, Sprint 5).
 *
 * Pins: loading -> rendered, an error state, a zero-denominator rate shown
 * as "insufficient data" rather than a fabricated 0%, and a low-sample rate
 * flagged rather than hidden.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LearningDashboard } from '@/app/gap/learning/learning-dashboard';
import type { ApiResult, GapApiClient } from '@/lib/gap/ui/gap-api-client';
import type { LearningReport } from '@/lib/gap/learning/query';

const ZERO_RATE = { value: null, n: 0, numerator: 0, denominator: 0 };
const FULL_RATE = { value: 1, n: 1, numerator: 1, denominator: 1 };

function report(overrides: Partial<LearningReport> = {}): LearningReport {
  return {
    funnel: {
      resolutionRate: ZERO_RATE,
      precision: ZERO_RATE,
      precisionConfirmed: ZERO_RATE,
      precisionPartial: ZERO_RATE,
      problemResonanceRate: ZERO_RATE,
      rootCauseConfirmationRate: ZERO_RATE,
      impactAcknowledgmentRate: ZERO_RATE,
      impactQuantificationRate: ZERO_RATE,
      problemToMeetingRate: ZERO_RATE,
      meetingToQualifiedProblemRate: ZERO_RATE,
    },
    byProblemFamily: [],
    byPersona: [],
    bySignalType: [],
    byTamTier: [],
    bySequenceFamily: [],
    bySequenceVersion: [],
    byChannel: [],
    bySender: [],
    dispositionDistribution: [],
    signalYield: [],
    counts: { hypotheses: 0, conversations: 0 },
    ...overrides,
  };
}

function clientWith(result: ApiResult<LearningReport>): GapApiClient {
  return {
    listReplies: vi.fn(),
    getCallBrief: vi.fn(),
    postDisposition: vi.fn(),
    postBid: vi.fn(),
    suggestReply: vi.fn(),
    getLearningReport: vi.fn().mockResolvedValue(result),
  } as unknown as GapApiClient;
}

describe('LearningDashboard', () => {
  it('shows insufficient data rather than a fabricated 0% when the denominator is zero', async () => {
    const client = clientWith({ ok: true, status: 200, data: report() });
    render(<LearningDashboard client={client} />);
    expect(await screen.findByText('Hypothesis funnel')).toBeInTheDocument();
    expect(screen.getAllByText('insufficient data').length).toBeGreaterThan(0);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('flags a low-sample rate without hiding its value', async () => {
    const client = clientWith({
      ok: true,
      status: 200,
      data: report({ funnel: { ...report().funnel, resolutionRate: FULL_RATE } }),
    });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Hypothesis funnel');
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/low sample, n=1/)).toBeInTheDocument();
  });

  it('renders an error state and never a stale report on failure', async () => {
    const client = clientWith({ ok: false, status: 401, error: 'unauthenticated' });
    render(<LearningDashboard client={client} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('unauthenticated');
    expect(screen.queryByText('Hypothesis funnel')).not.toBeInTheDocument();
  });

  it('renders a problem-family breakdown row with its rate and n', async () => {
    const client = clientWith({
      ok: true,
      status: 200,
      data: report({
        byProblemFamily: [{ key: 'hidden_capacity', funnel: { ...report().funnel, resolutionRate: FULL_RATE } }],
      }),
    });
    render(<LearningDashboard client={client} />);
    expect(await screen.findByText('hidden_capacity')).toBeInTheDocument();
  });
});
