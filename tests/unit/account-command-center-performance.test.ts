import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_COMMAND_CENTER_PERFORMANCE_BUDGETS,
  evaluateAccountCommandCenterPerformance,
} from '@/lib/proof/account-command-center-performance';

describe('account command center performance budgets', () => {
  it('passes when all measured interactions are within budget', () => {
    const result = evaluateAccountCommandCenterPerformance([
      { metric: 'initial_page_load_ms', durationMs: 2_400 },
      { metric: 'intel_refresh_ms', durationMs: 900 },
      { metric: 'compose_open_ms', durationMs: 350 },
      { metric: 'send_job_refresh_ms', durationMs: 700 },
    ]);

    expect(result.pass).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('reports the exact metric and overage when a budget is missed', () => {
    const result = evaluateAccountCommandCenterPerformance([
      {
        metric: 'intel_refresh_ms',
        durationMs: ACCOUNT_COMMAND_CENTER_PERFORMANCE_BUDGETS.intel_refresh_ms + 250,
      },
    ]);

    expect(result.pass).toBe(false);
    expect(result.failures).toEqual([
      {
        metric: 'intel_refresh_ms',
        durationMs: ACCOUNT_COMMAND_CENTER_PERFORMANCE_BUDGETS.intel_refresh_ms + 250,
        budgetMs: ACCOUNT_COMMAND_CENTER_PERFORMANCE_BUDGETS.intel_refresh_ms,
        overByMs: 250,
      },
    ]);
  });
});
