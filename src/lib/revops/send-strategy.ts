export type PacingMode = 'safe' | 'balanced' | 'aggressive';

export type SendStrategy = {
  timezone_window: {
    timezone: string;
    start_hour: number;
    end_hour: number;
  };
  daily_cap: number;
  domain_cap: number;
  pacing_mode: PacingMode;
};

export const SEND_STRATEGY_PRESETS: Record<PacingMode, SendStrategy> = {
  safe: {
    timezone_window: { timezone: 'America/Chicago', start_hour: 9, end_hour: 16 },
    daily_cap: 120,
    domain_cap: 4,
    pacing_mode: 'safe',
  },
  balanced: {
    timezone_window: { timezone: 'America/Chicago', start_hour: 8, end_hour: 17 },
    daily_cap: 240,
    domain_cap: 8,
    pacing_mode: 'balanced',
  },
  aggressive: {
    timezone_window: { timezone: 'America/Chicago', start_hour: 7, end_hour: 18 },
    daily_cap: 400,
    domain_cap: 12,
    pacing_mode: 'aggressive',
  },
};

export function getStrategyPreset(mode: PacingMode): SendStrategy {
  return SEND_STRATEGY_PRESETS[mode];
}

export function getStrategyWarning(mode: PacingMode): string {
  if (mode === 'safe') return 'Lowest deliverability risk, slower throughput.';
  if (mode === 'balanced') return 'Balanced throughput and risk profile.';
  return 'Higher throughput with elevated domain and fatigue risk.';
}

export function validateSendStrategy(strategy: SendStrategy): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (strategy.timezone_window.start_hour < 0 || strategy.timezone_window.start_hour > 23) {
    errors.push('start_hour must be between 0 and 23.');
  }
  if (strategy.timezone_window.end_hour < 1 || strategy.timezone_window.end_hour > 24) {
    errors.push('end_hour must be between 1 and 24.');
  }
  if (strategy.timezone_window.start_hour >= strategy.timezone_window.end_hour) {
    errors.push('start_hour must be less than end_hour.');
  }
  if (strategy.daily_cap < 1 || strategy.daily_cap > 10000) {
    errors.push('daily_cap must be between 1 and 10000.');
  }
  if (strategy.domain_cap < 1 || strategy.domain_cap > strategy.daily_cap) {
    errors.push('domain_cap must be >= 1 and <= daily_cap.');
  }
  return { ok: errors.length === 0, errors };
}

export function isWithinTimezoneWindow(
  window: SendStrategy['timezone_window'],
  now = new Date(),
): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: window.timezone,
  });
  const hourToken = formatter.formatToParts(now).find((part) => part.type === 'hour')?.value ?? '0';
  const hour = Number.parseInt(hourToken, 10);
  if (!Number.isFinite(hour)) return false;
  return hour >= window.start_hour && hour < window.end_hour;
}
