/**
 * POST   /api/gap/hypotheses/[id]/signals              `{signalIds}` link facts
 * DELETE /api/gap/hypotheses/[id]/signals?signalId=    unlink one fact
 *
 * GAP Prospecting OS, Sprint 2, S2-T10. Session-only: a link is an operator
 * edit and the actor is the operator's email. Both verbs are allowed only
 * while the hypothesis is draft or review_required; the service holds that
 * rule and the DB trigger backs it.
 *
 * Gate: `assertGapEnabled('GAP_HYPOTHESIS_ENABLED')` first on every verb;
 * off means 404 with the skip payload for every caller (see ../../route.ts).
 *
 * Status codes:
 *   400 invalid_body / invalid_query   shape
 *   404 not_found                       the service could not load the row
 *   409 narrative_frozen                the row left review (or moved under us)
 *   409 signal_cited                    the observation still cites the signal (N5)
 *   422 <reason>                        unknown_signal:<id>, no_signals, not_linked,
 *                                       signal_account_mismatch (R2-9)
 *   200 {linked, already} / {unlinked}
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { linkSignals, unlinkSignal } from '@/lib/gap/hypothesis/service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const LinkSchema = z.object({ signalIds: z.array(z.string().min(1)).min(1) });

const CONFLICT_REASONS: ReadonlySet<string> = new Set(['narrative_frozen', 'signal_cited']);

function firstField(error: z.ZodError): string {
  return error.issues[0]?.path.map(String).join('.') || 'body';
}

function refusalStatus(reason: string): number {
  if (reason === 'not_found') return 404;
  return CONFLICT_REASONS.has(reason) ? 409 : 422;
}

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  const actor = await sessionEmail();
  if (!actor) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body', field: 'body' }, { status: 400 });
  }
  const parsed = LinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', field: firstField(parsed.error) }, { status: 400 });
  }

  const { id } = await params;
  const result = await linkSignals(prisma, id, parsed.data.signalIds, actor);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: refusalStatus(result.reason) });
  return NextResponse.json({ linked: result.linked, already: result.already });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  const actor = await sessionEmail();
  if (!actor) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const signalId = (request.nextUrl.searchParams.get('signalId') ?? '').trim();
  if (!signalId) return NextResponse.json({ error: 'invalid_query', field: 'signalId' }, { status: 400 });

  const { id } = await params;
  const result = await unlinkSignal(prisma, id, signalId, actor);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: refusalStatus(result.reason) });
  return NextResponse.json({ unlinked: result.unlinked });
}
