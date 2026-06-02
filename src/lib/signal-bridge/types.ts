/**
 * Data contract for the clawd → modex-gtm signal bridge.
 *
 * Shape returned by clawd's live endpoint:
 *   GET {CLAWD_BASE_URL}/api/yardflow/account/{domain}/export
 *   Auth: Authorization: Bearer {MC_API_TOKEN}
 *
 * modex-gtm depends ONLY on this shape (verified live for cargill.com).
 */

export type CommitteeRole = 'buyer' | 'operator' | 'member';

export interface ClawdSignal {
  title: string;
  url: string;
  angle: string;
  published?: string;
}

export interface ClawdFit {
  facility_count: number | null;
  segment: string | null;
  fit_tier: string | null;
}

export interface ClawdCommitteeMember {
  full_name: string;
  title: string;
  email: string;
  email_confidence: string;
  role: CommitteeRole;
}

export interface ClawdAccountExport {
  company: string;
  domain: string;
  in_intent_feed: boolean;
  fit: ClawdFit;
  signals: ClawdSignal[];
  roi_hook: Record<string, unknown> | null;
  incumbent_vendor: string | null;
  brief: string;
  recommended_play: string;
  committee: ClawdCommitteeMember[];
}

/**
 * accounts.json entry consumed by scripts/generate-microsite-data.ts.
 * Only the fields the bridge sets are typed here (the generator tolerates the rest).
 */
export interface AccountJsonEntry {
  rank: number;
  name: string;
  parent_brand?: string | null;
  vertical: string;
  signal_type: string;
  why_now: string;
  primo_angle: string;
  best_intro_path?: string | null;
  source: string;
  source_url_1: string | null;
  source_url_2: string | null;
  icp_fit: number;
  modex_signal: number;
  primo_story_fit: number;
  warm_intro: number;
  strategic_value: number;
  meeting_ease: number;
  priority_score: number;
  priority_band: string;
  tier: string;
  owner: string;
  research_status: string;
  outreach_status: string;
  meeting_status: string;
  current_motion?: string;
  next_action?: string;
  notes?: string;
  hq_location?: string;
  facility_count?: string;
  custom_hero?: string;
  custom_problem_narrative?: string;
  specific_pain_points?: { headline: string; description: string; kpiImpact?: string }[];
}

/**
 * personas.json entry consumed by the microsite generator.
 */
export interface PersonaJsonEntry {
  persona_id: string;
  account: string;
  priority: string;
  name: string;
  title: string;
  persona_lane: string;
  role_in_deal: string;
  intro_route: string;
  function: string;
  seniority: string;
  why_this_persona: string;
  linkedin_url: string;
  attendance_signal: string;
  intro_path: string;
  persona_status: string;
  next_step: string;
  notes: string;
  account_score: number;
  email: string;
  phone: string | null;
}

/**
 * Prisma Persona upsert payload (send-readiness lives here, not in the JSON).
 */
export interface PrismaPersonaInput {
  persona_id: string;
  account_name: string;
  priority: string;
  name: string;
  first_name: string;
  last_name: string;
  title: string;
  persona_lane: string;
  role_in_deal: string;
  email: string | null;
  email_status: string;
  email_confidence: number;
  email_valid: boolean;
  company_domain: string;
  persona_status: string;
  is_contact_ready: boolean;
  do_not_contact: boolean;
  source_type: string;
  source_url: string | null;
  notes: string;
}

/**
 * Prisma Account upsert payload. NOTE: the Account model has no facility/site
 * count column — facility count rides in accounts.json (for ROI math), and a
 * human-readable summary is folded into `notes` here.
 */
export interface PrismaAccountInput {
  rank: number;
  name: string;
  vertical: string;
  signal_type: string;
  why_now: string;
  primo_angle: string;
  best_intro_path: string | null;
  source: string;
  source_url_1: string | null;
  icp_fit: number;
  event_signal: number;
  primo_story_fit: number;
  warm_intro: number;
  priority_score: number;
  priority_band: string;
  tier: string;
  research_status: string;
  pipeline_stage: string;
  current_motion: string;
  next_action: string;
  notes: string;
}

export interface MappedSignalAccount {
  slug: string;
  warmIntroOnly: boolean;
  account: AccountJsonEntry;
  personasJson: PersonaJsonEntry[];
  prismaAccount: PrismaAccountInput;
  prismaPersonas: PrismaPersonaInput[];
}
