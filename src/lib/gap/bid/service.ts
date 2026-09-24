/**
 * BID service (GAP Prospecting OS, Sprint 4, S4-T3).
 *
 * The audited wrapper over the append-only API in ./capture.ts and the pure
 * selection in ./select.ts. `recordBid` is what `POST /api/gap/bids` runs:
 * it resolves the account and persona from the hypothesis, then calls
 * `captureBid` (or `correctBid` when `supersedesId` is given: a correction is
 * a NEW row, the old one is never edited) and writes one `bid.captured`
 * audit line. `confirmBidByHuman` wraps `confirmBid` with `bid.confirmed`.
 * `listBids` returns every row of a hypothesis with the confirmed
 * unsuperseded subset the resolution reads.
 *
 * Nothing here updates raw language or deletes a row; the structural test in
 * tests/unit/gap/bid-capture.test.ts counts update sites in capture.ts and
 * this file adds none.
 *
 * House convention for DB glue is `prisma: any`. Voice: no em dashes.
 */

import { audit as defaultAudit } from '../audit';
import type { ActorKind } from '../enroll/service';
import { captureBid, confirmBid, correctBid, type BidActor, type BidRefusal } from './capture';
import { bidFromRow, selectConfirmedBids, type ResolutionBid } from './select';

export interface RecordBidInput {
  hypothesisId: string;
  contactEmail: string;
  dispositionId?: string | null;
  type: string;
  rawBuyerLanguage: string;
  normalizedSummary?: string | null;
  numericValue?: number | string | null;
  unit?: string | null;
  source: string;
  supersedesId?: string | null;
  metadata?: unknown;
  actor: string;
  actorKind: ActorKind;
  now: Date;
}

export interface BidServiceDeps {
  audit?: typeof defaultAudit;
}

export type RecordBidResult =
  | { ok: true; bidId: string; humanConfirmed: boolean; supersedesId: string | null }
  | { ok: false; kind: 'invalid_body'; field: string; reason: BidRefusal }
  | { ok: false; kind: 'refused'; reason: BidRefusal | 'hypothesis_not_found' | 'disposition_mismatch' };

/** The 201 body of `POST /api/gap/bids`. */
export type RecordBidBody = Extract<RecordBidResult, { ok: true }>;

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

async function safeAudit(auditFn: typeof defaultAudit, prisma: any, input: Parameters<typeof defaultAudit>[1]): Promise<void> {
  try {
    await auditFn(prisma, input);
  } catch {
    // The ledger never gates a capture.
  }
}

/**
 * Capture or correct one BID. A human actor's row is confirmed on capture
 * (the human typed the buyer's words); an agent's row waits for
 * `confirmBidByHuman`. When `dispositionId` is given it must belong to the
 * same hypothesis (`disposition_mismatch`), so a BID can never cite another
 * conversation.
 */
export async function recordBid(prisma: any, input: RecordBidInput, deps: BidServiceDeps = {}): Promise<RecordBidResult> {
  const auditFn = deps.audit ?? defaultAudit;
  const actor: BidActor = { id: input.actor, kind: input.actorKind };
  const confirm = input.actorKind === 'human';

  if (typeof input.hypothesisId !== 'string' || input.hypothesisId.trim().length === 0) {
    return { ok: false, kind: 'invalid_body', field: 'hypothesisId', reason: 'no_hypothesis' };
  }
  const hypothesis: { id: string; account_name: string } | null = await prisma.prospectingHypothesis.findUnique({
    where: { id: input.hypothesisId },
    select: { id: true, account_name: true },
  });
  if (!hypothesis) return { ok: false, kind: 'refused', reason: 'hypothesis_not_found' };

  const contactEmail = normalizeEmail(input.contactEmail);
  let dispositionId: string | null = null;
  if (input.dispositionId) {
    const disposition: { id: string; hypothesis_id: string } | null = await prisma.conversationDisposition.findUnique({
      where: { id: input.dispositionId },
      select: { id: true, hypothesis_id: true },
    });
    if (!disposition || disposition.hypothesis_id !== hypothesis.id) return { ok: false, kind: 'refused', reason: 'disposition_mismatch' };
    dispositionId = disposition.id;
  }

  let personaId: number | null = null;
  if (contactEmail.length > 0) {
    const persona: { id: number } | null = await prisma.persona.findFirst({
      where: { email: contactEmail, account_name: hypothesis.account_name },
      select: { id: true },
    });
    personaId = persona?.id ?? null;
  }

  const shared = {
    type: input.type,
    rawBuyerLanguage: input.rawBuyerLanguage,
    normalizedSummary: input.normalizedSummary,
    numericValue: input.numericValue,
    unit: input.unit,
    source: input.source,
    capturedAt: input.now,
    capturedBy: actor,
    confirm,
    metadata: input.metadata,
  };

  const result = input.supersedesId
    ? await correctBid(prisma, input.supersedesId, shared, { now: input.now })
    : await captureBid(
        prisma,
        {
          hypothesisId: hypothesis.id,
          accountName: hypothesis.account_name,
          personaId,
          contactEmail,
          dispositionId,
          ...shared,
        },
        { now: input.now },
      );

  if (!result.ok) {
    if (result.field) return { ok: false, kind: 'invalid_body', field: result.field, reason: result.reason };
    return { ok: false, kind: 'refused', reason: result.reason };
  }

  await safeAudit(auditFn, prisma, {
    kind: 'bid.captured',
    actor: input.actor,
    subjectType: 'bid',
    subjectId: result.id,
    payload: {
      hypothesisId: hypothesis.id,
      accountName: hypothesis.account_name,
      contactEmail,
      dispositionId,
      type: input.type,
      source: input.source,
      humanConfirmed: result.humanConfirmed,
      supersedesId: result.supersedesId,
      actorKind: input.actorKind,
    },
  });

  return { ok: true, bidId: result.id, humanConfirmed: result.humanConfirmed, supersedesId: result.supersedesId };
}

export type ConfirmBidByHumanResult =
  | { ok: true; bidId: string; alreadyConfirmed: boolean }
  | { ok: false; reason: BidRefusal };

/** Flip one row to human-confirmed and audit it. Only a human actor can; capture.ts refuses the rest. */
export async function confirmBidByHuman(
  prisma: any,
  bidId: string,
  actor: string,
  actorKind: ActorKind,
  now: Date,
  deps: BidServiceDeps = {},
): Promise<ConfirmBidByHumanResult> {
  const auditFn = deps.audit ?? defaultAudit;
  const result = await confirmBid(prisma, bidId, { id: actor, kind: actorKind }, { now });
  if (!result.ok) return result;
  if (!result.alreadyConfirmed) {
    await safeAudit(auditFn, prisma, {
      kind: 'bid.confirmed',
      actor,
      subjectType: 'bid',
      subjectId: bidId,
      payload: { at: now.toISOString() },
    });
  }
  return { ok: true, bidId, alreadyConfirmed: result.alreadyConfirmed };
}

export interface ListedBids {
  /** Every row of the hypothesis, oldest first. */
  all: ResolutionBid[];
  /** The rows resolution reads: human-confirmed and not superseded. */
  confirmed: ResolutionBid[];
}

/** Every BID of a hypothesis, plus the confirmed unsuperseded subset. */
export async function listBids(prisma: any, hypothesisId: string): Promise<ListedBids> {
  const rows: any[] = await prisma.buyerInputData.findMany({
    where: { hypothesis_id: hypothesisId },
    orderBy: [{ captured_at: 'asc' }, { id: 'asc' }],
  });
  const all = rows.map(bidFromRow);
  return { all, confirmed: selectConfirmedBids(all) };
}
