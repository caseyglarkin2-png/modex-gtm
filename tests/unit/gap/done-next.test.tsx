/**
 * UX-09 DONE, NEXT: the bar walks the Work order frozen when Work was opened; Back and Next are plain links; Back to
 * Work restores the filter, the search and the card; a deep link or a stale order still offers Back to Work and
 * never a wrong Next; the bar records nothing.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
import { DoneNext } from '@/components/gap/done-next';
import { doneNextLinks, readWorkOrder, saveWorkOrder, WORK_ORDER_KEY, type WorkOrder } from '@/lib/gap/work/order';

const order: WorkOrder = { at: '2026-10-06T15:00:00Z', filter: 'ready', q: 'pe', accounts: [{ name: 'NFI Industries', slug: 'nfi-industries' }, { name: 'PepsiCo', slug: 'pepsico' }, { name: 'Kroger', slug: 'kroger' }] };

beforeEach(() => {
  window.sessionStorage.clear();
  push.mockReset();
  vi.restoreAllMocks();
});

describe('doneNextLinks', () => {
  it('names the position and links the previous and next accounts in the frozen order; Back to Work restores the filter, the search and the card', () => {
    const l = doneNextLinks(order, 1, 'pepsico');
    expect(l.position).toEqual({ n: 2, of: 3 });
    expect(l.back).toEqual({ name: 'NFI Industries', href: '/gap/accounts/nfi-industries?from=work&i=0' });
    expect(l.next).toEqual({ name: 'Kroger', href: '/gap/accounts/kroger?from=work&i=2' });
    expect(l.backToWork).toBe('/gap?filter=ready&q=pe&focus=pepsico');
  });
  it('the first has no Back, the last has no Next; a mismatch (the order moved, or a deep link) offers Back to Work only', () => {
    expect(doneNextLinks(order, 0, 'nfi-industries').back).toBeNull();
    expect(doneNextLinks(order, 2, 'kroger').next).toBeNull();
    const stale = doneNextLinks(order, 1, 'walmart-inc');
    expect(stale).toEqual({ position: null, back: null, next: null, backToWork: '/gap?filter=ready&q=pe' });
    // The list moved under the seller: the account itself is the key, the index only a hint.
    expect(doneNextLinks(order, 0, 'pepsico').position).toEqual({ n: 2, of: 3 });
    expect(doneNextLinks(null, 1, 'pepsico')).toEqual({ position: null, back: null, next: null, backToWork: '/gap' });
    expect(doneNextLinks({ ...order, filter: 'all', q: '' }, 1, 'pepsico').backToWork).toBe('/gap?focus=pepsico');
  });
  it('the order survives a round trip through session storage and a broken value reads as none', () => {
    saveWorkOrder(order);
    expect(readWorkOrder()).toEqual(order);
    window.sessionStorage.setItem(WORK_ORDER_KEY, '{not json');
    expect(readWorkOrder()).toBeNull();
    window.sessionStorage.setItem(WORK_ORDER_KEY, JSON.stringify({ accounts: [{ name: 'H-E-B' }] }));
    expect(readWorkOrder()?.accounts).toEqual([{ name: 'H-E-B', slug: 'h-e-b' }]);
  });
});

describe('<DoneNext>', () => {
  it('reads the order after mount and renders Back, Back to Work and Next account as links with the names for assistive tech', async () => {
    saveWorkOrder(order);
    render(<DoneNext slug="pepsico" index={1} />);
    await waitFor(() => expect(screen.getByTestId('done-next')).toHaveAttribute('data-position', '2/3'));
    expect(screen.getByTestId('done-next-position')).toHaveTextContent('Account 2 of 3 in Work.');
    expect(screen.getByTestId('done-next-back')).toHaveAttribute('href', '/gap/accounts/nfi-industries?from=work&i=0');
    expect(screen.getByTestId('done-next-back')).toHaveAttribute('aria-label', 'Back to NFI Industries');
    expect(screen.getByTestId('done-next-next')).toHaveAttribute('href', '/gap/accounts/kroger?from=work&i=2');
    expect(screen.getByTestId('done-next-next')).toHaveAttribute('aria-label', 'Next account: Kroger');
    expect(screen.getByTestId('done-next-work')).toHaveAttribute('href', '/gap?filter=ready&q=pe&focus=pepsico');
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('on the last account Back to Work is the primary and says so; without an order only Back to Work shows', async () => {
    saveWorkOrder(order);
    const { unmount } = render(<DoneNext slug="kroger" index={2} />);
    await waitFor(() => expect(screen.getByTestId('done-next-position')).toHaveTextContent('Account 3 of 3 in Work. The last one.'));
    expect(screen.queryByTestId('done-next-next')).toBeNull();
    unmount();
    window.sessionStorage.clear();
    render(<DoneNext slug="kroger" index={2} />);
    await waitFor(() => expect(screen.getByTestId('done-next')).toHaveAttribute('data-position', 'none'));
    expect(screen.getByTestId('done-next-position')).toHaveTextContent('Opened from Work.');
    expect(screen.queryByTestId('done-next-next')).toBeNull();
    expect(screen.queryByTestId('done-next-back')).toBeNull();
    expect(screen.getByTestId('done-next-work')).toHaveAttribute('href', '/gap');
  });
});

describe('<DoneNext> records an outcome, never a navigation (R14)', () => {
  it('without the account name the bar is links only (nothing to record); with it the three outcome controls show and the plain links still post nothing', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    saveWorkOrder(order);
    render(<DoneNext slug="pepsico" index={1} accountName="PepsiCo" />);
    await waitFor(() => expect(screen.getByTestId('done-next')).toHaveAttribute('data-position', '2/3'));
    expect(screen.getByTestId('done-next-skip')).toBeInTheDocument();
    expect(screen.getByTestId('done-next-snooze')).toBeInTheDocument();
    expect(screen.getByTestId('done-next-logged')).toBeInTheDocument();
    // Next account is a link: following it records nothing and posts nothing.
    expect(screen.getByTestId('done-next-next').tagName).toBe('A');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
  it('Skip today posts the outcome and only then moves to the next account; a refusal says so and stays', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, line: 'Skipped for today, you, today.' }) } as Response);
    saveWorkOrder(order);
    render(<DoneNext slug="pepsico" index={1} accountName="PepsiCo" />);
    await waitFor(() => expect(screen.getByTestId('done-next')).toHaveAttribute('data-position', '2/3'));
    fireEvent.click(screen.getByTestId('done-next-skip'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gap/accounts/outcome');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ accountName: 'PepsiCo', kind: 'skipped' });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/gap/accounts/kroger?from=work&i=2'));
    expect(screen.getByTestId('done-next-status').textContent).toMatch(/Skipped for today.*Moving to the next account/);
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'account_not_found' }) } as Response);
    fireEvent.click(screen.getByTestId('done-next-skip'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Could not record it \(account_not_found\)/));
    expect(push).toHaveBeenCalledTimes(1);
  });
  it('Snooze asks for the date and posts it; Logged outside GAP posts the note; on the last account both return to Work', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, line: 'Snoozed until Oct 13, you, today.' }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, line: 'Logged outside GAP (called Joey), you, today.' }) } as Response);
    saveWorkOrder(order);
    render(<DoneNext slug="kroger" index={2} accountName="Kroger" />);
    await waitFor(() => expect(screen.getByTestId('done-next-position')).toHaveTextContent('The last one.'));
    fireEvent.click(screen.getByTestId('done-next-snooze'));
    fireEvent.change(screen.getByTestId('done-next-snooze-until'), { target: { value: '2026-10-13' } });
    fireEvent.click(screen.getByTestId('done-next-snooze-confirm'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ accountName: 'Kroger', kind: 'snoozed', until: '2026-10-13T12:00:00.000Z' });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/gap?filter=ready&q=pe&focus=kroger'));
    fireEvent.click(screen.getByTestId('done-next-logged'));
    fireEvent.change(screen.getByTestId('done-next-logged-note'), { target: { value: 'called Joey' } });
    fireEvent.click(screen.getByTestId('done-next-logged-confirm'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]!.body))).toEqual({ accountName: 'Kroger', kind: 'logged', reason: 'called Joey' });
  });
});
