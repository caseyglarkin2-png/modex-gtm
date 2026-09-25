/**
 * POST /api/gap/research   body `{ decisionId }`   RESEARCH THIS
 *
 * Runs the evidence-acquisition workflow (src/lib/gap/research/run.ts) for the
 * card's account, person, problem family and current hypothesis. Session only.
 * Reads public sources and writes only research records (ResearchRun,
 * EvidenceRecord, ProspectingSignal, one audit row). Never creates, edits or
 * activates a hypothesis; never drafts or sends.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { runEvidenceResearch } from '@/lib/gap/research/run';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const Body = z.object({ decisionId: z.string().min(1) }).strict();

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED', 'GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: 'decisionId' }, { status: 400 });

  const decision = await prisma.routingDecision.findUnique({
    where: { id: parsed.data.decisionId },
    select: { id: true, account_name: true, persona_id: true, hypothesis_id: true },
  });
  if (!decision) return NextResponse.json({ error: 'decision_not_found' }, { status: 404 });
  const hypothesis = decision.hypothesis_id
    ? await prisma.prospectingHypothesis.findUnique({ where: { id: decision.hypothesis_id }, select: { id: true, problem_family: true } })
    : null;

  const result = await runEvidenceResearch(prisma, {
    accountName: decision.account_name,
    personaId: decision.persona_id,
    hypothesisId: hypothesis?.id ?? null,
    problemFamily: hypothesis?.problem_family ?? null,
    decisionId: decision.id,
    actor: email,
    now: new Date(),
  });
  return NextResponse.json(result);
}
