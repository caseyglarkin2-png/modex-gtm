/**
 * GET /api/gap/replies?state=undispositioned|all&cursor=&limit=
 *
 * GAP Prospecting OS, Sprint 4, S4-T3. The reply-triage list over
 * `src/lib/gap/replies/list.ts`. Gate first (404 skip payload when
 * GAP_OS_ENABLED is off), then auth: a session or a header token; `?secret=`
 * is never accepted. Contract: `{ items: [{ id, source, contactEmail,
 * personaId, accountName, hypothesisId, subject, snippet, receivedAt,
 * enrollmentId, suggestion? }], nextCursor }`. A bad `state` is 400
 * `{ error: 'invalid_query', field: 'state' }`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listReplies, type ReplyState } from '@/lib/gap/replies/list';

export const dynamic = 'force-dynamic';

const STATES: readonly ReplyState[] = ['undispositioned', 'all'];

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

export async function GET(request: NextRequest) {
  const skip = assertGapEnabled();
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  if (!email && !isGapAgentRequest(request)) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const stateRaw = params.get('state') ?? 'undispositioned';
  if (!(STATES as readonly string[]).includes(stateRaw)) {
    return NextResponse.json({ error: 'invalid_query', field: 'state' }, { status: 400 });
  }
  const cursor = params.get('cursor');
  const limitRaw = params.get('limit');
  const limit = limitRaw !== null && /^\d+$/.test(limitRaw) ? Number(limitRaw) : undefined;

  const page = await listReplies(prisma, { state: stateRaw as ReplyState, cursor: cursor && cursor.length > 0 ? cursor : null, limit });
  return NextResponse.json(page);
}
