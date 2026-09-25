/**
 * GAP Prospecting OS, Sprint 6B: the multi-engine execution contract.
 *
 * Every outbound step, whatever sends it, is described by one typed intent
 * and answered by one typed receipt, so 6C's adapters (HubSpot sequences,
 * Gmail) and the existing modex/HubSpot-readback path (6B-T3's
 * `legacyEnrollAdapter`) all speak the same shape to 6D's reconciler, 6E's
 * reply loop and Sprint 7's shadow control plane.
 *
 * `gmail_draft` is a DISTINCT engine from `gmail_direct` (owner addendum,
 * 2026-09-24): creating a Gmail draft is not sending a message. A draft
 * receipt's `engineId` is the Gmail draft id; sending it later produces a
 * SEPARATE receipt whose `supersedesEngineId` names the draft it came from,
 * with its own `engineId` (the sent message id) and `sentAt`. Never collapse
 * the two into one event.
 *
 * Pure types plus one pure ordering constant (the gate chain every adapter
 * is expected to run, in order); no I/O here.
 */

export type ExecutionEngine = 'modex_queue' | 'hubspot_sequence' | 'gmail_direct' | 'gmail_draft' | 'manual';

export type ActorKind = 'human' | 'agent';
export type ExecutionMode = 'shadow' | 'live';

/**
 * One caller's request to send (or would-send) one step through one engine.
 * `idempotencyKey` is the caller's own dedup key for this exact step attempt
 * (an adapter that receives the same key twice must not act twice).
 */
export interface ExecutionIntent {
  engine: ExecutionEngine;
  personaId: number;
  hypothesisId: string;
  sequenceVersionId: string;
  stepIndex: number;
  /** The GapCompile rows the caller relies on for this step. */
  compileIds: string[];
  senderIdentity: string;
  idempotencyKey: string;
  actor: string;
  actorKind: ActorKind;
  mode: ExecutionMode;
  now: Date;
  /** gmail_draft and gmail_direct: threading context for a reply/follow-up step. */
  threadContext?: {
    threadId: string;
    references?: string[];
    inReplyTo?: string;
    subject: string;
  } | null;
}

export type ExecutionReceiptStatus = 'sent' | 'drafted' | 'queued' | 'shadow' | 'refused';

/**
 * What actually happened (or would happen, in shadow). `engineId` is the
 * engine's own identifier for that outcome: a Draft Queue item id, a
 * HubSpot sequence enrollment id, a Gmail draft id (status 'drafted') or a
 * Gmail message id (status 'sent'). Never null for a non-refused, non-shadow
 * receipt -- an adapter that cannot name what it did has not actually done it.
 */
export interface ExecutionReceipt {
  engine: ExecutionEngine;
  status: ExecutionReceiptStatus;
  engineId: string | null;
  createdAt: Date;
  sentAt?: Date | null;
  /** Gmail only: preserved across drafted -> sent and reply/follow-up steps. */
  threadId?: string | null;
  /** A 'sent' receipt that followed a 'drafted' one names the draft's engineId here. Never set otherwise. */
  supersedesEngineId?: string | null;
  refusalReason?: string | null;
}

/**
 * The gate chain every adapter is expected to run, in this order (spec
 * section 3, 6B). Documentation, not enforcement: each adapter runs its own
 * checks (see enroll/service.ts's existing guard order for the modex/
 * HubSpot-readback path, which already implements every one of these except
 * sender vetting is folded into the identity list rather than a separate step).
 */
export const EXECUTION_GATE_CHAIN = [
  'kill_switch_and_flags',
  'suppression',
  'active_opportunity',
  'compile_verification',
  'sender_vetting',
] as const;

export type ExecutionGate = (typeof EXECUTION_GATE_CHAIN)[number];
