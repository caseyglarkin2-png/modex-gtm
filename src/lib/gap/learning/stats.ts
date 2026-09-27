/**
 * Honest rates (red team T10, 2026-09-27). Pure.
 *
 * Every Learning number is a proportion over a real denominator, and a
 * proportion from a handful of people is noise. Two rules:
 *
 *   - Below RELIABLE_N the percentage is SUPPRESSED (`value: null`,
 *     `status: 'insufficient'`); the raw k/n stays visible, labeled as an
 *     early observation, never as a rate. 4/5 is not "80%".
 *   - At or above RELIABLE_N the value carries a 95% Wilson score interval,
 *     so a reader sees how wide the uncertainty still is.
 *
 * A 0/0 is `status: 'no_data'`: nothing happened, which is not a signal.
 */

/** Below this denominator a proportion is an early observation, not a rate. */
export const RELIABLE_N = 20;
/** Two-sided 95% normal quantile. */
const Z95 = 1.959963984540054;

export interface Interval {
  low: number;
  high: number;
}

/** The Wilson score interval for k successes in n trials (null when n is 0). */
export function wilson(k: number, n: number, z: number = Z95): Interval | null {
  if (n <= 0) return null;
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return { low: Math.max(0, centre - half), high: Math.min(1, centre + half) };
}

export type RateStatus = 'no_data' | 'insufficient' | 'reliable';

export interface HonestRate {
  numerator: number;
  denominator: number;
  n: number;
  /** The proportion, ONLY when n >= RELIABLE_N; null otherwise. */
  value: number | null;
  /** 95% Wilson interval, only when n >= RELIABLE_N. */
  interval: Interval | null;
  status: RateStatus;
}

export function honestRate(numerator: number, denominator: number): HonestRate {
  const n = denominator;
  if (n <= 0) return { numerator, denominator, n: 0, value: null, interval: null, status: 'no_data' };
  if (n < RELIABLE_N) return { numerator, denominator, n, value: null, interval: null, status: 'insufficient' };
  return { numerator, denominator, n, value: numerator / n, interval: wilson(numerator, n), status: 'reliable' };
}

/** A human reading of a rate that never presents a small sample as a percentage. */
export function describeRate(r: Pick<HonestRate, 'numerator' | 'denominator' | 'status' | 'value' | 'interval'>): string {
  if (r.status === 'no_data') return 'no data yet';
  if (r.status === 'insufficient') return `${r.numerator}/${r.denominator}, early observation (n < ${RELIABLE_N}), not a rate`;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return `${pct(r.value ?? 0)} (${r.numerator}/${r.denominator}, 95% CI ${pct(r.interval?.low ?? 0)}-${pct(r.interval?.high ?? 0)})`;
}
