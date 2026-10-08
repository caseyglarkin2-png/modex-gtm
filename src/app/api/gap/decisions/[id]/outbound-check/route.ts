/**
 * POST /api/gap/decisions/[id]/outbound-check   body `{ channel: 'call' | 'linkedin' }`
 *
 * Last mile (2026-09-27): the action-time HubSpot active-opportunity check
 * before a cold CALL or LINKEDIN action from a GAP card, the same check email
 * draft / send / enroll run (src/lib/gap/execution/cold-outbound.ts).
 *
 * 200 `{ ok: true, channel, href }` CLEAR: the tel: / LinkedIn link to act on.
 * 409 `{ ok: false, reason, message }` ACTIVE or UNKNOWN (fail closed), no link.
 * 404 unknown card or flag off, 401 no session, 400 bad body. The one write (X16a): a CLEAR call release records
 * `call.attempt_started` (self-reported; never a call until its outcome is recorded). Fail-open.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { checkColdOutbound } from '@/lib/gap/execution/cold-outbound';
import { recordCallAttempt } from '@/lib/gap/execution/call-attempt';
import { OPPORTUNITY_UNKNOWN_COPY } from '@/lib/gap/opportunity/active-opportunity';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const Body = z.object({ channel: z.enum(['call', 'linkedin']) }).strict();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: 'channel' }, { status: 400 });
  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ ok: false, reason: 'decision_not_found' }, { status: 404 });

  try {
    const now = new Date();
    const result = await checkColdOutbound(prisma, { decisionId: id.trim(), channel: parsed.data.channel, now });
    if (result.ok) {
      await recordCallAttempt(prisma, { decisionId: id.trim(), accountName: result.accountName, personaId: result.personaId, channel: result.channel, actor: email, now });
      return NextResponse.json(result, { status: 200 });
    }
    return NextResponse.json(result, { status: result.reason === 'decision_not_found' ? 404 : 409 });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'opportunity_unknown', message: `${OPPORTUNITY_UNKNOWN_COPY} (${e instanceof Error ? e.message : String(e)})` }, { status: 409 });
  }
}
