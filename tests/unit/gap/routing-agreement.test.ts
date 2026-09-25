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
  everyRoutingActionHasAnAgreeingHumanAction,
  HUMAN_ACTION_AGREEMENT,
  RECOMMENDED_HUMAN_ACTION,
  type AgreementDecision,
} from '@/lib/gap/routing/agreement';
import { HUMAN_ACTIONS, ROUTING_ACTIONS } from '@/lib/gap/taxonomy';

function decision(over: Partial<AgreementDecision> = {}): AgreementDecision {
  return { id: 'd1', action: 'call_now', ruleId: 'hot_call', humanAction: 'called', ...over };
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

describe('computeAgreement', () => {
  it('a decision with human_action null is never a disagreement: only totalDecisions counts it', () => {
    const report = computeAgreement([decision({ humanAction: null }), decision({ id: 'd2' })]);
    expect(report.overall).toEqual({ agreements: 1, disagreements: 0, rate: 1, n: 1 });
    expect(report.totalDecisions).toBe(2);
  });

  it('an empty input yields a null rate everywhere, never a fabricated 0% or 100%', () => {
    const report = computeAgreement([]);
    expect(report.overall).toEqual({ agreements: 0, disagreements: 0, rate: null, n: 0 });
    expect(report.byRuleId).toEqual([]);
    expect(report.byAction).toEqual([]);
    expect(report.totalDecisions).toBe(0);
  });

  it('mixed agreement and disagreement computes the overall rate with numerator/denominator restated', () => {
    const report = computeAgreement([
      decision({ id: 'd1', action: 'call_now', humanAction: 'called' }), // agree
      decision({ id: 'd2', action: 'call_now', humanAction: 'emailed' }), // disagree
      decision({ id: 'd3', action: 'enroll_gap_sequence', humanAction: 'enrolled_by_hand' }), // agree
    ]);
    expect(report.overall).toEqual({ agreements: 2, disagreements: 1, rate: 2 / 3, n: 3 });
  });

  it('breaks down by rule_id and by action, each with its own rate', () => {
    const report = computeAgreement([
      decision({ id: 'd1', ruleId: 'hot_call', action: 'call_now', humanAction: 'called' }),
      decision({ id: 'd2', ruleId: 'hot_call', action: 'call_now', humanAction: 'emailed' }),
      decision({ id: 'd3', ruleId: 'enroll', action: 'enroll_gap_sequence', humanAction: 'enrolled_by_hand' }),
    ]);
    expect(report.byRuleId).toEqual([
      { key: 'enroll', rate: { agreements: 1, disagreements: 0, rate: 1, n: 1 } },
      { key: 'hot_call', rate: { agreements: 1, disagreements: 1, rate: 0.5, n: 2 } },
    ]);
    expect(report.byAction).toEqual([
      { key: 'call_now', rate: { agreements: 1, disagreements: 1, rate: 0.5, n: 2 } },
      { key: 'enroll_gap_sequence', rate: { agreements: 1, disagreements: 0, rate: 1, n: 1 } },
    ]);
  });

  it('a mismatched human action against research_required is a disagreement; the matching one (researched) agrees', () => {
    const mismatched = computeAgreement([decision({ action: 'research_required', humanAction: 'called', ruleId: 'no_hypothesis' })]);
    expect(mismatched.overall).toEqual({ agreements: 0, disagreements: 1, rate: 0, n: 1 });

    const matched = computeAgreement([decision({ action: 'research_required', humanAction: 'researched', ruleId: 'no_hypothesis' })]);
    expect(matched.overall).toEqual({ agreements: 1, disagreements: 0, rate: 1, n: 1 });
  });
});
