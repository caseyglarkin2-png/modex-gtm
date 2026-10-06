/**
 * POST /api/gap/story/draft   (GAP OS execution recovery, R11, 2026-10-06)
 *
 * DRAFT A THESIS FROM A CHECKED FACT, from the account page's opening-story control, through the one service
 * (lib/gap/story/draft-from-fact.ts): the fact is gated, the family is derived or chosen, the draft is idempotent per
 * fact and person, a complete draft is submitted for review in the same call. Session only. Nothing here approves,
 * activates, routes, drafts an email or sends.
 *
 *   201 { ok: true, hypothesisId, status, existing, preparation, family, familyBasis, missing, submitRefusal }
 *   200 the same shape when the draft already existed (a retry)
 *   404 fact_not_found · 409 fact_not_outreach_evidence / signal_account_mismatch / a refused proposal
 *   400 invalid body or family
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { draftThesisFromFact } from '@/lib/gap/story/draft-from-fact';
import { PERSONAS, PROBLEM_FAMILIES } from '@/lib/gap/taxonomy';

export const dynamic = 'force-dynamic';

const Body = z
  .object({
    accountName: z.string().min(1).max(200),
    factId: z.string().min(1).max(64),
    personaId: z.number().int().positive().nullable(),
    persona: z.enum(PERSONAS),
    observation: z.string().min(1).max(4000),
    problemHypothesis: z.string().min(1).max(2000),
    falsificationQuestions: z.array(z.string().min(1).max(500)).min(1).max(5),
    whatANoMeans: z.string().max(1000).nullable().optional(),
    problemFamily: z.enum(PROBLEM_FAMILIES).nullable().optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const r = await draftThesisFromFact(prisma, { ...parsed.data, whatANoMeans: parsed.data.whatANoMeans ?? null, problemFamily: parsed.data.problemFamily ?? null, actor: email, now: new Date() });
  if (!r.ok) {
    const status = r.reason === 'fact_not_found' ? 404 : r.reason === 'invalid_family' ? 400 : 409;
    return NextResponse.json({ error: r.reason, ...(r.detail ? { detail: r.detail } : {}) }, { status });
  }
  return NextResponse.json(r, { status: r.existing ? 200 : 201 });
}
