/**
 * X08 (GAP OS sales execution engine, 2026-10-08): the agent task cron route. Thin: auth, the flags, then the drain
 * (src/lib/gap/agents/tasks.ts runAgentTasks with the handler registry). Pinned: 401 without the cron secret; a flag
 * off answers the skip payload and drains nothing; a clean run marks success; a run with a failed task marks the cron
 * failed (visible) and still answers the report; the per-run cap defaults to AGENT_TASKS_PER_RUN and `?max=` bounds it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  run: vi.fn(),
  started: vi.fn(async () => undefined),
  success: vi.fn(async () => undefined),
  skipped: vi.fn(async () => undefined),
  failure: vi.fn(async () => undefined),
}));

vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'route-prisma' } }));
vi.mock('@/lib/cron-monitor', () => ({ markCronStarted: h.started, markCronSuccess: h.success, markCronSkipped: h.skipped, markCronFailure: h.failure }));
vi.mock('@/lib/gap/agents/tasks', () => ({ runAgentTasks: h.run }));
vi.mock('@/lib/gap/agents/handlers', () => ({ agentTaskHandlers: () => ({ revise_message: async () => ({ ok: true, result: {} }) }) }));

const { GET, AGENT_TASKS_PER_RUN } = await import('@/app/api/cron/gap-agent-tasks/route');
const req = (auth = true, q = '') => new Request(`http://localhost/api/cron/gap-agent-tasks${q}`, { headers: auth ? { authorization: 'Bearer s' } : {} });

describe('X08: the agent task cron route', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 's';
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    process.env.GAP_AGENT_TASKS_ENABLED = 'true';
    h.run.mockReset();
    h.run.mockResolvedValue({ claimed: 1, succeeded: 1, failed: 0, results: [{ id: 'at_1', kind: 'revise_message', itemKey: 'k', outcome: 'succeeded' }] });
    h.success.mockClear();
    h.failure.mockClear();
    h.skipped.mockClear();
  });

  it('401 without the secret; the flag off skips and drains nothing', async () => {
    expect((await GET(req(false))).status).toBe(401);
    process.env.GAP_AGENT_TASKS_ENABLED = 'false';
    expect(await (await GET(req())).json()).toEqual({ skipped: true, reason: 'GAP_AGENT_TASKS_ENABLED=false' });
    expect(h.run).not.toHaveBeenCalled();
  });

  it('a clean run marks success with the default cap and the registry; ?max= bounds the cap', async () => {
    expect(await (await GET(req())).json()).toMatchObject({ claimed: 1, succeeded: 1 });
    expect(h.run.mock.calls[0][1]).toMatchObject({ max: AGENT_TASKS_PER_RUN, claimer: 'cron:gap-agent-tasks' });
    expect(Object.keys(h.run.mock.calls[0][1].handlers)).toEqual(['revise_message']);
    expect(h.success).toHaveBeenCalledTimes(1);
    await GET(req(true, '?max=50'));
    expect(h.run.mock.calls[1][1].max).toBe(10);
  });

  it('a run with a failed task marks the cron failed, visible, and still answers the report', async () => {
    h.run.mockResolvedValue({ claimed: 2, succeeded: 1, failed: 1, results: [{ id: 'a', kind: 'revise_message', itemKey: 'k1', outcome: 'succeeded' }, { id: 'b', kind: 'revise_message', itemKey: 'k2', outcome: 'failed', error: 'could_not_satisfy: no fact' }] });
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ failed: 1 });
    expect(h.failure).toHaveBeenCalledTimes(1);
    expect(h.success).not.toHaveBeenCalled();
  });
});
