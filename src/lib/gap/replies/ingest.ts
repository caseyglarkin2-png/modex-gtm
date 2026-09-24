/**
 * S4-T4: reply ingestion. An inbound HUMAN reply from an enrolled address
 * pauses the enrollment and stops its unsent items right now, instead of
 * waiting for the lazy reply-pause in send-deps.ts (which only refuses at the
 * NEXT send attempt). Called by the two inbound writers after they have
 * created the InboundMessage and after the reply-precision gate:
 *
 *   - /api/cron/check-inbox (Gmail replies, `source: 'gmail'`)
 *   - src/lib/gap/replies/hubspot-poller.ts (HubSpot INCOMING_EMAIL
 *     engagements, `source: 'hubspot'`)
 *
 * Effects, per live enrollment on the lowercased address (spec 5.2, section 7):
 *   modex_draft_queue -> `pause` through the enrollment service (status
 *     `paused`, `stop_reason` stays null until a disposition decides), then
 *     `stopRunsForRecipient(email, 'replied')` marks the unsent items skipped
 *     with `sequence_stopped:replied`. Never a delete.
 *   every other engine (hubspot_native, manual) -> `stop(id, 'replied')`
 *     through the enrollment service, which moves the row to `stop_pending`
 *     with `stop_requested_at` and posts the review-feed line naming the
 *     contact and sequence; the sync cron's `confirmStop` closes it.
 *
 * `reply_pending` marker: the schema has no `paused_reason` column, so the
 * marker lands in `external_state` (JSON, null for every modex row because
 * only HubSpot readbacks write it) as `{ reply_pending: {...} }`. It is
 * written only on modex rows that this call paused; hubspot_native rows keep
 * their readback untouched and carry the reply in `stop_reason: 'replied'`.
 *
 * Guards, in order:
 *   1. GAP_OS_ENABLED off -> `{ action: 'none', reason: 'gap_disabled' }`
 *      with ZERO prisma reads (the flag-off call shape of both writers is
 *      byte identical to today; the tests hand this function a throwing
 *      proxy to prove it).
 *   2. `isAutoresponder` -> `reason: 'autoresponder'`, zero reads, zero
 *      writes. The verdict is the caller's reply-precision result; an
 *      out-of-office can never pause a sequence.
 *   3. blank address -> `reason: 'blank_email'`.
 *   4. no live enrollment -> `reason: 'not_enrolled'`; live rows but none
 *      active (a second call for the same inbound, or a disposition already
 *      moved them) -> `reason: 'already_paused'`. Both write nothing, so
 *      the call is idempotent per inbound id.
 *
 * Audit: one `reply.ingested` event when anything was paused or stop-requested,
 * carrying the enrollment ids, the engines and the item count.
 *
 * Voice: no em dashes.
 */

import { audit } from '@/lib/gap/audit';
import { isGapOsEnabled } from '@/lib/gap/flags';
import { pause, stop } from '@/lib/gap/sequence/enrollment';
import { LIVE_ENROLLMENT_STATUSES } from '@/lib/gap/sequence/family';
import { stopRunsForRecipient } from '@/lib/queue/sequence-runtime';

export const REPLY_STOP_REASON = 'replied' as const;
export const REPLY_PENDING_MARKER = 'reply_pending' as const;
export const INGEST_ACTOR = 'ingest' as const;
export const MODEX_ENGINE = 'modex_draft_queue' as const;

export type ReplySource = 'gmail' | 'hubspot';

export interface IngestReplyInput {
  contactEmail: string;
  source: ReplySource;
  /** InboundMessage.id: the Gmail message id, or `hs:<engagement id>`. */
  inboundMessageId: string;
  hubspotContactId?: string | null;
  receivedAt: Date;
  /** The reply-precision verdict, inverted: true when the gate rejected it. */
  isAutoresponder: boolean;
  now: Date;
}

export type IngestNoneReason = 'gap_disabled' | 'autoresponder' | 'blank_email' | 'not_enrolled' | 'already_paused';

export interface IngestEnrollmentEffect {
  id: string;
  engine: string;
  previous: string;
  next: string;
}

export interface IngestRefusal {
  id: string;
  engine: string;
  reason: string;
}

export interface IngestReplyResult {
  ok: true;
  action: 'none' | 'paused';
  enrollments: IngestEnrollmentEffect[];
  /** Unsent modex items marked skipped by stopRunsForRecipient. */
  itemsStopped: number;
  reason?: IngestNoneReason;
  /** Enrollment-service refusals (a status race, a terminal row). Never thrown. */
  refusals?: IngestRefusal[];
}

interface LiveEnrollmentRow {
  id: string;
  engine: string;
  status: string;
}

function none(reason: IngestNoneReason): IngestReplyResult {
  return { ok: true, action: 'none', enrollments: [], itemsStopped: 0, reason };
}

export function normalizeReplyEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

/** The marker written into `external_state` on a modex row this call paused. */
export function replyPendingMarker(input: IngestReplyInput): Record<string, unknown> {
  return {
    [REPLY_PENDING_MARKER]: {
      source: input.source,
      inbound_message_id: input.inboundMessageId,
      received_at: input.receivedAt.toISOString(),
      at: input.now.toISOString(),
    },
  };
}

export async function ingestReply(prisma: any, input: IngestReplyInput): Promise<IngestReplyResult> {
  if (!isGapOsEnabled()) return none('gap_disabled');
  if (input.isAutoresponder) return none('autoresponder');

  const email = normalizeReplyEmail(input.contactEmail);
  if (!email) return none('blank_email');

  const rows: LiveEnrollmentRow[] = await prisma.sequenceEnrollment.findMany({
    where: { to_email: email, status: { in: [...LIVE_ENROLLMENT_STATUSES] } },
    select: { id: true, engine: true, status: true },
    orderBy: { enrolled_at: 'asc' },
  });

  const active = rows.filter((r) => r.status === 'active');
  if (active.length === 0) return none(rows.length > 0 ? 'already_paused' : 'not_enrolled');

  const enrollments: IngestEnrollmentEffect[] = [];
  const refusals: IngestRefusal[] = [];
  let modexSeen = 0;

  for (const row of active) {
    if (row.engine === MODEX_ENGINE) {
      modexSeen += 1;
      const r = await pause(prisma, row.id, INGEST_ACTOR, input.now);
      if (!r.ok) {
        refusals.push({ id: row.id, engine: row.engine, reason: r.reason });
        continue;
      }
      // Mark why it is paused. Scoped to the row and the status the pause
      // just produced, so a concurrent stop cannot be overwritten.
      await prisma.sequenceEnrollment.updateMany({
        where: { id: row.id, status: 'paused' },
        data: { external_state: replyPendingMarker(input) },
      });
      enrollments.push({ id: row.id, engine: row.engine, previous: row.status, next: r.status });
      continue;
    }

    const r = await stop(prisma, row.id, REPLY_STOP_REASON, INGEST_ACTOR, input.now);
    if (!r.ok) {
      refusals.push({ id: row.id, engine: row.engine, reason: r.reason });
      continue;
    }
    enrollments.push({ id: row.id, engine: row.engine, previous: row.status, next: r.status });
  }

  // The reply must stop the mail even when the status move lost a race: the
  // stop is idempotent and touches only unsent items of a run on this address.
  const itemsStopped = modexSeen > 0 ? await stopRunsForRecipient(prisma, email, REPLY_STOP_REASON) : 0;

  if (enrollments.length === 0) {
    return { ok: true, action: 'none', enrollments, itemsStopped, reason: 'already_paused', refusals };
  }

  await audit(prisma, {
    kind: 'reply.ingested',
    actor: INGEST_ACTOR,
    subjectType: 'inbound_message',
    subjectId: input.inboundMessageId,
    payload: {
      source: input.source,
      toEmail: email,
      hubspotContactId: input.hubspotContactId ?? null,
      receivedAt: input.receivedAt.toISOString(),
      enrollmentIds: enrollments.map((e) => e.id),
      enrollments,
      itemsStopped,
      refusals,
    },
  });

  return {
    ok: true,
    action: 'paused',
    enrollments,
    itemsStopped,
    ...(refusals.length > 0 ? { refusals } : {}),
  };
}
