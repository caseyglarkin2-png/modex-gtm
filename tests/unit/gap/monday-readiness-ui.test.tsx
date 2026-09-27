/**
 * GAP Monday readiness, seller UI (2026-09-27): the live PepsiCo defect.
 *
 * Five approved siblings, keyword-only observation, INSUFFICIENT. The card
 * must say 5 approved, 0 in use, needs verified evidence; must NOT offer
 * Approve + use (the server knows it will refuse); its primary action is
 * FIND VERIFIED EVIDENCE; nothing found keeps it on hold with no approval
 * shortcut; a chosen verified fact goes to op use_evidence (a revision for
 * Casey's review), never straight to approve.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: refreshMock }) }));

import { ThesisGroupReview } from '@/components/gap/thesis-group-review';
import { UseOutcome } from '@/components/gap/use-outcome';
import { HypothesisDrawer, type HypothesisRow } from '@/components/gap/hypothesis-drawer';
import type { ThesisCard } from '@/lib/gap/hypothesis/thesis-groups';

const FP = 'b'.repeat(64);
const NAMES = ['salvador rosas gutierrez', 'michelle schlie', 'dana ortiz', 'lee park', 'sam wu'];

function pepsico(): ThesisCard {
  return {
    fingerprint: FP,
    accountName: 'PepsiCo',
    problemFamily: 'hidden_capacity',
    observation: 'PEP 10-Q (2026-07-09) mentions: capital expenditure.',
    problemHypothesis: 'My guess is handoffs.',
    rootCauses: [],
    impacts: [],
    falsification: [],
    whatANoMeans: null,
    depth: { label: 'SINGLE-SOURCE', independentSources: 1, keywordOnly: 1, origins: [] } as any,
    sources: [],
    members: NAMES.map((n, i) => ({ id: `a${i + 1}`, status: 'approved', personaName: n, personaTitle: 'VP', next: 'revise' as const })),
    reviewable: 0,
    readiness: { ready: false, reason: 'evidence_insufficient' },
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('insufficient legacy thesis (production-shaped)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('2. shows 5 approved · 0 in use · needs verified evidence, and offers NO Approve + use / Approve only', () => {
    render(<ThesisGroupReview cards={[pepsico()]} intro={false} />);
    expect(screen.getByTestId('thesis-state')).toHaveTextContent('5 people share this thesis · 5 approved · 0 in use · 5 need verified evidence');
    expect(screen.getByTestId('outreach-readiness')).toHaveTextContent('Not ready for outreach');
    expect(screen.getByTestId('not-ready-why')).toHaveTextContent('Find verified evidence');
    expect(screen.queryByRole('button', { name: /approve/i })).toBeNull();
    expect(screen.queryByTestId('approve-use')).toBeNull();
    expect(screen.getByTestId('find-evidence')).toHaveTextContent('Find verified evidence');
  });

  it('7. nothing good found: stays on hold in research, still no approval shortcut', async () => {
    fetchMock.mockResolvedValueOnce(json({ ok: true, outcome: 'no_second_source', reused: false, research: { runId: 'r1', facts: [], conflicts: [], notes: [] }, newIndependent: [] }));
    render(<ThesisGroupReview cards={[pepsico()]} intro={false} />);
    fireEvent.click(screen.getByTestId('find-evidence'));
    expect(await screen.findByTestId('hold')).toHaveTextContent('stays in Research and there is nothing to approve yet');
    expect(screen.queryByRole('button', { name: /approve/i })).toBeNull();
    expect(screen.queryByTestId('use-verified-evidence')).toBeNull();
  });

  it('6. a verified fact Casey selects goes to use_evidence (a revision for review), never to approve; the result says so', async () => {
    fetchMock
      .mockResolvedValueOnce(
        json({
          ok: true, outcome: 'corroborated', reused: false, research: { runId: 'r1', facts: [], conflicts: [], notes: [] },
          newIndependent: [{ signalId: 'fact', excerpt: 'PepsiCo will close three distribution centers in 2027.', url: 'https://sec.example/1', title: 'PEPSICO INC 10-Q', publishedAt: '2026-07-09', fresh: true }],
        }),
      )
      .mockResolvedValueOnce(json({ ok: true, observation: 'x', results: NAMES.map((_, i) => ({ hypothesisId: `a${i + 1}`, ok: true, from: 'approved', to: 'approved', revisionId: `rev${i}`, detail: 'new draft revision created' })) }));
    render(<ThesisGroupReview cards={[pepsico()]} intro={false} />);
    fireEvent.click(screen.getByTestId('find-evidence'));
    await screen.findByText('FOUND EVIDENCE');
    expect(screen.queryByTestId('use-evidence-approve')).toBeNull();
    fireEvent.click(screen.getByTestId('use-verified-evidence'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ op: 'use_evidence', fingerprint: FP, hypothesisIds: ['a1', 'a2', 'a3', 'a4', 'a5'], signalIds: ['fact'] });
    const out = await screen.findByTestId('revision-outcome');
    expect(out).toHaveTextContent('5 revised drafts ready for your review');
    expect(out).toHaveTextContent('The approved versions are unchanged');
    expect(out).toHaveTextContent('Nothing is approved, in use or sent yet');
    expect(within(out).getByRole('link', { name: 'Review the revised thesis' })).toHaveAttribute('href', '/gap?lane=review');
  });
});

describe('1. <UseOutcome> reports actual state', () => {
  it('five already-approved rows refused activation: 5 approved · 0 in use · verified evidence required, not green, plain-language next step', () => {
    render(
      <UseOutcome
        approved={5}
        inUse={0}
        routing={null}
        state={{ newlyApproved: 0, alreadyApproved: 5, needsResearch: 5, blocked: 0, requestedUse: true, reasons: ['evidence_insufficient'] }}
      />,
    );
    const out = screen.getByTestId('use-outcome');
    expect(screen.getByTestId('use-outcome-headline')).toHaveTextContent('5 approved · 0 in use · verified evidence required');
    expect(screen.getByTestId('use-outcome-headline').textContent).not.toMatch(/^0 approved/);
    expect(out).toHaveAttribute('data-tone', 'attention');
    expect(out.className).not.toContain('emerald');
    expect(screen.getByTestId('use-outcome-breakdown')).toHaveTextContent('5 already approved');
    expect(screen.getByTestId('use-outcome-next')).toHaveTextContent('Next: Find verified evidence');
    expect(within(out).getByRole('link', { name: 'Find verified evidence' })).toHaveAttribute('href', '/gap?lane=research');
    // The machine code is a detail, not the headline.
    expect(screen.getByTestId('use-outcome-headline').textContent).not.toContain('evidence_insufficient');
  });

  it('a clean approve + use stays green', () => {
    render(<UseOutcome approved={2} inUse={2} routing={{ ok: true, counts: { ready: 2 } }} state={{ newlyApproved: 2, alreadyApproved: 0, needsResearch: 0, blocked: 0, requestedUse: true, reasons: [] }} />);
    expect(screen.getByTestId('use-outcome')).toHaveAttribute('data-tone', 'success');
  });
});

describe('the one-off drawer obeys the same server truth', () => {
  function row(status: HypothesisRow['status'], ready: boolean): HypothesisRow {
    return {
      id: 'h1', account_name: 'PepsiCo', problem_family: 'hidden_capacity', persona: 'vp_logistics', status, confidence: 40,
      observation: 'PEP 10-Q mentions: capital expenditure [S:kw].', problem_hypothesis: 'My guess is handoffs.',
      signals: [{ signal_id: 'kw', signal: { id: 'kw', title: 'PEP 10-Q mentions: capital expenditure', source_kind: 'pounce_trigger', evidence_url: 'https://sec.example', evidence_text: null } as any }],
      events: [],
      actionability: ready
        ? { outreachReady: true, reason: null, canApprove: status !== 'approved', canUse: true, next: status === 'approved' ? 'use' : 'approve_use' }
        : { outreachReady: false, reason: 'evidence_insufficient', canApprove: false, canUse: false, next: status === 'approved' ? 'revise' : 'find_evidence' },
    };
  }

  it.each(['approved', 'review_required', 'draft'] as const)('%s + insufficient: no Approve + use / Use in routing, a Find verified evidence action instead', (status) => {
    render(<HypothesisDrawer hypothesis={row(status, false)} onClose={() => {}} onTransition={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Approve + use' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Approve only' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Use in routing' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    const box = screen.getByTestId('hypothesis-needs-evidence');
    expect(within(box).getByRole('link', { name: 'Find verified evidence' })).toHaveAttribute('href', '/gap?lane=research');
  });

  it('approved + ready still offers Use in routing', () => {
    render(<HypothesisDrawer hypothesis={row('approved', true)} onClose={() => {}} onTransition={() => {}} />);
    expect(screen.getAllByRole('button', { name: 'Use in routing' }).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('hypothesis-needs-evidence')).toBeNull();
  });
});
