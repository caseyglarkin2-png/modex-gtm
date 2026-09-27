/**
 * ONE SEND HISTORY PER PERSON (red team T2, 2026-09-26).
 *
 * Execution truth belongs to the PERSON, not to the routing card. Every
 * routing run writes new cards; the ledger rows (draft-ledger.ts) are filed
 * under the card that produced them (`subject_id <decision id>`). Reading
 * history per card forgot, on each new card, that this person had already
 * been emailed, and offered step 0 again (Kroger persona 1886).
 *
 * `personSendHistory` answers for one person + recipient, across EVERY
 * routing decision, with no row cap:
 *
 *   sent               every Gmail-proven send: DRAFT_SENT (joined to its
 *                      DRAFTED row), MANUAL_SENT, DIRECT_SENT
 *   drafts             every GAP Gmail draft and its fate
 *   unresolvedClaims   SEND FROM YARDFLOW claims with neither SENT nor
 *                      RELEASED (outcome unknown: never resend blind)
 *
 * Identity is the union of the two things that name a human: the persona id
 * and the recipient address. A decision is this person's when its persona is
 * this persona OR any persona row carrying this address, or when a ledger row
 * under it names this address. So a duplicate persona row for the same
 * mailbox, or an older address on the same persona, still counts: a cold
 * first touch twice to the same human is the failure this exists to prevent.
 *
 * Historical rows are never rewritten; this derives truth over them.
 */
import {
  DIRECT_CLAIMED,
  DIRECT_RELEASED,
  DIRECT_SENT,
  DRAFT_DISCARDED,
  DRAFT_SENT,
  DRAFT_SUBJECT_TYPE,
  DRAFTED,
  MANUAL_SENT,
  type DraftDiscardedPayload,
  type DraftedPayload,
  type DraftFate,
  type DraftSentPayload,
} from './draft-ledger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const EXECUTION_KINDS = [DRAFTED, DRAFT_SENT, DRAFT_DISCARDED, MANUAL_SENT, DIRECT_CLAIMED, DIRECT_SENT, DIRECT_RELEASED] as const;

export type SendEngine = 'gmail_draft' | 'manual' | 'gmail_direct';

export interface PersonSend {
  eventId: string;
  decisionId: string;
  engine: SendEngine;
  stepIndex: number;
  sentAt: string;
  subject: string;
  recipient: string;
  personaId: number | null;
  hypothesisId: string | null;
  sequenceVersionId: string | null;
  senderIdentity: string | null;
  gmailSentMessageId: string;
  gmailThreadId: string | null;
  bodySnapshot: string | null;
}

export interface PersonDraft {
  eventId: string;
  decisionId: string;
  drafted: DraftedPayload;
  fate: DraftFate;
  sent: DraftSentPayload | null;
  discarded: DraftDiscardedPayload | null;
}

export interface PersonClaim {
  eventId: string;
  decisionId: string;
  idempotencyKey: string;
  /** From the payload (current claims) or parsed from a legacy per-decision key; null when neither says. */
  stepIndex: number | null;
  claimedAt: string;
}

export interface PersonSendHistory {
  personaId: number | null;
  recipient: string;
  decisionIds: string[];
  /** Ordered by step, then send time, then event id. */
  sent: PersonSend[];
  /** Ordered newest first (the draft service's order). */
  drafts: PersonDraft[];
  unresolvedClaims: PersonClaim[];
}

type Row = { id: string; subject_id: string; kind: string; payload: unknown; created_at: Date };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The person-level send claim key: person + recipient + step. No card, no copy hash, no version. */
export function personStepKey(personaId: number | null, recipient: string, stepIndex: number): string {
  return `gmail_direct:person:${personaId ?? 'none'}:${recipient.trim().toLowerCase()}:step:${stepIndex}`;
}

/** Step of a claim: payload first, else a legacy `gmail_direct:<decision>:<version>:<step>:<recipient>:<hash>` key. */
export function claimStep(key: string, payload: Record<string, unknown>): number | null {
  const fromPayload = num(payload.stepIndex);
  if (fromPayload !== null) return fromPayload;
  const person = /^gmail_direct:person:[^:]+:.+:step:(\d+)$/.exec(key);
  if (person) return Number(person[1]);
  const legacy = key.split(':');
  if (legacy[0] === 'gmail_direct' && legacy.length >= 6 && /^\d+$/.test(legacy[3])) return Number(legacy[3]);
  return null;
}

const CHUNK = 500;

async function rowsFor(prisma: PrismaLike, decisionIds: string[]): Promise<Row[]> {
  const out: Row[] = [];
  for (let i = 0; i < decisionIds.length; i += CHUNK) {
    const ids = decisionIds.slice(i, i + CHUNK);
    const rows: Row[] = await prisma.gapAuditEvent.findMany({
      where: { subject_type: DRAFT_SUBJECT_TYPE, subject_id: { in: ids }, kind: { in: [...EXECUTION_KINDS] } },
      select: { id: true, subject_id: true, kind: true, payload: true, created_at: true },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    });
    out.push(...rows);
  }
  return out.sort((a, b) => a.created_at.getTime() - b.created_at.getTime() || a.id.localeCompare(b.id));
}

/** Decisions that belong to this person + recipient (see the identity rule above). */
export async function personDecisionIds(prisma: PrismaLike, personaId: number | null, recipient: string): Promise<string[]> {
  const address = recipient.trim().toLowerCase();
  const personaIds = new Set<number>();
  if (personaId !== null) personaIds.add(personaId);
  if (address) {
    const same: Array<{ id: number }> = await prisma.persona.findMany({
      where: { email: { equals: address, mode: 'insensitive' } },
      select: { id: true },
    });
    for (const p of same) personaIds.add(p.id);
  }
  const ids = new Set<string>();
  if (personaIds.size > 0) {
    const decisions: Array<{ id: string }> = await prisma.routingDecision.findMany({
      where: { persona_id: { in: [...personaIds] } },
      select: { id: true },
    });
    for (const d of decisions) ids.add(d.id);
  }
  if (address) {
    // Ledger rows name their recipient (lowercased by every writer). A row
    // under a decision this person no longer owns still names them.
    const named: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({
      where: { subject_type: DRAFT_SUBJECT_TYPE, kind: { in: [DRAFTED, MANUAL_SENT, DIRECT_SENT, DIRECT_CLAIMED] }, payload: { path: ['recipient'], equals: address } },
      select: { subject_id: true },
    });
    for (const r of named) ids.add(r.subject_id);
  }
  return [...ids].sort();
}

/** Pure: the history from ledger rows (every row already belongs to this person). */
export function historyFromRows(rows: readonly Row[], personaId: number | null, recipient: string, decisionIds: string[]): PersonSendHistory {
  const drafted = new Map<string, { row: Row; payload: DraftedPayload }>();
  const draftSent = new Map<string, { row: Row; payload: DraftSentPayload }>();
  const discarded = new Map<string, DraftDiscardedPayload>();
  const claims = new Map<string, { row: Row; payload: Record<string, unknown> }[]>();
  const released = new Map<string, number>();
  const directSentKeys = new Set<string>();
  const sent: PersonSend[] = [];

  for (const r of rows) {
    if (!isObj(r.payload)) continue;
    const p = r.payload;
    const draftId = str(p.gmailDraftId);
    if (r.kind === DRAFTED && draftId) drafted.set(draftId, { row: r, payload: p as unknown as DraftedPayload });
    else if (r.kind === DRAFT_SENT && draftId) draftSent.set(draftId, { row: r, payload: p as unknown as DraftSentPayload });
    else if (r.kind === DRAFT_DISCARDED && draftId) discarded.set(draftId, p as unknown as DraftDiscardedPayload);
    else if (r.kind === DIRECT_CLAIMED && str(p.idempotencyKey)) {
      const key = p.idempotencyKey as string;
      claims.set(key, [...(claims.get(key) ?? []), { row: r, payload: p }]);
    } else if (r.kind === DIRECT_RELEASED && str(p.idempotencyKey)) {
      const key = p.idempotencyKey as string;
      released.set(key, (released.get(key) ?? 0) + 1);
    } else if ((r.kind === DIRECT_SENT || r.kind === MANUAL_SENT) && str(p.gmailSentMessageId)) {
      if (r.kind === DIRECT_SENT && str(p.idempotencyKey)) directSentKeys.add(p.idempotencyKey as string);
      sent.push({
        eventId: r.id,
        decisionId: r.subject_id,
        engine: r.kind === DIRECT_SENT ? 'gmail_direct' : 'manual',
        stepIndex: num(p.stepIndex) ?? 0,
        sentAt: str(p.sentAt) ?? r.created_at.toISOString(),
        subject: str(p.subject) ?? '',
        recipient: (str(p.recipient) ?? recipient).toLowerCase(),
        personaId: num(p.personaId),
        hypothesisId: str(p.hypothesisId),
        sequenceVersionId: str(p.sequenceVersionId),
        senderIdentity: str(p.senderIdentity),
        gmailSentMessageId: p.gmailSentMessageId as string,
        gmailThreadId: str(p.gmailThreadId),
        bodySnapshot: str(p.bodySnapshot),
      });
    }
  }

  const drafts: PersonDraft[] = [];
  for (const [draftId, d] of drafted) {
    const s = draftSent.get(draftId) ?? null;
    const x = discarded.get(draftId) ?? null;
    drafts.push({ eventId: d.row.id, decisionId: d.row.subject_id, drafted: d.payload, fate: s ? 'sent' : x ? 'discarded' : 'drafted', sent: s?.payload ?? null, discarded: x });
    if (s) {
      sent.push({
        eventId: s.row.id,
        decisionId: d.row.subject_id,
        engine: 'gmail_draft',
        stepIndex: num(d.payload.stepIndex) ?? 0,
        sentAt: str(s.payload.sentAt) ?? s.row.created_at.toISOString(),
        subject: str(d.payload.subject) ?? '',
        recipient: (str(d.payload.recipient) ?? recipient).toLowerCase(),
        personaId: num(d.payload.personaId),
        hypothesisId: str(d.payload.hypothesisId),
        sequenceVersionId: str(d.payload.sequenceVersionId),
        senderIdentity: str(d.payload.senderIdentity),
        gmailSentMessageId: s.payload.gmailSentMessageId,
        gmailThreadId: str(s.payload.gmailThreadId),
        bodySnapshot: str(d.payload.bodySnapshot),
      });
    }
  }
  drafts.sort((a, b) => b.drafted.createdAt.localeCompare(a.drafted.createdAt) || b.eventId.localeCompare(a.eventId));
  sent.sort((a, b) => a.stepIndex - b.stepIndex || a.sentAt.localeCompare(b.sentAt) || a.eventId.localeCompare(b.eventId));

  const unresolvedClaims: PersonClaim[] = [];
  for (const [key, list] of claims) {
    if (directSentKeys.has(key)) continue;
    const open = list.length - (released.get(key) ?? 0);
    if (open <= 0) continue;
    const last = list[list.length - 1];
    unresolvedClaims.push({
      eventId: last.row.id,
      decisionId: last.row.subject_id,
      idempotencyKey: key,
      stepIndex: claimStep(key, last.payload),
      claimedAt: str(last.payload.claimedAt) ?? last.row.created_at.toISOString(),
    });
  }
  unresolvedClaims.sort((a, b) => a.claimedAt.localeCompare(b.claimedAt) || a.eventId.localeCompare(b.eventId));

  return { personaId, recipient: recipient.trim().toLowerCase(), decisionIds, sent, drafts, unresolvedClaims };
}

/** Every send, draft and open claim for this person + recipient, across all routing decisions. */
export async function personSendHistory(prisma: PrismaLike, personaId: number | null, recipient: string): Promise<PersonSendHistory> {
  const decisionIds = await personDecisionIds(prisma, personaId, recipient);
  const rows = decisionIds.length > 0 ? await rowsFor(prisma, decisionIds) : [];
  return historyFromRows(rows, personaId, recipient, decisionIds);
}

/** The history for the person a routing decision is about (its persona's current address). */
export async function personSendHistoryForDecision(prisma: PrismaLike, decisionId: string): Promise<PersonSendHistory> {
  const decision: { persona_id: number | null } | null = await prisma.routingDecision.findUnique({ where: { id: decisionId }, select: { persona_id: true } });
  const personaId = decision?.persona_id ?? null;
  const persona: { email: string | null } | null =
    personaId !== null ? await prisma.persona.findUnique({ where: { id: personaId }, select: { email: true } }) : null;
  const recipient = (persona?.email ?? '').trim().toLowerCase();
  if (personaId === null && !recipient) {
    // No person on the card: its own rows are all there is.
    const rows = await rowsFor(prisma, [decisionId]);
    return historyFromRows(rows, null, '', [decisionId]);
  }
  const history = await personSendHistory(prisma, personaId, recipient);
  if (history.decisionIds.includes(decisionId)) return history;
  // The card's own rows always count, even if its persona link was edited away.
  const ids = [...history.decisionIds, decisionId].sort();
  return historyFromRows(await rowsFor(prisma, ids), personaId, recipient, ids);
}
