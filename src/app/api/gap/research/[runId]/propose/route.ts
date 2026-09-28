/**
 * POST /api/gap/research/[runId]/propose   PROPOSE UPDATED HYPOTHESIS
 *
 * Creates a DRAFT hypothesis from a research run's fresh verified facts
 * (src/lib/gap/research/propose.ts). Session only. Never submits, approves or
 * activates it: Casey reviews it like any draft.
 *
 * Optional body `{ personaIds }` (a RESEARCH group): the same draft for every
 * person in the group, so they come back to REVIEW as one shared thesis.
 * Optional `{ signalIds }` (Phase 2 B2, the Evidence Inbox): the exact
 * verified fact(s) chosen, the first one the opener; still gated.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { proposeFromResearch } from '@/lib/gap/research/propose';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, context: { params: Promise<{ runId: string }> }) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { runId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { personaIds?: unknown; signalIds?: unknown };
  const personaIds = Array.isArray(body?.personaIds) ? body.personaIds.filter((x): x is number => Number.isInteger(x)).slice(0, 25) : undefined;
  const signalIds = Array.isArray(body?.signalIds) ? body.signalIds.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 64).slice(0, 5) : undefined;
  const r = await proposeFromResearch(prisma, { researchRunId: runId.trim(), actor: email, now: new Date(), ...(personaIds?.length ? { personaIds } : {}), ...(signalIds?.length ? { signalIds } : {}) });
  if (!r.ok && 'existingRevision' in r) return NextResponse.json({ error: r.reason, existingRevision: r.existingRevision }, { status: 409 });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'run_not_found' ? 404 : 409 });
  return NextResponse.json(r, { status: r.existing ? 200 : 201 });
}
