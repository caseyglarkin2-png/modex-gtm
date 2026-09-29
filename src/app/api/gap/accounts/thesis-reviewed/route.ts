/**
 * POST /api/gap/accounts/thesis-reviewed   `{ hypothesisId }`
 * Casey looked at a thesis GAP flagged THESIS NEEDS REVIEW and keeps it as it is. One audit row; the thesis is
 * not touched (no status change, no rewrite). Changes after this moment flag it again.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { badBody, intakeGuard } from '@/lib/gap/intake/route-helpers';

export const dynamic = 'force-dynamic';

const Body = z.object({ hypothesisId: z.string().trim().min(1).max(64) }).strict();

export async function POST(request: NextRequest) {
  const g = await intakeGuard();
  if ('response' in g) return g.response;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badBody(parsed.error.issues);
  const h = await prisma.prospectingHypothesis.findUnique({ where: { id: parsed.data.hypothesisId }, select: { id: true, status: true, account_name: true } });
  if (!h) return NextResponse.json({ error: 'hypothesis_not_found' }, { status: 404 });
  if (h.status !== 'approved' && h.status !== 'active') return NextResponse.json({ error: 'not_approved', reason: 'Only an approved or active thesis can be marked reviewed.' }, { status: 409 });
  await prisma.gapAuditEvent.create({ data: { kind: 'thesis.review_ack', actor: g.email, subject_type: 'hypothesis', subject_id: h.id, payload: { accountName: h.account_name } } });
  return NextResponse.json({ ok: true });
}
