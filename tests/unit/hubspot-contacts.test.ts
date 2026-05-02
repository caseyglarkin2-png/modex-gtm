import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockHubSpotClient } from '../helpers/hubspot-mock';
import { mockContact, mockContactSearchResult } from '../mocks/hubspot';

// Mock the @hubspot/api-client module
const mockHubSpot = createMockHubSpotClient();

vi.mock('@hubspot/api-client', () => ({
  Client: vi.fn(() => mockHubSpot.client),
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

describe('hubspot/contacts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      HUBSPOT_ACCESS_TOKEN: 'test-token',
      HUBSPOT_SYNC_ENABLED: 'true',
      ALLOW_EXTERNAL_WRITES_IN_TEST: 'true',
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function loadModule() {
    return import('@/lib/hubspot/contacts');
  }

  it('searchContactByEmail returns mapped contact on match', async () => {
    mockHubSpot.contactsApi.searchApi.doSearch.mockResolvedValueOnce(mockContactSearchResult);
    const { searchContactByEmail } = await loadModule();
    const result = await searchContactByEmail('casey@freightroll.com');
    expect(result).toBeTruthy();
    expect(result!.id).toBe('501');
    expect(result!.email).toBe('casey@freightroll.com');
    expect(result!.firstname).toBe('Casey');
  });

  it('searchContactByEmail returns null when no results', async () => {
    mockHubSpot.contactsApi.searchApi.doSearch.mockResolvedValueOnce({
      total: 0,
      results: [],
    });
    const { searchContactByEmail } = await loadModule();
    const result = await searchContactByEmail('nobody@example.com');
    expect(result).toBeNull();
  });

  it('searchContactByEmail returns null when HUBSPOT_SYNC_ENABLED is false', async () => {
    process.env.HUBSPOT_SYNC_ENABLED = 'false';
    vi.resetModules();
    const { searchContactByEmail } = await loadModule();
    const result = await searchContactByEmail('casey@freightroll.com');
    expect(result).toBeNull();
  });

  it('getContactById returns mapped contact', async () => {
    mockHubSpot.contactsApi.basicApi.getById.mockResolvedValueOnce(mockContact);
    const { getContactById } = await loadModule();
    const result = await getContactById('501');
    expect(result).toBeTruthy();
    expect(result!.id).toBe('501');
  });

  it('getContactById returns null on error', async () => {
    mockHubSpot.contactsApi.basicApi.getById.mockRejectedValueOnce(new Error('not found'));
    const { getContactById } = await loadModule();
    const result = await getContactById('999');
    expect(result).toBeNull();
  });

  it('upsertContact creates new contact when not found', async () => {
    mockHubSpot.contactsApi.searchApi.doSearch.mockResolvedValueOnce({
      total: 0,
      results: [],
    });
    mockHubSpot.contactsApi.basicApi.create.mockResolvedValueOnce({ id: '502' });

    const { upsertContact } = await loadModule();
    const id = await upsertContact({
      email: 'new@example.com',
      firstname: 'New',
      lastname: 'Person',
    });
    expect(id).toBe('502');
    expect(mockHubSpot.contactsApi.basicApi.create).toHaveBeenCalled();
  });

  it('upsertContact updates existing contact', async () => {
    mockHubSpot.contactsApi.searchApi.doSearch.mockResolvedValueOnce(mockContactSearchResult);
    mockHubSpot.contactsApi.basicApi.update.mockResolvedValueOnce(mockContact);

    const { upsertContact } = await loadModule();
    const id = await upsertContact({
      email: 'casey@freightroll.com',
      jobtitle: 'CRO',
    });
    expect(id).toBe('501');
    expect(mockHubSpot.contactsApi.basicApi.update).toHaveBeenCalledWith(
      '501',
      expect.objectContaining({ properties: expect.objectContaining({ email: 'casey@freightroll.com' }) }),
    );
  });

  it('listRecentContacts returns paginated results', async () => {
    mockHubSpot.contactsApi.basicApi.getPage = vi.fn().mockResolvedValueOnce({
      results: [mockContact],
      paging: { next: { after: '100' } },
    });

    const { listRecentContacts } = await loadModule();
    const { contacts, nextAfter } = await listRecentContacts();
    expect(contacts).toHaveLength(1);
    expect(contacts[0].id).toBe('501');
    expect(nextAfter).toBe('100');
  });
});
