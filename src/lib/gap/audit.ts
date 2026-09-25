/**
 * GAP audit events.
 *
 * Two ledgers, both append-only:
 *
 *  - `hypothesisEvent`: the per-hypothesis state-transition log, written inside
 *    the same transaction as the transition (pass the tx client).
 *  - `gapAuditEvent`: the cross-cutting audit trail for everything else
 *    (routing runs, approvals, enrollments, flag refusals, copy drift). The
 *    table may not exist yet in Sprint 1, so `audit()` probes for the delegate
 *    and skips the write, reporting `stored:false`, when it is absent.
 *
 * `audit()` also fans out to the war-room review feed (./review-feed.ts) when
 * the caller supplies a `review` block. That post is fire-and-forget: it is
 * never awaited past a microtask and every failure is swallowed, because the
 * feed is the operator's veto surface, not a gate on the state change.
 *
 * Both entry points follow the house `prisma: any` glue convention from
 * src/lib/queue/sequence-runtime.ts and never throw.
 */

import { postReviewLog, type ReviewLogEntry } from './review-feed';

export type GapAuditKind =
  | 'hypothesis.submitted'
  | 'hypothesis.review_rejected'
  | 'hypothesis.approved'
  | 'hypothesis.activated'
  | 'hypothesis.resolved'
  | 'hypothesis.closed_unresolved'
  | 'hypothesis.expired'
  | 'hypothesis.withdrawn'
  | 'signal.registered'
  | 'identity.conflict'
  | 'identity.alias_conflict'
  | 'automation.kill_switch_drill'
  | 'routing.run'
  | 'decision.human_action'
  | 'compile.result'
  | 'approval.requested'
  | 'approval.resolved'
  | 'disposition.recorded'
  | 'disposition.effects'
  | 'disposition.referral'
  | 'disposition.retarget'
  | 'bid.captured'
  | 'bid.confirmed'
  | 'reply.ingested'
  | 'reply.suggested'
  | 'reply.suggest_rejected'
  | 'enroll.shadow'
  | 'enroll.live'
  | 'enroll.row_emitted'
  | 'enroll.refused'
  | 'flag.refused'
  | 'copy_drift'
  | 'sequence.materialized'
  | 'schedule.unrendered_placeholder'
  | 'schedule.compile_not_passed'
  | 'schedule.skipped'
  | 'execution.gmail_drafted'
  | 'execution.gmail_draft_refused'
  | 'execution.gmail_draft_sent'
  | 'execution.gmail_draft_discarded';

export interface HypothesisEventInput {
  hypothesisId: string;
  fromStatus: string | null;
  toStatus: string;
  action: string;
  actor: string;
  reason?: string | null;
  payload?: Record<string, unknown> | null;
}

/**
 * Append one row to the hypothesis transition log. Writes through `tx` when
 * given so the event lands or rolls back with the transition it describes.
 * Returns the created row id.
 */
export async function recordHypothesisEvent(
  prisma: any,
  tx: any | null,
  input: HypothesisEventInput,
): Promise<string> {
  const client = tx ?? prisma;
  const created = await client.hypothesisEvent.create({
    data: {
      hypothesis_id: input.hypothesisId,
      from_status: input.fromStatus,
      to_status: input.toStatus,
      action: input.action,
      actor: input.actor,
      reason: input.reason ?? null,
      payload: input.payload ?? null,
    },
    select: { id: true },
  });
  return created.id;
}

export interface AuditReviewBlock {
  target: string;
  title: string;
  intent: string;
  url?: string;
  rollbackRef?: string;
}

export interface AuditInput {
  kind: GapAuditKind;
  actor: string;
  subjectType: string;
  subjectId: string;
  payload?: Record<string, unknown>;
  review?: AuditReviewBlock;
}

export interface AuditOptions {
  postReview?: typeof postReviewLog;
}

export interface AuditResult {
  stored: boolean;
  reviewQueued: boolean;
}

/**
 * Record a GAP audit event and, when `review` is given, fan it out to the
 * war-room review feed. Never throws: a missing table, a failed insert, or a
 * failed post each degrade to a flag in the result instead of an error.
 */
export async function audit(
  prisma: any,
  input: AuditInput,
  opts: AuditOptions = {},
): Promise<AuditResult> {
  let stored = false;
  const delegate = prisma?.gapAuditEvent;
  if (delegate && typeof delegate.create === 'function') {
    try {
      await delegate.create({
        data: {
          kind: input.kind,
          actor: input.actor,
          subject_type: input.subjectType,
          subject_id: input.subjectId,
          payload: input.payload ?? {},
        },
        select: { id: true },
      });
      stored = true;
    } catch {
      stored = false;
    }
  }

  let reviewQueued = false;
  if (input.review) {
    const post = opts.postReview ?? postReviewLog;
    const entry: ReviewLogEntry = {
      motion: 'gap',
      action: input.kind,
      target: input.review.target,
      title: input.review.title,
      intent: input.review.intent,
    };
    if (input.review.url !== undefined) entry.url = input.review.url;
    if (input.review.rollbackRef !== undefined) entry.rollbackRef = input.review.rollbackRef;
    try {
      // Fire-and-forget: hand the promise off and swallow its rejection.
      void Promise.resolve()
        .then(() => post(entry))
        .catch(() => undefined);
    } catch {
      // A synchronous throw from a bad delegate must not surface either.
    }
    reviewQueued = true;
  }

  return { stored, reviewQueued };
}
