import { describe, expect, it } from 'vitest';
import { PING_THRESHOLD } from '@/lib/pounce/score';
import { HOT_TRIGGER_NORM_THRESHOLD, RULES, priorityFor } from '@/lib/gap/routing/rules';
import { FORBIDDEN_EXPLAIN_PATTERNS, assertExplainClean } from '@/lib/gap/routing/explain';
import { routeAll, routePersona } from '@/lib/gap/routing/route';
import { DEFAULT_FRESHNESS } from '@/lib/gap/routing/types';
import type { RouteResult, RoutingDecision, RoutingInputs } from '@/lib/gap/routing/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-23T12:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);
const daysAhead = (days: number) => new Date(NOW.getTime() + days * DAY_MS);

/** A fully populated, healthy input. Routes to R17 enroll with target modex_queue. */
function base(): RoutingInputs {
  return {
    now: NOW,
    account: {
      name: 'Acme Foods',
      slug: 'acme-foods',
      hubspotCompanyId: '111',
      tam: 'in',
      tamTier: 'A',
      heatTier: 2,
      heat: 60,
      intentScore: null,
      lastIntentAt: null,
      triggerScore: 5,
      lastTriggerAt: daysAgo(3),
      outreachStatus: 'not_started',
      pipelineStage: null,
    },
    signals: {
      freshTriggers: [
        {
          id: 'sig-1',
          score: 5,
          normScore: 5,
          categories: ['expansion'],
          firstSeenAt: daysAgo(3),
          title: 'Acme Foods opens new distribution center in Ohio',
          url: 'https://example.com/acme-ohio',
          source: 'news',
        },
      ],
      newestAgeDays: 3,
    },
    persona: {
      id: 42,
      personaKey: 'executive_ops',
      roleGatePassed: true,
      seniorityRank: 3,
      email: 'vp@acme.example',
      emailValid: true,
      emailStatus: 'valid',
      phone: '+15555550100',
      phoneStatus: 'valid',
      linkedinUrl: 'https://www.linkedin.com/in/acme-vp',
      hubspotContactId: '222',
      qualVerdict: 'qualified',
      lastIntentSource: null,
      doNotContact: false,
      top100: null,
    },
    hypothesis: {
      id: 'hyp-1',
      status: 'approved',
      family: 'hidden_capacity',
      confidence: 0.6,
      evidenceFresh: true,
      hasNewerVersion: false,
      expiresAt: daysAhead(30),
      resumeAt: null,
      version: 1,
      observation: 'Acme Foods announced a third Ohio distribution center in August 2026.',
      problemHypothesis:
        'My guess is the new site inherits gate waiting from the other two, which caps turns.',
      whyNow: 'Site opens in Q4.',
      falsificationQuestions: ['Does the new site run the same gate process as the other two?'],
      whatANoMeans: 'The new site runs a standard gate process and turns are not capped.',
      evidenceIds: ['ev-1', 'ev-2'],
      signalIds: ['sig-1'],
    },
    comms: {
      inFlight: false,
      lastOutboundAt: null,
      lastInboundAt: null,
      undispositionedInbound: false,
      lastDisposition: null,
      meetingBooked: false,
    },
    suppression: {
      verdict: 'clear',
      legs: { unsubscribed: 'clear', do_not_contact: 'clear', clawd: 'clear', hs_email_optout: 'clear' },
    },
    freshness: { ...DEFAULT_FRESHNESS },
  };
}

function withHotTrigger(inputs: RoutingInputs, title = 'Acme Foods launches yard automation program'): RoutingInputs {
  inputs.signals.freshTriggers = [
    {
      id: 'sig-hot',
      score: PING_THRESHOLD,
      normScore: HOT_TRIGGER_NORM_THRESHOLD,
      categories: ['autonomy'],
      firstSeenAt: daysAgo(2),
      title,
      url: 'https://example.com/acme-automation',
      source: 'news',
    },
  ];
  inputs.signals.newestAgeDays = 2;
  return inputs;
}

function decision(result: RouteResult): RoutingDecision {
  if (result.kind !== 'decision') throw new Error(`expected a decision, got skip ${result.reason}`);
  return result.decision;
}

function allExplainText(d: RoutingDecision): string {
  const e = d.explain;
  return [e.whyAccount, e.whyPerson, e.whyProblem, e.whyNow, e.whyAction, e.wouldProveWrong, ...e.evidenceIds, ...e.signalIds].join('\n');
}

describe('RULES ordering', () => {
  it('is the exact section 6 order R0 through R19', () => {
    expect(RULES.map((r) => r.id)).toEqual([
      'suppressed',
      'suppression_unknown',
      'suppression_review',
      'tam_out',
      'in_flight',
      'reply_pending',
      'active_opportunity',
      'bounced_or_invalid',
      'disp_wrong_person',
      'disp_timing',
      'disp_not_priority',
      'disp_objection',
      'tam_unknown',
      'no_hypothesis',
      'hyp_proposed',
      'hyp_stale',
      'evidence_thin',
      'hyp_resolved',
      'hot_call',
      'hot_email',
      'cooldown',
      'enroll',
      'linkedin',
      'default',
    ]);
  });
});

describe('routePersona, one rule at a time', () => {
  it('R0 suppressed: a hard-compliance leg routes do_not_contact, blocked, lane blocked, names the leg', () => {
    const i = base();
    i.suppression = { verdict: 'suppressed', legs: { unsubscribed: 'clear', hubspot_optout: 'hit' } };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('suppressed');
    expect(d.action).toBe('do_not_contact');
    expect(d.lane).toBe('blocked');
    expect(d.blocked).toBe(true);
    expect(d.reason).toBe('suppressed:hubspot_optout');
    expect(d.explain.whyAction).toContain('hubspot_optout');
  });

  it('R0 names every leg when a hard leg and the local column both fire, never duplicating the modex leg (R2-1)', () => {
    const both = base();
    both.persona.doNotContact = true;
    both.suppression = { verdict: 'suppressed', legs: { verbal_do_not_call: 'hit' } };
    const d = decision(routePersona(both));
    expect(d.ruleId).toBe('suppressed');
    expect(d.reason).toBe('suppressed:verbal_do_not_call,modex_do_not_contact');

    const dup = base();
    dup.persona.doNotContact = true;
    dup.suppression = { verdict: 'suppressed', legs: { modex_do_not_contact: 'hit', unsubscribed: 'hit' } };
    expect(decision(routePersona(dup)).reason).toBe('suppressed:modex_do_not_contact,unsubscribed');
  });

  it('R0c suppression_review: the local column with no provenance is review-required research, not a blocked permanent DNC', () => {
    const i = base();
    i.persona.doNotContact = true;
    i.suppression = { verdict: 'clear', legs: { clawd: 'clear' } };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('suppression_review');
    expect(d.action).toBe('research_required');
    expect(d.lane).toBe('work_queue');
    expect(d.blocked).toBe(false);
    expect(d.reason).toBe('suppression_review:modex_do_not_contact');
    expect(d.explain.whyAction).toContain('cannot be proven');
  });

  it('R0c: a clawd do_not_send hit (reason not on the wire) is review, never outreach', () => {
    const i = withHotTrigger(base());
    i.suppression = { verdict: 'suppressed', legs: { clawd_do_not_send: 'hit' } };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('suppression_review');
    expect(d.action).toBe('research_required');
  });

  it('soft historical bounce (General Mills shape) is NOT a DNC: routes call/LinkedIn, never an email action', () => {
    const hot = withHotTrigger(base());
    hot.persona.doNotContact = true;
    hot.persona.emailStatus = 'bounced';
    hot.suppression = { verdict: 'suppressed', legs: { clawd: 'clear', modex: 'clear', modex_do_not_contact: 'hit' } };
    const d = decision(routePersona(hot));
    expect(d.ruleId).toBe('hot_call');
    expect(d.blocked).toBe(false);

    const cold = base();
    cold.persona.doNotContact = true;
    cold.persona.emailStatus = 'bounced';
    cold.suppression = { verdict: 'suppressed', legs: { modex_do_not_contact: 'hit' } };
    const c = decision(routePersona(cold));
    expect(c.ruleId).toBe('linkedin');
    expect(c.action).toBe('linkedin_manual_task');
  });

  it('hard invalid address: email off, no phone and no LinkedIn means research (find a new address), not a DNC', () => {
    const i = base();
    i.persona.doNotContact = true;
    i.persona.emailStatus = 'hard_bounce';
    i.persona.phone = null;
    i.persona.linkedinUrl = null;
    i.suppression = { verdict: 'suppressed', legs: { modex_do_not_contact: 'hit' } };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('bounced_or_invalid');
    expect(d.action).toBe('research_required');
    expect(d.blocked).toBe(false);
  });

  it('an unreadable service still blocks even when the local column reads soft (R0b before classification)', () => {
    const i = base();
    i.persona.doNotContact = true;
    i.persona.emailStatus = 'bounced';
    i.suppression = { verdict: 'unknown', legs: { clawd_contract: 'unknown' } };
    expect(decision(routePersona(i)).ruleId).toBe('suppression_unknown');
  });

  it('R12b evidence_thin: a live hypothesis resting only on an unquoted keyword hit is research, never an email (Joey, closeout)', () => {
    const i = base();
    i.hypothesis!.evidenceThin = true;
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('evidence_thin');
    expect(d.action).toBe('research_required');
    expect(d.lane).toBe('work_queue');
    expect(d.explain.whyAction).toContain('keyword');
    const quoted = base();
    quoted.hypothesis!.evidenceThin = false;
    expect(decision(routePersona(quoted)).ruleId).toBe('enroll');
  });

  it('R0b suppression_unknown: verdict unknown routes research_required, blocked, reason suppression_unknown', () => {
    const i = base();
    i.suppression = { verdict: 'unknown', legs: { unsubscribed: 'clear', clawd: 'unknown' } };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('suppression_unknown');
    expect(d.action).toBe('research_required');
    expect(d.lane).toBe('blocked');
    expect(d.blocked).toBe(true);
    expect(d.reason).toBe('suppression_unknown');
  });

  it('R1 tam_out: TAM out skips with reason tam_out', () => {
    const i = base();
    i.account.tam = 'out';
    expect(routePersona(i)).toEqual({ kind: 'skip', ruleId: 'tam_out', reason: 'tam_out' });
  });

  it('R2 in_flight: an in-flight draft skips with reason in_flight', () => {
    const i = base();
    i.comms.inFlight = true;
    expect(routePersona(i)).toEqual({ kind: 'skip', ruleId: 'in_flight', reason: 'in_flight' });
  });

  it('R3 reply_pending: undispositioned inbound routes one_off_email in reply_triage', () => {
    const i = base();
    i.comms.undispositionedInbound = true;
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('reply_pending');
    expect(d.action).toBe('one_off_email');
    expect(d.lane).toBe('reply_triage');
    expect(d.blocked).toBe(false);
  });

  /**
   * B6 (Opus adversarial review, 2026-09-24). Before this rule existed, an
   * account with an open deal, or a buyer who just accepted a meeting,
   * routed straight to call_now/enroll_gap_sequence for a cold sequence.
   * Mutate the guard away and these three go RED.
   */
  it('R3b active_opportunity: a meeting-stage account routes nurture, not enroll or hot_call', () => {
    const i = base();
    i.account.pipelineStage = 'meeting';
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('active_opportunity');
    expect(d.action).toBe('nurture');
    expect(d.blocked).toBe(false);
    expect(d.reason).toBe('active_opportunity:pipeline');
  });

  it('R3b active_opportunity: a booked meeting routes nurture even with a hot trigger and usable phone', () => {
    const i = withHotTrigger(base());
    i.comms.meetingBooked = true;
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('active_opportunity');
    expect(d.reason).toBe('active_opportunity:meeting_booked');
  });

  it('R3b active_opportunity: a confirmed meeting_accepted disposition within cooldown routes nurture; past cooldown falls through', () => {
    const i = base();
    i.comms.lastDisposition = { responseClass: 'meeting_accepted', at: daysAgo(3) };
    let d = decision(routePersona(i));
    expect(d.ruleId).toBe('active_opportunity');
    expect(d.reason).toBe('active_opportunity:recent_positive_disposition');

    const stale = base();
    stale.comms.lastDisposition = { responseClass: 'meeting_accepted', at: daysAgo(30) };
    d = decision(routePersona(stale));
    expect(d.ruleId).not.toBe('active_opportunity');
  });

  it('R3b control: an early pipeline stage (targeted/contacted/engaged) does NOT block routing', () => {
    const i = base();
    i.account.pipelineStage = 'contacted';
    const d = decision(routePersona(i));
    expect(d.ruleId).not.toBe('active_opportunity');
  });

  it('R4 bounced_or_invalid: invalid email and no phone routes research_required contact_invalid', () => {
    const i = base();
    i.persona.emailValid = false;
    i.persona.emailStatus = 'hard_bounced';
    i.persona.phone = null;
    i.persona.phoneStatus = null;
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('bounced_or_invalid');
    expect(d.action).toBe('research_required');
    expect(d.lane).toBe('work_queue');
    expect(d.reason).toBe('contact_invalid');
  });

  it('R4 also fires on a bounced status with a disconnected phone even when emailValid is true', () => {
    const i = base();
    i.persona.emailStatus = 'bounced';
    i.persona.phoneStatus = 'disconnected';
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('bounced_or_invalid');
  });

  it('R5 disp_wrong_person: wrong_person or referral routes research_required', () => {
    const i = base();
    i.comms.lastDisposition = { responseClass: 'wrong_person', at: daysAgo(1) };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('disp_wrong_person');
    expect(d.action).toBe('research_required');
    expect(d.lane).toBe('work_queue');
    expect(d.reason).toBe('wrong_person');

    const r = base();
    r.comms.lastDisposition = {
      responseClass: 'referral',
      at: daysAgo(1),
      referral: { name: 'Pat Doe', title: 'Director of Yard Ops' },
    };
    const rd = decision(routePersona(r));
    expect(rd.ruleId).toBe('disp_wrong_person');
    expect(rd.reason).toBe('referral');
    expect(rd.explain.whyAction).toContain('Pat Doe');
  });

  it('R6 disp_timing: timing with a future resumeAt routes nurture; a past resumeAt falls through', () => {
    const i = base();
    i.comms.lastDisposition = { responseClass: 'timing', at: daysAgo(5), resumeAt: daysAhead(20) };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('disp_timing');
    expect(d.action).toBe('nurture');
    expect(d.lane).toBe('work_queue');

    const p = base();
    p.comms.lastDisposition = { responseClass: 'timing', at: daysAgo(40), resumeAt: daysAgo(1) };
    expect(decision(routePersona(p)).ruleId).not.toBe('disp_timing');
  });

  it('R7 disp_not_priority: not_priority within 90 days routes nurture; older falls through', () => {
    const i = base();
    i.comms.lastDisposition = { responseClass: 'not_priority', at: daysAgo(10) };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('disp_not_priority');
    expect(d.action).toBe('nurture');
    expect(d.reason).toBe('not_priority');

    const old = base();
    old.comms.lastDisposition = { responseClass: 'not_priority', at: daysAgo(91) };
    expect(decision(routePersona(old)).ruleId).not.toBe('disp_not_priority');
  });

  it('R8 disp_objection: existing_solution or problem_rejected within 30 days routes one_off_email; older falls through', () => {
    const i = base();
    i.comms.lastDisposition = { responseClass: 'existing_solution', at: daysAgo(5) };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('disp_objection');
    expect(d.action).toBe('one_off_email');
    expect(d.lane).toBe('work_queue');
    expect(d.reason).toBe('objection');

    const rejected = base();
    rejected.comms.lastDisposition = { responseClass: 'problem_rejected', at: daysAgo(29) };
    expect(decision(routePersona(rejected)).ruleId).toBe('disp_objection');

    const old = base();
    old.comms.lastDisposition = { responseClass: 'problem_rejected', at: daysAgo(31) };
    expect(decision(routePersona(old)).ruleId).not.toBe('disp_objection');
  });

  it('R9 tam_unknown: TAM unknown routes research_required tam_unverified', () => {
    const i = base();
    i.account.tam = 'unknown';
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('tam_unknown');
    expect(d.action).toBe('research_required');
    expect(d.reason).toBe('tam_unverified');
  });

  it('R10 no_hypothesis: no hypothesis routes research_required no_hypothesis', () => {
    const i = base();
    i.hypothesis = null;
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('no_hypothesis');
    expect(d.action).toBe('research_required');
    expect(d.reason).toBe('no_hypothesis');
    expect(d.explain.evidenceIds).toEqual([]);
    expect(d.explain.wouldProveWrong).toBe('no falsification recorded');
  });

  it('R11 hyp_proposed: draft or review_required routes approve_hypothesis', () => {
    for (const status of ['draft', 'review_required'] as const) {
      const i = base();
      i.hypothesis!.status = status;
      const d = decision(routePersona(i));
      expect(d.ruleId, status).toBe('hyp_proposed');
      expect(d.action).toBe('approve_hypothesis');
      expect(d.lane).toBe('work_queue');
    }
  });

  it('R12 hyp_stale: stale evidence routes research_required evidence_stale; past expiry routes hypothesis_expired', () => {
    const stale = base();
    stale.hypothesis!.evidenceFresh = false;
    const sd = decision(routePersona(stale));
    expect(sd.ruleId).toBe('hyp_stale');
    expect(sd.action).toBe('research_required');
    expect(sd.reason).toBe('evidence_stale');

    const expired = base();
    expired.hypothesis!.status = 'active';
    expired.hypothesis!.expiresAt = daysAgo(1);
    const ed = decision(routePersona(expired));
    expect(ed.ruleId).toBe('hyp_stale');
    expect(ed.reason).toBe('hypothesis_expired');
  });

  it('R13 hyp_resolved: every terminal status with no newer version routes nurture loop_closed', () => {
    for (const status of ['confirmed', 'partially_confirmed', 'rejected', 'unresolved', 'expired'] as const) {
      const i = base();
      i.hypothesis!.status = status;
      i.hypothesis!.hasNewerVersion = false;
      const d = decision(routePersona(i));
      expect(d.ruleId, status).toBe('hyp_resolved');
      expect(d.action).toBe('nurture');
      expect(d.reason).toBe('loop_closed');
    }
  });

  it('R13 does not fire on a terminal hypothesis that a newer version supersedes; R10 never fires while a hypothesis row exists (R2-4)', () => {
    const superseded = base();
    superseded.hypothesis!.status = 'confirmed';
    superseded.hypothesis!.hasNewerVersion = true;
    const d = decision(routePersona(superseded));
    expect(d.ruleId).not.toBe('hyp_resolved');
    expect(d.ruleId).not.toBe('no_hypothesis');
    // Nothing live to enroll on and the loop is not closed: the default row owns it.
    expect(d.ruleId).toBe('default');
    expect(d.reason).toBe('no_fit_for_sequence');
  });

  it('R14 hot_call: hot trigger, usable phone and role gate route call_now', () => {
    const d = decision(routePersona(withHotTrigger(base())));
    expect(d.ruleId).toBe('hot_call');
    expect(d.action).toBe('call_now');
    expect(d.lane).toBe('work_queue');
  });

  it('R14 hot also fires on a verified reply and on fresh account intent at or above 60', () => {
    const reply = base();
    reply.persona.lastIntentSource = 'email_reply_verified';
    expect(decision(routePersona(reply)).ruleId).toBe('hot_call');

    const intent = base();
    intent.account.intentScore = 60;
    intent.account.lastIntentAt = daysAgo(1);
    expect(decision(routePersona(intent)).ruleId).toBe('hot_call');

    const staleIntent = base();
    staleIntent.account.intentScore = 95;
    staleIntent.account.lastIntentAt = daysAgo(8);
    expect(decision(routePersona(staleIntent)).ruleId).toBe('enroll');

    const oldTrigger = withHotTrigger(base());
    oldTrigger.signals.freshTriggers[0].firstSeenAt = daysAgo(8);
    expect(decision(routePersona(oldTrigger)).ruleId).toBe('enroll');
  });

  it('hot-trigger threshold is PING_THRESHOLD normalized as a news score (8 x 5.5 = 44), not the raw 8', () => {
    expect(HOT_TRIGGER_NORM_THRESHOLD).toBe(44);
    expect(HOT_TRIGGER_NORM_THRESHOLD).toBe(PING_THRESHOLD * 5.5);

    const justBelow = withHotTrigger(base());
    justBelow.signals.freshTriggers[0].normScore = HOT_TRIGGER_NORM_THRESHOLD - 1;
    expect(decision(routePersona(justBelow)).ruleId).toBe('enroll');

    const atThreshold = withHotTrigger(base());
    atThreshold.signals.freshTriggers[0].normScore = HOT_TRIGGER_NORM_THRESHOLD;
    expect(decision(routePersona(atThreshold)).ruleId).toBe('hot_call');

    const above = withHotTrigger(base());
    above.signals.freshTriggers[0].normScore = 100;
    expect(decision(routePersona(above)).ruleId).toBe('hot_call');

    // A weak normalized news score that happens to clear the RAW constant is not hot.
    const weakNormalized = withHotTrigger(base());
    weakNormalized.signals.freshTriggers[0].score = 2;
    weakNormalized.signals.freshTriggers[0].normScore = 11;
    expect(decision(routePersona(weakNormalized)).ruleId).toBe('enroll');
  });

  it('freshness.hotTriggerNormThreshold overrides the derived threshold', () => {
    const lowered = withHotTrigger(base());
    lowered.signals.freshTriggers[0].normScore = 20;
    lowered.freshness.hotTriggerNormThreshold = 20;
    expect(decision(routePersona(lowered)).ruleId).toBe('hot_call');

    const raised = withHotTrigger(base());
    raised.signals.freshTriggers[0].normScore = HOT_TRIGGER_NORM_THRESHOLD;
    raised.freshness.hotTriggerNormThreshold = HOT_TRIGGER_NORM_THRESHOLD + 1;
    expect(decision(routePersona(raised)).ruleId).toBe('enroll');
  });

  it('R15 hot_email: hot without a usable phone but with a valid email routes one_off_email', () => {
    const i = withHotTrigger(base());
    i.persona.phoneStatus = 'wrong';
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('hot_email');
    expect(d.action).toBe('one_off_email');
    expect(d.lane).toBe('work_queue');
  });

  it('R16 cooldown: outbound within 14 days and no reply since routes nurture cooldown; a later inbound clears it', () => {
    const i = base();
    i.comms.lastOutboundAt = daysAgo(3);
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('cooldown');
    expect(d.action).toBe('nurture');
    expect(d.reason).toBe('cooldown');

    const replied = base();
    replied.comms.lastOutboundAt = daysAgo(3);
    replied.comms.lastInboundAt = daysAgo(2);
    expect(decision(routePersona(replied)).ruleId).toBe('enroll');

    const old = base();
    old.comms.lastOutboundAt = daysAgo(15);
    expect(decision(routePersona(old)).ruleId).toBe('enroll');
  });

  it('R17 enroll: target modex_queue when there is no top100 entry', () => {
    const d = decision(routePersona(base()));
    expect(d.ruleId).toBe('enroll');
    expect(d.action).toBe('enroll_gap_sequence');
    expect(d.lane).toBe('work_queue');
    expect(d.target).toBe('modex_queue');
  });

  it('R17 enroll: target hubspot_native when top100 is ELIGIBLE with a sequence id and no block', () => {
    const i = base();
    i.persona.top100 = {
      eligibility: 'ELIGIBLE',
      sequenceBlock: null,
      hubspotSequenceId: 'seq-123',
      sequenceName: 'Acme Foods GAP',
    };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('enroll');
    expect(d.target).toBe('hubspot_native');
  });

  it('R17 enroll: target build_required when top100 exists but has no sequence id or is blocked', () => {
    const noSeq = base();
    noSeq.persona.top100 = { eligibility: 'ELIGIBLE', sequenceBlock: null, hubspotSequenceId: null, sequenceName: null };
    expect(decision(routePersona(noSeq)).target).toBe('build_required');

    const blocked = base();
    blocked.persona.top100 = {
      eligibility: 'ELIGIBLE',
      sequenceBlock: 'missing_step_copy',
      hubspotSequenceId: 'seq-123',
      sequenceName: 'Acme Foods GAP',
    };
    expect(decision(routePersona(blocked)).target).toBe('build_required');

    const ineligible = base();
    ineligible.persona.top100 = {
      eligibility: 'INELIGIBLE',
      sequenceBlock: null,
      hubspotSequenceId: 'seq-123',
      sequenceName: 'Acme Foods GAP',
    };
    expect(decision(routePersona(ineligible)).target).toBe('build_required');
  });

  it('R18 also tests emailUsable: hard-bounced email, usable phone, approved hypothesis, LinkedIn URL, not hot -> linkedin_manual_task (R2-8, concern 1)', () => {
    const i = base();
    i.persona.emailValid = true;
    i.persona.emailStatus = 'hard_bounced';
    i.persona.linkedinUrl = 'https://www.linkedin.com/in/acme-vp';
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('linkedin');
    expect(d.action).toBe('linkedin_manual_task');
    expect(d.reason).toBe('no_usable_email');
    expect(d.explain.whyAction).toContain('R18 linkedin');
    // R18 still needs a live hypothesis: with none, nothing routes to LinkedIn.
    const none = base();
    none.persona.emailValid = true;
    none.persona.emailStatus = 'hard_bounced';
    none.hypothesis = null;
    expect(decision(routePersona(none)).ruleId).toBe('no_hypothesis');
  });

  it('R17 never enrolls a hard-bounced address: usable phone, approved hypothesis, TAM in, no LinkedIn -> R19 default nurture, not enroll (R2-8)', () => {
    const i = base();
    i.persona.emailValid = true;
    i.persona.emailStatus = 'hard_bounced';
    i.persona.linkedinUrl = null;
    // The phone is usable, so R4 (contact_invalid) does not catch this; R17 must refuse on its own.
    const d = decision(routePersona(i));
    expect(d.ruleId).not.toBe('enroll');
    expect(d.action).not.toBe('enroll_gap_sequence');
    expect(d.ruleId).toBe('default');
    expect(d.action).toBe('nurture');
    expect(d.reason).toBe('no_fit_for_sequence');
    expect(d.explain.whyPerson).toContain('hard_bounced');
  });

  it('R15 tests emailUsable, not emailValid: a hot account with a bounced email and no usable phone is contact_invalid, never one_off_email (R2-8)', () => {
    const i = withHotTrigger(base());
    i.persona.phoneStatus = 'wrong';
    i.persona.emailValid = true;
    i.persona.emailStatus = 'bounced';
    const d = decision(routePersona(i));
    expect(d.ruleId).not.toBe('hot_email');
    expect(d.ruleId).toBe('bounced_or_invalid');
    expect(d.reason).toBe('contact_invalid');
    // Prove the R15 predicate itself refuses, independent of R4's precedence.
    const r15 = RULES.find((r) => r.id === 'hot_email')!;
    expect(r15.when(i)).toBe(false);
  });

  it('R17 enroll: tier C with heat tier 3 or better still enrolls; tier C at heat tier 4 does not', () => {
    const ok = base();
    ok.account.tamTier = 'C';
    ok.account.heatTier = 3;
    expect(decision(routePersona(ok)).ruleId).toBe('enroll');

    const cold = base();
    cold.account.tamTier = 'C';
    cold.account.heatTier = 4;
    expect(decision(routePersona(cold)).ruleId).toBe('default');
  });

  it('R18 linkedin: no valid email, usable phone and a LinkedIn URL routes linkedin_manual_task', () => {
    const i = base();
    i.persona.emailValid = false;
    i.persona.emailStatus = 'unknown';
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('linkedin');
    expect(d.action).toBe('linkedin_manual_task');
    expect(d.lane).toBe('work_queue');
  });

  it('R19 default: nothing else fits routes nurture no_fit_for_sequence', () => {
    const i = base();
    i.persona.emailValid = false;
    i.persona.emailStatus = 'unknown';
    i.persona.linkedinUrl = null;
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('default');
    expect(d.action).toBe('nurture');
    expect(d.lane).toBe('work_queue');
    expect(d.reason).toBe('no_fit_for_sequence');
  });
});

describe('precedence', () => {
  it('suppressed beats hot: R0 wins even with a hot trigger, phone and role gate', () => {
    const i = withHotTrigger(base());
    i.suppression = { verdict: 'suppressed', legs: { hs_email_optout: 'hit' } };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('suppressed');
    expect(d.action).toBe('do_not_contact');
  });

  it('unknown suppression beats everything: R0b with blocked true on an otherwise perfect input', () => {
    const i = withHotTrigger(base());
    i.persona.top100 = { eligibility: 'ELIGIBLE', sequenceBlock: null, hubspotSequenceId: 'seq-1', sequenceName: 'x' };
    i.suppression = { verdict: 'unknown', legs: { clawd: 'unknown' } };
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('suppression_unknown');
    expect(d.blocked).toBe(true);
    expect(d.lane).toBe('blocked');
  });

  it('in_flight beats reply_pending', () => {
    const i = base();
    i.comms.inFlight = true;
    i.comms.undispositionedInbound = true;
    expect(routePersona(i)).toMatchObject({ kind: 'skip', ruleId: 'in_flight' });
  });

  it('hyp_proposed beats hot_call', () => {
    const i = withHotTrigger(base());
    i.hypothesis!.status = 'draft';
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('hyp_proposed');
    expect(d.action).toBe('approve_hypothesis');
  });
});

describe('priority', () => {
  it('call_now with heat 60 and seniority 3 scores exactly 60 + 40 + 6 = 106', () => {
    const d = decision(routePersona(withHotTrigger(base())));
    expect(d.priority).toBe(106);
  });

  it('priorityFor rounds and applies each rule bonus', () => {
    const i = base();
    i.account.heat = 33.4;
    i.persona.seniorityRank = 2;
    const byId = Object.fromEntries(RULES.map((r) => [r.id, r]));
    expect(priorityFor(i, byId.hot_call)).toBe(77);
    expect(priorityFor(i, byId.hyp_proposed)).toBe(57);
    expect(priorityFor(i, byId.enroll)).toBe(52);
    expect(priorityFor(i, byId.reply_pending)).toBe(47);
    expect(priorityFor(i, byId.tam_unknown)).toBe(42);
    expect(priorityFor(i, byId.default)).toBe(37);
    expect(priorityFor(i, byId.suppressed)).toBe(37);
  });
});

describe('explain', () => {
  it('never leaks private intent: intentScore 90, verified reply and a "visited /demo/" trigger title route fine with a clean explain', () => {
    const i = withHotTrigger(base(), 'Acme Foods VP visited /demo/yard-explorer twice');
    i.account.intentScore = 90;
    i.account.lastIntentAt = daysAgo(1);
    i.persona.lastIntentSource = 'email_reply_verified';
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('hot_call');
    const text = allExplainText(d);
    for (const { label, pattern } of FORBIDDEN_EXPLAIN_PATTERNS) {
      expect(pattern.test(text), `explain matches "${label}"`).toBe(false);
    }
    expect(text).not.toContain('90');
    expect(text).not.toContain('email_reply_verified');
    expect(d.explain.whyAccount).not.toContain('yard-explorer');
  });

  it('ordinary language routes: "opened a new plant" and "intention" are public facts, not private intent', () => {
    const i = base();
    i.hypothesis!.observation =
      'Honda opened a new engine plant in Anna in 2024 with the intention of adding a second shift';
    i.hypothesis!.whyNow = 'The plant opened in 2024; an intentional second shift is planned for 2027.';
    i.signals.freshTriggers[0].title = 'Honda opened a new DC; details at https://example.com/news/for-the-record';
    const d = decision(routePersona(i));
    expect(d.ruleId).toBe('enroll');
    expect(d.explain.whyProblem).toContain('Honda opened a new engine plant in Anna in 2024');
    expect(d.explain.whyAccount).toContain('Honda opened a new DC');
    expect(() => assertExplainClean(d.explain)).not.toThrow();
  });

  it('private phrasing still throws: "opened our email twice" and "intent score 90"', () => {
    const clean = decision(routePersona(base())).explain;
    expect(() => assertExplainClean({ ...clean, whyNow: 'she opened our email twice' })).toThrow(
      /whyNow.*opened email/,
    );
    expect(() => assertExplainClean({ ...clean, whyNow: 'intent score 90 this week' })).toThrow(
      /whyNow.*intent score/,
    );
    const leaky = base();
    leaky.hypothesis!.observation = 'The VP opened our email twice.';
    expect(() => routePersona(leaky)).toThrow(/whyProblem.*opened email/);
    const viewed = base();
    viewed.hypothesis!.observation = 'The VP viewed the deck on Monday.';
    expect(() => routePersona(viewed)).toThrow(/whyProblem.*viewed deck/);
  });

  it('whyAccount names the newest public trigger and skips a private one', () => {
    const i = base();
    i.signals.freshTriggers = [
      {
        id: 'sig-private',
        score: 9,
        normScore: 9,
        categories: ['intent'],
        firstSeenAt: daysAgo(1),
        title: 'Contact viewed /for/acme',
        url: null,
        source: 'news',
      },
      ...i.signals.freshTriggers,
    ];
    const d = decision(routePersona(i));
    expect(d.explain.whyAccount).toContain('Acme Foods opens new distribution center in Ohio');
    expect(d.explain.whyNow).toContain('sig-1');
    expect(d.explain.whyNow).not.toContain('sig-private');
    expect(d.explain.signalIds).not.toContain('sig-private');
  });

  it('whyAction names the rule, the predicate in words, and the counterfactual with the disposition cleared', () => {
    const i = base();
    i.comms.lastDisposition = { responseClass: 'not_priority', at: daysAgo(10) };
    const d = decision(routePersona(i));
    expect(d.explain.whyAction).toContain('R7 disp_not_priority');
    expect(d.explain.whyAction).toContain('not_priority');
    expect(d.explain.whyAction).toContain('a different disposition would change this to enroll_gap_sequence');

    const steady = decision(routePersona(base()));
    expect(steady.explain.whyAction).toContain('R17 enroll');
    expect(steady.explain.whyAction).toContain('a different disposition would not change this');
  });

  it('whyProblem marks the observation and the hypothesis and truncates at 200 chars', () => {
    const i = base();
    i.hypothesis!.observation = 'O'.repeat(300);
    i.hypothesis!.problemHypothesis = 'H'.repeat(300);
    const d = decision(routePersona(i));
    expect(d.explain.whyProblem).toContain('hidden_capacity');
    expect(d.explain.whyProblem).toContain('Observed: ' + 'O'.repeat(200));
    expect(d.explain.whyProblem).not.toContain('O'.repeat(201));
    expect(d.explain.whyProblem).toContain('Hypothesis: ' + 'H'.repeat(200));
    expect(d.explain.whyProblem).not.toContain('H'.repeat(201));
  });

  it('whyPerson carries the persona, role gate, seniority, email and phone validity, and top100 eligibility', () => {
    const i = base();
    i.persona.top100 = { eligibility: 'ELIGIBLE', sequenceBlock: null, hubspotSequenceId: 'seq-1', sequenceName: 'x' };
    const d = decision(routePersona(i));
    expect(d.explain.whyPerson).toContain('executive_ops');
    expect(d.explain.whyPerson).toContain('role gate passed');
    expect(d.explain.whyPerson).toContain('seniority 3');
    expect(d.explain.whyPerson).toContain('email valid');
    expect(d.explain.whyPerson).toContain('phone usable');
    expect(d.explain.whyPerson).toContain('top100 ELIGIBLE');
  });

  it('wouldProveWrong prefers whatANoMeans, then the first falsification question, then the sentinel', () => {
    expect(decision(routePersona(base())).explain.wouldProveWrong).toBe(
      'The new site runs a standard gate process and turns are not capped.',
    );
    const q = base();
    q.hypothesis!.whatANoMeans = null;
    expect(decision(routePersona(q)).explain.wouldProveWrong).toBe(
      'Does the new site run the same gate process as the other two?',
    );
    const none = base();
    none.hypothesis!.whatANoMeans = null;
    none.hypothesis!.falsificationQuestions = [];
    expect(decision(routePersona(none)).explain.wouldProveWrong).toBe('no falsification recorded');
  });

  it('the review probes are caught: click, download, hot lead, engagement score, own host, page view, viewed the, opened it (R2-13)', () => {
    const clean = decision(routePersona(base())).explain;
    const probes = [
      'clicked the pricing link',
      'downloaded the deck',
      'hot lead',
      'engagement score 87',
      'visited yardflow.ai/roi yesterday',
      'viewed the ROI calculator',
      'opened it three times',
      'three page views on Monday',
      'a pageview from the plant',
      'clicks a link every week',
    ];
    for (const probe of probes) {
      expect(() => assertExplainClean({ ...clean, whyNow: probe }), probe).toThrow(/whyNow/);
      expect(() => assertExplainClean({ ...clean, whyAccount: probe }), probe).toThrow(/whyAccount/);
    }
    const stillPublic = ['the plant opened', 'with the intention of adding a shift', 'a hot summer for the freight market'];
    for (const text of stillPublic) {
      expect(() => assertExplainClean({ ...clean, whyNow: text }), text).not.toThrow();
    }
  });

  it('the copy-safe list stays at the pre-R2-13 anchors: it passes "We downloaded the 10-K" and "yardflow.ai/proof" while the explain list catches both (R2-13 split for C06)', async () => {
    const { PRIVATE_INTENT_COPY_PATTERNS } = await import('@/lib/gap/routing/explain');
    const matches = (list: readonly { pattern: RegExp }[], text: string) => list.some(({ pattern }) => pattern.test(text));
    for (const text of ['We downloaded the 10-K and read the segment note.', 'See yardflow.ai/proof for the numbers.', 'clicked the pricing link', 'hot lead']) {
      expect(matches(PRIVATE_INTENT_COPY_PATTERNS, text), `copy list on "${text}"`).toBe(false);
      expect(matches(FORBIDDEN_EXPLAIN_PATTERNS, text), `explain list on "${text}"`).toBe(true);
    }
    // The copy list is still the private-intent floor: every pre-R2-13 anchor is in it and in the explain list.
    for (const text of [
      'intent score 90',
      'visited our demo',
      'landed on /for/acme-foods',
      'opened our email twice',
      // R3-8: bare "intent" and "looked at our ... page" join the floor.
      'Your intent data shows a spike this quarter.',
      'Someone at Kroger looked at our yard scorecard page twice.',
      'checked out the ROI calculator',
      'browsed our proof site',
    ]) {
      expect(matches(PRIVATE_INTENT_COPY_PATTERNS, text), `copy list on "${text}"`).toBe(true);
      expect(matches(FORBIDDEN_EXPLAIN_PATTERNS, text), `explain list on "${text}"`).toBe(true);
    }
    for (const text of ['with the best of intentions', 'the plant opened', 'an intentional second shift', 'listened intently']) {
      expect(matches(PRIVATE_INTENT_COPY_PATTERNS, text), `copy list on "${text}"`).toBe(false);
      expect(matches(FORBIDDEN_EXPLAIN_PATTERNS, text), `explain list on "${text}"`).toBe(false);
    }
    expect(PRIVATE_INTENT_COPY_PATTERNS.length).toBeLessThan(FORBIDDEN_EXPLAIN_PATTERNS.length);
    for (const entry of PRIVATE_INTENT_COPY_PATTERNS) expect(FORBIDDEN_EXPLAIN_PATTERNS).toContain(entry);
  });

  it('a trigger whose source is the intent engine is private by source, whatever its title says (R2-13)', () => {
    const i = base();
    i.signals.freshTriggers = [
      {
        id: 'sig-engine',
        score: 9,
        normScore: 50,
        categories: ['expansion'],
        firstSeenAt: daysAgo(1),
        title: 'Acme Foods activity',
        url: null,
        source: 'intent_engine',
      },
      ...i.signals.freshTriggers,
    ];
    const d = decision(routePersona(i));
    expect(d.explain.whyAccount).toContain('Acme Foods opens new distribution center in Ohio');
    expect(d.explain.whyAccount).not.toContain('Acme Foods activity');
    expect(d.explain.whyNow).not.toContain('sig-engine');
    expect(d.explain.signalIds).not.toContain('sig-engine');
    expect(d.explain.signalIds).toContain('sig-1');
  });

  it('assertExplainClean throws naming the field and the pattern label', () => {
    const clean = decision(routePersona(base())).explain;
    expect(() => assertExplainClean(clean)).not.toThrow();
    expect(() => assertExplainClean({ ...clean, whyNow: 'account intentScore 90' })).toThrow(
      /whyNow.*intent score/,
    );
    expect(() => assertExplainClean({ ...clean, whyAccount: 'the CFO Visited our demo' })).toThrow(
      /whyAccount.*visited/i,
    );
    expect(() => assertExplainClean({ ...clean, whyAccount: 'landed on /for/acme-foods' })).toThrow(
      /whyAccount.*\/for\//,
    );
    expect(() => assertExplainClean({ ...clean, signalIds: ['microsite-view-1'] })).toThrow(
      /signalIds.*microsite/,
    );
    expect(() => assertExplainClean({ ...clean, whyPerson: 'hs_sales_email_last_opened set' })).toThrow(
      /whyPerson.*hs_sales_email/,
    );
  });
});

describe('determinism', () => {
  it('the same input routed twice is deep-equal', () => {
    const a = routePersona(withHotTrigger(base()));
    const b = routePersona(withHotTrigger(base()));
    expect(a).toEqual(b);
  });

  it('routeAll maps in order and preserves skips', () => {
    const out = base();
    out.account.tam = 'out';
    const results = routeAll([base(), out, withHotTrigger(base())]);
    expect(results.map((r) => (r.kind === 'skip' ? `skip:${r.reason}` : r.decision.ruleId))).toEqual([
      'enroll',
      'skip:tam_out',
      'hot_call',
    ]);
  });
});
