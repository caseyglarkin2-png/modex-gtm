/**
 * UX-10 ACCOUNTS index: every account one line; the search narrows as you type (token order free); Enter opens the
 * first match; Tier 1 first.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
import { AccountsIndex, INDEX_PAGE } from '@/components/gap/accounts-index';
import { filterAccounts, orderAccounts, toIndexRow, type AccountIndexRow } from '@/lib/gap/accounts/index-list';

const rows: AccountIndexRow[] = orderAccounts([
  toIndexRow({ name: 'Tyson Foods', tier: 'Tier 2', vertical: 'food_manufacturing', priority_band: 'B' }, 6, null),
  toIndexRow({ name: 'General Mills', tier: 'Tier 1', vertical: 'cpg', priority_band: 'B' }, 4, '2026-08-07T14:00:00Z'),
  toIndexRow({ name: 'PepsiCo', tier: 'Tier 1', vertical: 'cpg', priority_band: 'A' }, 19, '2026-06-10T14:00:00Z'),
  toIndexRow({ name: 'Kroger', tier: null, vertical: 'retail', priority_band: 'C' }, 10, null),
]);

beforeEach(() => push.mockReset());

describe('the index order and search', () => {
  it('orders Tier 1 first, then band, then name; an unknown tier last', () => {
    expect(rows.map((r) => r.name)).toEqual(['PepsiCo', 'General Mills', 'Tyson Foods', 'Kroger']);
    expect(rows[0].href).toBe('/gap/accounts/pepsico');
  });
  it('finds by any tokens in any order, by name or vertical, keeping the order', () => {
    expect(filterAccounts(rows, 'gen mills').map((r) => r.name)).toEqual(['General Mills']);
    expect(filterAccounts(rows, 'CPG').map((r) => r.name)).toEqual(['PepsiCo', 'General Mills']);
    expect(filterAccounts(rows, '').map((r) => r.name)).toHaveLength(4);
    expect(filterAccounts(rows, 'zzz')).toEqual([]);
  });
});

describe('<AccountsIndex>', () => {
  it('focuses the search, narrows as you type with a live count, and Enter opens the first match', () => {
    render(<AccountsIndex rows={rows} />);
    expect(document.activeElement).toBe(screen.getByTestId('accounts-search'));
    expect(screen.getByTestId('accounts-count')).toHaveTextContent('4 accounts');
    expect(screen.getByTestId('accounts-count')).not.toHaveTextContent('type to find one');
    expect(screen.getAllByTestId('accounts-row')[0]).toHaveTextContent('PepsiCo');
    expect(screen.getAllByTestId('accounts-row')[0]).toHaveTextContent('Tier 1 · cpg · 19 people on record · last first touch Jun 10');
    fireEvent.change(screen.getByTestId('accounts-search'), { target: { value: 'kro' } });
    expect(screen.getByTestId('accounts-count')).toHaveTextContent('1 of 4');
    expect(screen.getAllByTestId('accounts-row')).toHaveLength(1);
    expect(screen.getByTestId('accounts-row')).toHaveTextContent('no GAP touch yet');
    fireEvent.submit(screen.getByTestId('accounts-search').closest('form')!);
    expect(push).toHaveBeenCalledWith('/gap/accounts/kroger');
  });
  it('a long index shows its first page and says to type; a query shows every match', () => {
    const many = orderAccounts(Array.from({ length: 150 }, (_, k) => toIndexRow({ name: `Account ${String(k).padStart(3, '0')}`, tier: 'Tier 3', vertical: 'retail', priority_band: 'C' }, 1, null)));
    render(<AccountsIndex rows={many} />);
    expect(screen.getAllByTestId('accounts-row')).toHaveLength(INDEX_PAGE);
    expect(screen.getByTestId('accounts-count')).toHaveTextContent(`150 accounts, the first ${INDEX_PAGE} shown: type to find one`);
    fireEvent.change(screen.getByTestId('accounts-search'), { target: { value: 'account 1' } });
    expect(screen.getAllByTestId('accounts-row').length).toBeGreaterThan(INDEX_PAGE);
  });
  it('says so when nothing matches and opens nothing on Enter; an empty box opens nothing either', () => {
    const { unmount } = render(<AccountsIndex rows={rows} initialQuery="zzz" />);
    expect(screen.getByTestId('accounts-empty')).toBeInTheDocument();
    fireEvent.submit(screen.getByTestId('accounts-search').closest('form')!);
    expect(push).not.toHaveBeenCalled();
    unmount();
    render(<AccountsIndex rows={rows} />);
    fireEvent.submit(screen.getByTestId('accounts-search').closest('form')!);
    expect(push).not.toHaveBeenCalled();
  });
});
