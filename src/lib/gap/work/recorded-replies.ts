/**
 * R60, capture once on a reply: Work forgets a reply the moment it is recorded (2026-10-07). Server only.
 *
 * Work's read of the waiting replies is remembered for two minutes per instance (UX-14), so a reply logged through
 * Capture kept its "Log what they said" card until the read turned over: the seller was asked again for what they had
 * just done. On every Work load, ONE live read says which of the remembered replies now carry a confirmed disposition;
 * those replies leave Work, and a remembered pursuit summary that still says "replied" (or "opted out") for an account
 * with no reply left waiting is not allowed to say it on the account's card.
 */
import { REPLY_COPIED, REPLY_SENT, REPLY_SUBJECT_TYPE } from '../execution/draft-ledger';
import { classifyReply } from '../replies/classify';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** R63-A S4: how far back a recorded reply still owes its answer on Work. */
export const ANSWER_OWED_DAYS = 14;
/** R63-A S4: what a recorded reply can mean and still be owed no answer (a stop, a machine, nothing to act on). */
const NO_ANSWER_CLASSES = ['do_not_contact', 'bounce', 'out_of_office', 'no_signal'];

/**
 * R63-A S4, amended by X14 (copied is not sent): the replies among `ids` that were ANSWERED from GAP, which means sent
 * in their thread: by GAP, or by hand and found in Sent (execution/copies-reconcile.ts writes the same REPLY_SENT row
 * with `reconciledFromSent`). A copy alone is not an answer: the reply stays owed, said as copied (loadCopiedReplyIds).
 */
export async function loadAnsweredReplyIds(prisma: PrismaLike, ids: readonly string[]): Promise<Set<string>> {
  const want = [...new Set(ids.filter(Boolean))];
  if (!want.length || typeof prisma?.gapAuditEvent?.findMany !== 'function') return new Set();
  const rows: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({ where: { subject_type: REPLY_SUBJECT_TYPE, subject_id: { in: want }, kind: REPLY_SENT }, select: { subject_id: true } });
  return new Set(rows.map((r) => r.subject_id));
}

/** X14: the replies among `ids` whose answer was COPIED (to send by hand) and not yet seen sent: id -> the newest copy time. */
export async function loadCopiedReplyIds(prisma: PrismaLike, ids: readonly string[]): Promise<Map<string, string>> {
  const want = [...new Set(ids.filter(Boolean))];
  if (!want.length || typeof prisma?.gapAuditEvent?.findMany !== 'function') return new Map();
  const rows: Array<{ subject_id: string; kind: string; created_at: Date | string }> = await prisma.gapAuditEvent.findMany({ where: { subject_type: REPLY_SUBJECT_TYPE, subject_id: { in: want }, kind: { in: [REPLY_SENT, REPLY_COPIED] } }, select: { subject_id: true, kind: true, created_at: true } });
  const sent = new Set(rows.filter((r) => r.kind === REPLY_SENT).map((r) => r.subject_id));
  const out = new Map<string, string>();
  for (const r of rows) {
    if (r.kind !== REPLY_COPIED || sent.has(r.subject_id)) continue;
    const at = new Date(r.created_at).toISOString();
    if (!out.has(r.subject_id) || at > (out.get(r.subject_id) as string)) out.set(r.subject_id, at);
  }
  return out;
}

/** A person's reply that asks for an answer (a person writing, never a referral, an opt-out, a notice or a bounce). */
export function answerable(m: { snippet: string; subject: string | null; from: string }): boolean {
  const c = classifyReply(m);
  return c.kind === 'human' && c.human !== 'referral';
}

/**
 * R63-A S4: the replies recorded (what they said, through Capture) and not yet answered: Work keeps each as "Answer
 * <them>" until GAP sends or copies the answer (the R42 contract), instead of forgetting it the moment it is recorded.
 * DB only, bounded: the last ANSWER_OWED_DAYS of human-confirmed dispositions on a message.
 */
export async function loadAnswersOwed(prisma: PrismaLike, now: Date): Promise<Array<{ accountName: string; contactEmail: string; subject: string | null; snippet: string; receivedAt: string; id: string; threadId: string | null; fromName: string | null; personaId: number | null; recorded: true }>> {
  if (typeof prisma?.conversationDisposition?.findMany !== 'function' || typeof prisma?.inboundMessage?.findMany !== 'function') return [];
  const since = new Date(now.getTime() - ANSWER_OWED_DAYS * 86_400_000);
  const disp: Array<{ source_id: string; account_name: string; persona_id: number | null; response_class: string }> = await prisma.conversationDisposition.findMany({
    where: { human_confirmed: true, source_kind: 'inbound_message', created_at: { gte: since }, response_class: { notIn: NO_ANSWER_CLASSES } },
    select: { source_id: true, account_name: true, persona_id: true, response_class: true },
    orderBy: { created_at: 'desc' },
    take: 100,
  });
  if (!disp.length) return [];
  const answered = await loadAnsweredReplyIds(prisma, disp.map((d) => d.source_id));
  const open = disp.filter((d) => !answered.has(d.source_id));
  if (!open.length) return [];
  const msgs: Array<{ id: string; thread_id: string | null; from_email: string; from_name: string | null; subject: string | null; snippet: string | null; body_text: string | null; received_at: Date }> = await prisma.inboundMessage.findMany({
    where: { id: { in: open.map((d) => d.source_id) } },
    select: { id: true, thread_id: true, from_email: true, from_name: true, subject: true, snippet: true, body_text: true, received_at: true },
  });
  const byId = new Map(open.map((d) => [d.source_id, d]));
  return msgs
    .filter((m) => answerable({ snippet: m.body_text || m.snippet || '', subject: m.subject, from: m.from_email }))
    .map((m) => ({ accountName: byId.get(m.id)!.account_name, contactEmail: m.from_email, subject: m.subject, snippet: m.body_text || m.snippet || '', receivedAt: new Date(m.received_at).toISOString(), id: m.id, threadId: m.thread_id, fromName: m.from_name, personaId: byId.get(m.id)!.persona_id ?? null, recorded: true as const }));
}

/** The ids among `ids` whose reply now carries a human-confirmed disposition. Soft: an unreadable ledger reads none. */
export async function loadRecordedReplyIds(prisma: PrismaLike, ids: readonly string[]): Promise<Set<string>> {
  const want = [...new Set(ids.filter(Boolean))];
  if (!want.length || typeof prisma?.conversationDisposition?.findMany !== 'function') return new Set();
  const rows: Array<{ source_id: string }> = await prisma.conversationDisposition.findMany({
    where: { source_kind: { in: ['inbound_message', 'hubspot_engagement'] }, source_id: { in: want }, human_confirmed: true },
    select: { source_id: true },
  });
  return new Set(rows.map((r) => r.source_id));
}

/**
 * The replies still waiting, and the summaries with a stale "replied" or "opted out" dropped where nothing waits.
 *
 * R63-A S1: after a Refresh the recorded reply is no longer in the (fresh) list at all, so "settled" never saw it and a
 * remembered "replied" kept the card for minutes. With `complete` (the list holds every waiting reply), a "replied" or
 * "opted out" summary for an account with no reply waiting is stale whatever the remembered read said.
 */
export function withoutRecordedReplies<R extends { id?: string | null; accountName: string }, S extends { state: string }>(
  replies: readonly R[],
  summaries: ReadonlyMap<string, S> | undefined,
  recorded: ReadonlySet<string>,
  opts: { complete?: boolean } = {},
): { replies: R[]; summaries: Map<string, S> | undefined } {
  if (!recorded.size && !opts.complete) return { replies: [...replies], summaries: summaries ? new Map(summaries) : undefined };
  const waiting = replies.filter((r) => !r.id || !recorded.has(r.id));
  const settled = new Set(replies.filter((r) => !!r.id && recorded.has(r.id)).map((r) => r.accountName).filter((a) => !waiting.some((w) => w.accountName === a)));
  const waitingAt = new Set(waiting.map((r) => r.accountName));
  const stale = (a: string) => settled.has(a) || (!!opts.complete && !waitingAt.has(a));
  const kept = summaries ? new Map([...summaries].filter(([a, s]) => !(stale(a) && (s.state === 'replied' || s.state === 'opted_out')))) : undefined;
  return { replies: waiting, summaries: kept };
}
