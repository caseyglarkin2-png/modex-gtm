import { describe, it, expect } from 'vitest';
import {
  staggerTimes,
  clampToWindow,
  selectDue,
  DEFAULT_WINDOW,
  type WindowConfig,
} from '@/lib/queue/schedule';
import { STATUS } from '@/lib/queue/types';

/** Read the local wall-clock parts of an instant in a target tz. */
function localParts(d: Date, tz = 'America/New_York') {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { weekday: p.weekday, hour: Number(p.hour) % 24, minute: Number(p.minute) };
}

describe('staggerTimes', () => {
  it('produces N times spaced minutesApart, starting at base', () => {
    const base = new Date('2026-06-09T13:00:00Z');
    const out = staggerTimes(base, 3, 2);
    expect(out).toHaveLength(3);
    expect(out[0].getTime() - base.getTime()).toBe(0);
    expect(out[1].getTime() - base.getTime()).toBe(2 * 60 * 1000);
    expect(out[2].getTime() - base.getTime()).toBe(4 * 60 * 1000);
  });

  it('returns empty array for count 0', () => {
    expect(staggerTimes(new Date('2026-06-09T13:00:00Z'), 0, 5)).toEqual([]);
  });

  it('does not mutate the base date', () => {
    const base = new Date('2026-06-09T13:00:00Z');
    const t = base.getTime();
    staggerTimes(base, 3, 7);
    expect(base.getTime()).toBe(t);
  });
});

describe('clampToWindow', () => {
  it('EDT weekday before window -> 08:00 same local day', () => {
    // 2026-06-09T06:00Z = 02:00 EDT Tuesday (DST summer, offset -4)
    const out = clampToWindow(new Date('2026-06-09T06:00:00Z'));
    const lp = localParts(out);
    expect(lp.hour).toBe(8);
    expect(lp.minute).toBe(0);
    expect(lp.weekday).toBe('Tue');
  });

  it('EST weekday before window -> 08:00 same local day (offset NOT hardcoded to EDT)', () => {
    // 2026-12-09T06:00Z = 01:00 EST Wednesday (DST winter, offset -5)
    const out = clampToWindow(new Date('2026-12-09T06:00:00Z'));
    const lp = localParts(out);
    expect(lp.hour).toBe(8);
    expect(lp.minute).toBe(0);
    expect(lp.weekday).toBe('Wed');
  });

  it('weekend Saturday -> Monday 08:00 local', () => {
    // 2026-06-06T18:00Z = 14:00 EDT Saturday
    const out = clampToWindow(new Date('2026-06-06T18:00:00Z'));
    const lp = localParts(out);
    expect(lp.hour).toBe(8);
    expect(lp.weekday).toBe('Mon');
  });

  it('after window on a weekday -> next allowed day 08:00 local', () => {
    // 2026-06-09T23:00Z = 19:00 EDT Tuesday (after 18:00) -> Wed 08:00
    const out = clampToWindow(new Date('2026-06-09T23:00:00Z'));
    const lp = localParts(out);
    expect(lp.hour).toBe(8);
    expect(lp.weekday).toBe('Wed');
  });

  it('after window on a Friday -> Monday 08:00 local', () => {
    // 2026-06-12 is a Friday. 23:00Z = 19:00 EDT Fri -> Mon 08:00
    const out = clampToWindow(new Date('2026-06-12T23:00:00Z'));
    const lp = localParts(out);
    expect(lp.hour).toBe(8);
    expect(lp.weekday).toBe('Mon');
  });

  it('inside window -> unchanged', () => {
    // 2026-06-09T14:00Z = 10:00 EDT Tuesday, inside 08-18
    const input = new Date('2026-06-09T14:00:00Z');
    const out = clampToWindow(input);
    expect(out.getTime()).toBe(input.getTime());
  });

  it('DST fall-back week: Monday 02:00 local -> 08:00 local same day', () => {
    // DST ends 2026-11-01; 2026-11-02 is Monday (EST, offset -5).
    // 02:00 EST Mon = 07:00Z.
    const out = clampToWindow(new Date('2026-11-02T07:00:00Z'));
    const lp = localParts(out);
    expect(lp.hour).toBe(8);
    expect(lp.weekday).toBe('Mon');
  });

  it('honors a custom window config (UTC, Tue-only)', () => {
    const cfg: WindowConfig = { tz: 'UTC', startHour: 9, endHour: 17, days: [2] };
    // 2026-06-08 is Monday; 05:00Z -> next allowed day Tuesday 09:00 UTC
    const out = clampToWindow(new Date('2026-06-08T05:00:00Z'), cfg);
    const lp = localParts(out, 'UTC');
    expect(lp.hour).toBe(9);
    expect(lp.minute).toBe(0);
    expect(lp.weekday).toBe('Tue');
  });

  it('does not mutate the input date', () => {
    const input = new Date('2026-06-09T06:00:00Z');
    const t = input.getTime();
    clampToWindow(input);
    expect(input.getTime()).toBe(t);
  });

  it('exposes a sane DEFAULT_WINDOW', () => {
    expect(DEFAULT_WINDOW.tz).toBe('America/New_York');
    expect(DEFAULT_WINDOW.startHour).toBe(8);
    expect(DEFAULT_WINDOW.endHour).toBe(18);
    expect(DEFAULT_WINDOW.days).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('selectDue', () => {
  it('returns only approved items with scheduled_for <= now, order preserved', () => {
    const now = new Date('2026-06-09T15:00:00Z');
    const past = new Date('2026-06-09T14:00:00Z');
    const future = new Date('2026-06-09T16:00:00Z');
    const items = [
      { id: 'a', status: STATUS.approved, scheduled_for: past }, // due
      { id: 'b', status: STATUS.draft, scheduled_for: past }, // wrong status
      { id: 'c', status: STATUS.approved, scheduled_for: future }, // not yet
      { id: 'd', status: STATUS.approved, scheduled_for: null }, // null excluded
      { id: 'e', status: STATUS.approved, scheduled_for: now }, // exactly now -> due
      { id: 'f', status: STATUS.sent, scheduled_for: past }, // wrong status
    ];
    const due = selectDue(items, now);
    expect(due.map((x) => x.id)).toEqual(['a', 'e']);
  });

  it('returns empty when nothing is due', () => {
    const now = new Date('2026-06-09T15:00:00Z');
    const items = [
      { status: STATUS.draft, scheduled_for: new Date('2026-06-09T14:00:00Z') },
      { status: STATUS.approved, scheduled_for: null },
    ];
    expect(selectDue(items, now)).toEqual([]);
  });
});
