/**
 * POST /api/gap/accounts/motion   `{ accountName, primaryPersonaId, nextPersonaId? }`   (Phase 2 C2)
 *
 * Casey's choice of PRIMARY (and optional NEXT) person for an account's cold
 * email motion. Append-only audit row; the newest wins. It changes which card
 * is READY; it never sends, drafts or enrolls, and every send gate still runs
 * (one motion per account is enforced there). Session only.
 * 201 recorded; 409 a person is not at the account / primary equals next.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { recordMotionChoice } from '@/lib/gap/motion/load';

export const dynamic = 'force-dynamic';

const Body = z.object({ accountName: z.string().min(1).max(200), primaryPersonaId: z.number().int().positive(), nextPersonaId: z.number().int().positive().nullable().optional() }).strict();

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await recordMotionChoice(prisma, { accountName: parsed.data.accountName, primaryPersonaId: parsed.data.primaryPersonaId, nextPersonaId: parsed.data.nextPersonaId ?? null, actor: email });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 409 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
