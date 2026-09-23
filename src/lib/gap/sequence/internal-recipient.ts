/**
 * S3-T2: is a recipient one of ours?
 *
 * Structural copy of the internal-domain bypass rule in
 * `src/lib/email/perform-send.ts` (`allowBypass`): casey@freightroll.com,
 * `FROM_EMAIL` when set, and any address at freightroll.com or yardflow.ai.
 * The rule is copied, not the code, because the GAP sequence layer must not
 * import the send path. A test reads perform-send.ts as text and asserts every
 * literal below still appears there, so the two cannot drift silently.
 *
 * Used for `SequenceEnrollment.is_test`: an internal recipient never freezes a
 * SequenceVersion and never counts as a prospect touch.
 */

export const INTERNAL_DOMAINS = ['freightroll.com', 'yardflow.ai'] as const;
export const INTERNAL_ADDRESSES = ['casey@freightroll.com'] as const;

/** Case-insensitive, trimmed. Blank, null and undefined are external (false). */
export function isInternalRecipient(email: string | null | undefined): boolean {
  if (typeof email !== 'string') return false;
  const lower = email.trim().toLowerCase();
  if (lower === '') return false;
  const fromEmail = process.env.FROM_EMAIL?.trim().toLowerCase() ?? '';
  return (
    (INTERNAL_ADDRESSES as readonly string[]).includes(lower) ||
    (fromEmail !== '' && lower === fromEmail) ||
    INTERNAL_DOMAINS.some((dom) => lower.endsWith(`@${dom}`))
  );
}
