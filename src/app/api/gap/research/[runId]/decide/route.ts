/**
 * POST /api/gap/research/[runId]/decide   `{ hypothesisIds, decision }`
 *
 * Casey's one decision on the thesis RESEARCH THIS proposed (debt burn,
 * 2026-09-26): `approve_and_use` runs the audited submit/approve/activate
 * transitions and routes the people now in use (shadow recommendations only;
 * `routing` says where each landed); `reject` withdraws the drafts. Only
 * drafts this run proposed are accepted (409 otherwise). Never drafts or
 * sends. Session only; gated like every hypothesis route.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { decideResearchProposal } from '@/lib/gap/research/decide';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const Body = z.object({ hypothesisIds: z.array(z.string().min(1)).min(1).max(25), decision: z.enum(['approve_and_use', 'reject']) }).strict();

export async function POST(request: NextRequest, context: { params: Promise<{ runId: string }> }) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const { runId } = await context.params;
  const r = await decideResearchProposal(prisma, { researchRunId: runId.trim(), hypothesisIds: parsed.data.hypothesisIds, decision: parsed.data.decision, actor: email, now: new Date() });
  if ('reason' in r) return NextResponse.json({ error: r.reason, ids: r.ids }, { status: r.reason === 'not_found' ? 404 : 409 });
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
