/**
 * POST /api/gap/personas/[id]/anchor   `{ hypothesisId }`   (account-first UX, UX-06, Option A)
 *
 * USE A DIFFERENT STORY: record which approved, grounded thesis at the person's account is the outreach anchor for
 * this person. Append-only `persona.angle` audit row (the existing, auditable person-angle mechanism) carrying
 * `anchorHypothesisId`; the newest wins. It never sends, never bypasses approval, never widens the compiler's
 * evidence scope: the action pack simply opens on that thesis. Session only. 201 recorded; 400 bad body; 404 unknown
 * person; 409 when the thesis is not an open thesis at this person's account.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { setAnchor } from '@/lib/gap/motion/persona-angle';

export const dynamic = 'force-dynamic';

const Body = z.object({ hypothesisId: z.string().min(1).max(64) }).strict();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id ?? '')) return NextResponse.json({ error: 'invalid_query', field: 'id' }, { status: 400 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await setAnchor(prisma, { personaId: Number(id), hypothesisId: parsed.data.hypothesisId, actor: email });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'persona_not_found' ? 404 : r.reason === 'hypothesis_not_open_here' ? 409 : 400 });
  return NextResponse.json(r.anchor, { status: 201 });
}
