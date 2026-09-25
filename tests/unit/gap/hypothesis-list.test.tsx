import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HypothesisList } from '@/app/gap/hypotheses/hypothesis-list';
import type { HypothesisRow } from '@/components/gap/hypothesis-drawer';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function row(overrides: Partial<HypothesisRow> = {}): HypothesisRow {
  return {
    id: 'hyp_1',
    account_name: 'Acme Foods',
    problem_family: 'dwell',
    persona: 'vp_operations',
    status: 'draft',
    confidence: 55,
    observation: 'Acme opened a second DC in Reno [S:sig_1].',
    problem_hypothesis: 'Acme may be losing dock hours to congestion.',
    updated_at: '2026-09-11T00:00:00.000Z',
    ...overrides,
  };
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('<HypothesisList> fast review', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) => {
      const id = String(url).split('/').pop();
      return jsonResponse(row({ id }));
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const items = [
    row({ id: 'hyp_1', account_name: 'PepsiCo', status: 'draft' }),
    row({ id: 'hyp_2', account_name: 'PepsiCo', status: 'draft' }),
    row({ id: 'hyp_3', account_name: 'UNFI', status: 'active' }),
  ];

  it('shows a grouping cue when multiple hypotheses share an account, and none for a lone one', () => {
    render(<HypothesisList items={items} />);
    const pepsiRows = screen.getAllByText('PepsiCo');
    expect(within(pepsiRows[0].closest('tr')!).getByText('2x this account')).toBeInTheDocument();
    const unfiRow = screen.getByText('UNFI').closest('tr')!;
    expect(within(unfiRow).queryByText(/x this account/)).toBeNull();
  });

  it('"Review next" opens the first item still needing a decision (draft/review_required), not just the first row', async () => {
    render(<HypothesisList items={[row({ id: 'hyp_1', status: 'active' }), row({ id: 'hyp_2', status: 'draft' })]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Review next' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/gap/hypotheses/hyp_2', expect.anything()));
  });

  it('Next in the drawer advances to the next row and disables at the last item', async () => {
    render(<HypothesisList items={items} />);
    fireEvent.click(screen.getAllByText('PepsiCo')[0].closest('tr')!);
    await waitFor(() => expect(screen.getByTestId('hypothesis-review-nav')).toBeInTheDocument());

    const nav = screen.getByTestId('hypothesis-review-nav');
    expect(within(nav).getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(within(nav).getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/gap/hypotheses/hyp_2', expect.anything()));

    fireEvent.click(within(screen.getByTestId('hypothesis-review-nav')).getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/gap/hypotheses/hyp_3', expect.anything()));
    expect(within(screen.getByTestId('hypothesis-review-nav')).getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
