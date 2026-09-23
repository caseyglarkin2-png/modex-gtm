/**
 * GAP Prospecting OS signal freshness (Sprint 1, S1-T5).
 *
 * A pure TTL table keyed by `SignalType`. A signal past its expiry may still
 * inform history but must not seed a new hypothesis. Nothing here touches
 * the database; the registry and the adapters call in.
 */

import type { SignalType } from '../taxonomy';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days a signal of each type stays fresh after it was observed. */
export const SIGNAL_TTL_DAYS: Record<SignalType, number> = {
  acquisition: 180,
  new_site: 120,
  site_expansion: 120,
  automation_program: 120,
  job_posting: 45,
  technology_signal: 90,
  news: 45,
  intent: 14,
  website_behavior: 14,
  manual_research: 90,
  other: 45,
};

/**
 * The instant a signal stops being fresh. An explicit expiry (for example an
 * EvidenceRecord's `fresh_until`) wins; otherwise observedAt plus the TTL for
 * the type. Never mutates `observedAt`.
 */
export function freshnessExpiresAt(
  type: SignalType,
  observedAt: Date,
  explicit?: Date | null,
): Date {
  if (explicit) return new Date(explicit.getTime());
  return new Date(observedAt.getTime() + SIGNAL_TTL_DAYS[type] * DAY_MS);
}

/**
 * True while `now` is strictly before the expiry. A signal with no expiry
 * never goes stale. The boundary instant itself is stale.
 */
export function isFresh(expiresAt: Date | null | undefined, now: Date): boolean {
  if (!expiresAt) return true;
  return now.getTime() < expiresAt.getTime();
}
