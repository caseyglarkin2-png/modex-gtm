import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('feature-flags', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear all flag env vars before each test
    delete process.env.HUBSPOT_LOGGING_ENABLED;
    delete process.env.HUBSPOT_SYNC_ENABLED;
    delete process.env.INBOX_POLLING_ENABLED;
    delete process.env.DRIP_SEQUENCE_ENABLED;
  });

  it('returns defaults when env vars are not set', async () => {
    const flags = await import('@/lib/feature-flags');
    expect(flags.HUBSPOT_LOGGING_ENABLED).toBe(true);
    expect(flags.HUBSPOT_SYNC_ENABLED).toBe(true);
    expect(flags.INBOX_POLLING_ENABLED).toBe(true);
    expect(flags.DRIP_SEQUENCE_ENABLED).toBe(true);
  });

  it('returns true when env var is "true"', async () => {
    process.env.HUBSPOT_LOGGING_ENABLED = 'true';
    const flags = await import('@/lib/feature-flags');
    expect(flags.HUBSPOT_LOGGING_ENABLED).toBe(true);
  });

  it('returns false when env var is "false"', async () => {
    process.env.HUBSPOT_LOGGING_ENABLED = 'false';
    const flags = await import('@/lib/feature-flags');
    expect(flags.HUBSPOT_LOGGING_ENABLED).toBe(false);
  });

  it('returns false when env var is "0"', async () => {
    process.env.HUBSPOT_LOGGING_ENABLED = '0';
    const flags = await import('@/lib/feature-flags');
    expect(flags.HUBSPOT_LOGGING_ENABLED).toBe(false);
  });

  it('treats empty string as default', async () => {
    process.env.HUBSPOT_LOGGING_ENABLED = '';
    const flags = await import('@/lib/feature-flags');
    expect(flags.HUBSPOT_LOGGING_ENABLED).toBe(true);
  });

  it('treats any truthy string as true', async () => {
    process.env.HUBSPOT_SYNC_ENABLED = '1';
    const flags = await import('@/lib/feature-flags');
    expect(flags.HUBSPOT_SYNC_ENABLED).toBe(true);
  });
});
