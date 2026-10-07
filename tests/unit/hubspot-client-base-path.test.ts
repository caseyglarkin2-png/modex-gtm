// @vitest-environment node
/**
 * Acceptance batch item 1 (production safety): the HubSpot SDK base path override exists for a non-production harness
 * (R05: the real readers against a local stub). With VERCEL_ENV=production it is refused, so no production read or
 * write can be pointed anywhere but HubSpot by configuration.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hubspotBasePath } from '@/lib/hubspot/client';

describe('HUBSPOT_API_BASE_PATH in production', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('is refused in production; preview and development keep the harness override; unset means HubSpot itself', () => {
    expect(() => hubspotBasePath({ HUBSPOT_API_BASE_PATH: 'http://127.0.0.1:4600', VERCEL_ENV: 'production' })).toThrow('HUBSPOT_API_BASE_PATH is refused in production (VERCEL_ENV=production): unset it');
    expect(hubspotBasePath({ HUBSPOT_API_BASE_PATH: ' http://127.0.0.1:4600 ', VERCEL_ENV: 'preview' })).toBe('http://127.0.0.1:4600');
    expect(hubspotBasePath({ HUBSPOT_API_BASE_PATH: 'http://127.0.0.1:4600' })).toBe('http://127.0.0.1:4600');
    expect(hubspotBasePath({ VERCEL_ENV: 'production' })).toBeUndefined();
  });

  it('the client builder reads it: in production with a base path set, no client is built', async () => {
    vi.resetModules();
    vi.stubEnv('HUBSPOT_ACCESS_TOKEN', 'test-token-not-real');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('HUBSPOT_API_BASE_PATH', 'http://127.0.0.1:1');
    const { getHubSpotClient } = await import('@/lib/hubspot/client');
    expect(() => getHubSpotClient()).toThrow('HUBSPOT_API_BASE_PATH is refused in production (VERCEL_ENV=production): unset it');
  });
});
