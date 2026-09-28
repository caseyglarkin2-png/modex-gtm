/**
 * POST /api/gap/signal-intake/[id]   (GAP Signal Intelligence)
 *   `{ op: 'assign', accountName }`  Casey names the account
 *   `{ op: 'research' }`             follow it up (resolved + link required)
 *   `{ op: 'ignore' }`               not pursuing it
 *   `{ op: 'feedback', value }`      use | irrelevant | wrong_account | already_knew | good_context | not_sayable
 * Writes the signal row (and an audit row) only. Session only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { SIGNAL_FEEDBACK, applySignalOp } from '@/lib/gap/signals/ops';

export const dynamic = 'force-dynamic';

const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('assign'), accountName: z.string().min(1).max(200) }).strict(),
  z.object({ op: z.literal('research') }).strict(),
  z.object({ op: z.literal('ignore') }).strict(),
  z.object({ op: z.literal('feedback'), value: z.enum(SIGNAL_FEEDBACK) }).strict(),
]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await applySignalOp(prisma, { id, actor: email, now: new Date(), ...parsed.data });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'not_found' ? 404 : 400 });
  return NextResponse.json(r.signal);
}
