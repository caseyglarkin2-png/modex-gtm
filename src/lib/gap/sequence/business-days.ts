/**
 * S3-T2: business-day arithmetic for sequence step delays.
 *
 * Deliberately simple: a business day is Monday to Friday in UTC. Weekends
 * are skipped; there is NO holiday calendar. HubSpot's own "business days"
 * delay is the reference behaviour this mirrors for the Top100 lane
 * (0/4/5/6 business days), and HubSpot does not skip holidays either. If a
 * holiday calendar ever matters, add it here and nowhere else.
 *
 * All arithmetic is UTC and preserves the time of day: adding business days
 * moves the calendar date only. A start that falls on a weekend is not
 * snapped forward when zero days are added; the first added day lands on the
 * next weekday.
 */

const DAY_MS = 86_400_000;

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function assertInteger(days: number): void {
  if (!Number.isInteger(days)) throw new Error('business_days_not_integer');
}

/** `from` plus `days` weekdays (Mon to Fri, UTC). Negative counts walk backwards. */
export function addBusinessDays(from: Date, days: number): Date {
  assertInteger(days);
  const step = days < 0 ? -1 : 1;
  let remaining = Math.abs(days);
  let t = from.getTime();
  while (remaining > 0) {
    t += step * DAY_MS;
    if (!isWeekend(new Date(t))) remaining -= 1;
  }
  return new Date(t);
}

/**
 * Count of weekdays strictly after the calendar date of `a` up to and
 * including the calendar date of `b` (UTC). Negative when `b` precedes `a`.
 * Inverse of `addBusinessDays` for weekday starts.
 */
export function businessDaysBetween(a: Date, b: Date): number {
  const dayA = Math.floor(a.getTime() / DAY_MS);
  const dayB = Math.floor(b.getTime() / DAY_MS);
  if (dayA === dayB) return 0;
  const sign = dayB > dayA ? 1 : -1;
  let count = 0;
  for (let d = dayA + sign; sign > 0 ? d <= dayB : d >= dayB; d += sign) {
    if (!isWeekend(new Date(d * DAY_MS))) count += 1;
  }
  return count * sign;
}

/** How many calendar days `businessDays` business days span when starting at `from`. */
export function toCalendarDelayDays(from: Date, businessDays: number): number {
  const to = addBusinessDays(from, businessDays);
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}
