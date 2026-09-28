/**
 * GET /api/gap/health   can Casey trust the GAP cockpit right now? (Phase 2 A3)
 *
 * Session only. Read only: bounded probes of the mailbox intake cron state,
 * HubSpot reads, the suppression contract, the GAP sender configuration and
 * the last completed routing run (src/lib/gap/health). 200 with the report,
 * whatever the dependencies say; the strip renders it. 404 when GAP is off.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { evaluateHealth } from '@/lib/gap/health/health';
import { loadHealthInputs } from '@/lib/gap/health/load';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const inputs = await loadHealthInputs(prisma);
  return NextResponse.json(evaluateHealth(inputs, new Date()), { headers: { 'cache-control': 'no-store' } });
}
