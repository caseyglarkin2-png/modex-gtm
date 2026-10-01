/**
 * POST /api/gap/decisions/[id]/copy-email   release this card's email text for COPY, after every gate
 *
 * Execution acceptance (2026-10-01). Casey's click: session only, behind the same flags as the draft. The text is
 * released only after the click-time gates of a draft and a direct send AND the cross-plane suppression contract
 * (src/lib/gap/execution/governed-copy.ts). Nothing is drafted or sent; nothing is recorded as drafted or sent.
 *
 * Status: 200 `{ ok: true, recipient, subject, text }`, 409 refused `{ error: <reason>, detail }`, 404 unknown
 * decision or flag off, 401 no session.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { releaseGovernedCopy } from '@/lib/gap/execution/governed-copy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const session = await auth();
  const email = session?.user?.email;
  if (typeof email !== 'string' || !email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ error: 'decision_not_found' }, { status: 404 });
  let stepIndex = 0;
  try {
    const raw = (await request.json()) as { stepIndex?: unknown } | null;
    stepIndex = typeof raw?.stepIndex === 'number' && Number.isInteger(raw.stepIndex) && raw.stepIndex >= 0 ? raw.stepIndex : 0;
  } catch {
    stepIndex = 0;
  }
  const r = await releaseGovernedCopy(prisma, { decisionId: id.trim(), actor: email, now: new Date(), stepIndex });
  if (!r.ok) return NextResponse.json({ error: r.reason, detail: r.detail ?? null }, { status: r.reason === 'decision_not_found' ? 404 : 409 });
  return NextResponse.json(r, { status: 200 });
}
