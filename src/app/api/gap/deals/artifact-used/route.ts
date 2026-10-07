/**
 * POST /api/gap/deals/artifact-used   `{ accountName, dealId, kind, textHash }`
 *
 * Batch item 8 (R53, 2026-10-07): the seller copied a prepared deal artifact (to send it from their own email). One
 * append-only `deal.artifact_used` row on the account records it, so the next artifact moves on: a recap copied (or
 * written to HubSpot through the approved CRM change) is not offered as the next move again until the buyer says
 * something new. Session only. Nothing here sends, writes HubSpot or changes a deal. 201 recorded; 404 unknown account;
 * 400 bad.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';
import { ARTIFACT_KINDS, ARTIFACT_USED } from '@/lib/gap/deals/artifacts';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    accountName: z.string().trim().min(1).max(200),
    dealId: z.string().trim().min(1).max(64),
    kind: z.enum(ARTIFACT_KINDS),
    textHash: z.string().trim().min(1).max(64),
  })
  .strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const b = parsed.data;
  const account = await prisma.account.findUnique({ where: { name: b.accountName }, select: { name: true } });
  if (!account) return NextResponse.json({ error: 'account_not_found' }, { status: 404 });
  const row = await prisma.gapAuditEvent.create({ data: { kind: ARTIFACT_USED, actor: g.email, subject_type: 'account', subject_id: account.name, payload: { dealId: b.dealId, kind: b.kind, textHash: b.textHash, how: 'copied' } } });
  return NextResponse.json({ ok: true, id: String(row.id) }, { status: 201 });
}
