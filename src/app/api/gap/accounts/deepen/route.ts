/**
 * POST /api/gap/accounts/deepen   `{ accountName, section }`
 * DEEPEN one section of one account (Casey's click): the server re-plans from the live brief and refuses a
 * section the plan does not ask for (known and fresh, recently empty, or a question only a human can answer).
 * The run goes through the ONE verification contract (research/run.ts): every excerpt is re-fetched at its own
 * source before it becomes a fact. Never creates, approves or activates a hypothesis; never drafts or sends.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { loadAccountInputs } from '@/lib/gap/account-intel/load';
import { buildAccountBrief, type SectionKey } from '@/lib/gap/account-intel/build';
import { loadResearchHistory, planResearch } from '@/lib/gap/account-intel/orchestrate';
import { runEvidenceResearch } from '@/lib/gap/research/run';
import { scoutCandidate } from '@/lib/gap/entity/candidates';
import { scoutRefusalStatus } from '@/lib/gap/entity/providers';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({ accountName: z.string().trim().min(1).max(300), section: z.enum(['identity', 'catalysts', 'footprint', 'technology', 'freight']) }).strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const { accountName, section } = parsed.data;
  const now = new Date();
  const inputs = await loadAccountInputs(prisma, accountName, now, { live: true });
  if (!inputs) return NextResponse.json({ error: 'account_not_found' }, { status: 404 });
  const name = inputs.account.name;
  // Fails closed: without the history GAP cannot know what already ran.
  const history = await loadResearchHistory(prisma, name, now).catch(() => null);
  if (!history) return NextResponse.json({ error: 'history_unavailable', reason: 'Could not read what already ran on this account; nothing was started.' }, { status: 503 });
  const plan = planResearch(buildAccountBrief(inputs, now), history, now);
  const task = plan.tasks.find((t) => t.section === section && t.provider === 'research');
  if (!task) return NextResponse.json({ error: 'not_in_plan', reason: plan.skipped.find((s) => s.section === section)?.reason ?? 'The plan does not ask for this section now.' }, { status: 409 });
  // One focused run; no side trip for currentness on unrelated facts (it would blur this section's outcome).
  if (section === 'identity') {
    // SCOUT depth: what the company is and what it operates (the same Scout as candidates; nothing is created).
    const r = await scoutCandidate(prisma, { company: name, actor: g.email, now });
    await prisma.gapAuditEvent.create({ data: { kind: 'research.completed', actor: g.email, subject_type: 'account', subject_id: name, payload: { orchestrator: 'deepen', section, outcome: 'refused' in r ? r.refused : r.verdict } } }).catch(() => null);
    if ('refused' in r) return NextResponse.json({ error: r.refused, reason: r.why ?? 'Scout could not run now; nothing was saved.' }, { status: scoutRefusalStatus(r.refused) });
    return NextResponse.json({ section, outcome: 'scouted', fit: r.verdict, entityType: r.entityType, facts: r.network.length + r.freight.length, rejected: 0, notes: [r.why] });
  }
  const before = buildAccountBrief(inputs, now).sections[section as SectionKey]?.statements.length ?? 0;
  const result = await runEvidenceResearch(prisma, { accountName: name, personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: g.email, now, focus: task.focus, context: { orchestrator: 'deepen', section }, seekCurrentness: false });
  // The section's own outcome: did this section gain anything? A web pass that could not run learned nothing.
  const webDown = result.notes.some((n) => /^web: unavailable/.test(n));
  const after = !result.facts.length ? before : await loadAccountInputs(prisma, name, new Date()).then((i) => (i ? buildAccountBrief(i, new Date()).sections[section as SectionKey]?.statements.length ?? 0 : before)).catch(() => before);
  // Filled beats everything; otherwise a web outage (even with an EDGAR fact elsewhere) is retryable, not empty.
  const sectionOutcome = after > before ? 'section_filled' : webDown ? 'provider_unavailable' : 'nothing_for_section';
  try {
    const run = await prisma.researchRun.findUnique({ where: { id: result.runId }, select: { provider_status: true } });
    if (run) await prisma.researchRun.update({ where: { id: result.runId }, data: { provider_status: { ...((run.provider_status as object) ?? {}), sectionOutcome } } });
  } catch {
    // The run's own outcome still stands; the planner reads it when the section outcome could not be saved.
  }
  return NextResponse.json({ section, outcome: result.outcome, sectionOutcome, facts: result.facts.length, sources: result.sources?.length ?? 0, rejected: result.rejected.length, notes: result.notes });
}
