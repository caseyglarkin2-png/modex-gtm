/**
 * GAP Prospecting OS, Sprint 6B-T3b: the legacy enroll adapter.
 *
 * `enrollFromDecision` (enroll/service.ts) already resolves its own target
 * (hubspot_native readback-row vs modex_queue vs build_required) from the
 * persona's Top100 entry -- it does not take an engine choice from the
 * caller, unlike this contract's `ExecutionIntent.engine`. Honest framing,
 * recorded so a later reader does not assume more unification than exists:
 * this adapter is the SAME single entry point the existing system already
 * uses for both outcomes, translated into the new receipt shape; it does
 * not let a caller force modex_queue over what the persona's Top100 data
 * says. 6C's NEW adapters (a real HubSpot Sequences API client, Gmail) sit
 * ALONGSIDE this one, not underneath it.
 *
 * WITHOUT BEHAVIOR CHANGE: every guard, refusal reason and write this
 * module can produce is `enrollFromDecision` itself, called with its own
 * unchanged input shape. This file only translates in and out.
 */
import {
  enrollFromDecision,
  type EnrollDeps,
  type EnrollFromDecisionInput,
  type EnrollServiceResult,
} from '../enroll/service';
import type { ExecutionIntent, ExecutionReceipt } from './contract';

/** Translate one ExecutionIntent into the existing service's input shape. Pure. */
export function toEnrollInput(intent: ExecutionIntent): EnrollFromDecisionInput {
  return {
    hypothesisId: intent.hypothesisId,
    personaId: intent.personaId,
    sequenceVersionId: intent.sequenceVersionId,
    compileIds: intent.compileIds,
    actor: intent.actor,
    actorKind: intent.actorKind,
    mode: intent.mode,
    now: intent.now,
    sender: intent.senderIdentity,
  };
}

/** Translate the existing service's result into one ExecutionReceipt. Pure. */
export function toExecutionReceipt(result: EnrollServiceResult, now: Date): ExecutionReceipt {
  if (!result.ok) {
    return {
      engine: 'modex_queue',
      status: 'refused',
      engineId: null,
      createdAt: now,
      refusalReason: result.detail ? `${result.reason}: ${result.detail}` : result.reason,
    };
  }
  if (result.kind === 'enroll_row') {
    // A hubspot_native readback row is not an enrollment this adapter made
    // (R3-13: the enrollment-sync cron is the only recorder); there is no
    // engine id to name yet, live or shadow.
    return { engine: 'hubspot_sequence', status: result.mode === 'live' ? 'queued' : 'shadow', engineId: null, createdAt: now };
  }
  if (result.kind === 'modex_shadow') {
    return { engine: 'modex_queue', status: 'shadow', engineId: null, createdAt: now };
  }
  // modex_enrolled
  return { engine: 'modex_queue', status: 'queued', engineId: String(result.draftItemId), createdAt: now };
}

/**
 * Run the existing legacy enroll path behind the new contract. Refuses
 * non-modex-shaped engines up front (this adapter never chooses the target;
 * enrollFromDecision does) so a caller cannot be misled into thinking
 * `engine: 'gmail_direct'` reached Gmail through here.
 */
export async function legacyEnrollAdapter(prisma: any, intent: ExecutionIntent, deps: EnrollDeps): Promise<ExecutionReceipt> {
  if (intent.engine !== 'modex_queue' && intent.engine !== 'hubspot_sequence') {
    return {
      engine: intent.engine,
      status: 'refused',
      engineId: null,
      createdAt: intent.now,
      refusalReason: 'engine_not_supported_by_legacy_adapter',
    };
  }
  const result = await enrollFromDecision(prisma, toEnrollInput(intent), deps);
  return toExecutionReceipt(result, intent.now);
}
