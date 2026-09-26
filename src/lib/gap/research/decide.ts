/**
 * Casey's ONE decision on a research proposal (debt burn, 2026-09-26).
 *
 * RESEARCH THIS finds evidence and the machine proposes a draft thesis for the
 * card's people (propose.ts). Casey reads that narrative inline and decides
 * once:
 *
 *   approve_and_use   the ordinary legal transitions per row (submit, approve,
 *                     activate), each audited by transitionHypothesis, then the
 *                     people now in use are routed (targeted, shadow
 *                     recommendations only; nothing drafts or sends).
 *   reject            withdraw each still-open draft (audited). Nothing is
 *                     contacted.
 *
 * Only drafts this research run proposed can be decided here (source_ref
 * research:<runId>[:p<personaId>]); anything else is refused, never moved.
 * Voice: no em dashes.
 */
import { transitionHypothesis } from '../hypothesis/service';
import { advanceHypothesis, type SiblingResult } from '../hypothesis/thesis-groups';
import { routeAfterUse as defaultRouteAfterUse, type RouteAfterUseResult } from '../routing/interactive';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type ProposalDecision = 'approve_and_use' | 'reject';

export type DecideProposalResult =
  | { ok: boolean; results: SiblingResult[]; routing: RouteAfterUseResult | null }
  | { ok: false; reason: 'not_found' | 'not_from_this_research'; ids: string[] };

const OPEN = new Set(['draft', 'review_required', 'approved']);

export function isFromResearchRun(sourceRef: string | null | undefined, runId: string): boolean {
  return sourceRef === `research:${runId}` || (typeof sourceRef === 'string' && sourceRef.startsWith(`research:${runId}:p`));
}

export async function decideResearchProposal(
  prisma: PrismaLike,
  input: { researchRunId: string; hypothesisIds: string[]; decision: ProposalDecision; actor: string; now: Date },
  deps: { transition?: typeof transitionHypothesis; routeAfterUse?: typeof defaultRouteAfterUse } = {},
): Promise<DecideProposalResult> {
  const transition = deps.transition ?? transitionHypothesis;
  const ids = [...new Set(input.hypothesisIds)];
  const rows: Array<{ id: string; status: string; source_ref: string | null; primary_persona_id: number | null; primary_persona: { name: string | null } | null }> =
    await prisma.prospectingHypothesis.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, source_ref: true, primary_persona_id: true, primary_persona: { select: { name: true } } },
    });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) return { ok: false, reason: 'not_found', ids: missing };
  const foreign = ids.filter((id) => !isFromResearchRun(byId.get(id)!.source_ref, input.researchRunId));
  if (foreign.length > 0) return { ok: false, reason: 'not_from_this_research', ids: foreign };

  const reason = `research proposal ${input.researchRunId}: ${input.decision === 'reject' ? 'rejected' : 'approve + use'}`;
  const ctx = { now: input.now, actor: input.actor, reason };
  const results: SiblingResult[] = [];
  for (const id of ids) {
    const row = byId.get(id)!;
    if (input.decision === 'approve_and_use') {
      results.push(await advanceHypothesis(prisma, id, row.status, { use: true, ...ctx }, transition));
      continue;
    }
    if (!OPEN.has(row.status)) {
      results.push({ hypothesisId: id, ok: false, from: row.status, to: null, detail: `cannot reject from ${row.status}` });
      continue;
    }
    const w = await transition(prisma, id, 'withdraw', ctx);
    results.push(w.ok ? { hypothesisId: id, ok: true, from: row.status, to: 'rejected', detail: 'rejected' } : { hypothesisId: id, ok: false, from: row.status, to: null, detail: `reject refused: ${w.reason}` });
  }

  const inUse = results
    .filter((r) => r.ok && r.to === 'active')
    .map((r) => byId.get(r.hypothesisId)!)
    .filter((r) => typeof r.primary_persona_id === 'number')
    .map((r) => ({ personaId: r.primary_persona_id as number, name: r.primary_persona?.name ?? null }));
  const routing = inUse.length > 0 ? await (deps.routeAfterUse ?? defaultRouteAfterUse)(prisma, { actor: input.actor, now: input.now, people: inUse }) : null;
  return { ok: results.every((r) => r.ok), results, routing };
}
