import { describe, expect, it } from 'vitest';
import { lookupAccount } from '@/lib/intel/export/accounts';

describe('lookupAccount include', () => {
  it('adds dossiers + geometry + microsite when requested for an audited account', () => {
    const r = lookupAccount(null, 'boston-beer-company', ['dossiers', 'geometry', 'microsite']);
    expect(r.detail_level).toBe('full');
    const a = r.account as unknown as Record<string, unknown>;
    expect(a.dossiers).toBeDefined();
    expect(Array.isArray(a.geometry)).toBe(true);
  });
  it('omits heavy includes by default', () => {
    const r = lookupAccount(null, 'boston-beer-company', []);
    expect((r.account as unknown as Record<string, unknown>).geometry).toBeUndefined();
  });
});
