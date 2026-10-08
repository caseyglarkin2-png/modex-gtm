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
    // X20a: the briefing and agent-task crons (hour 7 New York; NOW is 11:00 New York; sent at 7:05).
    briefing: { enabled: true, to: 'casey@freightroll.com', hourNy: 7, lastSuccessAt: min(55), consecutiveFailures: 0, lastMessage: 'sent', sentTodayAt: min(235), failedToday: 0 },
    agents: { enabled: true, lastSuccessAt: min(3), consecutiveFailures: 0, lastMessage: 'ran 0', queued: 0, oldestQueuedAt: null, failedFinalToday: 0 },
  };
}

describe('evaluateHealth', () => {
  it('everything answering: HEALTHY with the routing freshness in the headline', () => {
    const r = evaluateHealth(healthy(), NOW);
    expect(r.overall).toBe('HEALTHY');
    expect(r.headline).toBe('Healthy · recommendations refreshed 12m ago');
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
    expect(r.components.filter((c) => c.state === 'HEALTHY').map((c) => c.key).sort()).toEqual(['agents', 'briefing', 'hubspot', 'mailbox', 'suppression']);
  });
});

describe('loadHealthInputs: probes never throw and never read as green', () => {
  const env = { HUBSPOT_ACCESS_TOKEN: 't', CLAWD_CONTROL_PLANE_URL: 'https://clawd', CLAWD_CONTROL_PLANE_TOKEN: 'k', GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'r' };
  const prisma = (cronValue: unknown, runAt: Date | null) => ({
    systemConfig: { findUnique: vi.fn(async () => (cronValue ? { value: JSON.stringify(cronValue) } : null)) },
    gapAuditEvent: { findMany: vi.fn(async () => (runAt ? [{ created_at: runAt, payload: { dryRun: false, failed: [] } }] : [])) },
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

describe('X20a: the briefing and agent-task crons on health', () => {
  const comp = (i: HealthInputs, key: string) => evaluateHealth(i, NOW).components.find((c) => c.key === key)!;

  it('the briefing: off is healthy and says so; no address is degraded; sent today is healthy with the time; after the hour, unsent past the grace, is degraded; failed today is degraded; before the hour is due', () => {
    const base = healthy();
    expect(comp(base, 'briefing')).toMatchObject({ state: 'HEALTHY', label: 'Briefing sent 7:05 AM' });
    expect(comp({ ...base, briefing: { ...base.briefing, enabled: false } }, 'briefing')).toMatchObject({ state: 'HEALTHY', label: 'Morning briefing off' });
    expect(comp({ ...base, briefing: { ...base.briefing, to: null } }, 'briefing')).toMatchObject({ state: 'DEGRADED', label: 'No briefing address · the briefing cannot go out', owner: 'operator' });
    expect(comp({ ...base, briefing: { ...base.briefing, sentTodayAt: null } }, 'briefing')).toMatchObject({ state: 'DEGRADED', label: "Today's briefing has not gone out (due 7 AM)" });
    expect(comp({ ...base, briefing: { ...base.briefing, sentTodayAt: null, failedToday: 2 } }, 'briefing')).toMatchObject({ state: 'DEGRADED', label: "Today's briefing failed (2 attempts) · the mailbox or the sender" });
    expect(comp({ ...base, briefing: { ...base.briefing, sentTodayAt: null, hourNy: 13 } }, 'briefing')).toMatchObject({ state: 'HEALTHY', label: 'Briefing due 1 PM' });
    expect(comp({ ...base, briefing: { ...base.briefing, sentTodayAt: null, hourNy: 10 } }, 'briefing')).toMatchObject({ state: 'HEALTHY', label: 'Briefing due now (10 AM)' });
  });

  it('agent tasks: off is healthy and says so; never run, stale, waiting too long or failed today are degraded', () => {
    const base = healthy();
    expect(comp(base, 'agents')).toMatchObject({ state: 'HEALTHY', label: 'Agent tasks 3m ago' });
    expect(comp({ ...base, agents: { ...base.agents, enabled: false } }, 'agents')).toMatchObject({ state: 'HEALTHY', label: 'Agent tasks off' });
    expect(comp({ ...base, agents: { ...base.agents, lastSuccessAt: null } }, 'agents')).toMatchObject({ state: 'DEGRADED', label: 'Agent tasks have never run · REVISE and objections wait' });
    expect(comp({ ...base, agents: { ...base.agents, lastSuccessAt: min(45) } }, 'agents')).toMatchObject({ state: 'DEGRADED', label: 'Agent tasks stale (45m ago) · REVISE and objections wait' });
    expect(comp({ ...base, agents: { ...base.agents, queued: 2, oldestQueuedAt: min(25) } }, 'agents')).toMatchObject({ state: 'DEGRADED', label: '2 tasks waiting 25m ago' });
    expect(comp({ ...base, agents: { ...base.agents, queued: 1, oldestQueuedAt: min(2) } }, 'agents')).toMatchObject({ state: 'HEALTHY' });
    expect(comp({ ...base, agents: { ...base.agents, failedFinalToday: 1 } }, 'agents')).toMatchObject({ state: 'DEGRADED', label: '1 task failed today · read its error', retry: expect.stringContaining('REVISE') });
  });

  it('the loader reads both cron states by key, the seller settings, the briefing row for the day and the task rows; a client without those reads answers soft', async () => {
    const env = { GAP_BRIEFING_ENABLED: 'true', GAP_AGENT_TASKS_ENABLED: 'true', GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'r' };
    const values: Record<string, string> = {
      'cron:gap-mailbox': JSON.stringify({ lastSuccessAt: min(3).toISOString(), consecutiveFailures: 0 }),
      'cron:gap-briefing': JSON.stringify({ lastSuccessAt: min(55).toISOString(), consecutiveFailures: 0, lastMessage: 'sent' }),
      'cron:gap-agent-tasks': JSON.stringify({ lastSuccessAt: min(4).toISOString(), consecutiveFailures: 1, lastMessage: 'ran 1' }),
      'gap:seller:settings': JSON.stringify({ briefingTo: 'casey@freightroll.com', briefingHourNy: 7, commandSenders: ['casey@freightroll.com'], mode: 'review', targets: {} }),
    };
    const findFirst = vi.fn(async (q: { where: { kind?: string; subject_id?: string } }) => (q.where.kind === 'briefing.sent' && q.where.subject_id === '2026-09-28' ? { created_at: min(235) } : null));
    const prisma = {
      systemConfig: { findUnique: vi.fn(async (q: { where: { key: string } }) => (values[q.where.key] ? { key: q.where.key, value: values[q.where.key] } : null)) },
      gapAuditEvent: { findMany: vi.fn(async () => []), findFirst, count: vi.fn(async () => 0) },
    };
    const i = await loadHealthInputs(prisma, { env, clock: () => NOW.getTime() });
    expect(i.briefing).toMatchObject({ enabled: true, to: 'casey@freightroll.com', hourNy: 7, consecutiveFailures: 0, failedToday: 0 });
    expect(i.briefing.sentTodayAt?.toISOString()).toBe(min(235).toISOString());
    expect(i.briefing.lastSuccessAt?.toISOString()).toBe(min(55).toISOString());
    expect(i.agents).toMatchObject({ enabled: true, consecutiveFailures: 1, lastMessage: 'ran 1', queued: 0, oldestQueuedAt: null, failedFinalToday: 0 });
    const bare = await loadHealthInputs({ systemConfig: { findUnique: vi.fn(async () => null) }, gapAuditEvent: { findMany: vi.fn(async () => []) } }, { env: {} });
    expect(bare.briefing).toMatchObject({ enabled: false, to: null, sentTodayAt: null, lastSuccessAt: null });
    expect(bare.agents).toMatchObject({ enabled: false, lastSuccessAt: null, queued: 0 });
  });
});

describe('X15d: the degraded line lives in System at the foot; the head shows only a block', () => {
  it('head placement renders nothing while healthy or degraded, the full strip when blocked, and the could-not-check line when the read fails', async () => {
    const degraded = healthy();
    degraded.routing.lastRunAt = null;
    const { container, unmount } = render(<HealthStrip placement="head" initial={evaluateHealth(degraded, NOW)} />);
    expect(container.querySelector('[data-testid="health-strip"]')).toBeNull();
    unmount();
    const blocked = healthy();
    blocked.hubspot = { configured: true, ok: false, ms: 8000, error: 'timeout' };
    render(<HealthStrip placement="head" initial={evaluateHealth(blocked, NOW)} />);
    expect(screen.getByTestId('health-strip')).toHaveAttribute('data-state', 'BLOCKED');
    expect(screen.getByTestId('health-headline').textContent).toContain('HubSpot opportunity truth unavailable');
  });

  it('foot placement (the default) renders the full strip whatever the state', () => {
    const degraded = healthy();
    degraded.routing.lastRunAt = null;
    render(<HealthStrip initial={evaluateHealth(degraded, NOW)} />);
    expect(screen.getByTestId('health-strip')).toHaveAttribute('data-state', 'DEGRADED');
  });
});
