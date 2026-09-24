/**
 * GET /api/gap/routing/agreement
 *
 * R-B (owner-confirmed finish requirement, 2026-09-24): routing
 * recommendation vs actual human action, over every RoutingDecision.
 * `?runId=` scopes to one routing run. Same gate/auth contract as every
 * other GAP route: 404 skip payload when GAP_OS_ENABLED is off, then a
 * session or a header token; `?secret=` is never accepted.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { loadAgreementReport } from '@/lib/gap/routing/agreement-query';

export const dynamic = 'force-dynamic';

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

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

  const runId = request.nextUrl.searchParams.get('runId');
  const report = await loadAgreementReport(prisma, { runId: runId || null });
  return NextResponse.json(report);
}
