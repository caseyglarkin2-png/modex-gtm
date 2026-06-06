import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = {
    ...originalEnv,
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_REFRESH_TOKEN: 'test-refresh-token',
    GMAIL_USER_EMAIL: 'casey@freightroll.com',
  };
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

/**
 * Stub the OAuth token endpoint + the messages list endpoint. The token call
 * always succeeds; the list call is controlled per-test. Captures the list URL
 * so we can assert on the `q` query param.
 */
function stubFetch(listResponse: { ok: boolean; body?: unknown }) {
  const calls: string[] = [];
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push(url);
    if (url.includes('oauth2.googleapis.com/token')) {
      return { ok: true, json: async () => ({ access_token: 'token-abc' }) } as Response;
    }
    // messages list endpoint
    return {
      ok: listResponse.ok,
      json: async () => listResponse.body ?? {},
      text: async () => JSON.stringify(listResponse.body ?? {}),
    } as Response;
  });
  return { fetchMock, calls };
}

describe('threadExistsWith', () => {
  it('returns exists:true when the list response contains a message', async () => {
    stubFetch({ ok: true, body: { messages: [{ id: 'm1', threadId: 't1' }] } });
    const { threadExistsWith } = await import('@/lib/email/gmail-inbox');
    const result = await threadExistsWith('jane.doe@testaccount.com');
    expect(result.exists).toBe(true);
  });

  it('returns exists:false when the list response is empty', async () => {
    stubFetch({ ok: true, body: { messages: [] } });
    const { threadExistsWith } = await import('@/lib/email/gmail-inbox');
    const result = await threadExistsWith('nobody@testaccount.com');
    expect(result.exists).toBe(false);
  });

  it('strips a +tag from the local part in the q param', async () => {
    const { calls } = stubFetch({ ok: true, body: { messages: [] } });
    const { threadExistsWith } = await import('@/lib/email/gmail-inbox');
    await threadExistsWith('gm+promo@acme.com');

    const listCall = calls.find((u) => u.includes('/messages'));
    expect(listCall).toBeTruthy();
    const q = new URL(listCall!).searchParams.get('q') ?? '';
    expect(q).toContain('gm@acme.com');
    expect(q).not.toContain('gm+promo@acme.com');
  });

  it('returns exists:false and does not throw on a non-ok fetch', async () => {
    stubFetch({ ok: false, body: { error: 'rate limited' } });
    const { threadExistsWith } = await import('@/lib/email/gmail-inbox');
    await expect(threadExistsWith('jane.doe@testaccount.com')).resolves.toEqual({ exists: false, lastAt: null });
  });
});
