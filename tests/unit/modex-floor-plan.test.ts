import { describe, expect, it } from 'vitest';
import { getModexFloorEntry, isModexPast, MODEX_FLOOR_PLAN } from '@/lib/data/modex-floor-plan';

describe('MODEX floor plan lookup (S5-T6)', () => {
  it('returns a Tier 1 entry for a Tier 1 account, case-insensitively', () => {
    expect(getModexFloorEntry('General Mills')).toMatchObject({
      account: 'General Mills',
      tier: 'tier_1',
    });
    expect(getModexFloorEntry('general mills')).toMatchObject({ tier: 'tier_1' });
    expect(getModexFloorEntry('GENERAL MILLS')).toMatchObject({ tier: 'tier_1' });
  });

  it('returns a Tier 2 entry for a Tier 2 account', () => {
    const entry = getModexFloorEntry('Home Depot');
    expect(entry).not.toBeNull();
    expect(entry?.tier).toBe('tier_2');
    expect(entry?.context).toMatch(/Score 77/);
  });

  it('returns null for an off-floor account', () => {
    expect(getModexFloorEntry('Some Random Company')).toBeNull();
  });

  it('returns null on empty / falsy input', () => {
    expect(getModexFloorEntry('')).toBeNull();
  });

  it('every floor entry has a context tooltip string', () => {
    for (const entry of MODEX_FLOOR_PLAN) {
      expect(entry.context).toBeTruthy();
    }
  });
});

describe('isModexPast (post-event detection)', () => {
  it('returns false during the show', () => {
    expect(isModexPast(new Date('2026-04-14T12:00:00Z'))).toBe(false);
  });

  it('returns false on the final day until midnight UTC closes', () => {
    expect(isModexPast(new Date('2026-04-16T20:00:00Z'))).toBe(false);
  });

  it('returns true once the show has clearly ended', () => {
    expect(isModexPast(new Date('2026-04-17T12:00:00Z'))).toBe(true);
    expect(isModexPast(new Date('2026-05-07T12:00:00Z'))).toBe(true);
  });

  it('returns false in the months leading up to the show', () => {
    expect(isModexPast(new Date('2026-03-15T12:00:00Z'))).toBe(false);
  });
});
