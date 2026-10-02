/**
 * POST /api/gap/feedback/[id]   `{ status: 'open' | 'later' | 'fixed' | 'dismissed' }`
 * Appends a status row to the note (the audit table is append-only). Nothing else changes. Session only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { FEEDBACK_STATUSES, setFeedbackStatus } from '@/lib/gap/feedback/feedback';

export const dynamic = 'force-dynamic';

const Body = z.object({ status: z.enum(FEEDBACK_STATUSES) }).strict();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const r = await setFeedbackStatus(prisma, { id, status: parsed.data.status, actor: email, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 404 });
  return NextResponse.json(r);
}
