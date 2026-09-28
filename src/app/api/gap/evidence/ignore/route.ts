/**
 * POST /api/gap/evidence/ignore   `{ signalId, reason? }`   (Phase 2 B2)
 *
 * IGNORE in the Verified Evidence Inbox: appends one `evidence.ignored` audit
 * row (append-only) so that exact candidate stops being surfaced. Research
 * history is never deleted and the fact itself is untouched. Session only.
 * 201 recorded, 200 already ignored, 404 unknown signal or GAP off.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { EVIDENCE_IGNORED } from '@/lib/gap/research/inbox';

export const dynamic = 'force-dynamic';

const Body = z.object({ signalId: z.string().min(1).max(64), reason: z.string().max(300).optional() }).strict();

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const { signalId, reason } = parsed.data;
  const signal = await prisma.prospectingSignal.findUnique({ where: { id: signalId }, select: { id: true, account_name: true } });
  if (!signal) return NextResponse.json({ error: 'signal_not_found' }, { status: 404 });
  const already = await prisma.gapAuditEvent.findFirst({ where: { kind: EVIDENCE_IGNORED, subject_type: 'prospecting_signal', subject_id: signalId }, select: { id: true } });
  if (already) return NextResponse.json({ ok: true, alreadyIgnored: true }, { status: 200 });
  await prisma.gapAuditEvent.create({
    data: { kind: EVIDENCE_IGNORED, actor: email, subject_type: 'prospecting_signal', subject_id: signalId, payload: { accountName: signal.account_name, reason: reason ?? null } },
  });
  return NextResponse.json({ ok: true, alreadyIgnored: false }, { status: 201 });
}
