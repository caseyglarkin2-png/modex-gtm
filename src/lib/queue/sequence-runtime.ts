/**
 * Sequence runtime: the DB-touching glue between a finished send and the next
 * decision in a sequence run. Pure step math lives in `./sequence`; this module
 * reads/writes DraftQueueItem rows. It is invoked by the send CALLERS after
 * `sendQueueItem` returns — never inside `sendQueueItem` itself, so that send
 * seam stays free of follow-up side effects.
 */
import { randomUUID } from 'node:crypto';
import { STATUS } from './types';
import { nextStepSchedule, type SequenceStep } from './sequence';
import { clampToWindow, DEFAULT_WINDOW } from './schedule';
import { isGapOsEnabled } from '../gap/flags';
import { resolveSteps, VERSION_NOT_FOUND } from '../gap/sequence/resolve-steps';
import { toCalendarDelayDays } from '../gap/sequence/business-days';
import { EVIDENCE_SIGNAL_SELECT, firstNameOf, renderStepCopy, type EvidenceSignalRow, type StepCopy } from '../gap/sequence/render';
import { evidenceRefsFromSignals } from '../gap/compiler/evidence-from-signals';
import { parseSteps } from '../gap/sequence/steps';
import { audit, type GapAuditKind } from '../gap/audit';
import { validateClaimsUsed } from '../gap/claims/validate-claims';
import { compile, type CompileDeps } from '../gap/compiler/compile';
import { makeCriticClient, type CriticClient } from '../gap/critic-client';

/** GAP OS (S3-T5): the deterministic idempotency key the schema comment on
 *  DraftQueueItem promises (`owner:to_email:run:step`). Used under the flag
 *  only; a crash between create and the caller's bookkeeping then re-derives
 *  the SAME key and hits the @unique instead of creating a twin step. */
export function sequenceStepIdempotencyKey(owner: string, toEmail: string, runId: string, stepIndex: number): string {
  return `${owner}:${toEmail}:${runId}:${stepIndex}`;
}

/** The parent item's persona name, else the Persona row's name when the item only carries an id. Flag-on only. */
async function personaNameFor(prisma: any, item: any): Promise<string | null> {
  const fromItem = typeof item.persona_name === 'string' ? item.persona_name.trim() : '';
  if (fromItem) return fromItem;
  if (item.persona_id == null || !prisma?.persona?.findUnique) return null;
  const row = await prisma.persona.findUnique({ where: { id: item.persona_id }, select: { name: true } });
  return typeof row?.name === 'string' ? row.name : null;
}

function isUniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as { code?: unknown }).code === 'P2002');
}

/** Audit kinds this runtime writes (members of GapAuditKind). */
const COMPILE_NOT_PASSED_KIND: GapAuditKind = 'schedule.compile_not_passed';
/** N5: a pinned run that cannot schedule (version gone or unparsable, enrollment not active) is audited, not silently dropped. */
const SCHEDULE_SKIPPED_KIND: GapAuditKind = 'schedule.skipped';

const RUNTIME_ACTOR = 'sequence-runtime';

/** Injectable pieces of the per-item compile (R3-4). Production callers pass nothing; tests and the scratch e2e inject. */
export interface ScheduleOptions {
  /** The critic. Defaults to the real clawd client (unreachable is review, never pass). */
  critic?: CriticClient;
  /** The claims validator. Defaults to the committed snapshot validator; null disables. */
  validateClaims?: CompileDeps['validateClaims'];
  /** Extra contract fields merged OVER the default (hypothesis, evidence from the run's signals, stepCount, claimsUsed). */
  contract?: Record<string, unknown> | null;
  now?: () => Date;
}

interface RunContext {
  hypothesisId: string | null;
  observation: string | null;
  problemHypothesis: string;
  problemFamily: string;
  signals: EvidenceSignalRow[];
  /** The pinned version's raw steps (steps.v2), read with the enrollment so no second version read is needed. */
  versionSteps: unknown;
}

/** The run's enrollment and its hypothesis (observation, linked signals) for the slot render and the per-item compile. Flag-on only. */
async function loadRunContext(prisma: any, runId: string | null | undefined): Promise<RunContext | null> {
  if (!runId || !prisma?.sequenceEnrollment?.findUnique) return null;
  const row = await prisma.sequenceEnrollment.findUnique({
    where: { id: runId },
    select: {
      hypothesis_id: true,
      version: { select: { steps: true } },
      hypothesis: {
        select: {
          observation: true,
          problem_hypothesis: true,
          problem_family: true,
          signals: { select: { signal: { select: EVIDENCE_SIGNAL_SELECT } } },
        },
      },
    },
  });
  if (!row) return null;
  const h = row.hypothesis ?? null;
  const links: Array<{ signal: EvidenceSignalRow | null }> = Array.isArray(h?.signals) ? h.signals : [];
  return {
    hypothesisId: typeof row.hypothesis_id === 'string' ? row.hypothesis_id : null,
    observation: typeof h?.observation === 'string' ? h.observation : null,
    problemHypothesis: typeof h?.problem_hypothesis === 'string' ? h.problem_hypothesis : '',
    problemFamily: typeof h?.problem_family === 'string' ? h.problem_family : 'unmapped',
    signals: links.map((l) => l.signal).filter((x): x is EvidenceSignalRow => !!x),
    versionSteps: row.version?.steps ?? null,
  };
}

/** The step's `claimsUsed` from the pinned version's steps.v2 (the legacy shape the runtime schedules from drops it): the run's version when the enrollment carried it, else the stamped version. */
async function claimsUsedFor(prisma: any, run: RunContext | null, versionId: string, stepIndex: number): Promise<string[]> {
  let raw: unknown = run?.versionSteps ?? null;
  if (raw == null) {
    if (!prisma?.sequenceVersion?.findUnique) return [];
    const row = await prisma.sequenceVersion.findUnique({ where: { id: versionId }, select: { steps: true } });
    raw = row?.steps ?? null;
  }
  const parsed = raw == null ? null : parseSteps(raw);
  if (!parsed || !parsed.ok) return [];
  return parsed.steps.steps.find((s) => s.index === stepIndex)?.claimsUsed ?? [];
}

/** Bodies of the run's earlier steps, in step order, for C12 (they are queued copy, so already marker-free). */
async function priorBodiesFor(prisma: any, runId: string | null | undefined, stepIndex: number, fallback: string): Promise<string[]> {
  if (!runId || !prisma?.draftQueueItem?.findMany) return [fallback];
  const rows: Array<{ body: string }> = await prisma.draftQueueItem.findMany({
    where: { sequence_run_id: runId, step_index: { lt: stepIndex } },
    orderBy: { step_index: 'asc' },
    select: { body: true },
  });
  return Array.isArray(rows) && rows.length > 0 ? rows.map((r) => r.body) : [fallback];
}

/** After a SENT step, create the next step's DraftQueueItem (if any). Bypasses
 *  dedup on purpose: a sequence intentionally re-contacts the same recipient.
 *  Returns the new item id or null.
 *
 *  Steps come from `resolveSteps` (S3-T5). Flag OFF: the one Prisma read is
 *  `prisma.sequence.findUnique({ where: { id } })` exactly as before, the
 *  created row is byte-identical (no version stamp, random idempotency key,
 *  status approved, template verbatim, no compile).
 *  Flag ON: the run's SequenceEnrollment pin, else the item's own stamp, else
 *  the live read (documented fallback for a legacy run that was never
 *  imported); a paused, stopped or completed enrollment schedules nothing
 *  (spec 5.3); the created row is stamped with the resolved version and keyed
 *  deterministically; a business-day delay is converted to calendar days from
 *  the send time before the pure step math; the step's `{{first_name}}`,
 *  `{{account}}` and `{{observation}}` placeholders are rendered through
 *  src/lib/gap/sequence/render.ts (the same rule as the enroll service; the
 *  observation comes from the run's hypothesis, its [S:id] tokens turned
 *  into [[SRC:id]] markers) and a body or subject that still carries a
 *  `{{token}}` schedules NOTHING: the runtime audits
 *  `schedule.unrendered_placeholder` naming the token and returns null,
 *  because the queue sends what it holds.
 *
 *  Per-item compile (R3-4), flag ON and a version pin resolved (enrollment or
 *  item stamp; a legacy live run keeps today's approved row because it has no
 *  version to compile against, exactly as the approveBatch guard leaves
 *  unstamped items alone): the row is created as `draft` holding the QUEUED
 *  copy (markers stripped), then `compile()` judges the MARKED copy keyed to
 *  the item with the run's hypothesis signals as evidence refs and the real
 *  critic (injectable). A `pass` moves the row to `approved`; anything else
 *  (reject, review_required, critic unreachable) leaves it `draft` with
 *  `skipped_reason` null and audits `schedule.compile_not_passed`, so the
 *  approveBatch guard decides from the item-level GapCompile row. */
export async function scheduleNextStep(prisma: any, item: any, opts: ScheduleOptions = {}): Promise<number | null> {
  if (!item.sequence_id || item.step_index == null) return null;
  const gapEnabled = isGapOsEnabled();
  const resolved = await resolveSteps(prisma, item, { gapEnabled });
  if (resolved.reason) {
    // N5: flag on, a PINNED run that cannot resolve its version is a fact worth a row; the legacy live miss stays a silent null as today.
    // (A non-active enrollment is audited the same way just below.)
    if (gapEnabled && (resolved.reason === VERSION_NOT_FOUND || resolved.reason.startsWith('invalid_version_steps'))) {
      await audit(prisma, {
        kind: SCHEDULE_SKIPPED_KIND,
        actor: RUNTIME_ACTOR,
        subjectType: 'draft_queue_item',
        subjectId: String(item.id),
        payload: {
          reason: resolved.reason,
          source: resolved.source,
          versionId: resolved.versionId ?? item.sequence_version_id ?? null,
          runId: item.sequence_run_id ?? null,
          stepIndex: item.step_index,
          toEmail: item.to_email,
        },
      });
    }
    return null;
  }
  if (gapEnabled && resolved.enrollmentStatus && resolved.enrollmentStatus !== 'active') {
    await audit(prisma, {
      kind: SCHEDULE_SKIPPED_KIND,
      actor: RUNTIME_ACTOR,
      subjectType: 'draft_queue_item',
      subjectId: String(item.id),
      payload: {
        reason: `enrollment_not_active:${resolved.enrollmentStatus}`,
        source: resolved.source,
        versionId: resolved.versionId ?? item.sequence_version_id ?? null,
        runId: item.sequence_run_id ?? null,
        stepIndex: item.step_index,
        toEmail: item.to_email,
      },
    });
    return null;
  }
  const steps = resolved.steps as SequenceStep[];
  // bounce gate: if the step we just sent bounced, do not follow up
  let priorBounced = false;
  if (item.email_log_id) {
    const log = await prisma.emailLog.findUnique({
      where: { id: item.email_log_id },
      select: { bounce_type: true },
    });
    priorBounced = !!log?.bounce_type;
  }
  const sentAt: Date = item.sent_at ?? new Date();
  const next = nextStepSchedule(steps, item.step_index, sentAt, { priorBounced });
  if (!next) return null;
  let scheduledFor = next.scheduledFor;
  if (gapEnabled) {
    const resolvedStep = resolved.steps.find((s) => s.stepIndex === next.step.stepIndex);
    if (resolvedStep?.delayUnit === 'business_days') {
      const calendarDays = toCalendarDelayDays(sentAt, resolvedStep.delayDays);
      scheduledFor = nextStepSchedule([{ ...next.step, delayDays: calendarDays }], item.step_index, sentAt)!.scheduledFor;
    }
  }
  // GAP OS: carry the immutable version pin forward so every step of a run is
  // attributed to the same SequenceVersion (spec 5.3). Flag off, or a legacy
  // item without a pin: the created row is exactly what it was before.
  const versionId = gapEnabled ? (resolved.versionId ?? item.sequence_version_id ?? null) : null;
  const versionPin = versionId ? { sequence_version_id: versionId } : {};
  // Flag off: the copy is the template verbatim, byte for byte as before.
  let subject: string = next.step.subjectTemplate || item.subject;
  let body: string = next.step.bodyTemplate || item.body;
  let marked: StepCopy | null = null;
  let run: RunContext | null = null;
  // B5 (Opus adversarial review, 2026-09-24): the kill switch must never make
  // outbound LESS safe. Flag off skips the render-and-compile block below, so
  // a version-pinned item (this run was compiled under GAP) or a step whose
  // copy still carries an unrendered {{token}} (a GAP-materialized
  // Sequence.steps row, see sequences/service.ts materializeSequence) must
  // never be approved raw. Schedule nothing instead; the run pauses until the
  // flag is back on or an operator intervenes.
  if (!gapEnabled && (item.sequence_version_id || /\{\{/.test(subject) || /\{\{/.test(body))) {
    await audit(prisma, {
      kind: SCHEDULE_SKIPPED_KIND,
      actor: RUNTIME_ACTOR,
      subjectType: 'draft_queue_item',
      subjectId: String(item.id),
      payload: {
        reason: item.sequence_version_id ? 'gap_flag_off_version_pinned' : 'gap_flag_off_unrendered_template',
        source: resolved.source,
        versionId: item.sequence_version_id ?? null,
        runId: item.sequence_run_id ?? null,
        stepIndex: item.step_index,
        toEmail: item.to_email,
      },
    });
    return null;
  }
  if (gapEnabled) {
    run = await loadRunContext(prisma, item.sequence_run_id);
    const rendered = renderStepCopy(
      { subject, body },
      { firstName: firstNameOf(await personaNameFor(prisma, item)), account: String(item.account_name ?? ''), observation: run?.observation ?? null },
    );
    if (rendered.unrendered !== null) {
      await audit(prisma, {
        kind: 'schedule.unrendered_placeholder',
        actor: RUNTIME_ACTOR,
        subjectType: 'draft_queue_item',
        subjectId: String(item.id),
        payload: { token: rendered.unrendered, stepIndex: next.step.stepIndex, runId: item.sequence_run_id ?? null, versionId, toEmail: item.to_email },
      });
      return null;
    }
    subject = rendered.queued.subject;
    body = rendered.queued.body;
    marked = rendered.marked;
  }
  // R3-4: a pinned step is created as draft and earns approved from its own compile.
  const compilePerItem = gapEnabled && versionId !== null && marked !== null;
  const idempotencyKey =
    gapEnabled && item.sequence_run_id
      ? sequenceStepIdempotencyKey(item.owner, item.to_email, item.sequence_run_id, next.step.stepIndex)
      : randomUUID();
  let createdId: number;
  try {
    const created = await prisma.draftQueueItem.create({
      data: {
        ...versionPin,
        to_email: item.to_email,
        account_name: item.account_name,
        persona_name: item.persona_name,
        persona_id: item.persona_id,
        owner: item.owner,
        created_by: item.owner,
        subject,
        body,
        image_url: item.image_url,
        ...(compilePerItem ? { status: STATUS.draft } : { status: STATUS.approved, approved_at: new Date() }),
        scheduled_for: clampToWindow(scheduledFor, DEFAULT_WINDOW),
        sequence_id: item.sequence_id,
        sequence_run_id: item.sequence_run_id,
        step_index: next.step.stepIndex,
        parent_item_id: item.id,
        idempotency_key: idempotencyKey,
      },
      select: { id: true },
    });
    createdId = created.id;
  } catch (err) {
    // Under the flag the key is deterministic, so a retry after a crash lands
    // here: the step already exists (and already went through its own
    // compile), return it instead of a twin.
    if (gapEnabled && isUniqueViolation(err)) {
      const existing = await prisma.draftQueueItem.findUnique({
        where: { idempotency_key: idempotencyKey },
        select: { id: true },
      });
      if (existing) return existing.id;
    }
    throw err;
  }
  if (!compilePerItem) return createdId;

  const now = opts.now ?? (() => new Date());
  const contract: Record<string, unknown> = {
    hypothesis: {
      observation: run?.observation ?? '',
      problemHypothesis: run?.problemHypothesis ?? '',
      problemFamily: run?.problemFamily ?? 'unmapped',
    },
    evidence: evidenceRefsFromSignals(run?.signals ?? [], now()),
    stepCount: steps.length,
    claimsUsed: await claimsUsedFor(prisma, run, versionId as string, next.step.stepIndex),
    ...(opts.contract ?? {}),
  };
  const compiled = await compile(
    {
      hypothesisId: run?.hypothesisId ?? null,
      sequenceVersionId: versionId,
      draftQueueItemId: createdId,
      stepIndex: next.step.stepIndex,
      subject: (marked as StepCopy).subject,
      body: (marked as StepCopy).body,
      priorBodies: await priorBodiesFor(prisma, item.sequence_run_id, next.step.stepIndex, String(item.body ?? '')),
      contract,
      createdBy: RUNTIME_ACTOR,
    },
    {
      critic: opts.critic ?? makeCriticClient(),
      validateClaims: opts.validateClaims === undefined ? validateClaimsUsed : opts.validateClaims,
      now,
      prisma,
    },
  );
  if (compiled.verdict === 'pass') {
    await prisma.draftQueueItem.updateMany({
      where: { id: createdId, status: STATUS.draft },
      data: { status: STATUS.approved, approved_at: now() },
    });
    return createdId;
  }
  await audit(prisma, {
    kind: COMPILE_NOT_PASSED_KIND,
    actor: RUNTIME_ACTOR,
    subjectType: 'draft_queue_item',
    subjectId: String(createdId),
    payload: {
      itemId: createdId,
      stepIndex: next.step.stepIndex,
      runId: item.sequence_run_id ?? null,
      versionId,
      toEmail: item.to_email,
      compileId: compiled.id ?? null,
      verdict: compiled.verdict,
      failedChecks: compiled.checks.filter((c) => !c.passed).map((c) => c.code),
      critic: compiled.critic.ok ? { ok: true, verdict: compiled.critic.verdict } : compiled.critic,
    },
  });
  return createdId;
}

/** The statuses a stop may touch: unsent AND unclaimed. A `sending` row has
 *  been claimed by a worker; it is left alone and stays under the reply-pause
 *  guard and the wire gates in send-deps, exactly as before.
 *
 *  R2-7: `failed` belongs here too. It is unsent, the legacy delete removed it
 *  (its where clause was `notIn [sent, sending]`), and a `failed` row left
 *  behind by a stop is exactly what `retryDraft` re-approves, which would
 *  revive a run the recipient asked us to end. */
const STOPPABLE_STATUSES = [STATUS.draft, STATUS.approved, STATUS.failed];

/** GAP OS (S2-T2): stop one sequence run by marking its unsent items skipped
 *  with `sequence_stopped:<reason>`. Returns the number of rows marked.
 *  Empty run id: 0, no DB call. */
export async function stopRun(prisma: any, sequenceRunId: string, reason: string): Promise<number> {
  if (!sequenceRunId) return 0;
  const r = await prisma.draftQueueItem.updateMany({
    where: {
      sequence_run_id: sequenceRunId,
      status: { in: STOPPABLE_STATUSES },
    },
    data: { status: STATUS.skipped, skipped_reason: `sequence_stopped:${reason}` },
  });
  return r.count;
}

/** GAP OS (S2-T2): stop EVERY sequence run addressed to one recipient (a
 *  do_not_contact disposition, an unsubscribe). Same predicate as stopRun on
 *  the normalized address; only rows that belong to a run (non-null
 *  sequence_run_id) are touched, so one-off drafts are never swept up.
 *  Blank address: 0, no DB call. */
export async function stopRunsForRecipient(
  prisma: any,
  toEmail: string,
  reason: string,
): Promise<number> {
  const email = (toEmail ?? '').trim().toLowerCase();
  if (!email) return 0;
  const r = await prisma.draftQueueItem.updateMany({
    where: {
      to_email: email,
      sequence_run_id: { not: null },
      status: { in: STOPPABLE_STATUSES },
    },
    data: { status: STATUS.skipped, skipped_reason: `sequence_stopped:${reason}` },
  });
  return r.count;
}

/** Cancel the not-yet-sent remainder of a sequence run (recipient replied/opted out).
 *
 *  Flag OFF (GAP_OS_ENABLED unset): today's behavior, byte for byte. The unsent
 *  rows are deleted with the same where clause as before.
 *
 *  Flag ON: stop, do not delete (delegates to stopRun). Why: the deleted rows
 *  were the only evidence that a run had been stopped, and why. Once they were
 *  gone, nothing in the Draft Queue could say "this run ended because the
 *  recipient replied" versus "this run never had a step 2". Marking them
 *  `skipped` with `sequence_stopped:<reason>` keeps that evidence in the row
 *  itself. It is safe on the same two axes delete was: `skipped` is already a
 *  terminal status for the partial unique index `draft_queue_active_recipient`
 *  (WHERE status NOT IN sent, skipped, failed), so the recipient unlocks the
 *  same instant it did under delete; and the outbox already renders
 *  `skipped_reason` on skipped rows, so the reason is visible with no UI change. */
export async function cancelDownstream(
  prisma: any,
  sequenceRunId: string,
  reason?: string,
): Promise<number> {
  if (!sequenceRunId) return 0;
  if (isGapOsEnabled()) {
    return stopRun(prisma, sequenceRunId, reason ?? 'unknown');
  }
  const r = await prisma.draftQueueItem.deleteMany({
    where: {
      sequence_run_id: sequenceRunId,
      status: { notIn: [STATUS.sent, STATUS.sending] },
    },
  });
  return r.count;
}

/** Caller hook: run after sendQueueItem returns, given the loaded item + outcome. */
export async function onSendOutcome(
  prisma: any,
  item: any,
  outcome: { status: string; skippedReason?: string },
): Promise<void> {
  if (outcome.status === STATUS.sent) {
    await scheduleNextStep(prisma, item);
    return;
  }
  if (
    outcome.status === STATUS.skipped &&
    item.sequence_run_id &&
    ['in_thread', 'unsubscribed', 'replied'].includes(outcome.skippedReason ?? '')
  ) {
    await cancelDownstream(prisma, item.sequence_run_id, outcome.skippedReason);
  }
}
