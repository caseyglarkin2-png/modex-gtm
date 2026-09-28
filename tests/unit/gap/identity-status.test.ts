/**
 * Phase 2 A4: the canonical-link status difference is intentional. Opportunity
 * identity reads EVERY link (a conflicting domain can only add companies to
 * check); attribution / identity resolution use only `resolved` links. This
 * pins the over-protection so no cleanup can weaken open-deal protection.
 */
import { describe, expect, it, vi } from 'vitest';
import { loadOpportunityIdentity } from '@/lib/gap/opportunity/active-opportunity';

const prismaWith = (status: string) => ({
  account: { findUnique: vi.fn(async () => ({ hubspot_company_id: null })) },
  canonicalAccountLink: { findMany: vi.fn(async () => [{ canonical_company_id: 'domain:pepsico.com', status }]) },
  persona: { findMany: vi.fn(async () => []) },
});

describe('opportunity identity keeps conflict links (over-protects on purpose)', () => {
  it.each(['resolved', 'conflict', 'pending'])('a %s link still contributes its domain to the open-deal check', async (status) => {
    const p = prismaWith(status);
    const id = await loadOpportunityIdentity(p, 'PepsiCo');
    expect(id.domains).toEqual(['pepsico.com']);
    // The loader asks for every link, not only resolved ones.
    expect(JSON.stringify((p.canonicalAccountLink.findMany.mock.calls[0] as unknown[])[0])).not.toContain('resolved');
  });
});
