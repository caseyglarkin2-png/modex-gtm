/**
 * GET /api/gap/call/[personaId]   the pre-call brief
 *
 * GAP Prospecting OS, Sprint 4, S4-T3. Read-only, over
 * `src/lib/gap/replies/brief.ts`. Gate first (404 skip payload when
 * GAP_OS_ENABLED is off), then auth: a session or a header token; `?secret=`
 * is never accepted. Contract: `{ persona, account, hypothesis (FACT and
 * HYPOTHESIS blocks, wouldProveWrong) | null, lastDispositions, openBids,
 * suggestedQuestions }`. A non-numeric id is 400 `{ error: 'invalid_query',
 * field: 'personaId' }`; an unknown persona is 404 `{ error: 'not_found' }`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { callBrief } from '@/lib/gap/replies/brief';

export const dynamic = 'force-dynamic';

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

/** Header tokens only. The `?secret=` query form is deliberately not honoured. */
function isGapAgentRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('x-gap-token') === secret) return true;
    if (request.headers.get('authorization') === `Bearer ${secret}`) return true;
    if (request.headers.get('x-cron-secret') === secret) return true;
  }
  return isAuthorizedQueueAgent(request);
}

export async function GET(request: NextRequest, context: { params: Promise<{ personaId: string }> }) {
  const skip = assertGapEnabled();
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  if (!email && !isGapAgentRequest(request)) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { personaId } = await context.params;
  const raw = decodeURIComponent(personaId ?? '').trim();
  if (!/^\d+$/.test(raw)) return NextResponse.json({ error: 'invalid_query', field: 'personaId' }, { status: 400 });

  const brief = await callBrief(prisma, Number(raw));
  if (!brief) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(brief);
}
