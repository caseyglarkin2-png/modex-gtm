// @vitest-environment node
/**
 * C50 (the commercial-context audit, 2026-10-08): every model path is metered without losing task truth. Two
 * competing workers cannot spend beyond the ceiling (the later reservation yields after a post-reservation re-read
 * and makes no call); a failed reservation makes no call; a fallback model is priced at the model that answered; a
 * model outage preserves the decision and the work for the next attempt; every refusal carries its reason.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import type { AIErrorInfo } from '@/lib/ai/client';
import { committedAt, estimateCostUsd, gapGenerate, loadSpend, MODEL_CALL, MODEL_CALL_RESERVED, MODEL_CALL_SUBJECT, type GapGenerate } from '@/lib/gap/ai/spend';
import { PermanentAgentError } from '@/lib/gap/agents/errors';

const NOW = new Date('2026-10-08T15:00:00Z');
const env = { GAP_AI_MONTHLY_CEILING_USD: '25', GAP_AI_TASK_BUDGET_USD: '0.10' };
const ok: GapGenerate = async () => ({ text: 'OK', provider: 'ai_gateway', model: 'google/gemini-2.5-flash-lite', usage: { promptTokens: 1200, completionTokens: 300, costUsd: 0.00024 }, errors: [] as AIErrorInfo[] });
const spent = (usd: number) => ({ kind: MODEL_CALL, actor: 'agent', subject_type: MODEL_CALL_SUBJECT, subject_id: 'at_0', payload: { callId: 'c0', costUsd: usd, outcome: 'ok' }, created_at: new Date(NOW.getTime() - 3_600_000) });

describe('C50: the ceiling holds under a race', () => {
  it('two workers that both pass the pre-check and both reserve: exactly one calls the model; the other yields with monthly_ceiling, its reservation is released, and the month never passes the ceiling', async () => {
    // Prompt of 400 chars = 100 prompt tokens + 1000 output tokens on flash-lite: $0.00041 each; the month holds $24.9994, room for one.
    const db = ledgerDb({ audit: [spent(24.9994)] }, NOW);
    const inner = db.client() as { gapAuditEvent: { findMany: (q: unknown) => Promise<unknown[]>; create: (q: unknown) => Promise<unknown> } };
    // A barrier: the first two ledger reads (both pre-checks) are answered only after both were asked, so both pass.
    let asked = 0;
    let release: () => void = () => undefined;
    const both = new Promise<void>((r) => { release = r; });
    const client = { gapAuditEvent: { create: inner.gapAuditEvent.create, findMany: async (q: unknown) => { asked += 1; if (asked <= 2) { if (asked === 2) release(); await both; } return inner.gapAuditEvent.findMany(q); } } };
    const generate = vi.fn<GapGenerate>(ok);
    const prompt = 'x'.repeat(400);
    const results = await Promise.all([
      gapGenerate(client, { prompt, maxTokens: 1000, tier: 'routine', task: { id: 'at_a', kind: 'develop_angle', itemKey: 'signal:a' }, now: NOW }, { generate, env }).then(() => 'ok', (e: unknown) => e),
      gapGenerate(client, { prompt, maxTokens: 1000, tier: 'routine', task: { id: 'at_b', kind: 'develop_angle', itemKey: 'signal:b' }, now: NOW }, { generate, env }).then(() => 'ok', (e: unknown) => e),
    ]);
    expect(generate).toHaveBeenCalledTimes(1);
    const refused = results.filter((r) => r !== 'ok') as PermanentAgentError[];
    expect(results.filter((r) => r === 'ok')).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(refused[0]).toBeInstanceOf(PermanentAgentError);
    expect(refused[0].code).toBe('monthly_ceiling');
    expect(refused[0].message).toMatch(/calls already in flight/);
    const after = await loadSpend(db.client(), { now: NOW, env });
    expect(after.inFlight).toBe(0);
    expect(after.monthUsd).toBeLessThanOrEqual(25);
    expect(after.refused).toBe(1);
    expect(after.calls).toBe(2);
    const rows = db.store.gapAuditEvent.filter((e) => e.subject_type === MODEL_CALL_SUBJECT && e.kind === MODEL_CALL_RESERVED);
    expect(rows).toHaveLength(2);
  });

  it('committedAt counts recorded cost and the reservations ordered at or before the one asked, never the later ones', () => {
    const t = (s: number) => new Date(NOW.getTime() + s * 1000);
    const rows = [
      { id: '1', kind: MODEL_CALL, subject_id: 'a', payload: { callId: 'c_done', costUsd: 1 }, created_at: t(0) },
      { id: '2', kind: MODEL_CALL_RESERVED, subject_id: 'b', payload: { callId: 'c_first', estimateUsd: 0.5 }, created_at: t(1) },
      { id: '3', kind: MODEL_CALL_RESERVED, subject_id: 'c', payload: { callId: 'c_second', estimateUsd: 0.25 }, created_at: t(2) },
      { id: '4', kind: MODEL_CALL_RESERVED, subject_id: 'd', payload: { callId: 'c_third', estimateUsd: 0.125 }, created_at: t(3) },
    ] as never[];
    expect(committedAt(rows, 'c_first')).toBeCloseTo(1.5, 8);
    expect(committedAt(rows, 'c_second')).toBeCloseTo(1.75, 8);
    expect(committedAt(rows, 'c_third')).toBeCloseTo(1.875, 8);
    // Rows that share a created_at are ordered by callId, so the order is total and the same for every reader.
    const tie = rows.map((r) => ({ ...(r as object), created_at: t(1) })) as never[];
    expect(committedAt(tie, 'c_first')).toBeCloseTo(1.5, 8);
    expect(committedAt(tie, 'c_third')).toBeCloseTo(1.875, 8);
  });

  it('a fallback model is priced at the model that answered, and the row says which one and that the price is estimated', async () => {
    const db = ledgerDb({}, NOW);
    const fallback: GapGenerate = async () => ({ text: 'OK', provider: 'openai', model: 'openai/gpt-5-mini', usage: { promptTokens: 1000, completionTokens: 200 }, errors: [{ provider: 'ai_gateway', category: 'rate_limit', message: '429' }] as AIErrorInfo[] });
    await gapGenerate(db.client(), { prompt: 'p', maxTokens: 200, tier: 'routine', task: { id: 'at_f', kind: 'develop_angle', itemKey: 'signal:f' }, now: NOW }, { generate: fallback, env });
    const call = db.store.gapAuditEvent.find((e) => e.kind === MODEL_CALL)!;
    expect(call.payload).toMatchObject({ outcome: 'ok', model: 'openai/gpt-5-mini', estimated: true, costUsd: estimateCostUsd('openai/gpt-5-mini', 1000, 200), providerErrors: ['ai_gateway:rate_limit'] });
    expect(estimateCostUsd('openai/gpt-5-mini', 1000, 200)).toBeGreaterThan(estimateCostUsd('google/gemini-2.5-flash-lite', 1000, 200));
  });

  it('a model outage is a transient failure: the call is recorded failed with its reason, the reservation is closed, and the error is not permanent (the runner keeps the task and the decision for the next attempt)', async () => {
    const db = ledgerDb({}, NOW);
    const outage: GapGenerate = async () => { throw new Error('fetch failed: ETIMEDOUT'); };
    const err = await gapGenerate(db.client(), { prompt: 'p', maxTokens: 100, tier: 'routine', task: { id: 'at_o', kind: 'develop_angle', itemKey: 'signal:o' }, now: NOW }, { generate: outage, env }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(PermanentAgentError);
    expect((err as Error).message).toMatch(/^transient: fetch failed/);
    const call = db.store.gapAuditEvent.find((e) => e.kind === MODEL_CALL)!;
    expect(call.payload).toMatchObject({ outcome: 'failed', permanent: false, estimated: true, errorCategory: 'outage' });
    expect((call.payload as { costUsd: number }).costUsd).toBeGreaterThan(0);
    expect((await loadSpend(db.client(), { now: NOW, env })).inFlight).toBe(0);
  });
});
