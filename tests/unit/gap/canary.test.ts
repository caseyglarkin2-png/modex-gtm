import { describe, expect, it } from 'vitest';
import { checkCanaryCaps, type CanaryConfig, type CanaryDayState } from '@/lib/gap/automation/canary';

const NOW = new Date('2026-10-15T12:00:00.000Z');

function config(overrides: Partial<CanaryConfig> = {}): CanaryConfig {
  return {
    allowlist: ['Acme Logistics'],
    perRuleCap: 2,
    dailyCap: 5,
    startedAt: new Date('2026-10-01T00:00:00.000Z'),
    ...overrides,
  };
}

function state(overrides: Partial<CanaryDayState> = {}): CanaryDayState {
  return { countByRule: {}, totalToday: 0, ...overrides };
}

describe('checkCanaryCaps', () => {
  it('allows an allowlisted account under every cap', () => {
    const r = checkCanaryCaps(config(), state(), { accountName: 'Acme Logistics', ruleId: 'enroll', now: NOW });
    expect(r).toEqual({ ok: true });
  });

  it('refuses canary_not_started before startedAt, even for an allowlisted account', () => {
    const r = checkCanaryCaps(config({ startedAt: new Date('2026-11-01T00:00:00.000Z') }), state(), {
      accountName: 'Acme Logistics',
      ruleId: 'enroll',
      now: NOW,
    });
    expect(r).toEqual({ ok: false, reason: 'canary_not_started' });
  });

  it('fails closed: an account not on the allowlist is refused, never defaulted to allowed', () => {
    const r = checkCanaryCaps(config(), state(), { accountName: 'Somewhere Else Inc', ruleId: 'enroll', now: NOW });
    expect(r).toEqual({ ok: false, reason: 'account_not_on_allowlist' });
  });

  it('an empty allowlist refuses everything, never fails open', () => {
    const r = checkCanaryCaps(config({ allowlist: [] }), state(), { accountName: 'Acme Logistics', ruleId: 'enroll', now: NOW });
    expect(r).toEqual({ ok: false, reason: 'account_not_on_allowlist' });
  });

  it('refuses per_rule_cap_reached once that rule has hit its own cap, even under the daily cap', () => {
    const r = checkCanaryCaps(config({ perRuleCap: 2 }), state({ countByRule: { enroll: 2 }, totalToday: 2 }), {
      accountName: 'Acme Logistics',
      ruleId: 'enroll',
      now: NOW,
    });
    expect(r).toEqual({ ok: false, reason: 'per_rule_cap_reached' });
  });

  it('a different rule id is unaffected by another rule already being at its cap', () => {
    const r = checkCanaryCaps(config({ perRuleCap: 2, dailyCap: 5 }), state({ countByRule: { enroll: 2 }, totalToday: 2 }), {
      accountName: 'Acme Logistics',
      ruleId: 'call_now',
      now: NOW,
    });
    expect(r).toEqual({ ok: true });
  });

  it('refuses daily_cap_reached once the total is at the daily cap, checked after the per-rule cap', () => {
    const r = checkCanaryCaps(config({ perRuleCap: 10, dailyCap: 3 }), state({ countByRule: { enroll: 1 }, totalToday: 3 }), {
      accountName: 'Acme Logistics',
      ruleId: 'enroll',
      now: NOW,
    });
    expect(r).toEqual({ ok: false, reason: 'daily_cap_reached' });
  });

  it('a cap of 0 refuses everything for that dimension', () => {
    const r = checkCanaryCaps(config({ dailyCap: 0 }), state(), { accountName: 'Acme Logistics', ruleId: 'enroll', now: NOW });
    expect(r).toEqual({ ok: false, reason: 'daily_cap_reached' });
  });
});
