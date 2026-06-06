/**
 * Unified comms-awareness for the Draft Queue.
 *
 * Answers "are we already talking to this person?" across every signal:
 *   - unsubscribe list (hard block)
 *   - an existing Gmail thread (manual / agent / app sends)
 *   - our own EmailLog (app-sent record)
 *   - HubSpot (Casey's source of truth for relationships)
 *
 * Pure decision core (`commsDecision`) + injected-I/O orchestrator
 * (`recipientCommsStatus`). This sits alongside `dedupDecision` — it gives a
 * richer status, it does not replace the allow/block dedup gate.
 *
 * Authority (first positive signal wins):
 *   unsubscribed > in_thread (gmail) > emailed (emailLog or hubspot) > new
 *
 * Special case: when the ONLY signal that could have flipped us off 'new' is
 * HubSpot but HubSpot is not configured, we return 'unknown' rather than 'new'
 * — we cannot honestly call a contact clean when we never checked the system of
 * record for relationships.
 */

export type CommsState = 'new' | 'emailed' | 'in_thread' | 'unsubscribed' | 'unknown';

export interface CommsInputs {
  unsubscribed: boolean;
  gmailThread: boolean; // an existing Gmail thread (manual/agent/app)
  emailLogHit: boolean; // app-sent record
  hubspot: { configured: boolean; found: boolean };
}

export interface CommsStatus {
  state: CommsState;
  lastAt: Date | null;
  detail: string;
}

/**
 * PURE decision. Authority: unsubscribed > in_thread (gmail) > emailed
 * (emailLog or hubspot) > new. When the only positive signal would be HubSpot
 * but HubSpot is not configured, returns 'unknown' (not 'new').
 */
export function commsDecision(i: CommsInputs, lastAt: Date | null): CommsStatus {
  if (i.unsubscribed) {
    return { state: 'unsubscribed', lastAt, detail: 'On the unsubscribe list — do not contact.' };
  }
  if (i.gmailThread) {
    return { state: 'in_thread', lastAt, detail: 'Already in an email thread with this contact.' };
  }
  if (i.emailLogHit || (i.hubspot.configured && i.hubspot.found)) {
    const via = i.emailLogHit ? 'a prior app send' : 'HubSpot engagement history';
    return { state: 'emailed', lastAt, detail: `Previously contacted (${via}).` };
  }
  if (!i.hubspot.configured) {
    return {
      state: 'unknown',
      lastAt,
      detail: 'HubSpot not configured — relationship history unverified.',
    };
  }
  return { state: 'new', lastAt, detail: 'No prior contact found across Gmail, EmailLog, or HubSpot.' };
}

/** Injected I/O for the orchestrator (so it's testable without live services). */
export interface CommsDeps {
  isUnsubscribed: (email: string) => Promise<boolean>;
  gmailThread: (email: string) => Promise<boolean>;
  emailLogHit: (email: string) => Promise<boolean>;
  hubspot: (email: string) => Promise<{ configured: boolean; found: boolean; lastAt: Date | null }>;
}

/** Orchestrator: gathers the four signals concurrently, then decides. */
export async function recipientCommsStatus(email: string, deps: CommsDeps): Promise<CommsStatus> {
  const [unsubscribed, gmailThread, emailLogHit, hubspot] = await Promise.all([
    deps.isUnsubscribed(email),
    deps.gmailThread(email),
    deps.emailLogHit(email),
    deps.hubspot(email),
  ]);

  return commsDecision(
    { unsubscribed, gmailThread, emailLogHit, hubspot: { configured: hubspot.configured, found: hubspot.found } },
    hubspot.lastAt,
  );
}
