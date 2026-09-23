/**
 * S3-T3: SequenceEnrollment service (spec section 5.2).
 *
 * One prospect running one pinned version. The modex-lane `enroll` is used by
 * a HUMAN action from the enroll table: the guards run in a fixed order and
 * the first refusal wins, then one `$transaction` inserts the enrollment
 * (its id IS the DraftQueueItem.sequence_run_id), freezes the version when
 * the recipient is external (the DB trigger does the same; the code mirror is
 * what unit tests assert) and stamps the draft item. Audit `enroll.live`
 * lands after the transaction commits.
 *
 * Suppression (R3-10): both writers refuse on three LOCAL legs (the
 * unsubscribed table, `Persona.do_not_contact`, a bounced persona email
 * status) and then on the CROSS-PLANE clawd contract, the same read routing
 * makes (`createClawdSuppressionReader` in routing/suppression-read.ts): a
 * `suppressed` verdict refuses `suppressed`, an `unknown` verdict (outage,
 * unconfigured, malformed, a reader that threw) refuses
 * `suppression_unknown`. The reader is injected through the options so tests
 * and the scratch e2e never touch the network; the default is the real one.
 * Every suppression refusal carries `leg`, the name of what fired
 * (`unsubscribed` | `modex_do_not_contact` | `bounced` | `clawd:<leg>`).
 *
 * `recordExternalEnrollment` is the thin hubspot_native counterpart: it
 * records what HubSpot says, never enrolls anyone there, and shares the
 * suppression, already_enrolled and freeze invariants. Freeze is skipped for
 * test recipients AND for `legacy: true` readback rows (Sprint 2 review
 * finding S3): a legacy row is history, not a pin.
 *
 * Transitions: pause, resume, stop, confirmStop, complete. Every status move
 * is an optimistic `updateMany where {id, status: from}` that must touch one
 * row, else `stale_status`. Terminal rows (stopped, completed) refuse
 * `terminal`. modex stops call `stopRun` from the queue runtime so the unsent
 * items are skipped with `sequence_stopped:<reason>`; hubspot_native stops
 * go to `stop_pending` and post a review-feed line naming the contact and
 * sequence, because the rig or Casey performs the unenroll and `confirmStop`
 * closes the loop from a readback.
 *
 * Audit kinds: audit.ts owns the union and has no `enrollment.*` members yet,
 * so transitions are recorded as `decision.human_action` with
 * `payload.action` naming the transition. Named debt for the audit owner.
 *
 * Voice: no em dashes.
 */
import { randomUUID } from 'node:crypto';

import { audit } from '@/lib/gap/audit';
import { gapFlag } from '@/lib/gap/flags';
import { CONTRACT_LEG, createClawdSuppressionReader, type SuppressionReader } from '@/lib/gap/routing/suppression-read';
import { isInternalRecipient } from '@/lib/gap/sequence/internal-recipient';
import { freezeVersionForEnrollment } from '@/lib/gap/sequence/version';
import { LIVE_ENROLLMENT_STATUSES } from '@/lib/gap/sequence/family';
import { STOP_REASONS, type StopReason } from '@/lib/gap/taxonomy';
import { stopRun } from '@/lib/queue/sequence-runtime';

export const TERMINAL_STATUSES = ['stopped', 'completed'] as const;
export const HYPOTHESIS_READY_STATUSES = ['approved', 'active'] as const;

const SUBJECT_TYPE = 'sequence_enrollment';

// ---------------------------------------------------------------------------
// Shared guards
// ---------------------------------------------------------------------------

function normalizeEmail(email: string): string {
  return (email ?? '').trim().toLowerCase();
}

/**
 * The suppression legs an enrollment refuses on, named so a refusal can say
 * which one fired (R3-2). Order of precedence: unsubscribed, then the modex
 * `Persona.do_not_contact` flag, then a bounced email status, then the
 * cross-plane clawd contract (`clawd:<leg>`, R3-10).
 */
export type SuppressionLeg = 'unsubscribed' | 'modex_do_not_contact' | 'bounced' | `clawd:${string}`;

export interface SuppressionOptions {
  /** The cross-plane contract reader. Defaults to the routing clawd reader; tests inject a static one. */
  suppression?: SuppressionReader;
}

export type SuppressionCheck = { ok: true } | { ok: false; reason: 'suppressed' | 'suppression_unknown'; leg: SuppressionLeg };

/** The persona email statuses that count as bounced (the same set routing/rules.ts uses for emailUsable). */
export const BOUNCED_EMAIL_STATUSES: ReadonlySet<string> = new Set(['bounced', 'hard_bounced']);

/** Pure: the first leg that fires, or null. */
export function suppressionLegFor(input: { unsubscribed: boolean; doNotContact: boolean; emailStatus: string | null | undefined }): SuppressionLeg | null {
  if (input.unsubscribed) return 'unsubscribed';
  if (input.doNotContact) return 'modex_do_not_contact';
  if (input.emailStatus != null && BOUNCED_EMAIL_STATUSES.has(input.emailStatus)) return 'bounced';
  return null;
}

/**
 * The local suppression read: unsubscribed_emails on the lowercased address,
 * then the persona's do_not_contact and bounced email status. Exported so
 * the enroll service runs the SAME read before it resolves a target (R3-2).
 */
export async function isSuppressed(prisma: any, email: string, personaId: number | null | undefined): Promise<SuppressionLeg | null> {
  const hit = await prisma.unsubscribedEmail.findUnique({ where: { email }, select: { id: true } });
  if (hit) return 'unsubscribed';
  if (typeof personaId === 'number') {
    const persona = await prisma.persona.findUnique({ where: { id: personaId }, select: { do_not_contact: true, email_status: true } });
    return suppressionLegFor({ unsubscribed: false, doNotContact: persona?.do_not_contact === true, emailStatus: persona?.email_status ?? null });
  }
  return null;
}

/** The leg a cross-plane result names: the first `hit` leg for a suppression, the first `unknown` leg for an outage, else the aggregate. */
function crossPlaneLeg(legs: Record<string, string>, want: 'hit' | 'unknown'): SuppressionLeg {
  const named = Object.entries(legs).find(([, v]) => v === want)?.[0];
  return `clawd:${named ?? CONTRACT_LEG}`;
}

/**
 * The full suppression guard (R3-10): the local legs, then the cross-plane
 * contract read. Never throws; a reader that throws is `unknown`, and an
 * unknown authority refuses `suppression_unknown`, never clears.
 */
export async function checkSuppression(prisma: any, email: string, personaId: number | null | undefined, opts: SuppressionOptions = {}): Promise<SuppressionCheck> {
  const local = await isSuppressed(prisma, email, personaId);
  if (local) return { ok: false, reason: 'suppressed', leg: local };
  const reader = opts.suppression ?? createClawdSuppressionReader();
  let verdict: 'clear' | 'suppressed' | 'unknown';
  let legs: Record<string, string> = {};
  try {
    const r = await reader.read({ to: email });
    verdict = r.verdict;
    legs = r.legs ?? {};
  } catch {
    return { ok: false, reason: 'suppression_unknown', leg: 'clawd:threw' };
  }
  if (verdict === 'suppressed') return { ok: false, reason: 'suppressed', leg: crossPlaneLeg(legs, 'hit') };
  if (verdict !== 'clear') return { ok: false, reason: 'suppression_unknown', leg: crossPlaneLeg(legs, 'unknown') };
  return { ok: true };
}

async function hasLiveEnrollment(prisma: any, email: string): Promise<boolean> {
  const hit = await prisma.sequenceEnrollment.findFirst({
    where: { to_email: email, status: { in: [...LIVE_ENROLLMENT_STATUSES] } },
    select: { id: true },
  });
  return Boolean(hit);
}

function isUniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as { code?: unknown }).code === 'P2002');
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ---------------------------------------------------------------------------
// enroll (modex_draft_queue)
// ---------------------------------------------------------------------------

export interface EnrollInput {
  familyId: string;
  versionId: string;
  engine: 'modex_draft_queue';
  toEmail: string;
  accountName: string;
  personaId?: number | null;
  hypothesisId?: string | null;
  sender: string;
  owner: string;
  /** The DraftQueueItem that becomes step 0 of the run. */
  draftItemId: number;
  now: Date;
  enrolledBy: string;
}

export type EnrollRefusal =
  | 'gap_disabled'
  | 'bad_engine'
  | 'version_not_found'
  | 'version_retired'
  | 'family_mismatch'
  | 'suppressed'
  | 'suppression_unknown'
  | 'already_enrolled'
  | 'hypothesis_not_found'
  | 'hypothesis_not_ready'
  | 'draft_item_not_found';

export type EnrollResult =
  | { ok: true; id: string; isTest: boolean; frozen: boolean }
  | { ok: false; reason: EnrollRefusal; leg?: SuppressionLeg };

/**
 * Guards, in order: flag, version (exists, same family, not retired),
 * suppression (local legs, then the cross-plane read), already_enrolled,
 * hypothesis readiness. Then one transaction.
 */
export async function enroll(prisma: any, input: EnrollInput, opts: SuppressionOptions = {}): Promise<EnrollResult> {
  if (!gapFlag('GAP_OS_ENABLED')) return { ok: false, reason: 'gap_disabled' };
  if (input.engine !== 'modex_draft_queue') return { ok: false, reason: 'bad_engine' };

  const version = await prisma.sequenceVersion.findUnique({
    where: { id: input.versionId },
    select: { id: true, family_id: true, status: true },
  });
  if (!version) return { ok: false, reason: 'version_not_found' };
  if (version.status === 'retired') return { ok: false, reason: 'version_retired' };
  if (version.family_id !== input.familyId) return { ok: false, reason: 'family_mismatch' };

  const email = normalizeEmail(input.toEmail);
  const suppression = await checkSuppression(prisma, email, input.personaId, opts);
  if (!suppression.ok) return { ok: false, reason: suppression.reason, leg: suppression.leg };
  if (await hasLiveEnrollment(prisma, email)) return { ok: false, reason: 'already_enrolled' };

  if (input.hypothesisId) {
    const hyp = await prisma.prospectingHypothesis.findUnique({
      where: { id: input.hypothesisId },
      select: { status: true },
    });
    if (!hyp) return { ok: false, reason: 'hypothesis_not_found' };
    if (!(HYPOTHESIS_READY_STATUSES as readonly string[]).includes(hyp.status)) {
      return { ok: false, reason: 'hypothesis_not_ready' };
    }
  }

  const id = randomUUID();
  const isTest = isInternalRecipient(email);

  let frozen = false;
  try {
    frozen = await prisma.$transaction(async (tx: any): Promise<boolean> => {
      await tx.sequenceEnrollment.create({
        data: {
          id,
          engine: input.engine,
          family_id: input.familyId,
          sequence_version_id: input.versionId,
          hypothesis_id: input.hypothesisId ?? null,
          account_name: input.accountName,
          persona_id: input.personaId ?? null,
          to_email: email,
          sender: input.sender,
          owner: input.owner,
          status: 'active',
          current_step_index: 0,
          rendered_steps: null,
          rendered_steps_hash: null,
          is_test: isTest,
          legacy: false,
          enrolled_by: input.enrolledBy,
          enrolled_at: input.now,
        },
        select: { id: true },
      });

      let didFreeze = false;
      if (!isTest) {
        const outcome = await freezeVersionForEnrollment(tx, input.versionId, id, input.now);
        didFreeze = outcome.frozen;
      }

      const stamped = await tx.draftQueueItem.updateMany({
        where: { id: input.draftItemId },
        data: { sequence_run_id: id, step_index: 0, sequence_version_id: input.versionId },
      });
      if (stamped.count !== 1) throw new Error('draft_item_not_found');

      return didFreeze;
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: 'already_enrolled' };
    const message = errorMessage(err);
    if (message === 'version_retired') return { ok: false, reason: 'version_retired' };
    if (message === 'version_not_found') return { ok: false, reason: 'version_not_found' };
    if (message === 'draft_item_not_found') return { ok: false, reason: 'draft_item_not_found' };
    throw err;
  }

  await audit(prisma, {
    kind: 'enroll.live',
    actor: input.enrolledBy,
    subjectType: SUBJECT_TYPE,
    subjectId: id,
    payload: {
      engine: input.engine,
      familyId: input.familyId,
      versionId: input.versionId,
      hypothesisId: input.hypothesisId ?? null,
      toEmail: email,
      accountName: input.accountName,
      draftItemId: input.draftItemId,
      isTest,
      frozen,
    },
  });

  return { ok: true, id, isTest, frozen };
}

// ---------------------------------------------------------------------------
// recordExternalEnrollment (hubspot_native, readback-driven)
// ---------------------------------------------------------------------------

/** Mirrors external-sync's ExternalState shape. */
export interface ExternalReadback {
  activelyEnrolledCount: number;
  latestSequenceId: string | null;
  latestEnrolledAt: string | null;
}

export interface RecordExternalEnrollmentInput {
  /** uuid v5 over `${hubspot_sequence_id}:${hubspot_contact_id}` (external-sync's `enrollmentId`). */
  id: string;
  familyId: string;
  versionId: string;
  toEmail: string;
  accountName: string;
  hubspotContactId: string;
  hubspotSequenceId: string;
  hubspotEnrollmentId?: string | null;
  personaId?: number | null;
  hypothesisId?: string | null;
  sender: string;
  owner: string;
  externalState: ExternalReadback | null | undefined;
  renderedSteps?: unknown;
  renderedStepsHash?: string | null;
  legacy?: boolean;
  enrolledAt: Date;
  enrolledBy: string;
  now: Date;
}

export type RecordExternalRefusal =
  | 'gap_disabled'
  | 'no_readback'
  | 'version_not_found'
  | 'version_retired'
  | 'family_mismatch'
  | 'suppressed'
  | 'suppression_unknown'
  | 'already_enrolled';

export type RecordExternalResult =
  | { ok: true; id: string; isTest: boolean; frozen: boolean }
  | { ok: false; reason: RecordExternalRefusal; leg?: SuppressionLeg };

/**
 * Record a HubSpot enrollment that a readback proved. `no_readback` without
 * external_state; then the same version, suppression and already_enrolled
 * guards as `enroll`; then insert with the readback and freeze when the
 * recipient is external. An existing row with this id is `already_enrolled`
 * (the sync's own idempotency path handles updates, not this function).
 */
export async function recordExternalEnrollment(
  prisma: any,
  input: RecordExternalEnrollmentInput,
  opts: SuppressionOptions = {},
): Promise<RecordExternalResult> {
  if (!gapFlag('GAP_OS_ENABLED')) return { ok: false, reason: 'gap_disabled' };
  if (!input.externalState) return { ok: false, reason: 'no_readback' };

  const version = await prisma.sequenceVersion.findUnique({
    where: { id: input.versionId },
    select: { id: true, family_id: true, status: true },
  });
  if (!version) return { ok: false, reason: 'version_not_found' };
  if (version.status === 'retired') return { ok: false, reason: 'version_retired' };
  if (version.family_id !== input.familyId) return { ok: false, reason: 'family_mismatch' };

  const email = normalizeEmail(input.toEmail);
  const suppression = await checkSuppression(prisma, email, input.personaId, opts);
  if (!suppression.ok) return { ok: false, reason: suppression.reason, leg: suppression.leg };

  const existing = await prisma.sequenceEnrollment.findUnique({ where: { id: input.id }, select: { id: true } });
  if (existing) return { ok: false, reason: 'already_enrolled' };
  if (await hasLiveEnrollment(prisma, email)) return { ok: false, reason: 'already_enrolled' };

  const isTest = isInternalRecipient(email);
  const legacy = input.legacy === true;
  let frozen = false;
  try {
    frozen = await prisma.$transaction(async (tx: any): Promise<boolean> => {
      await tx.sequenceEnrollment.create({
        data: {
          id: input.id,
          engine: 'hubspot_native',
          family_id: input.familyId,
          sequence_version_id: input.versionId,
          hypothesis_id: input.hypothesisId ?? null,
          account_name: input.accountName,
          persona_id: input.personaId ?? null,
          to_email: email,
          hubspot_contact_id: input.hubspotContactId,
          hubspot_sequence_id: input.hubspotSequenceId,
          hubspot_enrollment_id: input.hubspotEnrollmentId ?? null,
          sender: input.sender,
          owner: input.owner,
          status: 'active',
          current_step_index: 0,
          rendered_steps: input.renderedSteps ?? null,
          rendered_steps_hash: input.renderedStepsHash ?? null,
          external_state: input.externalState,
          external_synced_at: input.now,
          is_test: isTest,
          legacy,
          enrolled_by: input.enrolledBy,
          enrolled_at: input.enrolledAt,
        },
        select: { id: true },
      });
      // S2 review finding S3: a legacy readback row records history, it does
      // not pin a shape, so it never freezes the version. Same for test rows.
      if (isTest || legacy) return false;
      const outcome = await freezeVersionForEnrollment(tx, input.versionId, input.id, input.now);
      return outcome.frozen;
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: 'already_enrolled' };
    const message = errorMessage(err);
    if (message === 'version_retired') return { ok: false, reason: 'version_retired' };
    if (message === 'version_not_found') return { ok: false, reason: 'version_not_found' };
    throw err;
  }

  await audit(prisma, {
    kind: 'enroll.live',
    actor: input.enrolledBy,
    subjectType: SUBJECT_TYPE,
    subjectId: input.id,
    payload: {
      engine: 'hubspot_native',
      familyId: input.familyId,
      versionId: input.versionId,
      toEmail: email,
      hubspotContactId: input.hubspotContactId,
      hubspotSequenceId: input.hubspotSequenceId,
      isTest,
      legacy,
      frozen,
      recorded: true,
    },
  });

  return { ok: true, id: input.id, isTest, frozen };
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export type TransitionRefusal =
  | 'not_found'
  | 'terminal'
  | 'not_active'
  | 'not_paused'
  | 'not_stop_pending'
  | 'stop_pending'
  | 'bad_reason'
  | 'version_retired'
  | 'still_enrolled'
  | 'stale_status';

export type TransitionResult<Extra extends object = Record<never, never>> =
  | ({ ok: true; id: string; status: string } & Extra)
  | { ok: false; reason: TransitionRefusal };

interface EnrollmentRow {
  id: string;
  engine: string;
  status: string;
  to_email: string;
  account_name: string;
  sequence_version_id: string;
  hypothesis_id: string | null;
  hubspot_contact_id: string | null;
  hubspot_sequence_id: string | null;
  stop_requested_at: Date | null;
}

const ROW_SELECT = {
  id: true,
  engine: true,
  status: true,
  to_email: true,
  account_name: true,
  sequence_version_id: true,
  hypothesis_id: true,
  hubspot_contact_id: true,
  hubspot_sequence_id: true,
  stop_requested_at: true,
} as const;

async function loadRow(prisma: any, id: string): Promise<EnrollmentRow | null> {
  const row = await prisma.sequenceEnrollment.findUnique({ where: { id }, select: ROW_SELECT });
  return row ?? null;
}

function isTerminal(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

/** Optimistic move; false when the row was not in `from` any more. */
async function move(client: any, id: string, from: readonly string[], data: Record<string, unknown>): Promise<boolean> {
  const r = await client.sequenceEnrollment.updateMany({ where: { id, status: { in: [...from] } }, data });
  return r.count === 1;
}

async function auditTransition(
  prisma: any,
  row: EnrollmentRow,
  action: string,
  actor: string,
  payload: Record<string, unknown>,
  review?: { title: string; intent: string },
): Promise<void> {
  await audit(prisma, {
    kind: 'decision.human_action',
    actor,
    subjectType: SUBJECT_TYPE,
    subjectId: row.id,
    payload: { action, engine: row.engine, toEmail: row.to_email, ...payload },
    ...(review ? { review: { target: row.to_email, title: review.title, intent: review.intent } } : {}),
  });
}

/** active -> paused. modex: unsent items stay approved and send-deps refuses `sequence_paused` under the flag. */
export async function pause(prisma: any, enrollmentId: string, actor: string, now: Date = new Date()): Promise<TransitionResult> {
  const row = await loadRow(prisma, enrollmentId);
  if (!row) return { ok: false, reason: 'not_found' };
  if (isTerminal(row.status)) return { ok: false, reason: 'terminal' };
  if (row.status !== 'active') return { ok: false, reason: 'not_active' };

  if (!(await move(prisma, row.id, ['active'], { status: 'paused' }))) return { ok: false, reason: 'stale_status' };

  await auditTransition(
    prisma,
    row,
    'enrollment.pause',
    actor,
    { at: now.toISOString() },
    row.engine === 'hubspot_native'
      ? {
          title: `Pause requested: ${row.to_email} in HubSpot sequence ${row.hubspot_sequence_id ?? '?'}`,
          intent: `Pause contact ${row.hubspot_contact_id ?? '?'} in sequence ${row.hubspot_sequence_id ?? '?'} by hand; modex records intent only`,
        }
      : undefined,
  );
  return { ok: true, id: row.id, status: 'paused' };
}

/** paused -> active. Refused when the pinned version has been retired. */
export async function resume(prisma: any, enrollmentId: string, actor: string, now: Date = new Date()): Promise<TransitionResult> {
  const row = await loadRow(prisma, enrollmentId);
  if (!row) return { ok: false, reason: 'not_found' };
  if (isTerminal(row.status)) return { ok: false, reason: 'terminal' };
  if (row.status !== 'paused') return { ok: false, reason: 'not_paused' };

  const version = await prisma.sequenceVersion.findUnique({
    where: { id: row.sequence_version_id },
    select: { status: true },
  });
  if (!version || version.status === 'retired') return { ok: false, reason: 'version_retired' };

  if (!(await move(prisma, row.id, ['paused'], { status: 'active' }))) return { ok: false, reason: 'stale_status' };
  await auditTransition(prisma, row, 'enrollment.resume', actor, { at: now.toISOString() });
  return { ok: true, id: row.id, status: 'active' };
}

export type StopResult = TransitionResult<{ skipped: number }>;

/**
 * active or paused -> stopped (modex) or stop_pending (hubspot_native and
 * manual). The reason must be one of STOP_REASONS (`bad_reason`). modex: the
 * status move and `stopRun` (unsent items -> skipped, `sequence_stopped:<reason>`)
 * run in one transaction. hubspot_native: stop_requested_at is stamped and a
 * review-feed line names the contact and sequence so the rig or Casey can
 * unenroll; `confirmStop` finishes from a readback.
 */
export async function stop(
  prisma: any,
  enrollmentId: string,
  reason: StopReason | string,
  actor: string,
  now: Date = new Date(),
): Promise<StopResult> {
  if (!(STOP_REASONS as readonly string[]).includes(reason)) return { ok: false, reason: 'bad_reason' };
  const row = await loadRow(prisma, enrollmentId);
  if (!row) return { ok: false, reason: 'not_found' };
  if (isTerminal(row.status)) return { ok: false, reason: 'terminal' };
  if (row.status === 'stop_pending') return { ok: false, reason: 'stop_pending' };
  if (row.status !== 'active' && row.status !== 'paused') return { ok: false, reason: 'not_active' };

  if (row.engine === 'modex_draft_queue') {
    let skipped = 0;
    const moved = await prisma.$transaction(async (tx: any): Promise<boolean> => {
      const ok = await move(tx, row.id, ['active', 'paused'], {
        status: 'stopped',
        stop_reason: reason,
        stopped_at: now,
        stopped_by: actor,
      });
      if (!ok) return false;
      skipped = await stopRun(tx, row.id, reason);
      return true;
    });
    if (!moved) return { ok: false, reason: 'stale_status' };
    await auditTransition(prisma, row, 'enrollment.stop', actor, { reason, skipped, at: now.toISOString() });
    return { ok: true, id: row.id, status: 'stopped', skipped };
  }

  const moved = await move(prisma, row.id, ['active', 'paused'], {
    status: 'stop_pending',
    stop_reason: reason,
    stop_requested_at: now,
  });
  if (!moved) return { ok: false, reason: 'stale_status' };
  await auditTransition(
    prisma,
    row,
    'enrollment.stop_requested',
    actor,
    { reason, at: now.toISOString(), hubspotContactId: row.hubspot_contact_id, hubspotSequenceId: row.hubspot_sequence_id },
    {
      title: `Stop requested: ${row.to_email} in HubSpot sequence ${row.hubspot_sequence_id ?? '?'}`,
      intent: `Unenroll contact ${row.hubspot_contact_id ?? '?'} from sequence ${row.hubspot_sequence_id ?? '?'} (${reason}); confirmStop closes it from a readback`,
    },
  );
  return { ok: true, id: row.id, status: 'stop_pending', skipped: 0 };
}

/** The lane's rule: in the sequence when actively enrolled and the latest sequence is this one. */
export function readbackShowsEnrolled(readback: ExternalReadback, hubspotSequenceId: string | null): boolean {
  return readback.activelyEnrolledCount > 0 && readback.latestSequenceId !== null && readback.latestSequenceId === hubspotSequenceId;
}

/** stop_pending -> stopped, only when the readback shows the contact is no longer in the sequence (`still_enrolled` otherwise). */
export async function confirmStop(
  prisma: any,
  enrollmentId: string,
  readback: ExternalReadback,
  actor: string,
  now: Date = new Date(),
): Promise<TransitionResult> {
  const row = await loadRow(prisma, enrollmentId);
  if (!row) return { ok: false, reason: 'not_found' };
  if (isTerminal(row.status)) return { ok: false, reason: 'terminal' };
  if (row.status !== 'stop_pending') return { ok: false, reason: 'not_stop_pending' };
  if (readbackShowsEnrolled(readback, row.hubspot_sequence_id)) return { ok: false, reason: 'still_enrolled' };

  const moved = await move(prisma, row.id, ['stop_pending'], {
    status: 'stopped',
    stopped_at: now,
    stopped_by: actor,
    external_state: readback,
    external_synced_at: now,
  });
  if (!moved) return { ok: false, reason: 'stale_status' };
  await auditTransition(prisma, row, 'enrollment.stop_confirmed', actor, { at: now.toISOString() });
  return { ok: true, id: row.id, status: 'stopped' };
}

/** active -> completed. The caller has established the last step was sent (modex) or the readback shows the run ended with no stop requested (hubspot_native). */
export async function complete(prisma: any, enrollmentId: string, actor: string, now: Date = new Date()): Promise<TransitionResult> {
  const row = await loadRow(prisma, enrollmentId);
  if (!row) return { ok: false, reason: 'not_found' };
  if (isTerminal(row.status)) return { ok: false, reason: 'terminal' };
  if (row.status !== 'active') return { ok: false, reason: 'not_active' };
  if (row.stop_requested_at) return { ok: false, reason: 'stop_pending' };

  if (!(await move(prisma, row.id, ['active'], { status: 'completed', completed_at: now }))) {
    return { ok: false, reason: 'stale_status' };
  }
  await auditTransition(prisma, row, 'enrollment.complete', actor, { at: now.toISOString() });
  return { ok: true, id: row.id, status: 'completed' };
}

// ---------------------------------------------------------------------------
// Bulk stops (explicit operator or machine-effect calls)
// ---------------------------------------------------------------------------

export interface BulkStopResult {
  stopped: string[];
  pending: string[];
  refused: Array<{ id: string; reason: TransitionRefusal }>;
}

async function stopMany(prisma: any, where: Record<string, unknown>, reason: string, actor: string, now: Date): Promise<BulkStopResult> {
  const rows: Array<{ id: string }> = await prisma.sequenceEnrollment.findMany({
    where: { ...where, status: { in: ['active', 'paused'] } },
    select: { id: true },
    orderBy: { enrolled_at: 'asc' },
  });
  const result: BulkStopResult = { stopped: [], pending: [], refused: [] };
  for (const { id } of rows) {
    const r = await stop(prisma, id, reason, actor, now);
    if (!r.ok) result.refused.push({ id, reason: r.reason });
    else if (r.status === 'stopped') result.stopped.push(id);
    else result.pending.push(id);
  }
  return result;
}

/** Stop every active or paused run on one version. Separate from `retireVersion` on purpose (spec 5.3). */
export function stopEnrollmentsForVersion(
  prisma: any,
  versionId: string,
  reason: StopReason | string,
  actor: string,
  now: Date = new Date(),
): Promise<BulkStopResult> {
  return stopMany(prisma, { sequence_version_id: versionId }, reason, actor, now);
}

/** Stop every active or paused run on one hypothesis: the machine's `stop_enrollments:<reason>` effects call this. */
export function stopEnrollmentsForHypothesis(
  prisma: any,
  hypothesisId: string,
  reason: StopReason | string,
  actor: string,
  now: Date = new Date(),
): Promise<BulkStopResult> {
  return stopMany(prisma, { hypothesis_id: hypothesisId }, reason, actor, now);
}
