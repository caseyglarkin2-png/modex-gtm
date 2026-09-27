/**
 * R-B (owner-confirmed finish requirement, 2026-09-24): Prisma glue for
 * ./agreement.ts. Reads every RoutingDecision (comparable or not; the pure
 * layer decides what counts) and hands the shape `computeAgreement` needs.
 *
 * Red team T10 (2026-09-27): each decision also carries
 *   executedEmail  the send records (learning/execution.ts loadSendRecords:
 *                  the GAP ledger and the modex queue's GAP sends) hold a send
 *                  for this card, or for this person after this card and
 *                  before their next card
 *   executedEnroll a live, non-test GAP enrollment of this person started in
 *                  that same window
 *   open           this is the person's newest card and it is younger than
 *                  AGREEMENT_OPEN_DAYS; only an open card with no action is
 *                  left out of the rates (pending)
 *
 * House convention for DB glue is `prisma: any`.
 */

import { HUMAN_ACTIONS, ROUTING_ACTIONS, type HumanAction, type RoutingAction } from '../taxonomy';
import { computeAgreement, type AgreementDecision, type AgreementReport } from './agreement';
import { loadEnrollmentStarts, loadSendRecords } from '../learning/execution';

const ROUTING_ACTION_SET = new Set<string>(ROUTING_ACTIONS);
const HUMAN_ACTION_SET = new Set<string>(HUMAN_ACTIONS);

/** A card nobody acted on stays pending this long, then counts as unacted. */
export const AGREEMENT_OPEN_DAYS = 7;

function isRoutingAction(v: unknown): v is RoutingAction {
  return typeof v === 'string' && ROUTING_ACTION_SET.has(v);
}

function isHumanAction(v: unknown): v is HumanAction {
  return typeof v === 'string' && HUMAN_ACTION_SET.has(v);
}

export interface AgreementFilters {
  runId?: string | null;
  now?: Date;
}

interface DecisionRow {
  id: string;
  action: string;
  rule_id: string;
  human_action: string | null;
  lane: string;
  persona_id: number | null;
  created_at: Date;
}

/**
 * A row whose `action` is not a known RoutingAction, or whose `human_action`
 * is set but not a known HumanAction, is dropped rather than mis-tallied
 * (both columns are free `String` at the DB layer). A `lane: 'blocked'` row
 * is a system safety refusal, never a recommendation, and is excluded.
 *
 * Supersession and the "next card" bound are computed over EVERY decision
 * of the person, not only the filtered run, so a run filter can never make a
 * superseded card look open.
 */
export async function loadAgreementReport(prisma: any, filters: AgreementFilters = {}): Promise<AgreementReport> {
  const now = filters.now ?? new Date();
  const select = { id: true, action: true, rule_id: true, human_action: true, lane: true, persona_id: true, created_at: true };
  const scoped: DecisionRow[] = await prisma.routingDecision.findMany({ where: filters.runId ? { run_id: filters.runId } : {}, select });
  const all: DecisionRow[] = filters.runId ? await prisma.routingDecision.findMany({ select }) : scoped;
  const sends = await loadSendRecords(prisma);
  const enrollStarts = await loadEnrollmentStarts(prisma);

  // Every card per person, oldest first: bounds "after this card, before the next".
  const cardsByPersona = new Map<number, DecisionRow[]>();
  for (const d of all) {
    if (d.persona_id === null || d.lane === 'blocked') continue;
    cardsByPersona.set(d.persona_id, [...(cardsByPersona.get(d.persona_id) ?? []), d]);
  }
  for (const list of cardsByPersona.values()) list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const sentDecisionIds = new Set(sends.map((s) => s.decisionId));
  const sendTimesByPersona = new Map<number, number[]>();
  for (const s of sends) if (s.personaId !== null) sendTimesByPersona.set(s.personaId, [...(sendTimesByPersona.get(s.personaId) ?? []), s.sentAt.getTime()]);

  const openCutoff = now.getTime() - AGREEMENT_OPEN_DAYS * 86_400_000;
  const decisions: AgreementDecision[] = scoped
    .filter((r) => isRoutingAction(r.action) && r.lane !== 'blocked')
    .map((r) => {
      const created = new Date(r.created_at).getTime();
      const cards = r.persona_id !== null ? cardsByPersona.get(r.persona_id) ?? [] : [];
      const next = cards.find((c) => new Date(c.created_at).getTime() > created);
      const nextAt = next ? new Date(next.created_at).getTime() : Infinity;
      const personSent = r.persona_id !== null && (sendTimesByPersona.get(r.persona_id) ?? []).some((t) => t >= created && t < nextAt);
      return {
        id: r.id,
        action: r.action as RoutingAction,
        ruleId: r.rule_id,
        humanAction: isHumanAction(r.human_action) ? r.human_action : null,
        executedEmail: sentDecisionIds.has(r.id) || personSent,
        executedEnroll: r.persona_id !== null && (enrollStarts.get(r.persona_id) ?? []).some((t) => t >= created && t < nextAt),
        open: !next && created >= openCutoff,
      };
    });

  return computeAgreement(decisions);
}
