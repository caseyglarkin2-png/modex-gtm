/**
 * Reconcile a send Casey made BY HAND (copying the action pack) to the real
 * Gmail sent message (2026-09-25, Joey Maggard).
 *
 * `matchManualSend` is pure: given the action pack's rendered copy and the
 * Gmail messages sent to the recipient, it returns the ONE message that is
 * that email (recipient, subject ignoring case and "Re:", and every line of
 * the rendered body present in the sent text, whitespace-normalized, the
 * template sign-off excepted since Casey signs his own way), or `ambiguous`
 * with the candidates, or `none`. It never guesses between two.
 *
 * Recording (`recordManualSend`): one MANUAL_SENT ledger row (engine manual,
 * channel gmail, the real Gmail message id, thread id, RFC Message-ID and
 * sent time), never a draft row. The human action `emailed` is written ONLY
 * when the caller passes Casey's explicit statement; Gmail proving a send is
 * execution truth, not Casey's routing feedback.
 */
import { recordHumanAction } from '../routing/queue';
import { appendLedger, MANUAL_SENT, type ManualSentPayload } from './draft-ledger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface SentCandidate {
  id: string;
  threadId: string;
  to: string;
  subject: string;
  sentAt: string;
  text: string;
  rfcMessageId: string | null;
}

const flat = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
const subjectKey = (s: string) => flat(s).replace(/^(re|fwd?):\s*/i, '');
const TEMPLATE_SIGNOFF = 'casey larkin, yardflow by freightroll';

export type MatchResult =
  | { kind: 'match'; message: SentCandidate; matchedOn: string[] }
  | { kind: 'ambiguous'; candidates: SentCandidate[] }
  | { kind: 'none'; candidates: SentCandidate[] };

export function matchManualSend(rendered: { recipient: string; subject: string; body: string }, candidates: readonly SentCandidate[]): MatchResult {
  const lines = rendered.body.split(/\n+/).map(flat).filter((l) => l && l !== TEMPLATE_SIGNOFF);
  const hits = candidates.filter((c) => {
    if (!c.to.toLowerCase().includes(rendered.recipient.toLowerCase())) return false;
    if (subjectKey(c.subject) !== subjectKey(rendered.subject)) return false;
    const text = flat(c.text);
    return lines.every((l) => text.includes(l));
  });
  if (hits.length === 1) return { kind: 'match', message: hits[0], matchedOn: ['recipient', 'subject (case-insensitive)', `all ${lines.length} rendered body lines`] };
  if (hits.length > 1) return { kind: 'ambiguous', candidates: hits };
  return { kind: 'none', candidates: [...candidates] };
}

export async function recordManualSend(
  prisma: PrismaLike,
  input: {
    decisionId: string;
    hypothesisId: string;
    personaId: number;
    accountName: string;
    sequenceVersionId: string;
    stepIndex: number;
    senderIdentity: string;
    match: Extract<MatchResult, { kind: 'match' }>;
    actor: string;
    now: Date;
    /** Casey's own words that he sent it; required to record human_action = emailed. */
    ownerStatement: string | null;
  },
): Promise<{ ledgerId: string; humanAction: 'recorded' | 'already_acted' | 'not_recorded' }> {
  const existing = await prisma.gapAuditEvent.findFirst({
    where: { subject_type: 'routing_decision', subject_id: input.decisionId, kind: MANUAL_SENT, payload: { path: ['gmailSentMessageId'], equals: input.match.message.id } },
    select: { id: true },
  });
  const payload: ManualSentPayload = {
    engine: 'manual',
    channel: 'gmail',
    status: 'sent',
    routingDecisionId: input.decisionId,
    hypothesisId: input.hypothesisId,
    personaId: input.personaId,
    accountName: input.accountName,
    recipient: input.match.message.to.toLowerCase(),
    senderIdentity: input.senderIdentity,
    subject: input.match.message.subject,
    sequenceVersionId: input.sequenceVersionId,
    stepIndex: input.stepIndex,
    gmailSentMessageId: input.match.message.id,
    gmailThreadId: input.match.message.threadId,
    rfcMessageId: input.match.message.rfcMessageId,
    sentAt: input.match.message.sentAt,
    matchedOn: input.match.matchedOn,
    recordedAt: input.now.toISOString(),
  };
  const ledgerId = existing ? String(existing.id) : (await appendLedger(prisma, MANUAL_SENT, input.actor, input.decisionId, payload as unknown as Record<string, unknown>));
  if (!input.ownerStatement) return { ledgerId, humanAction: 'not_recorded' };
  // One human_action audit row, carrying the statement it was recorded from.
  const r = await recordHumanAction(prisma, input.decisionId, 'emailed', input.actor, {
    now: () => input.now,
    audit: (p: PrismaLike, e: { kind: string; actor: string; subjectType: string; subjectId: string; payload: Record<string, unknown> }) =>
      p.gapAuditEvent.create({
        data: { kind: e.kind, actor: e.actor, subject_type: e.subjectType, subject_id: e.subjectId, payload: { ...e.payload, source: 'owner_statement', statement: input.ownerStatement, gmailSentMessageId: input.match.message.id } },
      }),
  } as never);
  return { ledgerId, humanAction: r.ok ? 'recorded' : r.reason === 'already_acted' ? 'already_acted' : 'not_recorded' };
}
