/**
 * Booking-suppression connector (modex half).
 *
 * When the Order of Operations concierge books a call (`/api/concierge/booked`),
 * we record a durable `booking_confirmed` OperatorOutcome. That row flows to
 * clawd through the existing `outcomes` export stream (see
 * `src/lib/intel/export/streams.ts` -> `exportOutcomes`), where clawd advances
 * the freshly-booked contact's pipeline entry to a terminal stage so its signal
 * actuator never auto-nudges someone who just booked. No new endpoint — this
 * rides the stream that is already polled.
 *
 * The outcome envelope carries no person_email column, so the booker's email is
 * encoded into `source_id` as `<email>|<startTime>`. That doubles as the
 * idempotency key: OperatorOutcome has `@@unique([source_kind, source_id,
 * outcome_label])`, so a duplicate booking for the same identity+slot is a
 * database-level no-op.
 *
 * FK CONSTRAINT: OperatorOutcome.account_name is a foreign key to Account.name
 * (onDelete Cascade). We therefore only write when the booking resolves to a
 * known modex account — by the HubSpot company id we already resolved, else by
 * exact name. A booker with no matching modex account (e.g. a free-inbox lead)
 * is skipped; there is no clawd pipeline contact to suppress for them anyway,
 * and forcing an Account row would pollute the roster.
 *
 * FAIL-SOFT: this never throws. The booking response must not depend on it.
 */

import { prisma } from '@/lib/prisma';

export const BOOKING_OUTCOME_LABEL = 'booking_confirmed';
export const BOOKING_OUTCOME_SOURCE_KIND = 'concierge_booking';

/**
 * Hard latency cap on the (already fail-soft) DB work below. It runs 2-3
 * sequential Postgres queries inline on the concierge webhook path; if Postgres
 * is unreachable or the connection pool is exhausted, those would otherwise
 * stack up to the pool timeout (~10s) before the catch swallows them. We race
 * the whole thing against this timeout so worst-case added latency is bounded.
 * On timeout we take the exact same fail-soft path (skip, return null). The
 * race is awaited (never fire-and-forget): Vercel can freeze the function and
 * kill un-awaited work.
 */
export const BOOKING_OUTCOME_DB_TIMEOUT_MS = 2500;

/**
 * The idempotent source id for a booking outcome: `<email>|<startTime>`.
 * Mirrors `bookingIdempotencyKey` (same identity+slot key), and lets clawd
 * recover the booker's email from the outcome record (which has no email field).
 */
export function bookingOutcomeSourceId(email: string, startTime: string): string {
  return `${email.trim().toLowerCase()}|${startTime.trim()}`;
}

/**
 * Record ONE `booking_confirmed` OperatorOutcome for a freshly-booked contact.
 * Idempotent (via the @@unique) and fail-soft (never throws). Returns the new
 * outcome id, `'deduped'` when the row already existed, or `null` when it was
 * skipped (no resolvable account / write failed).
 */
export async function recordBookingConfirmedOutcome(args: {
  email: string;
  startTime: string;
  accountName: string;
  companyId: string | null;
}): Promise<string | 'deduped' | null> {
  // The DB work, unchanged in logic — resolve the FK-target Account, then an
  // idempotent find-or-create of the outcome row.
  const writeOutcome = async (): Promise<string | 'deduped' | null> => {
    // Resolve to a real modex Account row (the FK target). Prefer the HubSpot
    // company id we already resolved on this booking; fall back to an exact
    // name match. Either way we anchor on the canonical Account.name.
    let account: { name: string } | null = null;
    if (args.companyId) {
      account = await prisma.account.findFirst({
        where: { hubspot_company_id: args.companyId },
        select: { name: true },
      });
    }
    if (!account && args.accountName) {
      account = await prisma.account.findUnique({
        where: { name: args.accountName },
        select: { name: true },
      });
    }
    if (!account) {
      // No local account -> nothing in the clawd pipeline to suppress. Skip
      // rather than fabricate an Account row (would break the FK / pollute).
      return null;
    }

    const sourceId = bookingOutcomeSourceId(args.email, args.startTime);

    // Idempotency guard mirrors the operator-outcomes route: check the unique
    // triple first so a re-book is a clean no-op even across the TTL window
    // where the in-process booking guard has expired.
    const existing = await prisma.operatorOutcome.findUnique({
      where: {
        source_kind_source_id_outcome_label: {
          source_kind: BOOKING_OUTCOME_SOURCE_KIND,
          source_id: sourceId,
          outcome_label: BOOKING_OUTCOME_LABEL,
        },
      },
      select: { id: true },
    });
    if (existing) return 'deduped';

    const created = await prisma.operatorOutcome.create({
      data: {
        account_name: account.name,
        outcome_label: BOOKING_OUTCOME_LABEL,
        source_kind: BOOKING_OUTCOME_SOURCE_KIND,
        source_id: sourceId,
        created_by: 'concierge',
      },
      select: { id: true },
    });
    return created.id;
  };

  // Bound the whole thing so an unreachable DB / exhausted pool can only add
  // BOOKING_OUTCOME_DB_TIMEOUT_MS of latency to the booking, not the full pool
  // timeout. The timeout branch is the same fail-soft outcome as any other
  // failure: skip and return null. Awaited, not fire-and-forget.
  const TIMED_OUT = Symbol('booking-outcome-timeout');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMED_OUT), BOOKING_OUTCOME_DB_TIMEOUT_MS);
    });
    const result = await Promise.race([writeOutcome(), timeout]);
    if (result === TIMED_OUT) {
      console.warn('[concierge/booked] booking-outcome write timed out, skipped');
      return null;
    }
    return result;
  } catch (err) {
    // A concurrent insert can still lose the check-then-create race and hit the
    // @@unique (Prisma P2002) — that is the idempotent outcome we want, not an
    // error. Any other failure must never break the booking response.
    const code = (err as { code?: string } | null)?.code;
    if (code === 'P2002') return 'deduped';
    console.warn(
      '[concierge/booked] booking_confirmed outcome write failed (non-fatal):',
      err instanceof Error ? err.message : String(err),
    );
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
