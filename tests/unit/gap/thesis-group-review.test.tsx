/**
 * Account thesis card (weekend reduction pass, 2026-09-26): ONE decision per
 * thesis. APPROVE + USE routes on its own (no ROUTE THESE button), the outcome
 * survives the card changing, and research results become one "use this
 * evidence + approve + use" action that sends only the facts Casey ticked.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: refreshMock }) }));

import { ThesisGroupReview } from '@/components/gap/thesis-group-review';
import type { ThesisCard } from '@/lib/gap/hypothesis/thesis-groups';

const FP = 'a'.repeat(64);

function card(over: Partial<ThesisCard> = {}): ThesisCard {
  return {
    fingerprint: FP,
    accountName: 'PepsiCo',
    problemFamily: 'hidden_capacity',
    observation: 'PEP 10-Q mentions: capital expenditure.',
    problemHypothesis: 'My guess is handoffs.',
    rootCauses: [],
    impacts: [],
    falsification: [],
    whatANoMeans: null,
    depth: { label: 'SINGLE-SOURCE', independentSources: 1, keywordOnly: 1, origins: [] } as any,
    sources: [],
    members: [
      { id: 'h1', status: 'approved', personaName: 'salvador rosas gutierrez', personaTitle: 'VP' },
      { id: 'h2', status: 'draft', personaName: 'michelle schlie', personaTitle: 'VP' },
    ],
    reviewable: 1,
    ...over,
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('<ThesisGroupReview>', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('APPROVE + USE is the only click: it shows where people landed, and there is no ROUTE button anywhere', async () => {
    fetchMock.mockResolvedValueOnce(
      json({
        ok: true,
        results: [
          { hypothesisId: 'h1', ok: true, from: 'approved', to: 'active', detail: 'now in use' },
          { hypothesisId: 'h2', ok: true, from: 'draft', to: 'active', detail: 'approved and in use' },
        ],
        routing: { ok: true, runId: 'run-9', people: [], counts: { ready: 1, research: 1 } },
      }),
    );
    render(<ThesisGroupReview cards={[card()]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve + use for 2' }));
    const outcome = await screen.findByTestId('use-outcome');
    expect(outcome).toHaveTextContent('2 approved · 2 in use');
    expect(outcome).toHaveTextContent('1 ready to contact · 1 need research');
    expect(within(outcome).getByRole('link', { name: 'Contact them now' })).toHaveAttribute('href', '/gap?lane=ready');
    expect(screen.queryByRole('button', { name: /route/i })).toBeNull();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ op: 'approve', fingerprint: FP, hypothesisIds: ['h1', 'h2'], use: true });
    expect(refreshMock).toHaveBeenCalled();
  });

  it('the outcome stays visible after the card leaves the list (success never makes the result disappear)', async () => {
    fetchMock.mockResolvedValueOnce(json({ ok: true, results: [{ hypothesisId: 'h1', ok: true, from: 'approved', to: 'active', detail: '' }], routing: { ok: true, counts: { ready: 1 } } }));
    const { rerender } = render(<ThesisGroupReview cards={[card()]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve + use for 2' }));
    await screen.findByTestId('use-outcome');
    rerender(<ThesisGroupReview cards={[]} />);
    expect(screen.getByTestId('use-outcome')).toHaveTextContent('1 approved · 1 in use');
  });

  it('research result: ONE action attaches only the facts Casey ticked, then approves + uses', async () => {
    fetchMock
      .mockResolvedValueOnce(
        json({
          ok: true,
          outcome: 'corroborated',
          reused: false,
          research: { runId: 'r1', facts: [], conflicts: [], notes: [] },
          newIndependent: [
            { signalId: 's1', excerpt: 'PepsiCo opens a new DC in Denver.', url: 'https://a.example/1', title: 'Denver DC', publishedAt: '2026-09-01', fresh: true },
            { signalId: 's2', excerpt: 'PepsiCo expands yard at Frito plant.', url: 'https://b.example/2', title: 'Frito yard', publishedAt: '2026-09-02', fresh: true },
          ],
        }),
      )
      .mockResolvedValueOnce(json({ ok: true, results: [], routing: null }));
    render(<ThesisGroupReview cards={[card()]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Find more evidence' }));
    await screen.findByText('FOUND EVIDENCE');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Use Frito yard' }));
    expect(screen.getByTestId('what-it-changes')).toHaveTextContent('1 to 2 independent sources');
    fireEvent.click(screen.getByTestId('use-evidence-approve'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ op: 'approve', fingerprint: FP, hypothesisIds: ['h1', 'h2'], use: true, signalIds: ['s1'] });
  });

  it('contradicting evidence: no evidence action and Approve + use is disabled', async () => {
    fetchMock.mockResolvedValueOnce(
      json({ ok: true, outcome: 'contradicts', reused: false, research: { runId: 'r1', facts: [], conflicts: [{ site: 'Denver', signalIds: ['s1', 's2'] }], notes: [] }, newIndependent: [] }),
    );
    render(<ThesisGroupReview cards={[card()]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Find more evidence' }));
    await screen.findByText('EVIDENCE CONTRADICTS THIS THESIS');
    expect(screen.queryByTestId('use-evidence-approve')).toBeNull();
    expect(screen.getByTestId('approve-use')).toBeDisabled();
  });

  it('no new evidence: HOLD is a complete answer, said plainly', async () => {
    fetchMock.mockResolvedValueOnce(json({ ok: true, outcome: 'no_second_source', reused: true, research: { runId: 'r1', facts: [], conflicts: [], notes: [] }, newIndependent: [] }));
    render(<ThesisGroupReview cards={[card()]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Find more evidence' }));
    expect(await screen.findByTestId('corroboration')).toHaveTextContent('Holding is a complete answer');
  });
});
