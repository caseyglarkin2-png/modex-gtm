/**
 * POST /api/gap/feedback   `{ note, type?, context? }`   a dogfood note (stabilization E)
 * GET  /api/gap/feedback   the backlog, newest first
 *
 * The note is the only required field. Context is reduced to a safe allowlist server-side (feedback.ts); the build
 * SHA is the server's own. Nothing here touches seller state, code or any outside system. Session only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { FEEDBACK_TYPES, NOTE_MAX, createNote, listFeedback } from '@/lib/gap/feedback/feedback';

export const dynamic = 'force-dynamic';

const Body = z.object({ note: z.string().max(NOTE_MAX + 100), type: z.enum(FEEDBACK_TYPES).nullish(), context: z.unknown().optional() });

async function session() {
  const email = (await auth())?.user?.email;
  return typeof email === 'string' && email.includes('@') ? email : null;
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = await session();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await createNote(prisma, { ...parsed.data, actor: email, now: new Date(), build: process.env.VERCEL_GIT_COMMIT_SHA ?? null });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json(r);
}

export async function GET() {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  if (!(await session())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  return NextResponse.json({ items: await listFeedback(prisma) });
}
