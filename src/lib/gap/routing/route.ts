/**
 * GAP deterministic router (Sprint 2, S2-T6). Spec section 6.
 *
 * `routePersona(inputs)` takes the first matching rule from `RULES`, builds the
 * decision (priority, target, explain) and runs `assertExplainClean` so a
 * private-intent leak throws here rather than reaching a queue row. Pure and
 * deterministic: the same inputs always produce a deep-equal result.
 */

import { assertExplainClean, buildExplain } from './explain';
import { RULES, firstMatchingRule, priorityFor, resolveEnrollTarget } from './rules';
import type { RoutingRule } from './rules';
import type { RouteResult, RoutingDecision, RoutingInputs } from './types';

export function routePersona(inputs: RoutingInputs, rules: RoutingRule[] = RULES): RouteResult {
  const rule = firstMatchingRule(inputs, rules);

  if (rule.skip) {
    return { kind: 'skip', ruleId: rule.id, reason: rule.skip };
  }
  if (!rule.action || !rule.lane) {
    throw new Error(`routing rule ${rule.id} has neither a skip nor an action and lane`);
  }

  const explain = buildExplain(inputs, rule, rules);
  assertExplainClean(explain);

  const decision: RoutingDecision = {
    action: rule.action,
    lane: rule.lane,
    ruleId: rule.id,
    priority: priorityFor(inputs, rule),
    blocked: rule.blocked === true,
    explain,
  };
  const reason = rule.reason?.(inputs);
  if (reason) decision.reason = reason;
  if (rule.action === 'enroll_gap_sequence') decision.target = resolveEnrollTarget(inputs);

  return { kind: 'decision', decision };
}

export function routeAll(inputsList: RoutingInputs[], rules: RoutingRule[] = RULES): RouteResult[] {
  return inputsList.map((inputs) => routePersona(inputs, rules));
}
