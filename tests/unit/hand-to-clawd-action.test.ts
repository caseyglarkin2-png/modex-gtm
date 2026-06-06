import { describe, it, expect } from 'vitest';
import { prepareClawdDispatch } from '@/lib/discovery/clawd-dispatch';

// A minimal structural row — only the fields buildDraftBatchPayload reads.
// `nearestPrimoName` is an exact REFERENCE_SITES name so resolution succeeds.
const ROW = {
  name: 'Acme Foods Distribution',
  cityState: 'Madison, WI',
  segment: 'shipper' as const,
  tier: 'A' as const,
  nearestPrimoName: 'US PL Madison Factory', // resolves to "Madison, WI"
  nearestPrimoDistance: 3.42,
  corridor: 'WI-Madison',
};

describe('prepareClawdDispatch', () => {
  it('returns unauthenticated when there is no owner email', () => {
    for (const owner of [null, undefined, '']) {
      expect(prepareClawdDispatch(owner, [ROW])).toEqual({
        ok: false,
        reason: 'unauthenticated',
      });
    }
  });

  it('returns empty when there are no rows', () => {
    expect(prepareClawdDispatch('casey@example.com', [])).toEqual({
      ok: false,
      reason: 'empty',
    });
  });

  it('builds a payload with the resolved owner and one target per row', () => {
    const result = prepareClawdDispatch('casey@example.com', [ROW, ROW]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.payload.owner).toBe('casey@example.com');
    expect(result.payload.requestedBy).toBe('casey@example.com');
    expect(result.payload.source).toBe('discovery-worklist');
    expect(result.payload.targets).toHaveLength(2);
    expect(result.payload.targets[0].account).toBe('Acme Foods Distribution');
  });

  it('never trusts a row-supplied owner — owner comes only from the argument', () => {
    const result = prepareClawdDispatch('owner@session', [ROW]);
    if (!result.ok) throw new Error('expected ok');
    expect(result.payload.owner).toBe('owner@session');
  });
});
