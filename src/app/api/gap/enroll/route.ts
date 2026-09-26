/**
 * POST /api/gap/enroll   enroll one persona in one version for one hypothesis
 *
 * GAP Prospecting OS, Sprint 3, S3-T12. Thin handler: the gate, auth and
 * shape validation live here; every rule lives in
 * `src/lib/gap/enroll/service.ts`, which wraps `enroll()` from
 * sequence/enrollment.ts and never re-implements its guards.
 *
 * Gate: `assertGapEnabled()` first, on every caller. Off answers 404 with
 * the skip payload `{skipped:true, reason:'GAP_OS_ENABLED=false'}` so a
 * monitor never mistakes "off" for "healthy".
 *
 * Auth: a session (a HUMAN actor), or an agent token in a HEADER only:
 * `x-gap-token`, `Authorization: Bearer` or `x-cron-secret` equal to
 * CRON_SECRET, or the queue agent's own Bearer (QUEUE_AGENT_SECRET). The
 * `?secret=` query form is never accepted (it lands in access logs). Agent
 * calls are `actor: 'cron'`, `actorKind: 'agent'`; the service refuses a
 * live enroll from an agent while GAP_AUTO_ENROLL_ENABLED is off.
 *
 * Body: `mode` defaults to `shadow`. `mode: 'live'` additionally requires
 * `confirm: true` (422 `confirm_required` otherwise) so a UI cannot enroll
 * live by leaving a field out. Status codes: 200 with the service result;
 * 409 with `{error: <reason>}` on a refusal; 400 unparsable JSON; 422 shape.
 *
 * N8: `sender` and `owner`, when given, must be one of SENDING_IDENTITIES
 * (the two identities that send: casey@yardflow.ai, casey@freightroll.com);
 * anything else is 422 `sender_not_allowed` / `owner_not_allowed` naming
 * the field, so a body cannot point a run at an identity nobody sends from.
 *
 * R3-13: the body carries NO `readback`. A HubSpot readback was a request
 * body claim, and a claim is not what HubSpot says. A body with a `readback`
 * key of any value is 422 `readback_not_accepted`. The enrollment-sync cron
 * (src/app/api/cron/gap-enrollment-sync/route.ts) is the only recorder of
 * hubspot_native enrollments; this route only emits the enroll-table row.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { enrollFromDecision, SENDING_IDENTITIES, type ActorKind } from '@/lib/gap/enroll/service';
import { addOne } from '@/app/discovery/queue-actions';

export const dynamic = 'force-dynamic';


const BodySchema = z.object({
  decisionId: z.string().min(1).optional(),
  hypothesisId: z.string().min(1),
  personaId: z.number().int().positive(),
  sequenceVersionId: z.string().min(1),
  compileIds: z.array(z.string().min(1)).min(1),
  mode: z.enum(['shadow', 'live']).default('shadow'),
  confirm: z.boolean().optional(),
  owner: z.string().email().optional(),
  sender: z.string().min(1).optional(),
});

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
  if (raw && typeof raw === 'object' && 'readback' in (raw as Record<string, unknown>)) {
    return NextResponse.json({ error: 'readback_not_accepted', field: 'readback' }, { status: 422 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', field: firstField(parsed.error) }, { status: 422 });
  }
  const input = parsed.data;

  if (input.mode === 'live' && input.confirm !== true) {
    return NextResponse.json({ error: 'confirm_required', field: 'confirm' }, { status: 422 });
  }
  if (input.sender !== undefined && !SENDING_IDENTITIES.includes(input.sender)) {
    return NextResponse.json({ error: 'sender_not_allowed', field: 'sender' }, { status: 422 });
  }
  if (input.owner !== undefined && !SENDING_IDENTITIES.includes(input.owner)) {
    return NextResponse.json({ error: 'owner_not_allowed', field: 'owner' }, { status: 422 });
  }

  const result = await enrollFromDecision(
    prisma,
    {
      decisionId: input.decisionId ?? null,
      hypothesisId: input.hypothesisId,
      personaId: input.personaId,
      sequenceVersionId: input.sequenceVersionId,
      compileIds: input.compileIds,
      actor,
      actorKind,
      mode: input.mode,
      now: new Date(),
      owner: input.owner ?? null,
      sender: input.sender ?? null,
    },
    { addOne },
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.reason, ...(result.detail ? { detail: result.detail } : {}) }, { status: 409 });
  }
  return NextResponse.json(result);
}
