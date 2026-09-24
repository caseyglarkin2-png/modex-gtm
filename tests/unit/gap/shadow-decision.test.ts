import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordShadowDecision } from '@/lib/gap/automation/shadow';

const NOW = new Date('2026-09-24T12:00:00.000Z');

function input(overrides: Partial<Parameters<typeof recordShadowDecision>[1]> = {}) {
  return {
    accountName: 'Acme Logistics',
    ruleId: 'enroll',
    personaId: 7,
    hypothesisId: 'H1',
    wouldEngine: 'hubspot_sequence' as const,
    now: NOW,
    ...overrides,
  };
}

describe('recordShadowDecision', () => {
  let savedFlag: string | undefined;
  beforeEach(() => {
    savedFlag = process.env.GAP_AUTO_ENROLL_SHADOW;
  });
  afterEach(() => {
    if (savedFlag === undefined) delete process.env.GAP_AUTO_ENROLL_SHADOW;
    else process.env.GAP_AUTO_ENROLL_SHADOW = savedFlag;
  });

  it('flag off (the default): never calls audit, provably', async () => {
    delete process.env.GAP_AUTO_ENROLL_SHADOW;
    const audit = vi.fn();

    const result = await recordShadowDecision({}, input(), { audit });

    expect(result).toEqual({ recorded: false, reason: 'gap_auto_enroll_shadow_disabled' });
    expect(audit).not.toHaveBeenCalled();
  });

  it('flag on: writes an enroll.shadow event with acted_by_system_at explicitly null', async () => {
    process.env.GAP_AUTO_ENROLL_SHADOW = 'true';
    const audit = vi.fn(async () => ({ stored: true, reviewQueued: false }));
    const prisma = { tag: 'the-prisma' };

    const result = await recordShadowDecision(prisma, input(), { audit });

    expect(result).toEqual({ recorded: true });
    expect(audit).toHaveBeenCalledWith(prisma, {
      kind: 'enroll.shadow',
      actor: 'system:shadow',
      subjectType: 'automation_decision',
      subjectId: 'H1',
      payload: {
        accountName: 'Acme Logistics',
        ruleId: 'enroll',
        personaId: 7,
        wouldEngine: 'hubspot_sequence',
        acted_by_system_at: null,
        recordedAt: NOW.toISOString(),
      },
    });
  });

  it('a caller cannot smuggle a non-null acted_by_system_at through the input shape (the type has no such field)', async () => {
    process.env.GAP_AUTO_ENROLL_SHADOW = 'true';
    const audit = vi.fn<(...args: any[]) => Promise<any>>(async () => ({ stored: true, reviewQueued: false }));

    await recordShadowDecision({}, input(), { audit });

    const payload = audit.mock.calls[0][1].payload as Record<string, unknown>;
    expect(payload.acted_by_system_at).toBeNull();
  });
});
