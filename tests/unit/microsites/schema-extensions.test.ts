import { describe, it, expect } from 'vitest';
import type { AccountMicrositeData } from '../../../src/lib/microsites/schema';

describe('AccountMicrositeData schema — Phase-1 extensions', () => {
  it('allows titleEmphasis as optional string', () => {
    const data: Partial<AccountMicrositeData> = {
      slug: 'test',
      titleEmphasis: 'network constraint',
    };
    expect(data.titleEmphasis).toBe('network constraint');
  });

  it('allows coverHeadline as optional string override', () => {
    const data: Partial<AccountMicrositeData> = {
      slug: 'test',
      coverHeadline: 'A custom cover line for this account',
    };
    expect(data.coverHeadline).toBe('A custom cover line for this account');
  });
});
