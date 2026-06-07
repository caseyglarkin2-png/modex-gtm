import { describe, it, expect } from 'vitest';
import { selectFreshTopAccounts } from '@/lib/discovery/auto-dispatch';

const row = (name: string, icpScore: number) => ({
  name,
  cityState: 'Ontario, CA',
  segment: 'shipper',
  tier: 'A',
  nearestPrimoName: 'Ontario',
  nearestPrimoDistance: 0.3,
  corridor: 'Ontario, CA',
  icpScore,
}) as any;

describe('selectFreshTopAccounts', () => {
  it('drops already-contacted, sorts by score, caps at n', () => {
    const rows = [row('Chewy', 90), row('Niagara', 95), row('Staples', 80)];
    const out = selectFreshTopAccounts(rows, 2, { contactedNames: new Set(['staples']) });
    expect(out.map((r) => r.name)).toEqual(['Niagara', 'Chewy']);
  });

  it('excludes excluded + existing-account rows', () => {
    const rows = [
      { ...row('Excl', 99), excluded: true },
      { ...row('Exist', 98), isExistingAccount: true },
      row('Ok', 50),
    ];
    const out = selectFreshTopAccounts(rows as any, 10, { contactedNames: new Set() });
    expect(out.map((r) => r.name)).toEqual(['Ok']);
  });

  it('returns empty when n is 0', () => {
    expect(selectFreshTopAccounts([row('A', 1)], 0, { contactedNames: new Set() })).toEqual([]);
  });
});
