/**
 * recordUnsubscribe: the ONE consent write path (spec docs/GAP_PROSPECTING_OS.md
 * section 7, ticket S4-T1).
 *
 * It writes exactly what POST /api/unsubscribe wrote before the extraction,
 * in the same order:
 *   1. UnsubscribedEmail.findUnique; if the row exists, stop (idempotent, and
 *      nothing else runs, matching the route's early return).
 *   2. UnsubscribedEmail.create with { email, email_log_id, reason }. The row's
 *      unsubscribed_at keeps the DB default.
 *   3. Persona.updateMany where email, data { do_not_contact: true }. This is
 *      the cross-plane modex suppression leg (`modex_do_not_contact`): clawd
 *      and Top100 read Persona.do_not_contact, so writing the table alone would
 *      leave them able to mail the person.
 *   4. HubSpot mirror, fail-open: Persona.findFirst where email; when that
 *      persona has a hubspot_contact_id, upsertContact({ email,
 *      hs_email_optout: 'true' }). Any throw in this step (the lookup or the
 *      write) is recorded in the result and never propagates.
 *
 * Deliberately NOT flag-gated. Consent is honored whether or not GAP_OS_ENABLED
 * is on, because the unsubscribe link and the do_not_contact disposition both
 * land here. Structural test (tests/unit/gap/record-unsubscribe.test.ts)
 * asserts no file under src/lib/gap or src/app/api/gap writes do_not_contact.
 *
 * The email is trimmed and lowercased before every read and write. The token
 * validator and the suppression gate already normalize the same way; this is
 * the one place the extraction is stricter than the old route, which wrote the
 * address exactly as posted.
 *
 * `source`, `actor`, `dispositionId` and `now` are accepted for the caller's
 * own audit row. UnsubscribedEmail has no column for them (its only free field
 * is `reason`, which stays the caller's reason so the row is identical to what
 * the route writes), so they are not persisted here.
 */
import { upsertContact as defaultUpsertContact } from '@/lib/hubspot/contacts';

export type UnsubscribeSource = 'unsubscribe_link' | 'gap_disposition' | 'manual';

export type UnsubscribeHubSpotClient = {
  upsertContact: (properties: { email: string; hs_email_optout?: string }) => Promise<string | null>;
};

export type RecordUnsubscribeInput = {
  email: string;
  source: UnsubscribeSource;
  /** Free-text reason; stored on UnsubscribedEmail.reason exactly as given. */
  reason?: string;
  /** EmailLog id the unsubscribe link carried; stored on UnsubscribedEmail.email_log_id. */
  emailLogId?: number;
  /** Who recorded it (for the caller's audit; not persisted here). */
  actor?: string;
  /** The ConversationDisposition that triggered it (for the caller's audit; not persisted here). */
  dispositionId?: string;
  /** HubSpot mirror control. Default: enabled, module upsertContact. */
  hubspot?: { enabled: boolean; client?: UnsubscribeHubSpotClient };
  /** Reserved for callers; the row's unsubscribed_at keeps the DB default like the route. */
  now?: Date;
};

export type RecordUnsubscribeHubSpotOutcome =
  | 'written'
  | 'skipped:already_unsubscribed'
  | 'skipped:disabled'
  | 'skipped:no_hubspot_contact_id'
  | 'skipped:not_configured'
  | `failed:${string}`;

export type RecordUnsubscribeResult = {
  ok: true;
  /** false when the email was already in UnsubscribedEmail (nothing else ran). */
  created: boolean;
  /** Persona.updateMany count; 0 when created is false. */
  personaUpdated: number;
  hubspot: RecordUnsubscribeHubSpotOutcome;
};

export function normalizeUnsubscribeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// House convention for DB glue is `prisma: any` (see src/lib/gap/enroll/service.ts).
export async function recordUnsubscribe(
  prisma: any,
  input: RecordUnsubscribeInput,
): Promise<RecordUnsubscribeResult> {
  const email = normalizeUnsubscribeEmail(input.email);

  const existing = await prisma.unsubscribedEmail.findUnique({ where: { email } });
  if (existing) {
    return { ok: true, created: false, personaUpdated: 0, hubspot: 'skipped:already_unsubscribed' };
  }

  await prisma.unsubscribedEmail.create({
    data: {
      email,
      email_log_id: input.emailLogId,
      reason: input.reason,
    },
  });

  // Case-insensitive: Persona.email is stored as imported (e.g. "John@Acme.com"),
  // not normalized, so an exact-case match here can silently miss the persona
  // and leave the cross-plane do_not_contact leg clear.
  const updated = await prisma.persona.updateMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    data: { do_not_contact: true },
  });
  const personaUpdated = typeof updated?.count === 'number' ? updated.count : 0;

  const hubspotEnabled = input.hubspot?.enabled ?? true;
  if (!hubspotEnabled) {
    return { ok: true, created: true, personaUpdated, hubspot: 'skipped:disabled' };
  }

  let hubspot: RecordUnsubscribeHubSpotOutcome;
  try {
    const persona = await prisma.persona.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (persona?.hubspot_contact_id) {
      const upsert = input.hubspot?.client?.upsertContact ?? defaultUpsertContact;
      const id = await upsert({ email, hs_email_optout: 'true' });
      hubspot = id ? 'written' : 'skipped:not_configured';
    } else {
      hubspot = 'skipped:no_hubspot_contact_id';
    }
  } catch (error) {
    hubspot = `failed:${error instanceof Error ? error.message : String(error)}`;
  }

  return { ok: true, created: true, personaUpdated, hubspot };
}
