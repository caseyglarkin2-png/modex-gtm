/**
 * Disposition service (GAP Prospecting OS, Sprint 4, S4-T3).
 *
 * The DB glue around the pure model in ./model.ts. `recordDisposition` runs
 * the section 7 order, each step audited, and a failure after step 2 never
 * rolls back step 1: the row and its BIDs are the record of what the buyer
 * said, whatever the sequence engine or HubSpot did afterwards.
 *
 *   1. validate: the taxonomy (400 naming the field), the hypothesis must
 *      exist and be `active` (section 5.1 resolves only from active), the
 *      contact must be the hypothesis's persona or an unclaimed address
 *      (`suppressed_target_mismatch` when the email belongs to a persona of a
 *      DIFFERENT account), the source kind, and the AI suggestion when given.
 *   2. one `$transaction`: the ConversationDisposition row (contact_email
 *      lowercased, human_confirmed only for a HUMAN actor) plus every BID
 *      through `captureBid` with `disposition_id` set and `confirm` only for
 *      a human. A unique (source_kind, source_id) collision is `duplicate_source`
 *      with the existing id. When `aiSuggestionId` names an unconfirmed AI row
 *      for the same source, that row BECOMES the human's row: the class fields
 *      are set and `human_confirmed` flips in one update; `ai_suggested`
 *      keeps the suggestion and `metadata.aiSuggestion` records whether the
 *      human agreed.
 *   3. effects from `dispositionEffects(row)`. An agent-created row is
 *      unconfirmed and has NO effects (NO_EFFECTS by construction), so steps
 *      3 to 6 are skipped and the result says so. stopsRun: every live
 *      enrollment on the address or persona goes through `stop` (modex ->
 *      stopped with its unsent items skipped; hubspot_native -> stop_pending
 *      plus the review-feed line) and `stopRunsForRecipient` catches items
 *      with no enrollment. The stop reason is `dnc` for do_not_contact,
 *      `bounced` for bounce, `replied` otherwise. Non-stopping classes
 *      (out_of_office, no_answer, voicemail, gatekeeper) touch nothing: a
 *      modex run that ingest paused with a reply_pending marker STAYS paused
 *      until a human resumes it in the queue; this service never resumes.
 *   4. writesDnc -> `recordUnsubscribe` (src/lib/email/unsubscribe.ts), the
 *      ONLY writer of Persona.do_not_contact. This file never touches that
 *      column; a structural test scans for it.
 *   5. resolution when the class resolves: the hypothesis's human-confirmed
 *      dispositions and its confirmed unsuperseded BIDs go through
 *      `scoreResolution`; the DERIVED outcome (newest confirmed problem_*
 *      row, never the caller's class) is passed as `ctx.outcome` to the
 *      hypothesis service's `resolve`, whose machine derives the same thing
 *      and refuses on disagreement; `resolutionRecord` is then MERGED into
 *      the resolution JSON the machine wrote (the trigger does not freeze
 *      that column). The machine's `stop_enrollments:*` effects are applied.
 *      timing: the hypothesis stays active; `metadata.resumeAt` is the fact
 *      routing reads. wrong_person: the machine has no active -> draft edge,
 *      so the re-target is `close_unresolved` with reason `wrong_person:<id>`
 *      plus a NEW draft that carries `supersedes_id`, the same narrative and
 *      signals, and no primary persona (see `retargetForWrongPerson`).
 *      referral: audit `disposition.referral` naming the BID or the metadata
 *      that names the person; the router's `research_required` action does
 *      the rest.
 *   6. `mirrorDisposition` (fail-open; its status is recorded, never thrown).
 *
 * House convention for DB glue is `prisma: any`. Voice: no em dashes,
 * "yards" plural.
 */

import { recordUnsubscribe as defaultRecordUnsubscribe } from '@/lib/email/unsubscribe';
import { audit as defaultAudit, type GapAuditKind } from '../audit';
import { bidFromRow, selectConfirmedBids } from '../bid/select';
import { captureBid, validateBidInput, type BidActor } from '../bid/capture';
import type { ActorKind } from '../enroll/service';
import { mirrorDisposition as defaultMirror, type DispositionMirrorResult } from '../hubspot-mirror';
import { proposeHypothesis as defaultPropose, transitionHypothesis as defaultTransition } from '../hypothesis/service';
import { isTerminalStatus, type HypothesisStatus } from '../hypothesis/machine';
import { resolutionRecord, scoreResolution, type ResolutionDisposition } from '../hypothesis/resolution';
import { stop as defaultStop, stopEnrollmentsForHypothesis as defaultStopForHypothesis } from '../sequence/enrollment';
import { LIVE_ENROLLMENT_STATUSES } from '../sequence/family';
import { stopRunsForRecipient as defaultStopRuns } from '@/lib/queue/sequence-runtime';
import { dispositionEffects, validateDisposition, type DispositionEffects, type ValidDisposition } from './model';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const DISPOSITION_SOURCE_KINDS = ['inbound_message', 'hubspot_engagement', 'call', 'meeting', 'manual'] as const;
export type DispositionSourceKind = (typeof DISPOSITION_SOURCE_KINDS)[number];

/** The actor a route derives: a session is human, a header token is an agent. */
export const AI_ACTOR = 'ai' as const;

export interface DispositionBidInput {
  type: string;
  rawBuyerLanguage: string;
  normalizedSummary?: string | null;
  numericValue?: number | string | null;
  unit?: string | null;
  metadata?: unknown;
}

/** The Sprint 4 contract body plus the actor the route derived. */
export interface RecordDispositionInput {
  hypothesisId: string;
  personaId?: number | null;
  contactEmail: string;
  channel: string;
  responseClass: string;
  rootCauseClass?: string | null;
  impactClass?: string | null;
  objection?: string | null;
  buyerLanguage?: string | null;
  nextBestAction?: string | null;
  source: { kind: string; id: string };
  bids?: DispositionBidInput[];
  aiSuggestionId?: string | null;
  /** timing: when the buyer said to come back. Stored in `metadata.resumeAt`; routing reads it. */
  resumeAt?: Date | string | null;
  /** referral: who they named. Stored in `metadata.referral`. */
  referral?: { name?: string; title?: string; email?: string } | null;
  actor: string;
  actorKind: ActorKind;
  now: Date;
}

export interface RecordDispositionDeps {
  audit?: typeof defaultAudit;
  mirror?: typeof defaultMirror;
  stopRuns?: typeof defaultStopRuns;
  stopEnrollment?: typeof defaultStop;
  stopEnrollmentsForHypothesis?: typeof defaultStopForHypothesis;
  recordUnsubscribe?: typeof defaultRecordUnsubscribe;
  transition?: typeof defaultTransition;
  propose?: typeof defaultPropose;
}

export type DispositionStep = 'stop' | 'unsubscribe' | 'resolve' | 'retarget' | 'referral' | 'mirror';

export interface DispositionRefusalEntry {
  step: DispositionStep;
  reason: string;
  /** The enrollment or hypothesis the refusal is about, when there is one. */
  id?: string;
}

/** The contract's `effects` block. `retarget` and `referral` appear only for those classes. */
export interface RecordedEffects {
  stopped: string[];
  unsubscribed: boolean;
  resolution: null | { outcome: string; confidence: number | null };
  mirrored: boolean;
  retarget?: { closedHypothesisId: string; draftHypothesisId: string | null };
  referral?: { fromBidId: string | null; name?: string; title?: string };
}

export type RecordDispositionResult =
  | {
      ok: true;
      dispositionId: string;
      bidIds: string[];
      humanConfirmed: boolean;
      /** `none` when the row is unconfirmed (an agent wrote it) and nothing ran. */
      effects: RecordedEffects | 'none';
      refusals: DispositionRefusalEntry[];
    }
  | { ok: false; kind: 'invalid_body'; field: string; reason: string }
  | { ok: false; kind: 'refused'; reason: string; existingId?: string };

const NO_EFFECTS_RUN: RecordedEffects = Object.freeze({ stopped: [], unsubscribed: false, resolution: null, mirrored: false });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isUniqueViolation(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: unknown }).code === 'P2002';
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The enrollment stop reason a stopping class carries (taxonomy STOP_REASONS). */
export function stopReasonFor(responseClass: string): 'dnc' | 'bounced' | 'replied' {
  if (responseClass === 'do_not_contact') return 'dnc';
  if (responseClass === 'bounce') return 'bounced';
  return 'replied';
}

class Refusal extends Error {
  constructor(
    public readonly kind: 'invalid_body' | 'refused',
    public readonly reason: string,
    public readonly field?: string,
    public readonly existingId?: string,
  ) {
    super(reason);
    this.name = 'DispositionRefusal';
  }
}

interface LoadedHypothesis {
  id: string;
  status: string;
  account_name: string;
  primary_persona_id: number | null;
  problem_family: string;
  problem_hypothesis: string;
  primary_persona: { id: number; email: string | null; hubspot_contact_id: string | null; account_name: string } | null;
}

interface LoadedPersona {
  id: number;
  email: string | null;
  hubspot_contact_id: string | null;
  account_name: string;
}

/**
 * Which persona the row belongs to, or a refusal. Rules:
 *   personaId given  -> that persona must exist, be on the hypothesis's
 *                       account, and (when it has an email) carry this email.
 *   no personaId     -> the primary persona when its email matches; else the
 *                       persona that owns the email, which must be on the
 *                       same account (`suppressed_target_mismatch` when it is
 *                       another account's persona); else no persona (an
 *                       address the Persona table does not know yet).
 */
async function resolvePersona(
  prisma: any,
  hypothesis: LoadedHypothesis,
  personaId: number | null | undefined,
  email: string,
): Promise<LoadedPersona | null> {
  const select = { id: true, email: true, hubspot_contact_id: true, account_name: true };
  if (personaId !== null && personaId !== undefined) {
    const persona: LoadedPersona | null = await prisma.persona.findUnique({ where: { id: personaId }, select });
    if (!persona) throw new Refusal('refused', 'persona_not_found');
    if (persona.account_name !== hypothesis.account_name) throw new Refusal('refused', 'suppressed_target_mismatch');
    const personaEmail = normalizeEmail(persona.email);
    if (personaEmail.length > 0 && personaEmail !== email) throw new Refusal('refused', 'suppressed_target_mismatch');
    return persona;
  }
  const primary = hypothesis.primary_persona;
  if (primary && normalizeEmail(primary.email) === email) return primary;
  const owner: LoadedPersona | null = await prisma.persona.findFirst({ where: { email }, select });
  if (!owner) return null;
  if (owner.account_name !== hypothesis.account_name) throw new Refusal('refused', 'suppressed_target_mismatch');
  return owner;
}

interface AiSuggestionRow {
  id: string;
  hypothesis_id: string;
  source_kind: string;
  source_id: string;
  human_confirmed: boolean;
  created_by: string;
  response_class: string;
  ai_suggested: unknown;
}

const AI_SUGGESTION_SELECT = {
  id: true,
  hypothesis_id: true,
  source_kind: true,
  source_id: true,
  human_confirmed: true,
  created_by: true,
  response_class: true,
  ai_suggested: true,
} as const;

/**
 * B2 (Opus adversarial review, 2026-09-24): an existing UNCONFIRMED row for
 * this source must never permanently block a human from recording their
 * disposition, whatever posted it first (an agent route stores agent rows
 * as `created_by: 'cron'`, not `'ai'`) or which hypothesis it was filed
 * against. `created_by` and `hypothesis_id` are both mutable while
 * unconfirmed (the freeze trigger only locks classes and identity once
 * `human_confirmed` flips), so the human's submit silently adopts the row.
 *
 * SOURCE is the one thing that is not negotiable: `(source_kind, source_id)`
 * is the row's real identity (and its unique key), so an explicit
 * `aiSuggestionId` naming a row for a DIFFERENT source is refused rather
 * than silently reassigned to this submission's source.
 *
 * Two paths in: the caller named a specific suggestion id (explicit
 * confirm-with-edits from the UI), or it didn't and this call auto-detects
 * a same-source unconfirmed row so a P2002 on create is never the first
 * thing a human sees.
 */
async function resolveAdoptable(prisma: any, input: RecordDispositionInput): Promise<AiSuggestionRow | null> {
  if (input.aiSuggestionId) {
    const row: AiSuggestionRow | null = await prisma.conversationDisposition.findUnique({
      where: { id: input.aiSuggestionId },
      select: AI_SUGGESTION_SELECT,
    });
    if (!row) throw new Refusal('refused', 'ai_suggestion_not_found');
    if (row.human_confirmed) throw new Refusal('refused', 'ai_suggestion_not_adoptable');
    if (row.source_kind !== input.source.kind || row.source_id !== input.source.id) {
      throw new Refusal('refused', 'ai_suggestion_mismatch');
    }
    return row;
  }
  const existing: AiSuggestionRow | null = await prisma.conversationDisposition.findUnique({
    where: { source_kind_source_id: { source_kind: input.source.kind, source_id: input.source.id } },
    select: AI_SUGGESTION_SELECT,
  });
  if (!existing) return null;
  if (existing.human_confirmed) throw new Refusal('refused', 'duplicate_source', undefined, existing.id);
  return existing;
}

function metadataFor(input: RecordDispositionInput, valid: ValidDisposition, ai: AiSuggestionRow | null): Record<string, unknown> | null {
  const metadata: Record<string, unknown> = {};
  const resumeAt = asDate(input.resumeAt);
  if (valid.responseClass === 'timing' && resumeAt) metadata.resumeAt = resumeAt.toISOString();
  if (valid.responseClass === 'referral' && isPlainObject(input.referral)) {
    const referral: Record<string, string> = {};
    for (const key of ['name', 'title', 'email'] as const) {
      const value = input.referral[key];
      if (typeof value === 'string' && value.trim().length > 0) referral[key] = value.trim();
    }
    if (Object.keys(referral).length > 0) metadata.referral = referral;
  }
  if (ai) {
    metadata.aiSuggestion = {
      id: ai.id,
      responseClass: ai.response_class,
      matched: ai.response_class === valid.responseClass,
    };
  }
  return Object.keys(metadata).length > 0 ? metadata : null;
}

// ---------------------------------------------------------------------------
// recordDisposition
// ---------------------------------------------------------------------------

export async function recordDisposition(
  prisma: any,
  input: RecordDispositionInput,
  deps: RecordDispositionDeps = {},
): Promise<RecordDispositionResult> {
  const auditFn = deps.audit ?? defaultAudit;

  // ---- 1. validate -------------------------------------------------------
  const validation = validateDisposition(input);
  if (!validation.ok) return { ok: false, kind: 'invalid_body', field: validation.field, reason: validation.reason };
  const valid = validation.value;

  if (!input.source || !(DISPOSITION_SOURCE_KINDS as readonly string[]).includes(input.source.kind)) {
    return { ok: false, kind: 'invalid_body', field: 'source.kind', reason: 'unknown_source_kind' };
  }
  if (typeof input.source.id !== 'string' || input.source.id.trim().length === 0) {
    return { ok: false, kind: 'invalid_body', field: 'source.id', reason: 'empty_source_id' };
  }
  if (typeof input.hypothesisId !== 'string' || input.hypothesisId.trim().length === 0) {
    return { ok: false, kind: 'invalid_body', field: 'hypothesisId', reason: 'no_hypothesis' };
  }
  if (input.aiSuggestionId && input.actorKind !== 'human') {
    return { ok: false, kind: 'refused', reason: 'agent_cannot_confirm' };
  }

  const bidActor: BidActor = { id: input.actor, kind: input.actorKind };
  const bidInputs = input.bids ?? [];

  let hypothesis: LoadedHypothesis | null;
  let persona: LoadedPersona | null;
  let ai: AiSuggestionRow | null = null;
  try {
    hypothesis = await prisma.prospectingHypothesis.findUnique({
      where: { id: input.hypothesisId },
      select: {
        id: true,
        status: true,
        account_name: true,
        primary_persona_id: true,
        problem_family: true,
        problem_hypothesis: true,
        primary_persona: { select: { id: true, email: true, hubspot_contact_id: true, account_name: true } },
      },
    });
    if (!hypothesis) throw new Refusal('refused', 'hypothesis_not_found');
    // B1: a buyer's answer (stop, DNC, mirror) must be recordable for any
    // non-terminal hypothesis, not only `active`. An `approved` hypothesis
    // that has not yet been manually activated must still be able to record
    // a "stop emailing me" reply. Only step 5 (resolve) keeps the stricter
    // `active`-only requirement, enforced by the state machine itself
    // (the transition table has no `resolve` edge off `active`).
    if (isTerminalStatus(hypothesis.status as HypothesisStatus)) {
      throw new Refusal('refused', 'hypothesis_terminal');
    }
    persona = await resolvePersona(prisma, hypothesis, input.personaId, valid.contactEmail);
    ai = await resolveAdoptable(prisma, input);

    // BID shapes are checked before the transaction so a bad BID never costs a row.
    bidInputs.forEach((bid, index) => {
      const check = validateBidInput({
        hypothesisId: hypothesis!.id,
        accountName: hypothesis!.account_name,
        contactEmail: valid.contactEmail,
        type: bid.type,
        rawBuyerLanguage: bid.rawBuyerLanguage,
        normalizedSummary: bid.normalizedSummary,
        numericValue: bid.numericValue,
        unit: bid.unit,
        source: valid.channel,
        capturedBy: bidActor,
      });
      if (!check.ok) throw new Refusal('invalid_body', check.reason, `bids.${index}.${check.field}`);
    });
  } catch (err) {
    if (err instanceof Refusal) return refusalResult(err);
    throw err;
  }

  // ---- 2. the row and its BIDs, one transaction ---------------------------
  const humanConfirmed = input.actorKind === 'human';
  const metadata = metadataFor(input, valid, ai);
  const rowData: Record<string, unknown> = {
    hypothesis_id: hypothesis.id,
    account_name: hypothesis.account_name,
    persona_id: persona?.id ?? null,
    contact_email: valid.contactEmail,
    hubspot_contact_id: persona?.hubspot_contact_id ?? null,
    inbound_message_id: input.source.kind === 'inbound_message' ? input.source.id : null,
    hubspot_engagement_id: input.source.kind === 'hubspot_engagement' ? input.source.id : null,
    source_kind: input.source.kind,
    source_id: input.source.id,
    channel: valid.channel,
    response_class: valid.responseClass,
    root_cause_class: valid.rootCauseClass,
    impact_class: valid.impactClass,
    objection: valid.objection,
    buyer_language: valid.buyerLanguage,
    next_best_action: typeof input.nextBestAction === 'string' && input.nextBestAction.trim() ? input.nextBestAction.trim() : null,
    human_confirmed: humanConfirmed,
    confirmed_by: humanConfirmed ? input.actor : null,
    confirmed_at: humanConfirmed ? input.now : null,
  };
  if (metadata) rowData.metadata = metadata;

  let dispositionId: string;
  const bidIds: string[] = [];
  try {
    dispositionId = await prisma.$transaction(async (tx: any): Promise<string> => {
      let id: string;
      if (ai) {
        // The AI row becomes the human's row: one update sets the class
        // fields and flips human_confirmed. ai_suggested is untouched.
        const moved = await tx.conversationDisposition.updateMany({
          where: { id: ai.id, human_confirmed: false },
          data: { ...rowData, created_by: ai.created_by },
        });
        if (moved.count !== 1) throw new Refusal('refused', 'ai_suggestion_not_adoptable');
        id = ai.id;
      } else {
        const created = await tx.conversationDisposition.create({
          data: { ...rowData, created_by: input.actor, ai_suggested: undefined },
          select: { id: true },
        });
        id = created.id;
      }
      for (const bid of bidInputs) {
        const captured = await captureBid(
          tx,
          {
            hypothesisId: hypothesis!.id,
            accountName: hypothesis!.account_name,
            personaId: persona?.id ?? null,
            contactEmail: valid.contactEmail,
            dispositionId: id,
            inboundMessageId: input.source.kind === 'inbound_message' ? input.source.id : null,
            type: bid.type,
            rawBuyerLanguage: bid.rawBuyerLanguage,
            normalizedSummary: bid.normalizedSummary,
            numericValue: bid.numericValue,
            unit: bid.unit,
            source: valid.channel,
            capturedAt: input.now,
            capturedBy: bidActor,
            confirm: humanConfirmed,
            metadata: bid.metadata,
          },
          { now: input.now },
        );
        if (!captured.ok) throw new Refusal('invalid_body', captured.reason, `bids.${captured.field ?? 'body'}`);
        bidIds.push(captured.id);
      }
      return id;
    });
  } catch (err) {
    if (err instanceof Refusal) return refusalResult(err);
    if (isUniqueViolation(err)) {
      const existing = await prisma.conversationDisposition.findUnique({
        where: { source_kind_source_id: { source_kind: input.source.kind, source_id: input.source.id } },
        select: { id: true },
      });
      return { ok: false, kind: 'refused', reason: 'duplicate_source', existingId: existing?.id };
    }
    throw err;
  }

  await safeAudit(auditFn, prisma, {
    kind: 'disposition.recorded',
    actor: input.actor,
    subjectType: 'disposition',
    subjectId: dispositionId,
    payload: {
      hypothesisId: hypothesis.id,
      accountName: hypothesis.account_name,
      personaId: persona?.id ?? null,
      contactEmail: valid.contactEmail,
      channel: valid.channel,
      responseClass: valid.responseClass,
      source: input.source,
      bidIds,
      actorKind: input.actorKind,
      humanConfirmed,
      aiSuggestionId: ai?.id ?? null,
      metadata,
    },
    review: {
      target: hypothesis.account_name,
      title: `${valid.responseClass} via ${valid.channel}: ${valid.contactEmail}`,
      intent: humanConfirmed ? 'human-confirmed disposition' : 'unconfirmed disposition (no effects)',
    },
  });

  // ---- 3. effects (an unconfirmed row has none, by construction) -----------
  const effects: DispositionEffects = dispositionEffects({ responseClass: valid.responseClass, humanConfirmed });
  if (!humanConfirmed || (!effects.stopsRun && !effects.writesDnc && effects.resolves === null && effects.nextAction === 'none')) {
    // Nothing to apply: out_of_office and the call-only classes keep the
    // sequence; an agent row waits for a human. The mirror only writes
    // confirmed rows, so it is skipped here too.
    const applied: RecordedEffects = humanConfirmed ? { ...NO_EFFECTS_RUN } : NO_EFFECTS_RUN;
    if (humanConfirmed) {
      const mirrored = await runMirror(prisma, deps, input, dispositionId, hypothesis, persona, valid);
      applied.mirrored = mirrored.mirrored;
      const refusals = mirrored.refusal ? [mirrored.refusal] : [];
      await auditEffects(auditFn, prisma, input, dispositionId, applied, refusals);
      return { ok: true, dispositionId, bidIds, humanConfirmed, effects: applied, refusals };
    }
    return { ok: true, dispositionId, bidIds, humanConfirmed, effects: 'none', refusals: [] };
  }

  const applied: RecordedEffects = { stopped: [], unsubscribed: false, resolution: null, mirrored: false };
  const refusals: DispositionRefusalEntry[] = [];

  // 3a. immediate stop
  if (effects.stopsRun) {
    const reason = stopReasonFor(valid.responseClass);
    const stopEnrollment = deps.stopEnrollment ?? defaultStop;
    const stopRuns = deps.stopRuns ?? defaultStopRuns;
    try {
      const where: Record<string, unknown> = persona
        ? { OR: [{ to_email: valid.contactEmail }, { persona_id: persona.id }], status: { in: [...LIVE_ENROLLMENT_STATUSES] } }
        : { to_email: valid.contactEmail, status: { in: [...LIVE_ENROLLMENT_STATUSES] } };
      const rows: Array<{ id: string; engine: string; status: string }> = await prisma.sequenceEnrollment.findMany({
        where,
        select: { id: true, engine: true, status: true },
        orderBy: { enrolled_at: 'asc' },
      });
      for (const row of rows) {
        if (row.status === 'stop_pending') {
          applied.stopped.push(row.id);
          continue;
        }
        const r = await stopEnrollment(prisma, row.id, reason, input.actor, input.now);
        if (r.ok) applied.stopped.push(row.id);
        else refusals.push({ step: 'stop', reason: r.reason, id: row.id });
      }
      await stopRuns(prisma, valid.contactEmail, reason);
    } catch (err) {
      refusals.push({ step: 'stop', reason: errorMessage(err) });
    }
  }

  // 4. do_not_contact through the one consent writer
  if (effects.writesDnc) {
    const unsubscribe = deps.recordUnsubscribe ?? defaultRecordUnsubscribe;
    try {
      const r = await unsubscribe(prisma, {
        email: valid.contactEmail,
        source: 'gap_disposition',
        reason: 'do_not_contact disposition',
        dispositionId,
        actor: input.actor,
        now: input.now,
      });
      applied.unsubscribed = r.ok === true;
    } catch (err) {
      refusals.push({ step: 'unsubscribe', reason: errorMessage(err) });
    }
  }

  // 5. resolution, re-target, referral
  if (effects.resolves !== null) {
    const r = await resolveHypothesis(prisma, deps, input, hypothesis, dispositionId);
    if (r.ok) applied.resolution = r.resolution;
    else refusals.push({ step: 'resolve', reason: r.reason, id: hypothesis.id });
  } else if (valid.responseClass === 'wrong_person') {
    const r = await retargetForWrongPerson(prisma, deps, input, hypothesis, dispositionId);
    if (r.ok) applied.retarget = r.retarget;
    else refusals.push({ step: 'retarget', reason: r.reason, id: hypothesis.id });
  } else if (valid.responseClass === 'referral') {
    const namingBid = await prisma.buyerInputData.findFirst({
      where: { disposition_id: dispositionId },
      select: { id: true, metadata: true },
      orderBy: { captured_at: 'asc' },
    });
    const fromMeta = isPlainObject(metadata?.referral) ? (metadata!.referral as Record<string, unknown>) : {};
    applied.referral = {
      fromBidId: namingBid?.id ?? null,
      ...(typeof fromMeta.name === 'string' ? { name: fromMeta.name } : {}),
      ...(typeof fromMeta.title === 'string' ? { title: fromMeta.title } : {}),
    };
    await safeAudit(auditFn, prisma, {
      kind: 'disposition.referral',
      actor: input.actor,
      subjectType: 'disposition',
      subjectId: dispositionId,
      payload: { hypothesisId: hypothesis.id, accountName: hypothesis.account_name, referral: applied.referral, bidIds },
      review: {
        target: hypothesis.account_name,
        title: `Referral from ${valid.contactEmail}${fromMeta.name ? `: ${String(fromMeta.name)}` : ''}`,
        intent: 'research the referred person before any touch',
      },
    });
  }

  // 6. HubSpot mirror, fail-open
  const mirrored = await runMirror(prisma, deps, input, dispositionId, hypothesis, persona, valid);
  applied.mirrored = mirrored.mirrored;
  if (mirrored.refusal) refusals.push(mirrored.refusal);

  await auditEffects(auditFn, prisma, input, dispositionId, applied, refusals);
  return { ok: true, dispositionId, bidIds, humanConfirmed, effects: applied, refusals };
}

function refusalResult(err: Refusal): RecordDispositionResult {
  if (err.kind === 'invalid_body') return { ok: false, kind: 'invalid_body', field: err.field ?? 'body', reason: err.reason };
  return { ok: false, kind: 'refused', reason: err.reason, ...(err.existingId ? { existingId: err.existingId } : {}) };
}

async function safeAudit(auditFn: typeof defaultAudit, prisma: any, input: Parameters<typeof defaultAudit>[1]): Promise<void> {
  try {
    await auditFn(prisma, input);
  } catch {
    // The ledger never gates the disposition.
  }
}

async function auditEffects(
  auditFn: typeof defaultAudit,
  prisma: any,
  input: RecordDispositionInput,
  dispositionId: string,
  effects: RecordedEffects,
  refusals: DispositionRefusalEntry[],
): Promise<void> {
  const kind: GapAuditKind = 'disposition.effects';
  await safeAudit(auditFn, prisma, {
    kind,
    actor: input.actor,
    subjectType: 'disposition',
    subjectId: dispositionId,
    payload: { responseClass: input.responseClass, effects, refusals },
  });
}

// ---------------------------------------------------------------------------
// Step 5: resolution
// ---------------------------------------------------------------------------

type ResolveOutcome =
  | { ok: true; resolution: { outcome: string; confidence: number | null } }
  | { ok: false; reason: string };

/**
 * Score from the hypothesis's human-confirmed rows only, pass the DERIVED
 * outcome to the machine, merge the record into the resolution JSON, apply
 * the machine's stop effects. The caller's class never reaches `ctx.outcome`.
 */
async function resolveHypothesis(
  prisma: any,
  deps: RecordDispositionDeps,
  input: RecordDispositionInput,
  hypothesis: LoadedHypothesis,
  dispositionId: string,
): Promise<ResolveOutcome> {
  const transition = deps.transition ?? defaultTransition;
  const stopForHypothesis = deps.stopEnrollmentsForHypothesis ?? defaultStopForHypothesis;
  try {
    const dispositionRows: Array<{
      id: string;
      response_class: string;
      channel: string;
      human_confirmed: boolean;
      created_at: Date;
      confirmed_at: Date | null;
      metadata?: unknown;
      ai_suggested?: unknown;
    }> = await prisma.conversationDisposition.findMany({
      where: { hypothesis_id: hypothesis.id, human_confirmed: true },
      orderBy: { created_at: 'asc' },
    });
    const bidRows: any[] = await prisma.buyerInputData.findMany({ where: { hypothesis_id: hypothesis.id } });

    const dispositions: ResolutionDisposition[] = dispositionRows.map((d) => ({
      id: d.id,
      responseClass: d.response_class,
      channel: d.channel,
      humanConfirmed: d.human_confirmed === true,
      createdAt: d.created_at,
      confirmedAt: d.confirmed_at ?? null,
      metadata: d.metadata ?? null,
      aiSuggested: d.ai_suggested ?? null,
    }));
    const bids = selectConfirmedBids(bidRows.map(bidFromRow));
    const score = scoreResolution({ dispositions, bids });
    if (score.refusal) return { ok: false, reason: `score:${score.refusal}` };
    if (score.outcome === null) return { ok: false, reason: 'no_confirmed_disposition' };

    const moved = await transition(
      prisma,
      hypothesis.id,
      'resolve',
      { now: input.now, actor: input.actor, outcome: score.outcome, reason: `disposition:${dispositionId}` },
      { audit: deps.audit, mirror: undefined },
    );
    if (!moved.ok) return { ok: false, reason: moved.reason };

    // Merge the scored record into the resolution the machine just wrote.
    // The trigger freezes narrative columns, not `resolution`, and the machine
    // and the score derive `problem` and `dispositionIds` from the same rows.
    const current = await prisma.prospectingHypothesis.findUnique({ where: { id: hypothesis.id }, select: { resolution: true } });
    const existing = isPlainObject(current?.resolution) ? current.resolution : {};
    const record = resolutionRecord(score);
    await prisma.prospectingHypothesis.update({
      where: { id: hypothesis.id },
      data: { resolution: { ...existing, ...record, reasons: score.reasons, scoredBy: dispositionId } },
    });

    for (const effect of moved.effects) {
      if (effect.startsWith('stop_enrollments:')) {
        await stopForHypothesis(prisma, hypothesis.id, effect.slice('stop_enrollments:'.length), input.actor, input.now);
      }
    }
    return { ok: true, resolution: { outcome: score.outcome, confidence: score.confidence } };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}

// ---------------------------------------------------------------------------
// Step 5: wrong_person re-target
// ---------------------------------------------------------------------------

type RetargetOutcome =
  | { ok: true; retarget: { closedHypothesisId: string; draftHypothesisId: string | null } }
  | { ok: false; reason: string };

/**
 * The machine (hypothesis/machine.ts) has no active -> draft edge and this
 * ticket does not fork it. The re-target is therefore two legal moves:
 * `close_unresolved` on the active row with reason `wrong_person:<id>` (its
 * `stop_enrollments:manual` effect is applied), then a NEW draft through
 * `proposeHypothesis` carrying the same narrative, signals and confidence,
 * NO primary persona, and `supersedes_id` pointing at the closed row (the
 * spec's reopen convention; set directly because propose has no such input
 * and a draft's operational columns are not frozen). The draft's metadata
 * names the disposition and the persona that was wrong so the researcher
 * knows whom not to pick again.
 */
async function retargetForWrongPerson(
  prisma: any,
  deps: RecordDispositionDeps,
  input: RecordDispositionInput,
  hypothesis: LoadedHypothesis,
  dispositionId: string,
): Promise<RetargetOutcome> {
  const transition = deps.transition ?? defaultTransition;
  const propose = deps.propose ?? defaultPropose;
  const stopForHypothesis = deps.stopEnrollmentsForHypothesis ?? defaultStopForHypothesis;
  const auditFn = deps.audit ?? defaultAudit;
  try {
    const moved = await transition(
      prisma,
      hypothesis.id,
      'close_unresolved',
      { now: input.now, actor: input.actor, reason: `wrong_person:${dispositionId}` },
      { audit: deps.audit },
    );
    if (!moved.ok) return { ok: false, reason: moved.reason };
    for (const effect of moved.effects) {
      if (effect.startsWith('stop_enrollments:')) {
        await stopForHypothesis(prisma, hypothesis.id, effect.slice('stop_enrollments:'.length), input.actor, input.now);
      }
    }

    const full = await prisma.prospectingHypothesis.findUnique({
      where: { id: hypothesis.id },
      include: { signals: { select: { signal_id: true, role: true } } },
    });
    let draftId: string | null = null;
    if (full) {
      const signalIds: string[] = (full.signals ?? []).map((s: any) => s.signal_id);
      const primarySignalId: string | null = (full.signals ?? []).find((s: any) => s.role === 'primary')?.signal_id ?? null;
      const proposed = await propose(prisma, {
        accountName: full.account_name,
        primaryPersonaId: null,
        persona: full.persona,
        problemFamily: full.problem_family,
        secondaryFamilies: Array.isArray(full.secondary_families) ? full.secondary_families : [],
        observation: full.observation ?? '',
        problemHypothesis: full.problem_hypothesis,
        rootCauseHypotheses: Array.isArray(full.root_cause_hypotheses) ? full.root_cause_hypotheses : [],
        impactHypotheses: Array.isArray(full.impact_hypotheses) ? full.impact_hypotheses : [],
        whyNow: full.why_now ?? null,
        falsificationQuestions: Array.isArray(full.falsification_questions) ? full.falsification_questions : [],
        whatANoMeans: full.what_a_no_means ?? null,
        contraryEvidence: full.contrary_evidence ?? null,
        predictedBuyerLanguage: full.predicted_buyer_language ?? null,
        buyingCenter: full.buying_center ?? null,
        confidence: typeof full.confidence === 'number' ? full.confidence : 0,
        signalIds,
        primarySignalId,
        sourceRef: null,
        metadata: {
          retarget: { fromHypothesisId: hypothesis.id, dispositionId, wrongPersonaId: hypothesis.primary_persona_id, contactEmail: input.contactEmail },
        },
        createdBy: input.actor,
      });
      if (proposed.ok) {
        draftId = proposed.id;
        await prisma.prospectingHypothesis.update({ where: { id: draftId }, data: { supersedes_id: hypothesis.id } });
      } else {
        await safeAudit(auditFn, prisma, {
          kind: 'disposition.retarget',
          actor: input.actor,
          subjectType: 'hypothesis',
          subjectId: hypothesis.id,
          payload: { dispositionId, closed: true, draft: null, proposeRefusal: proposed.reason },
        });
        return { ok: false, reason: `propose:${proposed.reason}` };
      }
    }

    await safeAudit(auditFn, prisma, {
      kind: 'disposition.retarget',
      actor: input.actor,
      subjectType: 'hypothesis',
      subjectId: hypothesis.id,
      payload: { dispositionId, closed: true, draft: draftId },
      review: {
        target: hypothesis.account_name,
        title: `Wrong person: ${input.contactEmail}; re-target ${hypothesis.problem_family}`,
        intent: 'research who owns the yards, then pick a persona on the new draft',
      },
    });
    return { ok: true, retarget: { closedHypothesisId: hypothesis.id, draftHypothesisId: draftId } };
  } catch (err) {
    return { ok: false, reason: errorMessage(err) };
  }
}

// ---------------------------------------------------------------------------
// Step 6: mirror
// ---------------------------------------------------------------------------

async function runMirror(
  prisma: any,
  deps: RecordDispositionDeps,
  input: RecordDispositionInput,
  dispositionId: string,
  hypothesis: LoadedHypothesis,
  persona: LoadedPersona | null,
  valid: ValidDisposition,
): Promise<{ mirrored: boolean; refusal: DispositionRefusalEntry | null }> {
  const mirror = deps.mirror ?? defaultMirror;
  try {
    const result: DispositionMirrorResult = await mirror(prisma, {
      dispositionId,
      hubspotContactId: persona?.hubspot_contact_id ?? null,
      responseClass: valid.responseClass,
      confirmedAt: input.now,
      hypothesisId: hypothesis.id,
      accountName: hypothesis.account_name,
      summary: `${valid.responseClass} via ${valid.channel}`,
      channel: valid.channel,
      hypothesisTitle: hypothesis.problem_family,
    });
    if (result.status === 'written') return { mirrored: true, refusal: null };
    return { mirrored: false, refusal: { step: 'mirror', reason: result.status } };
  } catch (err) {
    return { mirrored: false, refusal: { step: 'mirror', reason: errorMessage(err) } };
  }
}
