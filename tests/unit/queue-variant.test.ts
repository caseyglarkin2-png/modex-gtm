import { describe, expect, it } from 'vitest';
import { applyVariant, assignVariants, type QueueVariant } from '@/lib/queue/variant';

describe('applyVariant', () => {
  const base = { subject: 'Original subject', body: 'Original body.', accountName: 'Acme' };

  it('returns the base unchanged when variant is null', () => {
    expect(applyVariant(base, null)).toEqual({ subject: base.subject, body: base.body });
  });

  it('returns the base unchanged for a control variant with no overrides', () => {
    const control: QueueVariant = { variantKey: 'control', isControl: true };
    expect(applyVariant(base, control)).toEqual({ subject: base.subject, body: base.body });
  });

  it('resolves {{account}} in the variant subject', () => {
    const variant: QueueVariant = { variantKey: 'b', subject: '{{account}} pilot' };
    expect(applyVariant(base, variant).subject).toBe('Acme pilot');
  });

  it('falls back to empty string when accountName is null', () => {
    const variant: QueueVariant = { variantKey: 'b', subject: '{{account}} pilot' };
    expect(applyVariant({ ...base, accountName: null }, variant).subject).toBe(' pilot');
  });

  it('prepends the opening to the body', () => {
    const variant: QueueVariant = { variantKey: 'b', opening: 'Quick note.' };
    const result = applyVariant(base, variant);
    expect(result.body.startsWith('Quick note.')).toBe(true);
    expect(result.body).toContain('Original body.');
  });

  it('appends the cta to the body', () => {
    const variant: QueueVariant = { variantKey: 'b', cta: 'Worth 15 min?' };
    const result = applyVariant(base, variant);
    expect(result.body.endsWith('Worth 15 min?')).toBe(true);
    expect(result.body).toContain('Original body.');
  });
});

describe('assignVariants', () => {
  const emails = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);
  const variants = [
    { variantKey: 'a', split: 50 },
    { variantKey: 'b', split: 50 },
  ];

  it('maps every email to a variant', () => {
    const result = assignVariants(emails, variants, 'exp-1');
    expect(result.size).toBe(100);
    for (const email of emails) {
      const v = result.get(email.toLowerCase());
      expect(v === 'a' || v === 'b').toBe(true);
    }
  });

  it('is deterministic for the same email + experimentId', () => {
    const first = assignVariants(emails, variants, 'exp-1');
    const second = assignVariants(emails, variants, 'exp-1');
    for (const email of emails) {
      expect(first.get(email.toLowerCase())).toBe(second.get(email.toLowerCase()));
    }
  });

  it('gives both variants a non-trivial share', () => {
    const result = assignVariants(emails, variants, 'exp-1');
    const counts = { a: 0, b: 0 };
    for (const key of result.values()) {
      counts[key as 'a' | 'b'] += 1;
    }
    expect(counts.a).toBeGreaterThan(10);
    expect(counts.b).toBeGreaterThan(10);
  });
});
