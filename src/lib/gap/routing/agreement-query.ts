/**
 * R-B (owner-confirmed finish requirement, 2026-09-24): Prisma glue for
 * ./agreement.ts. Reads every RoutingDecision (comparable or not; the pure
 * layer decides what counts) and hands the shape `computeAgreement` needs.
 *
 * House convention for DB glue is `prisma: any`.
 */

import { HUMAN_ACTIONS, ROUTING_ACTIONS, type HumanAction, type RoutingAction } from '../taxonomy';
import { computeAgreement, type AgreementDecision, type AgreementReport } from './agreement';

const ROUTING_ACTION_SET = new Set<string>(ROUTING_ACTIONS);
const HUMAN_ACTION_SET = new Set<string>(HUMAN_ACTIONS);

function isRoutingAction(v: unknown): v is RoutingAction {
  return typeof v === 'string' && ROUTING_ACTION_SET.has(v);
}

function isHumanAction(v: unknown): v is HumanAction {
  return typeof v === 'string' && HUMAN_ACTION_SET.has(v);
}

export interface AgreementFilters {
  runId?: string | null;
}

/**
 * A row whose `action` is not a known RoutingAction, or whose `human_action`
 * is set but not a known HumanAction, is dropped rather than mis-tallied:
 * both columns are free `String` at the DB layer (HUMAN_ACTIONS is enforced
 * in application code, not a Postgres CHECK), so a stale or hand-edited row
 * fails closed here instead of silently joining the wrong bucket.
 *
 * A `lane: 'blocked'` row (dogfood fix, 2026-09-25) is a system safety
 * refusal (suppressed, suppression_unknown), never a real operator
 * recommendation -- it is excluded entirely, even if it somehow carries a
 * `human_action` (the UI no longer offers one for a blocked card, but this
 * query does not trust the UI to have been the only writer). Silence
 * (`humanAction: null` on a real, non-blocked decision) already only
 * lowers `totalDecisions`, never the comparable denominator; this drops the
 * row before it reaches `totalDecisions` at all.
 */
export async function loadAgreementReport(prisma: any, filters: AgreementFilters = {}): Promise<AgreementReport> {
  const where: Record<string, unknown> = {};
  if (filters.runId) where.run_id = filters.runId;

  const rows: Array<{ id: string; action: string; rule_id: string; human_action: string | null; lane: string }> =
    await prisma.routingDecision.findMany({
      where,
      select: { id: true, action: true, rule_id: true, human_action: true, lane: true },
    });

  const decisions: AgreementDecision[] = rows
    .filter((r) => isRoutingAction(r.action) && r.lane !== 'blocked')
    .map((r) => ({
      id: r.id,
      action: r.action as RoutingAction,
      ruleId: r.rule_id,
      humanAction: isHumanAction(r.human_action) ? r.human_action : null,
    }));

  return computeAgreement(decisions);
}
