/**
 * The five intel export streams. Each fetches a fail-soft, keyset-paginated
 * batch from prisma and maps it to the per-record envelope. Returns the export
 * envelope `{ stream, items, nextCursor, watermark }`.
 *
 * Keyset pagination on `(occurred_at, id)`:
 *  - `since` (ISO, optional) is the low watermark applied to occurred_at.
 *  - `cursor` (opaque) is the last `(occurred_at, id)` returned; we apply the
 *    strict tuple comparison `(occurred_at, id) > (cursor)` via the standard
 *    seek predicate: occurred_at > c.occurred_at OR (occurred_at = c.occurred_at
 *    AND id > c.id).
 *  - results ascending by (occurred_at, id), capped at `limit`.
 *  - `watermark` = max occurred_at in the batch (or `since`/now when empty).
 *
 * For `email_events` the keyset anchor is the email_log row (sent_at, id): we
 * page over source rows and column-expand each into up to three events. This
 * keeps pagination stable on the source PK; clawd dedups on idempotency_key.
 */

import { prisma } from '@/lib/prisma';
import { decodeCursor, encodeCursor, type Cursor } from './cursor';
import {
  buildReplyRecord,
  expandEmailLog,
  buildMicrositeRecord,
  buildCaptureRecord,
  buildOutcomeRecord,
  type IntelRecord,
} from './records';

export const STREAMS = ['replies', 'email_events', 'engagements', 'captures', 'outcomes'] as const;
export type StreamName = (typeof STREAMS)[number];

export interface ExportEnvelope {
  stream: string;
  items: IntelRecord[];
  nextCursor: string | null;
  watermark: string;
}

export interface ExportArgs {
  stream: string;
  since?: string | null;
  cursor?: string | null;
  limit: number;
}

export const MAX_LIMIT = 500;
export const DEFAULT_LIMIT = 200;

export function clampLimit(raw: string | null | undefined): number {
  const n = raw == null ? DEFAULT_LIMIT : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

/** Parse `since` to a Date, or null if absent/malformed (-> from the beginning). */
function parseSince(since: string | null | undefined): Date | null {
  if (!since) return null;
  const ms = Date.parse(since);
  return Number.isNaN(ms) ? null : new Date(ms);
}

/** Build the `gt` keyset filter on (occurred_at, id) for a String-id table. */
function keysetWhereStringId(field: string, since: Date | null, c: Cursor | null) {
  const and: Record<string, unknown>[] = [];
  if (since) and.push({ [field]: { gte: since } });
  if (c) {
    const at = new Date(c.occurredAt);
    and.push({
      OR: [{ [field]: { gt: at } }, { AND: [{ [field]: at }, { id: { gt: c.id } }] }],
    });
  }
  return and.length ? { AND: and } : {};
}

/** Build the `gt` keyset filter on (occurred_at, id) for an Int-id table. */
function keysetWhereIntId(field: string, since: Date | null, c: Cursor | null, extra?: Record<string, unknown>) {
  const and: Record<string, unknown>[] = [];
  if (extra) and.push(extra);
  if (since) and.push({ [field]: { gte: since } });
  if (c) {
    const at = new Date(c.occurredAt);
    const cid = Number.parseInt(c.id, 10);
    const idCmp = Number.isNaN(cid) ? 0 : cid;
    and.push({
      OR: [{ [field]: { gt: at } }, { AND: [{ [field]: at }, { id: { gt: idCmp } }] }],
    });
  }
  return and.length ? { AND: and } : {};
}

function emptyEnvelope(stream: string, since: Date | null): ExportEnvelope {
  return {
    stream,
    items: [],
    nextCursor: null,
    watermark: (since ?? new Date()).toISOString(),
  };
}

/**
 * Finalize an envelope from the mapped records + their (occurred_at, id) keyset
 * anchors. nextCursor is set only when the source page was full (more may exist).
 */
function finalize(
  stream: string,
  items: IntelRecord[],
  anchors: Array<{ occurredAt: Date; id: string | number }>,
  pageWasFull: boolean,
  since: Date | null,
): ExportEnvelope {
  if (items.length === 0) return emptyEnvelope(stream, since);
  const last = anchors[anchors.length - 1];
  // watermark = max occurred_at across the returned records.
  let maxMs = 0;
  for (const r of items) {
    const ms = Date.parse(r.occurred_at);
    if (!Number.isNaN(ms) && ms > maxMs) maxMs = ms;
  }
  const watermark = maxMs > 0 ? new Date(maxMs).toISOString() : (since ?? new Date()).toISOString();
  return {
    stream,
    items,
    nextCursor: pageWasFull ? encodeCursor(last.occurredAt, last.id) : null,
    watermark,
  };
}

export async function exportStream(args: ExportArgs): Promise<ExportEnvelope> {
  const since = parseSince(args.since);
  const cursor = decodeCursor(args.cursor);
  const limit = args.limit;

  try {
    switch (args.stream) {
      case 'replies':
        return await exportReplies(since, cursor, limit);
      case 'email_events':
        return await exportEmailEvents(since, cursor, limit);
      case 'engagements':
        return await exportEngagements(since, cursor, limit);
      case 'captures':
        return await exportCaptures(since, cursor, limit);
      case 'outcomes':
        return await exportOutcomes(since, cursor, limit);
      default:
        // Unknown stream -> 200 empty envelope.
        return emptyEnvelope(args.stream, since);
    }
  } catch (err) {
    console.warn(`[intel-export] stream ${args.stream} failed, returning empty envelope:`, err);
    return emptyEnvelope(args.stream, since);
  }
}

/* ── stream 1: replies ────────────────────────────────────────────── */
async function exportReplies(since: Date | null, c: Cursor | null, limit: number): Promise<ExportEnvelope> {
  const rows = await prisma.inboundMessage.findMany({
    where: keysetWhereStringId('received_at', since, c),
    orderBy: [{ received_at: 'asc' }, { id: 'asc' }],
    take: limit,
    select: {
      id: true,
      received_at: true,
      from_email: true,
      from_name: true,
      subject: true,
      body_text: true,
      snippet: true,
      thread_id: true,
      thread: { select: { account_name: true, persona_email: true } },
    },
  });

  const items = rows.map(buildReplyRecord);
  const anchors = rows.map((r) => ({ occurredAt: r.received_at, id: r.id }));
  return finalize('replies', items, anchors, rows.length === limit, since);
}

/* ── stream 2: email_events ───────────────────────────────────────── */
async function exportEmailEvents(since: Date | null, c: Cursor | null, limit: number): Promise<ExportEnvelope> {
  // Anchor keyset on the email_log row (sent_at, id). Each row expands into
  // up to three events; clawd dedups on idempotency_key.
  const rows = await prisma.emailLog.findMany({
    where: keysetWhereIntId('sent_at', since, c),
    orderBy: [{ sent_at: 'asc' }, { id: 'asc' }],
    take: limit,
    select: {
      id: true,
      account_name: true,
      to_email: true,
      persona_name: true,
      campaign_tag: true,
      status: true,
      opened_at: true,
      clicked_at: true,
      delivered_at: true,
      bounce_type: true,
      metadata: true,
      sent_at: true,
    },
  });

  const items: IntelRecord[] = [];
  for (const r of rows) items.push(...expandEmailLog(r, r.sent_at));
  const anchors = rows.map((r) => ({ occurredAt: r.sent_at, id: r.id }));
  return finalize('email_events', items, anchors, rows.length === limit, since);
}

/* ── stream 3: engagements ────────────────────────────────────────── */
async function exportEngagements(since: Date | null, c: Cursor | null, limit: number): Promise<ExportEnvelope> {
  const rows = await prisma.micrositeEngagement.findMany({
    where: keysetWhereStringId('updated_at', since, c),
    orderBy: [{ updated_at: 'asc' }, { id: 'asc' }],
    take: limit,
    select: {
      id: true,
      session_id: true,
      account_name: true,
      account_slug: true,
      person_name: true,
      person_slug: true,
      path: true,
      sections_viewed: true,
      cta_ids: true,
      variant_history: true,
      scroll_depth_pct: true,
      duration_seconds: true,
      metadata: true,
      updated_at: true,
    },
  });

  const items = rows.map(buildMicrositeRecord);
  const anchors = rows.map((r) => ({ occurredAt: r.updated_at, id: r.id }));
  return finalize('engagements', items, anchors, rows.length === limit, since);
}

/* ── stream 4: captures ───────────────────────────────────────────── */
async function exportCaptures(since: Date | null, c: Cursor | null, limit: number): Promise<ExportEnvelope> {
  const rows = await prisma.mobileCapture.findMany({
    where: keysetWhereIntId('created_at', since, c),
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    take: limit,
    select: {
      id: true,
      created_at: true,
      account_name: true,
      persona_name: true,
      intent: true,
      channel: true,
      notes: true,
      interest: true,
      urgency: true,
      influence: true,
      fit: true,
      heat_score: true,
    },
  });

  const items = rows.map(buildCaptureRecord);
  const anchors = rows.map((r) => ({ occurredAt: r.created_at, id: r.id }));
  return finalize('captures', items, anchors, rows.length === limit, since);
}

/* ── stream 5: outcomes ───────────────────────────────────────────── */
async function exportOutcomes(since: Date | null, c: Cursor | null, limit: number): Promise<ExportEnvelope> {
  const rows = await prisma.operatorOutcome.findMany({
    where: keysetWhereStringId('created_at', since, c),
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    take: limit,
    select: {
      id: true,
      created_at: true,
      account_name: true,
      outcome_label: true,
      source_kind: true,
      source_id: true,
      created_by: true,
    },
  });

  const items = rows.map(buildOutcomeRecord);
  const anchors = rows.map((r) => ({ occurredAt: r.created_at, id: r.id }));
  return finalize('outcomes', items, anchors, rows.length === limit, since);
}
