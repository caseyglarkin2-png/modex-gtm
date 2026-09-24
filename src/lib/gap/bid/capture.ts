/**
 * BID capture (GAP Prospecting OS, Sprint 4, S4-T2). The append-only API over
 * `BuyerInputData`: `captureBid` inserts, `correctBid` inserts a NEW row that
 * points at the old one through `supersedes_id`, `confirmBid` flips
 * `human_confirmed` false to true, `editSummary` moves `normalized_summary`
 * while the row is still unconfirmed. Those two updates are the only update
 * sites in this file (a structural test counts them) and nothing here removes
 * a row. `raw_buyer_language` is written once, on insert, and never appears in
 * an update. The DB trigger GAP_BID_IMMUTABLE in
 * `prisma/sql/2026-09-23-gap-os.sql` enforces the same rules underneath.
 *
 * Nothing here audits: the disposition and BID services (S4-T3) wrap these
 * calls and write the `bid.captured` / `bid.confirmed` audit lines around them.
 *
 * Voice: no em dashes, "yards" plural.
 */

import type { ActorKind } from '../enroll/service';
import { BID_SOURCES, BID_TYPES, type BidSource, type BidType } from '../taxonomy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** Who captured or confirmed a row. Only a `human` actor can confirm. */
export interface BidActor {
  id: string;
  kind: ActorKind;
}

export interface CaptureBidInput {
  hypothesisId: string;
  accountName: string;
  personaId?: number | null;
  contactEmail: string;
  dispositionId?: string | null;
  inboundMessageId?: string | null;
  activityId?: number | null;
  type: string;
  rawBuyerLanguage: string;
  normalizedSummary?: string | null;
  numericValue?: number | string | null;
  unit?: string | null;
  source: string;
  capturedAt?: Date;
  capturedBy: BidActor;
  aiExtracted?: boolean;
  /** Confirm on capture. Only honoured when `capturedBy.kind === 'human'`. */
  confirm?: boolean;
  metadata?: unknown;
}

/** A correction restates the buyer's language; identity fields are inherited from the corrected row. */
export interface CorrectBidInput {
  type?: string;
  rawBuyerLanguage: string;
  normalizedSummary?: string | null;
  numericValue?: number | string | null;
  unit?: string | null;
  source?: string;
  capturedAt?: Date;
  capturedBy: BidActor;
  aiExtracted?: boolean;
  confirm?: boolean;
  metadata?: unknown;
}

export type BidRefusal =
  | 'no_hypothesis'
  | 'no_account'
  | 'no_contact_email'
  | 'unknown_bid_type'
  | 'unknown_bid_source'
  | 'empty_buyer_language'
  | 'invalid_numeric_value'
  | 'unit_required'
  | 'no_actor'
  | 'bid_not_found'
  | 'already_superseded'
  | 'not_human'
  | 'bid_confirmed'
  | 'correction_requires_human';

export interface ValidBid {
  hypothesisId: string;
  accountName: string;
  personaId: number | null;
  contactEmail: string;
  dispositionId: string | null;
  inboundMessageId: string | null;
  activityId: number | null;
  type: BidType;
  rawBuyerLanguage: string;
  normalizedSummary: string | null;
  numericValue: number | null;
  unit: string | null;
  source: BidSource;
  capturedBy: BidActor;
  aiExtracted: boolean;
  humanConfirmed: boolean;
  metadata: unknown;
}

export type BidValidation = { ok: true; value: ValidBid } | { ok: false; field: string; reason: BidRefusal };

export type CaptureResult =
  | { ok: true; id: string; humanConfirmed: boolean; supersedesId: string | null }
  | { ok: false; field?: string; reason: BidRefusal };

export type ConfirmResult = { ok: true; id: string; alreadyConfirmed: boolean } | { ok: false; reason: BidRefusal };

export type EditSummaryResult = { ok: true; id: string } | { ok: false; reason: BidRefusal };

/** Types whose number is meaningless without a unit. Other types may carry a bare count. */
export const UNIT_REQUIRED_TYPES = ['impact', 'metric'] as const satisfies readonly BidType[];

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

function trimmedOrNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/** `true` only for a human actor who asked to confirm. An agent can never confirm, whatever it asks. */
export function confirmedOnCapture(actor: BidActor, confirm: boolean | undefined): boolean {
  return actor.kind === 'human' && confirm === true;
}

/**
 * Pure validation. Refusals name the field so the route can answer 400.
 * The email comes back lowercased and trimmed. A number is accepted as a
 * number or a numeric string; NaN and Infinity are refused.
 */
export function validateBidInput(input: CaptureBidInput): BidValidation {
  if (blank(input.hypothesisId)) return { ok: false, field: 'hypothesisId', reason: 'no_hypothesis' };
  if (blank(input.accountName)) return { ok: false, field: 'accountName', reason: 'no_account' };

  const contactEmail = typeof input.contactEmail === 'string' ? input.contactEmail.trim().toLowerCase() : '';
  if (contactEmail.length === 0) return { ok: false, field: 'contactEmail', reason: 'no_contact_email' };

  if (!(BID_TYPES as readonly string[]).includes(input.type)) {
    return { ok: false, field: 'type', reason: 'unknown_bid_type' };
  }
  const type = input.type as BidType;

  if (!(BID_SOURCES as readonly string[]).includes(input.source)) {
    return { ok: false, field: 'source', reason: 'unknown_bid_source' };
  }
  const source = input.source as BidSource;

  if (blank(input.rawBuyerLanguage)) return { ok: false, field: 'rawBuyerLanguage', reason: 'empty_buyer_language' };

  let numericValue: number | null = null;
  if (input.numericValue !== null && input.numericValue !== undefined && input.numericValue !== '') {
    const n = typeof input.numericValue === 'number' ? input.numericValue : Number(input.numericValue);
    if (!Number.isFinite(n)) return { ok: false, field: 'numericValue', reason: 'invalid_numeric_value' };
    numericValue = n;
  }

  const unit = trimmedOrNull(input.unit);
  if (numericValue !== null && unit === null && (UNIT_REQUIRED_TYPES as readonly string[]).includes(type)) {
    return { ok: false, field: 'unit', reason: 'unit_required' };
  }

  if (!input.capturedBy || blank(input.capturedBy.id)) return { ok: false, field: 'capturedBy', reason: 'no_actor' };

  return {
    ok: true,
    value: {
      hypothesisId: input.hypothesisId,
      accountName: input.accountName,
      personaId: input.personaId ?? null,
      contactEmail,
      dispositionId: input.dispositionId ?? null,
      inboundMessageId: input.inboundMessageId ?? null,
      activityId: input.activityId ?? null,
      type,
      rawBuyerLanguage: input.rawBuyerLanguage.trim(),
      normalizedSummary: trimmedOrNull(input.normalizedSummary),
      numericValue,
      unit,
      source,
      capturedBy: input.capturedBy,
      aiExtracted: input.aiExtracted === true,
      humanConfirmed: confirmedOnCapture(input.capturedBy, input.confirm),
      metadata: input.metadata ?? null,
    },
  };
}

function isUniqueViolation(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: unknown }).code === 'P2002';
}

function isNotFound(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: unknown }).code === 'P2025';
}

function rowData(value: ValidBid, now: Date, capturedAt: Date | undefined, supersedesId: string | null) {
  return {
    hypothesis_id: value.hypothesisId,
    account_name: value.accountName,
    persona_id: value.personaId,
    contact_email: value.contactEmail,
    disposition_id: value.dispositionId,
    inbound_message_id: value.inboundMessageId,
    activity_id: value.activityId,
    type: value.type,
    raw_buyer_language: value.rawBuyerLanguage,
    normalized_summary: value.normalizedSummary,
    numeric_value: value.numericValue,
    unit: value.unit,
    source: value.source,
    captured_at: capturedAt ?? now,
    captured_by: value.capturedBy.id,
    ai_extracted: value.aiExtracted,
    human_confirmed: value.humanConfirmed,
    confirmed_by: value.humanConfirmed ? value.capturedBy.id : null,
    confirmed_at: value.humanConfirmed ? now : null,
    supersedes_id: supersedesId,
    metadata: value.metadata ?? undefined,
  };
}

/** Insert one BuyerInputData row. Human-created rows may be confirmed on capture; agent rows never are. */
export async function captureBid(
  prisma: PrismaLike,
  input: CaptureBidInput,
  opts: { now?: Date } = {},
): Promise<CaptureResult> {
  const validation = validateBidInput(input);
  if (!validation.ok) return validation;
  const now = opts.now ?? new Date();
  const row = await prisma.buyerInputData.create({ data: rowData(validation.value, now, input.capturedAt, null) });
  return { ok: true, id: row.id, humanConfirmed: validation.value.humanConfirmed, supersedesId: null };
}

/**
 * Correct a row by inserting a NEW one that supersedes it. The old row is
 * untouched. One correction per row: a second attempt is refused
 * `already_superseded` (pre-checked, and the unique on `supersedes_id`
 * catches the race). Identity fields (hypothesis, account, persona, email,
 * disposition, message, activity) are inherited; type and source may change.
 */
export async function correctBid(
  prisma: PrismaLike,
  bidId: string,
  input: CorrectBidInput,
  opts: { now?: Date } = {},
): Promise<CaptureResult> {
  const original = await prisma.buyerInputData.findUnique({ where: { id: bidId } });
  if (!original) return { ok: false, reason: 'bid_not_found' };

  // B3 (Opus adversarial review, 2026-09-24): an agent's unconfirmed
  // correction must never supersede human-confirmed buyer truth. By the
  // fail-closed rule in bid/select.ts, superseding a confirmed row drops it
  // out of resolution and learning even though the new row is only an
  // AI guess. Human-confirmed BID wins; only a human may correct it.
  if (original.human_confirmed && input.capturedBy.kind !== 'human') {
    return { ok: false, reason: 'correction_requires_human' };
  }

  const existing = await prisma.buyerInputData.findFirst({ where: { supersedes_id: bidId }, select: { id: true } });
  if (existing) return { ok: false, reason: 'already_superseded' };

  const validation = validateBidInput({
    hypothesisId: original.hypothesis_id,
    accountName: original.account_name,
    personaId: original.persona_id ?? null,
    contactEmail: original.contact_email,
    dispositionId: original.disposition_id ?? null,
    inboundMessageId: original.inbound_message_id ?? null,
    activityId: original.activity_id ?? null,
    type: input.type ?? original.type,
    rawBuyerLanguage: input.rawBuyerLanguage,
    normalizedSummary: input.normalizedSummary,
    numericValue: input.numericValue,
    unit: input.unit,
    source: input.source ?? original.source,
    capturedBy: input.capturedBy,
    aiExtracted: input.aiExtracted,
    confirm: input.confirm,
    metadata: input.metadata,
  });
  if (!validation.ok) return validation;

  const now = opts.now ?? new Date();
  try {
    const row = await prisma.buyerInputData.create({ data: rowData(validation.value, now, input.capturedAt, bidId) });
    return { ok: true, id: row.id, humanConfirmed: validation.value.humanConfirmed, supersedesId: bidId };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: 'already_superseded' };
    throw err;
  }
}

/**
 * Flip `human_confirmed` false to true. Idempotent: a row already confirmed
 * is reported `alreadyConfirmed` and not touched (a second write would trip
 * GAP_BID_IMMUTABLE on `confirmed_by`). The update's where carries
 * `human_confirmed: false`, so a concurrent confirm loses cleanly (P2025)
 * instead of rewriting who confirmed.
 */
export async function confirmBid(
  prisma: PrismaLike,
  bidId: string,
  actor: BidActor,
  opts: { now?: Date } = {},
): Promise<ConfirmResult> {
  if (!actor || actor.kind !== 'human' || blank(actor.id)) return { ok: false, reason: 'not_human' };

  const row = await prisma.buyerInputData.findUnique({ where: { id: bidId }, select: { id: true, human_confirmed: true } });
  if (!row) return { ok: false, reason: 'bid_not_found' };
  if (row.human_confirmed) return { ok: true, id: bidId, alreadyConfirmed: true };

  const now = opts.now ?? new Date();
  try {
    await prisma.buyerInputData.update({
      where: { id: bidId, human_confirmed: false },
      data: { human_confirmed: true, confirmed_by: actor.id, confirmed_at: now },
    });
  } catch (err) {
    if (isNotFound(err)) return { ok: true, id: bidId, alreadyConfirmed: true };
    throw err;
  }
  return { ok: true, id: bidId, alreadyConfirmed: false };
}

/**
 * Move `normalized_summary` while the row is unconfirmed. The raw language
 * is never touched. A confirmed row is refused `bid_confirmed` (pre-checked,
 * and the where's `human_confirmed: false` closes the race).
 */
export async function editSummary(
  prisma: PrismaLike,
  bidId: string,
  normalizedSummary: string | null,
): Promise<EditSummaryResult> {
  const row = await prisma.buyerInputData.findUnique({ where: { id: bidId }, select: { id: true, human_confirmed: true } });
  if (!row) return { ok: false, reason: 'bid_not_found' };
  if (row.human_confirmed) return { ok: false, reason: 'bid_confirmed' };

  try {
    await prisma.buyerInputData.update({
      where: { id: bidId, human_confirmed: false },
      data: { normalized_summary: trimmedOrNull(normalizedSummary) },
    });
  } catch (err) {
    if (isNotFound(err)) return { ok: false, reason: 'bid_confirmed' };
    throw err;
  }
  return { ok: true, id: bidId };
}
