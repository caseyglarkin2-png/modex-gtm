/**
 * I04 (GAP OS prospecting first, 2026-10-08): the intelligence panel on Work. Pinned: the three acceptance examples
 * render with their truth label, the account or "no account yet", the source line, the prepared angle when one
 * exists; every decision button posts the item key and the decision to /api/gap/decide and shows the line GAP
 * answers; Explore opens the source and posts nothing.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntelPanel } from '@/components/gap/intel-panel';
import type { Intelligence, IntelItem } from '@/lib/gap/work/intel';
import { DECISIONS } from '@/lib/gap/work/intel';
import type { PreparedAngle } from '@/lib/gap/agents/develop-angle';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const item = (over: Partial<IntelItem> & { kind: IntelItem['kind']; id: string; title: string }): IntelItem => ({ key: `${over.kind}:${over.id}`, source: 'news.example', url: 'https://news.example/x', publishedAt: '2026-06-24T12:00:00.000Z', observedAt: '2026-09-28T12:00:00.000Z', truth: 'historical_observation', line: 'news.example, published Jun 24, 2026. Historical observation.', accountName: null, accountHint: null, relevance: null, categories: [], person: null, decisions: DECISIONS, rank: 0, ...over });

const intel: Intelligence = {
  signals: [item({ kind: 'signal', id: 's-old', title: 'Kenco opens new innovation lab for warehouse automation testing', accountName: 'Kenco' })],
  triggers: [item({ kind: 'trigger', id: '7', title: 'Tractor Supply opens Idaho distribution center with automation', accountHint: 'Tractor Supply Company', truth: 'unverified_status', line: 'chainstoreage.com, published Oct 7, 2026. Unverified present-day status. Tractor Supply Company is not a GAP account yet.' })],
  people: [item({ kind: 'person', id: 'dave@kencogroup.com', title: 'Dave Kiesling, VP Operations at Kenco', accountName: 'Kenco', url: null, source: 'the mailbox', line: 'Wrote to us Sep 16, 2026 (2 messages); no open deal. Previously contacted, a response, no live opportunity.', person: { email: 'dave@kencogroup.com', name: 'Dave Kiesling', title: 'VP Operations', lastWroteAt: '2026-09-16T12:00:00.000Z', messages: 2 } })],
  pursued: [{ key: 'trigger:9', taskId: 'at_test', writer: null, kind: 'trigger', title: 'Daimler bets on the autonomous truck system', accountName: null, accountHint: 'Daimler Truck North America', url: 'https://fw/x', placedVia: null, placementChanged: false, placementLine: null, dealLine: null, decision: 'pursue', decidedAt: '2026-10-08T15:00:00.000Z', status: 'ready', error: null, angle: { whyItMatters: 'My guess is an autonomous program changes who runs the yards at the terminals.', starters: ['Who runs the yards at your terminals today?', 'Where does a trailer wait?'], roles: ['VP Operations'], accounts: ['Daimler Truck North America'], peopleNamed: [], proposedAction: 'research', caveat: null, sourceLine: 'FreightWaves, published Oct 1, 2026 (a recent report)' } }],
  totals: { signals: 14, triggers: 3, people: 9 },
};
const angle: PreparedAngle = { taskId: 'at_1', key: 'signal:s-old', title: 'Kenco opens new innovation lab', accountName: 'Kenco', accountHint: null, sourceLine: 'freightwaves.com, published Jun 24, 2026 (a historical observation)', whyItMatters: 'My guess is the lab means the warehouses are being standardized while the yards outside still run on radio.', accounts: ['Kenco'], roles: ['VP Operations'], people: [1], starters: ['How does the gate know where a trailer should go?', 'Who owns dwell across your yards?'], proposedAction: 'email', caveat: null, peopleNamed: [{ personaId: 1, name: 'Dave Kiesling', title: 'VP Operations' }], preparedAt: '2026-10-08T16:00:00.000Z' };

afterEach(() => vi.restoreAllMocks());

describe('I04: <IntelPanel>', () => {
  it('renders the three examples with their truth, account or no-account, line and the prepared angle; the totals say the depth', () => {
    render(<IntelPanel intel={intel} angles={{ 'signal:s-old': angle }} />);
    const items = screen.getAllByTestId('intel-item');
    expect(items.map((li) => li.getAttribute('data-key'))).toEqual(['signal:s-old', 'trigger:7', 'person:dave@kencogroup.com']);
    expect(within(items[0]).getByTestId('intel-truth').textContent).toBe('Historical observation');
    expect(within(items[0]).getByTestId('intel-angle').textContent).toContain('the yards outside still run on radio');
    expect(within(items[0]).getByTestId('intel-angle').textContent).toContain('Who: Dave Kiesling (VP Operations).');
    expect(within(items[1]).getByTestId('intel-no-account').textContent).toBe('Tractor Supply Company (no account yet)');
    expect(within(items[1]).getByTestId('intel-truth').textContent).toBe('Unverified present-day status');
    expect(within(items[2]).getByTestId('intel-line').textContent).toContain('Previously contacted, a response, no live opportunity.');
    expect(screen.getByTestId('intel-worth').textContent).toContain('(2 of 17)');
    expect(screen.getByTestId('intel-people').textContent).toContain('(1 of 9)');
  });

  it('the pursued section shows the angle with the way on; without an account it points at Signals', () => {
    render(<IntelPanel intel={intel} angles={{}} />);
    const p = screen.getByTestId('intel-pursued');
    expect(p).toHaveAttribute('data-status', 'ready');
    expect(within(p).getByTestId('intel-pursued-angle').textContent).toContain('who runs the yards at the terminals');
    expect(within(p).getByRole('link', { name: 'Name the account on Signals' })).toHaveAttribute('href', '/gap/signals');
    expect(within(p).getByTestId('intel-pursued-done')).toBeTruthy();
  });

  it('seller acceptance (2026-10-09): a pursued person placed at read time shows the account link, the open deal and the placement line; nothing is auto-queued', () => {
    const placed: Intelligence = { ...intel, pursued: [{ key: 'person:dave.kiesling@kencogroup.com', taskId: 'at_kenco', writer: { email: 'dave.kiesling@kencogroup.com', name: 'Dave Kiesling' }, kind: 'person', title: 'Dave Kiesling wrote to us', accountName: 'Kenco', accountHint: null, url: null, placedVia: 'domain', placementChanged: true, placementLine: 'Placed at Kenco by its verified domain after the identity fix; the angle was developed before placement, so Pursue again to develop it as deal work', dealLine: 'In an open deal: YardFlow - Kenco', decision: 'pursue', decidedAt: '2026-10-09T00:32:00.000Z', status: 'ready', error: null, angle: { whyItMatters: 'My guess is the warehouses are standardized while the yards outside are not.', starters: ['Who owns dwell across your yards?'], roles: [], accounts: ['Kenco'], peopleNamed: [], proposedAction: 'email', caveat: null, sourceLine: 'the mailbox' } }] };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<IntelPanel intel={placed} angles={{}} />);
    const p = screen.getByTestId('intel-pursued');
    expect(within(p).queryByTestId('intel-pursued-no-account')).toBeNull();
    expect(within(p).getByRole('link', { name: /Open Kenco/ })).toHaveAttribute('href', '/gap/accounts/kenco');
    expect(within(p).getByTestId('intel-pursued-deal').textContent).toBe('In an open deal: YardFlow - Kenco');
    expect(within(p).getByTestId('intel-pursued-placement').textContent).toBe('Placed at Kenco by its verified domain after the identity fix; the angle was developed before placement, so Pursue again to develop it as deal work.');
    expect(fetchSpy, 'rendering a placed item posts nothing').not.toHaveBeenCalled();
  });

  it('C5 (2026-10-09): an ambiguous placement is said with its names on the pursued item and on a people item, never "No account yet"', () => {
    const line = 'kencogroup.com is claimed by Kenco and Kenco Logistics Services (an open duplicate since May 5): choose the account';
    const ambiguous: Intelligence = { ...intel, people: [{ ...intel.people[0], accountName: null, accountHint: 'kencogroup.com', ambiguousAmong: ['Kenco', 'Kenco Logistics Services'], ambiguityLine: line }], pursued: [{ ...intel.pursued[0], key: 'person:dave.kiesling@kencogroup.com', kind: 'person', accountName: null, accountHint: 'kencogroup.com', ambiguousAmong: ['Kenco', 'Kenco Logistics Services'], ambiguityLine: line }] };
    render(<IntelPanel intel={ambiguous} angles={{}} />);
    expect(screen.getByTestId('intel-pursued-ambiguous').textContent).toBe(line);
    expect(screen.queryByTestId('intel-pursued-no-account')).toBeNull();
    const person = screen.getAllByTestId('intel-item').find((li) => li.getAttribute('data-kind') === 'person')!;
    expect(within(person).getByTestId('intel-ambiguous').textContent).toBe(line);
    expect(within(person).queryByTestId('intel-no-account')).toBeNull();
    expect(screen.getByTestId('intel-panel').textContent).not.toContain('No account yet');
  });

  it('a decision posts the key and the decision and shows the line GAP answers; Explore opens the source and records the look', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, line: 'Pursuing the signal. GAP is developing the angle.' }), { status: 200 }));
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<IntelPanel intel={intel} angles={{}} />);
    const first = screen.getAllByTestId('intel-item')[0];
    fireEvent.click(within(first).getByTestId('intel-decide-pursue'));
    await screen.findByTestId('intel-decided');
    expect(fetchSpy).toHaveBeenCalledWith('/api/gap/decide', expect.objectContaining({ method: 'POST', body: JSON.stringify({ key: 'signal:s-old', decision: 'pursue' }) }));
    expect(within(first).getByTestId('intel-decided').textContent).toBe('Pursuing the signal. GAP is developing the angle.');
    fireEvent.click(within(first).getByTestId('intel-decide-explore'));
    expect(open).toHaveBeenCalledWith('https://news.example/x', '_blank', 'noopener');
    // I05: explore opens the source AND records the look.
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenLastCalledWith('/api/gap/decide', expect.objectContaining({ body: JSON.stringify({ key: 'signal:s-old', decision: 'explore' }) }));
  });
});
