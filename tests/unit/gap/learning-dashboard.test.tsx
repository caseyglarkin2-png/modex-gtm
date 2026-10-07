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
import type { AgreementReport } from '@/lib/gap/routing/agreement';

const ZERO_RATE = { value: null, n: 0, numerator: 0, denominator: 0 };
const FULL_RATE = { value: 1, n: 1, numerator: 1, denominator: 1 };
const NO_EXEC_RATE = { numerator: 0, denominator: 0, n: 0, value: null, interval: null, status: 'no_data' as const };
const NO_EXECUTION = { windowDays: 30, overall: { peopleContacted: 0, peopleMatured: 0, optOutPerSend: NO_EXEC_RATE, positivePerSend: NO_EXEC_RATE, sends: 0, replyPerSend: NO_EXEC_RATE, meetingPerSend: NO_EXEC_RATE, truthYield: NO_EXEC_RATE, problemAckPerSend: NO_EXEC_RATE, rootCausePerSend: NO_EXEC_RATE }, bySequenceVersion: [], byCopyVersion: [], bySender: [], byEngine: [], byEvidenceTier: [] };

function report(overrides: Partial<LearningReport> = {}): LearningReport {
  return {
    execution: NO_EXECUTION,
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

const NO_AGREEMENT: AgreementReport = {
  overall: { agreements: 0, disagreements: 0, unverified: 0, unacted: 0, rate: null, n: 0, honest: { numerator: 0, denominator: 0, n: 0, value: null, interval: null, status: 'no_data' } },
  byRuleId: [],
  byAction: [],
  totalDecisions: 0,
  pending: 0,
};

function clientWith(result: ApiResult<LearningReport>): GapApiClient {
  return {
    listReplies: vi.fn(),
    getCallBrief: vi.fn(),
    postDisposition: vi.fn(),
    postBid: vi.fn(),
    suggestReply: vi.fn(),
    getLearningReport: vi.fn().mockResolvedValue(result),
    getRoutingAgreement: vi.fn().mockResolvedValue({ ok: true, status: 200, data: NO_AGREEMENT }),
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
    getRoutingAgreement: vi.fn().mockResolvedValue({ ok: true, status: 200, data: NO_AGREEMENT }),
  } as unknown as GapApiClient;
  return { client, getLearningReport };
}

describe('LearningDashboard', () => {
  it('shows "no data yet" rather than a fabricated 0% when the denominator is zero', async () => {
    const client = clientWith({ ok: true, status: 200, data: report() });
    render(<LearningDashboard client={client} />);
    expect(await screen.findByText('Thesis funnel')).toBeInTheDocument();
    expect(screen.getAllByText('no data yet').length).toBeGreaterThan(0);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('red team T10 PROOF: 4/5 renders as an early observation, never as 80%', async () => {
    const client = clientWith({
      ok: true,
      status: 200,
      data: report({ funnel: { ...report().funnel, resolutionRate: { value: 0.8, n: 5, numerator: 4, denominator: 5 } } }),
    });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Thesis funnel');
    expect(screen.queryByText('80%')).not.toBeInTheDocument();
    expect(screen.getAllByText(/early observation, n < 20/).length).toBeGreaterThan(0);
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });

  it('a rate at n >= 20 shows its percentage and a 95% interval', async () => {
    const client = clientWith({
      ok: true,
      status: 200,
      data: report({ funnel: { ...report().funnel, resolutionRate: { value: 0.5, n: 40, numerator: 20, denominator: 40 } } }),
    });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Thesis funnel');
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/50% \(20\/40, 95% CI 35%-65%\)/)).toBeInTheDocument();
  });

  it('red team T10: the execution section leads, per person sent to, with small n suppressed', async () => {
    const small = { numerator: 1, denominator: 3, n: 3, value: null, interval: null, status: 'insufficient' as const };
    const metrics = { peopleContacted: 3, peopleMatured: 3, optOutPerSend: small, positivePerSend: small, sends: 4, replyPerSend: small, meetingPerSend: small, truthYield: small, problemAckPerSend: small, rootCausePerSend: small };
    const client = clientWith({
      ok: true,
      status: 200,
      data: report({ execution: { windowDays: 30, overall: metrics, bySequenceVersion: [{ key: 'v1', metrics }], byCopyVersion: [], bySender: [], byEngine: [], byEvidenceTier: [] } }),
    });
    render(<LearningDashboard client={client} />);
    expect(await screen.findByText('What happened after we sent')).toBeInTheDocument();
    expect(screen.getByText(/3 people sent to \(4 sends\); 3 past the\s+30-day outcome window/)).toBeInTheDocument();
    expect(screen.queryByText('33%')).not.toBeInTheDocument();
    expect(screen.getByText('Reply / send by sequence version (first send)')).toBeInTheDocument();
  });

  it('renders an error state and never a stale report on failure', async () => {
    const client = clientWith({ ok: false, status: 401, error: 'unauthenticated' });
    render(<LearningDashboard client={client} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('unauthenticated');
    expect(screen.queryByText('Thesis funnel')).not.toBeInTheDocument();
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
    await screen.findByText('Thesis funnel');
    const select = screen.getByLabelText('Campaign') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(['', 'Inland26', 'top100-2026-09-12']);
  });

  it('R-A: choosing a campaign re-fetches with that program', async () => {
    const { client, getLearningReport } = spyClient({ ...report(), filters: { program: null, from: null, to: null }, programs: ['Inland26'] });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Thesis funnel');
    expect(getLearningReport).toHaveBeenCalledWith({});

    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'Inland26' } });
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ program: 'Inland26' }));
  });

  it('R-A: setting a date range re-fetches with from/to', async () => {
    const { client, getLearningReport } = spyClient({ ...report(), filters: { program: null, from: null, to: null }, programs: [] });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Thesis funnel');

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-01' } });
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ from: '2026-09-01' }));
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-09-30' } });
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ from: '2026-09-01', to: '2026-09-30' }));
  });

  it('R-A: Clear resets every filter and re-fetches unfiltered', async () => {
    const { client, getLearningReport } = spyClient({ ...report(), filters: { program: null, from: null, to: null }, programs: ['Inland26'] });
    render(<LearningDashboard client={client} />);
    await screen.findByText('Thesis funnel');
    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'Inland26' } });
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ program: 'Inland26' }));

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => expect(getLearningReport).toHaveBeenLastCalledWith({ program: null, from: null, to: null }));
  });

  /**
   * R-B (owner-confirmed finish requirement, 2026-09-24). Mutate the
   * section away (or its data source) and this goes RED: the gate G1
   * agreement numbers stop reaching the page at all.
   */
  it('R-B: renders the routing-vs-human-action section with the overall rate and both breakdowns', async () => {
    const client = clientWith({ ok: true, status: 200, data: report() });
    (client.getRoutingAgreement as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        overall: { agreements: 18, disagreements: 6, unverified: 2, unacted: 3, rate: 0.75, n: 24 },
        byRuleId: [{ key: 'hot_call', rate: { agreements: 2, disagreements: 0, unverified: 0, unacted: 0, rate: 1, n: 2 } }],
        byAction: [{ key: 'call_now', rate: { agreements: 2, disagreements: 0, unverified: 0, unacted: 0, rate: 1, n: 2 } }],
        totalDecisions: 30,
        pending: 6,
      },
    });
    render(<LearningDashboard client={client} />);
    expect(await screen.findByText('Routing vs what was actually done (conformity, not sales quality)')).toBeInTheDocument();
    expect(await screen.findByText('75%')).toBeInTheDocument();
    expect(screen.getByText('hot_call')).toBeInTheDocument();
    expect(screen.getByText(/30 routing decisions total; 24 counted; 6 still open/)).toBeInTheDocument();
    expect(screen.getByText(/2 "emailed" with no send on record, 3 cards expired or superseded/)).toBeInTheDocument();
  });

  it('R-B: a failed agreement fetch shows its own error, without blocking the funnel above it', async () => {
    const client = clientWith({ ok: true, status: 200, data: report() });
    (client.getRoutingAgreement as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 401, error: 'unauthenticated' });
    render(<LearningDashboard client={client} />);
    expect(await screen.findByText('Thesis funnel')).toBeInTheDocument();
    expect(await screen.findByText(/Could not load the agreement report: unauthenticated/)).toBeInTheDocument();
  });
});

describe('Release D review B2: signal yield obeys the small-N rule', () => {
  it('1 signal -> 1 hypothesis renders as an early observation, never 100%', async () => {
    const client = clientWith({ ok: true, status: 200, data: report({ signalYield: [{ signalType: 'site_expansion', signalCount: 1, hypothesisCount: 1, rate: { value: 1, n: 1, numerator: 1, denominator: 1 } }] }) });
    render(<LearningDashboard client={client} />);
    expect(await screen.findByText('site_expansion')).toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    expect(screen.getByText('1/1 early')).toBeInTheDocument();
  });
});
