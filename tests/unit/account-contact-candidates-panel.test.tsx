import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountContactCandidatesPanel } from '@/components/accounts/account-contact-candidates-panel';

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

describe('AccountContactCandidatesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders blockers and promotes a staged candidate inline', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return {
          ok: true,
          text: async () => JSON.stringify({
            candidates: [
              {
                id: 1,
                fullName: 'Pat Brewer',
                email: 'pat@example.com',
                emailValid: true,
                title: 'director logistics',
                source: 'company_contacts',
                sourceProvider: 'sales_agent',
                confidenceScore: 88,
                qualityScore: 90,
                recommended: true,
                recommendationReason: 'Surfaced directly by live contact discovery.',
                state: 'promoted',
                promotedPersonaId: 77,
                replacedPersonaId: null,
                deferredReason: null,
                lastSeenAt: '2026-05-05T00:00:00.000Z',
                readiness: { score: 87, tier: 'high', stale: false, freshness_days: null, reasons: [] },
              },
            ],
          }),
        } satisfies Partial<Response>;
      }

      return {
        ok: true,
        text: async () => JSON.stringify({ candidates: [] }),
      } satisfies Partial<Response>;
    }));

    render(
      <AccountContactCandidatesPanel
        slug="boston-beer-company"
        accountName="Boston Beer Company"
        initialCandidates={[
          {
            id: 1,
            accountName: 'Boston Beer Company',
            candidateKey: 'pat@example.com',
            fullName: 'Pat Brewer',
            title: 'director logistics',
            email: 'pat@example.com',
            emailValid: true,
            companyDomain: 'bostonbeer.com',
            linkedinUrl: null,
            source: 'company_contacts',
            sourceProvider: 'sales_agent',
            confidenceScore: 88,
            qualityScore: 90,
            recommended: true,
            recommendationReason: 'Surfaced directly by live contact discovery.',
            state: 'staged',
            promotedPersonaId: null,
            replacedPersonaId: null,
            deferredReason: null,
            lastSeenAt: '2026-05-05T00:00:00.000Z',
            readiness: { score: 87, tier: 'high', stale: false, freshness_days: null, reasons: [] },
          },
          {
            id: 2,
            accountName: 'Boston Beer Company',
            candidateKey: 'broken',
            fullName: 'Broken Email',
            title: 'ops manager',
            email: 'not-an-email',
            emailValid: false,
            companyDomain: 'bostonbeer.com',
            linkedinUrl: null,
            source: 'company_contacts',
            sourceProvider: 'sales_agent',
            confidenceScore: 40,
            qualityScore: 50,
            recommended: false,
            recommendationReason: 'Worth reviewing, but likely needs enrichment or replacement context.',
            state: 'staged',
            promotedPersonaId: null,
            replacedPersonaId: null,
            deferredReason: null,
            lastSeenAt: '2026-05-05T00:00:00.000Z',
            readiness: { score: 42, tier: 'low', stale: true, freshness_days: null, reasons: ['Stale or missing enrichment'] },
          },
        ]}
        replaceablePersonas={[
          { id: 10, name: 'Old Contact', title: 'manager', email: 'old@example.com', blockerBadges: ['Malformed email'] },
        ]}
      />,
    );

    expect(screen.getByText('Malformed email')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Promote' })[0]);

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(
        'Pat Brewer promoted into contacts',
        expect.objectContaining({
          duration: 5000,
          action: expect.objectContaining({ label: 'Undo', onClick: expect.any(Function) }),
        }),
      );
    });
    expect(screen.getByText(/Account-wide cards update the next time intel is refreshed/)).toBeInTheDocument();
  });

  it('fires the inverse restage mutation when the Undo toast action is invoked (S2-T6)', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ candidates: [] }),
    }) satisfies Partial<Response>);
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AccountContactCandidatesPanel
        slug="boston-beer-company"
        accountName="Boston Beer Company"
        initialCandidates={[
          {
            id: 1,
            accountName: 'Boston Beer Company',
            candidateKey: 'pat@example.com',
            fullName: 'Pat Brewer',
            title: 'director logistics',
            email: 'pat@example.com',
            emailValid: true,
            companyDomain: 'bostonbeer.com',
            linkedinUrl: null,
            source: 'company_contacts',
            sourceProvider: 'sales_agent',
            confidenceScore: 88,
            qualityScore: 90,
            recommended: true,
            recommendationReason: 'Surfaced directly by live contact discovery.',
            state: 'staged',
            promotedPersonaId: null,
            replacedPersonaId: null,
            deferredReason: null,
            lastSeenAt: '2026-05-05T00:00:00.000Z',
            readiness: { score: 87, tier: 'high', stale: false, freshness_days: null, reasons: [] },
          },
        ]}
        replaceablePersonas={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Defer' }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    const calls = (toastSuccess as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    const lastCall = calls[calls.length - 1] as [string, { action: { onClick: () => void } }];
    expect(lastCall[1].action).toBeDefined();

    // Simulate the operator clicking Undo on the toast.
    lastCall[1].action.onClick();

    await waitFor(() => {
      const undoCall = fetchMock.mock.calls.find((call) => {
        const init = call[1] as RequestInit | undefined;
        return typeof init?.body === 'string' && init.body.includes('restage');
      });
      expect(undoCall).toBeDefined();
    });
  });

  it('renders a "Replacing {persona}" banner when arriving via replace_persona deep link (S2-T1)', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(
      <AccountContactCandidatesPanel
        slug="boston-beer-company"
        accountName="Boston Beer Company"
        initialCandidates={[]}
        replaceablePersonas={[
          { id: 99, name: 'Jamie Old', title: 'VP', email: 'jamie@example.com', blockerBadges: ['Do not contact'] },
        ]}
        replacePersonaId={99}
      />,
    );
    const banner = screen.getByTestId('replace-mode-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Replacing Jamie Old/);
  });
});
