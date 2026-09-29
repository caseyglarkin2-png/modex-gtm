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
import { buildAccountBrief } from '@/lib/gap/account-intel/build';
import { loadResearchHistory, planResearch } from '@/lib/gap/account-intel/orchestrate';
import { runEvidenceResearch } from '@/lib/gap/research/run';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({ accountName: z.string().trim().min(1).max(300), section: z.enum(['catalysts', 'footprint', 'technology', 'freight']) }).strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const { accountName, section } = parsed.data;
  const now = new Date();
  const inputs = await loadAccountInputs(prisma, accountName, now, { live: true });
  if (!inputs) return NextResponse.json({ error: 'account_not_found' }, { status: 404 });
  const plan = planResearch(buildAccountBrief(inputs, now), await loadResearchHistory(prisma, accountName, now), now);
  const task = plan.tasks.find((t) => t.section === section && t.provider === 'research');
  if (!task) return NextResponse.json({ error: 'not_in_plan', reason: plan.skipped.find((s) => s.section === section)?.reason ?? 'The plan does not ask for this section now.' }, { status: 409 });
  const result = await runEvidenceResearch(prisma, { accountName, personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: g.email, now, focus: task.focus, context: { orchestrator: 'deepen', section } });
  return NextResponse.json({ section, outcome: result.outcome, facts: result.facts.length, rejected: result.rejected.length, notes: result.notes });
}
