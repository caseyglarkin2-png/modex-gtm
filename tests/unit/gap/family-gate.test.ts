/**
 * Release K at the send gate: the ONE action-time opportunity check (every draft, send and enroll) is corporate
 * family aware. When the account itself is clear, related-account activity refuses through the existing ACTIVE
 * path (or UNKNOWN when a related deal cannot be read), and a family read that fails is UNKNOWN (fail closed).
 */
import { describe, expect, it } from 'vitest';
import { makeActiveOpportunityCheck } from '@/lib/gap/enroll/service';
import { fakeHubSpot } from './fixtures/fake-hubspot-opportunity';

const NOW = new Date('2026-09-29T12:00:00Z');
const prisma = {
  account: { findUnique: async () => ({ hubspot_company_id: '111' }) },
  canonicalAccountLink: { findMany: async () => [] },
  persona: { findMany: async () => [] },
  conversationDisposition: { findFirst: async () => null },
};
const reads = fakeHubSpot({ companyDeals: { '111': [] } });

describe('the send gate reads the corporate family', () => {
  it('own account clear + a related account with an active opportunity: refused as ACTIVE, with the family detail', async () => {
    const check = makeActiveOpportunityCheck({ reads, configured: () => true }, { hold: async () => ({ detail: 'Related account activity. Frito-Lay is part of PepsiCo in GAP. PepsiCo (its parent): active opportunity.', unknown: false }) });
    expect(await check(prisma, 'Frito-Lay', 'dana@fritolay.example', NOW)).toEqual({ status: 'ACTIVE', detail: 'Related account activity. Frito-Lay is part of PepsiCo in GAP. PepsiCo (its parent): active opportunity.' });
  });
  it('a related deal state that cannot be read: UNKNOWN (never permits outbound)', async () => {
    const check = makeActiveOpportunityCheck({ reads, configured: () => true }, { hold: async () => ({ detail: 'x', unknown: true }) });
    expect((await check(prisma, 'Frito-Lay', 'dana@fritolay.example', NOW)).status).toBe('UNKNOWN');
  });
  it('a family read that throws: UNKNOWN (fail closed)', async () => {
    const check = makeActiveOpportunityCheck({ reads, configured: () => true }, { hold: async () => { throw new Error('db'); } });
    expect(await check(prisma, 'Frito-Lay', 'dana@fritolay.example', NOW)).toMatchObject({ status: 'UNKNOWN', detail: expect.stringMatching(/corporate family/) });
  });
  it('no family activity: CLEAR', async () => {
    const check = makeActiveOpportunityCheck({ reads, configured: () => true }, { hold: async () => null });
    expect((await check(prisma, 'Frito-Lay', 'dana@fritolay.example', NOW)).status).toBe('CLEAR');
  });
});
