/**
 * Pure dedup decision for the Draft Queue's dedup-on-add path.
 *
 * Precedence (first hit wins):
 *   1. unsubscribed     — hard block, regardless of any other signal
 *   2. already_emailed  — EmailLog hit OR a Gmail thread exists (catches Casey's
 *                         manual sends, which never reach our EmailLog)
 *   3. already_queued   — the contact is already sitting in the queue
 * Otherwise the contact is allowed.
 */
export interface DedupInputs {
  unsubscribed: boolean;
  emailLogHit: boolean;
  queuedHit: boolean;
  gmailThread: boolean;
}

export type DedupReason = 'unsubscribed' | 'already_emailed' | 'already_queued';

export interface DedupResult {
  allow: boolean;
  reason?: DedupReason;
}

export function dedupDecision(i: DedupInputs): DedupResult {
  if (i.unsubscribed) return { allow: false, reason: 'unsubscribed' };
  if (i.emailLogHit || i.gmailThread) return { allow: false, reason: 'already_emailed' };
  if (i.queuedHit) return { allow: false, reason: 'already_queued' };
  return { allow: true };
}
