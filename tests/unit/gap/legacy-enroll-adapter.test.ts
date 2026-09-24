import { describe, expect, it, vi } from 'vitest';
import { legacyEnrollAdapter, toEnrollInput, toExecutionReceipt } from '@/lib/gap/execution/legacy-enroll-adapter';
import type { ExecutionIntent } from '@/lib/gap/execution/contract';
import { staticSuppressionReader } from '@/lib/gap/routing/suppression-read';

const NOW = new Date('2026-09-24T12:00:00.000Z');

function intent(overrides: Partial<ExecutionIntent> = {}): ExecutionIntent {
  return {
    engine: 'modex_queue',
    personaId: 7,
    hypothesisId: 'H1',
    sequenceVersionId: 'v1',
    stepIndex: 0,
    compileIds: ['c0', 'c1'],
    senderIdentity: 'casey@yardflow.ai',
    idempotencyKey: 'idem_1',
    actor: 'casey@freightroll.com',
    actorKind: 'human',
    mode: 'shadow',
    now: NOW,
    ...overrides,
  };
}

describe('toEnrollInput', () => {
  it('is a pure, faithful field-by-field translation', () => {
    expect(toEnrollInput(intent())).toEqual({
      hypothesisId: 'H1',
      personaId: 7,
      sequenceVersionId: 'v1',
      compileIds: ['c0', 'c1'],
      actor: 'casey@freightroll.com',
      actorKind: 'human',
      mode: 'shadow',
      now: NOW,
      sender: 'casey@yardflow.ai',
    });
  });
});

describe('toExecutionReceipt', () => {
  it('maps a refusal, with detail appended when present', () => {
    expect(toExecutionReceipt({ ok: false, reason: 'suppressed' }, NOW)).toEqual({
      engine: 'modex_queue',
      status: 'refused',
      engineId: null,
      createdAt: NOW,
      refusalReason: 'suppressed',
    });
    expect(toExecutionReceipt({ ok: false, reason: 'active_opportunity', detail: 'meeting' }, NOW)).toEqual({
      engine: 'modex_queue',
      status: 'refused',
      engineId: null,
      createdAt: NOW,
      refusalReason: 'active_opportunity: meeting',
    });
  });

  it('maps a hubspot_native enroll_row (never an engine id: R3-13, the sync cron records it)', () => {
    expect(
      toExecutionReceipt({ ok: true, kind: 'enroll_row', target: 'hubspot_native', mode: 'live', row: {} as any, enrollment: null }, NOW),
    ).toEqual({ engine: 'hubspot_sequence', status: 'queued', engineId: null, createdAt: NOW });
    expect(
      toExecutionReceipt({ ok: true, kind: 'enroll_row', target: 'hubspot_native', mode: 'shadow', row: {} as any, enrollment: null }, NOW),
    ).toEqual({ engine: 'hubspot_sequence', status: 'shadow', engineId: null, createdAt: NOW });
  });

  it('maps modex_shadow to a shadow receipt with no engine id', () => {
    expect(toExecutionReceipt({ ok: true, kind: 'modex_shadow', target: 'modex_queue', mode: 'shadow', wouldBe: {} as any }, NOW)).toEqual({
      engine: 'modex_queue',
      status: 'shadow',
      engineId: null,
      createdAt: NOW,
    });
  });

  it('maps modex_enrolled to a queued receipt naming the draft item id', () => {
    expect(
      toExecutionReceipt(
        { ok: true, kind: 'modex_enrolled', target: 'modex_queue', mode: 'live', draftItemId: 4242, sequenceId: 1, compileId: 'c0', enrollment: { id: 'e1', frozen: true, isTest: false } },
        NOW,
      ),
    ).toEqual({ engine: 'modex_queue', status: 'queued', engineId: '4242', createdAt: NOW });
  });
});

describe('legacyEnrollAdapter', () => {
  it('refuses engine_not_supported_by_legacy_adapter for an engine this adapter never chooses, without calling prisma', async () => {
    const prisma = { prospectingHypothesis: { findUnique: vi.fn() } };
    const receipt = await legacyEnrollAdapter(prisma, intent({ engine: 'gmail_direct' }), { addOne: vi.fn() } as any);
    expect(receipt).toEqual({
      engine: 'gmail_direct',
      status: 'refused',
      engineId: null,
      createdAt: NOW,
      refusalReason: 'engine_not_supported_by_legacy_adapter',
    });
    expect(prisma.prospectingHypothesis.findUnique).not.toHaveBeenCalled();
  });

  it('runs the real enrollFromDecision end to end for engine modex_queue and translates a real refusal (GAP_OS_ENABLED off)', async () => {
    delete process.env.GAP_OS_ENABLED;
    const prisma = { prospectingHypothesis: { findUnique: vi.fn() } };
    const receipt = await legacyEnrollAdapter(prisma, intent(), { addOne: vi.fn(), suppression: staticSuppressionReader('clear') });
    expect(receipt).toEqual({ engine: 'modex_queue', status: 'refused', engineId: null, createdAt: NOW, refusalReason: 'gap_disabled' });
    // Real refusal: never even reached the hypothesis lookup.
    expect(prisma.prospectingHypothesis.findUnique).not.toHaveBeenCalled();
  });
});
