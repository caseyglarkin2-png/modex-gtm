/**
 * POST /api/gap/decisions/[id]/send   SEND FROM YARDFLOW
 *
 *   `{ stepIndex? }`                               preview: the final email, sends nothing
 *   `{ stepIndex?, confirm: { contentHash, recipient } }`   CONFIRM + SEND: one email
 *
 * Session only. There is deliberately no agent token, cron secret or query
 * secret path: a HUMAN_APPROVED_1TO1 send exists only because a signed-in
 * person pressed CONFIRM + SEND. Every gate is re-run in
 * src/lib/gap/execution/seller-send.ts; the wire re-checks the confirmation.
 *
 * Status: 200 preview / already sent, 201 sent, 409 refused `{ error, detail }`,
 * 404 unknown decision or flag off, 401 no session, 400 bad body.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { sendSellerEmail } from '@/lib/gap/execution/seller-send';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z
  .object({
    stepIndex: z.number().int().min(0).max(20).optional(),
    confirm: z.object({ contentHash: z.string().regex(/^[0-9a-f]{64}$/), recipient: z.string().email() }).strict().optional(),
  })
  .strict();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ error: 'decision_not_found' }, { status: 404 });

  const result = await sendSellerEmail(prisma, {
    decisionId: id.trim(),
    actor: email,
    now: new Date(),
    stepIndex: parsed.data.stepIndex ?? 0,
    confirm: parsed.data.confirm ?? null,
  });
  if (!result.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ok: _ok, reason, ...rest } = result;
    return NextResponse.json({ error: reason, ...rest }, { status: reason === 'decision_not_found' ? 404 : 409 });
  }
  if ('preview' in result || result.alreadySent) return NextResponse.json(result, { status: 200 });
  return NextResponse.json(result, { status: 201 });
}
