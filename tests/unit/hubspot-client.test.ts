import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('hubspot/client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, HUBSPOT_ACCESS_TOKEN: 'test-token-123' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function loadModule() {
    return import('@/lib/hubspot/client');
  }

  it('getHubSpotClient returns a client when token is set', async () => {
    const { getHubSpotClient } = await loadModule();
    const client = getHubSpotClient();
    expect(client).toBeDefined();
    expect(client.crm).toBeDefined();
  });

  it('getHubSpotClient throws when token is missing', async () => {
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    const { getHubSpotClient } = await loadModule();
    expect(() => getHubSpotClient()).toThrow('HUBSPOT_ACCESS_TOKEN');
  });

  it('isHubSpotConfigured returns true when token is set', async () => {
    const { isHubSpotConfigured } = await loadModule();
    expect(isHubSpotConfigured()).toBe(true);
  });

  it('isHubSpotConfigured returns false when token is missing', async () => {
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    const { isHubSpotConfigured } = await loadModule();
    expect(isHubSpotConfigured()).toBe(false);
  });

  it('withHubSpotRetry returns result on success', async () => {
    const { withHubSpotRetry } = await loadModule();
    const result = await withHubSpotRetry(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('withHubSpotRetry retries on 429 then succeeds', async () => {
    vi.useFakeTimers();
    const { withHubSpotRetry } = await loadModule();
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 3) {
        const err = new Error('rate limited') as Error & { code: number };
        err.code = 429;
        return Promise.reject(err);
      }
      return Promise.resolve('ok after retry');
    };

    const promise = withHubSpotRetry(fn, 'test');
    // Advance timers through the retry delays
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;
    expect(result).toBe('ok after retry');
    expect(attempts).toBe(3);
    vi.useRealTimers();
  });

  it('withHubSpotRetry throws after max retries on 429', async () => {
    vi.useFakeTimers();
    const { withHubSpotRetry } = await loadModule();
    const fn = () => {
      const err = new Error('rate limited') as Error & { code: number };
      err.code = 429;
      return Promise.reject(err);
    };

    const promise = withHubSpotRetry(fn, 'test');
    const assertion = expect(promise).rejects.toThrow('rate limited');
    // Advance through all 3 retry delays
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
    vi.useRealTimers();
  });

  it('withHubSpotRetry does not retry on 401', async () => {
    const { withHubSpotRetry } = await loadModule();
    let attempts = 0;
    const fn = () => {
      attempts++;
      const err = new Error('unauthorized') as Error & { code: number };
      err.code = 401;
      return Promise.reject(err);
    };

    await expect(withHubSpotRetry(fn, 'test')).rejects.toThrow('unauthorized');
    expect(attempts).toBe(1);
  });

  it('withHubSpotRetry does not retry on non-rate-limit errors', async () => {
    const { withHubSpotRetry } = await loadModule();
    let attempts = 0;
    const fn = () => {
      attempts++;
      const err = new Error('not found') as Error & { code: number };
      err.code = 404;
      return Promise.reject(err);
    };

    await expect(withHubSpotRetry(fn, 'test')).rejects.toThrow('not found');
    expect(attempts).toBe(1);
  });
});
