/**
 * S3-T2: business-day arithmetic for sequence step delays (UTC, weekend skip
 * only, no holidays).
 */
import { describe, expect, it } from 'vitest';

import { addBusinessDays, businessDaysBetween, toCalendarDelayDays } from '@/lib/gap/sequence/business-days';

const DAY_MS = 86_400_000;

// 2026-09-21 is a Monday; 2026-09-25 a Friday; 2026-09-26 a Saturday.
const MON = new Date('2026-09-21T14:30:00.000Z');
const FRI = new Date('2026-09-25T14:30:00.000Z');
const SAT = new Date('2026-09-26T09:00:00.000Z');

describe('addBusinessDays', () => {
  it('Friday + 1 business day is the next Monday, time of day preserved', () => {
    const out = addBusinessDays(FRI, 1);
    expect(out.toISOString()).toBe('2026-09-28T14:30:00.000Z');
    expect(out.getUTCDay()).toBe(1);
  });

  it('Saturday start + 0 is unchanged (no forward snap)', () => {
    expect(addBusinessDays(SAT, 0).getTime()).toBe(SAT.getTime());
  });

  it('Saturday start + 1 lands on Monday', () => {
    expect(addBusinessDays(SAT, 1).toISOString()).toBe('2026-09-28T09:00:00.000Z');
  });

  it('10 business days from a Monday spans 14 calendar days', () => {
    const out = addBusinessDays(MON, 10);
    expect((out.getTime() - MON.getTime()) / DAY_MS).toBe(14);
    expect(out.getUTCDay()).toBe(1);
  });

  it('does not mutate the input and refuses non-integer counts', () => {
    const before = FRI.getTime();
    addBusinessDays(FRI, 3);
    expect(FRI.getTime()).toBe(before);
    expect(() => addBusinessDays(FRI, 1.5)).toThrow('business_days_not_integer');
    expect(() => addBusinessDays(FRI, Number.NaN)).toThrow('business_days_not_integer');
  });

  it('negative counts walk backwards over the weekend', () => {
    expect(addBusinessDays(new Date('2026-09-28T14:30:00.000Z'), -1).toISOString()).toBe(FRI.toISOString());
  });
});

describe('businessDaysBetween', () => {
  it('Friday to the following Monday is one business day', () => {
    expect(businessDaysBetween(FRI, new Date('2026-09-28T00:00:00.000Z'))).toBe(1);
  });

  it('a Monday to the Monday two weeks later is ten business days', () => {
    expect(businessDaysBetween(MON, new Date(MON.getTime() + 14 * DAY_MS))).toBe(10);
  });

  it('same day is zero and a reversed range is negative', () => {
    expect(businessDaysBetween(MON, MON)).toBe(0);
    expect(businessDaysBetween(new Date('2026-09-28T00:00:00.000Z'), FRI)).toBe(-1);
  });

  it('is the inverse of addBusinessDays for weekday starts', () => {
    for (let n = 0; n <= 12; n += 1) {
      expect(businessDaysBetween(MON, addBusinessDays(MON, n))).toBe(n);
    }
  });
});

describe('toCalendarDelayDays', () => {
  it('10 business days from a Monday is 14 calendar days', () => {
    expect(toCalendarDelayDays(MON, 10)).toBe(14);
  });

  it('1 business day from a Friday is 3 calendar days, and 0 is 0', () => {
    expect(toCalendarDelayDays(FRI, 1)).toBe(3);
    expect(toCalendarDelayDays(FRI, 0)).toBe(0);
  });
});
