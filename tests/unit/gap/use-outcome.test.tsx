import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UseOutcome } from '@/components/gap/use-outcome';

describe('<UseOutcome>', () => {
  it('reports routed, blocked and failed people separately, with the failed account reason (partial failure is not a recommendation)', () => {
    render(
      <UseOutcome
        approved={6}
        inUse={6}
        routing={{
          ok: true,
          runId: 'run-1',
          counts: { ready: 3, research: 1, blocked: 1, failed: 1 },
          failures: [{ accountName: 'Kroger', reason: 'account_timeout' }],
        }}
      />,
    );
    expect(screen.getByTestId('use-outcome-lanes').textContent).toBe('3 ready to contact · 1 need research · 1 blocked · 1 failed');
    expect(screen.getByTestId('use-outcome-failures').textContent).toContain('Kroger (account_timeout)');
    expect(screen.getByTestId('use-outcome-failures').textContent).toContain('Nothing was sent');
  });

  it('no failures: no failure line', () => {
    render(<UseOutcome approved={1} inUse={1} routing={{ ok: true, runId: 'r', counts: { ready: 1 }, failures: [] }} />);
    expect(screen.queryByTestId('use-outcome-failures')).toBeNull();
  });
});
