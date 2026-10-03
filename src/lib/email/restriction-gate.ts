/**
 * THE WARM-INTRO RESTRICTION, enforced at the wire (GAP V2 final review, 2026-10-02).
 *
 * The restriction (gap/policy/restriction.ts) was first enforced per writer: GAP's action-time check, the legacy
 * send guards, the Outbox writers, the drip. The final safety review found legacy routes that never pass any of them
 * (send-bulk, send-bulk-async + process-send-jobs, monday-bump). Like the mailbox ceiling, the kill switch and the
 * suppression contract, the one place every app send passes is the Gmail sender, so the restriction is checked there
 * too: TO, CC and BCC, by the recipient's domain (a restricted account's own domains).
 *
 * Exempt: OPERATOR_ALERT (a human must still hear about a halt), and a genuine REPLY to a message the buyer sent
 * (an In-Reply-To header pointing at their inbound message). A bump on our own old cold thread is not a reply.
 */
import { restrictionForEmail } from '@/lib/gap/policy/restriction';
import type { SendPurpose } from './autonomy-gate';

export class RestrictedRecipientError extends Error {
  readonly code = 'WARM_INTRO_ONLY';
  constructor(readonly recipient: string, reason: string) {
    super(`${reason} Refused at send: ${recipient}.`);
    this.name = 'RestrictedRecipientError';
  }
}

export function assertRestrictionPermitsSend(
  recipients: { to: string; cc?: string[]; bcc?: string },
  purpose: SendPurpose | undefined,
  opts: { inReplyTo?: string | null } = {},
): void {
  if (purpose === 'OPERATOR_ALERT') return;
  if (opts.inReplyTo && opts.inReplyTo.trim()) return;
  for (const r of [recipients.to, ...(recipients.cc ?? []), ...(recipients.bcc ? recipients.bcc.split(',') : [])]) {
    const hit = restrictionForEmail(r?.trim());
    if (hit) throw new RestrictedRecipientError(r.trim(), hit.reason);
  }
}
