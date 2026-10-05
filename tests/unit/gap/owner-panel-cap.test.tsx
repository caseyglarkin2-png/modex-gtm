/**
 * UX-03: the analyst owner panel no longer renders a wall. Top rows by default, "Show N more" for the rest, no
 * ordinals on a tie, each radio named by name and title and described by its reasons (keyboard and screen reader).
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { resolveOwner, type OwnerCandidateInput, type OwnerResolutionInput } from '@/lib/gap/people/owner-resolution';
import { OwnerResolutionPanel } from '@/components/gap/owner-resolution-panel';

const NOW = new Date('2026-10-05T15:00:00Z');
const hs = (id: string, name: string, title: string): OwnerCandidateInput => ({ key: `hubspot:${id}`, source: 'hubspot', hubspotContactId: id, name, title, hasEmail: true, location: 'Bentonville, Arkansas, United States' });
const input: OwnerResolutionInput = {
  account: { name: 'Walmart Inc.', entityType: 'retailer' },
  purpose: 'HYPOTHESIS_ACTIVATION',
  hypothesis: { id: 'h1', status: 'approved', primaryPersonaId: null, observation: 'Walmart Inc. plans to invest more than $300 million in a new fulfillment center.', problemHypothesis: 'My guess is that the network change moves load onto the handoffs that remain.', problemFamily: 'hidden_capacity' },
  candidates: Array.from({ length: 53 }, (_, k) => hs(String(100 + k), `Person ${k}`, k % 2 ? 'Regional Transportation Director' : 'Director, Transportation Maintenance')),
  hubspot: { read: true, count: 660, truncated: false, via: 'linked' },
  now: NOW,
};
const resolution = resolveOwner(input);

afterEach(() => vi.restoreAllMocks());

describe('the owner panel caps the list', () => {
  it('renders five rows of fifty-three by default, says so, and opens the rest on Show more', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ resolution, aliasProposals: [] }) } as Response);
    render(<OwnerResolutionPanel hypothesisId="h1" accountName="Walmart Inc." />);
    await waitFor(() => expect(screen.getByTestId('owner-candidates')).toBeInTheDocument());
    expect(resolution.eligible.length).toBe(53);
    expect(screen.getAllByTestId('owner-candidate')).toHaveLength(5);
    expect(screen.getByText(/Best people on record \(top 5 of 53\)/)).toBeInTheDocument();
    const more = screen.getByTestId('owner-show-all');
    expect(more.textContent).toMatch(/Show 48 more on record/);
    expect(more).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(more);
    expect(screen.getAllByTestId('owner-candidate')).toHaveLength(53);
    expect(more).toHaveAttribute('aria-expanded', 'true');
  });
  it('on a tie the rows carry no ordinals and the tie is said; each radio is named by name and title and described by its reasons', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ resolution, aliasProposals: [] }) } as Response);
    render(<OwnerResolutionPanel hypothesisId="h1" accountName="Walmart Inc." />);
    await waitFor(() => expect(screen.getByTestId('owner-candidates')).toBeInTheDocument());
    expect(screen.getByTestId('owner-tie').textContent).toMatch(/could not separate/);
    for (const row of screen.getAllByTestId('owner-candidate')) expect(row.querySelector('p.font-medium')!.textContent).not.toMatch(/^\d+\./);
    const radio = screen.getAllByRole('radio')[0];
    expect(radio).toHaveAttribute('aria-label', expect.stringMatching(/^Choose Person \d+, (Regional Transportation Director|Director, Transportation Maintenance)$/));
    const describedBy = radio.getAttribute('aria-describedby')!;
    expect(document.getElementById(describedBy)!.textContent).toMatch(/Thesis fit|Primary operator/);
  });
});
