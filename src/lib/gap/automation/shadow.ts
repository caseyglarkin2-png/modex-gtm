/**
 * GAP Prospecting OS, Sprint 7: the shadow decision audit log.
 *
 * "GAP_AUTO_ENROLL_SHADOW path only: produces shadow rows (acted_by_system_at
 * stays NULL, no engine call)." One audit event per would-be automated
 * action, reusing the existing append-only `gap_audit_events` ledger and the
 * `enroll.shadow` `GapAuditKind` (already in the union; no new table, no new
 * migration). `acted_by_system_at: null` is written EXPLICITLY every time,
 * never inferred from the caller's payload, so a caller cannot pass a
 * timestamp and accidentally make a shadow row look like a real action.
 */
import { audit as defaultAudit, type AuditInput, type AuditResult } from '../audit';
import { gapFlag } from '../flags';
import type { ExecutionEngine } from '../execution/contract';

export interface ShadowDecisionInput {
  accountName: string;
  ruleId: string;
  personaId: number;
  hypothesisId: string;
  wouldEngine: ExecutionEngine;
  now: Date;
}

export interface ShadowDecisionDeps {
  audit?: (prisma: any, input: AuditInput) => Promise<AuditResult>;
}

export interface ShadowDecisionResult {
  recorded: boolean;
  reason?: 'gap_auto_enroll_shadow_disabled';
}

/**
 * Record one "the system would have enrolled this" event. Flag off (the
 * default): no audit call at all, provably -- a caller can hand this an
 * audit spy and assert it was never invoked.
 */
export async function recordShadowDecision(prisma: any, input: ShadowDecisionInput, deps: ShadowDecisionDeps = {}): Promise<ShadowDecisionResult> {
  if (!gapFlag('GAP_AUTO_ENROLL_SHADOW')) {
    return { recorded: false, reason: 'gap_auto_enroll_shadow_disabled' };
  }
  const auditFn = deps.audit ?? defaultAudit;
  await auditFn(prisma, {
    kind: 'enroll.shadow',
    actor: 'system:shadow',
    subjectType: 'automation_decision',
    subjectId: input.hypothesisId,
    payload: {
      accountName: input.accountName,
      ruleId: input.ruleId,
      personaId: input.personaId,
      wouldEngine: input.wouldEngine,
      // Never set from input -- the whole point of this row is that no
      // action was taken. A caller cannot make a shadow row look real.
      acted_by_system_at: null,
      recordedAt: input.now.toISOString(),
    },
  });
  return { recorded: true };
}
