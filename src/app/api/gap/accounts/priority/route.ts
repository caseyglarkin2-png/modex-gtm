/**
 * POST /api/gap/accounts/priority   `{ accountName, level: 'high' | 'clear', reason? }`   (GAP OS execution recovery, R41)
 *
 * The seller's explicit priority on one account, with a one-line reason (required for `high`): an append-only
 * `account.priority` row (lib/gap/work/priority.ts). Work reads it as a tie-break inside a tier and says so on the
 * card. Session only. 201 recorded; 404 unknown account; 400 a bad body. Nothing here sends, enrolls, writes HubSpot
 * or changes a thesis, a person or a suppression.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { PRIORITY_REASON_MAX, recordAccountPriority } from '@/lib/gap/work/priority';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    accountName: z.string().trim().min(1).max(200),
    level: z.enum(['high', 'clear']),
    reason: z.string().trim().max(PRIORITY_REASON_MAX).nullable().optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const r = await recordAccountPriority(prisma, { ...parsed.data, actor: g.email, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'account_not_found' ? 404 : 400 });
  return NextResponse.json(r, { status: 201 });
}
