/**
 * POST /api/gap/account-sources   (research aperture: Casey's actions on a source card)
 *   `{ accountName, url, title?, publishedAt?, op: 'verify' | 'ignore' | 'wrong_account' }`
 * verify queues the source for the strict evidence check; ignore and wrong_account set it aside (never deleted).
 * Writes a signal row and an audit row only. No hypothesis, approval, activation, draft or send. Session only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { SOURCE_OPS, applySourceOp } from '@/lib/gap/sources/source-ops';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    accountName: z.string().min(1).max(200),
    url: z.string().min(8).max(2000),
    title: z.string().max(500).nullish(),
    publishedAt: z.string().max(40).nullish(),
    op: z.enum(SOURCE_OPS),
  })
  .strict();

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await applySourceOp(prisma, { ...parsed.data, actor: email, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason, detail: r.detail ?? null }, { status: r.reason === 'not_found' || r.reason === 'account_not_found' ? 404 : r.reason === 'other_account' ? 409 : 400 });
  return NextResponse.json(r);
}
