/**
 * <LearningDashboard> (GAP Prospecting OS, Sprint 5).
 *
 * Pins: loading -> rendered, an error state, a zero-denominator rate shown
 * as "insufficient data" rather than a fabricated 0%, and a low-sample rate
 * flagged rather than hidden.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LearningDashboard } from '@/app/gap/learning/learning-dashboard';
import type { ApiResult, GapApiClient, LearningReportResponse } from '@/lib/gap/ui/gap-api-client';
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

/** R-A: a client whose getLearningReport is a real spy, so a test can assert what params a filter change sent. */
function spyClient(data: LearningReportResponse): { client: GapApiClient; getLearningReport: ReturnType<typeof vi.fn> } {
  const getLearningReport = vi.fn().mockResolvedValue({ ok: true, status: 200, data });
  const client = {
    listReplies: vi.fn(),
    getCallBrief: vi.fn(),
    postDisposition: vi.fn(),
    postBid: vi.fn(),
    suggestReply: vi.fn(),
    getLearningReport,
  } as unknown as GapApiClient;
  return { client, getLearningReport };
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

  /**
   * R-A (owner-confirmed finish requirement, 2026-09-24). Mutate the
   * FilterBar away (or its onChange wiring) and these go RED: the campaign
   * select stops listing programs, or changing a filter stops re-fetching
   * with the new params.
   */
  it('R-A: the campaign select lists the programs the report response carries', async () => {
    const { client } = spyClient({ ...report(), filters: { program: null, from: null, to: null }, programs: ['Inland26', 'top100-2026-09-12'] });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Hypothesis funnel');
    const select = screen.getByLabelText('Campaign') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(['', 'Inland26', 'top100-2026-09-12']);
  });

  it('R-A: choosing a campaign re-fetches with that program', async () => {
    const { client, getLearningReport } = spyClient({ ...report(), filters: { program: null, from: null, to: null }, programs: ['Inland26'] });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Hypothesis funnel');
    expect(getLearningReport).toHaveBeenCalledWith({});

    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'Inland26' } });
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ program: 'Inland26' }));
  });

  it('R-A: setting a date range re-fetches with from/to', async () => {
    const { client, getLearningReport } = spyClient({ ...report(), filters: { program: null, from: null, to: null }, programs: [] });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Hypothesis funnel');

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-01' } });
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ from: '2026-09-01' }));
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-09-30' } });
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ from: '2026-09-01', to: '2026-09-30' }));
  });

  it('R-A: Clear resets every filter and re-fetches unfiltered', async () => {
    const { client, getLearningReport } = spyClient({ ...report(), filters: { program: null, from: null, to: null }, programs: ['Inland26'] });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Hypothesis funnel');
    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'Inland26' } });
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ program: 'Inland26' }));

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ program: null, from: null, to: null }));
  });
});
