/**
 * GET /api/gap/learning
 *
 * GAP Prospecting OS, Sprint 5. The learning report over
 * `src/lib/gap/learning/query.ts`: the hypothesis funnel, the conversation
 * funnel, every breakdown, the disposition distribution and signal yield.
 * Gate first (404 skip payload when GAP_OS_ENABLED is off, same contract
 * every other GAP route uses), then auth: a session or a header token;
 * `?secret=` is never accepted.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { buildLearningReport, listLearningPrograms, type LearningFilters } from '@/lib/gap/learning/query';

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

/** R-A: `?program=`, `?from=`, `?to=` (ISO dates, inclusive). An invalid date is ignored, not a 400: a bad filter degrades to unfiltered, never a broken dashboard. */
function parseFilters(request: NextRequest): LearningFilters {
  const params = request.nextUrl.searchParams;
  const program = params.get('program');
  const parseDate = (key: string): Date | null => {
    const raw = params.get(key);
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  return { program: program?.trim() || null, from: parseDate('from'), to: parseDate('to') };
}

export async function GET(request: NextRequest) {
  const skip = assertGapEnabled();
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  if (!email && !isGapAgentRequest(request)) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const filters = parseFilters(request);
  const [report, programs] = await Promise.all([buildLearningReport(prisma, filters), listLearningPrograms(prisma)]);
  return NextResponse.json({ ...report, filters, programs });
}
