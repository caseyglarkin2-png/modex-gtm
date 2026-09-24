/**
 * GET /api/gap/queue/enroll-rows?runId=&format=md|json
 *
 * GAP Prospecting OS, Sprint 2, S2-T8. Renders the latest routing run's
 * `enroll_gap_sequence` decisions as the Top100 lane's hand-enroll table
 * (scripts/enroll-table.mjs shape). Read-only: nothing here enrolls, writes,
 * or calls HubSpot. A human copies the table and enrolls by hand.
 *
 * Gate: `assertGapEnabled('GAP_ROUTING_ENABLED')` first; a flag off answers
 * 404 with the skip payload, the same shape every GAP route uses. Session
 * only: this is an operator surface, not a cron one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import {
  buildEnrollRows,
  loadDecisions,
  renderEnrollTableJson,
  renderEnrollTableMarkdown,
} from '@/lib/gap/routing/enroll-row';

export const dynamic = 'force-dynamic';

const FORMATS = new Set(['md', 'json']);

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

export async function GET(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  if (!(await sessionEmail())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const format = sp.get('format') || 'md';
  if (!FORMATS.has(format)) return NextResponse.json({ error: 'invalid_query', field: 'format' }, { status: 400 });
  const runIdParam = sp.get('runId')?.trim();
  const runId = runIdParam ? runIdParam : undefined;

  const items = await loadDecisions(prisma, runId);
  const table = buildEnrollRows(items);

  if (format === 'json') {
    return NextResponse.json({ runId: runId ?? null, ...renderEnrollTableJson(table) });
  }
  return new NextResponse(renderEnrollTableMarkdown(table), {
    status: 200,
    headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'no-store' },
  });
}
