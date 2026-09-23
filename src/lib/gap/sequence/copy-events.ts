/**
 * S3-T3: per-person copy events (spec sections 4.5 and 5.3).
 *
 * HubSpot templates read `{{ contact.yf_top100_stepN_body }}` at send time,
 * so the copy a prospect actually received at step N is the newest push into
 * that property BEFORE the step's send. `SequenceCopyEvent` is the append-only
 * ledger of those pushes (journal import today, gap_push later). Everything
 * here is pure except `recordCopyEvents`, the one prisma glue.
 *
 * - `copyAt` picks the newest event at or before a moment for one step/field.
 * - `reconstructRenderedSteps` builds `rendered_steps` as of `enrolled_at`.
 * - `renderedStepsHash` hashes the copy only (not the event ids), so the same
 *   copy imported twice hashes the same.
 * - `detectCopyDrift` names events after `enrolled_at` that touch a step not
 *   yet sent: the rig writes HubSpot directly, so drift is surfaced, not
 *   blocked (the caller posts `copy_drift` to the review feed).
 *
 * Voice: no em dashes.
 */
import { hash } from 'node:crypto';

import { canonicalJson } from '@/lib/gap/sequence/steps';

export const COPY_FIELDS = ['subject', 'body'] as const;
export type CopyField = (typeof COPY_FIELDS)[number];

export const COPY_EVENT_SOURCES = ['journal_import', 'gap_push'] as const;
export type CopyEventSource = (typeof COPY_EVENT_SOURCES)[number];

/** The lane's property naming: yf_top100_step<N>_<field>, N one-based. */
export const COPY_PROPERTY_PREFIX = 'yf_top100_step';
const PROPERTY_RE = /^yf_top100_step(\d+)_(subject|body)$/;

export interface CopyEvent {
  id?: string;
  hubspotContactId: string;
  accountKey: string;
  property: string;
  stepIndex: number;
  field: CopyField;
  oldValue: string | null;
  newValue: string;
  ts: Date;
  evidence?: string | null;
  revision?: string | null;
  readback?: unknown;
  result?: string | null;
  pushedBy?: string | null;
  source: CopyEventSource;
}

export type ParsedProperty = { ok: true; stepIndex: number; field: CopyField } | { ok: false; reason: 'bad_property' };

/** `yf_top100_step3_body` -> step index 2 (zero-based), field body. Anything else is `bad_property`. */
export function parsePropertyName(property: string): ParsedProperty {
  const m = PROPERTY_RE.exec(property ?? '');
  if (!m) return { ok: false, reason: 'bad_property' };
  const n = Number(m[1]);
  if (!Number.isInteger(n) || n < 1) return { ok: false, reason: 'bad_property' };
  return { ok: true, stepIndex: n - 1, field: m[2] as CopyField };
}

/** The property name for a zero-based step index and field. */
export function copyPropertyName(stepIndex: number, field: CopyField): string {
  return `${COPY_PROPERTY_PREFIX}${stepIndex + 1}_${field}`;
}

function time(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/**
 * The newest event with ts <= `at` for one step and field, else null. The
 * event list is expected to belong to one contact; pass `hubspotContactId`
 * to filter a mixed list. Equal timestamps: the later array entry wins.
 */
export function copyAt(
  events: readonly CopyEvent[],
  stepIndex: number,
  field: CopyField,
  at: Date,
  hubspotContactId?: string,
): CopyEvent | null {
  const limit = at.getTime();
  let best: CopyEvent | null = null;
  for (const e of events) {
    if (e.stepIndex !== stepIndex || e.field !== field) continue;
    if (hubspotContactId !== undefined && e.hubspotContactId !== hubspotContactId) continue;
    const t = time(e.ts);
    if (t > limit) continue;
    if (best === null || t >= time(best.ts)) best = e;
  }
  return best;
}

export interface RenderedStep {
  stepIndex: number;
  subject: string | null;
  body: string | null;
  copyEventIds: string[];
}

/** `rendered_steps` at `at`: one entry per step index 0..stepCount-1, null where no copy had been pushed yet. */
export function reconstructRenderedSteps(
  events: readonly CopyEvent[],
  at: Date,
  stepCount: number,
  hubspotContactId?: string,
): RenderedStep[] {
  const out: RenderedStep[] = [];
  for (let i = 0; i < stepCount; i += 1) {
    const subject = copyAt(events, i, 'subject', at, hubspotContactId);
    const body = copyAt(events, i, 'body', at, hubspotContactId);
    const ids = [subject?.id, body?.id].filter((id): id is string => typeof id === 'string' && id !== '');
    out.push({ stepIndex: i, subject: subject?.newValue ?? null, body: body?.newValue ?? null, copyEventIds: ids });
  }
  return out;
}

/** sha256 hex over the canonical JSON of {stepIndex, subject, body} per step. Event ids are excluded on purpose. */
export function renderedStepsHash(rendered: readonly RenderedStep[]): string {
  const copyOnly = rendered.map((r) => ({ stepIndex: r.stepIndex, subject: r.subject, body: r.body }));
  return hash('sha256', canonicalJson(copyOnly), 'hex');
}

export interface CopyDriftFinding {
  stepIndex: number;
  field: CopyField;
  eventId: string | null;
  ts: Date;
}

/**
 * Events strictly after `enrolledAt` on a step index NOT in `sentSteps`:
 * the prospect will receive copy the enrollment did not pin. A change to an
 * already-sent step is history, not drift. Sorted by ts ascending.
 */
export function detectCopyDrift(
  events: readonly CopyEvent[],
  enrolledAt: Date,
  sentSteps: readonly number[],
): CopyDriftFinding[] {
  const sent = new Set(sentSteps);
  const since = enrolledAt.getTime();
  const findings: CopyDriftFinding[] = [];
  for (const e of events) {
    if (time(e.ts) <= since) continue;
    if (sent.has(e.stepIndex)) continue;
    findings.push({ stepIndex: e.stepIndex, field: e.field, eventId: e.id ?? null, ts: new Date(time(e.ts)) });
  }
  return findings.sort((a, b) => a.ts.getTime() - b.ts.getTime());
}

// ---------------------------------------------------------------------------
// Glue
// ---------------------------------------------------------------------------

export interface RecordCopyEventsOptions {
  dryRun: boolean;
}

export type RecordCopyEventsResult =
  | { ok: true; created: number; skipped: number; planned: number; dryRun: boolean }
  | { ok: false; reason: `bad_event:${number}:${string}` };

/**
 * Append events with createMany + skipDuplicates on the unique
 * (hubspot_contact_id, property, ts), so a re-import is idempotent. Every
 * event's property must parse and agree with its stepIndex and field, and its
 * source must be in the list; the first bad event refuses the whole batch
 * before any write. Dry run: nothing is written, `planned` says how many.
 */
export async function recordCopyEvents(
  prisma: any,
  events: readonly CopyEvent[],
  opts: RecordCopyEventsOptions,
): Promise<RecordCopyEventsResult> {
  for (let i = 0; i < events.length; i += 1) {
    const e = events[i];
    const parsed = parsePropertyName(e.property);
    if (!parsed.ok) return { ok: false, reason: `bad_event:${i}:bad_property` };
    if (parsed.stepIndex !== e.stepIndex || parsed.field !== e.field) return { ok: false, reason: `bad_event:${i}:property_mismatch` };
    if (!(COPY_EVENT_SOURCES as readonly string[]).includes(e.source)) return { ok: false, reason: `bad_event:${i}:bad_source` };
    if (typeof e.newValue !== 'string') return { ok: false, reason: `bad_event:${i}:no_new_value` };
  }

  if (opts.dryRun) return { ok: true, created: 0, skipped: 0, planned: events.length, dryRun: true };
  if (events.length === 0) return { ok: true, created: 0, skipped: 0, planned: 0, dryRun: false };

  const r = await prisma.sequenceCopyEvent.createMany({
    data: events.map((e) => ({
      ...(e.id ? { id: e.id } : {}),
      hubspot_contact_id: e.hubspotContactId,
      account_key: e.accountKey,
      property: e.property,
      step_index: e.stepIndex,
      field: e.field,
      old_value: e.oldValue ?? null,
      new_value: e.newValue,
      ts: e.ts,
      evidence: e.evidence ?? null,
      revision: e.revision ?? null,
      readback: e.readback ?? null,
      result: e.result ?? null,
      pushed_by: e.pushedBy ?? null,
      source: e.source,
    })),
    skipDuplicates: true,
  });
  const created = typeof r?.count === 'number' ? r.count : 0;
  return { ok: true, created, skipped: events.length - created, planned: events.length, dryRun: false };
}
