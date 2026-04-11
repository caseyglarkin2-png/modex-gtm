import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockHubSpotClient } from '../helpers/hubspot-mock';
import { mockCompany, mockCompanySearchResult } from '../mocks/hubspot';

const mockHubSpot = createMockHubSpotClient();

vi.mock('@hubspot/api-client', () => ({
  Client: vi.fn(() => mockHubSpot.client),
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

describe('hubspot/companies', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      HUBSPOT_ACCESS_TOKEN: 'test-token',
      HUBSPOT_SYNC_ENABLED: 'true',
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function loadModule() {
    return import('@/lib/hubspot/companies');
  }

  it('searchCompanyByDomain returns mapped company', async () => {
    mockHubSpot.companiesApi.searchApi.doSearch.mockResolvedValueOnce(mockCompanySearchResult);
    const { searchCompanyByDomain } = await loadModule();
    const result = await searchCompanyByDomain('generalmills.com');
    expect(result).toBeTruthy();
    expect(result!.id).toBe('901');
    expect(result!.name).toBe('General Mills');
  });

  it('searchCompanyByDomain returns null when no results', async () => {
    mockHubSpot.companiesApi.searchApi.doSearch.mockResolvedValueOnce({
      total: 0,
      results: [],
    });
    const { searchCompanyByDomain } = await loadModule();
    const result = await searchCompanyByDomain('unknown.com');
    expect(result).toBeNull();
  });

  it('searchCompanyByDomain returns null when sync disabled', async () => {
    process.env.HUBSPOT_SYNC_ENABLED = 'false';
    vi.resetModules();
    const { searchCompanyByDomain } = await loadModule();
    const result = await searchCompanyByDomain('generalmills.com');
    expect(result).toBeNull();
  });

  it('getCompanyById returns mapped company', async () => {
    mockHubSpot.companiesApi.basicApi.getById.mockResolvedValueOnce(mockCompany);
    const { getCompanyById } = await loadModule();
    const result = await getCompanyById('901');
    expect(result).toBeTruthy();
    expect(result!.domain).toBe('generalmills.com');
  });

  it('getCompanyById returns null on error', async () => {
    mockHubSpot.companiesApi.basicApi.getById.mockRejectedValueOnce(new Error('not found'));
    const { getCompanyById } = await loadModule();
    const result = await getCompanyById('999');
    expect(result).toBeNull();
  });

  it('upsertCompany creates when not found', async () => {
    mockHubSpot.companiesApi.searchApi.doSearch.mockResolvedValueOnce({
      total: 0,
      results: [],
    });
    mockHubSpot.companiesApi.basicApi.create.mockResolvedValueOnce({ id: '902' });

    const { upsertCompany } = await loadModule();
    const id = await upsertCompany({ name: 'New Corp', domain: 'newcorp.com' });
    expect(id).toBe('902');
    expect(mockHubSpot.companiesApi.basicApi.create).toHaveBeenCalled();
  });

  it('upsertCompany updates when found by domain', async () => {
    mockHubSpot.companiesApi.searchApi.doSearch.mockResolvedValueOnce(mockCompanySearchResult);
    mockHubSpot.companiesApi.basicApi.update.mockResolvedValueOnce(mockCompany);

    const { upsertCompany } = await loadModule();
    const id = await upsertCompany({ name: 'General Mills', domain: 'generalmills.com' });
    expect(id).toBe('901');
    expect(mockHubSpot.companiesApi.basicApi.update).toHaveBeenCalled();
  });
});
