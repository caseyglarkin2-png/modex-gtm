/**
 * Sprint 5 review, SHOULD 2 (R50 / R55): a closed deal showed its raw HubSpot id ("Deal deal 392057002, not an open
 * deal here") and the brief dropped it with no outcome, date or history. Now its kept rows are named with the closed
 * deal and its outcome, and the brief keeps one history line per closed deal.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildOpportunities } from '@/lib/gap/deals/opportunities';
import { DealOpportunities } from '@/components/gap/deal-opportunities';
import { workDay } from '@/lib/gap/work/list';
import { loadRecordedClosures } from '@/lib/gap/deals/closure';

const now = '2026-10-07T15:00:00Z';
const view = () =>
  buildOpportunities({
    accountName: 'Kroger Scratch Co',
    deals: [{ id: '392057001', name: 'YardFlow - Kroger Scratch Co', stage: 'Appointment scheduled', nextStep: null, contactIds: ['c-ann'] }],
    people: [
      { personaId: 1, name: 'Ann Scratch', title: 'VP Supply Chain Operations', email: 'ann@kroger.example.com', hubspotContactId: 'c-ann' },
      { personaId: 2, name: 'Ben Scratch', title: 'Director, Columbus Distribution Center', email: 'ben@kroger.example.com', hubspotContactId: 'c-ben' },
    ],
    commitments: [],
    bids: [{ id: 'b1', type: 'metric', quote: 'We pay about forty thousand a month in detention at Columbus.', summary: null, contactEmail: 'ben@kroger.example.com', at: now, metadata: { scope: { dealId: '392057002' } } }],
    captureHref: () => '/gap/capture',
    closedDeals: [{ id: '392057002', name: 'Kroger Scratch Co Columbus DC', won: true, closedAt: '2026-10-07T12:00:00Z' }],
  });

describe('Sprint 5 review: a closed deal is named, with its outcome and history, never its id', () => {
  it('its kept words carry the closed deal\'s name and outcome, and the view keeps its history line', () => {
    const v = view();
    expect(v.elsewhere.needs.map((n) => n.scope.label)).toEqual(['Deal: Kroger Scratch Co Columbus DC (closed won, Oct 7, 2026)']);
    expect(v.closed).toEqual([{ dealId: '392057002', label: 'Kroger Scratch Co Columbus DC (closed won, Oct 7, 2026)' }]);
  });
  it('the brief says the closed deal once, by name, outcome and date; no deal id anywhere', () => {
    render(<DealOpportunities view={view()} />);
    expect(screen.getByTestId('deal-closed')).toHaveTextContent('Kroger Scratch Co Columbus DC (closed won, Oct 7, 2026): its words and work are kept below.');
    expect(screen.getByTestId('deal-elsewhere')).toHaveTextContent('Deal: Kroger Scratch Co Columbus DC (closed won, Oct 7, 2026): “We pay about forty thousand a month in detention at Columbus.” (Ben Scratch)');
    expect(document.body.textContent).not.toMatch(/392057002/);
  });
});

describe('Sprint 5 review: Work names a meeting on a closed deal from the closure record GAP keeps', () => {
  const NOW = new Date('2026-10-07T15:00:00Z');
  const walk = { accountName: 'Kroger Scratch Co', at: '2026-10-07T18:00:00.000Z', what: 'Columbus yard walk with Ben', meetingId: 12, dealId: '392057002' };
  const scopeOf = (closedDeals?: Map<string, { id: string; name: string | null; won: boolean | null; closedAt: string | null }>, read: 'complete' | 'unavailable' = 'complete') => {
    const d = workDay({ now: NOW, candidates: [], replies: [], motions: [], held: new Map(), inDeals: read === 'complete' ? { status: 'complete', accounts: [{ accountName: 'Kroger Scratch Co', deals: [{ id: '392057001', name: 'YardFlow - Kroger Scratch Co', stage: 'Appointment scheduled' }] }] } : { status: 'unavailable', accounts: [] }, meetings: [walk], closedDeals });
    return d.cards.find((c) => c.accountName === 'Kroger Scratch Co')?.obligations?.find((o) => o.kind === 'meeting')?.scope;
  };
  it('a recorded closure names the deal with its outcome and date', () => {
    expect(scopeOf(new Map([['392057002', { id: '392057002', name: 'Kroger Scratch Co Columbus DC', won: true, closedAt: '2026-10-07T12:00:00Z' }]]))).toBe('Deal: Kroger Scratch Co Columbus DC (closed won, Oct 7, 2026)');
  });
  it('no recorded closure: said in words; open deals not read: nothing claimed; never the id', () => {
    expect(scopeOf()).toBe('Deal: a deal that is no longer open in HubSpot');
    expect(scopeOf(undefined, 'unavailable')).toBe('Deal: a HubSpot deal (its state was not read this time)');
    expect(`${scopeOf()} ${scopeOf(undefined, 'unavailable')}`).not.toMatch(/\d{6,}/);
  });
  it('the closure record is the latest state of each deal: a reopened deal is not closed; one read for every account', async () => {
    const calls: unknown[] = [];
    const row = (dealId: string, state: string, at: number, extra: Record<string, unknown> = {}) => ({ payload: { dealId, state, dealName: `Deal ${at}`, ...extra } });
    const prisma = { gapAuditEvent: { findMany: async (q: unknown) => (calls.push(q), [row('1', 'open', 1), row('1', 'won', 2, { closedAt: '2026-10-02T12:00:00Z' }), row('2', 'lost', 3), row('2', 'open', 4), row('3', 'closed', 5)]) } };
    const m = await loadRecordedClosures(prisma, ['Kroger Scratch Co', 'Kroger Scratch Co', 'Walmart']);
    expect([...m.keys()]).toEqual(['1', '3']);
    expect(m.get('1')).toEqual({ id: '1', name: 'Deal 2', won: true, closedAt: '2026-10-02T12:00:00Z' });
    expect(m.get('3')?.won).toBeNull();
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(calls[0])).toContain('"in":["Kroger Scratch Co","Walmart"]');
    expect((await loadRecordedClosures(prisma, [])).size).toBe(0);
    expect(calls).toHaveLength(1);
  });
});
