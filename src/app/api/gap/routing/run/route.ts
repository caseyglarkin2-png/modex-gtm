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
 * Auth: a session, or a HEADER carrying a token (`x-gap-token` = CRON_SECRET,
 * `Authorization: Bearer` or `x-cron-secret` = CRON_SECRET, Bearer
 * QUEUE_AGENT_SECRET). `?secret=` in the query is never accepted here (N1).
 * Agent callers act as `cron`.
 *
 * Mode: dry run by default, matching /api/cron/gap-hypothesize. Pass
 * `?mode=apply` to write rows; `?dryRun=1` or body `dryRun: true` forces a
 * dry run in every case.
 *
 * Body (JSON, optional): `{ accountNames?: string[], dryRun?: boolean, maxPairs?: number }`.
 * The same keys are accepted as query params for curl convenience.
 *
 * HubSpot: two READS per account, never a write. The company read
 * (`client.crm.companies.basicApi.getById`) fetches yardflow_tam, tam_tier,
 * intent_score, last_intent_at, trigger_score and last_trigger_at; the
 * contacts batch read (`client.crm.contacts.batchApi.read`, the same call
 * /api/cron/gap-enrollment-sync makes) fetches yardflow_qual_verdict and
 * last_intent_source for the account's contact-ready personas. `getCompanyById`
 * in companies.ts fetches yardflow_tam only, so it is not used here. When
 * HubSpot is not configured the provider answers null and routing proceeds
 * with tam unknown, which routes to research_required by design.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '@/lib/hubspot/client';
import { DEFAULT_MAX_PAIRS, createHubSpotSnapshotProvider, runRouting } from '@/lib/gap/routing/run';
import type { SnapshotReads } from '@/lib/gap/routing/run';
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

/**
 * Header-only agent auth (N1): `x-gap-token`, `Authorization: Bearer` or
 * `x-cron-secret` carrying CRON_SECRET, or the queue agent's own Bearer.
 * The shared cron helper also honors `?secret=`, which lands in access
 * logs, so it is deliberately NOT reused here.
 */
function isGapAgentRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('x-gap-token') === secret) return true;
    if (request.headers.get('authorization') === `Bearer ${secret}`) return true;
    if (request.headers.get('x-cron-secret') === secret) return true;
  }
  return isAuthorizedQueueAgent(request);
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

/** The SDK reads, wired here so the run module stays free of the HubSpot client. */
const hubspotReads: SnapshotReads = {
  async readCompany(hubspotCompanyId, properties) {
    const client = getHubSpotClient();
    const res = await withHubSpotRetry(
      () => client.crm.companies.basicApi.getById(hubspotCompanyId, [...properties]),
      `gap-routing company read (${hubspotCompanyId})`,
    );
    return res ? { properties: res.properties ?? {} } : null;
  },
  async readContacts(ids, properties) {
    const client = getHubSpotClient();
    const res = await withHubSpotRetry(
      () =>
        client.crm.contacts.batchApi.read({
          inputs: ids.map((id) => ({ id })),
          properties: [...properties],
          propertiesWithHistory: [],
        }),
      `gap-routing contacts batch read (${ids.length})`,
    );
    return (res.results ?? []).map((r) => ({ id: String(r.id), properties: r.properties ?? {} }));
  },
};

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
      {
        suppression: createClawdSuppressionReader(),
        hubspotSnapshot: createHubSpotSnapshotProvider(prisma, hubspotReads, { configured: isHubSpotConfigured }),
      },
    );
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
