/**
 * Last-mile hardening: HubSpot company-domain matching for the active-opportunity
 * resolver. A company HubSpot stores as `www.example.com` (or with a scheme,
 * path, trailing dot or upper case) is the same company as `example.com`;
 * `example.co`, `example-logistics.com` and `sub.example.com` are not.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canonicalDomain, companyDomain, hubspotDomainVariants, resolveOpportunity } from '@/lib/gap/opportunity/active-opportunity';
import { fakeHubSpot } from './fixtures/fake-hubspot-opportunity';

const doSearch = vi.fn();
vi.mock('@/lib/hubspot/client', () => ({
  getHubSpotClient: () => ({ crm: { companies: { searchApi: { doSearch } } } }),
  withHubSpotRetry: (fn: () => unknown) => fn(),
}));

describe('canonicalDomain', () => {
  it.each(['example.com', 'www.example.com', 'https://example.com', 'https://www.example.com/', 'WWW.EXAMPLE.COM', '  example.com  ', 'http://www.example.com/about?x=1#y', 'example.com.', 'www.example.com:443', 'https://user@www.example.com/'])(
    '%j is example.com',
    (raw) => expect(canonicalDomain(raw)).toBe('example.com'),
  );

  it.each(['example.co', 'example-logistics.com', 'sub.example.com', 'wwwexample.com', 'example.com.au'])('%j is NOT example.com', (raw) => {
    expect(canonicalDomain(raw)).not.toBe('example.com');
  });

  it('keeps a real subdomain as its own host (no fuzzy company matching)', () => {
    expect(canonicalDomain('https://sub.example.com/')).toBe('sub.example.com');
    expect(canonicalDomain('www.sub.example.com')).toBe('sub.example.com');
  });

  it.each(['', '   ', 'not a domain', 'localhost', 'http://', 'exa mple.com', null, undefined])('junk %j is null', (raw) => {
    expect(canonicalDomain(raw as string | null | undefined)).toBeNull();
  });

  it('companyDomain still drops consumer mail and our own domains after canonicalizing', () => {
    expect(companyDomain('https://www.GMAIL.com/')).toBeNull();
    expect(companyDomain('WWW.Example.com.')).toBe('example.com');
  });
});

describe('hubspotDomainVariants', () => {
  it('asks HubSpot for the bare and the www. form of each canonical domain, nothing broader', () => {
    expect(hubspotDomainVariants(['example.com', 'www.acme.io'])).toEqual(['acme.io', 'example.com', 'www.acme.io', 'www.example.com']);
  });
});

describe('resolver identity: a company stored as www.<domain>', () => {
  it('finds the open deal on a company whose only domain form is www.example.com', async () => {
    const hs = fakeHubSpot({ companiesByDomain: { 'www.example.com': ['c-www'] }, companyDeals: { 'c-www': ['d1'] }, deals: [{ id: 'd1', closed: 'false', name: 'Open' }] });
    const truth = await resolveOpportunity({ accountName: 'Example', hubspotCompanyId: null, domains: ['example.com'], contactIds: [] }, hs);
    expect(truth.status).toBe('ACTIVE');
  });
});

describe('hubspotOpportunityReads.companiesByDomains', () => {
  beforeEach(() => {
    doSearch.mockReset();
  });

  it('searches both forms and returns the company HubSpot stores as www.example.com', async () => {
    doSearch.mockImplementation(async (req: { filterGroups: Array<{ filters: Array<{ value: string }> }> }) => {
      const asked = req.filterGroups.map((g) => g.filters[0].value);
      return { results: asked.includes('www.example.com') ? [{ id: '77', properties: { name: 'Example Inc', domain: 'www.example.com' } }] : [] };
    });
    const { hubspotOpportunityReads } = await import('@/lib/gap/opportunity/hubspot-reads');
    const r = await hubspotOpportunityReads.companiesByDomains(['example.com']);
    expect(r).toEqual({ companies: [{ id: '77', name: 'Example Inc' }], truncated: false });
    const asked = doSearch.mock.calls.flatMap(([req]) => req.filterGroups.map((g: { filters: Array<{ value: string }> }) => g.filters[0].value));
    expect(asked.sort()).toEqual(['example.com', 'www.example.com']);
  });

  it('drops a returned company whose stored domain is not canonically one we asked for', async () => {
    doSearch.mockResolvedValue({
      results: [
        { id: '1', properties: { name: 'Right', domain: 'WWW.Example.com' } },
        { id: '2', properties: { name: 'Wrong', domain: 'example-logistics.com' } },
        { id: '3', properties: { name: 'Sub', domain: 'sub.example.com' } },
      ],
    });
    const { hubspotOpportunityReads } = await import('@/lib/gap/opportunity/hubspot-reads');
    const r = await hubspotOpportunityReads.companiesByDomains(['example.com']);
    expect(r.companies.map((c) => c.id)).toEqual(['1']);
  });
});
