/**
 * R-B (owner-confirmed finish requirement, 2026-09-24): Prisma glue for
 * ./agreement.ts.
 *
 * Red team T10 (2026-09-27, Release D review S5, S7): agreement is counted
 * over EPISODES, not cards, and every execution is credited once.
 *
 *   episode         consecutive cards for one person with the SAME
 *                   recommendation collapse into one decision: re-running
 *                   the router (daily or weekly) cannot move the rate by
 *                   minting more identical cards. The episode's action is
 *                   the last human action recorded on any of its cards.
 *   one credit      each send (learning/execution.ts loadSendRecords: the
 *                   GAP ledger, one row per Gmail message, and the GAP queue)
 *                   is credited to exactly one card: the card it was filed
 *                   under, otherwise the person's newest card at the time it
 *                   went out. Each enrollment start likewise.
 *   open            an episode with no action is pending only while it is
 *                   the person's latest and its newest card is younger than
 *                   AGREEMENT_OPEN_DAYS; otherwise it is unacted and counted.
 *
 * A row whose `action` is not a known RoutingAction is dropped; a
 * `human_action` that is not a known HumanAction reads as no action. A
 * `lane: 'blocked'` row is a system safety refusal and is excluded.
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
  run_id?: string;
  action: string;
  rule_id: string;
  human_action: string | null;
  lane: string;
  persona_id: number | null;
  created_at: Date;
}

/** The person's card that owns an event at time t: the newest card created at or before t. */
function owningCard(cards: readonly DecisionRow[], t: number): DecisionRow | null {
  let owner: DecisionRow | null = null;
  for (const c of cards) {
    if (new Date(c.created_at).getTime() <= t) owner = c;
    else break;
  }
  return owner;
}

export async function loadAgreementReport(prisma: any, filters: AgreementFilters = {}): Promise<AgreementReport> {
  const now = filters.now ?? new Date();
  const select = { id: true, run_id: true, action: true, rule_id: true, human_action: true, lane: true, persona_id: true, created_at: true };
  // Every card (supersession and crediting read the person's whole history); the run filter scopes what is REPORTED.
  const rows: DecisionRow[] = await prisma.routingDecision.findMany({ where: {}, select });
  const all = rows.filter((r) => isRoutingAction(r.action) && r.lane !== 'blocked');
  const inScope = (r: DecisionRow) => !filters.runId || r.run_id === filters.runId;
  const sends = await loadSendRecords(prisma);
  const enrollStarts = await loadEnrollmentStarts(prisma);

  const cardsByPersona = new Map<number, DecisionRow[]>();
  const byId = new Map<string, DecisionRow>();
  for (const d of all) {
    byId.set(d.id, d);
    if (d.persona_id === null) continue;
    const list = cardsByPersona.get(d.persona_id);
    if (list) list.push(d);
    else cardsByPersona.set(d.persona_id, [d]);
  }
  for (const list of cardsByPersona.values()) list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // One credit per execution.
  const emailed = new Set<string>();
  for (const s of sends) {
    const filed = byId.get(s.decisionId);
    const owner = filed ?? (s.personaId !== null ? owningCard(cardsByPersona.get(s.personaId) ?? [], s.sentAt.getTime()) : null);
    if (owner) emailed.add(owner.id);
  }
  const enrolled = new Set<string>();
  for (const [personaId, starts] of enrollStarts) {
    for (const t of starts) {
      const owner = owningCard(cardsByPersona.get(personaId) ?? [], t);
      if (owner) enrolled.add(owner.id);
    }
  }

  // Episodes: consecutive identical recommendations for one person.
  const decisions: AgreementDecision[] = [];
  const openCutoff = now.getTime() - AGREEMENT_OPEN_DAYS * 86_400_000;
  const emit = (cards: DecisionRow[], isLatest: boolean) => {
    if (!cards.some(inScope)) return;
    const last = cards[cards.length - 1];
    const acted = [...cards].reverse().find((c) => isHumanAction(c.human_action));
    decisions.push({
      id: cards[0].id,
      action: last.action as RoutingAction,
      ruleId: last.rule_id,
      humanAction: acted ? (acted.human_action as HumanAction) : null,
      executedEmail: cards.some((c) => emailed.has(c.id)),
      executedEnroll: cards.some((c) => enrolled.has(c.id)),
      open: isLatest && new Date(last.created_at).getTime() >= openCutoff,
    });
  };
  for (const cards of cardsByPersona.values()) {
    let episode: DecisionRow[] = [];
    for (const c of cards) {
      if (episode.length && episode[episode.length - 1].action !== c.action) {
        emit(episode, false);
        episode = [];
      }
      episode.push(c);
    }
    if (episode.length) emit(episode, true);
  }
  for (const d of all) if (d.persona_id === null) emit([d], true);

  return computeAgreement(decisions);
}
