/**
 * GAP routing input and output types (Sprint 2, S2-T6).
 *
 * Everything under `src/lib/gap/routing/*` is pure: no Prisma, no fetch, no
 * clock reads. `RoutingInputs.now` is the only notion of time. The Sprint 2
 * inputs assembler builds `RoutingInputs`; `routePersona` consumes it.
 */

import type {
  HypothesisStatus,
  Persona,
  ProblemFamily,
  ResponseClass,
  RoutingAction,
  RoutingLane,
} from '../taxonomy';

export type SuppressionVerdict = 'clear' | 'suppressed' | 'unknown';

export interface RoutingAccountInput {
  name: string;
  slug?: string | null;
  hubspotCompanyId?: string | null;
  tam: 'in' | 'out' | 'unknown';
  tamTier: 'A' | 'B' | 'C' | '';
  heatTier: 1 | 2 | 3 | 4;
  /** 0-100. */
  heat: number;
  /** Private first-party intent. Feeds rules and priority only; never explain text. */
  intentScore: number | null;
  lastIntentAt: Date | null;
  triggerScore: number | null;
  lastTriggerAt: Date | null;
  outreachStatus: string | null;
  pipelineStage: string | null;
}

export interface RoutingSignalInput {
  id: string;
  score: number;
  normScore: number;
  categories: string[];
  firstSeenAt: Date;
  title: string;
  url: string | null;
}

export interface RoutingTop100Input {
  eligibility: string;
  sequenceBlock: string | null;
  hubspotSequenceId: string | null;
  sequenceName: string | null;
}

export interface RoutingPersonaInput {
  id: number;
  personaKey: Persona;
  roleGatePassed: boolean;
  seniorityRank: number;
  email: string | null;
  emailValid: boolean;
  emailStatus: string | null;
  phone: string | null;
  phoneStatus: string | null;
  linkedinUrl: string | null;
  hubspotContactId: string | null;
  qualVerdict: string | null;
  /** Private. Feeds the hot predicate only; never explain text. */
  lastIntentSource: string | null;
  doNotContact: boolean;
  top100?: RoutingTop100Input | null;
}

export interface RoutingHypothesisInput {
  id: string;
  status: HypothesisStatus;
  family: ProblemFamily | 'unmapped';
  confidence: number;
  evidenceFresh: boolean;
  expiresAt: Date | null;
  resumeAt: Date | null;
  version: number;
  observation: string;
  problemHypothesis: string;
  whyNow: string | null;
  falsificationQuestions: string[];
  whatANoMeans: string | null;
  evidenceIds: string[];
  signalIds: string[];
}

export interface RoutingLastDisposition {
  responseClass: ResponseClass;
  at: Date;
  resumeAt?: Date | null;
  referral?: { name?: string; title?: string } | null;
}

export interface RoutingCommsInput {
  inFlight: boolean;
  lastOutboundAt: Date | null;
  lastInboundAt: Date | null;
  undispositionedInbound: boolean;
  lastDisposition: RoutingLastDisposition | null;
  meetingBooked: boolean;
}

export interface RoutingFreshness {
  evidenceMaxAgeDays: number;
  hypothesisTtlDays: number;
  hotTriggerDays: number;
  cooldownDays: number;
  /**
   * Hot-trigger threshold on the normalized 0-100 `normScore` scale. Defaults
   * to `HOT_TRIGGER_NORM_THRESHOLD` in rules.ts (PING_THRESHOLD normalized as a
   * news score); set it only to pin a number in a test or a deliberate run.
   */
  hotTriggerNormThreshold?: number;
}

export type SuppressionLegVerdict = 'clear' | 'hit' | 'unknown';

export interface RoutingInputs {
  now: Date;
  account: RoutingAccountInput;
  signals: { freshTriggers: RoutingSignalInput[]; newestAgeDays: number | null };
  persona: RoutingPersonaInput;
  hypothesis: RoutingHypothesisInput | null;
  comms: RoutingCommsInput;
  suppression: { verdict: SuppressionVerdict; legs: Record<string, SuppressionLegVerdict> };
  freshness: RoutingFreshness;
}

/** Spec section 6: evidence 45 d, hypothesis TTL 45 d, hot trigger 7 d, cooldown 14 d. */
export const DEFAULT_FRESHNESS: RoutingFreshness = {
  evidenceMaxAgeDays: 45,
  hypothesisTtlDays: 45,
  hotTriggerDays: 7,
  cooldownDays: 14,
};

export type EnrollTarget = 'hubspot_native' | 'modex_queue' | 'build_required';

export interface RoutingExplain {
  whyAccount: string;
  whyPerson: string;
  whyProblem: string;
  whyNow: string;
  whyAction: string;
  evidenceIds: string[];
  signalIds: string[];
  wouldProveWrong: string;
}

export interface RoutingDecision {
  action: RoutingAction;
  lane: RoutingLane;
  ruleId: string;
  priority: number;
  blocked: boolean;
  /** Set only on skip-class rules; decisions carrying this never reach the queue. */
  skip?: string;
  /** Machine-readable reason code for the fired rule (for example `contact_invalid`). */
  reason?: string;
  target?: EnrollTarget;
  explain: RoutingExplain;
}

export type RouteResult =
  | { kind: 'decision'; decision: RoutingDecision }
  | { kind: 'skip'; ruleId: string; reason: string };
