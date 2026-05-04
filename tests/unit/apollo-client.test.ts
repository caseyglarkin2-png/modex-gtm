import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApolloSearchResponse } from '../mocks/apollo';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe('apollo client', () => {
  it('returns empty when API key is not configured', async () => {
    delete process.env.APOLLO_API_KEY;
    const { searchApolloPeople } = await import('@/lib/enrichment/apollo-client');

    const people = await searchApolloPeople('logistics');
    expect(people).toEqual([]);
  });

  it('parses people using connector contract schema', async () => {
    process.env.APOLLO_API_KEY = 'test-apollo-key';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockApolloSearchResponse,
    } as Response);
    const { searchApolloPeople } = await import('@/lib/enrichment/apollo-client');

    const people = await searchApolloPeople('yardflow');
    expect(people).toHaveLength(1);
    expect(people[0]?.email).toBe('casey@freightroll.com');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('accepts CODEX_APOLLO_API_KEY_MASTER fallback', async () => {
    process.env = { ...process.env, CODEX_APOLLO_API_KEY_MASTER: 'fallback-key' };
    delete process.env.APOLLO_API_KEY;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockApolloSearchResponse,
    } as Response);
    const { searchApolloPeople } = await import('@/lib/enrichment/apollo-client');

    const people = await searchApolloPeople('yardflow');
    expect(people).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('searches saved contacts by Apollo contact label IDs', async () => {
    process.env.APOLLO_API_KEY = 'test-apollo-key';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        contacts: [
          {
            id: 'apollo-contact-1',
            first_name: 'Alex',
            last_name: 'Rivera',
            email: 'alex@example.com',
            title: 'VP Operations',
            organization: { name: 'Example Co', website_url: 'https://example.com' },
          },
        ],
        pagination: { page: 2, per_page: 100, total_entries: 13000 },
      }),
    } as Response);
    const { searchApolloSavedContacts } = await import('@/lib/enrichment/apollo-client');

    const result = await searchApolloSavedContacts({ contactLabelIds: ['label-1'], page: 2, perPage: 100 });

    expect(result.totalEntries).toBe(13000);
    expect(result.contacts[0]?.email).toBe('alex@example.com');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.apollo.io/api/v1/contacts/search',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"contact_label_ids":["label-1"]'),
      }),
    );
  });

  it('lists Apollo saved lists and tags', async () => {
    process.env.APOLLO_API_KEY = 'test-apollo-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 'label-accounts', name: 'Enterprise TAM', modality: 'accounts', cached_count: 1133 },
        { id: 'label-contacts', name: 'Buying Committee', modality: 'contacts', cached_count: 290 },
      ]),
    } as Response);
    const { listApolloLabels } = await import('@/lib/enrichment/apollo-client');

    const labels = await listApolloLabels();

    expect(labels[0]).toMatchObject({ id: 'label-accounts', cached_count: 1133 });
    expect(labels[1]).toMatchObject({ id: 'label-contacts', modality: 'contacts' });
  });

  it('searches saved Apollo account lists', async () => {
    process.env.APOLLO_API_KEY = 'test-apollo-key';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        accounts: [
          {
            id: 'apollo-account-1',
            name: 'Example Co',
            website_url: 'https://example.com',
            industry: 'Food and Beverage',
          },
        ],
        pagination: { page: 1, per_page: 100, total_entries: 1133 },
      }),
    } as Response);
    const { searchApolloSavedAccounts } = await import('@/lib/enrichment/apollo-client');

    const result = await searchApolloSavedAccounts({ accountLabelIds: ['label-accounts'] });

    expect(result.totalEntries).toBe(1133);
    expect(result.accounts[0]).toMatchObject({ name: 'Example Co' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.apollo.io/api/v1/accounts/search',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"account_label_ids":["label-accounts"]'),
      }),
    );
  });
});
