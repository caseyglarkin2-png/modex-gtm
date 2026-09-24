/**
 * loadAgreementReport (R-B, owner-confirmed finish requirement, 2026-09-24).
 * Prisma glue over ./agreement.ts's pure computeAgreement.
 */
import { describe, expect, it, vi } from 'vitest';
import { loadAgreementReport } from '@/lib/gap/routing/agreement-query';

/* eslint-disable @typescript-eslint/no-explicit-any */
function makePrisma(rows: any[]) {
  return { routingDecision: { findMany: vi.fn(async () => rows) } };
}

function row(over: Record<string, unknown> = {}) {
  return { id: 'd1', action: 'call_now', rule_id: 'hot_call', human_action: 'called', ...over };
}

describe('loadAgreementReport', () => {
  it('scopes to one run when runId is given, and reads every decision otherwise', async () => {
    const prisma = makePrisma([row()]);
    await loadAgreementReport(prisma, { runId: 'run_1' });
    expect(prisma.routingDecision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { run_id: 'run_1' } }),
    );

    const prisma2 = makePrisma([row()]);
    await loadAgreementReport(prisma2);
    expect(prisma2.routingDecision.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('computes agreement from the rows fetched', async () => {
    const prisma = makePrisma([
      row({ id: 'd1', action: 'call_now', human_action: 'called' }),
      row({ id: 'd2', action: 'enroll_gap_sequence', human_action: 'emailed' }),
    ]);
    const report = await loadAgreementReport(prisma);
    expect(report.overall).toEqual({ agreements: 1, disagreements: 1, rate: 0.5, n: 2 });
  });

  it('a row with human_action null is comparable-zero, not a disagreement', async () => {
    const prisma = makePrisma([row({ human_action: null })]);
    const report = await loadAgreementReport(prisma);
    expect(report.overall).toEqual({ agreements: 0, disagreements: 0, rate: null, n: 0 });
    expect(report.totalDecisions).toBe(1);
  });

  /**
   * Both columns are free `String` at the DB layer. Mutate the guards away
   * (accept any string as a RoutingAction/HumanAction) and this goes RED:
   * a stale or hand-edited row would silently join the wrong bucket or
   * crash `agrees()` on an unmapped key instead of being dropped.
   */
  it('a row whose action is not a known RoutingAction is dropped, not mis-tallied', async () => {
    const prisma = makePrisma([row({ action: 'some_legacy_action' })]);
    const report = await loadAgreementReport(prisma);
    expect(report.totalDecisions).toBe(0);
  });

  it('a row whose human_action is not a known HumanAction reads as no human action (comparable-zero), the row itself is kept', async () => {
    const prisma = makePrisma([row({ human_action: 'some_free_text' })]);
    const report = await loadAgreementReport(prisma);
    expect(report.totalDecisions).toBe(1);
    expect(report.overall.n).toBe(0);
  });
});
