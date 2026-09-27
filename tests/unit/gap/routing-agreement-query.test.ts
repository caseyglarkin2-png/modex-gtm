/**
 * loadAgreementReport (R-B, owner-confirmed finish requirement, 2026-09-24;
 * red team T10, 2026-09-27). Prisma glue over ./agreement.ts: every decision
 * gets `executedEmail` from the send ledger and `open` from recency and
 * supersession.
 */
import { describe, expect, it, vi } from 'vitest';
import { AGREEMENT_OPEN_DAYS, loadAgreementReport } from '@/lib/gap/routing/agreement-query';
import { MANUAL_SENT } from '@/lib/gap/execution/draft-ledger';
import { findManyFrom } from './fixtures/where';

/* eslint-disable @typescript-eslint/no-explicit-any */
const NOW = new Date('2026-09-27T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);

function makePrisma(rows: any[], sends: any[] = [], enrollments: any[] = []) {
  return {
    sequenceEnrollment: { findMany: vi.fn(async (args: any) => findManyFrom(enrollments, args)) },
    routingDecision: { findMany: vi.fn(async (args: any) => (args?.where?.run_id ? rows.filter((r) => r.run_id === args.where.run_id) : rows)) },
    gapAuditEvent: { findMany: vi.fn(async (args: any) => findManyFrom(sends, args)) },
  };
}

function row(over: Record<string, unknown> = {}) {
  return { id: 'd1', run_id: 'run_1', action: 'call_now', rule_id: 'hot_call', human_action: 'called', lane: 'work_queue', persona_id: 7, created_at: daysAgo(1), ...over };
}

/** A manual send in the ledger for decision `decisionId`, person 7. */
function sent(decisionId: string, at: Date, personaId = 7) {
  return {
    subject_type: 'routing_decision',
    subject_id: decisionId,
    kind: MANUAL_SENT,
    created_at: at,
    payload: { engine: 'manual', personaId, recipient: 'buyer@acme.example', senderIdentity: 'casey@yardflow.ai', sequenceVersionId: 'v1', stepIndex: 0, sentAt: at.toISOString() },
  };
}

describe('loadAgreementReport', () => {
  it('reads every card (the whole history decides episodes and credit) and REPORTS only the run asked for', async () => {
    const rows = [row({ id: 'r1', persona_id: 7 }), row({ id: 'r2', run_id: 'run_2', persona_id: 8 })];
    const prisma = makePrisma(rows);
    const r = await loadAgreementReport(prisma, { runId: 'run_1', now: NOW });
    expect(prisma.routingDecision.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    expect(r.totalDecisions).toBe(1);
  });

  it('PROOF: "emailed" with a ledger send on THAT card agrees; the same click with no send does not', async () => {
    const withSend = await loadAgreementReport(makePrisma([row({ action: 'enroll_gap_sequence', human_action: 'emailed' })], [sent('d1', daysAgo(0.5))]), { now: NOW });
    expect(withSend.overall).toMatchObject({ agreements: 1, n: 1 });
    const noSend = await loadAgreementReport(makePrisma([row({ action: 'enroll_gap_sequence', human_action: 'emailed' })]), { now: NOW });
    expect(noSend.overall).toMatchObject({ agreements: 0, unverified: 1, n: 1 });
  });

  it('a send for the PERSON after this card and before their next card counts as this card executed; a send after the next card does not', async () => {
    const rows = [
      row({ id: 'old', action: 'enroll_gap_sequence', human_action: 'emailed', created_at: daysAgo(10) }),
      row({ id: 'new', action: 'call_now', human_action: 'called', created_at: daysAgo(5) }),
    ];
    const before = await loadAgreementReport(makePrisma(rows, [sent('elsewhere', daysAgo(8))]), { now: NOW });
    expect(before.overall).toMatchObject({ agreements: 2, n: 2 });
    const after = await loadAgreementReport(makePrisma(rows, [sent('elsewhere', daysAgo(2))]), { now: NOW });
    expect(after.overall).toMatchObject({ agreements: 1, unverified: 1, n: 2 });
  });

  it('enrolled_by_hand agrees when a live, non-test enrollment of the person started after the card; a test enrollment is no evidence', async () => {
    const rows = [row({ action: 'enroll_gap_sequence', human_action: 'enrolled_by_hand', created_at: daysAgo(2) })];
    const live = await loadAgreementReport(makePrisma(rows, [], [{ persona_id: 7, enrolled_at: daysAgo(1), is_test: false }]), { now: NOW });
    expect(live.overall).toMatchObject({ agreements: 1, n: 1 });
    const test = await loadAgreementReport(makePrisma(rows, [], [{ persona_id: 7, enrolled_at: daysAgo(1), is_test: true }]), { now: NOW });
    expect(test.overall).toMatchObject({ agreements: 0, unverified: 1, n: 1 });
  });

  it('PROOF: a superseded recommendation with no action is unacted (counted); the newest fresh one is pending', async () => {
    const rows = [
      row({ id: 'old', action: 'enroll_gap_sequence', human_action: null, created_at: daysAgo(3) }),
      row({ id: 'new', action: 'call_now', human_action: null, created_at: daysAgo(1) }),
    ];
    const r = await loadAgreementReport(makePrisma(rows), { now: NOW });
    expect(r.overall).toMatchObject({ agreements: 0, unacted: 1, n: 1 });
    expect(r.pending).toBe(1);
  });

  it(`a card older than ${AGREEMENT_OPEN_DAYS} days with no action is unacted even when it is the newest`, async () => {
    const r = await loadAgreementReport(makePrisma([row({ human_action: null, created_at: daysAgo(AGREEMENT_OPEN_DAYS + 1) })]), { now: NOW });
    expect(r.overall).toMatchObject({ unacted: 1, n: 1 });
    expect(r.pending).toBe(0);
  });

  it('a run filter never makes a superseded card look open: supersession reads every card of the person', async () => {
    const rows = [row({ id: 'old', run_id: 'run_1', action: 'enroll_gap_sequence', human_action: null, created_at: daysAgo(3) }), row({ id: 'new', run_id: 'run_2', human_action: null, created_at: daysAgo(1) })];
    const r = await loadAgreementReport(makePrisma(rows), { runId: 'run_1', now: NOW });
    expect(r.overall).toMatchObject({ unacted: 1, n: 1 });
    expect(r.pending).toBe(0);
  });

  it('a row whose action is not a known RoutingAction is dropped, not mis-tallied', async () => {
    const report = await loadAgreementReport(makePrisma([row({ action: 'some_legacy_action' })]), { now: NOW });
    expect(report.totalDecisions).toBe(0);
  });

  it('a row whose human_action is not a known HumanAction reads as no human action', async () => {
    const report = await loadAgreementReport(makePrisma([row({ human_action: 'some_free_text' })]), { now: NOW });
    expect(report.totalDecisions).toBe(1);
    expect(report.pending).toBe(1);
  });

  it('a lane:"blocked" row is excluded entirely, even with a human_action set', async () => {
    const report = await loadAgreementReport(
      makePrisma([
        row({ id: 'd1', action: 'do_not_contact', lane: 'blocked', human_action: 'do_not_contact', rule_id: 'suppressed' }),
        row({ id: 'd2', action: 'call_now', human_action: 'called', persona_id: 8 }),
      ]),
      { now: NOW },
    );
    expect(report.totalDecisions).toBe(1);
    expect(report.overall).toMatchObject({ agreements: 1, disagreements: 0, n: 1 });
  });

  it('Release D review S5: re-running the router cannot move the rate: identical consecutive cards are ONE decision', async () => {
    const daily = [0, 1, 2, 3, 4, 5, 6].map((d) => row({ id: `c${d}`, action: 'nurture', human_action: d === 6 ? 'deferred' : null, created_at: daysAgo(10 - d) }));
    const weekly = [daily[6]];
    const a = await loadAgreementReport(makePrisma(daily), { now: NOW });
    const b = await loadAgreementReport(makePrisma(weekly), { now: NOW });
    expect(a.overall).toMatchObject({ agreements: 1, n: 1 });
    expect(b.overall).toMatchObject({ agreements: 1, n: 1 });
  });

  it('Release D review S5: one send is credited to ONE card (the card it was filed under), never also to a newer card', async () => {
    const rows = [
      row({ id: 'old', action: 'enroll_gap_sequence', human_action: 'emailed', created_at: daysAgo(10) }),
      row({ id: 'new', action: 'one_off_email', human_action: 'emailed', created_at: daysAgo(5) }),
    ];
    const r = await loadAgreementReport(makePrisma(rows, [sent('old', daysAgo(2))]), { now: NOW });
    expect(r.overall).toMatchObject({ agreements: 1, unverified: 1, n: 2 });
  });

  it('Release D review S7: an enrollment never executes a ONE-OFF email recommendation', async () => {
    const rows = [row({ action: 'one_off_email', human_action: 'enrolled_by_hand', created_at: daysAgo(2) })];
    const r = await loadAgreementReport(makePrisma(rows, [], [{ persona_id: 7, enrolled_at: daysAgo(1), is_test: false }]), { now: NOW });
    expect(r.overall).toMatchObject({ agreements: 0, unverified: 1 });
  });

  it('Release D review S7: an enrollment whose start date is a sync placeholder is no evidence', async () => {
    const rows = [row({ action: 'enroll_gap_sequence', human_action: 'enrolled_by_hand', created_at: daysAgo(2) })];
    const r = await loadAgreementReport(makePrisma(rows, [], [{ persona_id: 7, enrolled_at: daysAgo(1), is_test: false, external_state: { enrolled_at_unknown: true } }]), { now: NOW });
    expect(r.overall).toMatchObject({ agreements: 0, unverified: 1 });
  });
});
