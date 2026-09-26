/**
 * GET /api/gap/queue?runId=&cursor=&limit=&action=&lane=&rule=
 *
 * GAP Prospecting OS, Sprint 2, S2-T7. Pages the current decisions (each
 * person's newest applicable card from any run; `runId` pages one run
 * instead), highest priority first, with a keyset cursor. Read-only, session only:
 * this is the operator's work queue, not a cron surface.
 *
 * Gate: `assertGapEnabled('GAP_ROUTING_ENABLED')` first; a flag off answers
 * 404 with the skip payload. A bad query answers 400 `{error:'invalid_query', field}`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { DEFAULT_QUEUE_LIMIT, MAX_QUEUE_LIMIT, listQueue } from '@/lib/gap/routing/queue';
import { ROUTING_ACTIONS, ROUTING_LANES } from '@/lib/gap/taxonomy';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  runId: z.string().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_QUEUE_LIMIT).default(DEFAULT_QUEUE_LIMIT),
  action: z.enum(ROUTING_ACTIONS).optional(),
  lane: z.enum(ROUTING_LANES).optional(),
  rule: z.string().min(1).optional(),
});

function firstQueryParam(error: z.ZodError): string {
  return String(error.issues[0]?.path[0] ?? 'query');
}

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
  const raw: Record<string, unknown> = {};
  for (const key of ['runId', 'cursor', 'limit', 'action', 'lane', 'rule'] as const) {
    const value = sp.get(key);
    if (value !== null && value !== '') raw[key] = value;
  }

  const parsed = QuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query', field: firstQueryParam(parsed.error) }, { status: 400 });
  }
  const { runId, cursor, limit, action, lane, rule } = parsed.data;

  const result = await listQueue(prisma, {
    ...(runId ? { runId } : {}),
    ...(cursor ? { cursor } : {}),
    limit,
    ...(action ? { action } : {}),
    ...(lane ? { lane } : {}),
    ...(rule ? { ruleId: rule } : {}),
  });
  return NextResponse.json(result);
}
