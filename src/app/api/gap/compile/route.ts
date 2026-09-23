/**
 * POST /api/gap/compile   run the message compiler on one step's copy
 *
 * GAP Prospecting OS, Sprint 3, S3-T9. Thin handler: the gate, auth, shape
 * validation and copy loading live here; the verdict rule lives in
 * `src/lib/gap/compiler/compile.ts`, the approval row in `approval.ts`.
 *
 * Gate: `assertGapEnabled('GAP_MESSAGE_COMPILER_ENABLED')` first, on every
 * caller. Off answers 404 with the skip payload `{skipped:true,
 * reason:'<FLAG>=false'}` so a monitor never mistakes "off" for "healthy".
 *
 * Auth: a session, or an agent token in a HEADER only: `x-gap-token` or
 * `Authorization: Bearer` or `x-cron-secret` equal to CRON_SECRET, or the
 * queue agent's own Bearer (QUEUE_AGENT_SECRET). `?secret=` is never
 * accepted here (it lands in access logs), which is why this route does not
 * reuse `isAuthorizedCronRequest`. Agent compiles are `created_by: 'cron'`.
 *
 * Copy: explicit `subject` + `body` win. Otherwise `sequenceVersionId` +
 * `stepIndex` loads that step's templates (`version_not_found`,
 * `step_out_of_range`, `step_has_no_copy` refuse with 422) and fills
 * `contract.stepCount` and `contract.claimsUsed` from the version when the
 * caller left them out; or `draftQueueItemId` loads the item's subject and
 * body (`draft_queue_item_not_found`). A draft queue item, when given, also
 * supplies the account name for the approval card.
 *
 * Status codes: 200 pass or review_required (the latter carries
 * `approvalRequestId`, idempotent per compile); 409 reject with the full
 * result so a caller cannot mistake it for success; 400 unparsable JSON; 422
 * shape or copy-loading refusals naming the field.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { validateClaimsUsed } from '@/lib/gap/claims/validate-claims';
import { requestApproval } from '@/lib/gap/compiler/approval';
import { compile } from '@/lib/gap/compiler/compile';
import { makeCriticClient } from '@/lib/gap/critic-client';
import { assertGapEnabled } from '@/lib/gap/flags';
import { parseSteps } from '@/lib/gap/sequence/steps';

export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    hypothesisId: z.string().min(1).optional(),
    sequenceVersionId: z.string().min(1).optional(),
    draftQueueItemId: z.number().int().positive().optional(),
    stepIndex: z.number().int().min(0),
    subject: z.string().optional(),
    body: z.string().optional(),
    priorBodies: z.array(z.string()).default([]),
    contract: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const hasCopy = value.subject !== undefined && value.body !== undefined;
    const hasSource = value.sequenceVersionId !== undefined || value.draftQueueItemId !== undefined;
    if (!hasCopy && !hasSource) {
      ctx.addIssue({
        code: 'custom',
        message: 'copy_or_source_required',
        path: [value.subject === undefined ? 'subject' : 'body'],
      });
    }
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

function refuse(payload: Record<string, unknown>, status = 422) {
  return NextResponse.json(payload, { status });
}

export async function POST(request: NextRequest) {
  const skip = assertGapEnabled('GAP_MESSAGE_COMPILER_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });

  const email = await sessionEmail();
  const createdBy = email ?? (isGapAgentRequest(request) ? 'cron' : null);
  if (!createdBy) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body', field: 'body' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return refuse({ error: 'invalid_body', field: firstField(parsed.error) });
  }
  const input = parsed.data;

  let subject = input.subject;
  let body = input.body;
  let accountName: string | null = null;
  const contract: Record<string, unknown> = { ...(input.contract ?? {}) };

  if (input.draftQueueItemId !== undefined) {
    const item = await prisma.draftQueueItem.findUnique({
      where: { id: input.draftQueueItemId },
      select: { id: true, subject: true, body: true, account_name: true },
    });
    if (!item) return refuse({ error: 'draft_queue_item_not_found', draftQueueItemId: input.draftQueueItemId });
    accountName = item.account_name ?? null;
    if (subject === undefined || body === undefined) {
      subject = item.subject;
      body = item.body;
    }
  }

  if ((subject === undefined || body === undefined) && input.sequenceVersionId !== undefined) {
    const version = await prisma.sequenceVersion.findUnique({
      where: { id: input.sequenceVersionId },
      select: { id: true, steps: true },
    });
    if (!version) return refuse({ error: 'version_not_found', sequenceVersionId: input.sequenceVersionId });
    const steps = parseSteps(version.steps);
    if (!steps.ok) return refuse({ error: 'invalid_steps', sequenceVersionId: input.sequenceVersionId, reason: steps.reason });
    const list = steps.steps.steps;
    const step = list[input.stepIndex];
    if (!step) {
      return refuse({
        error: 'step_out_of_range',
        sequenceVersionId: input.sequenceVersionId,
        stepIndex: input.stepIndex,
        stepCount: list.length,
      });
    }
    const stepSubject = step.templates?.subjectTemplate ?? null;
    const stepBody = step.templates?.bodyTemplate ?? null;
    if (!stepSubject || !stepBody) {
      return refuse({ error: 'step_has_no_copy', sequenceVersionId: input.sequenceVersionId, stepIndex: input.stepIndex });
    }
    subject = stepSubject;
    body = stepBody;
    if (contract.stepCount === undefined) contract.stepCount = list.length;
    if (contract.claimsUsed === undefined) contract.claimsUsed = step.claimsUsed;
  }

  if (subject === undefined || body === undefined) {
    return refuse({ error: 'invalid_body', field: subject === undefined ? 'subject' : 'body' });
  }

  const result = await compile(
    {
      hypothesisId: input.hypothesisId ?? null,
      sequenceVersionId: input.sequenceVersionId ?? null,
      draftQueueItemId: input.draftQueueItemId ?? null,
      stepIndex: input.stepIndex,
      subject,
      body,
      priorBodies: input.priorBodies,
      contract,
      createdBy,
    },
    { critic: makeCriticClient(), validateClaims: validateClaimsUsed, prisma },
  );

  if (result.verdict === 'reject') {
    return NextResponse.json(result, { status: 409 });
  }

  if (result.verdict === 'review_required') {
    if (!result.id) {
      return NextResponse.json({ ...result, approvalError: 'compile_not_persisted' });
    }
    const reviewCodes = result.checks.filter((c) => !c.passed && c.severity === 'review').map((c) => c.code);
    const reasons = [...reviewCodes];
    if (!result.critic.ok) reasons.push(result.critic.reason);
    else if (result.critic.verdict === 'review') reasons.push('critic_review');
    const approval = await requestApproval(prisma, {
      compileId: result.id,
      hypothesisId: input.hypothesisId ?? null,
      draftQueueItemId: input.draftQueueItemId ?? null,
      accountName,
      reason: `review_required: ${reasons.join(', ')}`,
      reviewCodes,
      requestedBy: createdBy,
      now: new Date(),
    });
    if (!approval.ok) {
      return NextResponse.json({ ...result, approvalError: approval.reason });
    }
    return NextResponse.json({ ...result, approvalRequestId: approval.id, approvalExisting: approval.existing });
  }

  return NextResponse.json(result);
}
