/**
 * GAP Prospecting OS, Sprint 7: canary configuration and its caps.
 *
 * Per spec section 10: "Canary config lives in SystemConfig
 * (gap_auto_enroll_canary: allowlist, per-rule cap, daily cap, startedAt)."
 * This module is the pure cap-checking logic; the SystemConfig read/write
 * is the caller's concern (kept out of this file so it never needs to touch
 * `src/lib/gap/learning/**` or any other module another ticket owns).
 *
 * Never mutates anything: `checkCanaryCaps` only answers whether an
 * account/rule pair is currently allowed under the canary's own limits.
 */

export const CANARY_CONFIG_KEY = 'gap_auto_enroll_canary' as const;

export interface CanaryConfig {
  /** Account names eligible for canary auto-enroll. Empty means nothing is eligible (fail closed, not fail open). */
  allowlist: readonly string[];
  /** Max auto-enrollments for one rule id in one UTC day. */
  perRuleCap: number;
  /** Max total auto-enrollments across all rules in one UTC day. */
  dailyCap: number;
  startedAt: Date;
}

export interface CanaryDayState {
  /** Auto-enrollments already recorded today, keyed by ruleId, count. */
  countByRule: Readonly<Record<string, number>>;
  /** Total auto-enrollments already recorded today, across every rule. */
  totalToday: number;
}

export type CanaryRefusal =
  | 'canary_not_started'
  | 'account_not_on_allowlist'
  | 'per_rule_cap_reached'
  | 'daily_cap_reached';

export type CanaryCheckResult = { ok: true } | { ok: false; reason: CanaryRefusal };

/**
 * Pure. Fails closed on every ambiguous case: an account not explicitly on
 * the allowlist is refused, never defaulted to allowed; a cap of 0 refuses
 * everything for that dimension.
 */
export function checkCanaryCaps(
  config: CanaryConfig,
  state: CanaryDayState,
  input: { accountName: string; ruleId: string; now: Date },
): CanaryCheckResult {
  if (input.now.getTime() < config.startedAt.getTime()) {
    return { ok: false, reason: 'canary_not_started' };
  }
  if (!config.allowlist.includes(input.accountName)) {
    return { ok: false, reason: 'account_not_on_allowlist' };
  }
  const ruleCount = state.countByRule[input.ruleId] ?? 0;
  if (ruleCount >= config.perRuleCap) {
    return { ok: false, reason: 'per_rule_cap_reached' };
  }
  if (state.totalToday >= config.dailyCap) {
    return { ok: false, reason: 'daily_cap_reached' };
  }
  return { ok: true };
}
