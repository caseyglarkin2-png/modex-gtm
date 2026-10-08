/**
 * GET /api/gap/health   can Casey trust the GAP cockpit right now? (Phase 2 A3)
 *
 * Session only. Read only: bounded probes of the mailbox intake cron state,
 * HubSpot reads, the suppression contract, the GAP sender configuration and
 * the last completed routing run (src/lib/gap/health). 200 with the report,
 * whatever the dependencies say; the strip renders it. 404 when GAP is off.
 *
 * GET /api/gap/health?operations=1   R65: plus `operations` (lib/gap/health/operations.ts), the operator's view:
 *   broken handoffs, the research queue's age, the dead letter, research cost, preparation latency, seller
 *   corrections, outcomes and the HubSpot changes pending or failed with their owners and where to retry.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { evaluateHealth } from '@/lib/gap/health/health';
import { loadHealthInputs } from '@/lib/gap/health/load';
import { evaluateOperations, loadOperationsInputs } from '@/lib/gap/health/operations';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const now = new Date();
  // R65: `?operations=1` adds what the operator must repair (broken handoffs, the research queue and dead letter,
  // research cost, preparation latency, HubSpot changes that failed, with owners and where to retry). The Work strip
  // calls this route on every Work load without it, so it stays light.
  const withOps = request.nextUrl.searchParams.get('operations') === '1';
  const [inputs, ops] = await Promise.all([loadHealthInputs(prisma), withOps ? loadOperationsInputs(prisma, now) : Promise.resolve(null)]);
  return NextResponse.json({ ...evaluateHealth(inputs, now), ...(ops ? { operations: evaluateOperations(ops, now) } : {}) }, { headers: { 'cache-control': 'no-store' } });
}
