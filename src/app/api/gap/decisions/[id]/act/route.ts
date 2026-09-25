/**
 * POST /api/gap/decisions/[id]/act   body `{ action: string }`
 *
 * GAP Prospecting OS, Sprint 2, S2-T7. Records what the operator did with a
 * routing decision: one of `HUMAN_ACTIONS` in taxonomy.ts; anything else is
 * 400 field action. The UI ("I did this" / "I did something else") always
 * submits a HumanAction, never a RoutingAction string -- see
 * `src/lib/gap/routing/agreement.ts`'s `RECOMMENDED_HUMAN_ACTION`.
 * The stamp is write-once: 200 `{ok:true}` the first time, 409
 * `{error:'already_acted'}` after, 404 `{error:'not_found'}` for an unknown id.
 * Session only; this is a human's record, never a system's.
 *
 * Gate: `assertGapEnabled('GAP_ROUTING_ENABLED')` first; a flag off answers
 * 404 with the skip payload.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { recordHumanAction } from '@/lib/gap/routing/queue';
import { HUMAN_ACTIONS } from '@/lib/gap/taxonomy';

export const dynamic = 'force-dynamic';

/** `action` is closed to HUMAN_ACTIONS (N3); anything else is 400 naming the field. */
const BodySchema = z.object({
  action: z.enum(HUMAN_ACTIONS),
});

function firstField(error: z.ZodError): string {
  return error.issues[0]?.path.map(String).join('.') || 'body';
}

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await context.params;
  if (!id || !id.trim()) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body', field: 'body' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', field: firstField(parsed.error) }, { status: 400 });
  }

  const result = await recordHumanAction(prisma, id.trim(), parsed.data.action, email);
  if (!result.ok) {
    const status = result.reason === 'not_found' ? 404 : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true });
}
