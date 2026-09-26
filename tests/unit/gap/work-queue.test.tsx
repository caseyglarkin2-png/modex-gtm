import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: refreshMock }) }));

import { WorkQueue } from '@/app/gap/work-queue';

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('<WorkQueue> empty states and reload', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('says "No routing run yet" (never mentions a cron or an API) when there is no run at all', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ asOf: null, items: [], nextCursor: null }));
    render(<WorkQueue />);
    await waitFor(() => expect(screen.getByText('No routing run yet.')).toBeInTheDocument());
    expect(screen.queryByText(/cron/i)).toBeNull();
    expect(screen.queryByText(/\bapi\b/i)).toBeNull();
    expect(screen.getByText(/does not contact anyone/i)).toBeInTheDocument();
  });

  it('distinguishes an empty lane from no run at all', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ asOf: '2026-09-26T12:00:00.000Z', items: [], nextCursor: null }));
    render(<WorkQueue sellerLane="ready" />);
    await waitFor(() => expect(screen.getByText('Nothing in this lane right now.')).toBeInTheDocument());
  });

  it('no filters, no In flight / Enroll rows tabs, no "tell GAP what you did" preamble: the lane is the work', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ asOf: '2026-09-26T12:00:00.000Z', items: [], nextCursor: null }));
    render(<WorkQueue sellerLane="ready" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByLabelText(/filter/i)).toBeNull();
    expect(screen.queryByText(/tell GAP what you did/i)).toBeNull();
  });

  it('READY: only ready cards show, and the open card renders its action pack inline', async () => {
    const hyp = { id: 'hyp_1', status: 'active', family: 'hidden_capacity', confidence: 42 };
    const base = { lane: 'work_queue', priority: 50, blocked: false, target: null, explain: null, humanAction: null, humanActionAt: null, createdAt: '2026-09-26T00:00:00Z', suppression: { class: 'clear', hits: [] } };
    const person = (id: number, name: string) => ({ id, personaKey: null, displayName: name, email: `${name}@pepsico.com`, hubspotContactId: null, title: 'VP' });
    const account = { name: 'PepsiCo', hubspotCompanyId: '1', tam: 'in', tamTier: 'A', heatTier: 4 };
    fetchMock.mockResolvedValue(
      jsonResponse({
        asOf: '2026-09-26T12:00:00.000Z',
        nextCursor: null,
        items: [
          { ...base, id: 'd1', action: 'enroll_gap_sequence', ruleId: 'enroll', account, persona: person(916, 'salvador'), hypothesis: hyp },
          { ...base, id: 'd2', action: 'research_required', ruleId: 'no_hypothesis', account, persona: person(928, 'michelle'), hypothesis: null },
        ],
      }),
    );
    render(<WorkQueue sellerLane="ready" openId="d1" openPanel={<p>PACK</p>} closeHref="/gap?lane=ready" />);
    await screen.findByText('PACK');
    expect(screen.getAllByTestId('decision-card')).toHaveLength(1);
  });

  it('RESEARCH: people at one account missing the same evidence collapse into ONE group with one research action', async () => {
    const base = { lane: 'work_queue', priority: 50, blocked: false, target: null, explain: null, humanAction: null, humanActionAt: null, createdAt: '2026-09-26T00:00:00Z', suppression: { class: 'clear', hits: [] }, action: 'research_required', ruleId: 'no_hypothesis', hypothesis: null };
    const account = { name: 'General Mills', hubspotCompanyId: '1', tam: 'in', tamTier: 'B', heatTier: 4 };
    const person = (id: number, name: string) => ({ id, personaKey: null, displayName: name, email: `${name}@gm.com`, hubspotContactId: null });
    fetchMock.mockResolvedValue(
      jsonResponse({ asOf: '2026-09-26T12:00:00.000Z', nextCursor: null, items: [{ ...base, id: 'r1', account, persona: person(7, 'Ryan') }, { ...base, id: 'r2', account, persona: person(8, 'Nisar') }] }),
    );
    render(<WorkQueue sellerLane="research" />);
    const group = await screen.findByTestId('research-group');
    expect(group).toHaveTextContent('2 people affected');
    expect(group).toHaveTextContent('Ryan, Nisar');
    expect(screen.getAllByTestId('research-this')).toHaveLength(1);
    expect(screen.queryAllByTestId('decision-card')).toHaveLength(0);
  });

  it('RESEARCH: after APPROVE + USE the people leave the lane, but the outcome stays on screen (success never hides the result)', async () => {
    const base = { lane: 'work_queue', priority: 50, blocked: false, target: null, explain: null, humanAction: null, humanActionAt: null, createdAt: '2026-09-26T00:00:00Z', suppression: { class: 'clear', hits: [] }, action: 'research_required', ruleId: 'no_hypothesis', hypothesis: null };
    const account = { name: 'General Mills', hubspotCompanyId: '1', tam: 'in', tamTier: 'B', heatTier: 4 };
    const person = (id: number, name: string) => ({ id, personaKey: null, displayName: name, email: `${name}@gm.com`, hubspotContactId: null });
    const narrative = { observation: 'GM 10-Q: "A new DC in Iowa" [S:s1].', problemHypothesis: 'My guess is.', rootCauses: [], impacts: [], wouldProveWrong: ['Q?'], whatANoMeans: null, evidence: [{ signalId: 's1', title: 'GM 10-Q', excerpt: 'A new DC in Iowa.', observedAt: '2026-09-18T00:00:00Z' }] };
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ asOf: '2026-09-26T12:00:00.000Z', nextCursor: null, items: [{ ...base, id: 'r1', account, persona: person(7, 'Ryan') }, { ...base, id: 'r2', account, persona: person(8, 'Nisar') }] }))
      .mockResolvedValueOnce(jsonResponse({ runId: 'rr-1', outcome: 'evidence_found', facts: [{ signalId: 's1', excerpt: 'A new DC in Iowa.', url: 'https://x.example', title: 'GM 10-Q', publishedAt: '2026-09-18T00:00:00Z', fresh: true }], rejected: [], conflicts: [] }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, hypothesisId: 'h1', hypothesisIds: ['h1', 'h2'], existing: false, narrative }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, results: [{ ok: true, to: 'active', detail: 'in use' }, { ok: true, to: 'active', detail: 'in use' }], routing: { ok: true, runId: 'run-9', counts: { ready: 2 }, failures: [] } }))
      // The lane reloads after routing: both people are READY now, so RESEARCH is empty.
      .mockResolvedValueOnce(jsonResponse({ asOf: '2026-09-26T13:00:00.000Z', nextCursor: null, items: [] }));
    const { rerender } = render(<WorkQueue sellerLane="research" reloadKey="a" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Research this' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Approve + use for 2' }));
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    rerender(<WorkQueue sellerLane="research" reloadKey="b" />);
    await screen.findByText('Nothing in this lane right now.');
    expect(screen.queryByTestId('research-group')).toBeNull();
    expect(screen.getByTestId('research-outcome')).toHaveTextContent('2 ready to contact');
  });

  it('a RESEARCH card behind a full page of higher-priority READY cards still shows: the lane reads every page (debt burn, 2026-09-26)', async () => {
    const base = { lane: 'work_queue', blocked: false, target: null, explain: null, humanAction: null, humanActionAt: null, createdAt: '2026-09-26T00:00:00Z', suppression: { class: 'clear', hits: [] } };
    const account = { name: 'Acme', hubspotCompanyId: '1', tam: 'in', tamTier: 'A', heatTier: 4 };
    const person = (id: number) => ({ id, personaKey: null, displayName: `P${id}`, email: `p${id}@acme.com`, hubspotContactId: null, title: 'VP' });
    const ready = Array.from({ length: 100 }, (_, i) => ({ ...base, id: `d${i}`, priority: 90, action: 'enroll_gap_sequence', ruleId: 'enroll', account, persona: person(i), hypothesis: { id: 'h', status: 'active', family: 'x', confidence: 1 } }));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ asOf: '2026-09-26T12:00:00.000Z', items: ready, nextCursor: 'c1' }))
      .mockResolvedValueOnce(jsonResponse({ asOf: '2026-09-26T12:00:00.000Z', items: [{ ...base, id: 'r1', priority: 5, action: 'research_required', ruleId: 'bounced_or_invalid', account, persona: person(500), hypothesis: null }], nextCursor: null }));
    render(<WorkQueue sellerLane="research" />);
    await screen.findByTestId('decision-card');
    expect(String(fetchMock.mock.calls[1][0])).toBe('/api/gap/queue?limit=100&cursor=c1');
    expect(screen.queryByText('Nothing in this lane right now.')).toBeNull();
  });

  it('refetches the queue when reloadKey changes (a completed routing run), with no page reload', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ asOf: '2026-09-26T12:00:00.000Z', items: [], nextCursor: null }));
    const { rerender } = render(<WorkQueue reloadKey="run-1" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender(<WorkQueue reloadKey="run-2" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
