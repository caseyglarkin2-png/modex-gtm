/**
 * POST /api/gap/hypotheses/[id]/sibling-note   `{signalId}`
 *
 * "Applies to: shared thesis siblings". The fact/note (already linked to this
 * hypothesis by the normal add-fact flow) is linked to every EDITABLE sibling
 * of the same account thesis; a frozen sibling (approved/active narrative) is
 * not mutated, the note is recorded against it for review. Existing links and
 * person-specific notes are never removed or overwritten. Per-row results.
 * Session only; GAP_HYPOTHESIS_ENABLED.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { applyNoteToSiblings } from '@/lib/gap/hypothesis/thesis-groups';

export const dynamic = 'force-dynamic';

const Body = z.object({ signalId: z.string().min(1) }).strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: 'signalId' }, { status: 400 });
  const { id } = await params;
  const r = await applyNoteToSiblings(prisma, { sourceHypothesisId: id, signalId: parsed.data.signalId, actor: email, now: new Date() });
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
