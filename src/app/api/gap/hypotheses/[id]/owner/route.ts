/**
 * GET  /api/gap/hypotheses/[id]/owner   OWNER RESOLUTION for this hypothesis (read-only, no Apollo, no write)
 * POST /api/gap/hypotheses/[id]/owner   `{ personaId }` or `{ hubspotContactId }`, `activate?` (default true):
 *                                        USE THIS PERSON, one governed action (import if HubSpot-only, check,
 *                                        assign, activate, targeted shadow route), every step audited, fail closed
 *
 * Owner resolution (2026-10-05). Session only: the choice is Casey's click. Behind GAP_HYPOTHESIS_ENABLED.
 * 200 the result (ok true), 409 the result with the step that stopped (ok false), 404 unknown hypothesis.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { loadOwnerResolution } from '@/lib/gap/people/owner-resolution-load';
import { applyOwnerToHypothesis } from '@/lib/gap/people/owner-action';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

const Body = z
  .object({ personaId: z.number().int().positive().optional(), hubspotContactId: z.string().trim().min(1).max(40).optional(), activate: z.boolean().optional() })
  .strict()
  .refine((b) => (b.personaId !== undefined) !== (b.hubspotContactId !== undefined), { message: 'exactly one of personaId or hubspotContactId' });

async function sessionEmail(): Promise<string | null> {
  const email = (await auth())?.user?.email;
  return typeof email === 'string' && email.includes('@') ? email : null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  if (!(await sessionEmail())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await params;
  const row = await prisma.prospectingHypothesis.findUnique({ where: { id }, select: { account_name: true } });
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const r = await loadOwnerResolution(prisma, { accountName: row.account_name, purpose: 'HYPOTHESIS_ACTIVATION', hypothesisId: id, now: new Date() });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 404 });
  return NextResponse.json({ resolution: r.resolution, hubspot: r.hubspot });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const actor = await sessionEmail();
  if (!actor) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const { id } = await params;
  const r = await applyOwnerToHypothesis(prisma, { hypothesisId: id, candidate: { personaId: parsed.data.personaId ?? null, hubspotContactId: parsed.data.hubspotContactId ?? null }, activate: parsed.data.activate ?? true, actor, now: new Date() });
  const notFound = r.steps[0]?.step === 'check' && r.steps[0].reason === 'not_found';
  return NextResponse.json(r, { status: notFound ? 404 : r.ok ? 200 : 409 });
}
