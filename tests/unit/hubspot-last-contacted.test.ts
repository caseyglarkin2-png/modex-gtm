import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockHubSpotClient } from '../helpers/hubspot-mock';

const mockHubSpot = createMockHubSpotClient();

vi.mock('@hubspot/api-client', () => ({
  Client: vi.fn(() => mockHubSpot.client),
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

describe('hubspot/contacts — hubspotLastContacted', () => {
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
    return import('@/lib/hubspot/contacts');
  }

  it('returns { configured:false } when HubSpot is not configured', async () => {
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    vi.resetModules();
    const { hubspotLastContacted } = await loadModule();
    const r = await hubspotLastContacted('a@b.com');
    expect(r).toEqual({ configured: false, found: false, lastAt: null });
    expect(mockHubSpot.contactsApi.searchApi.doSearch).not.toHaveBeenCalled();
  });

  it('returns found + most-recent lastAt for a contact with last-touch props', async () => {
    mockHubSpot.contactsApi.searchApi.doSearch.mockResolvedValueOnce({
      total: 1,
      results: [
        {
          id: '501',
          properties: {
            email: 'a@b.com',
            notes_last_contacted: '2026-03-01T00:00:00.000Z',
            hs_last_sales_activity_timestamp: '2026-05-20T00:00:00.000Z',
          },
        },
      ],
    });
    const { hubspotLastContacted } = await loadModule();
    const r = await hubspotLastContacted('a@b.com');
    expect(r.configured).toBe(true);
    expect(r.found).toBe(true);
    // most recent of the two timestamps
    expect(r.lastAt).toEqual(new Date('2026-05-20T00:00:00.000Z'));
  });

  it('requests the last-touch properties', async () => {
    mockHubSpot.contactsApi.searchApi.doSearch.mockResolvedValueOnce({ total: 0, results: [] });
    const { hubspotLastContacted } = await loadModule();
    await hubspotLastContacted('a@b.com');
    const arg = mockHubSpot.contactsApi.searchApi.doSearch.mock.calls[0][0];
    expect(arg.properties).toContain('notes_last_contacted');
    expect(arg.properties).toContain('hs_last_sales_activity_timestamp');
  });

  it('returns found:false, lastAt:null when no contact matches', async () => {
    mockHubSpot.contactsApi.searchApi.doSearch.mockResolvedValueOnce({ total: 0, results: [] });
    const { hubspotLastContacted } = await loadModule();
    const r = await hubspotLastContacted('nobody@example.com');
    expect(r).toEqual({ configured: true, found: false, lastAt: null });
  });

  it('returns { configured:true, found:false, lastAt:null } on error (never throws)', async () => {
    mockHubSpot.contactsApi.searchApi.doSearch.mockRejectedValueOnce(new Error('boom'));
    const { hubspotLastContacted } = await loadModule();
    const r = await hubspotLastContacted('a@b.com');
    expect(r).toEqual({ configured: true, found: false, lastAt: null });
  });
});
