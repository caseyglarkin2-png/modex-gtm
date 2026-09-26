/**
 * GET   /api/gap/hypotheses/[id]   one hypothesis with signals and events
 * PATCH /api/gap/hypotheses/[id]   `{action, reason?, outcome?}` runs a state
 *                                  machine transition; `{narrative: {...}}`
 *                                  edits the draft narrative
 *
 * GAP Prospecting OS, Sprint 1, S1-T9. Both verbs are session-only: a
 * transition is an operator decision and the actor is the operator's email.
 *
 * Gate: `assertGapEnabled('GAP_HYPOTHESIS_ENABLED')` first on every verb;
 * off means 404 with the skip payload for every caller (see ../route.ts).
 *
 * Status codes on PATCH:
 *   400 invalid_body   shape (unknown action, bad outcome, neither key)
 *   404 not_found      the service could not load the row
 *   409 <reason>       the machine or optimistic check refused
 *                      (ILLEGAL_TRANSITION:*, guard reasons, stale_status,
 *                      narrative_frozen)
 *   422 <reason>       a narrative validator refused the new text
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { getHypothesis, transitionHypothesis, updateDraftNarrative } from '@/lib/gap/hypothesis/service';
import { advanceHypothesis } from '@/lib/gap/hypothesis/thesis-groups';
import { routeAfterUse, type RouteAfterUseResult } from '@/lib/gap/routing/interactive';
import { PERSONAS, PROBLEM_FAMILIES, UNMAPPED_FAMILY } from '@/lib/gap/taxonomy';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** A hypothesis that just became active is routed at once (shadow recommendations only). */
async function routeIfNowActive(id: string, to: string | null | undefined, actor: string, now: Date): Promise<RouteAfterUseResult | null> {
  if (to !== 'active') return null;
  const row = await prisma.prospectingHypothesis.findUnique({ where: { id }, select: { primary_persona_id: true, primary_persona: { select: { name: true } } } });
  if (typeof row?.primary_persona_id !== 'number') return null;
  return routeAfterUse(prisma, { actor, now, people: [{ personaId: row.primary_persona_id, name: row.primary_persona?.name ?? null }] });
}

type RouteContext = { params: Promise<{ id: string }> };

const ActionSchema = z.object({
  action: z.enum(['submit', 'reject_review', 'approve', 'activate', 'resolve', 'close_unresolved', 'expire', 'withdraw']),
  reason: z.string().optional(),
  outcome: z.enum(['confirmed', 'partially_confirmed', 'rejected']).optional(),
});

const NarrativeSchema = z.object({
  narrative: z
    .object({
      problemFamily: z.enum([...PROBLEM_FAMILIES, UNMAPPED_FAMILY]).optional(),
      secondaryFamilies: z.array(z.enum(PROBLEM_FAMILIES)).optional(),
      persona: z.enum(PERSONAS).optional(),
      observation: z.string().optional(),
      problemHypothesis: z.string().optional(),
      rootCauseHypotheses: z.array(z.string()).optional(),
      impactHypotheses: z.array(z.string()).optional(),
      whyNow: z.string().nullable().optional(),
      falsificationQuestions: z.array(z.string()).optional(),
      whatANoMeans: z.string().nullable().optional(),
      contraryEvidence: z.string().nullable().optional(),
      predictedBuyerLanguage: z.string().nullable().optional(),
      buyingCenter: z.string().nullable().optional(),
      confidence: z.number().int().min(0).max(100).optional(),
      signalIds: z.array(z.string().min(1)).optional(),
      primarySignalId: z.string().nullable().optional(),
    })
    .strict(),
});

function firstField(error: z.ZodError): string {
  return error.issues[0]?.path.map(String).join('.') || 'body';
}

function invalidBody(field: string) {
  return NextResponse.json({ error: 'invalid_body', field }, { status: 400 });
}

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  if (!(await sessionEmail())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await params;
  const row = await getHypothesis(prisma, id);
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  const actor = await sessionEmail();
  if (!actor) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidBody('body');
  }
  if (typeof body !== 'object' || body === null) return invalidBody('action');
  const keys = body as Record<string, unknown>;
  const { id } = await params;

  // APPROVE + USE IN ROUTING / APPROVE ONLY in one click: the ordinary
  // transitions in order (submit, approve[, activate]), each audited.
  if (keys.advance !== undefined) {
    const parsed = z.object({ advance: z.enum(['approve', 'approve_and_use']) }).strict().safeParse(body);
    if (!parsed.success) return invalidBody('advance');
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id }, select: { status: true } });
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const use = parsed.data.advance === 'approve_and_use';
    const now = new Date();
    const r = await advanceHypothesis(prisma, id, row.status, { use, actor, now, reason: use ? 'approve + use in routing' : 'approve only' });
    const routing = r.ok && r.from !== 'active' ? await routeIfNowActive(id, r.to, actor, now) : null;
    return NextResponse.json({ ...r, ...(routing ? { routing } : {}) }, { status: r.ok ? 200 : 409 });
  }

  if (keys.action !== undefined) {
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) return invalidBody(firstField(parsed.error));
    const { action, reason, outcome } = parsed.data;

    const now = new Date();
    const result = await transitionHypothesis(prisma, id, action, { now, actor, reason, outcome });
    if (!result.ok) {
      const status = result.reason === 'not_found' ? 404 : 409;
      return NextResponse.json({ error: result.reason }, { status });
    }
    const routing = action === 'activate' ? await routeIfNowActive(id, result.to, actor, now) : null;
    return NextResponse.json({ from: result.from, to: result.to, effects: result.effects, ...(routing ? { routing } : {}) });
  }

  if (keys.narrative !== undefined) {
    const parsed = NarrativeSchema.safeParse(body);
    if (!parsed.success) return invalidBody(firstField(parsed.error));

    const result = await updateDraftNarrative(prisma, id, parsed.data.narrative, actor);
    if (!result.ok) {
      const status = result.reason === 'not_found' ? 404 : result.reason === 'narrative_frozen' ? 409 : 422;
      return NextResponse.json({ error: result.reason }, { status });
    }
    return NextResponse.json({ id: result.id, status: result.status });
  }

  return invalidBody('action');
}
