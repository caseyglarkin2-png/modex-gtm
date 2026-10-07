/**
 * Sprint 5 review, SHOULD 3 (R55), the seller's view: a reopened deal's next step shows what its closure skipped,
 * with the due dates, and Restore puts one back (one POST op restore); a restored one reads "Restored". The brief and
 * Work carry the same list from the step's own record.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SkippedAtClosure } from '@/components/gap/obligation-actions';
import { buildOpportunities } from '@/lib/gap/deals/opportunities';
import { withPhases } from '@/lib/gap/work/commitments';
import { workDay } from '@/lib/gap/work/list';
import type { Commitment } from '@/lib/gap/work/commitment-model';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());

const NOW = new Date('2026-10-08T14:00:00Z');
const ACCOUNT = 'Kroger Scratch Co';
const items = [
  { commitmentId: 'capture:volumes', title: 'Ben sends the gate volumes', kind: 'buyer_promise' as const, dueAt: '2026-10-09T13:00:00.000Z', person: null },
  { commitmentId: 'capture:detention', title: 'Send Ben the Columbus detention numbers', kind: 'deliverable' as const, dueAt: '2026-10-10T13:00:00.000Z', person: 'Ben Scratch' },
];
const base = { accountName: ACCOUNT, basis: null, owner: 'casey@freightroll.com', person: null, threadId: null, snoozeUntil: null, dependency: null, proof: null, reason: null, createdAt: NOW.toISOString(), createdBy: 'gap:deals', updatedAt: NOW.toISOString(), updatedBy: 'gap:deals' };
const step: Commitment = { ...base, commitmentId: 'deal:reopen:392057002:2026-10-08', kind: 'deal_step', title: 'Reopened: decide the next step on "Kroger Scratch Co Columbus DC"', dueAt: NOW.toISOString(), dealId: '392057002', status: 'open', source: { kind: 'deal', id: 'reopen:392057002:2026-10-08' }, detail: { skippedAtClosure: items } };
const restoredVolumes: Commitment = { ...base, commitmentId: 'deal:restore:capture:volumes', kind: 'buyer_promise', title: 'Ben sends the gate volumes', dueAt: items[0].dueAt, dealId: '392057002', status: 'waiting', dependency: 'their delivery', source: { kind: 'deal', id: 'restore:capture:volumes' }, detail: { restoredFrom: 'capture:volumes' } };

describe('Sprint 5 review: a reopened deal shows what its closure skipped, each restorable', () => {
  it('each skipped obligation shows with its due date; Restore posts op restore once and says it was restored', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true, created: true }), { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    render(<SkippedAtClosure items={items.map((s) => ({ ...s, restored: false }))} />);
    const rows = screen.getAllByTestId('skipped-at-closure-item');
    expect(rows.map((r) => r.textContent)).toEqual(['Ben sends the gate volumes, due Fri, Oct 9Restore', 'Send Ben the Columbus detention numbers, due Sat, Oct 10Restore']);
    fireEvent.click(within(rows[1]).getByTestId('restore-obligation'));
    await waitFor(() => expect(within(rows[1]).getByTestId('restore-status')).toHaveTextContent('Restored.'));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body)).toEqual({ op: 'restore', commitmentId: 'capture:detention' });
  });

  it('a refused restore says why in words', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'deal_closed' }), { status: 409 })));
    render(<SkippedAtClosure items={[{ ...items[1], restored: false }]} />);
    fireEvent.click(screen.getByTestId('restore-obligation'));
    await waitFor(() => expect(screen.getByTestId('restore-status')).toHaveTextContent('Not restored: the deal is closed again.'));
  });

  it('the brief and Work both carry the list from the step record, with what was already restored', () => {
    const view = buildOpportunities({ accountName: ACCOUNT, deals: [{ id: '392057002', name: 'Kroger Scratch Co Columbus DC', stage: 'Qualified to buy', nextStep: null, contactIds: [] }], people: [], commitments: withPhases([step, restoredVolumes], NOW), bids: [], captureHref: () => '/gap/capture' });
    const onDeal = view.deals[0].commitments.find((c) => c.commitmentId === step.commitmentId)!;
    expect(onDeal.skippedAtClosure?.map((s) => [s.title, s.restored])).toEqual([['Ben sends the gate volumes', true], ['Send Ben the Columbus detention numbers', false]]);
    const day = workDay({ now: NOW, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [{ accountName: ACCOUNT, deals: [{ id: '392057002', name: 'Kroger Scratch Co Columbus DC', stage: 'Qualified to buy' }] }] }, commitments: [step, restoredVolumes] });
    const o = day.cards.find((c) => c.accountName === ACCOUNT)?.obligations?.find((x) => x.commitmentId === step.commitmentId);
    expect(o?.skippedAtClosure?.map((s) => s.restored)).toEqual([true, false]);
  });
});
