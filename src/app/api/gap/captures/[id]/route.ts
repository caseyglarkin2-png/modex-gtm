/**
 * GET  /api/gap/captures/[id]                                   the note and its candidates
 * POST /api/gap/captures/[id]  `{ op, ... }`                     (Phase 2 D1-D4)
 *   op link       `{ accountName, personaId? }`                 resolve an unlinked note
 *   op decide     `{ candidateId, decision: confirm|reject, type?, quote?, summary?, hypothesisId?, personaId?, contactEmail? }`
 *   op meeting    `{ outcome, hypothesisId, personaId?, contactEmail?, buyerQuote?, nextLearningObjective? }`
 *   op commitment `{ candidateId, decision, title?, dueDay?, personaId? }`  an obligation the note states -> a commitment (R44)
 *   op batch      `{ hypothesisId?, items: [{ candidateId, decision, type?, quote?, personaId?, title?, dueDay?, responseClass? }] }`
 *                 ONE review of the whole note, each item corrected on its own; the answer says per item what happened.
 *                 R60: on a note opened from a reply, the item "reply" is what the reply means: confirming it records
 *                 the disposition (once), and the statements kept in the same review link to it
 *
 * CONFIRM is the only way a candidate becomes Buyer Input Data: a human-
 * confirmed BID through the existing service, with the exact quote (re-checked
 * verbatim against the note). Session only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { BID_TYPES } from '@/lib/gap/taxonomy';
import { REPLY_KIND_CLASSES } from '@/lib/gap/capture/reply-kind';
import { MEETING_OUTCOMES, decideBatch, decideCandidate, decideCommitmentCandidate, linkCapture, loadCapture, recordMeetingOutcome } from '@/lib/gap/capture/store';

export const dynamic = 'force-dynamic';

const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('link'), accountName: z.string().min(1).max(200), personaId: z.number().int().positive().nullable().optional() }).strict(),
  z
    .object({
      op: z.literal('decide'),
      candidateId: z.string().min(1).max(20),
      decision: z.enum(['confirm', 'reject']),
      type: z.enum(BID_TYPES).optional(),
      quote: z.string().max(2000).optional(),
      summary: z.string().max(500).optional(),
      hypothesisId: z.string().min(1).max(64).optional(),
      personaId: z.number().int().positive().nullable().optional(),
      contactEmail: z.string().email().optional(),
    })
    .strict(),
  z
    .object({
      op: z.literal('meeting'),
      outcome: z.enum(MEETING_OUTCOMES),
      hypothesisId: z.string().min(1).max(64),
      personaId: z.number().int().positive().nullable().optional(),
      contactEmail: z.string().email().optional(),
      buyerQuote: z.string().max(2000).optional(),
      nextLearningObjective: z.string().max(300).optional(),
    })
    .strict(),
  z
    .object({
      op: z.literal('commitment'),
      candidateId: z.string().regex(/^k\d{1,2}$/),
      decision: z.enum(['confirm', 'reject']),
      title: z.string().max(200).optional(),
      dueDay: z.string().max(10).optional(),
      personaId: z.number().int().positive().nullable().optional(),
      // R63-A B1: who owes it (me or them), as the seller chose.
      owner: z.enum(['seller', 'buyer']).optional(),
    })
    .strict(),
  z
    .object({
      op: z.literal('batch'),
      hypothesisId: z.string().min(1).max(64).optional(),
      items: z
        .array(
          z
            .object({
              candidateId: z.string().min(1).max(20),
              decision: z.enum(['confirm', 'reject']),
              type: z.enum(BID_TYPES).optional(),
              quote: z.string().max(2000).optional(),
              personaId: z.number().int().positive().nullable().optional(),
              title: z.string().max(200).optional(),
              dueDay: z.string().max(10).optional(),
              // R60: on the reply item (candidateId "reply"), what the reply means.
              responseClass: z.enum(REPLY_KIND_CLASSES).optional(),
              // R63-A B1: on an obligation, who owes it.
              owner: z.enum(['seller', 'buyer']).optional(),
            })
            .strict(),
        )
        .min(1)
        .max(20),
    })
    .strict(),
]);

const STATUS: Record<string, number> = { capture_not_found: 404, candidate_not_found: 404, account_not_found: 404 };

async function sessionEmail(): Promise<string | null> {
  const email = (await auth())?.user?.email;
  return typeof email === 'string' && email.includes('@') ? email : null;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  if (!(await sessionEmail())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  const view = await loadCapture(prisma, id);
  return view ? NextResponse.json(view) : NextResponse.json({ error: 'capture_not_found' }, { status: 404 });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const b = parsed.data;
  const now = new Date();
  const r =
    b.op === 'link'
      ? await linkCapture(prisma, { captureId: id, accountName: b.accountName, personaId: b.personaId ?? null, actor: email })
      : b.op === 'decide'
        ? await decideCandidate(prisma, { captureId: id, ...b, actor: email, now })
        : b.op === 'commitment'
          ? await decideCommitmentCandidate(prisma, { captureId: id, ...b, actor: email, now })
          : b.op === 'batch'
            ? await decideBatch(prisma, { captureId: id, hypothesisId: b.hypothesisId ?? null, items: b.items, actor: email, now })
            : await recordMeetingOutcome(prisma, { captureId: id, ...b, actor: email, now });
  if (!r.ok) return NextResponse.json({ error: r.reason, detail: r.detail }, { status: STATUS[r.reason] ?? 409 });
  return NextResponse.json(r, { status: 200 });
}
