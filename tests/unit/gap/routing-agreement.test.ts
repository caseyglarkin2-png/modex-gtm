/**
 * R-B (owner-confirmed finish requirement, 2026-09-24): routing
 * recommendation vs actual human action.
 *
 * Mutation proof this file owns: feed computeAgreement a decision with
 * `humanAction: null` and assert it never lands in overall.agreements or
 * overall.disagreements (only totalDecisions counts it) -> "never infers
 * agreement from silence" goes red if a later refactor treats null as a
 * disagreement.
 */
import { describe, expect, it } from 'vitest';
import {
  agrees,
  computeAgreement,
  verdictOf,
  everyRoutingActionHasAnAgreeingHumanAction,
  HUMAN_ACTION_AGREEMENT,
  RECOMMENDED_HUMAN_ACTION,
  type AgreementDecision,
} from '@/lib/gap/routing/agreement';
import { HUMAN_ACTIONS, ROUTING_ACTIONS } from '@/lib/gap/taxonomy';

function decision(over: Partial<AgreementDecision> = {}): AgreementDecision {
  return { id: 'd1', action: 'call_now', ruleId: 'hot_call', humanAction: 'called', executedEmail: false, executedEnroll: false, open: false, ...over };
}

describe('HUMAN_ACTION_AGREEMENT + agrees', () => {
  it('every HumanAction has at least one mapped RoutingAction, and every mapped action is real', () => {
    for (const h of HUMAN_ACTIONS) {
      expect(HUMAN_ACTION_AGREEMENT[h].length).toBeGreaterThan(0);
      for (const a of HUMAN_ACTION_AGREEMENT[h]) expect(ROUTING_ACTIONS).toContain(a);
    }
  });

  it('enrolled_by_hand agrees with enroll_gap_sequence and nothing else', () => {
    expect(agrees('enroll_gap_sequence', 'enrolled_by_hand')).toBe(true);
    for (const a of ROUTING_ACTIONS) {
      if (a === 'enroll_gap_sequence') continue;
      expect(agrees(a, 'enrolled_by_hand')).toBe(false);
    }
  });

  it('called agrees only with call_now', () => {
    expect(agrees('call_now', 'called')).toBe(true);
    expect(agrees('enroll_gap_sequence', 'called')).toBe(false);
  });

  it('emailed agrees only with one_off_email', () => {
    expect(agrees('one_off_email', 'emailed')).toBe(true);
    expect(agrees('call_now', 'emailed')).toBe(false);
  });

  it('dismissed agrees with do_not_contact and nurture (the operator agreed nothing should go out)', () => {
    expect(agrees('do_not_contact', 'dismissed')).toBe(true);
    expect(agrees('nurture', 'dismissed')).toBe(true);
    expect(agrees('call_now', 'dismissed')).toBe(false);
  });

  it('deferred agrees only with nurture', () => {
    expect(agrees('nurture', 'deferred')).toBe(true);
    expect(agrees('do_not_contact', 'deferred')).toBe(false);
  });

  it('researched agrees only with research_required (dogfood fix, 2026-09-25: closed the former agreement gap)', () => {
    expect(agrees('research_required', 'researched')).toBe(true);
    expect(agrees('call_now', 'researched')).toBe(false);
  });

  it('approved_hypothesis agrees only with approve_hypothesis', () => {
    expect(agrees('approve_hypothesis', 'approved_hypothesis')).toBe(true);
    expect(agrees('call_now', 'approved_hypothesis')).toBe(false);
  });

  it('linkedin_messaged agrees only with linkedin_manual_task', () => {
    expect(agrees('linkedin_manual_task', 'linkedin_messaged')).toBe(true);
    expect(agrees('call_now', 'linkedin_messaged')).toBe(false);
  });

  it('do_not_contact (the human action) agrees only with do_not_contact (the routing action)', () => {
    expect(agrees('do_not_contact', 'do_not_contact')).toBe(true);
    expect(agrees('nurture', 'do_not_contact')).toBe(false);
  });

  it('INVARIANT: every ROUTING_ACTION has at least one HumanAction that can agree with it -- no recommendation is structurally incapable of agreement', () => {
    expect(everyRoutingActionHasAnAgreeingHumanAction()).toBe(true);
    for (const action of ROUTING_ACTIONS) {
      const hasAgreeingHumanAction = HUMAN_ACTIONS.some((h) => agrees(action, h));
      expect(hasAgreeingHumanAction, `${action} has no HumanAction that can agree with it`).toBe(true);
    }
  });

  it('RECOMMENDED_HUMAN_ACTION covers every routing action, and each mapping is a real agreement, not a guess', () => {
    for (const action of ROUTING_ACTIONS) {
      const recommended = RECOMMENDED_HUMAN_ACTION[action];
      expect(recommended, `no RECOMMENDED_HUMAN_ACTION for ${action}`).toBeDefined();
      expect(agrees(action, recommended)).toBe(true);
    }
  });
});

/**
 * Red team T10: agreement is judged against EXECUTION, and nothing leaves the
 * denominator by going quiet. (The pre-T10 block pinned "a null human action
 * never counts" and "enrolled_by_hand agrees with no send"; both are the
 * defects T10 closes, so those assertions are replaced, not kept.)
 */
describe('computeAgreement (red team T10)', () => {
  it('PROOF: a direct send on an enroll-style recommendation with a sent ledger row is a correct agreement', () => {
    const clicked = computeAgreement([decision({ action: 'enroll_gap_sequence', humanAction: 'emailed', executedEmail: true })]);
    expect(clicked.overall).toMatchObject({ agreements: 1, disagreements: 0, n: 1 });
    // The send IS the action: no button press needed.
    const unclicked = computeAgreement([decision({ action: 'enroll_gap_sequence', humanAction: null, executedEmail: true, open: false })]);
    expect(unclicked.overall).toMatchObject({ agreements: 1, n: 1 });
  });

  it('PROOF: clicking / recording "emailed" without an execution is NOT agreement (unverified)', () => {
    for (const humanAction of ['emailed', 'enrolled_by_hand'] as const) {
      const r = computeAgreement([decision({ action: 'enroll_gap_sequence', humanAction, executedEmail: false })]);
      expect(r.overall).toMatchObject({ agreements: 0, disagreements: 1, unverified: 1, n: 1 });
    }
  });

  it('an enrollment proves enrolled_by_hand (and an unclicked enroll recommendation), never emailed', () => {
    expect(verdictOf(decision({ action: 'enroll_gap_sequence', humanAction: 'enrolled_by_hand', executedEnroll: true }))).toBe('agree');
    expect(verdictOf(decision({ action: 'enroll_gap_sequence', humanAction: null, executedEnroll: true, open: false }))).toBe('agree');
    expect(verdictOf(decision({ action: 'enroll_gap_sequence', humanAction: 'emailed', executedEnroll: true }))).toBe('unverified');
    expect(verdictOf(decision({ action: 'one_off_email', humanAction: null, executedEnroll: true, open: false }))).toBe('unacted');
  });

  it('PROOF: an expired or superseded card nobody acted on stays in the denominator as unacted', () => {
    const r = computeAgreement([
      decision({ id: 'd1', action: 'call_now', humanAction: 'called' }),
      decision({ id: 'd2', action: 'enroll_gap_sequence', humanAction: null, executedEmail: false, open: false }),
    ]);
    expect(r.overall).toMatchObject({ agreements: 1, disagreements: 1, unacted: 1, n: 2 });
    expect(r.pending).toBe(0);
  });

  it('only an OPEN card with no action is pending (left out of the rates)', () => {
    const r = computeAgreement([decision({ humanAction: null, open: true }), decision({ id: 'd2' })]);
    expect(r.overall).toMatchObject({ agreements: 1, disagreements: 0, n: 1 });
    expect(r.pending).toBe(1);
    expect(r.totalDecisions).toBe(2);
  });

  it('PROOF: no agreement rate can improve because unanswered cards disappeared from the open window', () => {
    const acted = [decision({ id: 'a1' }), decision({ id: 'a2' })];
    const quietCards = [1, 2, 3].map((i) => decision({ id: `q${i}`, action: 'enroll_gap_sequence', humanAction: null, open: true }));
    const whileOpen = computeAgreement([...acted, ...quietCards]).overall;
    const afterExpiry = computeAgreement([...acted, ...quietCards.map((d) => ({ ...d, open: false }))]).overall;
    // Expiring them can only lower (never raise) the agreement share.
    expect(afterExpiry.agreements).toBe(whileOpen.agreements);
    expect(afterExpiry.n).toBeGreaterThan(whileOpen.n);
    expect(afterExpiry.rate!).toBeLessThan(whileOpen.rate!);
  });

  it('an empty input yields no data everywhere, never a fabricated 0% or 100%', () => {
    const report = computeAgreement([]);
    expect(report.overall).toMatchObject({ agreements: 0, disagreements: 0, rate: null, n: 0 });
    expect(report.overall.honest.status).toBe('no_data');
    expect(report.byRuleId).toEqual([]);
    expect(report.byAction).toEqual([]);
  });

  it('small samples are suppressed: 4/5 renders insufficient, never 80%', () => {
    const five = [1, 2, 3, 4].map((i) => decision({ id: `a${i}` })).concat(decision({ id: 'x', humanAction: 'emailed', executedEmail: false }));
    const r = computeAgreement(five).overall;
    expect(r).toMatchObject({ agreements: 4, n: 5 });
    expect(r.honest).toMatchObject({ status: 'insufficient', value: null, interval: null });
  });

  it('breaks down by rule_id and by action, each with its own counts', () => {
    const report = computeAgreement([
      decision({ id: 'd1', ruleId: 'hot_call', action: 'call_now', humanAction: 'called' }),
      decision({ id: 'd2', ruleId: 'hot_call', action: 'call_now', humanAction: 'emailed', executedEmail: true }),
      decision({ id: 'd3', ruleId: 'enroll', action: 'enroll_gap_sequence', humanAction: 'enrolled_by_hand', executedEmail: true }),
    ]);
    expect(report.byRuleId.map((r) => [r.key, r.rate.agreements, r.rate.n])).toEqual([
      ['enroll', 1, 1],
      ['hot_call', 1, 2],
    ]);
    expect(report.byAction.map((r) => [r.key, r.rate.agreements, r.rate.n])).toEqual([
      ['call_now', 1, 2],
      ['enroll_gap_sequence', 1, 1],
    ]);
  });

  it('a mismatched human action against research_required is a disagreement; the matching one (researched) agrees', () => {
    expect(computeAgreement([decision({ action: 'research_required', humanAction: 'called', ruleId: 'no_hypothesis' })]).overall).toMatchObject({ agreements: 0, n: 1 });
    expect(computeAgreement([decision({ action: 'research_required', humanAction: 'researched', ruleId: 'no_hypothesis' })]).overall).toMatchObject({ agreements: 1, n: 1 });
  });

  it('verdictOf names every case', () => {
    expect(verdictOf(decision({ humanAction: null, open: true }))).toBe('pending');
    expect(verdictOf(decision({ humanAction: null, open: false }))).toBe('unacted');
    expect(verdictOf(decision({ action: 'one_off_email', humanAction: 'emailed', executedEmail: false }))).toBe('unverified');
    expect(verdictOf(decision({ action: 'call_now', humanAction: 'emailed', executedEmail: true }))).toBe('disagree');
  });
});
