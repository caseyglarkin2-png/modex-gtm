/**
 * POST /api/gap/personas/[id]/angle   `{ text, source? }`   (Phase 2 C1)
 *
 * Record Casey's PersonaAngle: one line answering "why this person?".
 * `source` is `human` (typed) or `accepted_suggestion` (he accepted GAP's
 * suggested line, possibly edited). Append-only audit row; the newest wins.
 * Session only. 201 recorded; 400 empty / too long; 404 unknown person.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { ANGLE_MAX, setAngle } from '@/lib/gap/motion/persona-angle';

export const dynamic = 'force-dynamic';

const Body = z.object({ text: z.string().max(ANGLE_MAX * 2), source: z.enum(['human', 'accepted_suggestion']).optional() }).strict();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id ?? '')) return NextResponse.json({ error: 'invalid_query', field: 'id' }, { status: 400 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await setAngle(prisma, { personaId: Number(id), text: parsed.data.text, source: parsed.data.source ?? 'human', actor: email });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'persona_not_found' ? 404 : 400 });
  return NextResponse.json(r.angle, { status: 201 });
}
