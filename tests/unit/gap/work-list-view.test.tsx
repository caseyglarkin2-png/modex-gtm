/**
 * UX-08 WORK surface render: chips with counts that filter, a search, one card per account with account, state, why,
 * person, next action, blocker and Open (carrying the Work order), the URL holding the filter and the search.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
let search = '';
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }), useSearchParams: () => new URLSearchParams(search) }));
import { WorkList } from '@/components/gap/work-list';
import type { WorkCard } from '@/lib/gap/work/list';

const card = (index: number, accountName: string, lane: WorkCard['lane'], stateKind: WorkCard['stateKind'], over: Partial<WorkCard> = {}): WorkCard => ({
  accountName, index, lane, stateKind, state: stateKind === 'replied' ? 'Someone replied' : stateKind === 'ready' ? 'Ready for a first touch' : 'In a deal', why: `${accountName}: why now.`, person: null, next: { label: 'Do it', href: `/gap?lane=${lane}` }, blocker: null, href: `/gap/accounts/${accountName.toLowerCase()}?from=work&i=${index}`, ...over,
});
const cards = [
  card(0, 'NFI', 'replies', 'replied', { person: { name: 'ops@nfi.com', title: null }, blocker: 'No cold email to anyone here until it is recorded.' }),
  card(1, 'PepsiCo', 'ready', 'ready', { person: { name: 'Karen Darling', title: 'Senior Director' } }),
  card(2, 'Kroger', 'deals', 'in_deal', { next: null, blocker: 'No cold first touch while the deal is open.' }),
];

beforeEach(() => {
  replace.mockReset();
  search = '';
});

describe('<WorkList>', () => {
  it('renders one card per account with every answer, in order, and Open carries the Work order', () => {
    render(<WorkList cards={cards} />);
    const rows = screen.getAllByTestId('work-card');
    expect(rows.map((r) => r.getAttribute('data-account'))).toEqual(['NFI', 'PepsiCo', 'Kroger']);
    expect(rows[0]).toHaveTextContent('Someone replied');
    expect(rows[0]).toHaveTextContent('NFI: why now.');
    expect(rows[0]).toHaveTextContent('No cold email to anyone here until it is recorded.');
    expect(rows[1].querySelector('[data-testid="work-card-person"]')).toHaveTextContent('Karen Darling, Senior Director');
    expect(rows[1].querySelector('[data-testid="work-card-next"]')).toHaveAttribute('href', '/gap?lane=ready');
    expect(rows[1].querySelector('[data-testid="work-card-open"]')).toHaveAttribute('href', '/gap/accounts/pepsico?from=work&i=1');
    expect(screen.getByTestId('work-filter-deals')).toHaveTextContent('Held or in a deal 1');
    expect(rows[2].querySelector('[data-testid="work-card-next"]')).toBeNull();
    expect(screen.getByTestId('work-filter-all')).toHaveTextContent('All 3');
    expect(screen.getByTestId('work-filter-replies')).toHaveTextContent('Replied 1');
  });
  it('the shown list is the Work order: after a chip the hrefs count from zero and the saved order is what the seller sees', () => {
    window.sessionStorage.clear();
    render(<WorkList cards={cards} />);
    fireEvent.click(screen.getByTestId('work-filter-ready'));
    expect(screen.getByTestId('work-card-open')).toHaveAttribute('href', '/gap/accounts/pepsico?from=work&i=0');
    const saved = JSON.parse(window.sessionStorage.getItem('gap.work.order') ?? '{}') as { accounts: Array<{ name: string }>; filter: string };
    expect(saved.accounts.map((a) => a.name)).toEqual(['PepsiCo']);
    expect(saved.filter).toBe('ready');
  });
  it('a chip filters to its own count and writes the URL; the search narrows by name; both restore from the URL', () => {
    render(<WorkList cards={cards} />);
    fireEvent.click(screen.getByTestId('work-filter-ready'));
    expect(screen.getAllByTestId('work-card').map((r) => r.getAttribute('data-account'))).toEqual(['PepsiCo']);
    expect(screen.getByTestId('work-filter-ready')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('work-card')).toHaveAttribute('data-slug', 'pepsico');
    expect(replace).toHaveBeenLastCalledWith('/gap?filter=ready', { scroll: false });
    fireEvent.change(screen.getByTestId('work-search'), { target: { value: 'kro' } });
    expect(screen.getByTestId('work-empty')).toHaveTextContent('No account matches this filter.');
    expect(replace).toHaveBeenLastCalledWith('/gap?filter=ready&q=kro', { scroll: false });
    fireEvent.click(screen.getByTestId('work-filter-all'));
    expect(screen.getAllByTestId('work-card').map((r) => r.getAttribute('data-account'))).toEqual(['Kroger']);
  });
  it('restores the filter and search from the URL on arrival', () => {
    search = 'filter=deals&q=kr';
    render(<WorkList cards={cards} />);
    expect(screen.getByTestId('work-filter-deals')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('work-search')).toHaveValue('kr');
    expect(screen.getAllByTestId('work-card')).toHaveLength(1);
  });
  it('says plainly when nothing needs the seller', () => {
    render(<WorkList cards={[]} />);
    expect(screen.getByTestId('work-empty')).toHaveTextContent('Nothing needs you right now.');
  });
});
