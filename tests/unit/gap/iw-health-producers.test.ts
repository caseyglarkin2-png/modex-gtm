/**
 * IW13: the Intelligence producers health component. Three states (healthy with every importing producer named,
 * degraded naming the stalled or failed one and since when, healthy "No producer has imported yet"), the unread case
 * (no component, so older reports keep their shape), the unreadable case, and the other components unchanged.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHealth, HEALTH_REPAIR, type HealthInputs } from '@/lib/gap/health/health';
import { loadHealthInputs } from '@/lib/gap/health/load';
import type { ProducerStatus } from '@/lib/gap/signals/producer-status';
import { ledgerDb } from './fixtures/ledger-db';
import { INTEL_IMPORTED_EVENT } from '@/lib/gap/signals/intelligence-record';

const NOW = new Date('2026-10-09T18:00:00.000Z');
const min = (n: number) => new Date(NOW.getTime() - n * 60_000);
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

function healthy(): HealthInputs {
  return {
    mailbox: { senderConfigured: true, lastSuccessAt: min(4), lastFailureAt: null, consecutiveFailures: 0, lastMessage: 'apply: 3 inbox messages' },
    hubspot: { configured: true, ok: true, ms: 420, error: null },
    suppression: { configured: true, verdict: 'clear', ms: 3100, error: null },
    sender: { configured: true, mailbox: 'casey@yardflow.ai' },
    routing: { lastRunAt: min(12) },
    briefing: { enabled: true, to: 'casey@freightroll.com', hourNy: 7, lastSuccessAt: min(55), consecutiveFailures: 0, lastMessage: 'sent', sentTodayAt: min(235), failedToday: 0 },
    agents: { enabled: true, lastSuccessAt: min(3), consecutiveFailures: 0, lastMessage: 'ran 0', queued: 0, oldestQueuedAt: null, failedFinalToday: 0 },
    model: { month: '2026-10', label: 'October', monthUsd: 0.42, ceilingUsd: 25, warnFraction: 0.8, calls: 12, failed: 0, refused: 0, inFlight: 0, lastCall: { at: min(20).toISOString(), outcome: 'ok', model: 'google/gemini-2.5-flash-lite', errorCategory: null } },
  };
}

function status(over: Partial<ProducerStatus>): ProducerStatus {
  return { producer: 'yards_first_brief', label: 'Yards First Brief', cadenceDays: 1, lastImportAt: day(0.2).toISOString(), lastRunId: 'r', lastReportedOn: '2026-10-09', lastCounts: { accepted: 3, revised: 0, duplicates: 0, invalid: 0 }, lastProducerState: { status: 'ok', detail: null }, cursor: null, totalItems: 3, totalReports: 1, state: 'current', line: 'Yards First Brief: last import Oct 9, 2026 (1 report, 3 items, reports through Oct 9, 2026); current.', ...over };
}

const comp = (i: HealthInputs) => evaluateHealth(i, NOW).components.find((c) => c.key === 'producers');

describe('the Intelligence producers component', () => {
  it('not read: no component, the report keeps its nine', () => {
    const r = evaluateHealth(healthy(), NOW);
    expect(r.components).toHaveLength(9);
    expect(r.components.map((c) => c.key)).not.toContain('producers');
    expect(r.overall).toBe('HEALTHY');
  });

  it('none has imported: HEALTHY, said so', () => {
    const none = comp({ ...healthy(), producers: [] })!;
    expect(none).toMatchObject({ key: 'producers', name: 'Intelligence producers', state: 'HEALTHY', label: 'No producer has imported yet' });
    const never = comp({ ...healthy(), producers: [status({ state: 'never', lastImportAt: null, line: 'Yards First Brief: never imported.' }), status({ producer: 'vault', label: 'the vault', state: 'never', lastImportAt: null, line: 'the vault: never synced; the cron waits for its GitHub token.' })] })!;
    expect(never.state).toBe('HEALTHY');
    expect(never.label).toBe('No producer has imported yet');
    expect(never.detail).toBe('Yards First Brief: never imported. the vault: never synced; the cron waits for its GitHub token.');
    expect(never.owner).toBeUndefined();
  });

  it('every importing producer current: HEALTHY, each named; a never one is not named', () => {
    const c = comp({ ...healthy(), producers: [status({}), status({ producer: 'vault', label: 'the vault', line: 'the vault: synced Oct 9, 2026 (7434 notes) by the local push; the cron waits for its GitHub token.' }), status({ producer: 'clawd_signal_hunter', label: 'Clawd signal hunter', state: 'never', lastImportAt: null, line: 'Clawd signal hunter: never imported.' })] })!;
    expect(c.state).toBe('HEALTHY');
    expect(c.label).toBe('Intelligence producers current: Yards First Brief, the vault');
    expect(c.detail).toContain('7434 notes');
    expect(evaluateHealth({ ...healthy(), producers: [status({})] }, NOW).overall).toBe('HEALTHY');
  });

  it('a stalled or failed producer: DEGRADED, named with since when, with the owner and the retry', () => {
    const inputs: HealthInputs = { ...healthy(), producers: [status({}), status({ producer: 'codex_hubspot_report', label: 'HubSpot report', state: 'stale', lastImportAt: day(3).toISOString(), line: 'HubSpot report: last import Oct 6, 2026 (0 reports, 1 item); stalled since Oct 6, 2026.' }), status({ producer: 'clawd_signal_hunter', label: 'Clawd signal hunter', state: 'failed', lastImportAt: day(1).toISOString(), lastProducerState: { status: 'failed', detail: 'the export was missing' }, line: 'Clawd signal hunter: last import Oct 8, 2026 (0 reports, 0 items); the last run failed (the export was missing).' })] };
    const r = evaluateHealth(inputs, NOW);
    const c = r.components.find((x) => x.key === 'producers')!;
    expect(c.state).toBe('DEGRADED');
    expect(c.label).toBe('Intelligence producers: HubSpot report stalled since Oct 6, 2026; Clawd signal hunter failed Oct 8, 2026');
    expect(c.detail).toContain('the export was missing');
    expect(c.owner).toBe('operator');
    expect(c.retry).toBe(HEALTH_REPAIR.producers.retry);
    expect(r.overall).toBe('DEGRADED');
    expect(r.headline).toContain('Intelligence producers: HubSpot report stalled since Oct 6, 2026');
  });

  it('unreadable (null): DEGRADED, said so, never a throw', () => {
    expect(comp({ ...healthy(), producers: null })).toMatchObject({ state: 'DEGRADED', label: 'Intelligence producers not readable' });
  });

  it('the other components are unchanged by the producers input', () => {
    const base = evaluateHealth(healthy(), NOW).components;
    const withP = evaluateHealth({ ...healthy(), producers: [status({ state: 'stale', lastImportAt: day(3).toISOString() })] }, NOW).components.filter((c) => c.key !== 'producers');
    expect(withP).toEqual(base);
  });
});

describe('the loader', () => {
  it('reads the producers through a client that has the signal table, and leaves them unread on one that does not', async () => {
    const db = ledgerDb({ audit: [{ id: 'e1', kind: INTEL_IMPORTED_EVENT, actor: 'casey:import', subject_type: 'producer', subject_id: 'yards_first_brief', payload: { runId: 'r', runIds: ['r'], cursor: null, accepted: 2, duplicates: 0, revised: 0, invalid: 0, reportedOnFrom: '2026-10-09', reportedOnTo: '2026-10-09', producerState: { status: 'ok' }, at: day(0.1).toISOString() }, created_at: day(0.1) }] }, NOW);
    const inputs = await loadHealthInputs(db.client() as never, { env: {}, clock: () => NOW.getTime() });
    expect(inputs.producers?.find((s) => s.producer === 'yards_first_brief')).toMatchObject({ state: 'current', lastCounts: { accepted: 2 } });
    const c = evaluateHealth(inputs, NOW).components.find((x) => x.key === 'producers')!;
    expect(c.label).toBe('Intelligence producers current: Yards First Brief');
    const bare = await loadHealthInputs({ gapAuditEvent: { findMany: async () => [], findFirst: async () => null, count: async () => 0 } } as never, { env: {}, clock: () => NOW.getTime() });
    expect(bare.producers).toBeUndefined();
    expect(evaluateHealth(bare, NOW).components.map((x) => x.key)).not.toContain('producers');
    // A signal table whose count throws: the read fails soft to null and health says unreadable.
    const broken = await loadHealthInputs({ gapAuditEvent: { findMany: async () => { throw new Error('ledger down'); }, findFirst: async () => null, count: async () => 0 }, gapSignal: { count: async () => { throw new Error('relation missing'); } } } as never, { env: {}, clock: () => NOW.getTime() });
    expect(evaluateHealth(broken, NOW).components.find((x) => x.key === 'producers')!.label).toMatch(/not readable|No producer has imported yet/);
  });
});
