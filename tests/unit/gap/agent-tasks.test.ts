// @vitest-environment node
/**
 * X08 (GAP OS sales execution engine, 2026-10-08): durable agent tasks as ledger rows. No job table exists (ResearchRun
 * is written after the run; GenerationJob never retries), so a task is a chain of append-only rows (queued, claimed,
 * succeeded, failed, superseded) folded into one state. Pinned: a claim is exclusive (a second claimer the same
 * instant gets nothing); a lease outlives the function limit and an expired lease is reclaimed with the attempt
 * counted at the claim (a killed handler never retries forever); completion is fenced (a zombie finisher of an older
 * attempt cannot overwrite a newer one); three failures end the task as final; a handler's own refusal
 * (could_not_satisfy) is final at once, not a retry; queueing the same kind on the same item supersedes the queued
 * one; the runner records a success or a failure for every claimed task and never throws past a handler.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { AGENT_TASK_MAX_ATTEMPTS, AGENT_TASK_LEASE_MS, claimAgentTasks, completeAgentTask, failAgentTask, listAgentTasks, loadAgentTask, queueAgentTask, runAgentTasks } from '@/lib/gap/agents/tasks';

const NOW = new Date('2026-10-08T15:00:00Z');
const later = (ms: number) => new Date(NOW.getTime() + ms);

const request = { kind: 'revise_message' as const, itemKey: 'first_touch:dec-1', itemToken: 'a'.repeat(32), day: '2026-10-08', revision: 0, request: 'too generic, make it about the Tulsa gate', requestedBy: 'casey@freightroll.com', requestedFrom: 'gmail:cmd-1' };

describe('X08: queue and fold', () => {
  it('a queued task folds to queued with its request; queueing the same kind on the same item supersedes the earlier queued one', async () => {
    const db = ledgerDb({}, NOW);
    const a = await queueAgentTask(db.client(), request, { now: NOW, actor: 'cron' });
    const t = await loadAgentTask(db.client(), a.id);
    expect(t).toMatchObject({ id: a.id, kind: 'revise_message', status: 'queued', attempts: 0, itemKey: 'first_touch:dec-1', request: request.request });
    const b = await queueAgentTask(db.client(), { ...request, request: 'shorter, and name the Tulsa site' }, { now: later(1000), actor: 'cron' });
    expect((await loadAgentTask(db.client(), a.id))?.status).toBe('superseded');
    expect((await loadAgentTask(db.client(), b.id))?.status).toBe('queued');
    expect(a.superseded).toEqual([]);
    expect(b.superseded).toEqual([a.id]);
    const list = await listAgentTasks(db.client(), { now: later(1000) });
    expect(list.map((x) => [x.id, x.status])).toEqual([[a.id, 'superseded'], [b.id, 'queued']]);
  });
});

describe('X08: claims, leases and fences', () => {
  it('a claim is exclusive, counts the attempt, leases past the function limit; completion is fenced', async () => {
    const db = ledgerDb({}, NOW);
    const a = await queueAgentTask(db.client(), request, { now: NOW, actor: 'cron' });
    const first = await claimAgentTasks(db.client(), { now: later(10), max: 5, claimer: 'inst-1' });
    expect(first.map((c) => c.id)).toEqual([a.id]);
    expect(first[0].attempt).toBe(1);
    expect(new Date(first[0].leaseUntil).getTime() - later(10).getTime()).toBe(AGENT_TASK_LEASE_MS);
    expect(AGENT_TASK_LEASE_MS).toBeGreaterThan(300_000);
    const second = await claimAgentTasks(db.client(), { now: later(20), max: 5, claimer: 'inst-2' });
    expect(second).toEqual([]);
    expect((await loadAgentTask(db.client(), a.id))).toMatchObject({ status: 'running', attempts: 1 });
    // A zombie finisher with a stale fence cannot complete it.
    expect(await completeAgentTask(db.client(), { id: a.id, fence: 'not-the-fence', result: { text: 'x' }, now: later(30) })).toBe(false);
    expect((await loadAgentTask(db.client(), a.id))?.status).toBe('running');
    expect(await completeAgentTask(db.client(), { id: a.id, fence: first[0].fence, result: { subject: 's', body: 'b' }, now: later(40) })).toBe(true);
    const done = await loadAgentTask(db.client(), a.id);
    expect(done).toMatchObject({ status: 'succeeded', result: { subject: 's', body: 'b' } });
    expect(await claimAgentTasks(db.client(), { now: later(50), max: 5, claimer: 'inst-3' })).toEqual([]);
  });

  it('an expired lease is reclaimed with the next attempt; a stale fence from the dead attempt cannot finish; after the limit the task is final', async () => {
    const db = ledgerDb({}, NOW);
    const a = await queueAgentTask(db.client(), request, { now: NOW, actor: 'cron' });
    const c1 = await claimAgentTasks(db.client(), { now: later(10), max: 5, claimer: 'inst-1' });
    expect(await claimAgentTasks(db.client(), { now: later(AGENT_TASK_LEASE_MS - 1000), max: 5, claimer: 'inst-2' })).toEqual([]);
    const c2 = await claimAgentTasks(db.client(), { now: later(AGENT_TASK_LEASE_MS + 20), max: 5, claimer: 'inst-2' });
    expect(c2.map((c) => c.attempt)).toEqual([2]);
    expect(await completeAgentTask(db.client(), { id: a.id, fence: c1[0].fence, result: {}, now: later(AGENT_TASK_LEASE_MS + 30) })).toBe(false);
    await failAgentTask(db.client(), { id: a.id, fence: c2[0].fence, error: 'provider 503', now: later(AGENT_TASK_LEASE_MS + 40) });
    expect((await loadAgentTask(db.client(), a.id))).toMatchObject({ status: 'queued', attempts: 2, lastError: 'provider 503' });
    const c3 = await claimAgentTasks(db.client(), { now: later(AGENT_TASK_LEASE_MS + 50), max: 5, claimer: 'inst-3' });
    expect(c3.map((c) => c.attempt)).toEqual([AGENT_TASK_MAX_ATTEMPTS]);
    await failAgentTask(db.client(), { id: a.id, fence: c3[0].fence, error: 'provider 503 again', now: later(AGENT_TASK_LEASE_MS + 60) });
    expect((await loadAgentTask(db.client(), a.id))).toMatchObject({ status: 'failed', attempts: 3, final: true });
    expect(await claimAgentTasks(db.client(), { now: later(AGENT_TASK_LEASE_MS + 70), max: 5, claimer: 'inst-4' })).toEqual([]);
  });
});

describe('X08: runAgentTasks', () => {
  it('runs each claimed task through its handler, records the result, treats a handler refusal as final and a throw as a retryable failure, never throws past a handler', async () => {
    const db = ledgerDb({}, NOW);
    const ok = await queueAgentTask(db.client(), request, { now: NOW, actor: 'cron' });
    const refused = await queueAgentTask(db.client(), { ...request, itemKey: 'first_touch:dec-2' }, { now: later(1), actor: 'cron' });
    const thrown = await queueAgentTask(db.client(), { ...request, itemKey: 'first_touch:dec-3' }, { now: later(2), actor: 'cron' });
    const unknown = await queueAgentTask(db.client(), { ...request, kind: 'prepare_call' as never, itemKey: 'first_touch:dec-4' }, { now: later(3), actor: 'cron' });
    const handler = vi.fn(async (task: { itemKey: string }) => {
      if (task.itemKey === 'first_touch:dec-2') return { ok: false as const, reason: 'could_not_satisfy', detail: 'no verified fact names the gate' };
      if (task.itemKey === 'first_touch:dec-3') throw new Error('llm timeout');
      return { ok: true as const, result: { subject: 'Tulsa gate', body: 'b' } };
    });
    const report = await runAgentTasks(db.client(), { now: later(10), max: 10, claimer: 'inst-1', handlers: { revise_message: handler } });
    expect(report).toMatchObject({ claimed: 4, succeeded: 1, failed: 3 });
    expect(handler).toHaveBeenCalledTimes(3);
    expect((await loadAgentTask(db.client(), ok.id))).toMatchObject({ status: 'succeeded', result: { subject: 'Tulsa gate' } });
    expect((await loadAgentTask(db.client(), refused.id))).toMatchObject({ status: 'failed', final: true, lastError: 'could_not_satisfy: no verified fact names the gate' });
    expect((await loadAgentTask(db.client(), thrown.id))).toMatchObject({ status: 'queued', attempts: 1, lastError: 'llm timeout' });
    expect((await loadAgentTask(db.client(), unknown.id))).toMatchObject({ status: 'failed', final: true, lastError: 'no_handler: prepare_call' });
    expect(report.results.find((r) => r.id === ok.id)).toMatchObject({ outcome: 'succeeded' });
  });
});
