/**
 * POST /api/gap/accounts/outcome   `{ accountName, kind: 'skipped' | 'snoozed' | 'logged' | 'clear', reason?, until? }`
 * (GAP OS execution recovery, R14, 2026-10-06)
 *
 * What the seller DID with a Work item, recorded as an append-only `account.work_outcome` row (lib/gap/work/
 * outcome.ts): skip it for today, snooze it until a date, or note it was handled outside GAP. Navigation records
 * nothing; this does. The account's remembered pursuit summary is dropped so the next Work load reflects it.
 * Session only. 201 recorded; 200 with `existing: true` when the same outcome was already recorded today (R63-B S3: a
 * stale tab's second press writes nothing); 404 unknown account; 400 a bad body or date. Nothing here sends, enrolls, writes
 * HubSpot or changes a thesis, a person or a suppression.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { OUTCOME_REASON_MAX, recordWorkOutcome } from '@/lib/gap/work/outcome';
import { forgetPursuitSummary } from '@/lib/gap/pursuit/summary';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    accountName: z.string().trim().min(1).max(200),
    kind: z.enum(['skipped', 'snoozed', 'logged', 'clear']),
    reason: z.string().trim().max(OUTCOME_REASON_MAX).nullable().optional(),
    until: z.string().trim().max(40).nullable().optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const r = await recordWorkOutcome(prisma, { ...parsed.data, actor: g.email });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === 'account_not_found' ? 404 : 400 });
  if (r.existing) return NextResponse.json(r, { status: 200 });
  await forgetPursuitSummary(prisma, parsed.data.accountName);
  return NextResponse.json(r, { status: 201 });
}
