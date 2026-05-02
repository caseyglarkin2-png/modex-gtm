import { afterEach, describe, expect, it } from 'vitest';
import { assertExternalWriteAllowed, shouldBlockExternalWritesInTest } from '@/lib/enrichment/external-write-guard';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('external write guard', () => {
  it('blocks external writes in test mode by default', () => {
    process.env = { ...process.env, NODE_ENV: 'test' };
    delete process.env.ALLOW_EXTERNAL_WRITES_IN_TEST;
    delete process.env.BLOCK_EXTERNAL_WRITES_IN_TEST;

    expect(shouldBlockExternalWritesInTest()).toBe(true);
    expect(() => assertExternalWriteAllowed('hubspot', 'upsertContact')).toThrow(
      'blocked hubspot write in test mode',
    );
  });

  it('allows external writes in test when explicitly enabled', () => {
    process.env = { ...process.env, NODE_ENV: 'test', ALLOW_EXTERNAL_WRITES_IN_TEST: 'true' };

    expect(shouldBlockExternalWritesInTest()).toBe(false);
    expect(() => assertExternalWriteAllowed('apollo', 'upsertEnrichment')).not.toThrow();
  });

  it('does not block writes outside test mode', () => {
    process.env = { ...process.env, NODE_ENV: 'development' };
    expect(shouldBlockExternalWritesInTest()).toBe(false);
  });
});
