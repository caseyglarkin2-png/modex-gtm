import { describe, expect, it } from 'vitest';
import { allocateRecipientsDeterministic, normalizeVariantSplits, previewVariantAllocation } from '@/lib/experiments/split';

describe('experiment split allocator', () => {
  it('normalizes split fractions to 1.0', () => {
    const normalized = normalizeVariantSplits([
      { variantId: 'a', variantKey: 'control', split: 70 },
      { variantId: 'b', variantKey: 'challenger', split: 30 },
    ]);
    const total = normalized.reduce((sum, item) => sum + item.split, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it('allocates recipients deterministically from seed + email', () => {
    const variants = [
      { variantId: 'a', variantKey: 'control', split: 50 },
      { variantId: 'b', variantKey: 'challenger', split: 50 },
    ];
    const recipients = ['a@example.com', 'b@example.com', 'c@example.com', 'd@example.com'];
    const firstRun = allocateRecipientsDeterministic(recipients, variants, 'exp-123');
    const secondRun = allocateRecipientsDeterministic(recipients, variants, 'exp-123');
    expect(firstRun).toEqual(secondRun);
  });

  it('shows deterministic preview counts', () => {
    const rows = previewVariantAllocation(21, [
      { variantId: 'a', variantKey: 'control', split: 60 },
      { variantId: 'b', variantKey: 'challenger', split: 40 },
    ]);
    expect(rows).toEqual([
      { variantId: 'a', variantKey: 'control', expectedCount: 12 },
      { variantId: 'b', variantKey: 'challenger', expectedCount: 9 },
    ]);
  });
});
