/**
 * R60, capture once on a reply: Work forgets a reply the moment it is recorded (2026-10-07). Server only.
 *
 * Work's read of the waiting replies is remembered for two minutes per instance (UX-14), so a reply logged through
 * Capture kept its "Log what they said" card until the read turned over: the seller was asked again for what they had
 * just done. On every Work load, ONE live read says which of the remembered replies now carry a confirmed disposition;
 * those replies leave Work, and a remembered pursuit summary that still says "replied" (or "opted out") for an account
 * with no reply left waiting is not allowed to say it on the account's card.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

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

/** The replies still waiting, and the summaries with a stale "replied" or "opted out" dropped where nothing waits. */
export function withoutRecordedReplies<R extends { id?: string | null; accountName: string }, S extends { state: string }>(
  replies: readonly R[],
  summaries: ReadonlyMap<string, S> | undefined,
  recorded: ReadonlySet<string>,
): { replies: R[]; summaries: Map<string, S> | undefined } {
  if (!recorded.size) return { replies: [...replies], summaries: summaries ? new Map(summaries) : undefined };
  const waiting = replies.filter((r) => !r.id || !recorded.has(r.id));
  const settled = new Set(replies.filter((r) => !!r.id && recorded.has(r.id)).map((r) => r.accountName).filter((a) => !waiting.some((w) => w.accountName === a)));
  const kept = summaries ? new Map([...summaries].filter(([a, s]) => !(settled.has(a) && (s.state === 'replied' || s.state === 'opted_out')))) : undefined;
  return { replies: waiting, summaries: kept };
}
