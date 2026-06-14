/**
 * Per-record envelope + stable idempotency-key builders + the email_logs
 * column-expansion, for the intel export streams. Pure functions over already
 * fetched rows (no prisma here) so they unit-test cleanly.
 *
 * Idempotency keys (exact, per the contract — get these stable and re-pulls
 * never double-count):
 *   replies        reply:inmsg_<id>
 *   email_events   open:emlog_<id> | click:emlog_<id> | bounce:emlog_<id>
 *   engagements    ms:<session_id>
 *   captures       cap:<id>
 *   outcomes       out:<id>
 */

import { deriveAccountDomain } from './domain';

/** The envelope every record carries, plus the stream-specific payload fields. */
export interface IntelRecord {
  idempotency_key: string;
  occurred_at: string; // ISO8601
  account_name?: string;
  account_domain?: string;
  person_email?: string;
  person_name?: string;
  [payload: string]: unknown;
}

function iso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

/** Trim a body/snippet to a max length without throwing on null. */
export function snippet(text: string | null | undefined, max = 280): string | undefined {
  if (!text) return undefined;
  const t = text.trim();
  if (!t) return undefined;
  return t.length > max ? t.slice(0, max) : t;
}

/**
 * Build the common envelope. account_name always present (when known);
 * account_domain derived from the person email when corporate (omitted for free
 * domains). Undefined fields are dropped so the JSON stays clean.
 */
function envelope(args: {
  idempotency_key: string;
  occurred_at: Date | string;
  account_name?: string | null;
  person_email?: string | null;
  person_name?: string | null;
}): IntelRecord {
  const rec: IntelRecord = {
    idempotency_key: args.idempotency_key,
    occurred_at: iso(args.occurred_at),
  };
  if (args.account_name) rec.account_name = args.account_name;
  const domain = deriveAccountDomain(args.person_email);
  if (domain) rec.account_domain = domain;
  if (args.person_email) rec.person_email = args.person_email;
  if (args.person_name) rec.person_name = args.person_name;
  return rec;
}

/* ── idempotency keys ─────────────────────────────────────────────── */
export const replyKey = (id: string) => `reply:inmsg_${id}`;
export const openKey = (id: number | string) => `open:emlog_${id}`;
export const clickKey = (id: number | string) => `click:emlog_${id}`;
export const bounceKey = (id: number | string) => `bounce:emlog_${id}`;
export const micrositeKey = (sessionId: string) => `ms:${sessionId}`;
export const captureKey = (id: number | string) => `cap:${id}`;
export const outcomeKey = (id: string) => `out:${id}`;

/* ── stream 1: replies ────────────────────────────────────────────── */
export interface ReplyRow {
  id: string;
  received_at: Date;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  body_text: string | null;
  snippet: string | null;
  thread_id: string;
  thread: { account_name: string | null; persona_email: string | null } | null;
}

export function buildReplyRecord(row: ReplyRow): IntelRecord {
  const rec = envelope({
    idempotency_key: replyKey(row.id),
    occurred_at: row.received_at,
    account_name: row.thread?.account_name ?? null,
    person_email: row.from_email,
    person_name: row.from_name,
  });
  if (row.subject) rec.subject = row.subject;
  const snip = snippet(row.snippet ?? row.body_text, 280);
  if (snip) rec.snippet = snip;
  rec.thread_id = row.thread_id;
  // intent is intentionally omitted: modex has no classification column, so
  // clawd classifies. (Contract §1.)
  return rec;
}

/* ── stream 2: email_events (column expansion) ────────────────────── */
export interface EmailLogRow {
  id: number;
  account_name: string;
  to_email: string;
  persona_name: string | null;
  campaign_tag: string | null;
  status: string;
  opened_at: Date | null;
  clicked_at: Date | null;
  delivered_at: Date | null;
  bounce_type: string | null;
  metadata: unknown;
}

/**
 * Expand one email_log row into the discrete events whose timestamp column is
 * set: open (opened_at), click (clicked_at), bounce. Replies are NOT emitted
 * here — stream 1 owns them, to avoid double-count.
 *
 * Bounce timing: email_logs has no `bounced_at` column. A bounce is recorded as
 * status='bounced' (+ a bounce_type). We use delivered_at when present as the
 * bounce timestamp (a bounce is a terminal delivery event), else the row's
 * occurred-at fallback passed by the caller (sent_at). bounce_type defaults to
 * the column value, normalized to hard|soft.
 */
export function expandEmailLog(row: EmailLogRow, fallbackOccurredAt: Date): IntelRecord[] {
  const out: IntelRecord[] = [];

  if (row.opened_at) {
    const rec = envelope({
      idempotency_key: openKey(row.id),
      occurred_at: row.opened_at,
      account_name: row.account_name,
      person_email: row.to_email,
      person_name: row.persona_name,
    });
    rec.event_type = 'open';
    if (row.campaign_tag) rec.campaign_tag = row.campaign_tag;
    out.push(rec);
  }

  if (row.clicked_at) {
    const rec = envelope({
      idempotency_key: clickKey(row.id),
      occurred_at: row.clicked_at,
      account_name: row.account_name,
      person_email: row.to_email,
      person_name: row.persona_name,
    });
    rec.event_type = 'click';
    if (row.campaign_tag) rec.campaign_tag = row.campaign_tag;
    const dest = destinationUrl(row.metadata);
    if (dest) rec.destination_url = dest;
    out.push(rec);
  }

  const isBounce = row.status === 'bounced' || !!row.bounce_type;
  if (isBounce) {
    const at = row.delivered_at ?? fallbackOccurredAt;
    const rec = envelope({
      idempotency_key: bounceKey(row.id),
      occurred_at: at,
      account_name: row.account_name,
      person_email: row.to_email,
      person_name: row.persona_name,
    });
    rec.event_type = 'bounce';
    if (row.campaign_tag) rec.campaign_tag = row.campaign_tag;
    rec.bounce_type = normalizeBounceType(row.bounce_type);
    out.push(rec);
  }

  return out;
}

function normalizeBounceType(bt: string | null): 'hard' | 'soft' {
  return (bt || '').toLowerCase() === 'soft' ? 'soft' : 'hard';
}

function destinationUrl(metadata: unknown): string | undefined {
  if (metadata && typeof metadata === 'object') {
    const m = metadata as Record<string, unknown>;
    const candidate = m.destination_url ?? m.clicked_url ?? m.url;
    if (typeof candidate === 'string' && candidate) return candidate;
  }
  return undefined;
}

/* ── stream 3: engagements ────────────────────────────────────────── */
export interface MicrositeRow {
  id: string;
  session_id: string;
  account_name: string;
  account_slug: string;
  person_name: string | null;
  person_slug: string | null;
  path: string;
  sections_viewed: string[];
  cta_ids: string[];
  variant_history: string[];
  scroll_depth_pct: number;
  duration_seconds: number;
  metadata: unknown;
  updated_at: Date;
}

/** demo|for|compare from the path; defaults to 'demo'. */
function surfaceFromPath(path: string): string {
  const p = (path || '').toLowerCase();
  if (p.startsWith('/for')) return 'for';
  if (p.includes('compare')) return 'compare';
  return 'demo';
}

function metaNumber(metadata: unknown, key: string): number | undefined {
  if (metadata && typeof metadata === 'object') {
    const v = (metadata as Record<string, unknown>)[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return undefined;
}

function metaString(metadata: unknown, key: string): string | undefined {
  if (metadata && typeof metadata === 'object') {
    const v = (metadata as Record<string, unknown>)[key];
    if (typeof v === 'string' && v) return v;
  }
  return undefined;
}

export function buildMicrositeRecord(row: MicrositeRow): IntelRecord {
  const personEmail = metaString(row.metadata, 'person_email') ?? null;
  const rec = envelope({
    idempotency_key: micrositeKey(row.session_id),
    occurred_at: row.updated_at,
    account_name: row.account_name,
    person_email: personEmail,
    person_name: row.person_name,
  });
  if (row.person_slug) rec.person_slug = row.person_slug;
  rec.surface = surfaceFromPath(row.path);
  rec.path = row.path;
  rec.sections_viewed = row.sections_viewed.length;
  rec.cta_ids = row.cta_ids;
  rec.variant_history = row.variant_history;
  rec.scroll_depth_pct = row.scroll_depth_pct;
  rec.duration_seconds = row.duration_seconds;
  rec.audio_progress_pct = metaNumber(row.metadata, 'audio_progress_pct') ?? 0;
  rec.video_progress_pct = metaNumber(row.metadata, 'video_progress_pct') ?? 0;
  rec.traffic_quality = metaString(row.metadata, 'traffic_quality') ?? 'human';
  const intent = metaNumber(row.metadata, 'intent_score');
  if (intent !== undefined) rec.intent_score = intent;
  return rec;
}

/* ── stream 4: captures ───────────────────────────────────────────── */
export interface CaptureRow {
  id: number;
  created_at: Date;
  account_name: string;
  persona_name: string | null;
  intent: string | null;
  channel: string | null;
  notes: string | null;
  interest: number;
  urgency: number;
  influence: number;
  fit: number;
  heat_score: number;
}

export function buildCaptureRecord(row: CaptureRow): IntelRecord {
  // mobile_captures has no email column; account/person resolve by name.
  const rec = envelope({
    idempotency_key: captureKey(row.id),
    occurred_at: row.created_at,
    account_name: row.account_name,
    person_name: row.persona_name,
  });
  rec.interest = row.interest;
  rec.urgency = row.urgency;
  rec.influence = row.influence;
  rec.fit = row.fit;
  rec.heat_score = row.heat_score;
  if (row.intent) rec.intent = row.intent;
  if (row.channel) rec.channel = row.channel;
  const snip = snippet(row.notes, 280);
  if (snip) rec.notes = snip;
  return rec;
}

/* ── stream 5: outcomes ───────────────────────────────────────────── */
export interface OutcomeRow {
  id: string;
  created_at: Date;
  account_name: string;
  outcome_label: string;
  source_kind: string;
  source_id: string;
  created_by: string | null;
}

export function buildOutcomeRecord(row: OutcomeRow): IntelRecord {
  // operator_outcomes has no email column; account resolves by name.
  const rec = envelope({
    idempotency_key: outcomeKey(row.id),
    occurred_at: row.created_at,
    account_name: row.account_name,
  });
  rec.outcome_label = row.outcome_label;
  rec.source_kind = row.source_kind;
  rec.source_id = row.source_id;
  if (row.created_by) rec.created_by = row.created_by;
  return rec;
}
