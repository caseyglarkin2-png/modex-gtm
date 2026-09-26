// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: refreshMock }) }));

import { ResearchThis } from '@/components/gap/research-this';

const json = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
const RESULT = {
  runId: 'rr-1',
  outcome: 'evidence_found',
  facts: [{ signalId: 's1', excerpt: 'We opened a new DC in Ohio.', url: 'https://example.com/10q', title: 'KROGER CO 10-Q', publishedAt: '2026-09-18T00:00:00Z', fresh: true }],
  rejected: [],
  conflicts: [],
};
const NARRATIVE = {
  observation: 'KROGER CO 10-Q: "We opened a new DC in Ohio" [S:s1].',
  problemHypothesis: 'My guess is the new DC moves load onto the yards that remain.',
  rootCauses: ['Gate check-in is manual'],
  impacts: ['Detention at the remaining DCs'],
  wouldProveWrong: ['Did trailer volume at the remaining sites stay flat?'],
  whatANoMeans: 'The network change did not touch the yards.',
  evidence: [{ signalId: 's1', title: 'KROGER CO 10-Q', excerpt: 'We opened a new DC in Ohio.', observedAt: '2026-09-18T00:00:00Z' }],
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  refreshMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe('<ResearchThis> one human decision (debt burn, 2026-09-26)', () => {
  it('evidence found: the machine proposes on its own and the WHOLE narrative is on screen before Casey decides; one APPROVE + USE does the rest', async () => {
    fetchMock
      .mockResolvedValueOnce(json(RESULT))
      .mockResolvedValueOnce(json({ ok: true, hypothesisId: 'h1', hypothesisIds: ['h1', 'h2'], existing: false, narrative: NARRATIVE }, 201));
    render(<ResearchThis decisionId="dec-1" personaIds={[1886, 1788]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Research this' }));

    const thesis = await screen.findByTestId('proposed-thesis');
    // Proposing was machine work: no second click, and it covered the group.
    expect(fetchMock.mock.calls[1][0]).toBe('/api/gap/research/rr-1/propose');
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toEqual({ personaIds: [1886, 1788] });
    expect(screen.queryByRole('button', { name: /propose/i })).toBeNull();
    for (const label of ['Facts', 'Hypothesis', 'Root causes', 'Impacts', 'Would prove it wrong', 'Evidence']) expect(within(thesis).getByText(label)).toBeInTheDocument();
    expect(thesis).toHaveTextContent('KROGER CO 10-Q: "We opened a new DC in Ohio".');
    expect(thesis).not.toHaveTextContent('[S:');
    expect(thesis).toHaveTextContent('Gate check-in is manual');
    expect(thesis).toHaveTextContent('Detention at the remaining DCs');
    expect(thesis).toHaveTextContent('A no means: The network change did not touch the yards.');
    expect(within(thesis).getByRole('link', { name: 'KROGER CO 10-Q' })).toHaveAttribute('href', 'https://example.com/10q');

    fetchMock.mockResolvedValueOnce(
      json({ ok: true, results: [{ ok: true, to: 'active', detail: 'approved and in use' }, { ok: true, to: 'active', detail: 'approved and in use' }], routing: { ok: true, runId: 'run-9', counts: { ready: 2 }, failures: [] } }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve + use for 2' }));
    await screen.findByTestId('use-outcome');
    expect(fetchMock.mock.calls[2][0]).toBe('/api/gap/research/rr-1/decide');
    expect(JSON.parse(String(fetchMock.mock.calls[2][1].body))).toEqual({ hypothesisIds: ['h1', 'h2'], decision: 'approve_and_use' });
    expect(screen.getByTestId('use-outcome-lanes')).toHaveTextContent('2 ready to contact');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    // Two Casey clicks in all: Research this, Approve + use. Nothing else was asked of him.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole('button', { name: /approve/i })).toBeNull();
  });

  it('REJECT is the same single decision: drafts withdrawn, nothing contacted', async () => {
    fetchMock.mockResolvedValueOnce(json(RESULT)).mockResolvedValueOnce(json({ ok: true, hypothesisId: 'h1', hypothesisIds: ['h1'], existing: false, narrative: NARRATIVE }, 201));
    render(<ResearchThis decisionId="dec-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Research this' }));
    await screen.findByTestId('proposed-thesis');
    fetchMock.mockResolvedValueOnce(json({ ok: true, results: [{ ok: true, to: 'rejected', detail: 'rejected' }], routing: null }));
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await screen.findByTestId('proposal-rejected');
    expect(JSON.parse(String(fetchMock.mock.calls[2][1].body))).toEqual({ hypothesisIds: ['h1'], decision: 'reject' });
  });

  it('NEEDS WORK goes to Review where the draft can be edited', async () => {
    fetchMock.mockResolvedValueOnce(json(RESULT)).mockResolvedValueOnce(json({ ok: true, hypothesisId: 'h1', hypothesisIds: ['h1'], existing: false, narrative: NARRATIVE }, 201));
    render(<ResearchThis decisionId="dec-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Research this' }));
    await screen.findByTestId('proposed-thesis');
    expect(screen.getByRole('link', { name: 'Needs work: edit in Review' })).toHaveAttribute('href', '/gap?lane=review');
  });

  it('a proposal that fails says so inline, and no approve button appears', async () => {
    fetchMock.mockResolvedValueOnce(json(RESULT)).mockResolvedValueOnce(json({ error: 'no_fresh_evidence' }, 409));
    render(<ResearchThis decisionId="dec-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Research this' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The thesis could not be proposed: no_fresh_evidence'));
    expect(screen.queryByRole('button', { name: /approve/i })).toBeNull();
  });
});
