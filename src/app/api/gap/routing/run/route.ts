/**
 * POST /api/gap/routing/run[?mode=apply][&dryRun=1]
 *
 * GAP Prospecting OS, Sprint 2, S2-T7. Runs the shadow routing pass and
 * returns its report. Every row it writes is `mode: shadow`; nothing here
 * enrolls or sends.
 *
 * Gate: `assertGapEnabled('GAP_ROUTING_ENABLED')` first; a flag off answers
 * 404 with the skip payload for every caller.
 *
 * Auth: a session, or the cron/agent tokens the hypotheses route accepts
 * (`x-gap-token` = CRON_SECRET, Bearer/x-cron-secret CRON_SECRET, Bearer
 * QUEUE_AGENT_SECRET). Agent callers act as `cron`.
 *
 * Mode: dry run by default, matching /api/cron/gap-hypothesize. Pass
 * `?mode=apply` to write rows; `?dryRun=1` or body `dryRun: true` forces a
 * dry run in every case.
 *
 * Body (JSON, optional): `{ accountNames?: string[], dryRun?: boolean, maxPairs?: number }`.
 * The same keys are accepted as query params for curl convenience.
 *
 * HubSpot: the per-account snapshot reads `yardflow_tam` through the existing
 * `getCompanyById` reader when the Account carries a hubspot_company_id.
 * That reader fetches no tier, intent or trigger fields, so the snapshot
 * carries TAM only; a missing id, no HubSpot config, or a failed read is a
 * null snapshot (tam unknown, routed to research).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { getCompanyById } from '@/lib/hubspot/companies';
import { DEFAULT_MAX_PAIRS, runRouting, snapshotFromCompany } from '@/lib/gap/routing/run';
import { createClawdSuppressionReader } from '@/lib/gap/routing/suppression-read';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MAX_PAIRS_CAP = 2000;

const BodySchema = z.object({
  accountNames: z.array(z.string().min(1)).min(1).max(500).optional(),
  dryRun: z.boolean().optional(),
  maxPairs: z.number().int().min(1).max(MAX_PAIRS_CAP).optional(),
});

function firstField(error: z.ZodError): string {
  return error.issues[0]?.path.map(String).join('.') || 'body';
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

/** Query params folded into the body shape so one schema validates both. */
function queryOverrides(request: NextRequest): Record<string, unknown> {
  const sp = request.nextUrl.searchParams;
  const raw: Record<string, unknown> = {};
  const names = sp.get('accountNames');
  if (names) raw.accountNames = names.split(',').map((s) => s.trim()).filter(Boolean);
  const maxPairs = sp.get('maxPairs');
  if (maxPairs) raw.maxPairs = Number.parseInt(maxPairs, 10);
  if (sp.get('dryRun') === '1') raw.dryRun = true;
  return raw;
}

async function hubspotSnapshot(_accountName: string, hubspotCompanyId: string | null) {
  if (!hubspotCompanyId) return null;
  try {
    return snapshotFromCompany(await getCompanyById(hubspotCompanyId));
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  const actor = email ?? (isGapAgentRequest(request) ? 'cron' : null);
  if (!actor) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: unknown = {};
  const text = await request.text();
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'invalid_body', field: 'body' }, { status: 400 });
    }
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'invalid_body', field: 'body' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse({ ...(body as Record<string, unknown>), ...queryOverrides(request) });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', field: firstField(parsed.error) }, { status: 400 });
  }

  const apply = request.nextUrl.searchParams.get('mode') === 'apply';
  const dryRun = parsed.data.dryRun === true || !apply;
  const now = new Date();

  try {
    const report = await runRouting(
      prisma,
      {
        now,
        actor,
        dryRun,
        maxPairs: parsed.data.maxPairs ?? DEFAULT_MAX_PAIRS,
        ...(parsed.data.accountNames ? { accountNames: parsed.data.accountNames } : {}),
      },
      { suppression: createClawdSuppressionReader(), hubspotSnapshot },
    );
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
