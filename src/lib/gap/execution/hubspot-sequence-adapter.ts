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
  let res: Response;
  try {
    res = await fetchFn('https://api.hubapi.com/automation/v4/sequences/enrollments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (err) {
    return {
      engine: 'hubspot_sequence',
      status: 'refused',
      engineId: null,
      createdAt: intent.now,
      refusalReason: `hubspot_enroll_network_error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!res.ok) {
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
