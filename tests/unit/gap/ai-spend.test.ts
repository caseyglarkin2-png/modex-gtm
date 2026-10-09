// @vitest-environment node
/**
 * A01 (GAP OS AI recovery, 2026-10-08): the GAP model spend ledger. Every model call GAP makes is a ledger row with
 * the task, model, tokens and cost (the gateway's reported cost, else a conservative estimate, said so); a call is
 * reserved at its worst-case estimate before it is made so in-flight calls count against the month; the month's
 * ceiling and the per-task budget refuse BEFORE a call, as permanent failures (the item and Casey's decision stay;
 * the task says what to do); a billing, authentication or configuration failure is permanent (one attempt, final);
 * a rate limit or a timeout is transient (the runner's bounded attempts). Unchanged work is never regenerated.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { AIAllProvidersFailed, type AIErrorInfo } from '@/lib/ai/client';
import { estimateCostUsd, gapGenerate, LEDGER_READ_MAX, loadSpend, MODEL_CALL, MODEL_CALL_RESERVED, MODEL_CALL_SUBJECT, monthWindow, spendLimits, type GapGenerate, type GapModelCallContext } from '@/lib/gap/ai/spend';
import { PermanentAgentError } from '@/lib/gap/agents/errors';
import { loadAgentTask, queueAgentTask, runAgentTasks } from '@/lib/gap/agents/tasks';

const NOW = new Date('2026-10-08T15:00:00Z');
const task: GapModelCallContext = { id: 'at_1', kind: 'develop_angle', itemKey: 'signal:s1' };
const env = { GAP_AI_MONTHLY_CEILING_USD: '25', GAP_AI_TASK_BUDGET_USD: '0.10' };
const ok: GapGenerate = async () => ({ text: 'OK', provider: 'ai_gateway', model: 'google/gemini-2.5-flash-lite', usage: { promptTokens: 1200, completionTokens: 300, costUsd: 0.00024 }, errors: [] as AIErrorInfo[] });

describe('A01: the spend ledger', () => {
  it('a call is reserved at its worst-case estimate, then recorded at the reported cost with the task, model and tokens; the month sums the recorded cost', async () => {
    const db = ledgerDb({}, NOW);
    const generate = vi.fn<GapGenerate>(ok);
    const r = await gapGenerate(db.client(), { prompt: 'p'.repeat(4000), maxTokens: 700, tier: 'routine', task, now: NOW }, { generate, env });
    expect(r.text).toBe('OK');
    expect(generate).toHaveBeenCalledWith(expect.any(String), 700, { model: 'google/gemini-2.5-flash-lite', skipControlPlane: true });
    const rows = db.store.gapAuditEvent.filter((e) => e.subject_type === MODEL_CALL_SUBJECT);
    expect(rows.map((e) => e.kind)).toEqual([MODEL_CALL_RESERVED, MODEL_CALL]);
    const done = rows[1].payload as Record<string, unknown>;
    expect(done).toMatchObject({ taskId: 'at_1', taskKind: 'develop_angle', itemKey: 'signal:s1', model: 'google/gemini-2.5-flash-lite', provider: 'ai_gateway', promptTokens: 1200, completionTokens: 300, costUsd: 0.00024, estimated: false, outcome: 'ok' });
    expect(typeof done.callId).toBe('string');
    const spend = await loadSpend(db.client(), { now: NOW, env });
    expect(spend.monthUsd).toBeCloseTo(0.00024, 8);
    expect(spend.calls).toBe(1);
    expect(spend.ceilingUsd).toBe(25);
  });

  it('a provider that reports no cost is charged the conservative estimate from its tokens, and the row says estimated', async () => {
    const db = ledgerDb({}, NOW);
    const generate: GapGenerate = async () => ({ text: 'OK', provider: 'gemini', model: 'gemini-2.5-flash-lite', usage: { promptTokens: 1000, completionTokens: 500, costUsd: null }, errors: [] as AIErrorInfo[] });
    await gapGenerate(db.client(), { prompt: 'p', maxTokens: 700, tier: 'routine', task, now: NOW }, { generate, env });
    const done = db.store.gapAuditEvent.find((e) => e.kind === MODEL_CALL)!.payload as Record<string, unknown>;
    expect(done.estimated).toBe(true);
    expect(done.costUsd).toBeCloseTo(estimateCostUsd('gemini-2.5-flash-lite', 1000, 500), 10);
    expect(estimateCostUsd('gemini-2.5-flash-lite', 1_000_000, 0)).toBeCloseTo(0.1, 6);
    expect(estimateCostUsd('gemini-2.5-flash-lite', 0, 1_000_000)).toBeCloseTo(0.4, 6);
    // An unknown model is estimated at the conservative default, never at zero.
    expect(estimateCostUsd('someone/new-model', 1_000_000, 1_000_000)).toBeGreaterThan(1);
  });

  it('an in-flight reservation (no recorded call yet) counts against the month', async () => {
    const db = ledgerDb({ audit: [{ kind: MODEL_CALL_RESERVED, actor: 'agent', subject_type: MODEL_CALL_SUBJECT, subject_id: 'at_9', payload: { callId: 'c9', estimateUsd: 0.05 }, created_at: new Date(NOW.getTime() - 60_000) }] }, NOW);
    const spend = await loadSpend(db.client(), { now: NOW, env });
    expect(spend.monthUsd).toBeCloseTo(0.05, 8);
    expect(spend.inFlight).toBe(1);
  });

  it('the month ceiling refuses BEFORE a call, permanently, with the recovery in words; the model is never called; a refusal row is written', async () => {
    const db = ledgerDb({ audit: [{ kind: MODEL_CALL, actor: 'agent', subject_type: MODEL_CALL_SUBJECT, subject_id: 'at_0', payload: { callId: 'c0', costUsd: 24.9999, outcome: 'ok' }, created_at: new Date(NOW.getTime() - 3_600_000) }] }, NOW);
    const generate = vi.fn<GapGenerate>(ok);
    const err = await gapGenerate(db.client(), { prompt: 'p'.repeat(4000), maxTokens: 700, tier: 'routine', task, now: NOW }, { generate, env }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PermanentAgentError);
    expect((err as PermanentAgentError).code).toBe('monthly_ceiling');
    expect((err as PermanentAgentError).message).toMatch(/\$25\.00.*October.*GAP_AI_MONTHLY_CEILING_USD/);
    expect(generate).not.toHaveBeenCalled();
    const refused = db.store.gapAuditEvent.filter((e) => e.kind === MODEL_CALL && (e.payload as Record<string, unknown>).outcome === 'refused');
    expect(refused).toHaveLength(1);
    expect((refused[0].payload as Record<string, unknown>).costUsd).toBe(0);
  });

  it('a call whose worst case exceeds the per-task budget is refused before it is made', async () => {
    const db = ledgerDb({}, NOW);
    const generate = vi.fn<GapGenerate>(ok);
    const err = await gapGenerate(db.client(), { prompt: 'p'.repeat(400_000), maxTokens: 700, tier: 'strong', task, now: NOW }, { generate, env: { ...env, GAP_AI_TASK_BUDGET_USD: '0.001' } }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PermanentAgentError);
    expect((err as PermanentAgentError).code).toBe('task_budget');
    expect(generate).not.toHaveBeenCalled();
  });

  it('a prompt is bounded: the context sent never exceeds the cap, and the output tokens never exceed the cap', async () => {
    const db = ledgerDb({}, NOW);
    const generate = vi.fn<GapGenerate>(ok);
    await gapGenerate(db.client(), { prompt: 'x'.repeat(100_000), maxTokens: 9_000, tier: 'routine', task, now: NOW }, { generate, env });
    const call = generate.mock.calls[0]!;
    expect(call[0].length).toBe(spendLimits(env).maxPromptChars);
    expect(call[1]).toBe(spendLimits(env).maxOutputTokens);
  });

  it('every provider failing on billing or authentication is permanent (one attempt, final); a rate limit or timeout is transient; the failure is a ledger row', async () => {
    const billing: GapGenerate = async () => { throw new AIAllProvidersFailed([{ provider: 'ai_gateway', category: 'billing', retryable: false, message: 'Free tier users do not have access to this model' }, { provider: 'openai', category: 'billing', retryable: false, message: 'insufficient_quota' }]); };
    const limited: GapGenerate = async () => { throw new AIAllProvidersFailed([{ provider: 'ai_gateway', category: 'quota', retryable: true, message: '429 rate limit' }]); };
    for (const [generate, code, permanent] of [[billing, 'billing', true], [limited, 'transient', false]] as const) {
      const db = ledgerDb({}, NOW);
      const err = await gapGenerate(db.client(), { prompt: 'p', maxTokens: 100, tier: 'routine', task, now: NOW }, { generate, env }).catch((e: unknown) => e);
      expect(err instanceof PermanentAgentError).toBe(permanent);
      if (permanent) expect((err as PermanentAgentError).code).toBe(code);
      const done = db.store.gapAuditEvent.find((e) => e.kind === MODEL_CALL)!.payload as Record<string, unknown>;
      expect(done.outcome).toBe('failed');
      expect(done.errorCategory).toBe(permanent ? 'billing' : 'quota');
    }
  });

  it('the runner: a permanent error ends the task final on the first attempt; a transient one leaves it queued for the next attempt', async () => {
    const db = ledgerDb({}, NOW);
    const request = { kind: 'develop_angle' as const, itemKey: 'signal:s1', itemToken: '', day: '2026-10-08', revision: 0, request: 'pursue', requestedBy: 'casey', requestedFrom: 'app' };
    const perm = await queueAgentTask(db.client(), request, { now: NOW, actor: 'app' });
    const temp = await queueAgentTask(db.client(), { ...request, itemKey: 'signal:s2' }, { now: NOW, actor: 'app' });
    const report = await runAgentTasks(db.client(), { now: new Date(NOW.getTime() + 1000), max: 5, claimer: 'test', handlers: { develop_angle: async (t) => { if (t.itemKey === 'signal:s1') throw new PermanentAgentError('billing', 'no funded model route: ai_gateway billing'); throw new Error('429 rate limit'); } } });
    expect(report.results.map((r) => r.outcome)).toEqual(['failed', 'retry']);
    expect(await loadAgentTask(db.client(), perm.id)).toMatchObject({ status: 'failed', final: true, attempts: 1, lastError: 'billing: no funded model route: ai_gateway billing' });
    expect(await loadAgentTask(db.client(), temp.id)).toMatchObject({ status: 'queued', final: false, attempts: 1 });
  });

  it('A04: the ledger fails CLOSED for a call: an unreadable ledger or a reservation that cannot be written refuses before any call (permanent, configuration); health still reads soft', async () => {
    const broken = { gapAuditEvent: { findMany: async () => { throw new Error('connection refused'); }, create: async () => undefined } };
    const generate = vi.fn<GapGenerate>(ok);
    const err = await gapGenerate(broken, { prompt: 'p', maxTokens: 100, tier: 'routine', task, now: NOW }, { generate, env }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PermanentAgentError);
    expect((err as PermanentAgentError).code).toBe('configuration');
    expect((err as PermanentAgentError).message).toMatch(/could not be read/);
    expect(generate).not.toHaveBeenCalled();
    expect((await loadSpend(broken, { now: NOW, env })).calls).toBe(0);
    const noWrite = { gapAuditEvent: { findMany: async () => [], create: async () => { throw new Error('disk full'); } } };
    const err2 = await gapGenerate(noWrite, { prompt: 'p', maxTokens: 100, tier: 'routine', task, now: NOW }, { generate, env }).catch((e: unknown) => e);
    expect(err2).toBeInstanceOf(PermanentAgentError);
    expect((err2 as PermanentAgentError).message).toMatch(/could not record the reservation/);
    expect(generate).not.toHaveBeenCalled();
    const huge = { gapAuditEvent: { findMany: async () => Array.from({ length: LEDGER_READ_MAX }, (_, n) => ({ kind: MODEL_CALL, subject_id: 'x', payload: { callId: `c${n}`, costUsd: 0.000001, outcome: 'ok' }, created_at: NOW })), create: async () => undefined } };
    const err3 = await gapGenerate(huge, { prompt: 'p', maxTokens: 100, tier: 'routine', task, now: NOW }, { generate, env }).catch((e: unknown) => e);
    expect((err3 as PermanentAgentError).message).toMatch(/or more rows this month/);
  });

  it('the month window is the calendar month in New York; the limits read the environment with safe defaults', () => {
    expect(monthWindow(new Date('2026-10-31T23:30:00-04:00'))).toEqual({ month: '2026-10', label: 'October', start: new Date('2026-10-01T04:00:00.000Z') });
    expect(spendLimits({})).toMatchObject({ monthlyCeilingUsd: 25, taskBudgetUsd: 0.1, warnFraction: 0.8, maxOutputTokens: 1024 });
    expect(spendLimits({ GAP_AI_MONTHLY_CEILING_USD: 'abc', GAP_AI_TASK_BUDGET_USD: '-1' })).toMatchObject({ monthlyCeilingUsd: 25, taskBudgetUsd: 0.1 });
  });
});
