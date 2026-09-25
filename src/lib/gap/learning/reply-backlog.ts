/**
 * GAP Prospecting OS, Sprint 6E: the reply backlog metric.
 *
 * "Nothing here is silently dropped" (spec 6E) needs a number ops can watch:
 * how many inbound replies (Gmail or HubSpot -- InboundMessage.source
 * already unifies both, Sprint 4) have NO ConversationDisposition yet
 * (source_kind IN ('inbound_message','hubspot_engagement'), same predicate
 * disposition/service.ts's own idempotency check uses) and are older than
 * the threshold. A reply that got an AI suggestion but no human confirmation
 * still counts as backlog: `human_confirmed=false` classes as unprocessed by
 * design (the AI suggestion has NO EFFECTS -- it is not "handled" until a
 * human session confirms it, and this metric exists precisely to surface
 * that gap so it never becomes silent).
 */

export interface ReplyBacklogRow {
  id: string;
  receivedAt: Date;
}

export interface ReplyBacklog {
  count: number;
  /** Age of the single oldest unprocessed reply, in hours. Null when count is 0. */
  oldestAgeHours: number | null;
  thresholdHours: number;
}

/**
 * Pure: `rows` is every InboundMessage in the caller's window; `dispositioned`
 * is the set of InboundMessage ids that already have a disposition (from
 * either source_kind). A row in `dispositioned` never counts as backlog,
 * regardless of age -- it was NOT silently dropped, it was handled.
 */
export function computeReplyBacklog(
  rows: readonly ReplyBacklogRow[],
  dispositioned: ReadonlySet<string>,
  now: Date,
  thresholdHours: number,
): ReplyBacklog {
  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  const unprocessed = rows.filter((r) => !dispositioned.has(r.id) && now.getTime() - r.receivedAt.getTime() >= thresholdMs);
  if (unprocessed.length === 0) {
    return { count: 0, oldestAgeHours: null, thresholdHours };
  }
  const oldest = unprocessed.reduce((a, b) => (a.receivedAt.getTime() < b.receivedAt.getTime() ? a : b));
  const oldestAgeHours = Math.round(((now.getTime() - oldest.receivedAt.getTime()) / (60 * 60 * 1000)) * 10) / 10;
  return { count: unprocessed.length, oldestAgeHours, thresholdHours };
}

/** Default: a reply sitting unconfirmed for a full business day is backlog. */
export const DEFAULT_BACKLOG_THRESHOLD_HOURS = 24;

/**
 * Prisma glue: loads every InboundMessage in the last `windowDays` (default
 * 90, matching the learning report's other lookback conventions) and the
 * disposition-existence set for them, then computes the backlog.
 */
export async function loadReplyBacklog(
  prisma: any,
  now: Date,
  opts: { thresholdHours?: number; windowDays?: number } = {},
): Promise<ReplyBacklog> {
  const thresholdHours = opts.thresholdHours ?? DEFAULT_BACKLOG_THRESHOLD_HOURS;
  const windowDays = opts.windowDays ?? 90;
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const messages: Array<{ id: string; received_at: Date }> = await prisma.inboundMessage.findMany({
    where: { received_at: { gte: since } },
    select: { id: true, received_at: true },
  });
  if (messages.length === 0) return computeReplyBacklog([], new Set(), now, thresholdHours);

  const ids = messages.map((m) => m.id);
  const dispositions: Array<{ source_id: string }> = await prisma.conversationDisposition.findMany({
    where: { source_kind: { in: ['inbound_message', 'hubspot_engagement'] }, source_id: { in: ids } },
    select: { source_id: true },
  });
  const dispositioned = new Set(dispositions.map((d) => d.source_id));

  return computeReplyBacklog(
    messages.map((m) => ({ id: m.id, receivedAt: m.received_at })),
    dispositioned,
    now,
    thresholdHours,
  );
}
