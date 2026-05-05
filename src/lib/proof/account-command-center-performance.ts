export type AccountCommandCenterPerformanceMetric =
  | 'initial_page_load_ms'
  | 'intel_refresh_ms'
  | 'compose_open_ms'
  | 'send_job_refresh_ms';

export type AccountCommandCenterPerformanceSample = {
  metric: AccountCommandCenterPerformanceMetric;
  durationMs: number;
};

export const ACCOUNT_COMMAND_CENTER_PERFORMANCE_BUDGETS: Record<AccountCommandCenterPerformanceMetric, number> = {
  initial_page_load_ms: 12_000,
  intel_refresh_ms: 5_000,
  compose_open_ms: 2_500,
  send_job_refresh_ms: 4_000,
};

export function evaluateAccountCommandCenterPerformance(samples: AccountCommandCenterPerformanceSample[]) {
  const failures = samples
    .filter((sample) => sample.durationMs > ACCOUNT_COMMAND_CENTER_PERFORMANCE_BUDGETS[sample.metric])
    .map((sample) => ({
      ...sample,
      budgetMs: ACCOUNT_COMMAND_CENTER_PERFORMANCE_BUDGETS[sample.metric],
      overByMs: sample.durationMs - ACCOUNT_COMMAND_CENTER_PERFORMANCE_BUDGETS[sample.metric],
    }));

  return {
    pass: failures.length === 0,
    failures,
  };
}
