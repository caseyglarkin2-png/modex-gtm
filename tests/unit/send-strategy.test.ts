import { describe, expect, it } from 'vitest';
import {
  getStrategyPreset,
  getStrategyWarning,
  isWithinTimezoneWindow,
  validateSendStrategy,
} from '@/lib/revops/send-strategy';

describe('send strategy controls', () => {
  it('returns stable presets and warnings', () => {
    const safe = getStrategyPreset('safe');
    const balanced = getStrategyPreset('balanced');
    const aggressive = getStrategyPreset('aggressive');

    expect(safe.daily_cap).toBeLessThan(balanced.daily_cap);
    expect(aggressive.domain_cap).toBeGreaterThan(balanced.domain_cap);
    expect(getStrategyWarning('aggressive')).toContain('Higher throughput');
  });

  it('validates strategy model and timezone window checks', () => {
    const valid = validateSendStrategy(getStrategyPreset('balanced'));
    expect(valid.ok).toBe(true);

    const invalid = validateSendStrategy({
      timezone_window: { timezone: 'America/Chicago', start_hour: 18, end_hour: 9 },
      daily_cap: 100,
      domain_cap: 200,
      pacing_mode: 'balanced',
    });
    expect(invalid.ok).toBe(false);

    const inWindow = isWithinTimezoneWindow(
      { timezone: 'UTC', start_hour: 2, end_hour: 4 },
      new Date('2026-05-04T03:00:00Z'),
    );
    expect(inWindow).toBe(true);
  });
});
