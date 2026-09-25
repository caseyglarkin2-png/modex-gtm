/**
 * The Gmail draft ledger (final pass, 2026-09-25).
 *
 * Decision: NO NEW TABLE. `GapAuditEvent` is already the append-only GAP
 * ledger (UPDATE and DELETE raise GAP_APPEND_ONLY), indexed by
 * (subject_type, subject_id) and (kind, created_at), with a JSON payload. A
 * draft's whole life is three kinds of fact about one routing decision, each
 * written once and never changed:
 *
 *   execution.gmail_drafted            the draft exists (status drafted)
 *   execution.gmail_draft_sent         Casey sent it (a NEW message id)
 *   execution.gmail_draft_discarded    the draft is gone and nothing was sent
 *
 * All three are `subject_type 'routing_decision'`, `subject_id <decision id>`,
 * so "every draft for this card and what became of it" is one indexed read.
 * Fate rows name the draft they close by `gmailDraftId`; the draft id is
 * never reused as the sent message id (owner addendum 2026-09-24: drafting
 * and sending are distinct execution states).
 *
 * Creating a draft is NOT sending, NOT `human_action = emailed`, and does not
 * touch `routing_decisions` at all. Only Casey's own "I did this" records a
 * human action.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DRAFTED = 'execution.gmail_drafted' as const;
export const DRAFT_REFUSED = 'execution.gmail_draft_refused' as const;
export const DRAFT_SENT = 'execution.gmail_draft_sent' as const;
export const DRAFT_DISCARDED = 'execution.gmail_draft_discarded' as const;
export const DRAFT_SUBJECT_TYPE = 'routing_decision';

export interface DraftedPayload {
  engine: 'gmail_draft';
  status: 'drafted';
  routingDecisionId: string;
  hypothesisId: string;
  personaId: number;
  accountName: string;
  recipient: string;
  senderIdentity: string;
  subject: string;
  /** sha256 of the queued subject + body (action-pack.ts contentHashOf). */
  contentHash: string;
  /** The exact body placed in the draft (before the unsubscribe footer). */
  bodySnapshot: string;
  sequenceVersionId: string;
  compileId: string;
  gmailDraftId: string;
  gmailDraftMessageId: string | null;
  gmailThreadId: string | null;
  createdAt: string;
}

export interface DraftSentPayload {
  engine: 'gmail_direct';
  status: 'sent';
  routingDecisionId: string;
  /** The draft this send consumed (ExecutionReceipt.supersedesEngineId). */
  gmailDraftId: string;
  gmailSentMessageId: string;
  gmailThreadId: string | null;
  sentAt: string;
  reconciledAt: string;
}

export interface DraftDiscardedPayload {
  status: 'discarded';
  routingDecisionId: string;
  gmailDraftId: string;
  reconciledAt: string;
}

export type DraftFate = 'drafted' | 'sent' | 'discarded';

export interface DraftRecord {
  eventId: string;
  drafted: DraftedPayload;
  fate: DraftFate;
  sent: DraftSentPayload | null;
  discarded: DraftDiscardedPayload | null;
}

type Row = { id: string; kind: string; payload: unknown; created_at: Date };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Every draft GAP created for one routing decision, newest first, each with its fate. */
export async function listDraftRecords(prisma: PrismaLike, decisionId: string): Promise<DraftRecord[]> {
  const rows: Row[] = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, subject_id: decisionId, kind: { in: [DRAFTED, DRAFT_SENT, DRAFT_DISCARDED] } },
    orderBy: { created_at: 'desc' },
    select: { id: true, kind: true, payload: true, created_at: true },
  });
  const sentBy = new Map<string, DraftSentPayload>();
  const discardedBy = new Map<string, DraftDiscardedPayload>();
  for (const r of rows) {
    if (!isObj(r.payload) || typeof r.payload.gmailDraftId !== 'string') continue;
    if (r.kind === DRAFT_SENT) sentBy.set(r.payload.gmailDraftId, r.payload as unknown as DraftSentPayload);
    if (r.kind === DRAFT_DISCARDED) discardedBy.set(r.payload.gmailDraftId, r.payload as unknown as DraftDiscardedPayload);
  }
  return rows
    .filter((r) => r.kind === DRAFTED && isObj(r.payload) && typeof r.payload.gmailDraftId === 'string')
    .map((r) => {
      const drafted = r.payload as unknown as DraftedPayload;
      const sent = sentBy.get(drafted.gmailDraftId) ?? null;
      const discarded = discardedBy.get(drafted.gmailDraftId) ?? null;
      return { eventId: r.id, drafted, fate: sent ? 'sent' : discarded ? 'discarded' : 'drafted', sent, discarded };
    });
}

/** Append one ledger row. THROWS on failure: a receipt that silently did not land is a lie. */
export async function appendLedger(
  prisma: PrismaLike,
  kind: typeof DRAFTED | typeof DRAFT_REFUSED | typeof DRAFT_SENT | typeof DRAFT_DISCARDED,
  actor: string,
  decisionId: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const row = await prisma.gapAuditEvent.create({
    data: { kind, actor, subject_type: DRAFT_SUBJECT_TYPE, subject_id: decisionId, payload },
    select: { id: true },
  });
  return row.id;
}
