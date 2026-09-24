/**
 * POST /api/gap/dispositions   record what a reply, call or meeting meant
 *
 * GAP Prospecting OS, Sprint 4, S4-T3. Thin handler over
 * `src/lib/gap/disposition/service.ts`: the gate, auth and the zod shape
 * live here; every rule and every effect lives in the service.
 *
 * Gate: `assertGapEnabled()` first, on every caller (404 with the typed
 * skip payload when GAP_OS_ENABLED is off).
 *
 * Auth: a session is a HUMAN actor (the row is confirmed and its effects
 * run); a header token (`x-gap-token`, `Authorization: Bearer` or
 * `x-cron-secret` equal to CRON_SECRET, or the queue agent's Bearer) is an
 * AGENT actor: the service writes an UNCONFIRMED row only, with no effects,
 * for a human to confirm. `?secret=` in the query is never accepted.
 *
 * Contract (spec Sprint 4): body `{ hypothesisId, personaId?, contactEmail,
 * channel, responseClass, rootCauseClass?, impactClass?, objection?,
 * buyerLanguage?, nextBestAction?, source: { kind, id }, bids?, aiSuggestionId? }`
 * -> 201 `{ dispositionId, bidIds, effects: { stopped, unsubscribed,
 * resolution, mirrored }, refusals }`; 400 `{ error: 'invalid_body', field }`;
 * 409 `{ error: reason }` (`duplicate_source` also carries `existingId`,
 * `hypothesis_not_active`, `suppressed_target_mismatch`, and the other
 * service refusals). Optional widening, never required: `resumeAt` (timing)
 * and `referral: { name?, title?, email? }` (referral) land in the row's
 * metadata; an agent row answers 201 with `effects: 'none'`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import type { ActorKind } from '@/lib/gap/enroll/service';
import { DISPOSITION_SOURCE_KINDS, recordDisposition } from '@/lib/gap/disposition/service';
import { BID_TYPES, CHANNELS, RESPONSE_CLASSES } from '@/lib/gap/taxonomy';

export const dynamic = 'force-dynamic';

const BidSchema = z
  .object({
    type: z.enum(BID_TYPES),
    rawBuyerLanguage: z.string().min(1),
    normalizedSummary: z.string().optional(),
    numericValue: z.union([z.number(), z.string()]).optional(),
    unit: z.string().optional(),
  })
  .strict();

const BodySchema = z
  .object({
    hypothesisId: z.string().min(1),
    personaId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    contactEmail: z.string().min(3),
    channel: z.enum(CHANNELS),
    responseClass: z.enum(RESPONSE_CLASSES),
    rootCauseClass: z.string().optional(),
    impactClass: z.string().optional(),
    objection: z.string().optional(),
    buyerLanguage: z.string().optional(),
    nextBestAction: z.string().optional(),
    source: z.object({ kind: z.enum(DISPOSITION_SOURCE_KINDS), id: z.string().min(1) }).strict(),
    bids: z.array(BidSchema).max(20).optional(),
    aiSuggestionId: z.string().min(1).optional(),
    resumeAt: z.string().datetime({ offset: true }).optional(),
    referral: z.object({ name: z.string().optional(), title: z.string().optional(), email: z.string().optional() }).strict().optional(),
  })
  .strict();

function firstField(error: z.ZodError): string {
  return error.issues[0]?.path.map(String).join('.') || 'body';
}

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

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled();
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  const actor = email ?? (isGapAgentRequest(request) ? 'cron' : null);
  if (!actor) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const actorKind: ActorKind = email ? 'human' : 'agent';

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body', field: 'body' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', field: firstField(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const result = await recordDisposition(prisma, {
    hypothesisId: body.hypothesisId,
    personaId: body.personaId ?? null,
    contactEmail: body.contactEmail,
    channel: body.channel,
    responseClass: body.responseClass,
    rootCauseClass: body.rootCauseClass ?? null,
    impactClass: body.impactClass ?? null,
    objection: body.objection ?? null,
    buyerLanguage: body.buyerLanguage ?? null,
    nextBestAction: body.nextBestAction ?? null,
    source: body.source,
    bids: body.bids,
    aiSuggestionId: body.aiSuggestionId ?? null,
    resumeAt: body.resumeAt ?? null,
    referral: body.referral ?? null,
    actor,
    actorKind,
    now: new Date(),
  });

  if (!result.ok) {
    if (result.kind === 'invalid_body') {
      return NextResponse.json({ error: 'invalid_body', field: result.field, reason: result.reason }, { status: 400 });
    }
    return NextResponse.json(
      { error: result.reason, ...(result.existingId ? { existingId: result.existingId } : {}) },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { dispositionId: result.dispositionId, bidIds: result.bidIds, effects: result.effects, refusals: result.refusals },
    { status: 201 },
  );
}
