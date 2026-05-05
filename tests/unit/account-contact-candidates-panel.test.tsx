import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountContactCandidatesPanel } from '@/components/accounts/account-contact-candidates-panel';

const { mockedRefresh, toastSuccess, toastError } = vi.hoisted(() => ({
  mockedRefresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockedRefresh,
  }),
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
      expect(toastSuccess).toHaveBeenCalledWith('Pat Brewer promoted into contacts');
    });
    expect(mockedRefresh).toHaveBeenCalled();
  });
});
