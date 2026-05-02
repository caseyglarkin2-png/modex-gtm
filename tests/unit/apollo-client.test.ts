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
});
