/**
 * THE ONE GOVERNED CLEAR of a legacy local suppression flag (WHO truth maintenance, 2026-10-05). The consent
 * helper beside this file (unsubscribe.ts) is the only writer that SETS Persona.do_not_contact; this is the only
 * writer that CLEARS it, and only on Casey's explicit, confirmed click after a live legacy-suppression review
 * (src/lib/gap/suppression/legacy-review.ts clearLegacyLocalFlag) found no hard suppression on any plane. The
 * structural invariant in tests/unit/gap/record-unsubscribe.test.ts keeps every other GAP file from writing the
 * column; both writers live here, under src/lib/email, and nothing under src/lib/gap does.
 *
 * The SAME statement as scripts/gap/correct-historical-suppression.ts, widened to the stale status alone
 * (do_not_contact may already be false) and narrowed to never touch a hard status. Deliberately no updated_at: the
 * sync-hubspot cron pushes every persona updated in the last 6 hours to HubSpot, and this correction is not a
 * HubSpot write.
 */
export const CLEAR_LEGACY_FLAG_SQL = `update personas set do_not_contact = false, email_status = 'unverified'
  where id = $1 and lower(email) = lower($2)
    and (do_not_contact = true or email_status = 'bounced')
    and email_status not in ('hard_bounce', 'hard_bounced', 'invalid')`;

/** Runs the statement inside the caller's transaction; returns the row count (the caller refuses anything but 1). */
export async function clearLegacyLocalFlagRow(tx: { $executeRawUnsafe: (sql: string, ...args: unknown[]) => Promise<number> }, personaId: number, email: string): Promise<number> {
  return tx.$executeRawUnsafe(CLEAR_LEGACY_FLAG_SQL, personaId, email);
}
