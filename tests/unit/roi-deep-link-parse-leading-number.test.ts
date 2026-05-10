import { describe, expect, it } from 'vitest';
import { parseLeadingNumber } from '@/lib/microsites/roi-deep-link';

describe('parseLeadingNumber', () => {
  it('parses a bare integer', () => {
    expect(parseLeadingNumber('13')).toBe(13);
  });

  it('extracts the leading integer from a free-text label', () => {
    expect(parseLeadingNumber('47 plants')).toBe(47);
  });

  it('strips commas in numeric formatting (the FedEx case)', () => {
    expect(parseLeadingNumber('5,000+')).toBe(5000);
    expect(parseLeadingNumber('2,400/day')).toBe(2400);
  });

  it('returns null for undefined', () => {
    expect(parseLeadingNumber(undefined)).toBeNull();
  });

  it('returns null when no digits are present', () => {
    expect(parseLeadingNumber('many')).toBeNull();
    expect(parseLeadingNumber('')).toBeNull();
  });

  it('returns 0 for "0" (not null) so callers can distinguish "no data" from "zero"', () => {
    expect(parseLeadingNumber('0')).toBe(0);
  });
});
