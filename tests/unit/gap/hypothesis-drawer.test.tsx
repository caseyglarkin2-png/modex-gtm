/**
 * Hypothesis drawer UI (GAP Prospecting OS, Sprint 1, S1-T13).
 *
 * Pins the FACT / HYPOTHESIS separation, the legal-action buttons derived
 * from the machine table, the evidence gate on Approve and Activate, the
 * reason gate on withdraw, the verbatim inline error on a refused PATCH, and
 * the terminal "Closed" state.
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FactBlock, HypothesisBlock } from '@/components/gap/fact-hypothesis-blocks';
import { HypothesisDrawer, type HypothesisRow } from '@/components/gap/hypothesis-drawer';

const SIGNAL_WITH_URL = {
  id: 'sig_1',
  title: 'Opened a second DC in Reno',
  source_kind: 'top100_evidence',
  source_type: 'public_primary',
  evidence_url: 'https://example.com/reno',
  evidence_text: null,
  observed_at: '2026-09-01T00:00:00.000Z',
  confidence: 80,
  external_ok: true,
};

const SIGNAL_NO_EVIDENCE = {
  id: 'sig_2',
  title: 'Operator remembers a call',
  source_kind: 'operator_knowledge',
  source_type: 'manual',
  evidence_url: null,
  evidence_text: null,
  observed_at: '2026-09-02T00:00:00.000Z',
  confidence: 40,
  external_ok: false,
};

function row(overrides: Partial<HypothesisRow> = {}): HypothesisRow {
  return {
    id: 'hyp_1',
    account_name: 'Acme Foods',
    problem_family: 'dwell',
    persona: 'vp_operations',
    status: 'draft',
    confidence: 55,
    observation: 'Acme opened a second DC in Reno [S:sig_1].',
    problem_hypothesis: 'Acme may be losing dock hours to congestion across its yards.',
    root_cause_hypotheses: ['No gate-to-dock visibility'],
    impact_hypotheses: ['Detention spend rising'],
    why_now: 'The Reno ramp doubles inbound volume.',
    falsification_questions: ['Does Reno run its own gate?'],
    what_a_no_means: 'The family is wrong for this account.',
    created_at: '2026-09-10T00:00:00.000Z',
    updated_at: '2026-09-11T00:00:00.000Z',
    signals: [{ hypothesis_id: 'hyp_1', signal_id: 'sig_1', role: 'primary', signal: SIGNAL_WITH_URL }],
    events: [
      {
        id: 'evt_1',
        action: 'propose',
        actor: 'casey@freightroll.com',
        from_status: null,
        to_status: 'draft',
        reason: null,
        created_at: '2026-09-10T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('<FactBlock>', () => {
  it('renders the FACT heading and a numbered link for a cited sentence with a url', () => {
    render(<FactBlock observation="Acme opened a second DC in Reno [S:sig_1]." signals={[SIGNAL_WITH_URL]} />);
    const block = screen.getByTestId('fact-block');
    expect(block).toHaveAttribute('data-block', 'fact');
    expect(within(block).getByRole('heading')).toHaveTextContent(/^FACT$/);
    expect(within(block).getByText('Observed, cited')).toBeInTheDocument();
    expect(within(block).getByText('Acme opened a second DC in Reno.')).toBeInTheDocument();
    const link = within(block).getByRole('link', { name: '1' });
    expect(link).toHaveAttribute('href', 'https://example.com/reno');
    expect(block).not.toHaveAttribute('data-state', 'unsupported');
  });

  it('renders a tooltip span, not a link, when the signal has no url', () => {
    render(
      <FactBlock
        observation="Someone said so [S:sig_2]."
        signals={[{ ...SIGNAL_NO_EVIDENCE, evidence_text: 'call note' }]}
      />,
    );
    const block = screen.getByTestId('fact-block');
    expect(within(block).queryByRole('link')).toBeNull();
    expect(within(block).getByTitle('call note')).toHaveTextContent('1');
  });

  it('renders "No cited facts yet" with data-state unsupported for an empty observation', () => {
    render(<FactBlock observation="" signals={[]} />);
    const block = screen.getByTestId('fact-block');
    expect(block).toHaveAttribute('data-state', 'unsupported');
    expect(within(block).getByText('No cited facts yet')).toBeInTheDocument();
  });
});

describe('<HypothesisBlock>', () => {
  it('renders the HYPOTHESIS heading, the seller-inference caption and the sub-sections', () => {
    render(
      <HypothesisBlock
        problemHypothesis="Acme may be losing dock hours."
        rootCauseHypotheses={['No gate-to-dock visibility']}
        impactHypotheses={['Detention spend rising']}
        whyNow="The Reno ramp doubles inbound volume."
        falsificationQuestions={['Does Reno run its own gate?']}
        whatANoMeans="The family is wrong for this account."
        confidence={55}
      />,
    );
    const block = screen.getByTestId('hypothesis-block');
    expect(block).toHaveAttribute('data-block', 'hypothesis');
    expect(within(block).getByRole('heading', { level: 3 })).toHaveTextContent(/^HYPOTHESIS$/);
    expect(within(block).getByText('Seller inference, unproven')).toBeInTheDocument();
    expect(within(block).getByText('Root causes')).toBeInTheDocument();
    expect(within(block).getByText('Impacts')).toBeInTheDocument();
    expect(within(block).getByText('Why now')).toBeInTheDocument();
    expect(within(block).getByText('Would prove wrong')).toBeInTheDocument();
    expect(within(block).getByText('Does Reno run its own gate?')).toBeInTheDocument();
    expect(within(block).getByText('The family is wrong for this account.')).toBeInTheDocument();
  });

  it('captions "Why now" as fact-derived ("From cited signals") inside the HYPOTHESIS block, and nothing else', () => {
    render(
      <HypothesisBlock
        problemHypothesis="Acme may be losing dock hours."
        rootCauseHypotheses={['No gate-to-dock visibility']}
        impactHypotheses={['Detention spend rising']}
        whyNow="The Reno ramp doubles inbound volume."
        falsificationQuestions={['Does Reno run its own gate?']}
        whatANoMeans="The family is wrong for this account."
        confidence={55}
      />,
    );
    const block = screen.getByTestId('hypothesis-block');
    const factDerived = block.querySelectorAll('[data-kind="fact-derived"]');
    expect(factDerived).toHaveLength(1);
    const whyNow = factDerived[0] as HTMLElement;
    expect(within(whyNow).getByText('Why now')).toBeInTheDocument();
    expect(within(whyNow).getByText('From cited signals')).toBeInTheDocument();
    expect(within(whyNow).getByText('The Reno ramp doubles inbound volume.')).toBeInTheDocument();
    // The seller-inference caption stays on the block, outside the fact-derived sub-section.
    expect(within(whyNow).queryByText('Seller inference, unproven')).toBeNull();
    expect(within(block).getAllByText('From cited signals')).toHaveLength(1);
  });

  it('gives the two blocks different data-block attributes', () => {
    render(
      <>
        <FactBlock observation="" signals={[]} />
        <HypothesisBlock
          problemHypothesis="x"
          rootCauseHypotheses={[]}
          impactHypotheses={[]}
          whyNow={null}
          falsificationQuestions={[]}
          whatANoMeans={null}
          confidence={0}
        />
      </>,
    );
    expect(screen.getByTestId('fact-block').getAttribute('data-block')).not.toBe(
      screen.getByTestId('hypothesis-block').getAttribute('data-block'),
    );
  });
});

describe('<HypothesisDrawer>', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draft with an unsupported observation: Approve + use is shown but disabled with the reason; no separate submit ceremony', () => {
    render(<HypothesisDrawer hypothesis={row({ observation: '', signals: [] })} onClose={vi.fn()} onTransition={vi.fn()} />);
    const approve = screen.getByRole('button', { name: 'Approve + use' });
    expect(approve).toBeDisabled();
    expect(approve).toHaveAttribute('title', 'Needs at least one cited fact');
    expect(screen.queryByRole('button', { name: 'Ready for review' })).toBeNull();
    expect(screen.getByTestId('fact-block')).toHaveAttribute('data-state', 'unsupported');
  });

  it('review_required with no evidence: Approve is rendered but disabled with the title', () => {
    render(
      <HypothesisDrawer
        hypothesis={row({
          status: 'review_required',
          observation: 'Someone said so [S:sig_2].',
          signals: [{ hypothesis_id: 'hyp_1', signal_id: 'sig_2', role: 'primary', signal: SIGNAL_NO_EVIDENCE }],
        })}
        onClose={vi.fn()}
        onTransition={vi.fn()}
      />,
    );
    const approve = screen.getByRole('button', { name: 'Approve + use' });
    expect(approve).toBeDisabled();
    expect(approve).toHaveAttribute('title', 'Needs at least one cited fact');
  });

  it('review_required with an uncited observation but evidenced signals: Approve is still disabled', () => {
    render(
      <HypothesisDrawer
        hypothesis={row({ status: 'review_required', observation: 'No citation token here.' })}
        onClose={vi.fn()}
        onTransition={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Approve + use' })).toBeDisabled();
  });

  it('approved with no evidence: Activate is disabled with the title', () => {
    render(
      <HypothesisDrawer
        hypothesis={row({
          status: 'approved',
          observation: 'Someone said so [S:sig_2].',
          signals: [{ hypothesis_id: 'hyp_1', signal_id: 'sig_2', role: 'primary', signal: SIGNAL_NO_EVIDENCE }],
        })}
        onClose={vi.fn()}
        onTransition={vi.fn()}
      />,
    );
    const activate = screen.getByRole('button', { name: 'Use in routing' });
    expect(activate).toBeDisabled();
    expect(activate).toHaveAttribute('title', 'Needs at least one cited fact');
  });

  it('review_required with evidence: Approve + use PATCHes {advance:"approve_and_use"} (one click, legal transitions server side) and calls onTransition', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ hypothesisId: 'hyp_1', ok: true, from: 'review_required', to: 'active', detail: 'approved and in use' }, 200));
    const onTransition = vi.fn();
    render(<HypothesisDrawer hypothesis={row({ status: 'review_required' })} onClose={vi.fn()} onTransition={onTransition} />);

    const approve = screen.getByRole('button', { name: 'Approve + use' });
    expect(approve).toBeEnabled();
    fireEvent.click(approve);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/gap/hypotheses/hyp_1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({ advance: 'approve_and_use' });
    await waitFor(() => expect(onTransition).toHaveBeenCalledWith({ from: 'review_required', to: 'active', effects: [] }));
  });

  it('a 409 {error:"no_evidence"} renders the plain-English refusal inline', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ hypothesisId: 'hyp_1', ok: false, from: 'review_required', to: 'review_required', detail: 'approve refused: no_evidence' }, 409));
    const onTransition = vi.fn();
    render(<HypothesisDrawer hypothesis={row({ status: 'review_required' })} onClose={vi.fn()} onTransition={onTransition} />);

    fireEvent.click(screen.getByRole('button', { name: 'Approve + use' }));

    const error = await screen.findByTestId('hypothesis-action-error');
    expect(error).toHaveTextContent('Needs at least one cited fact');
    expect(onTransition).not.toHaveBeenCalled();
  });

  it('an unknown refusal code falls back to the raw string, never hidden', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: false, detail: 'approve refused: some_new_code' }, 409));
    render(<HypothesisDrawer hypothesis={row({ status: 'review_required' })} onClose={vi.fn()} onTransition={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Approve + use' }));

    const error = await screen.findByTestId('hypothesis-action-error');
    expect(error).toHaveTextContent('some_new_code');
  });

  it('Reject hypothesis (withdraw) is disabled until a reason is typed, then the PATCH body carries the reason', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ from: 'draft', to: 'rejected', effects: [] }, 200));
    render(<HypothesisDrawer hypothesis={row()} onClose={vi.fn()} onTransition={vi.fn()} />);

    const withdraw = screen.getByRole('button', { name: 'Reject hypothesis' });
    expect(withdraw).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Duplicate of hyp_0' } });
    expect(withdraw).toBeEnabled();
    fireEvent.click(withdraw);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ action: 'withdraw', reason: 'Duplicate of hyp_0' });
  });

  it('active: Resolve sends the selected outcome', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ from: 'active', to: 'confirmed', effects: [] }, 200));
    render(<HypothesisDrawer hypothesis={row({ status: 'active' })} onClose={vi.fn()} onTransition={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Outcome'), { target: { value: 'partially_confirmed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ action: 'resolve', outcome: 'partially_confirmed' });
  });

  it('a terminal status renders "Closed" and zero action buttons', () => {
    render(<HypothesisDrawer hypothesis={row({ status: 'expired' })} onClose={vi.fn()} onTransition={vi.fn()} />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.queryByTestId('hypothesis-actions')).toBeNull();
    expect(screen.queryByTestId('hypothesis-sticky-decision')).toBeNull();
    for (const name of ['Ready for review', 'Approve hypothesis', 'Use in routing', 'Reject hypothesis', 'Resolve', 'Expire']) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
  });

  it('draft: the sticky decision area shows the primary action and names the reason-gated secondary', () => {
    render(<HypothesisDrawer hypothesis={row()} onClose={vi.fn()} onTransition={vi.fn()} />);
    const sticky = screen.getByTestId('hypothesis-sticky-decision');
    expect(within(sticky).getByRole('button', { name: 'Approve + use' })).toBeInTheDocument();
    expect(within(sticky).getByRole('button', { name: 'Approve only' })).toBeInTheDocument();
    expect(within(sticky).getByText(/Reject hypothesis/)).toBeInTheDocument();
    // Reject hypothesis needs a reason, so its actual button lives in the lower Actions section, not duplicated here.
    expect(within(sticky).queryByRole('button', { name: 'Reject hypothesis' })).toBeNull();
  });

  it('review_required: the sticky decision area recommends Approve + use, with Needs work / Reject hypothesis as secondary', () => {
    render(<HypothesisDrawer hypothesis={row({ status: 'review_required' })} onClose={vi.fn()} onTransition={vi.fn()} />);
    const sticky = screen.getByTestId('hypothesis-sticky-decision');
    expect(within(sticky).getByRole('button', { name: 'Approve + use' })).toBeInTheDocument();
    expect(within(sticky).getByText(/Needs work.*Reject hypothesis/)).toBeInTheDocument();
  });

  it('renders Previous/Next only when the owner passes review-mode callbacks, and disables the edge it cannot move to', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(
      <HypothesisDrawer
        hypothesis={row()}
        onClose={vi.fn()}
        onTransition={vi.fn()}
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={false}
        hasNext={true}
      />,
    );
    const nav = screen.getByTestId('hypothesis-review-nav');
    expect(within(nav).getByRole('button', { name: 'Previous' })).toBeDisabled();
    const next = within(nav).getByRole('button', { name: 'Next' });
    expect(next).toBeEnabled();
    fireEvent.click(next);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('renders no Previous/Next nav when the owner does not opt into review mode', () => {
    render(<HypothesisDrawer hypothesis={row()} onClose={vi.fn()} onTransition={vi.fn()} />);
    expect(screen.queryByTestId('hypothesis-review-nav')).toBeNull();
  });

  it('Use in routing shows where the person landed (routing ran on its own); no Run routing step', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ from: 'approved', to: 'active', effects: ['set_activated'], routing: { ok: true, runId: 'run-9', people: [], counts: { ready: 1 } } }, 200),
    );
    render(<HypothesisDrawer hypothesis={row({ status: 'approved' })} onClose={vi.fn()} onTransition={vi.fn()} />);

    expect(screen.queryByTestId('hypothesis-activated-banner')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Use in routing' }));

    const banner = await screen.findByTestId('hypothesis-activated-banner');
    expect(banner).toHaveTextContent('1 approved · 1 in use');
    expect(banner).toHaveTextContent('1 ready to contact');
    expect(within(banner).getByRole('link', { name: 'Contact them now' })).toHaveAttribute('href', '/gap?lane=ready');
    expect(banner).not.toHaveTextContent(/run routing/i);
  });

  it('a routing failure after Use in routing is shown inline with its reason, never silent', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ from: 'approved', to: 'active', effects: [], routing: { ok: false, reason: 'routing_failed', detail: 'hubspot 502' } }, 200));
    render(<HypothesisDrawer hypothesis={row({ status: 'approved' })} onClose={vi.fn()} onTransition={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Use in routing' }));
    const banner = await screen.findByTestId('hypothesis-activated-banner');
    expect(within(banner).getByRole('alert')).toHaveTextContent('In use, but no recommendations yet. Routing failed. hubspot 502 Nothing was sent.');
  });

  it('does not show the activation banner for a transition that does not land on active', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ hypothesisId: 'hyp_1', ok: true, from: 'review_required', to: 'approved', detail: 'approved' }, 200));
    render(<HypothesisDrawer hypothesis={row({ status: 'review_required' })} onClose={vi.fn()} onTransition={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Approve only' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('hypothesis-activated-banner')).toBeNull();
  });

  it('renders the signal list and the event history', () => {
    render(<HypothesisDrawer hypothesis={row()} onClose={vi.fn()} onTransition={vi.fn()} />);
    const signals = screen.getByTestId('hypothesis-signals');
    expect(within(signals).getByText('Opened a second DC in Reno')).toBeInTheDocument();
    expect(within(signals).getByText('top100_evidence')).toBeInTheDocument();
    const events = screen.getByTestId('hypothesis-events');
    expect(within(events).getByText('propose')).toBeInTheDocument();
    expect(within(events).getByText('casey@freightroll.com')).toBeInTheDocument();
    expect(within(events).getByText(/draft/)).toBeInTheDocument();
    expect(screen.queryByText('Register facts from the account page (Sprint 2)')).toBeNull();
    expect(within(signals).getByTestId('add-fact-form')).toBeInTheDocument();
  });

  it('a linked fact asks the owner to refetch: onChanged when given, else onTransition with a same-status signals_linked result', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'sig_new', created: true }, 201))
      .mockResolvedValueOnce(jsonResponse({ linked: ['sig_new'], already: [] }, 200));
    const onTransition = vi.fn();
    const onChanged = vi.fn();
    const { unmount } = render(
      <HypothesisDrawer hypothesis={row()} onClose={vi.fn()} onTransition={onTransition} onChanged={onChanged} />,
    );
    fireEvent.change(screen.getByLabelText('What you know'), { target: { value: 'A fact.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add fact' }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(onTransition).not.toHaveBeenCalled();
    unmount();

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'sig_new', created: true }, 201))
      .mockResolvedValueOnce(jsonResponse({ linked: ['sig_new'], already: [] }, 200));
    render(<HypothesisDrawer hypothesis={row()} onClose={vi.fn()} onTransition={onTransition} />);
    fireEvent.change(screen.getByLabelText('What you know'), { target: { value: 'A fact.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add fact' }));
    await waitFor(() => expect(onTransition).toHaveBeenCalledWith({ from: 'draft', to: 'draft', effects: ['signals_linked'] }));
  });

  it('a terminal status renders no add-fact form; an active one renders it frozen with the hint', () => {
    const { unmount } = render(<HypothesisDrawer hypothesis={row({ status: 'rejected' })} onClose={vi.fn()} onTransition={vi.fn()} />);
    expect(screen.queryByTestId('add-fact-form')).toBeNull();
    unmount();

    render(<HypothesisDrawer hypothesis={row({ status: 'active' })} onClose={vi.fn()} onTransition={vi.fn()} />);
    expect(screen.getByTestId('add-fact-frozen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add fact' })).toBeDisabled();
  });
});
