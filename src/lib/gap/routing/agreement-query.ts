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
 */
export async function loadAgreementReport(prisma: any, filters: AgreementFilters = {}): Promise<AgreementReport> {
  const where: Record<string, unknown> = {};
  if (filters.runId) where.run_id = filters.runId;

  const rows: Array<{ id: string; action: string; rule_id: string; human_action: string | null }> =
    await prisma.routingDecision.findMany({
      where,
      select: { id: true, action: true, rule_id: true, human_action: true },
    });

  const decisions: AgreementDecision[] = rows
    .filter((r) => isRoutingAction(r.action))
    .map((r) => ({
      id: r.id,
      action: r.action as RoutingAction,
      ruleId: r.rule_id,
      humanAction: isHumanAction(r.human_action) ? r.human_action : null,
    }));

  return computeAgreement(decisions);
}
