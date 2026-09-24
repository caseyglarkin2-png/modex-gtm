/**
 * POST /api/gap/bids   capture (or correct) one Buyer Input Data row
 *
 * GAP Prospecting OS, Sprint 4, S4-T3. Thin handler over
 * `src/lib/gap/bid/service.ts` (`recordBid`). Gate, auth and zod here; the
 * append-only rules live in bid/capture.ts.
 *
 * Contract: body `{ hypothesisId, contactEmail, dispositionId?, type,
 * rawBuyerLanguage, normalizedSummary?, numericValue?, unit?, source,
 * supersedesId? }` -> 201 `{ bidId, humanConfirmed, supersedesId }`.
 * A session (human) row is confirmed on capture; a header-token (agent) row
 * is unconfirmed. `supersedesId` makes it a correction: a NEW row that
 * supersedes the old one, which is never edited. 400 `{ error:
 * 'invalid_body', field }`, 409 `{ error: reason }`. `?secret=` is never
 * accepted.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import type { ActorKind } from '@/lib/gap/enroll/service';
import { recordBid } from '@/lib/gap/bid/service';
import { BID_SOURCES, BID_TYPES } from '@/lib/gap/taxonomy';

export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    hypothesisId: z.string().min(1),
    contactEmail: z.string().min(3),
    dispositionId: z.string().min(1).optional(),
    type: z.enum(BID_TYPES),
    rawBuyerLanguage: z.string().min(1),
    normalizedSummary: z.string().optional(),
    numericValue: z.union([z.number(), z.string()]).optional(),
    unit: z.string().optional(),
    source: z.enum(BID_SOURCES),
    supersedesId: z.string().min(1).optional(),
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

  const result = await recordBid(prisma, {
    hypothesisId: body.hypothesisId,
    contactEmail: body.contactEmail,
    dispositionId: body.dispositionId ?? null,
    type: body.type,
    rawBuyerLanguage: body.rawBuyerLanguage,
    normalizedSummary: body.normalizedSummary ?? null,
    numericValue: body.numericValue ?? null,
    unit: body.unit ?? null,
    source: body.source,
    supersedesId: body.supersedesId ?? null,
    actor,
    actorKind,
    now: new Date(),
  });

  if (!result.ok) {
    if (result.kind === 'invalid_body') {
      return NextResponse.json({ error: 'invalid_body', field: result.field, reason: result.reason }, { status: 400 });
    }
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }
  return NextResponse.json(
    { bidId: result.bidId, humanConfirmed: result.humanConfirmed, supersedesId: result.supersedesId },
    { status: 201 },
  );
}
