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
 * A message counts as GAP backlog only when it can be tied to actual GAP
 * execution -- otherwise this metric silently classifies Casey's whole
 * inbox as GAP work. The attribution predicates (D1 dogfood hardening):
 *
 *   1. Its from_email matches a SequenceEnrollment.to_email (a GAP send
 *      actually reached this address) for gmail-sourced rows.
 *   2. Its hubspot_engagement_id is one GAP has mirrored back to HubSpot
 *      (gap_hubspot_mirror) for hubspot-sourced rows.
 *
 * A message that already has a ConversationDisposition is, separately,
 * excluded from the count regardless of attribution (it was reconciled,
 * not dropped) -- that check is unchanged from before this fix.
 */
async function loadGapAttributedEmails(prisma: any): Promise<Set<string>> {
  const enrollments: Array<{ to_email: string }> = await prisma.sequenceEnrollment.findMany({
    select: { to_email: true },
    distinct: ['to_email'],
  });
  return new Set(enrollments.map((e) => e.to_email.toLowerCase()));
}

async function loadGapMirroredEngagementIds(prisma: any): Promise<Set<string>> {
  const mirrors: Array<{ object_id: string }> = await prisma.gapHubSpotMirror.findMany({
    where: { object_type: 'engagement' },
    select: { object_id: true },
  });
  return new Set(mirrors.map((m) => m.object_id));
}

/**
 * Prisma glue: loads every InboundMessage in the last `windowDays` (default
 * 90, matching the learning report's other lookback conventions), keeps only
 * the ones attributable to GAP execution, and loads the disposition-existence
 * set for them, then computes the backlog.
 */
export async function loadReplyBacklog(
  prisma: any,
  now: Date,
  opts: { thresholdHours?: number; windowDays?: number } = {},
): Promise<ReplyBacklog> {
  const thresholdHours = opts.thresholdHours ?? DEFAULT_BACKLOG_THRESHOLD_HOURS;
  const windowDays = opts.windowDays ?? 90;
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const allMessages: Array<{
    id: string;
    received_at: Date;
    from_email: string;
    source: string;
    hubspot_engagement_id: string | null;
  }> = await prisma.inboundMessage.findMany({
    where: { received_at: { gte: since } },
    select: { id: true, received_at: true, from_email: true, source: true, hubspot_engagement_id: true },
  });
  if (allMessages.length === 0) return computeReplyBacklog([], new Set(), now, thresholdHours);

  const [gapEmails, gapEngagementIds] = await Promise.all([
    loadGapAttributedEmails(prisma),
    loadGapMirroredEngagementIds(prisma),
  ]);

  const messages = allMessages.filter((m) =>
    m.source === 'hubspot'
      ? m.hubspot_engagement_id !== null && gapEngagementIds.has(m.hubspot_engagement_id)
      : gapEmails.has(m.from_email.toLowerCase()),
  );
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
