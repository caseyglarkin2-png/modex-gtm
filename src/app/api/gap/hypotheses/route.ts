/**
 * GET  /api/gap/hypotheses   list (session only)
 * POST /api/gap/hypotheses   propose (session, or a cron/agent token)
 *
 * GAP Prospecting OS, Sprint 1, S1-T9. Thin handlers: the gate, auth and
 * shape validation live here; every rule lives in the hypothesis service.
 *
 * Gate: `assertGapEnabled('GAP_HYPOTHESIS_ENABLED')` runs first on every
 * verb. When a flag is off the route answers 404 with the skip payload
 * (`{skipped:true, reason:'<FLAG>=false'}`) for EVERY caller, browser or
 * cron. One code, one shape, so a monitor never mistakes "off" for "healthy".
 *
 * Agent auth for POST: `x-gap-token` equal to CRON_SECRET, or either existing
 * helper (Bearer/x-cron-secret CRON_SECRET, Bearer QUEUE_AGENT_SECRET).
 * Agent-created rows carry `createdBy: 'cron'`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listHypotheses, proposeHypothesis } from '@/lib/gap/hypothesis/service';
import { HYPOTHESIS_STATUSES, PERSONAS, PROBLEM_FAMILIES, UNMAPPED_FAMILY } from '@/lib/gap/taxonomy';

export const dynamic = 'force-dynamic';

const FAMILY_OR_UNMAPPED = z.enum([...PROBLEM_FAMILIES, UNMAPPED_FAMILY]);
const STATUS = z.enum(HYPOTHESIS_STATUSES);

const QuerySchema = z.object({
  status: z.array(STATUS).min(1).optional(),
  account: z.string().min(1).optional(),
  family: FAMILY_OR_UNMAPPED.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().min(1).optional(),
});

const ProposeSchema = z.object({
  accountName: z.string().min(1),
  primaryPersonaId: z.number().int().nullable().optional(),
  persona: z.enum(PERSONAS),
  problemFamily: FAMILY_OR_UNMAPPED,
  secondaryFamilies: z.array(z.enum(PROBLEM_FAMILIES)).optional(),
  observation: z.string().min(1),
  problemHypothesis: z.string().min(1),
  rootCauseHypotheses: z.array(z.string()),
  impactHypotheses: z.array(z.string()),
  whyNow: z.string().nullable().optional(),
  falsificationQuestions: z.array(z.string()),
  whatANoMeans: z.string().nullable().optional(),
  contraryEvidence: z.string().nullable().optional(),
  predictedBuyerLanguage: z.string().nullable().optional(),
  buyingCenter: z.string().nullable().optional(),
  confidence: z.number().int().min(0).max(100),
  signalIds: z.array(z.string().min(1)).min(1),
  primarySignalId: z.string().nullable().optional(),
  sourceRef: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
});

function firstField(error: z.ZodError): string {
  return error.issues[0]?.path.map(String).join('.') || 'body';
}

/** A query param is flat to the caller, so `status.0` reports as `status`. */
function firstQueryParam(error: z.ZodError): string {
  return String(error.issues[0]?.path[0] ?? 'query');
}

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

function isGapAgentRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const token = request.headers.get('x-gap-token');
  if (secret && token === secret) return true;
  return isAuthorizedCronRequest(request) || isAuthorizedQueueAgent(request);
}

export async function GET(request: NextRequest) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  if (!(await sessionEmail())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const raw: Record<string, unknown> = {};
  const statusParam = sp.get('status');
  if (statusParam) raw.status = statusParam.split(',').map((s) => s.trim());
  for (const key of ['account', 'family', 'limit', 'cursor'] as const) {
    const value = sp.get(key);
    if (value !== null && value !== '') raw[key] = value;
  }

  const parsed = QuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query', field: firstQueryParam(parsed.error) }, { status: 400 });
  }
  const { status, account, family, limit, cursor } = parsed.data;

  const result = await listHypotheses(prisma, {
    ...(status ? { status } : {}),
    ...(account ? { accountName: account } : {}),
    ...(family ? { problemFamily: family } : {}),
    limit,
    ...(cursor ? { cursor } : {}),
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  const createdBy = email ?? (isGapAgentRequest(request) ? 'cron' : null);
  if (!createdBy) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body', field: 'body' }, { status: 400 });
  }
  const parsed = ProposeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', field: firstField(parsed.error) }, { status: 400 });
  }

  const result = await proposeHypothesis(prisma, { ...parsed.data, createdBy });
  if (!result.ok) {
    if (result.reason === 'duplicate_source_ref') {
      return NextResponse.json({ error: result.reason, existingId: result.existingId }, { status: 409 });
    }
    return NextResponse.json({ error: result.reason }, { status: 422 });
  }
  return NextResponse.json({ id: result.id, status: result.status }, { status: 201 });
}
