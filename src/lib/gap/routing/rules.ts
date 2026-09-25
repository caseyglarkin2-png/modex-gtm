/**
 * GAP routing rules (Sprint 2, S2-T6). Spec: docs/GAP_PROSPECTING_OS.md section 6.
 *
 * `RULES` is ORDERED; `routePersona` takes the first rule whose `when` holds.
 * Order is the whole contract: the precedence tests in
 * tests/unit/gap/routing-rules.test.ts pin it (suppression above everything,
 * in_flight above reply_pending, hyp_proposed above hot_call).
 *
 * Pure: no Prisma, no fetch, no clock. Time comes from `inputs.now`.
 */

import { normalizeScore } from '../../pounce/fit';
import { PING_THRESHOLD } from '../../pounce/score';
import { HYPOTHESIS_TERMINAL_STATUSES } from '../taxonomy';
import type { RoutingAction, RoutingLane, ResponseClass } from '../taxonomy';
import type { EnrollTarget, RoutingInputs, RoutingLastDisposition } from './types';
import { classifySuppression, type SuppressionClassification } from '../suppression/provenance';

export interface RoutingRule {
  id: string;
  /** Spec row label, for explain text (R0, R0b, R1 ...). */
  label: string;
  when: (inputs: RoutingInputs) => boolean;
  action?: RoutingAction;
  lane?: RoutingLane;
  /** Present only on skip-class rules (R1, R2). */
  skip?: string;
  /** Machine-readable reason code for the fired rule. */
  reason?: (inputs: RoutingInputs) => string;
  /** The predicate that fired, in words, for explain.whyAction. */
  predicate: (inputs: RoutingInputs) => string;
  bonus?: number;
  blocked?: boolean;
}

/** Rule bonuses from spec section 6 ("Priority = heat + rule bonus + seniority x 2"). */
export const ACTION_BONUS: Record<RoutingAction, number> = {
  call_now: 40,
  approve_hypothesis: 20,
  enroll_gap_sequence: 15,
  one_off_email: 10,
  research_required: 5,
  linkedin_manual_task: 0,
  nurture: 0,
  do_not_contact: 0,
};

/**
 * The hot-trigger threshold on the NORMALIZED 0-100 scale the assembler feeds
 * as `freshTriggers[].normScore`. PING_THRESHOLD (8) is a RAW news score;
 * comparing normScore against it directly would read a weak normalized news
 * score as hot. Derived exactly as ACCOUNT_TRIGGER_SQL_THRESHOLD in
 * src/lib/revops/qualification/model.ts, so the two cannot drift apart.
 * `RoutingFreshness.hotTriggerNormThreshold` overrides it per run.
 */
export const HOT_TRIGGER_NORM_THRESHOLD = normalizeScore(PING_THRESHOLD, 'news');

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Predicates shared by rules and explain
// ---------------------------------------------------------------------------

export function ageDays(now: Date, at: Date): number {
  return (now.getTime() - at.getTime()) / DAY_MS;
}

function withinDays(now: Date, at: Date | null | undefined, days: number): boolean {
  return at != null && ageDays(now, at) <= days;
}

const UNUSABLE_PHONE_STATUSES = new Set(['invalid', 'wrong', 'disconnected']);
const BOUNCED_EMAIL_STATUSES = new Set(['bounced', 'hard_bounced']);

export function hasUsablePhone(i: RoutingInputs): boolean {
  const { phone, phoneStatus } = i.persona;
  if (!phone || phone.trim() === '') return false;
  return !(phoneStatus != null && UNUSABLE_PHONE_STATUSES.has(phoneStatus));
}

export function emailUsable(i: RoutingInputs): boolean {
  const { emailValid, emailStatus } = i.persona;
  if (!emailValid) return false;
  if (emailStatus != null && BOUNCED_EMAIL_STATUSES.has(emailStatus)) return false;
  // A suppressed address is never an email target, whatever its class: the
  // send gate refuses it, so routing must not recommend an email action.
  // Phone and LinkedIn stay open for the soft and invalid-address classes.
  return !suppressionOf(i).emailBlockedAtSend;
}

/**
 * The provenance class of this person's suppression (src/lib/gap/suppression/
 * provenance.ts). Routing only: the send gate still refuses on any hit.
 */
export function suppressionOf(i: RoutingInputs): SuppressionClassification {
  return classifySuppression({
    verdict: i.suppression.verdict,
    legs: i.suppression.legs,
    persona: { doNotContact: i.persona.doNotContact, emailStatus: i.persona.emailStatus },
  });
}

export function hypothesisLive(i: RoutingInputs): boolean {
  const s = i.hypothesis?.status;
  return s === 'approved' || s === 'active';
}

function hypothesisExpired(i: RoutingInputs): boolean {
  const exp = i.hypothesis?.expiresAt;
  return exp != null && exp.getTime() <= i.now.getTime();
}

export function hotTriggerNormThreshold(i: RoutingInputs): number {
  return i.freshness.hotTriggerNormThreshold ?? HOT_TRIGGER_NORM_THRESHOLD;
}

/** A fresh trigger at or above the normalized ping tier within the hot window. */
export function hotTrigger(i: RoutingInputs) {
  const { hotTriggerDays } = i.freshness;
  const threshold = hotTriggerNormThreshold(i);
  return i.signals.freshTriggers.find(
    (t) => t.normScore >= threshold && withinDays(i.now, t.firstSeenAt, hotTriggerDays),
  );
}

/**
 * "Hot" = a fresh trigger with normScore at or above HOT_TRIGGER_NORM_THRESHOLD within hotTriggerDays,
 * OR a verified email reply, OR fresh account intent at or above 60.
 * The intent legs are private inputs: they may drive the rule but never explain text.
 */
export function isHot(i: RoutingInputs): boolean {
  if (hotTrigger(i)) return true;
  if (i.persona.lastIntentSource === 'email_reply_verified') return true;
  const { intentScore, lastIntentAt } = i.account;
  return intentScore != null && intentScore >= 60 && withinDays(i.now, lastIntentAt, i.freshness.hotTriggerDays);
}

function inCooldown(i: RoutingInputs): boolean {
  const { lastOutboundAt, lastInboundAt } = i.comms;
  if (!withinDays(i.now, lastOutboundAt, i.freshness.cooldownDays)) return false;
  const repliedSince = lastInboundAt != null && lastOutboundAt != null && lastInboundAt.getTime() >= lastOutboundAt.getTime();
  return !repliedSince;
}

function tierFits(i: RoutingInputs): boolean {
  const { tamTier, heatTier } = i.account;
  return tamTier === 'A' || tamTier === 'B' || heatTier <= 3;
}

function lastDisposition(i: RoutingInputs) {
  return i.comms.lastDisposition;
}

/**
 * B6 (Opus adversarial review, 2026-09-24): protect active commercial
 * motion. An open deal, a booked meeting, or a recent confirmed positive
 * disposition means cold prospecting is inappropriate; a human is already
 * in conversation. `Account.pipeline_stage` is modex's own progression
 * (src/lib/pipeline.ts), largely DERIVED from ordinary outreach activity;
 * `targeted`/`contacted`/`engaged` are what routing itself produces on the
 * way to a real conversation and must not block further routing (R2
 * in_flight and R16 cooldown already govern that). Only `meeting` (a
 * meeting was booked or requested) and later (`proposal`, `closed`) signal
 * genuine commercial momentum worth protecting.
 */
const ADVANCED_PIPELINE_STAGES = new Set(['meeting', 'proposal', 'closed']);

/** The minimal slice `hasActiveOpportunity` needs, so enroll/service.ts (B6)
 *  can build one from a fresh targeted read instead of a full RoutingInputs. */
export interface ActiveOpportunityInputs {
  account: Pick<RoutingInputs['account'], 'pipelineStage'>;
  comms: Pick<RoutingInputs['comms'], 'meetingBooked' | 'lastDisposition'>;
  now: Date;
  freshness: Pick<RoutingInputs['freshness'], 'cooldownDays'>;
}

function hasOpenPipelineStage(i: ActiveOpportunityInputs): boolean {
  const stage = i.account.pipelineStage;
  return !!stage && ADVANCED_PIPELINE_STAGES.has(stage);
}

const POSITIVE_DISPOSITION_CLASSES = new Set<ResponseClass>(['meeting_accepted', 'request_information']);

function recentPositiveDisposition(i: ActiveOpportunityInputs): RoutingLastDisposition | null {
  const d = i.comms.lastDisposition;
  if (d == null || !POSITIVE_DISPOSITION_CLASSES.has(d.responseClass)) return null;
  return withinDays(i.now, d.at, i.freshness.cooldownDays) ? d : null;
}

/** Exported for enroll/service.ts (B6): the enroll guard re-checks this
 *  predicate against a fresh read at enroll time, so a routing decision that
 *  has gone stale (a meeting booked after the decision was made) still
 *  blocks. Same predicate, not a second opportunity model. */
export function hasActiveOpportunity(i: ActiveOpportunityInputs): boolean {
  return hasOpenPipelineStage(i) || i.comms.meetingBooked || recentPositiveDisposition(i) != null;
}

/**
 * The leg name for the modex `Persona.do_not_contact` column. The same name
 * clawd uses when its modex leg refuses, so a remote hit and the local column
 * collapse to one leg instead of two spellings of the same fact.
 */
export const MODEX_DO_NOT_CONTACT_LEG = 'modex_do_not_contact';

/**
 * Every leg that says "do not contact": the remote legs marked `hit`, plus the
 * local column (R2-1), in that order, never the modex leg twice.
 */
function suppressedLegs(i: RoutingInputs): string[] {
  return suppressionOf(i).hits;
}

/** R0: only a HARD COMPLIANCE class is a permanent system block (final pass, 2026-09-25). */
function isHardSuppressed(i: RoutingInputs): boolean {
  return suppressionOf(i).class === 'hard_compliance';
}

function unknownLegs(i: RoutingInputs): string[] {
  return Object.entries(i.suppression.legs)
    .filter(([, v]) => v === 'unknown')
    .map(([k]) => k);
}

/**
 * R17 target resolution: hubspot_native when the Top100 manifest carries a
 * rig-built sequence the contact is eligible for, modex_queue when the persona
 * has no Top100 entry at all, build_required otherwise.
 */
export function resolveEnrollTarget(i: RoutingInputs): EnrollTarget {
  const t = i.persona.top100;
  if (t == null) return 'modex_queue';
  if (t.hubspotSequenceId && t.eligibility === 'ELIGIBLE' && !t.sequenceBlock) return 'hubspot_native';
  return 'build_required';
}

// ---------------------------------------------------------------------------
// The ordered rule table (spec section 6, R0 through R19)
// ---------------------------------------------------------------------------

export const RULES: RoutingRule[] = [
  {
    id: 'suppressed',
    label: 'R0',
    when: isHardSuppressed,
    action: 'do_not_contact',
    lane: 'blocked',
    blocked: true,
    reason: (i) => `suppressed:${suppressedLegs(i).join(',') || 'unspecified'}`,
    predicate: (i) => {
      const c = suppressionOf(i);
      const hard = c.reasons.filter((r) => r.class === 'hard_compliance').map((r) => r.leg);
      const local = i.persona.doNotContact ? `; persona is recorded do_not_contact (${MODEX_DO_NOT_CONTACT_LEG})` : '';
      return `hard compliance suppression on ${hard.join(', ') || 'an unspecified leg'}${local}`;
    },
  },
  {
    id: 'suppression_unknown',
    label: 'R0b',
    when: (i) => i.suppression.verdict === 'unknown',
    action: 'research_required',
    lane: 'blocked',
    blocked: true,
    reason: () => 'suppression_unknown',
    predicate: (i) =>
      `suppression verdict is unknown (${unknownLegs(i).join(', ') || 'no leg answered'}); nothing outbound may be created`,
  },
  {
    id: 'suppression_review',
    label: 'R0c',
    // A DNC whose origin cannot be proven: never a silent permanent DNC, never outreach.
    when: (i) => suppressionOf(i).class === 'unknown_provenance',
    action: 'research_required',
    lane: 'work_queue',
    reason: (i) => `suppression_review:${suppressedLegs(i).join(',')}`,
    predicate: (i) =>
      `a do-not-contact flag exists on ${suppressedLegs(i).join(', ')} but its origin cannot be proven; review it before any outreach (email stays blocked at send)`,
  },
  {
    id: 'tam_out',
    label: 'R1',
    when: (i) => i.account.tam === 'out',
    skip: 'tam_out',
    predicate: () => 'account is out of TAM',
  },
  {
    id: 'in_flight',
    label: 'R2',
    when: (i) => i.comms.inFlight,
    skip: 'in_flight',
    predicate: () => 'an approved or sending draft already exists for this persona',
  },
  {
    id: 'reply_pending',
    label: 'R3',
    when: (i) => i.comms.undispositionedInbound,
    action: 'one_off_email',
    lane: 'reply_triage',
    reason: () => 'reply_pending',
    predicate: () => 'an inbound reply has no disposition yet',
  },
  {
    id: 'active_opportunity',
    label: 'R3b',
    when: hasActiveOpportunity,
    action: 'nurture',
    lane: 'work_queue',
    reason: (i) => {
      if (hasOpenPipelineStage(i)) return 'active_opportunity:pipeline';
      if (i.comms.meetingBooked) return 'active_opportunity:meeting_booked';
      return 'active_opportunity:recent_positive_disposition';
    },
    predicate: (i) => {
      if (hasOpenPipelineStage(i)) return `account has an open pipeline stage (${i.account.pipelineStage})`;
      if (i.comms.meetingBooked) return 'a meeting is booked';
      const d = recentPositiveDisposition(i)!;
      return `a confirmed ${d.responseClass} disposition ${Math.round(ageDays(i.now, d.at))} days ago (within ${i.freshness.cooldownDays})`;
    },
  },
  {
    id: 'bounced_or_invalid',
    label: 'R4',
    when: (i) => !emailUsable(i) && !hasUsablePhone(i),
    action: 'research_required',
    lane: 'work_queue',
    reason: () => 'contact_invalid',
    predicate: (i) =>
      `email is ${i.persona.emailValid ? `marked ${i.persona.emailStatus}` : 'invalid'} and there is no usable phone`,
  },
  {
    id: 'disp_wrong_person',
    label: 'R5',
    when: (i) => {
      const d = lastDisposition(i);
      return d != null && (d.responseClass === 'wrong_person' || d.responseClass === 'referral');
    },
    action: 'research_required',
    lane: 'work_queue',
    reason: (i) => lastDisposition(i)?.responseClass ?? 'wrong_person',
    predicate: (i) => {
      const d = lastDisposition(i)!;
      const who = d.referral
        ? ` to ${[d.referral.name, d.referral.title].filter(Boolean).join(', ') || 'an unnamed referral'}`
        : '';
      return `last disposition was ${d.responseClass}${who}; find the right person`;
    },
  },
  {
    id: 'disp_timing',
    label: 'R6',
    when: (i) => {
      const d = lastDisposition(i);
      return d != null && d.responseClass === 'timing' && d.resumeAt != null && d.resumeAt.getTime() > i.now.getTime();
    },
    action: 'nurture',
    lane: 'work_queue',
    reason: () => 'timing',
    predicate: (i) => `last disposition was timing with resume on ${lastDisposition(i)!.resumeAt!.toISOString().slice(0, 10)}`,
  },
  {
    id: 'disp_not_priority',
    label: 'R7',
    when: (i) => {
      const d = lastDisposition(i);
      return d != null && d.responseClass === 'not_priority' && withinDays(i.now, d.at, 90);
    },
    action: 'nurture',
    lane: 'work_queue',
    reason: () => 'not_priority',
    predicate: (i) => `last disposition was not_priority ${Math.round(ageDays(i.now, lastDisposition(i)!.at))} days ago (within 90)`,
  },
  {
    id: 'disp_objection',
    label: 'R8',
    when: (i) => {
      const d = lastDisposition(i);
      return (
        d != null &&
        (d.responseClass === 'existing_solution' || d.responseClass === 'problem_rejected') &&
        withinDays(i.now, d.at, 30)
      );
    },
    action: 'one_off_email',
    lane: 'work_queue',
    reason: () => 'objection',
    predicate: (i) =>
      `last disposition was ${lastDisposition(i)!.responseClass} ${Math.round(ageDays(i.now, lastDisposition(i)!.at))} days ago (within 30); human-written reply, compiler-checked`,
  },
  {
    id: 'tam_unknown',
    label: 'R9',
    when: (i) => i.account.tam === 'unknown',
    action: 'research_required',
    lane: 'work_queue',
    reason: () => 'tam_unverified',
    predicate: () => 'TAM is unverified',
  },
  {
    id: 'no_hypothesis',
    label: 'R10',
    when: (i) => i.hypothesis == null,
    action: 'research_required',
    lane: 'work_queue',
    reason: () => 'no_hypothesis',
    predicate: () => 'no hypothesis exists for this account',
  },
  {
    id: 'hyp_proposed',
    label: 'R11',
    when: (i) => i.hypothesis?.status === 'draft' || i.hypothesis?.status === 'review_required',
    action: 'approve_hypothesis',
    lane: 'work_queue',
    reason: (i) => i.hypothesis!.status,
    predicate: (i) => `hypothesis ${i.hypothesis!.id} is ${i.hypothesis!.status} and needs a human decision`,
  },
  {
    id: 'hyp_stale',
    label: 'R12',
    when: (i) => hypothesisLive(i) && (!i.hypothesis!.evidenceFresh || hypothesisExpired(i)),
    action: 'research_required',
    lane: 'work_queue',
    reason: (i) => (hypothesisExpired(i) ? 'hypothesis_expired' : 'evidence_stale'),
    predicate: (i) =>
      hypothesisExpired(i)
        ? `hypothesis ${i.hypothesis!.id} expired on ${i.hypothesis!.expiresAt!.toISOString().slice(0, 10)}`
        : `hypothesis ${i.hypothesis!.id} rests on evidence older than ${i.freshness.evidenceMaxAgeDays} days`,
  },
  {
    id: 'evidence_thin',
    label: 'R12b',
    // Closeout 2026-09-25: Joey Maggard's card recommended an email on a
    // hypothesis whose only evidence was "KR 10-Q mentions: capital
    // expenditure". A keyword hit is not a reason to contact someone.
    when: (i) => hypothesisLive(i) && i.hypothesis!.evidenceThin === true,
    action: 'research_required',
    lane: 'work_queue',
    reason: () => 'evidence_thin',
    predicate: (i) =>
      `hypothesis ${i.hypothesis!.id} rests only on an automated keyword hit with no quoted evidence; add a sourced fact before any outreach`,
  },
  {
    id: 'hyp_resolved',
    label: 'R13',
    // Terminal AND no newer version (R2-4): a reopened hypothesis is a new
    // row with supersedes_id, and that row owns the routing, not this one.
    when: (i) =>
      i.hypothesis != null &&
      (HYPOTHESIS_TERMINAL_STATUSES as readonly string[]).includes(i.hypothesis.status) &&
      !i.hypothesis.hasNewerVersion,
    action: 'nurture',
    lane: 'work_queue',
    reason: () => 'loop_closed',
    predicate: (i) => `hypothesis ${i.hypothesis!.id} is ${i.hypothesis!.status}; learning owns the loop now`,
  },
  {
    id: 'hot_call',
    label: 'R14',
    when: (i) => hypothesisLive(i) && isHot(i) && hasUsablePhone(i) && i.persona.roleGatePassed,
    action: 'call_now',
    lane: 'work_queue',
    bonus: ACTION_BONUS.call_now,
    reason: () => 'hot',
    predicate: () => 'hypothesis is approved, the account is hot, the phone is usable and the role gate passed',
  },
  {
    id: 'hot_email',
    label: 'R15',
    // emailUsable, not emailValid (R2-8): a bounced address is never a send target.
    when: (i) => hypothesisLive(i) && isHot(i) && !hasUsablePhone(i) && emailUsable(i),
    action: 'one_off_email',
    lane: 'work_queue',
    bonus: ACTION_BONUS.one_off_email,
    reason: () => 'hot',
    predicate: () => 'hypothesis is approved, the account is hot, no usable phone, email is usable',
  },
  {
    id: 'cooldown',
    label: 'R16',
    when: (i) => inCooldown(i),
    action: 'nurture',
    lane: 'work_queue',
    reason: () => 'cooldown',
    predicate: (i) =>
      `outbound ${Math.round(ageDays(i.now, i.comms.lastOutboundAt!))} days ago (within ${i.freshness.cooldownDays}) with no reply since`,
  },
  {
    id: 'enroll',
    label: 'R17',
    // emailUsable, not emailValid (R2-8): a hard-bounced address with a usable phone was enrolled before this.
    when: (i) =>
      hypothesisLive(i) && i.account.tam === 'in' && tierFits(i) && i.persona.roleGatePassed && emailUsable(i),
    action: 'enroll_gap_sequence',
    lane: 'work_queue',
    bonus: ACTION_BONUS.enroll_gap_sequence,
    reason: (i) => `enroll:${resolveEnrollTarget(i)}`,
    predicate: (i) =>
      `hypothesis is approved, TAM in, tier ${i.account.tamTier || 'unrated'} at heat tier ${i.account.heatTier}, role gate passed, email usable; target ${resolveEnrollTarget(i)}`,
  },
  {
    id: 'linkedin',
    label: 'R18',
    // emailUsable, not emailValid (R2-8, concern 1): a hard-bounced address has no email path either.
    when: (i) => hypothesisLive(i) && !emailUsable(i) && !!i.persona.linkedinUrl,
    action: 'linkedin_manual_task',
    lane: 'work_queue',
    reason: () => 'no_usable_email',
    predicate: (i) =>
      `hypothesis is approved, email is ${i.persona.emailValid ? `marked ${i.persona.emailStatus}` : 'invalid'}, LinkedIn profile present`,
  },
  {
    id: 'default',
    label: 'R19',
    when: () => true,
    action: 'nurture',
    lane: 'work_queue',
    reason: () => 'no_fit_for_sequence',
    predicate: () => 'no earlier rule matched',
  },
];

/** First rule whose predicate holds. `default` always matches, so this never returns undefined. */
export function firstMatchingRule(inputs: RoutingInputs, rules: RoutingRule[] = RULES): RoutingRule {
  for (const rule of rules) {
    if (rule.when(inputs)) return rule;
  }
  return rules[rules.length - 1];
}

/** Priority = heat (0-100) + rule bonus + seniority x 2, rounded. */
export function priorityFor(inputs: RoutingInputs, rule: RoutingRule): number {
  const bonus = rule.bonus ?? (rule.action ? ACTION_BONUS[rule.action] : 0);
  return Math.round(inputs.account.heat + bonus + inputs.persona.seniorityRank * 2);
}
