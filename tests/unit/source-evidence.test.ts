import { describe, expect, it } from 'vitest';
import { evaluateEvidenceFreshness } from '@/lib/source-backed/evidence';

describe('source evidence freshness policy', () => {
  it('classifies fresh, aging, and stale windows', () => {
    const now = new Date('2026-05-07T12:00:00.000Z');
    const fresh = evaluateEvidenceFreshness(new Date('2026-05-06T12:00:00.000Z'), now);
    const aging = evaluateEvidenceFreshness(new Date('2026-05-04T12:00:00.000Z'), now);
    const stale = evaluateEvidenceFreshness(new Date('2026-04-20T12:00:00.000Z'), now);

    expect(fresh).toBe('fresh');
    expect(aging).toBe('aging');
    expect(stale).toBe('stale');
  });
});
