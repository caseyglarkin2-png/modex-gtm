/**
 * GAP Prospecting OS, Sprint 6C: the HubSpot sequence execution adapter.
 *
 * Capability boundary (verified 2026-09-24, docs/GAP_PROSPECTING_OS.md
 * section 1.7): reads work with the modex private-app token (sequence list
 * and enrollment readback both 200). HubSpot's own docs say the write scope
 * (`automation.sequences.enrollments.write`) is user-level-app only; a
 * create was never tested against a real write (that needs the owner's
 * explicit go, `scripts/gap/probe-enrollments-api.ts`, S2-T0). Per the
 * owner addendum this phase does NOT register a new OAuth app and does NOT
 * let that gap block 6C: this adapter is complete and tested with a FAKE
 * fetch only, ships behind `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED` (stays
 * OFF), and a live 403 from HubSpot is handled as exactly the documented
 * boundary (`hubspot_write_scope_unavailable`), not a bug.
 *
 * C41 (the commercial context and execution audit, 2026-10-08): a lost answer is not a refusal. A network throw or a
 * 5xx AFTER the request went out may have enrolled the contact; the adapter then READS BACK (`deps.readback`: the
 * contact's enrollment in that sequence) and answers `queued` with the real id when one exists, a definite refusal
 * (`hubspot_enroll_network_error`, `hubspot_enroll_failed:<status>`) when the readback proves none, and
 * `hubspot_enroll_outcome_unknown` when it cannot tell (no readback given, or the readback failed too). A caller must
 * never retry an unknown outcome blind: `isUncertainEnrollment(receipt)` says which it is. `queued` is HubSpot's
 * acceptance of the enrollment, never a send and never a delivery.
 */
import { gapFlag } from '../flags';
import type { ExecutionIntent, ExecutionReceipt } from './contract';

export interface HubspotEnrollmentInput {
  sequenceId: string;
  contactId: string;
  senderEmail: string;
  userId: string;
}

export interface HubspotSequenceAdapterDeps {
  /** Injected for tests; never a real network call while GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED is off, since this function returns before touching it. */
  fetchImpl?: typeof fetch;
  /** Defaults to process.env.HUBSPOT_ACCESS_TOKEN. */
  accessToken?: string;
  /**
   * C41: the provider readback after a lost answer: the contact's enrollment in the sequence, or null when HubSpot
   * holds none. Absent, a lost answer is `hubspot_enroll_outcome_unknown` (never a refusal a caller may retry).
   */
  readback?: (input: HubspotEnrollmentInput) => Promise<{ enrollmentId: string } | null>;
}

/** The refusal reasons that mean "HubSpot may have acted; do not retry blind". */
export const UNCERTAIN_ENROLLMENT = /^hubspot_enroll_outcome_unknown/;

/** C41: true when the receipt is a lost answer, not a refusal: a retry would risk a second enrollment. */
export function isUncertainEnrollment(receipt: Pick<ExecutionReceipt, 'status' | 'refusalReason'>): boolean {
  return receipt.status === 'refused' && UNCERTAIN_ENROLLMENT.test(receipt.refusalReason ?? '');
}

/**
 * engine: 'hubspot_sequence'. Flag off (the default): refuses
 * `gap_hubspot_sequence_publish_disabled` immediately, no network call at
 * all -- provable, not just asserted, since `deps.fetchImpl` is never
 * invoked in that branch.
 */
export async function hubspotSequenceAdapter(
  intent: ExecutionIntent,
  input: HubspotEnrollmentInput,
  deps: HubspotSequenceAdapterDeps = {},
): Promise<ExecutionReceipt> {
  if (!gapFlag('GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED')) {
    return {
      engine: 'hubspot_sequence',
      status: 'refused',
      engineId: null,
      createdAt: intent.now,
      refusalReason: 'gap_hubspot_sequence_publish_disabled',
    };
  }

  const token = deps.accessToken ?? process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return { engine: 'hubspot_sequence', status: 'refused', engineId: null, createdAt: intent.now, refusalReason: 'hubspot_access_token_missing' };
  }

  const fetchFn = deps.fetchImpl ?? fetch;
  // C41: a lost answer (a throw after the request went out, a 5xx) may have enrolled the contact. Read back before
  // answering: the real enrollment when it exists, a definite refusal when the readback proves none, else unknown.
  const afterLostAnswer = async (what: string): Promise<ExecutionReceipt> => {
    if (!deps.readback) return { engine: 'hubspot_sequence', status: 'refused', engineId: null, createdAt: intent.now, refusalReason: `hubspot_enroll_outcome_unknown: ${what} (no readback available)` };
    try {
      const found = await deps.readback(input);
      if (found?.enrollmentId) return { engine: 'hubspot_sequence', status: 'queued', engineId: found.enrollmentId, createdAt: intent.now };
      return { engine: 'hubspot_sequence', status: 'refused', engineId: null, createdAt: intent.now, refusalReason: `hubspot_enroll_network_error: ${what} (readback: not enrolled)` };
    } catch (err) {
      return { engine: 'hubspot_sequence', status: 'refused', engineId: null, createdAt: intent.now, refusalReason: `hubspot_enroll_outcome_unknown: ${what}; readback failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  };
  let res: Response;
  try {
    res = await fetchFn('https://api.hubapi.com/automation/v4/sequences/enrollments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (err) {
    return afterLostAnswer(err instanceof Error ? err.message : String(err));
  }

  if (!res.ok) {
    if (res.status >= 500) return afterLostAnswer(`http ${res.status}`);
    return {
      engine: 'hubspot_sequence',
      status: 'refused',
      engineId: null,
      createdAt: intent.now,
      refusalReason: res.status === 403 ? 'hubspot_write_scope_unavailable' : `hubspot_enroll_failed:${res.status}`,
    };
  }

  const body = (await res.json()) as { enrollmentId?: string; id?: string };
  const engineId = body.enrollmentId ?? body.id ?? null;
  if (!engineId) {
    return { engine: 'hubspot_sequence', status: 'refused', engineId: null, createdAt: intent.now, refusalReason: 'hubspot_enroll_no_id_in_response' };
  }
  return { engine: 'hubspot_sequence', status: 'queued', engineId, createdAt: intent.now };
}
