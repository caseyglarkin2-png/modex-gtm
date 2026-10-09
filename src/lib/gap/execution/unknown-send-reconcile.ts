/**
 * Ops closeout (item 13B): reconcile unknown-outcome direct sends against
 * Gmail Sent.
 *
 * A direct send whose Gmail answer was lost (5xx, timeout, unreadable 2xx,
 * missing id) leaves its DIRECT_CLAIMED open (seller-send.ts). That already
 * freezes the person: no second send of that step, on any card. What was
 * missing is a path to TRUTH. This reads Gmail Sent in the GAP mailbox for
 * messages to that exact recipient around the claim:
 *
 *   exactly one        -> DIRECT_SENT, reconciledFromSent: true
 *   none               -> nothing written; still unknown (never "not sent")
 *   more than one      -> nothing written; ambiguous
 *   Gmail unreadable   -> nothing written; still unknown
 *
 * Bounded: claims younger than UNKNOWN_SEND_MIN_AGE_MS may still be on the
 * wire and are not touched; at most MAX_PER_RUN claims per run. Nothing here
 * ever releases a claim.
 */
import { captureSendAttribution } from './send-attribution';
import { DIRECT_CLAIMED, DIRECT_PREVIEWED, DIRECT_RELEASED, DIRECT_SENT, DRAFT_SUBJECT_TYPE, appendLedger } from './draft-ledger';

/* eslint-disable @typescript-eslint/no-explicit-any */
type PrismaLike = any;

export const UNKNOWN_SEND_MIN_AGE_MS = 10 * 60_000;
/** Sent is searched from a minute before the claim to this long after it. */
export const UNKNOWN_SEND_WINDOW_MS = 2 * 60 * 60_000;
const MAX_PER_RUN = 10;

export interface SentMatch {
  id: string;
  threadId: string | null;
  internalDate: Date;
  to: string;
  subject: string;
}

export interface OpenClaim {
  idempotencyKey: string;
  decisionId: string;
  personaId: number | null;
  recipient: string;
  stepIndex: number;
  claimedAt: Date;
}

export interface UnknownSendReport {
  checked: number;
  reconciled: number;
  stillUnknown: Array<{ idempotencyKey: string; recipient: string; claimedAt: string; reason: 'not_in_sent' | 'ambiguous_in_sent' | 'gmail_error' | 'not_yet_checked'; detail?: string }>;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Every direct claim with no DIRECT_SENT and more claims than releases. */
export async function openDirectClaims(prisma: PrismaLike): Promise<OpenClaim[]> {
  const rows: Array<{ kind: string; subject_id: string; payload: unknown; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, kind: { in: [DIRECT_CLAIMED, DIRECT_SENT, DIRECT_RELEASED] } },
    select: { kind: true, subject_id: true, payload: true, created_at: true },
    orderBy: { created_at: 'asc' },
  });
  const claims = new Map<string, { n: number; last: OpenClaim }>();
  const released = new Map<string, number>();
  const sent = new Set<string>();
  for (const r of rows) {
    if (!isObj(r.payload) || typeof r.payload.idempotencyKey !== 'string') continue;
    const key = r.payload.idempotencyKey;
    if (r.kind === DIRECT_SENT) sent.add(key);
    else if (r.kind === DIRECT_RELEASED) released.set(key, (released.get(key) ?? 0) + 1);
    else {
      const p = r.payload;
      const claimedAt = typeof p.claimedAt === 'string' ? new Date(p.claimedAt) : r.created_at;
      claims.set(key, {
        n: (claims.get(key)?.n ?? 0) + 1,
        last: { idempotencyKey: key, decisionId: r.subject_id, personaId: typeof p.personaId === 'number' ? p.personaId : null, recipient: String(p.recipient ?? '').toLowerCase(), stepIndex: typeof p.stepIndex === 'number' ? p.stepIndex : 0, claimedAt },
      });
    }
  }
  return [...claims.entries()].filter(([key, c]) => !sent.has(key) && c.n > (released.get(key) ?? 0) && c.last.recipient.includes('@')).map(([, c]) => c.last);
}

export async function reconcileUnknownSends(
  prisma: PrismaLike,
  input: { now: Date; actor?: string },
  deps: { listSent: (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<SentMatch[]>; mailbox: string },
): Promise<UnknownSendReport> {
  const actor = input.actor ?? 'cron:gap-mailbox';
  const report: UnknownSendReport = { checked: 0, reconciled: 0, stillUnknown: [] };
  const due = (await openDirectClaims(prisma)).filter((c) => input.now.getTime() - c.claimedAt.getTime() >= UNKNOWN_SEND_MIN_AGE_MS);
  for (const [i, c] of due.entries()) {
    const unknown = (reason: UnknownSendReport['stillUnknown'][number]['reason'], detail?: string) =>
      report.stillUnknown.push({ idempotencyKey: c.idempotencyKey, recipient: c.recipient, claimedAt: c.claimedAt.toISOString(), reason, ...(detail ? { detail } : {}) });
    if (i >= MAX_PER_RUN) {
      unknown('not_yet_checked');
      continue;
    }
    report.checked += 1;
    const from = c.claimedAt.getTime() - 60_000;
    const to = c.claimedAt.getTime() + UNKNOWN_SEND_WINDOW_MS;
    let found: SentMatch[];
    try {
      found = (await deps.listSent(c.recipient, Math.floor(from / 1000), Math.ceil(to / 1000))).filter(
        (m) => m.internalDate.getTime() >= from && m.internalDate.getTime() <= to && m.to.toLowerCase().includes(c.recipient),
      );
    } catch (e) {
      unknown('gmail_error', e instanceof Error ? e.message : String(e));
      continue;
    }
    if (found.length === 0) {
      unknown('not_in_sent');
      continue;
    }
    if (found.length > 1) {
      unknown('ambiguous_in_sent', found.map((m) => m.id).join(','));
      continue;
    }
    // Re-read right before writing: a late answer from the send path may have recorded it.
    const already = await prisma.gapAuditEvent.findFirst({
      where: { subject_type: DRAFT_SUBJECT_TYPE, kind: DIRECT_SENT, payload: { path: ['idempotencyKey'], equals: c.idempotencyKey } },
      select: { id: true },
    });
    if (already) continue;
    const m = found[0];
    const decision = await prisma.routingDecision.findUnique({ where: { id: c.decisionId }, select: { hypothesis_id: true, account_name: true } });
    // C41: the newest final check of this card and step (DIRECT_PREVIEWED: the hash, recipient, sender, subject and
    // thread the seller confirmed) is what the send carried; the reconciled row keeps it, so the body hash survives.
    const previews: Array<{ payload: Record<string, unknown> | null; created_at: Date | string }> = await prisma.gapAuditEvent
      .findMany({ where: { subject_type: DRAFT_SUBJECT_TYPE, subject_id: c.decisionId, kind: DIRECT_PREVIEWED }, select: { payload: true, created_at: true }, orderBy: { created_at: 'desc' } })
      .catch(() => []);
    const preview = previews.map((r) => r.payload ?? {}).find((p) => Number(p.stepIndex ?? 0) === c.stepIndex && String(p.recipient ?? '').toLowerCase() === c.recipient) ?? null;
    const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
    await appendLedger(prisma, DIRECT_SENT, actor, c.decisionId, {
      engine: 'gmail_direct',
      channel: 'gmail',
      status: 'sent',
      idempotencyKey: c.idempotencyKey,
      routingDecisionId: c.decisionId,
      hypothesisId: decision?.hypothesis_id ?? null,
      personaId: c.personaId,
      accountName: decision?.account_name ?? null,
      recipient: c.recipient,
      senderIdentity: str(preview?.sender) ?? deps.mailbox,
      subject: m.subject,
      contentHash: str(preview?.contentHash),
      reviewedSubject: str(preview?.subject),
      attributedFromPreview: !!preview,
      stepIndex: c.stepIndex,
      // The claim is only taken after prepareSellerEmail passed the T6 gate.
      evidenceTier: 'VERIFIED_FACT',
      gmailSentMessageId: m.id,
      gmailThreadId: m.threadId ?? str(preview?.gmailThreadId),
      sentAt: m.internalDate.toISOString(),
      reconciledFromSent: true,
      reconciledAt: input.now.toISOString(),
      attribution: await captureSendAttribution(prisma, { hypothesisId: decision?.hypothesis_id ?? null, personaId: c.personaId, accountName: decision?.account_name ?? '', stepIndex: c.stepIndex, sequenceVersionId: null, at: m.internalDate }),
    });
    report.reconciled += 1;
  }
  return report;
}
