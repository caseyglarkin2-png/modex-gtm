/**
 * Phase 2 A3: the GAP health strip. The overall state is the WORST
 * dependency; a failed dependency is never reported green because another
 * works; probes that cannot answer are failures, not skips.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { evaluateHealth, type HealthInputs } from '@/lib/gap/health/health';
import { loadHealthInputs } from '@/lib/gap/health/load';
import { HealthStrip } from '@/components/gap/health-strip';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const min = (n: number) => new Date(NOW.getTime() - n * 60_000);

function healthy(): HealthInputs {
  return {
    mailbox: { senderConfigured: true, lastSuccessAt: min(4), lastFailureAt: null, consecutiveFailures: 0, lastMessage: 'apply: 3 inbox messages' },
    hubspot: { configured: true, ok: true, ms: 420, error: null },
    suppression: { configured: true, verdict: 'clear', ms: 3100, error: null },
    sender: { configured: true, mailbox: 'casey@yardflow.ai' },
    routing: { lastRunAt: min(12) },
  };
}

describe('evaluateHealth', () => {
  it('everything answering: HEALTHY with the routing freshness in the headline', () => {
    const r = evaluateHealth(healthy(), NOW);
    expect(r.overall).toBe('HEALTHY');
    expect(r.headline).toBe('Healthy · routing refreshed 12m ago');
  });

  it('HubSpot down: BLOCKED with the fail-closed line, even though every other dependency is fine', () => {
    const i = healthy();
    i.hubspot = { configured: true, ok: false, ms: 8000, error: 'no answer in 8000ms' };
    const r = evaluateHealth(i, NOW);
    expect(r.overall).toBe('BLOCKED');
    expect(r.headline).toBe('HubSpot opportunity truth unavailable · cold actions fail closed');
    expect(r.components.find((c) => c.key === 'hubspot')!.detail).toContain('no answer in 8000ms');
  });

  it('mailbox stale: DEGRADED, replies may be delayed; three hours: BLOCKED', () => {
    const i = healthy();
    i.mailbox.lastSuccessAt = min(50);
    expect(evaluateHealth(i, NOW)).toMatchObject({ overall: 'DEGRADED', headline: 'Mailbox intake stale (50m ago) · replies may be delayed' });
    i.mailbox.lastSuccessAt = min(200);
    expect(evaluateHealth(i, NOW).overall).toBe('BLOCKED');
  });

  it('suppression unreachable: BLOCKED, outbound blocked', () => {
    const i = healthy();
    i.suppression = { configured: true, verdict: 'unknown', ms: 8000, error: 'verdict unknown' };
    expect(evaluateHealth(i, NOW)).toMatchObject({ overall: 'BLOCKED', headline: 'Suppression authority unreachable · outbound blocked' });
  });

  it('several failures: the headline names every one, worst first', () => {
    const i = healthy();
    i.mailbox.lastSuccessAt = min(50);
    i.hubspot = { configured: false, ok: false, ms: null, error: null };
    i.suppression = { configured: true, verdict: null, ms: 8000, error: 'no answer' };
    const r = evaluateHealth(i, NOW);
    expect(r.overall).toBe('BLOCKED');
    expect(r.headline.indexOf('HubSpot')).toBeLessThan(r.headline.indexOf('Mailbox'));
    expect(r.headline).toContain('Suppression authority unreachable');
  });

  it('no routing run and an unconfigured sender are never reported healthy', () => {
    const i = healthy();
    i.routing.lastRunAt = null;
    i.sender = { configured: false, mailbox: null };
    const r = evaluateHealth(i, NOW);
    expect(r.overall).toBe('BLOCKED');
    expect(r.components.filter((c) => c.state === 'HEALTHY').map((c) => c.key).sort()).toEqual(['hubspot', 'mailbox', 'suppression']);
  });
});

describe('loadHealthInputs: probes never throw and never read as green', () => {
  const env = { HUBSPOT_ACCESS_TOKEN: 't', CLAWD_CONTROL_PLANE_URL: 'https://clawd', CLAWD_CONTROL_PLANE_TOKEN: 'k', GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'r' };
  const prisma = (cronValue: unknown, runAt: Date | null) => ({
    systemConfig: { findUnique: vi.fn(async () => (cronValue ? { value: JSON.stringify(cronValue) } : null)) },
    gapAuditEvent: { findFirst: vi.fn(async () => (runAt ? { created_at: runAt } : null)) },
  });

  it('a HubSpot ping that throws and a suppression read that throws are both failures', async () => {
    const i = await loadHealthInputs(prisma({ lastSuccessAt: min(3).toISOString(), consecutiveFailures: 0 }, min(5)), {
      env,
      hubspotPing: async () => { throw new Error('401 expired token'); },
      suppressionRead: async () => { throw new Error('ECONNREFUSED'); },
    });
    const r = evaluateHealth(i, NOW);
    expect(r.components.find((c) => c.key === 'hubspot')).toMatchObject({ state: 'BLOCKED' });
    expect(r.components.find((c) => c.key === 'hubspot')!.detail).toContain('401 expired token');
    expect(r.components.find((c) => c.key === 'suppression')).toMatchObject({ state: 'BLOCKED' });
    expect(r.overall).toBe('BLOCKED');
  });

  it('no credentials at all: HubSpot, suppression, sender and mailbox are all blocked', async () => {
    const i = await loadHealthInputs(prisma(null, null), { env: {} });
    const r = evaluateHealth(i, NOW);
    for (const k of ['hubspot', 'suppression', 'sender', 'mailbox']) expect(r.components.find((c) => c.key === k)!.state).toBe('BLOCKED');
  });

  it('all answering: healthy inputs from the cron state and the last routing run', async () => {
    const i = await loadHealthInputs(prisma({ lastSuccessAt: min(3).toISOString(), consecutiveFailures: 0, lastMessage: 'apply' }, min(5)), {
      env,
      hubspotPing: async () => undefined,
      suppressionRead: async () => ({ verdict: 'clear' }),
    });
    expect(evaluateHealth(i, NOW).overall).toBe('HEALTHY');
  });
});

describe('<HealthStrip>', () => {
  it('renders the headline and every component under the disclosure', () => {
    const i = healthy();
    i.hubspot = { configured: true, ok: false, ms: 8000, error: 'timeout' };
    render(<HealthStrip initial={evaluateHealth(i, NOW)} />);
    expect(screen.getByTestId('health-strip')).toHaveAttribute('data-state', 'BLOCKED');
    expect(screen.getByTestId('health-headline')).toHaveTextContent('HubSpot opportunity truth unavailable · cold actions fail closed');
    expect(screen.getByTestId('health-hubspot')).toHaveAttribute('data-state', 'BLOCKED');
    expect(screen.getByTestId('health-mailbox')).toHaveAttribute('data-state', 'HEALTHY');
  });

  it('a strip that cannot load says so; it is never green by default', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }));
    render(<HealthStrip />);
    expect(screen.getByTestId('health-strip')).toHaveAttribute('data-state', 'loading');
    await waitFor(() => expect(screen.getByTestId('health-strip')).toHaveAttribute('data-state', 'unknown'));
    expect(screen.getByTestId('health-strip')).toHaveTextContent('could not be checked');
    f.mockRestore();
  });
});
