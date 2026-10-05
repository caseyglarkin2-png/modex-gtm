/**
 * The POSSIBLE ACCOUNT ALIAS control (enterprise graph, 2026-10-05): renders one proposal, posts Casey's answer to
 * the alias-review route, says the outcome in a sentence, and never writes anything itself.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AliasProposalControl } from '@/components/gap/alias-proposal-control';

const proposal = { company: 'Central Market', canonical: 'H-E-B', evidence: ["Central Market: 3 HubSpot contacts' CRM company field", 'HubSpot: Jess Bess, Ana Ruiz, Tom Hale'], key: 'central market' };
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('<AliasProposalControl>', () => {
  it('renders the proposal and confirms through the route with the evidence; the outcome is a sentence; onDecided fires', async () => {
    const fetchMock = vi.fn(async () => json({ ok: true, status: 'CREATED', id: 'al_1', auditId: 'au_1' }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const onDecided = vi.fn();
    render(<AliasProposalControl proposal={proposal} onDecided={onDecided} />);
    expect(screen.getByTestId('alias-proposal')).toHaveTextContent('Possible account alias. Company: Central Market. Canonical: H-E-B.');
    expect(screen.getByTestId('alias-proposal')).toHaveTextContent("Evidence: Central Market: 3 HubSpot contacts' CRM company field; HubSpot: Jess Bess, Ana Ruiz, Tom Hale");
    fireEvent.click(screen.getByTestId('alias-confirm'));
    await waitFor(() => expect(screen.getByTestId('alias-outcome')).toHaveTextContent('Confirmed: Central Market is now an alias of H-E-B.'));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/gap/accounts/alias-review');
    expect(JSON.parse(String(init.body))).toEqual({ accountName: 'H-E-B', alias: 'Central Market', decision: 'confirm', evidence: proposal.evidence });
    expect(onDecided).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('alias-confirm')).toBeNull();
    expect(screen.getByTestId('alias-proposal').textContent).not.toMatch(/—/);
  });
  it('rejects through the route and says so', async () => {
    const fetchMock = vi.fn(async () => json({ ok: true, auditId: 'au_2' }, 200));
    vi.stubGlobal('fetch', fetchMock);
    render(<AliasProposalControl proposal={proposal} />);
    fireEvent.click(screen.getByTestId('alias-reject'));
    await waitFor(() => expect(screen.getByTestId('alias-outcome')).toHaveTextContent('Recorded: Central Market is not the same family as H-E-B. It will not be proposed again.'));
    expect(JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body))).toEqual({ accountName: 'H-E-B', alias: 'Central Market', decision: 'reject' });
  });
  it('a refusal reads as a sentence with the detail, and the buttons stay', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'alias_conflict', detail: '"Central Market" already maps to Kroger' }, 409)));
    render(<AliasProposalControl proposal={proposal} />);
    fireEvent.click(screen.getByTestId('alias-confirm'));
    await waitFor(() => expect(screen.getByTestId('alias-outcome')).toHaveTextContent('Not recorded: alias conflict ("Central Market" already maps to Kroger).'));
    expect(screen.getByTestId('alias-confirm')).toBeInTheDocument();
  });
});
