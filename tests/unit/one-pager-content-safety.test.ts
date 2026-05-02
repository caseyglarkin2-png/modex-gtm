import { describe, expect, it } from 'vitest';
import { sanitizePublicContext } from '@/lib/one-pager/content-safety';

describe('one-pager content safety', () => {
  it('strips speculative MODEX references', () => {
    expect(sanitizePublicContext('MODEX 2026 attendance signal for this account')).toBe('');
  });

  it('keeps non-speculative public context', () => {
    expect(sanitizePublicContext('2025 annual report flagged on-time performance initiative.'))
      .toBe('2025 annual report flagged on-time performance initiative.');
  });
});
