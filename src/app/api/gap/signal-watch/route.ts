/**
 * GET  /api/gap/signal-watch                        the watched priority accounts (mechanical profiles)
 * POST /api/gap/signal-watch  `{ accountName, addAliases?, removeAliases? }`   Casey's small alias correction
 *
 * GAP Signal Intelligence C. Watch profiles are generated from existing data;
 * this only lets Casey fix a wrong or missing alias. Search context, never
 * buyer truth. Session only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { correctWatch, loadWatchProfiles } from '@/lib/gap/signals/watch';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    accountName: z.string().min(1).max(200),
    addAliases: z.array(z.string().max(80)).max(10).optional(),
    removeAliases: z.array(z.string().max(80)).max(10).optional(),
  })
  .strict();

async function sessionEmail(): Promise<string | null> {
  const email = (await auth())?.user?.email;
  return typeof email === 'string' && email.includes('@') ? email : null;
}

export async function GET() {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  if (!(await sessionEmail())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  return NextResponse.json({ profiles: await loadWatchProfiles(prisma) });
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await correctWatch(prisma, { ...parsed.data, actor: email });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'account_not_found' ? 404 : 400 });
  return NextResponse.json({ ok: true });
}
