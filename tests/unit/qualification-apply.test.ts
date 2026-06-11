import { describe, it, expect } from 'vitest';
import { applyVerdicts } from '@/lib/revops/qualification/apply';
import type { VerdictDiff } from '@/lib/revops/qualification/types';

const row = { contactId: '1', newVerdict: 'mql' } as VerdictDiff;

describe('applyVerdicts', () => {
  it('no-ops on empty input', async () => {
    expect(await applyVerdicts([])).toEqual({ updated: 0 });
  });
  it('is blocked by the external-write-guard in test mode', async () => {
    // NODE_ENV=test + default BLOCK_EXTERNAL_WRITES_IN_TEST -> throws before any live write
    await expect(applyVerdicts([row])).rejects.toThrow(/external-write-guard/);
  });
});
