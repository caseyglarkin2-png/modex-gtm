/**
 * Final Monday blocker: HubSpot is the active-opportunity truth, account level,
 * fail closed. These pin the canonical resolver (src/lib/gap/opportunity).
 */
import { describe, expect, it, vi } from 'vitest';
import { fakeHubSpot } from './fixtures/fake-hubspot-opportunity';
import {
  companyDomain,
  loadOpportunityIdentity,
  resolveAccountOpportunity,
  resolveOpportunity,
  type OpportunityIdentity,
  type OpportunityReads,
} from '@/lib/gap/opportunity/active-opportunity';

const kroger: OpportunityIdentity = { accountName: 'Kroger', hubspotCompanyId: 'c-kroger', domains: [], contactIds: [] };

describe('resolveOpportunity (HubSpot is the truth, account level)', () => {
  it('an open deal on the company is ACTIVE with its metadata', async () => {
    const hs = fakeHubSpot({ companyDeals: { 'c-kroger': ['d1'] }, deals: [{ id: 'd1', closed: 'false', name: 'YardFlow - Kroger', contacts: ['k1'] }] });
    const t = await resolveOpportunity(kroger, hs);
    expect(t).toEqual({
      status: 'ACTIVE',
      companyIds: ['c-kroger'],
      deals: [{ id: 'd1', name: 'YardFlow - Kroger', stage: 'appointmentscheduled', pipeline: 'default', companyIds: ['c-kroger'], contactIds: ['k1'] }],
    });
  });

  it('a closed deal (hs_is_closed true) is not active: CLEAR', async () => {
    const hs = fakeHubSpot({ companyDeals: { 'c-kroger': ['d1'] }, deals: [{ id: 'd1', closed: 'true' }] });
    expect(await resolveOpportunity(kroger, hs)).toEqual({ status: 'CLEAR', companyIds: ['c-kroger'] });
  });

  it('an open deal in a custom (non-default) stage is still ACTIVE: hs_is_closed, not a stage list', async () => {
    const hs = fakeHubSpot({ companyDeals: { 'c-kroger': ['d1'] }, deals: [{ id: 'd1', closed: 'false', stage: '1417384082' }] });
    expect((await resolveOpportunity(kroger, hs)).status).toBe('ACTIVE');
  });

  it("an open deal on ANOTHER company does not block this account", async () => {
    const hs = fakeHubSpot({ companyDeals: { 'c-kroger': [], 'c-other': ['d9'] }, deals: [{ id: 'd9', closed: 'false' }] });
    expect(await resolveOpportunity(kroger, hs)).toEqual({ status: 'CLEAR', companyIds: ['c-kroger'] });
  });

  it('the recipient need not be on the deal: an open deal with a different contact still blocks the account', async () => {
    const hs = fakeHubSpot({ companyDeals: { 'c-kroger': ['d1'] }, deals: [{ id: 'd1', closed: 'false', contacts: ['someone-else'] }] });
    const t = await resolveOpportunity({ ...kroger, contactIds: ['recipient'] }, hs);
    expect(t.status).toBe('ACTIVE');
  });

  it('finds the company by the verified domain when modex has no hubspot_company_id (GXO, Ford, GM ...)', async () => {
    const hs = fakeHubSpot({ companiesByDomain: { 'gxo.com': ['c-gxo'] }, companyDeals: { 'c-gxo': ['d1'] }, deals: [{ id: 'd1', closed: 'false', name: 'GXO - Enterprise' }] });
    const t = await resolveOpportunity({ accountName: 'GXO Logistics', hubspotCompanyId: null, domains: ['gxo.com'], contactIds: [] }, hs);
    expect(t).toMatchObject({ status: 'ACTIVE', companyIds: ['c-gxo'] });
  });

  it('a deal on a person GAP holds at the account blocks even when the company leg shows none', async () => {
    const hs = fakeHubSpot({ companiesByDomain: { 'lazerlogistics.com': ['c-lz'] }, companyDeals: { 'c-lz': [] }, contactDeals: { k7: ['d5'] }, deals: [{ id: 'd5', closed: 'false', name: 'Lazer' }] });
    const t = await resolveOpportunity({ accountName: 'Lazer Logistics', hubspotCompanyId: null, domains: ['lazerlogistics.com'], contactIds: ['k7'] }, hs);
    expect(t).toMatchObject({ status: 'ACTIVE', deals: [{ id: 'd5', companyIds: [] }] });
  });

  it('no company id and no domain: UNKNOWN identity_unresolved, never CLEAR', async () => {
    const hs = fakeHubSpot({});
    expect(await resolveOpportunity({ accountName: 'Boston Beer Company', hubspotCompanyId: null, domains: [], contactIds: ['k1'] }, hs)).toMatchObject({ status: 'UNKNOWN', reason: 'identity_unresolved' });
  });

  it('a domain HubSpot has no company for: UNKNOWN identity_unresolved', async () => {
    const hs = fakeHubSpot({ companiesByDomain: {} });
    expect(await resolveOpportunity({ accountName: 'X', hubspotCompanyId: null, domains: ['x.com'], contactIds: [] }, hs)).toMatchObject({ status: 'UNKNOWN', reason: 'identity_unresolved' });
  });

  it('a stale hubspot_company_id HubSpot does not know: UNKNOWN identity_unresolved', async () => {
    const hs = fakeHubSpot({ missingCompanies: ['c-kroger'] });
    expect(await resolveOpportunity(kroger, hs)).toMatchObject({ status: 'UNKNOWN', reason: 'identity_unresolved' });
  });

  it('too many company domains is not one company: UNKNOWN identity_ambiguous', async () => {
    const hs = fakeHubSpot({});
    const domains = Array.from({ length: 11 }, (_, i) => `d${i}.com`);
    expect(await resolveOpportunity({ accountName: 'X', hubspotCompanyId: null, domains, contactIds: [] }, hs)).toMatchObject({ status: 'UNKNOWN', reason: 'identity_ambiguous' });
  });

  it("HubSpot's duplicate company record (same exact name, other domain) holding the open deal is ACTIVE (the Lazerspot shape)", async () => {
    const hs = fakeHubSpot({
      companiesByDomain: { 'lazerlogistics.com': ['c-lz-dup'] },
      names: { 'c-lz-dup': 'Lazerspot', 'c-lz': 'Lazerspot', 'c-other': 'Lazerspot Holdings' },
      companyDeals: { 'c-lz-dup': [], 'c-lz': ['d5'], 'c-other': ['d6'] },
      deals: [{ id: 'd5', closed: 'false', name: 'Lazer' }, { id: 'd6', closed: 'false' }],
    });
    const t = await resolveOpportunity({ accountName: 'Lazer Logistics', hubspotCompanyId: null, domains: ['lazerlogistics.com'], contactIds: [] }, hs);
    expect(t).toMatchObject({ status: 'ACTIVE', companyIds: ['c-lz', 'c-lz-dup'], deals: [{ id: 'd5', companyIds: ['c-lz'] }] });
  });

  it.each(['search', 'names', 'byId', 'companyAssoc', 'contactAssoc', 'deals'] as const)('a HubSpot read failure (%s) is UNKNOWN hubspot_error', async (leg) => {
    const hs = fakeHubSpot({ companiesByDomain: { 'kroger.com': ['c-kroger'] }, companyDeals: { 'c-kroger': ['d1'] }, deals: [{ id: 'd1', closed: 'true' }], fail: { [leg]: new Error('503') } });
    expect(await resolveOpportunity({ ...kroger, domains: ['kroger.com'], contactIds: ['k1'] }, hs)).toMatchObject({ status: 'UNKNOWN', reason: 'hubspot_error' });
  });

  it('a deal without hs_is_closed is UNKNOWN malformed_response', async () => {
    const hs = fakeHubSpot({ companyDeals: { 'c-kroger': ['d1'] }, deals: [{ id: 'd1', closed: undefined }] });
    expect(await resolveOpportunity(kroger, hs)).toMatchObject({ status: 'UNKNOWN', reason: 'malformed_response' });
  });

  it('a deal that does not read back is UNKNOWN malformed_response', async () => {
    const hs = fakeHubSpot({ companyDeals: { 'c-kroger': ['d-gone'] }, deals: [] });
    expect(await resolveOpportunity(kroger, hs)).toMatchObject({ status: 'UNKNOWN', reason: 'malformed_response' });
  });

  it('consumer and own domains never identify a company', () => {
    expect(companyDomain('gmail.com')).toBeNull();
    expect(companyDomain('yardflow.ai')).toBeNull();
    expect(companyDomain('https://www.GXO.com/')).toBe('gxo.com');
  });
});

describe('loadOpportunityIdentity + resolveAccountOpportunity (modex identity, fail closed)', () => {
  const prismaOf = (o: { account?: { hubspot_company_id: string | null; pipeline_stage?: string } | null; links?: Array<{ canonical_company_id: string; status: string }>; people?: Array<{ email: string | null; hubspot_contact_id: string | null }> }) => ({
    account: { findUnique: vi.fn(async () => (o.account === undefined ? { hubspot_company_id: null } : o.account)) },
    canonicalAccountLink: { findMany: vi.fn(async () => o.links ?? []) },
    persona: { findMany: vi.fn(async () => o.people ?? []) },
  });

  it('unions the company id, the canonical domain and the people (freemail excluded)', async () => {
    const prisma = prismaOf({
      account: { hubspot_company_id: 'c1' },
      links: [{ canonical_company_id: 'domain:gxo.com', status: 'resolved' }, { canonical_company_id: 'account:gxo', status: 'resolved' }],
      people: [{ email: 'a@gxo.com', hubspot_contact_id: 'k1' }, { email: 'b@gmail.com', hubspot_contact_id: null }, { email: 'c@gxologistics.com', hubspot_contact_id: 'k2' }],
    });
    expect(await loadOpportunityIdentity(prisma, 'GXO Logistics', { email: 'r@gxo.com', hubspotContactId: 'k9' })).toEqual({
      accountName: 'GXO Logistics',
      hubspotCompanyId: 'c1',
      domains: ['gxo.com', 'gxologistics.com'],
      contactIds: ['k1', 'k2', 'k9'],
    });
  });

  it('pipeline_stage is NOT the truth: a "targeted" account with an open HubSpot deal is ACTIVE', async () => {
    const prisma = prismaOf({ account: { hubspot_company_id: 'c-kroger', pipeline_stage: 'targeted' } });
    const hs = fakeHubSpot({ companyDeals: { 'c-kroger': ['d1'] }, deals: [{ id: 'd1', closed: 'false' }] });
    expect((await resolveAccountOpportunity(prisma, 'Kroger', {}, { reads: hs, configured: () => true })).status).toBe('ACTIVE');
  });

  it('HubSpot unconfigured is UNKNOWN, never CLEAR', async () => {
    expect(await resolveAccountOpportunity(prismaOf({}), 'Kroger', {}, { reads: fakeHubSpot({}), configured: () => false })).toMatchObject({ status: 'UNKNOWN', reason: 'hubspot_unconfigured' });
  });

  it('a HubSpot that never answers is UNKNOWN timeout', async () => {
    const never = () => new Promise<never>(() => {});
    const hang: OpportunityReads = { companiesByDomains: never, companiesByNames: never, companiesById: never, associations: never, readDeals: never };
    expect(await resolveAccountOpportunity(prismaOf({ account: { hubspot_company_id: 'c1' } }), 'Kroger', {}, { reads: hang, configured: () => true, timeoutMs: 20 })).toMatchObject({ status: 'UNKNOWN', reason: 'timeout' });
  });

  it('a modex read failure is UNKNOWN, never a throw', async () => {
    const prisma = { account: { findUnique: vi.fn(async () => { throw new Error('db down'); }) }, canonicalAccountLink: { findMany: vi.fn() }, persona: { findMany: vi.fn() } };
    expect(await resolveAccountOpportunity(prisma, 'Kroger', {}, { reads: fakeHubSpot({}), configured: () => true })).toMatchObject({ status: 'UNKNOWN', reason: 'hubspot_error' });
  });
});
