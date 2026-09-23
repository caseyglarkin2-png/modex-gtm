/**
 * POST /api/gap/compile   run the message compiler on one step's copy
 *
 * GAP Prospecting OS, Sprint 3, S3-T9; rebuilt for R3-3 (2026-09-23). Thin
 * handler: the gate, auth, shape validation, copy loading and the SERVER-SIDE
 * contract live here; the verdict rule lives in
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
 * The contract is built here, not by the caller (R3-3). Before this rebuild
 * the body's `contract` was spread straight into the CheckContext, so a
 * caller could assert evidence freshness, widen `wordRange`, name a
 * `journeyStage` that reaches the CTA policy's meeting branch, author its
 * own prior bodies and claims list, and stamp the Top100 lookup key; the
 * resulting pass row unlocked enrollment. Now:
 *   evidence      the hypothesis's linked signals through
 *                 `evidenceRefsFromSignals` (fail-closed flags), never sent
 *   hypothesis    the hypothesis row's observation, problem hypothesis and
 *                 family
 *   stepCount     the resolved version's step count
 *   claimsUsed    the resolved version's step `claimsUsed`
 *   priorBodies   the version's earlier step bodies, or for a draft queue
 *                 item the run's earlier items (by `sequence_run_id`)
 *   journeyStage  never set; compile.ts derives it from stepIndex
 *   wordRange     never set; compile.ts drops it off the adapter path
 * The body's `contract` is reduced to the allowlist
 * `{ proofRefs?, namedPipeline?, unnamedOnlyClaimIds? }` (string lists); any
 * other key is 422 `contract_key_not_allowed:<key>`. Any top-level key
 * outside the schema (including the old `priorBodies`) is 422
 * `body_key_not_allowed:<key>`.
 *
 * Hypothesis resolution: `hypothesisId`; else a `draftQueueItemId` whose
 * `campaign_tag` is `gap:<hypothesisId>` (the enroll service stamps it). A
 * `sequenceVersionId` alone resolves nothing (many hypotheses share a
 * version). No hypothesis is 422 `hypothesis_required`; an unknown one is
 * 422 `hypothesis_not_found`. The row's `sequence_version_id` is stamped only
 * when the caller named the version or the item carries one; a hypothesis's
 * own version is read for stepCount, claimsUsed and prior bodies but is not
 * stamped, so ad-hoc copy never becomes "the latest compile for that version
 * and step".
 *
 * Template-level compiles: `template: true` with a `sequenceVersionId` and no
 * hypothesis compiles the version's template copy with an empty evidence
 * list and an empty hypothesis (so a cited template fails C01 by design) and
 * writes a row with `hypothesis_id` null and `inputs_snapshot.template:
 * true`. Those rows are evidence for a reviewer and for SHADOW enrollment
 * only; the preview page shows them apart ("template compile (shadow
 * only)") and never feeds them to the enroll button. `template: true` with a
 * hypothesisId or a draftQueueItemId is 422 `template_excludes_hypothesis`;
 * without a version it is 422 `template_requires_version`.
 *
 * Copy: explicit `subject` + `body` win. Otherwise `sequenceVersionId` +
 * `stepIndex` loads that step's templates (`version_not_found`,
 * `step_out_of_range`, `step_has_no_copy` refuse with 422); or
 * `draftQueueItemId` loads the item's subject and body
 * (`draft_queue_item_not_found`; a `stepIndex` that disagrees with the
 * item's own is `step_index_mismatch`). A draft queue item also supplies the
 * account name for the approval card.
 *
 * Status codes: 200 pass or review_required (the latter carries
 * `approvalRequestId`, idempotent per compile); 409 reject with the full
 * result so a caller cannot mistake it for success; 400 unparsable JSON; 422
 * shape, allowlist, resolution or copy-loading refusals naming the field.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { validateClaimsUsed } from '@/lib/gap/claims/validate-claims';
import { requestApproval } from '@/lib/gap/compiler/approval';
import { compile } from '@/lib/gap/compiler/compile';
import { evidenceRefsFromSignals, type SignalRow } from '@/lib/gap/compiler/evidence-from-signals';
import { makeCriticClient } from '@/lib/gap/critic-client';
import { assertGapEnabled } from '@/lib/gap/flags';
import { parseSteps } from '@/lib/gap/sequence/steps';

export const dynamic = 'force-dynamic';

/** The only contract keys a caller may set. Everything else is server-built. */
const CONTRACT_ALLOWLIST = ['proofRefs', 'namedPipeline', 'unnamedOnlyClaimIds'] as const;

const ContractSchema = z
  .object({
    proofRefs: z.array(z.string()).optional(),
    namedPipeline: z.array(z.string()).optional(),
    unnamedOnlyClaimIds: z.array(z.string()).optional(),
  })
  .strict();

const BodySchema = z
  .object({
    hypothesisId: z.string().min(1).optional(),
    sequenceVersionId: z.string().min(1).optional(),
    draftQueueItemId: z.number().int().positive().optional(),
    stepIndex: z.number().int().min(0),
    subject: z.string().optional(),
    body: z.string().optional(),
    template: z.boolean().optional(),
    contract: ContractSchema.nullable().optional(),
  })
  .strict()
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

/** The enroll service stamps step-0 items with `gap:<hypothesisId>`. */
const GAP_CAMPAIGN_TAG_RE = /^gap:([A-Za-z0-9_-]+)$/;

function firstField(error: z.ZodError): string {
  return error.issues[0]?.path.map(String).join('.') || 'body';
}

/**
 * A key outside the schema is refused by name, not folded into
 * `invalid_body`: the old `priorBodies` and the old contract keys used to be
 * honoured, and a caller still sending them must learn that they are not.
 */
function keyRefusal(error: z.ZodError): NextResponse | null {
  for (const issue of error.issues) {
    if (issue.code !== 'unrecognized_keys') continue;
    const key = issue.keys[0];
    if (key === undefined) continue;
    const under = issue.path.map(String);
    if (under[0] === 'contract') {
      return refuse({ error: `contract_key_not_allowed:${key}`, field: `contract.${key}` });
    }
    return refuse({ error: `body_key_not_allowed:${key}`, field: key });
  }
  return null;
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

interface HypothesisRow {
  id: string;
  observation: string | null;
  problem_hypothesis: string | null;
  problem_family: string | null;
  sequence_version_id: string | null;
  signals: Array<{ signal: SignalRow | null }> | null;
}

interface DraftItemRow {
  id: number;
  subject: string;
  body: string;
  account_name: string | null;
  step_index: number | null;
  sequence_run_id: string | null;
  sequence_version_id: string | null;
  campaign_tag: string | null;
}

type StepList = Extract<ReturnType<typeof parseSteps>, { ok: true }>['steps']['steps'];

interface LoadedVersion {
  id: string;
  steps: StepList;
}

type VersionLoad = { ok: true; version: LoadedVersion } | { ok: false; response: NextResponse };

async function loadVersion(versionId: string): Promise<VersionLoad> {
  const version = await prisma.sequenceVersion.findUnique({
    where: { id: versionId },
    select: { id: true, steps: true },
  });
  if (!version) return { ok: false, response: refuse({ error: 'version_not_found', sequenceVersionId: versionId }) };
  const steps = parseSteps(version.steps);
  if (!steps.ok) {
    return { ok: false, response: refuse({ error: 'invalid_steps', sequenceVersionId: versionId, reason: steps.reason }) };
  }
  return { ok: true, version: { id: version.id, steps: steps.steps.steps } };
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
    return keyRefusal(parsed.error) ?? refuse({ error: 'invalid_body', field: firstField(parsed.error) });
  }
  const input = parsed.data;
  const template = input.template === true;
  const now = new Date();

  if (template && (input.hypothesisId !== undefined || input.draftQueueItemId !== undefined)) {
    return refuse({ error: 'template_excludes_hypothesis' });
  }
  if (template && input.sequenceVersionId === undefined) {
    return refuse({ error: 'template_requires_version' });
  }

  // ---- The caller's allowlisted contract fields ----------------------------
  const contract: Record<string, unknown> = {};
  if (input.contract) {
    for (const key of CONTRACT_ALLOWLIST) {
      if (input.contract[key] !== undefined) contract[key] = input.contract[key];
    }
  }

  // ---- Copy and account name from a draft queue item ------------------------
  let subject = input.subject;
  let body = input.body;
  let accountName: string | null = null;
  let hypothesisId = input.hypothesisId ?? null;
  let stampedVersionId: string | null = input.sequenceVersionId ?? null;
  let item: DraftItemRow | null = null;

  if (input.draftQueueItemId !== undefined) {
    item = await prisma.draftQueueItem.findUnique({
      where: { id: input.draftQueueItemId },
      select: {
        id: true,
        subject: true,
        body: true,
        account_name: true,
        step_index: true,
        sequence_run_id: true,
        sequence_version_id: true,
        campaign_tag: true,
      },
    });
    if (!item) return refuse({ error: 'draft_queue_item_not_found', draftQueueItemId: input.draftQueueItemId });
    if (typeof item.step_index === 'number' && item.step_index !== input.stepIndex) {
      return refuse({
        error: 'step_index_mismatch',
        draftQueueItemId: item.id,
        stepIndex: input.stepIndex,
        itemStepIndex: item.step_index,
      });
    }
    accountName = item.account_name ?? null;
    if (subject === undefined || body === undefined) {
      subject = item.subject;
      body = item.body;
    }
    if (hypothesisId === null) {
      const tag = GAP_CAMPAIGN_TAG_RE.exec(item.campaign_tag ?? '');
      if (tag) hypothesisId = tag[1];
    }
    if (stampedVersionId === null && item.sequence_version_id) stampedVersionId = item.sequence_version_id;
  }

  // ---- The hypothesis: evidence and text are its, never the caller's --------
  let hypothesis: HypothesisRow | null = null;
  if (!template) {
    if (hypothesisId === null) return refuse({ error: 'hypothesis_required' });
    hypothesis = await prisma.prospectingHypothesis.findUnique({
      where: { id: hypothesisId },
      select: {
        id: true,
        observation: true,
        problem_hypothesis: true,
        problem_family: true,
        sequence_version_id: true,
        signals: {
          select: {
            signal: {
              select: {
                id: true,
                title: true,
                evidence_url: true,
                external_ok: true,
                observed_at: true,
                freshness_expires_at: true,
                source_type: true,
                metadata: true,
              },
            },
          },
        },
      },
    });
    if (!hypothesis) return refuse({ error: 'hypothesis_not_found', hypothesisId });
  }

  const signals: SignalRow[] =
    hypothesis && Array.isArray(hypothesis.signals)
      ? hypothesis.signals.map((l) => l.signal).filter((s): s is SignalRow => !!s)
      : [];
  contract.evidence = evidenceRefsFromSignals(signals, now);
  contract.hypothesis = {
    observation: hypothesis?.observation ?? '',
    problemHypothesis: hypothesis?.problem_hypothesis ?? '',
    problemFamily: hypothesis?.problem_family ?? 'unmapped',
  };

  // ---- The version: copy (when needed), stepCount, claimsUsed, prior bodies --
  const contextVersionId = stampedVersionId ?? hypothesis?.sequence_version_id ?? null;
  let priorBodies: string[] = [];
  if (contextVersionId !== null) {
    const loaded = await loadVersion(contextVersionId);
    if (!loaded.ok) return loaded.response;
    const list = loaded.version.steps;
    const step = list[input.stepIndex];
    if (!step) {
      return refuse({
        error: 'step_out_of_range',
        sequenceVersionId: contextVersionId,
        stepIndex: input.stepIndex,
        stepCount: list.length,
      });
    }
    if (subject === undefined || body === undefined) {
      const stepSubject = step.templates?.subjectTemplate ?? null;
      const stepBody = step.templates?.bodyTemplate ?? null;
      if (!stepSubject || !stepBody) {
        return refuse({ error: 'step_has_no_copy', sequenceVersionId: contextVersionId, stepIndex: input.stepIndex });
      }
      subject = stepSubject;
      body = stepBody;
    }
    contract.stepCount = list.length;
    contract.claimsUsed = Array.isArray(step.claimsUsed) ? step.claimsUsed : [];
    priorBodies = list
      .slice(0, input.stepIndex)
      .map((s) => s.templates?.bodyTemplate ?? '')
      .filter((b) => b.length > 0);
  } else {
    contract.claimsUsed = [];
  }

  // A draft queue item's run knows the copy that actually went out before this step.
  if (item && item.sequence_run_id && input.stepIndex > 0) {
    const earlier: Array<{ step_index: number | null; body: string }> = await prisma.draftQueueItem.findMany({
      where: { sequence_run_id: item.sequence_run_id, step_index: { lt: input.stepIndex } },
      orderBy: { step_index: 'asc' },
      select: { step_index: true, body: true },
    });
    if (earlier.length > 0) priorBodies = earlier.map((e) => e.body);
  }

  if (subject === undefined || body === undefined) {
    return refuse({ error: 'invalid_body', field: subject === undefined ? 'subject' : 'body' });
  }

  const result = await compile(
    {
      hypothesisId: hypothesis?.id ?? null,
      sequenceVersionId: stampedVersionId,
      draftQueueItemId: item?.id ?? null,
      stepIndex: input.stepIndex,
      subject,
      body,
      priorBodies,
      contract,
      createdBy,
      ...(template ? { template: true } : {}),
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
      hypothesisId: hypothesis?.id ?? null,
      draftQueueItemId: item?.id ?? null,
      accountName,
      reason: `review_required: ${reasons.join(', ')}`,
      reviewCodes,
      requestedBy: createdBy,
      now,
    });
    if (!approval.ok) {
      return NextResponse.json({ ...result, approvalError: approval.reason });
    }
    return NextResponse.json({ ...result, approvalRequestId: approval.id, approvalExisting: approval.existing });
  }

  return NextResponse.json(result);
}
