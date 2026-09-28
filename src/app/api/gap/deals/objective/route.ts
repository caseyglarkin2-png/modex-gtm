/**
 * POST /api/gap/deals/objective   `{ accountName, text }`   (Phase 2 F3)
 *
 * Record Casey's next learning objective for an account in a deal. Append-only
 * audit row (`deal.learning_objective`); the newest wins. Nothing is written
 * to HubSpot. Session only. 201 recorded; 400 empty / too long; 404 unknown account.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { OBJECTIVE_MAX, setLearningObjective } from '@/lib/gap/deals/deal-brief';

export const dynamic = 'force-dynamic';

const Body = z.object({ accountName: z.string().min(1).max(200), text: z.string().max(OBJECTIVE_MAX * 2) }).strict();

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await setLearningObjective(prisma, { accountName: parsed.data.accountName, text: parsed.data.text, actor: email });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'account_not_found' ? 404 : 400 });
  return NextResponse.json(r.objective, { status: 201 });
}
