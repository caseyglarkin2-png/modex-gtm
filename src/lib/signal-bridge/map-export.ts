/**
 * Pure mapping: clawd account export → modex-gtm account + personas.
 *
 * No I/O here. The orchestrator (scripts/import-signal-account.ts) calls this,
 * then persists the result to accounts.json / personas.json + Prisma and runs
 * the microsite generator.
 */

import { isWarmIntroOnlyAccount } from '@/lib/studio/guardrails';
import type {
  AccountJsonEntry,
  ClawdAccountExport,
  ClawdCommitteeMember,
  MappedSignalAccount,
  PersonaJsonEntry,
  PrismaAccountInput,
  PrismaPersonaInput,
} from '@/lib/signal-bridge/types';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// fit.segment → microsite vertical (drives industry framing + VERTICAL_MAP).
const SEGMENT_VERTICAL: Record<string, string> = {
  shipper: 'Industrial',
  manufacturer: 'Manufacturing',
  manufacturing: 'Manufacturing',
  carrier: '3PL / Logistics',
  '3pl': '3PL / Logistics',
  broker: '3PL / Logistics',
  retail: 'Retail',
  retailer: 'Retail',
  grocery: 'Grocery',
  cpg: 'Food & Beverage',
  beverage: 'Beverage',
  food: 'Food & Beverage',
};

interface TierProfile {
  priority_band: string;
  tier: string;
  priority_score: number;
  icp_fit: number;
}

const TIER_PROFILE: Record<string, TierProfile> = {
  high: { priority_band: 'A', tier: 'Tier 1', priority_score: 90, icp_fit: 5 },
  medium: { priority_band: 'B', tier: 'Tier 2', priority_score: 75, icp_fit: 4 },
  med: { priority_band: 'B', tier: 'Tier 2', priority_score: 75, icp_fit: 4 },
  low: { priority_band: 'C', tier: 'Tier 3', priority_score: 55, icp_fit: 3 },
};

const DEFAULT_TIER: TierProfile = {
  priority_band: 'C',
  tier: 'Tier 3',
  priority_score: 50,
  icp_fit: 3,
};

function resolveTier(fitTier: string | null): TierProfile {
  if (!fitTier) return DEFAULT_TIER;
  return TIER_PROFILE[fitTier.trim().toLowerCase()] ?? DEFAULT_TIER;
}

function resolveVertical(segment: string | null): string {
  if (!segment) return 'Industrial';
  return SEGMENT_VERTICAL[segment.trim().toLowerCase()] ?? 'Industrial';
}

interface EmailConfidence {
  status: 'verified' | 'unverified';
  score: number;
}

function resolveEmailConfidence(raw: string | undefined | null): EmailConfidence {
  const normalized = (raw ?? '').trim().toLowerCase();
  if (normalized === 'high' || normalized === 'verified') return { status: 'verified', score: 90 };
  if (normalized === 'medium' || normalized === 'med') return { status: 'unverified', score: 60 };
  if (normalized === 'low') return { status: 'unverified', score: 30 };
  return { status: 'unverified', score: 0 };
}

interface RoleProfile {
  priority: string;
  persona_lane: string;
  role_in_deal: string;
  account_score: number;
}

const ROLE_PROFILE: Record<string, RoleProfile> = {
  buyer: { priority: 'P1', persona_lane: 'Exec sponsor', role_in_deal: 'Decision-maker', account_score: 5 },
  operator: { priority: 'P2', persona_lane: 'Operator / influencer', role_in_deal: 'Operator / influencer', account_score: 4 },
  member: { priority: 'P3', persona_lane: 'Operator / influencer', role_in_deal: 'Influencer', account_score: 3 },
};

function resolveRole(role: string): RoleProfile {
  return ROLE_PROFILE[role] ?? ROLE_PROFILE.member;
}

function inferSeniority(title: string): string {
  const t = title.toLowerCase();
  if (/\b(chief|cxo|coo|ceo|cfo|cio|cto|evp)\b/.test(t) || t.startsWith('c-')) return 'C-level';
  if (/\b(svp|senior vice president)\b/.test(t)) return 'SVP/EVP';
  if (/\bvp|vice president\b/.test(t)) return 'VP';
  if (/\bdirector\b/.test(t)) return 'Director';
  if (/\bmanager|lead|head\b/.test(t)) return 'Manager';
  return 'Manager';
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? '';
  const last = parts.slice(1).join(' ');
  return { first, last };
}

function roiSummary(roiHook: Record<string, unknown> | null): string | null {
  if (!roiHook) return null;
  const summary = roiHook.summary;
  if (typeof summary === 'string' && summary.trim()) return summary.trim();
  return null;
}

function bestAngleFor(member: ClawdCommitteeMember, exp: ClawdAccountExport): string {
  // Operators care about the freshest operational signal; everyone else gets the play.
  const signalAngle = exp.signals[0]?.angle;
  if (member.role === 'operator' && signalAngle) return signalAngle;
  return exp.recommended_play || signalAngle || '';
}

function buildAccountJson(
  exp: ClawdAccountExport,
  tier: TierProfile,
  warmIntroOnly: boolean,
): AccountJsonEntry {
  const topSignal = exp.signals[0];
  const roi = roiSummary(exp.roi_hook);

  const whyNow = topSignal
    ? `${topSignal.title} — ${topSignal.angle}`
    : exp.recommended_play || exp.brief;

  const painPoints = exp.signals.map((signal, index) => ({
    headline: signal.title,
    description: signal.angle,
    ...(index === 0 && roi ? { kpiImpact: roi } : {}),
  }));

  const notesParts = [
    `Imported from clawd intent engine (${exp.domain}).`,
    roi ? `ROI hook: ${roi}.` : null,
    exp.incumbent_vendor ? `Incumbent: ${exp.incumbent_vendor}.` : 'No known incumbent.',
    exp.recommended_play ? `Recommended play: ${exp.recommended_play}` : null,
  ].filter(Boolean);

  return {
    rank: 100,
    name: exp.company,
    vertical: resolveVertical(exp.fit.segment),
    signal_type: 'Live intent signal (clawd)',
    why_now: whyNow,
    primo_angle:
      exp.recommended_play ||
      'Primo proof maps to high-volume networks with throughput pressure at the yard layer.',
    best_intro_path: warmIntroOnly ? 'Warm intro only — route via existing relationship' : null,
    source: 'clawd intent engine',
    source_url_1: topSignal?.url ?? null,
    source_url_2: exp.signals[1]?.url ?? null,
    icp_fit: tier.icp_fit,
    // Intent accounts default to a network-audit CTA (modex_signal < 4), not a MODEX-booth CTA.
    modex_signal: 3,
    primo_story_fit: 4,
    warm_intro: warmIntroOnly ? 5 : 0,
    strategic_value: tier.icp_fit,
    meeting_ease: 3,
    priority_score: tier.priority_score,
    priority_band: tier.priority_band,
    tier: tier.tier,
    owner: 'Casey',
    research_status: 'Ready',
    outreach_status: warmIntroOnly ? 'Warm intro only' : 'Not started',
    meeting_status: 'No meeting',
    current_motion: 'Signal-bridge import',
    next_action: warmIntroOnly ? 'Route warm intro' : 'Review signal microsite + personas',
    notes: notesParts.join(' '),
    ...(exp.fit.facility_count != null ? { facility_count: String(exp.fit.facility_count) } : {}),
    ...(topSignal ? { custom_hero: topSignal.angle } : {}),
    custom_problem_narrative: exp.brief,
    ...(painPoints.length ? { specific_pain_points: painPoints } : {}),
  };
}

function buildPersonaJson(
  member: ClawdCommitteeMember,
  exp: ClawdAccountExport,
  personaId: string,
  warmIntroOnly: boolean,
): PersonaJsonEntry {
  const roleProfile = resolveRole(member.role);
  const angle = bestAngleFor(member, exp);
  return {
    persona_id: personaId,
    account: exp.company,
    priority: roleProfile.priority,
    name: member.full_name,
    title: member.title,
    persona_lane: roleProfile.persona_lane,
    role_in_deal: roleProfile.role_in_deal,
    intro_route: warmIntroOnly ? 'Warm intro only' : '',
    function: 'Supply Chain / Operations',
    seniority: inferSeniority(member.title),
    why_this_persona: `${capitalize(member.role)} on the buying committee. ${angle}`.trim(),
    linkedin_url: '',
    attendance_signal: 'clawd intent committee',
    intro_path: warmIntroOnly ? 'Warm intro only' : '',
    persona_status: 'Identified',
    next_step: warmIntroOnly ? 'Route via warm intro' : 'Confirm contact details',
    notes: angle ? `Best angle: ${angle}` : '',
    account_score: roleProfile.account_score,
    email: member.email ?? '',
    phone: null,
  };
}

function buildPrismaPersona(
  member: ClawdCommitteeMember,
  exp: ClawdAccountExport,
  personaId: string,
  warmIntroOnly: boolean,
): PrismaPersonaInput {
  const roleProfile = resolveRole(member.role);
  const { first, last } = splitName(member.full_name);
  const confidence = resolveEmailConfidence(member.email_confidence);
  const hasEmail = Boolean(member.email && member.email.trim());
  const angle = bestAngleFor(member, exp);

  // Send-ready only when the email is verified, present, and the account is not warm-intro-only.
  const isContactReady = confidence.status === 'verified' && hasEmail && !warmIntroOnly;

  return {
    persona_id: personaId,
    account_name: exp.company,
    priority: roleProfile.priority,
    name: member.full_name,
    first_name: first,
    last_name: last,
    title: member.title,
    persona_lane: roleProfile.persona_lane,
    role_in_deal: roleProfile.role_in_deal,
    email: hasEmail ? member.email.trim() : null,
    email_status: confidence.status,
    email_confidence: confidence.score,
    email_valid: hasEmail,
    company_domain: exp.domain,
    persona_status: isContactReady ? 'Ready' : hasEmail ? 'Identified' : 'To find',
    is_contact_ready: isContactReady,
    do_not_contact: warmIntroOnly,
    source_type: 'clawd-intent',
    source_url: exp.signals[0]?.url ?? null,
    notes: angle ? `Best angle: ${angle}` : '',
  };
}

function buildPrismaAccount(account: AccountJsonEntry): PrismaAccountInput {
  return {
    rank: account.rank,
    name: account.name,
    vertical: account.vertical,
    signal_type: account.signal_type,
    why_now: account.why_now,
    primo_angle: account.primo_angle,
    best_intro_path: account.best_intro_path ?? null,
    source: account.source,
    source_url_1: account.source_url_1,
    icp_fit: account.icp_fit,
    event_signal: account.modex_signal,
    primo_story_fit: account.primo_story_fit,
    warm_intro: account.warm_intro,
    priority_score: account.priority_score,
    priority_band: account.priority_band,
    tier: account.tier,
    research_status: 'Ready',
    pipeline_stage: 'targeted',
    current_motion: account.current_motion ?? 'Signal-bridge import',
    next_action: account.next_action ?? 'Review signal microsite',
    notes: account.notes ?? '',
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function mapClawdExport(exp: ClawdAccountExport): MappedSignalAccount {
  const slug = slugify(exp.company);
  const warmIntroOnly = isWarmIntroOnlyAccount(exp.company);
  const tier = resolveTier(exp.fit.fit_tier);

  const account = buildAccountJson(exp, tier, warmIntroOnly);
  const prismaAccount = buildPrismaAccount(account);

  const personasJson: PersonaJsonEntry[] = [];
  const prismaPersonas: PrismaPersonaInput[] = [];

  for (const member of exp.committee) {
    const personaId = `clawd-${slug}-${slugify(member.full_name)}`;
    personasJson.push(buildPersonaJson(member, exp, personaId, warmIntroOnly));
    prismaPersonas.push(buildPrismaPersona(member, exp, personaId, warmIntroOnly));
  }

  return { slug, warmIntroOnly, account, personasJson, prismaAccount, prismaPersonas };
}
