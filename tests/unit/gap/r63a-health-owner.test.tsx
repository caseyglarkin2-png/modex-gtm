/**
 * R63-A S16: "Blocked: Mailbox intake has never completed · replies are not being read" named no owner and no next
 * step. Every component that is not healthy carries who repairs it and the retry path (as the R65 operations lines
 * do), and the strip says the worst one's on the line itself.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { evaluateHealth, type HealthInputs } from '@/lib/gap/health/health';
import { HealthStrip } from '@/components/gap/health-strip';

const NOW = new Date('2026-10-07T15:00:00Z');
const inputs = (over: Partial<HealthInputs> = {}): HealthInputs => ({
  mailbox: { senderConfigured: true, lastSuccessAt: null, lastFailureAt: null, consecutiveFailures: 0, lastMessage: null },
  hubspot: { configured: true, ok: true, ms: 200, error: null },
  suppression: { configured: true, verdict: 'clear', ms: 200, error: null },
  sender: { configured: true, mailbox: 'casey@yardflow.ai' },
  routing: { lastRunAt: new Date('2026-10-07T12:00:00Z') },
  ...over,
});

describe('R63-A S16: a blocked line names its owner and the next step', () => {
  it('mailbox intake that never completed: the operator, and the run to retry', () => {
    const r = evaluateHealth(inputs(), NOW);
    const m = r.components.find((c) => c.key === 'mailbox')!;
    expect(m).toMatchObject({ state: 'BLOCKED', owner: 'operator' });
    expect(m.retry).toBe('Read the last run message in the details; fix its cause, then run /api/cron/gap-mailbox/?mode=apply once with the cron secret (it also runs every 10 minutes on its own)');
    // A healthy component carries no repair line.
    expect(r.components.find((c) => c.key === 'hubspot')).not.toHaveProperty('owner');
    render(<HealthStrip initial={r} />);
    expect(screen.getByTestId('health-repair')).toHaveTextContent('Owner: operator. Next: Read the last run message in the details; fix its cause, then run /api/cron/gap-mailbox/?mode=apply once with the cron secret');
    expect(screen.getByTestId('health-mailbox-repair')).toBeInTheDocument();
    expect(screen.queryByTestId('health-hubspot-repair')).toBeNull();
  });

  it('every failing dependency has an owner and a retry path; a healthy report shows none', () => {
    const bad = evaluateHealth(inputs({ hubspot: { configured: false, ok: false, ms: null, error: null }, suppression: { configured: false, verdict: null, ms: null, error: null }, sender: { configured: false, mailbox: null }, routing: { lastRunAt: null } }), NOW);
    for (const c of bad.components.filter((x) => x.state !== 'HEALTHY')) {
      expect(c.owner, c.key).toBe('operator');
      expect(c.retry, c.key).toMatch(/\S/);
    }
    const ok = evaluateHealth(inputs({ mailbox: { senderConfigured: true, lastSuccessAt: new Date('2026-10-07T14:55:00Z'), lastFailureAt: null, consecutiveFailures: 0, lastMessage: null } }), NOW);
    render(<HealthStrip initial={ok} />);
    expect(screen.queryByTestId('health-repair')).toBeNull();
  });
});
