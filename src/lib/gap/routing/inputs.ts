/**
 * GAP routing inputs assembler (Sprint 2, S2-T5).
 *
 * The one place Prisma rows, the HubSpot snapshot, the Top100 lane and the
 * suppression authority are folded into a `RoutingInputs`. Everything under
 * `routing/*` downstream of this file stays pure; this file is the boundary.
 *
 * Contracts:
 * - Every DB read is wrapped: a thrown Prisma error becomes
 *   `{ skip: 'inputs_error:<read name>' }` rather than a crash, so one bad row
 *   never takes a routing run down.
 * - No HubSpot call here. TAM, tier, intent and trigger heat come in through
 *   `hubspotSnapshot`, which the Sprint 2 run reads via the existing
 *   companies.ts reader. Missing snapshot means `tam: 'unknown'`, and the
 *   rules then route to research (R9), which is the honest answer.
 * - The suppression read is injected (`SuppressionReader`) so tests never
 *   touch the network and so the send-time wire gate stays the only gate.
 *
 * Helpers reused rather than re-derived:
 * - `heatScore` + `tierNumber` (src/lib/revops/heat/heat-score.ts) for
 *   account heat and heat tier. Fed with: tam, tamTier, intentScore,
 *   lastIntentAt from the snapshot; pounceScore = snapshot.triggerScore, or
 *   the highest fresh trigger normScore when the snapshot has none;
 *   lastTriggerAt = snapshot.lastTriggerAt, or the newest fresh trigger's
 *   first_seen_at. No SQL/MQL density, deck or /for counts are available at
 *   this seam, so those components read zero; heat here ranks by first-party
 *   intent and public triggers only.
 * - `normalizeScore` (src/lib/pounce/fit.ts) for trigger normScore, the same
 *   scale the pounce spine and the qualification threshold use.
 * - `hasRoleGate` (src/lib/revops/qualification/model.ts) for the role gate,
 *   fed with Persona.seniority, Persona.function and Persona.title.
 */

import { createLimiter, type Limiter } from './bounded';
import { normalizeScore } from '../../pounce/fit';
import { hasRoleGate } from '../../revops/qualification/model';
import { heatScore, tierNumber } from '../../revops/heat/heat-score';
import type { HeatSignals } from '../../revops/heat/heat-score';
import { isPersona, isProblemFamily, isResponseClass, NON_STOPPING_RESPONSE_CLASSES } from '../taxonomy';
import type { HypothesisStatus, Persona } from '../taxonomy';
import type { Top100Manifest, Top100RosterPerson } from '../top100/reader';
import type { SuppressionReader } from './suppression-read';
import { DEFAULT_FRESHNESS } from './types';
import type {
  RoutingAccountInput,
  RoutingCommsInput,
  RoutingFreshness,
  RoutingHypothesisInput,
  RoutingInputs,
  RoutingLastDisposition,
  RoutingPersonaInput,
  RoutingSignalInput,
  RoutingTop100Input,
} from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Enrollment and draft statuses that mean "something outbound is already in motion". */
export const IN_FLIGHT_ENROLLMENT_STATUSES = ['active', 'paused', 'stop_pending'] as const;
export const IN_FLIGHT_DRAFT_STATUSES = ['approved', 'sending'] as const;

/**
 * What the Sprint 2 run reads off the HubSpot company (and, optionally, its
 * contacts) before calling the assembler. The assembler never calls HubSpot.
 */
export interface HubSpotAccountSnapshot {
  tam: 'in' | 'out' | 'unknown';
  tamTier: 'A' | 'B' | 'C' | '';
  intentScore?: number | null;
  lastIntentAt?: Date | null;
  triggerScore?: number | null;
  lastTriggerAt?: Date | null;
  /** Per-contact HubSpot properties, keyed by hubspot_contact_id. */
  contacts?: Record<string, HubSpotContactSnapshot>;
}

export interface HubSpotContactSnapshot {
  qualVerdict?: string | null;
  lastIntentSource?: string | null;
}

export interface Top100Context {
  manifest: Top100Manifest | null;
  roster: Top100RosterPerson[] | null;
}

export interface AssembleArgs {
  accountName: string;
  personaId: number;
  now?: Date;
  freshness?: RoutingFreshness;
  hubspotSnapshot?: HubSpotAccountSnapshot | null;
  top100?: Top100Context | null;
  suppression: SuppressionReader;
}

export type AssembleAccountArgs = Omit<AssembleArgs, 'personaId'>;

/**
 * 6A-T5: an OPTIONAL identity-resolution fallback for when the exact account
 * lookup misses. Undefined by default, so every caller that does not pass
 * one gets byte-identical behavior to before this ticket (an immediate
 * account_not_found). In practice `args.accountName` should already be
 * canonical by the time it reaches routing (6A-T4 resolves it upstream at
 * signal registration); this exists only as a defensive second chance for a
 * caller that has not gone through that path.
 */
export interface AssembleOpts {
  resolveAccountName?: (
    prisma: PrismaLike,
    input: { rawName: string },
  ) => Promise<{ ok: true; accountName: string } | { ok: false; reason: string }>;
}

export type AssembleResult = RoutingInputs | { skip: string };

export function isSkip(r: AssembleResult): r is { skip: string } {
  return 'skip' in r;
}

// ---------------------------------------------------------------------------
// Row shapes (the subset of each Prisma model this file reads)
// ---------------------------------------------------------------------------

interface AccountRow {
  name: string;
  hubspot_company_id: string | null;
  outreach_status: string | null;
  pipeline_stage: string | null;
}

interface PersonaRow {
  id: number;
  account_name: string;
  title: string | null;
  seniority: string | null;
  function: string | null;
  persona_lane: string | null;
  email: string | null;
  email_valid: boolean;
  email_status: string | null;
  phone: string | null;
  phone_status: string | null;
  linkedin_url: string | null;
  hubspot_contact_id: string | null;
  do_not_contact: boolean;
  is_contact_ready?: boolean;
}

interface TriggerRow {
  id: number;
  account_slug: string;
  title: string;
  url: string;
  source: string;
  score: number;
  categories: string[];
  first_seen_at: Date;
}

interface SignalRow {
  id: string;
  evidence_url: string | null;
  evidence_text: string | null;
  freshness_expires_at: Date | null;
  source_kind?: string | null;
  summary?: string | null;
}

/** An auto-ingested keyword trigger that quotes nothing (see RoutingHypothesisInput.evidenceThin). */
function isUnquotedTrigger(s: SignalRow): boolean {
  return s.source_kind === 'pounce_trigger' && !(s.evidence_text ?? '').trim() && !(s.summary ?? '').trim();
}

interface HypothesisRow {
  id: string;
  status: string;
  problem_family: string;
  confidence: number;
  observation: string;
  problem_hypothesis: string;
  why_now: string | null;
  falsification_questions: unknown;
  what_a_no_means: string | null;
  expires_at: Date | null;
  metadata: unknown;
  signals?: Array<{ signal: SignalRow }>;
}

interface DispositionRow {
  response_class: string;
  created_at: Date;
  confirmed_at?: Date | null;
  human_confirmed: boolean;
  /** ConversationDisposition has no metadata column today; resumeAt and referral are read from `metadata` if a later migration adds it, else from `ai_suggested`. */
  metadata?: unknown;
  ai_suggested?: unknown;
}

// ---------------------------------------------------------------------------
// Read wrapper: one named failure per read
// ---------------------------------------------------------------------------

class InputsReadError extends Error {
  constructor(readonly readName: string, cause: unknown) {
    super(`inputs read ${readName} failed: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'InputsReadError';
  }
}

async function read<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw new InputsReadError(name, err);
  }
}

// ---------------------------------------------------------------------------
// Persona key, seniority rank, role gate
// ---------------------------------------------------------------------------

/** Ordered: first match wins. Lowercase substrings on the joined title text. */
const PERSONA_PHRASES: Array<[Persona, string[]]> = [
  ['supply_chain', ['supply chain']],
  ['transportation', ['logistics', 'transportation']],
  ['site_ops', ['plant', 'site', 'operations', 'manufacturing']],
  ['automation', ['automation', 'engineering']],
  ['technology', ['technology']],
  ['finance_procurement', ['procurement', 'finance']],
  ['distribution', ['distribution', 'warehouse']],
  ['security', ['security']],
];

/** Acronyms need word boundaries and case: "it" inside "fitness" is not IT. */
const PERSONA_ACRONYMS: Array<[Persona, RegExp]> = [
  ['technology', /\b(?:CIO|IT)\b/],
  ['finance_procurement', /\bCFO\b/],
  ['distribution', /\bDC\b/],
];

function personaFromText(text: string): Persona | null {
  const lower = text.toLowerCase();
  for (const [persona, phrases] of PERSONA_PHRASES) {
    if (phrases.some((p) => lower.includes(p))) return persona;
    for (const [acronymPersona, pattern] of PERSONA_ACRONYMS) {
      if (acronymPersona === persona && pattern.test(text)) return persona;
    }
  }
  return null;
}

/**
 * Title first, then the lane the Persona row already carries, then function.
 * A lane that is itself a taxonomy persona key wins outright.
 */
export function personaKeyFor(p: { title: string | null; persona_lane: string | null; function: string | null }): Persona {
  const lane = (p.persona_lane ?? '').trim();
  if (isPersona(lane)) return lane;
  return personaFromText(p.title ?? '') ?? personaFromText(lane) ?? personaFromText(p.function ?? '') ?? 'executive_ops';
}

/** Spec rank: executive 5, vp (and owner/partner, the same senior set the role gate uses) 4, director 3, manager 2, else 1. */
export function seniorityRankFor(seniority: string | null | undefined): number {
  const s = (seniority ?? '').trim().toLowerCase();
  if (s === 'executive') return 5;
  if (s === 'vp' || s === 'owner' || s === 'partner') return 4;
  if (s === 'director') return 3;
  if (s === 'manager') return 2;
  return 1;
}

function roleGateFor(p: PersonaRow): boolean {
  return hasRoleGate({ hs_seniority: p.seniority ?? '', hs_role: p.function ?? '', jobtitle: p.title ?? '' });
}

// ---------------------------------------------------------------------------
// Small coercions
// ---------------------------------------------------------------------------

function lower(email: string | null | undefined): string | null {
  const e = String(email ?? '').trim().toLowerCase();
  return e.length > 0 ? e : null;
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function meta(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function hasEvidence(s: SignalRow): boolean {
  return !!(s.evidence_url && s.evidence_url.trim()) || !!(s.evidence_text && s.evidence_text.trim());
}

/** Case-insensitive equality filter for email columns that are not guaranteed lowercased on write. */
function emailWhere(email: string) {
  return { equals: email, mode: 'insensitive' as const };
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildSignals(rows: TriggerRow[], now: Date): RoutingInputs['signals'] {
  const freshTriggers: RoutingSignalInput[] = rows.map((r) => ({
    id: String(r.id),
    score: r.score,
    normScore: normalizeScore(r.score, r.source),
    categories: [...(r.categories ?? [])],
    firstSeenAt: r.first_seen_at,
    title: r.title,
    url: r.url || null,
    source: r.source,
  }));
  const newest = freshTriggers.reduce<Date | null>(
    (acc, t) => (acc == null || t.firstSeenAt.getTime() > acc.getTime() ? t.firstSeenAt : acc),
    null,
  );
  const newestAgeDays = newest ? Math.round(((now.getTime() - newest.getTime()) / DAY_MS) * 10) / 10 : null;
  return { freshTriggers, newestAgeDays };
}

function buildAccount(
  row: AccountRow,
  slug: string | null,
  snapshot: HubSpotAccountSnapshot | null,
  signals: RoutingInputs['signals'],
  now: Date,
): RoutingAccountInput {
  const tam = snapshot?.tam ?? 'unknown';
  const tamTier = snapshot?.tamTier ?? '';
  const intentScore = snapshot?.intentScore ?? null;
  const lastIntentAt = snapshot?.lastIntentAt ?? null;
  const triggerScore = snapshot?.triggerScore ?? null;
  const newestTrigger = signals.freshTriggers.reduce<RoutingSignalInput | null>(
    (acc, t) => (acc == null || t.firstSeenAt.getTime() > acc.firstSeenAt.getTime() ? t : acc),
    null,
  );
  const lastTriggerAt = snapshot?.lastTriggerAt ?? newestTrigger?.firstSeenAt ?? null;
  const pounceScore = triggerScore ?? signals.freshTriggers.reduce((m, t) => Math.max(m, t.normScore), 0);

  const heatSignals: HeatSignals = {
    name: row.name,
    slug: slug ?? undefined,
    tam,
    tamTier,
    intentScore: intentScore ?? undefined,
    lastIntentAt,
    pounceScore,
    lastTriggerAt,
  };
  const heat = heatScore(heatSignals, now.getTime());

  return {
    name: row.name,
    slug,
    hubspotCompanyId: row.hubspot_company_id ?? null,
    tam,
    tamTier,
    heatTier: tierNumber(heat.tier) as 1 | 2 | 3 | 4,
    heat: heat.heat,
    intentScore,
    lastIntentAt,
    triggerScore,
    lastTriggerAt,
    outreachStatus: row.outreach_status ?? null,
    pipelineStage: row.pipeline_stage ?? null,
  };
}

function matchRoster(p: PersonaRow, top100: Top100Context | null | undefined): RoutingTop100Input | null {
  const roster = top100?.roster;
  if (!roster || roster.length === 0) return null;
  const email = lower(p.email);
  const person = roster.find(
    (r) =>
      (p.hubspot_contact_id != null && r.hubspotContactId != null && r.hubspotContactId === p.hubspot_contact_id) ||
      (email != null && lower(r.email) === email),
  );
  if (!person) return null;
  const manifestAccount = top100?.manifest?.accounts[person.key] ?? null;
  return {
    eligibility: person.eligibility,
    sequenceBlock: person.sequenceBlock,
    hubspotSequenceId: manifestAccount?.sequence?.hubspotSequenceId ?? null,
    sequenceName: manifestAccount?.sequence?.name ?? null,
  };
}

function buildPersona(
  p: PersonaRow,
  snapshot: HubSpotAccountSnapshot | null,
  top100: Top100Context | null | undefined,
): RoutingPersonaInput {
  const email = lower(p.email);
  const contact = p.hubspot_contact_id ? snapshot?.contacts?.[p.hubspot_contact_id] : undefined;
  return {
    id: p.id,
    personaKey: personaKeyFor(p),
    roleGatePassed: roleGateFor(p),
    seniorityRank: seniorityRankFor(p.seniority),
    email,
    emailValid: email != null && p.email_valid === true,
    emailStatus: p.email_status ?? null,
    phone: p.phone && p.phone.trim() ? p.phone.trim() : null,
    phoneStatus: p.phone_status ?? null,
    linkedinUrl: p.linkedin_url && p.linkedin_url.trim() ? p.linkedin_url.trim() : null,
    hubspotContactId: p.hubspot_contact_id ?? null,
    qualVerdict: contact?.qualVerdict ?? null,
    lastIntentSource: contact?.lastIntentSource ?? null,
    doNotContact: p.do_not_contact === true,
    top100: matchRoster(p, top100),
  };
}

function buildHypothesis(h: HypothesisRow | null, now: Date, hasNewerVersion: boolean): RoutingHypothesisInput | null {
  if (!h) return null;
  const links = h.signals ?? [];
  const signals = links.map((l) => l.signal).filter((s): s is SignalRow => !!s);
  const evidenced = signals.filter(hasEvidence);
  const evidenceFresh = evidenced.some(
    (s) => s.freshness_expires_at == null || s.freshness_expires_at.getTime() > now.getTime(),
  );
  const m = meta(h.metadata);
  return {
    id: h.id,
    status: h.status as HypothesisStatus,
    family: isProblemFamily(h.problem_family) ? h.problem_family : 'unmapped',
    confidence: h.confidence,
    evidenceFresh,
    evidenceThin: signals.length > 0 && signals.every(isUnquotedTrigger),
    hasNewerVersion,
    expiresAt: h.expires_at ?? null,
    resumeAt: asDate(m.resumeAt),
    version: 1,
    observation: h.observation,
    problemHypothesis: h.problem_hypothesis,
    whyNow: h.why_now ?? null,
    falsificationQuestions: strList(h.falsification_questions),
    whatANoMeans: h.what_a_no_means ?? null,
    evidenceIds: evidenced.map((s) => s.id),
    signalIds: signals.map((s) => s.id),
  };
}

/** Test seam for the hypothesis section builder. */
export function buildHypothesisForTest(h: HypothesisRow | null, now: Date): RoutingHypothesisInput | null {
  return buildHypothesis(h, now, false);
}

function buildLastDisposition(d: DispositionRow | null): RoutingLastDisposition | null {
  if (!d || !isResponseClass(d.response_class)) return null;
  const m = { ...meta(d.ai_suggested), ...meta(d.metadata) };
  const referralRaw = meta(m.referral);
  const referral =
    Object.keys(referralRaw).length > 0
      ? {
          ...(typeof referralRaw.name === 'string' ? { name: referralRaw.name } : {}),
          ...(typeof referralRaw.title === 'string' ? { title: referralRaw.title } : {}),
        }
      : null;
  return {
    responseClass: d.response_class,
    at: d.confirmed_at ?? d.created_at,
    resumeAt: asDate(m.resumeAt),
    referral,
  };
}

// ---------------------------------------------------------------------------
// The assembler
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export async function assembleRoutingInputs(
  prisma: PrismaLike,
  args: AssembleArgs,
  opts: AssembleOpts = {},
): Promise<AssembleResult> {
  const now = args.now ?? new Date();
  const freshness = args.freshness ?? DEFAULT_FRESHNESS;
  const snapshot = args.hubspotSnapshot ?? null;

  try {
    let account = (await read('account', () =>
      prisma.account.findUnique({ where: { name: args.accountName } }),
    )) as AccountRow | null;

    if (!account && opts.resolveAccountName) {
      const resolved = await read('account_identity_fallback', () =>
        opts.resolveAccountName!(prisma, { rawName: args.accountName }),
      );
      if (resolved.ok) {
        account = (await read('account', () =>
          prisma.account.findUnique({ where: { name: resolved.accountName } }),
        )) as AccountRow | null;
      }
    }

    if (!account) return { skip: 'account_not_found' };

    const persona = (await read('persona', () =>
      prisma.persona.findUnique({ where: { id: args.personaId } }),
    )) as PersonaRow | null;
    if (!persona || persona.account_name !== account.name) return { skip: 'persona_not_found' };

    return await assembleLoaded(prisma, account, persona, { now, freshness, snapshot, top100: args.top100, suppression: args.suppression });
  } catch (err) {
    if (err instanceof InputsReadError) return { skip: `inputs_error:${err.readName}` };
    throw err;
  }
}

interface LoadedContext {
  now: Date;
  freshness: RoutingFreshness;
  snapshot: HubSpotAccountSnapshot | null;
  top100: Top100Context | null | undefined;
  suppression: SuppressionReader;
}

async function assembleLoaded(
  prisma: PrismaLike,
  account: AccountRow,
  persona: PersonaRow,
  ctx: LoadedContext,
): Promise<RoutingInputs> {
  const { now, freshness, snapshot, top100, suppression } = ctx;

  // Signals: non-dismissed triggers within four hot windows, newest first.
  // Suppression: the injected read, never the wire gate. It is the slow leg
  // (a Clawd round trip, about 3s) and needs only the email, so it starts now
  // and overlaps the DB reads below. A failed read is unknown, never clear.
  const email = lower(persona.email);
  const remoteSuppression: Promise<RoutingInputs['suppression']> | null = email
    ? (async () => suppression.read({ to: email }))().then(
        (r) => ({ verdict: r.verdict, legs: { ...r.legs } }),
        () => ({ verdict: 'unknown' as const, legs: {} }),
      )
    : null;

  const since = new Date(now.getTime() - freshness.hotTriggerDays * 4 * DAY_MS);
  const triggerRows = (await read('pounce_triggers', () =>
    prisma.pounceTrigger.findMany({
      where: { account_name: account.name, dismissed: false, first_seen_at: { gte: since } },
      orderBy: { first_seen_at: 'desc' },
    }),
  )) as TriggerRow[];
  const signals = buildSignals(triggerRows, now);
  const slug = triggerRows[0]?.account_slug ?? null;

  // Hypothesis: the persona's own newest row of ANY status, else the
  // account-level (null persona) one. Terminal rows are loaded on purpose
  // (R2-4): a resolved hypothesis must reach R13 instead of re-entering the
  // queue as research, and a terminal row that a newer version supersedes
  // is marked `hasNewerVersion` so R13 stays quiet on it.
  const hypothesisWhere = (personaId: number | null) => ({
    where: { account_name: account.name, primary_persona_id: personaId },
    orderBy: { created_at: 'desc' as const },
    include: { signals: { include: { signal: true } } },
  });
  let hypothesisRow = (await read('hypothesis', () =>
    prisma.prospectingHypothesis.findFirst(hypothesisWhere(persona.id)),
  )) as HypothesisRow | null;
  if (!hypothesisRow) {
    hypothesisRow = (await read('hypothesis_account', () =>
      prisma.prospectingHypothesis.findFirst(hypothesisWhere(null)),
    )) as HypothesisRow | null;
  }
  let hasNewerVersion = false;
  if (hypothesisRow) {
    const supersededBy = (await read('hypothesis_newer', () =>
      prisma.prospectingHypothesis.count({ where: { supersedes_id: hypothesisRow!.id } }),
    )) as number;
    hasNewerVersion = supersededBy > 0;
  }

  // Comms: keyed by the persona's lowercased email. No email means nothing outbound can be in flight.
  const comms = email ? await readComms(prisma, email) : emptyComms();

  let suppressionVerdict: RoutingInputs['suppression'] = { verdict: 'unknown', legs: {} };
  if (email && remoteSuppression) {
    suppressionVerdict = await remoteSuppression;
    // The local unsubscribe table is a HARD COMPLIANCE leg read directly
    // (final pass, 2026-09-25): recordUnsubscribe writes it for a recipient's
    // own unsubscribe and for a human do-not-contact disposition, and the
    // router's provenance taxonomy must see it as the recipient's decision,
    // not as the bare `do_not_contact` boolean it also sets. Unreadable is
    // unknown, never clear.
    try {
      const unsub = (await prisma.unsubscribedEmail.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      })) as { id: string } | null;
      if (unsub) suppressionVerdict = { verdict: 'suppressed', legs: { ...suppressionVerdict.legs, unsubscribed: 'hit' } };
    } catch {
      suppressionVerdict = { verdict: 'unknown', legs: { ...suppressionVerdict.legs, unsubscribed: 'unknown' } };
    }
  }

  return {
    now,
    account: buildAccount(account, slug, snapshot, signals, now),
    signals,
    persona: buildPersona(persona, snapshot, top100),
    hypothesis: buildHypothesis(hypothesisRow, now, hasNewerVersion),
    comms,
    suppression: suppressionVerdict,
    freshness,
  };
}

function emptyComms(): RoutingCommsInput {
  return {
    inFlight: false,
    lastOutboundAt: null,
    lastInboundAt: null,
    undispositionedInbound: false,
    lastDisposition: null,
    meetingBooked: false,
  };
}

/** Exported for the GAP next-touch evaluator (same comms truth routing uses). */
export async function readComms(prisma: PrismaLike, email: string): Promise<RoutingCommsInput> {
  const enrollment = await read('sequence_enrollment', () =>
    prisma.sequenceEnrollment.findFirst({
      where: { to_email: email, status: { in: [...IN_FLIGHT_ENROLLMENT_STATUSES] } },
      select: { id: true },
    }),
  );
  const draft = enrollment
    ? null
    : await read('draft_queue', () =>
        prisma.draftQueueItem.findFirst({
          where: { to_email: email, status: { in: [...IN_FLIGHT_DRAFT_STATUSES] } },
          select: { id: true },
        }),
      );
  const lastOutbound = (await read('email_log', () =>
    prisma.emailLog.findFirst({
      where: { to_email: emailWhere(email) },
      orderBy: { sent_at: 'desc' },
      select: { sent_at: true },
    }),
  )) as { sent_at: Date } | null;
  const lastInbound = (await read('inbound_message', () =>
    prisma.inboundMessage.findFirst({
      where: { from_email: emailWhere(email) },
      orderBy: { received_at: 'desc' },
      select: { received_at: true },
    }),
  )) as { received_at: Date } | null;
  // S4-T7: only a HUMAN-CONFIRMED row dispositions a reply. An unconfirmed AI
  // suggestion row (created_by ai, human_confirmed false) is stored, never
  // acted on, and must not hide the reply from R3 reply_pending. The same
  // confirmed read feeds undispositionedInbound, so the rules never see an
  // unconfirmed row.
  const lastConfirmed = (await read('disposition_confirmed', () =>
    prisma.conversationDisposition.findFirst({
      where: { contact_email: email, human_confirmed: true },
      orderBy: { created_at: 'desc' },
    }),
  )) as DispositionRow | null;

  // SF4 (Opus adversarial review, 2026-09-24): a call-only outcome (no_answer,
  // voicemail, gatekeeper, out_of_office) carries no buyer decision -- the
  // model's own effects table keeps the sequence running on it -- but being
  // the newest CONFIRMED row was enough to become lastDisposition and
  // meetingBooked, silently erasing a prior timing/not_priority/objection
  // disposition (switching off R6/R7's nurture window) or a booked meeting.
  // Routing reads only the newest SUBSTANTIVE (not call-only) disposition.
  const lastSubstantive = (await read('disposition_confirmed_substantive', () =>
    prisma.conversationDisposition.findFirst({
      where: {
        contact_email: email,
        human_confirmed: true,
        response_class: { notIn: [...NON_STOPPING_RESPONSE_CLASSES] },
      },
      orderBy: { created_at: 'desc' },
    }),
  )) as DispositionRow | null;

  const lastInboundAt = lastInbound?.received_at ?? null;
  const undispositionedInbound =
    lastInboundAt != null && (lastConfirmed == null || lastInboundAt.getTime() > lastConfirmed.created_at.getTime());

  return {
    inFlight: enrollment != null || draft != null,
    lastOutboundAt: lastOutbound?.sent_at ?? null,
    lastInboundAt,
    undispositionedInbound,
    lastDisposition: buildLastDisposition(lastSubstantive),
    // B6 (Opus adversarial review, 2026-09-24): derived from the same
    // confirmed, substantive-only read that feeds lastDisposition, so
    // neither an unconfirmed AI suggestion (B6) nor a later call-only
    // outcome (SF4) can claim or erase a booked meeting.
    meetingBooked: lastSubstantive?.response_class === 'meeting_accepted',
  };
}

// ---------------------------------------------------------------------------
// Account-level entry: the top contact-ready personas by seniority
// ---------------------------------------------------------------------------

export interface AssembleForAccountOptions {
  maxPersonas?: number;
  /**
   * People Casey already approved a hypothesis for at this account (first-
   * principles pass, 2026-09-25). They are routed IN ADDITION to the top
   * `maxPersonas` by seniority: approving a thesis for a person must lead to a
   * recommendation for that person, not vanish because two more senior people
   * exist. Still contact-ready only; capped by MAX_HYPOTHESIS_PERSONAS.
   */
  includePersonaIds?: readonly number[];
  /**
   * Targeted routing (debt burn, 2026-09-26): route exactly these people and
   * no one else at the account (APPROVE + USE routes the people Casey just put
   * in use). Overrides `maxPersonas` and `includePersonaIds`; still reachable
   * contact-ready people only, so a person with no email or phone is simply
   * not routed.
   */
  onlyPersonaIds?: readonly number[];
  /** Bounds concurrent per-person assembly (each does DB reads plus one Clawd suppression read). Default: one at a time. */
  limit?: Limiter;
}

/** Hard cap on hypothesis-named people routed per account in one run. */
export const MAX_HYPOTHESIS_PERSONAS = 10;

/**
 * Inputs for the top `maxPersonas` (default 2) contact-ready personas of an
 * account, ranked by seniority then id. A persona needs an email or a phone
 * to be worth routing; the rest are not loaded. Returns one entry per chosen
 * persona (inputs or a named skip), or a single skip when the account is
 * missing or the persona read fails.
 */
export async function assembleForAccount(
  prisma: PrismaLike,
  args: AssembleAccountArgs,
  opts: AssembleForAccountOptions = {},
): Promise<AssembleResult[]> {
  const maxPersonas = Math.max(0, opts.maxPersonas ?? 2);
  let account: AccountRow | null;
  let personas: PersonaRow[];
  try {
    account = (await read('account', () => prisma.account.findUnique({ where: { name: args.accountName } }))) as AccountRow | null;
    if (!account) return [{ skip: 'account_not_found' }];
    personas = (await read('personas', () =>
      prisma.persona.findMany({ where: { account_name: account!.name, is_contact_ready: true } }),
    )) as PersonaRow[];
  } catch (err) {
    if (err instanceof InputsReadError) return [{ skip: `inputs_error:${err.readName}` }];
    throw err;
  }

  const reachable = personas
    .filter((p) => lower(p.email) != null || (p.phone != null && p.phone.trim() !== ''))
    .sort((a, b) => seniorityRankFor(b.seniority) - seniorityRankFor(a.seniority) || a.id - b.id);
  let chosen: PersonaRow[];
  if (opts.onlyPersonaIds) {
    const only = new Set(opts.onlyPersonaIds);
    chosen = reachable.filter((p) => only.has(p.id));
  } else {
    const top = reachable.slice(0, maxPersonas);
    const named = new Set((opts.includePersonaIds ?? []).slice(0, MAX_HYPOTHESIS_PERSONAS));
    chosen = [...top, ...reachable.filter((p) => named.has(p.id) && !top.includes(p))];
  }

  // One promise per person, awaited together: the output keeps `chosen` order however the reads finish.
  const limit = opts.limit ?? createLimiter(1);
  return Promise.all(chosen.map((p) => limit(() => assembleRoutingInputs(prisma, { ...args, personaId: p.id }))));
}
