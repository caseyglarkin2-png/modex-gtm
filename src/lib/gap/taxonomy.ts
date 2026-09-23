/**
 * GAP Prospecting OS taxonomy (Sprint 1, S1-T3).
 *
 * Every vocabulary the GAP domain uses lives here as an `as const` tuple with a
 * derived union type, so Prisma enums, Zod schemas, routing rules and UI copy
 * all import one source. Keep the tuples ordered; tests pin length and order.
 *
 * Voice: no em dashes, "yards" plural, "production capacity" never "throughput".
 */

import familyRules from './hypothesis/family-rules.json';

// ---------------------------------------------------------------------------
// Problem families
// ---------------------------------------------------------------------------

export const PROBLEM_FAMILIES = [
  'network_standardization',
  'hidden_capacity',
  'yard_state_integrity',
  'driver_gate_scale',
  'automation_readiness',
  'cost_to_ship',
  'chain_of_custody',
] as const;
export type ProblemFamily = (typeof PROBLEM_FAMILIES)[number];

export const UNMAPPED_FAMILY = 'unmapped' as const;
export type UnmappedFamily = typeof UNMAPPED_FAMILY;

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const SIGNAL_TYPES = [
  'acquisition',
  'new_site',
  'site_expansion',
  'automation_program',
  'job_posting',
  'technology_signal',
  'news',
  'intent',
  'website_behavior',
  'manual_research',
  'other',
] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export const SIGNAL_SOURCE_KINDS = [
  'pounce_trigger',
  'evidence_record',
  'top100_evidence',
  'pic_citation',
  'operator_knowledge',
  'crm',
  'manual',
] as const;
export type SignalSourceKind = (typeof SIGNAL_SOURCE_KINDS)[number];

export const SIGNAL_SOURCE_TYPES = [
  'public_primary',
  'public_secondary',
  'first_party_intent',
  'first_party',
  'crm',
  'manual',
] as const;
export type SignalSourceType = (typeof SIGNAL_SOURCE_TYPES)[number];

// ---------------------------------------------------------------------------
// Problem family catalog
// ---------------------------------------------------------------------------

export interface ProblemFamilyDefinition {
  problem: string;
  likelyCauses: string[];
  impacts: string[];
  signalTypes: SignalType[];
}

export const PROBLEM_FAMILY_CATALOG: Record<ProblemFamily, ProblemFamilyDefinition> = {
  network_standardization: {
    problem: 'Material operating variation across facilities.',
    likelyCauses: [
      'Local processes per site',
      'Acquired systems never unified',
      'Different driver and gate workflows',
      'Fragmented point solutions',
      'Tribal knowledge',
      'Inconsistent events',
    ],
    impacts: [
      'Incomparable KPIs',
      'Bespoke integrations',
      'Slower rollout',
      'Harder automation',
      'Support burden',
    ],
    signalTypes: ['acquisition', 'new_site', 'site_expansion', 'technology_signal'],
  },
  hidden_capacity: {
    problem: 'Physical handoffs constrain production capacity.',
    likelyCauses: [
      'Gate waiting',
      'Trailer search',
      'Stale asset state',
      'Dock and yard divergence',
      'Reactive spotting',
      'Sequential manual handoffs',
    ],
    impacts: [
      'Fewer turns',
      'Lost production capacity',
      'Overtime',
      'Detention',
      'Excess labor and capital',
    ],
    signalTypes: ['site_expansion', 'job_posting', 'news'],
  },
  yard_state_integrity: {
    problem: 'Operators cannot continuously trust yard state.',
    likelyCauses: [
      'Periodic yard checks',
      'Incomplete tracking',
      'Disconnected sensors',
      'Manual updates',
      'Assets outside owned telemetry',
    ],
    impacts: [
      'Searching',
      'Dock starvation',
      'Wrong moves',
      'Excess moves',
      'Weak orchestration',
    ],
    signalTypes: ['technology_signal', 'automation_program'],
  },
  driver_gate_scale: {
    problem: 'Driver and gate workflows do not scale consistently.',
    likelyCauses: [
      'Guard-shack dependence',
      'Paperwork',
      'Manual identity',
      'Local site rules',
      'Sequential check-in',
    ],
    impacts: [
      'Queues',
      'Turn-time variance',
      'Labor',
      'Carrier friction',
      'Security exposure',
    ],
    signalTypes: ['new_site', 'site_expansion', 'job_posting'],
  },
  automation_readiness: {
    problem: 'Physical automation is layered onto non-deterministic processes.',
    likelyCauses: [
      'Site variation',
      'Poor shared state',
      'Undocumented exceptions',
      'Manual approvals',
      'Inconsistent events',
    ],
    impacts: [
      'Narrow pilots',
      'Manual fallback',
      'Poor scale economics',
      'Integration burden',
    ],
    signalTypes: ['automation_program', 'technology_signal'],
  },
  cost_to_ship: {
    problem: 'Facility execution costs are hidden inside transportation economics.',
    likelyCauses: [
      'Dwell measured after the fact',
      'Incomplete milestone chain',
      'Disconnected systems',
      'Unclear action ownership',
    ],
    impacts: [
      'Detention and accessorials',
      'Lost driver productivity',
      'Carrier friction',
      'Service cost',
    ],
    signalTypes: ['news', 'intent'],
  },
  chain_of_custody: {
    problem: 'Visits and assets cannot be reconstructed reliably enough.',
    likelyCauses: [
      'Paper documents',
      'Fragmented identity',
      'Disconnected timestamps',
      'Poor seal, load and event records',
    ],
    impacts: [
      'Claims',
      'Disputes',
      'Theft and fraud exposure',
      'Audit and compliance labor',
    ],
    signalTypes: ['news', 'manual_research'],
  },
};

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export const PERSONAS = [
  'executive_ops',
  'supply_chain',
  'transportation',
  'distribution',
  'site_ops',
  'automation',
  'security',
  'finance_procurement',
  'technology',
] as const;
export type Persona = (typeof PERSONAS)[number];

// ---------------------------------------------------------------------------
// Hypothesis lifecycle
// ---------------------------------------------------------------------------

export const HYPOTHESIS_STATUSES = [
  'draft',
  'review_required',
  'approved',
  'active',
  'confirmed',
  'partially_confirmed',
  'rejected',
  'unresolved',
  'expired',
] as const;
export type HypothesisStatus = (typeof HYPOTHESIS_STATUSES)[number];

export const HYPOTHESIS_TERMINAL_STATUSES = [
  'confirmed',
  'partially_confirmed',
  'rejected',
  'unresolved',
  'expired',
] as const satisfies readonly HypothesisStatus[];
export type HypothesisTerminalStatus = (typeof HYPOTHESIS_TERMINAL_STATUSES)[number];

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export const ROUTING_ACTIONS = [
  'research_required',
  'approve_hypothesis',
  'call_now',
  'enroll_gap_sequence',
  'one_off_email',
  'linkedin_manual_task',
  'nurture',
  'do_not_contact',
] as const;
export type RoutingAction = (typeof ROUTING_ACTIONS)[number];

export const ROUTING_LANES = ['work_queue', 'reply_triage', 'blocked'] as const;
export type RoutingLane = (typeof ROUTING_LANES)[number];

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export const RESPONSE_CLASSES = [
  'problem_confirmed',
  'problem_partially_confirmed',
  'problem_rejected',
  'wrong_person',
  'referral',
  'not_priority',
  'timing',
  'existing_solution',
  'request_information',
  'meeting_accepted',
  'meeting_declined',
  'do_not_contact',
  'bounce',
  'out_of_office',
  'no_signal',
  'no_answer',
  'voicemail',
  'gatekeeper',
] as const;
export type ResponseClass = (typeof RESPONSE_CLASSES)[number];

/** Response classes that do not stop an enrollment or resolve a hypothesis. */
export const NON_STOPPING_RESPONSE_CLASSES = [
  'no_answer',
  'voicemail',
  'gatekeeper',
  'out_of_office',
] as const satisfies readonly ResponseClass[];
export type NonStoppingResponseClass = (typeof NON_STOPPING_RESPONSE_CLASSES)[number];

/** The Top100 lane's ten reply-handling buckets. */
export const REPLY_HANDLING_KEYS = [
  'positive_interest',
  'referral',
  'already_have_yms',
  '3pl_runs_it',
  'not_now',
  'wrong_person',
  'out_of_office',
  'bounce',
  'opt_out',
  'substantive_rejection',
] as const;
export type ReplyHandlingKey = (typeof REPLY_HANDLING_KEYS)[number];

export const REPLY_HANDLING_TO_RESPONSE_CLASS: Record<ReplyHandlingKey, ResponseClass[]> = {
  positive_interest: ['problem_confirmed', 'request_information'],
  referral: ['referral'],
  already_have_yms: ['existing_solution'],
  '3pl_runs_it': ['existing_solution'],
  not_now: ['timing', 'not_priority'],
  wrong_person: ['wrong_person'],
  out_of_office: ['out_of_office'],
  bounce: ['bounce'],
  opt_out: ['do_not_contact'],
  substantive_rejection: ['problem_rejected'],
};

// ---------------------------------------------------------------------------
// BIDs (buyer intelligence data points) and channels
// ---------------------------------------------------------------------------

export const BID_TYPES = [
  'current_state',
  'business_problem',
  'root_cause',
  'impact',
  'metric',
  'future_state',
  'priority',
  'constraint',
  'objection',
] as const;
export type BidType = (typeof BID_TYPES)[number];

export const BID_SOURCES = ['call', 'email', 'meeting', 'linkedin'] as const;
export type BidSource = (typeof BID_SOURCES)[number];

export const CHANNELS = ['call', 'email', 'linkedin', 'meeting'] as const;
export type Channel = (typeof CHANNELS)[number];

// ---------------------------------------------------------------------------
// Sequence steps
// ---------------------------------------------------------------------------

export const STEP_PURPOSES = [
  'intrigue',
  'root_cause',
  'impact',
  'value_offer',
  'hypothesis_test',
  'direct_diagnosis',
  'close_loop',
] as const;
export type StepPurpose = (typeof STEP_PURPOSES)[number];

export const LANE_PURPOSES = [
  'earn_reply',
  'clarify_consequence',
  'address_obstacle',
  'next_step_or_close',
] as const;
export type LanePurpose = (typeof LANE_PURPOSES)[number];

export const LANE_PURPOSE_MAP: Record<LanePurpose, StepPurpose> = {
  earn_reply: 'intrigue',
  clarify_consequence: 'root_cause',
  address_obstacle: 'value_offer',
  next_step_or_close: 'close_loop',
};

// ---------------------------------------------------------------------------
// Sequences and enrollments
// ---------------------------------------------------------------------------

export const SEQUENCE_ENGINES = ['hubspot_native', 'modex_draft_queue', 'manual'] as const;
export type SequenceEngine = (typeof SEQUENCE_ENGINES)[number];

export const ENROLLMENT_STATUSES = [
  'active',
  'paused',
  'stop_pending',
  'stopped',
  'completed',
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const STOP_REASONS = [
  'replied',
  'unsubscribed',
  'in_thread',
  'bounced',
  'dnc',
  'suppressed',
  'manual',
  'hypothesis_resolved',
  'hypothesis_expired',
  'sequence_retired',
  'legacy_unknown',
] as const;
export type StopReason = (typeof STOP_REASONS)[number];

// ---------------------------------------------------------------------------
// Hypothesis language guards
// ---------------------------------------------------------------------------

/** Lowercase substrings that mark a hypothesis as hedged (a guess, not a claim). */
export const HEDGE_TOKENS = [
  'my guess',
  'i suspect',
  'likely',
  'usually',
  'tends to',
  'might',
  'may be',
  'could be',
  'if ',
  '?',
] as const;
export type HedgeToken = (typeof HEDGE_TOKENS)[number];

/** Regex source strings that match unhedged second-person claims. Compile with the `i` flag. */
export const ASSERTIVE_PATTERNS = [
  'you are losing',
  'your yards are',
  'you have no',
  'you (are|re) (wasting|bleeding)',
] as const;

// ---------------------------------------------------------------------------
// Cross-system maps
// ---------------------------------------------------------------------------

export const POUNCE_THEMES = [
  'autonomy',
  'yard_direct',
  'network_capex',
  'expansion',
  'cost_restructure',
  'leadership',
  'digital_ops',
  'freight',
] as const;
export type PounceTheme = (typeof POUNCE_THEMES)[number];

/** Pounce trigger theme to problem family. `null` means the theme carries no family on its own. */
export const POUNCE_THEME_TO_FAMILY: Record<PounceTheme, ProblemFamily | null> = {
  autonomy: 'automation_readiness',
  yard_direct: 'yard_state_integrity',
  network_capex: 'hidden_capacity',
  expansion: 'network_standardization',
  cost_restructure: 'cost_to_ship',
  leadership: null,
  digital_ops: 'yard_state_integrity',
  freight: 'cost_to_ship',
};

export const PIC_BUYING_CENTERS = ['economic', 'champion', 'technical', 'blocker', 'user'] as const;
export type PicBuyingCenter = (typeof PIC_BUYING_CENTERS)[number];

export const PIC_BUYING_CENTER_TO_PERSONA: Record<PicBuyingCenter, Persona> = {
  economic: 'executive_ops',
  champion: 'supply_chain',
  technical: 'technology',
  blocker: 'finance_procurement',
  user: 'site_ops',
};

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function includes<T extends string>(tuple: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (tuple as readonly string[]).includes(value);
}

export function isProblemFamily(value: unknown): value is ProblemFamily {
  return includes(PROBLEM_FAMILIES, value);
}

export function isResponseClass(value: unknown): value is ResponseClass {
  return includes(RESPONSE_CLASSES, value);
}

export function isPersona(value: unknown): value is Persona {
  return includes(PERSONAS, value);
}

// ---------------------------------------------------------------------------
// Cue-based family classification
// ---------------------------------------------------------------------------

export interface FamilyRules {
  cues: string[];
}

export const FAMILY_RULES: Record<ProblemFamily, FamilyRules> = familyRules;

export interface FamilyClassification {
  primary: ProblemFamily | UnmappedFamily;
  /** Other families with at least one hit, highest count first. */
  secondary: ProblemFamily[];
  hits: Record<ProblemFamily, number>;
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

/**
 * Pure cue matcher. Lowercases the text, counts every non-overlapping
 * occurrence of every cue per family, and ranks families by hit count.
 * Ties break on catalog order (the order of `PROBLEM_FAMILIES`).
 * No cue hits at all returns `primary: 'unmapped'`.
 */
export function classifyFamilies(text: string): FamilyClassification {
  const lower = text.toLowerCase();
  const hits = {} as Record<ProblemFamily, number>;

  for (const family of PROBLEM_FAMILIES) {
    let total = 0;
    for (const cue of FAMILY_RULES[family].cues) {
      total += countOccurrences(lower, cue.toLowerCase());
    }
    hits[family] = total;
  }

  const ranked = PROBLEM_FAMILIES.filter((family) => hits[family] > 0).sort(
    (a, b) => hits[b] - hits[a] || PROBLEM_FAMILIES.indexOf(a) - PROBLEM_FAMILIES.indexOf(b),
  );

  if (ranked.length === 0) {
    return { primary: UNMAPPED_FAMILY, secondary: [], hits };
  }

  const [primary, ...secondary] = ranked;
  return { primary, secondary, hits };
}
