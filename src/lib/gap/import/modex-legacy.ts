/**
 * S3-T5: modex legacy sequence import planner (pure, no Prisma).
 *
 * Before GAP the modex Draft Queue kept a sequence as one `sequences` row
 * (`steps Json`, no version) and an enrollment as columns on the
 * DraftQueueItem rows (`sequence_id`, `sequence_run_id`, `step_index`). This
 * planner turns those two tables into the GAP ledger shape:
 *
 * - one `SequenceFamily` per `sequences` row (engine `modex_draft_queue`,
 *   `legacy_sequence_id` = the numeric id, name = the row's name); a family
 *   that already exists for that legacy id is reused;
 * - one `SequenceVersion` (v1) per family, steps = `fromLegacySequence(row.steps)`.
 *   A row whose steps do not parse gets the warning `unparseable_steps:<id>`
 *   and no version (its items are then neither stamped nor enrolled, so the
 *   runtime keeps its live read for them). Status is `frozen` when any
 *   NON-TEST item references the sequence (`frozen_at` = the earliest such
 *   item's created_at, `frozen_by_enrollment_id` null: nobody enrolled
 *   through GAP, so there is no single freezing enrollment to cite, exactly
 *   as the Top100 journal import records it), else `draft`. An internal
 *   recipient never freezes a version (spec 5.3), so a sequence only ever
 *   sent to ourselves imports as a draft. Provenance is
 *   `{kind: 'modex_legacy', sequence_id, imported_at, imported_by}`;
 * - one `SequenceEnrollment` per distinct `sequence_run_id` among the items:
 *   id = the run id (spec 4.5: no queue rewrite), engine modex_draft_queue,
 *   `to_email`, `account_name`, `persona_id`, `owner` and `sender` from the
 *   items, `enrolled_at` = the earliest item's created_at, `legacy: true`,
 *   `is_test` via `isInternalRecipient`, status derived from the items:
 *     active     any item draft, approved or sending;
 *     completed  every item sent;
 *     stopped    otherwise, stop_reason `legacy_unknown` (the only legacy
 *                reason in STOP_REASONS and the SQL CHECK). WHY the run
 *                stopped is not lost: the items' own `skipped_reason`
 *                (`sequence_stopped:<reason>`, `in_thread`, ...) is the
 *                evidence, and `deriveRunStatus` still reports it as
 *                `stoppedBecause` for the dry-run report. Decided 2026-09-23.
 *   A run whose items span two sequences gets `run_spans_sequences:<run>`
 *   and no enrollment; a run whose items disagree on the recipient gets
 *   `run_mixed_recipients:<run>` and no enrollment; a run whose account is
 *   not in `accounts` (when `existing.accountNames` is given) gets
 *   `account_not_found:<run>`, because `SequenceEnrollment.account_name` is
 *   a foreign key. The partial unique on `to_email` while active is honoured
 *   in the plan: when two runs would both be active for one address, the
 *   most recently enrolled wins and the rest warn
 *   `duplicate_active_recipient:<run>`; an address already live in the
 *   ledger (`existing.activeEmails`) warns `already_enrolled:<run>`;
 * - `itemStamps`: `{id, sequence_version_id}` for every item whose stamp is
 *   still null and whose sequence got a version, including items of runs
 *   that got no enrollment (the runtime's `item_stamp` source covers them).
 *
 * Ids are deterministic (uuid v5 in GAP_MODEX_LEGACY_NS over the natural
 * key) so a re-run plans the same ids. A second run over the first run's
 * outputs plans nothing: families and versions are found by legacy id,
 * enrollments by run id, stamps by the non-null column.
 *
 * Voice: no em dashes.
 */
import { uuidV5 } from '@/lib/gap/sequence/external-sync';
import { isInternalRecipient } from '@/lib/gap/sequence/internal-recipient';
import { fromLegacyModexSteps, parseSteps, stepsHash, type LegacyStep, type StepsV2 } from '@/lib/gap/sequence/steps';
import { STATUS } from '@/lib/queue/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed namespace for family and version ids planned here. Never rotate. */
export const GAP_MODEX_LEGACY_NS = '4f1d7a2e-8b3c-4e59-9a6d-2c5e7b8f1a03';

export const ENGINE = 'modex_draft_queue' as const;
export const PROVENANCE_KIND = 'modex_legacy' as const;

/** The one legacy stop reason the taxonomy and the CHECK accept; the items' skipped_reason is the detail. */
export const STOP_REASON_UNKNOWN = 'legacy_unknown';

/** Internal detail for the report only; never written to a row. */
export type StoppedBecause = 'skipped_items' | 'no_pending_items';

const PENDING_STATUSES: readonly string[] = [STATUS.draft, STATUS.approved, STATUS.sending];

// ---------------------------------------------------------------------------
// Input shapes
// ---------------------------------------------------------------------------

/** A `sequences` row. */
export interface LegacySequenceRow {
  id: number;
  name: string;
  owner: string;
  steps: unknown;
  created_at: Date | string;
}

/** A DraftQueueItem row that belongs to a sequence. Only the fields the planner reads. */
export interface LegacySequenceItem {
  id: number;
  to_email: string;
  account_name: string;
  persona_id: number | null;
  owner: string;
  status: string;
  sequence_id: number | null;
  sequence_run_id: string | null;
  step_index: number | null;
  sequence_version_id: string | null;
  created_at: Date | string;
  updated_at?: Date | string | null;
  sent_at?: Date | string | null;
}

export interface ExistingFamily {
  id: string;
  legacy_sequence_id: number;
}

export interface ExistingVersion {
  id: string;
  family_id: string;
  version: number;
  status?: string;
}

export interface ExistingEnrollment {
  id: string;
}

export interface ExistingState {
  /** legacy sequence id (as a string) -> family row. */
  familiesByLegacyId: Record<string, ExistingFamily>;
  /** family id -> its versions (any status). */
  versionsByFamilyId: Record<string, ExistingVersion[]>;
  /** enrollment id (= run id) -> row. */
  enrollmentsById: Record<string, ExistingEnrollment>;
  /** Names present in `accounts`; when given, a run on an unknown account is warned and skipped. */
  accountNames?: Set<string>;
  /** Addresses with a live (active, paused, stop_pending) enrollment already in the ledger. */
  activeEmails?: Set<string>;
}

export interface PlanOptions {
  now: Date;
  importedBy: string;
}

// ---------------------------------------------------------------------------
// Output shapes
// ---------------------------------------------------------------------------

export interface FamilyInsert {
  id: string;
  legacy_sequence_id: number;
  name: string;
  engine: typeof ENGINE;
  created_by: string;
}

export interface VersionProvenance {
  kind: typeof PROVENANCE_KIND;
  sequence_id: number;
  imported_at: string;
  imported_by: string;
}

export interface VersionInsert {
  id: string;
  family_id: string;
  legacy_sequence_id: number;
  version: 1;
  steps: StepsV2;
  steps_hash: string;
  status: 'draft' | 'frozen';
  provenance: VersionProvenance;
  frozen_at: string | null;
  frozen_by_enrollment_id: null;
  created_by: string;
}

export type EnrollmentStatus = 'active' | 'completed' | 'stopped';

export interface EnrollmentInsert {
  id: string;
  engine: typeof ENGINE;
  family_id: string;
  sequence_version_id: string;
  legacy_sequence_id: number;
  account_name: string;
  persona_id: number | null;
  to_email: string;
  sender: string;
  owner: string;
  status: EnrollmentStatus;
  stop_reason: string | null;
  /** Report-only detail; not a column. */
  stopped_because: StoppedBecause | null;
  stopped_at: string | null;
  completed_at: string | null;
  current_step_index: number;
  is_test: boolean;
  legacy: true;
  enrolled_by: string;
  enrolled_at: string;
  item_ids: number[];
}

export interface ItemStamp {
  id: number;
  sequence_version_id: string;
}

export interface PlanCounts {
  sequences: number;
  items: number;
  runs: number;
  families_new: number;
  families_existing: number;
  versions_new: number;
  versions_existing: number;
  versions_unparseable: number;
  enrollments_new: number;
  enrollments_existing: number;
  enrollments_skipped: number;
  enrollments_active: number;
  enrollments_completed: number;
  enrollments_stopped: number;
  item_stamps: number;
  items_already_stamped: number;
  items_without_version: number;
  items_without_run: number;
}

export interface ModexLegacyPlan {
  families: FamilyInsert[];
  versions: VersionInsert[];
  enrollments: EnrollmentInsert[];
  itemStamps: ItemStamp[];
  warnings: string[];
  counts: PlanCounts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function familyIdFor(legacySequenceId: number): string {
  return uuidV5(GAP_MODEX_LEGACY_NS, `modex-family:${legacySequenceId}`);
}

export function versionIdFor(familyId: string): string {
  return uuidV5(GAP_MODEX_LEGACY_NS, `modex-version:${familyId}:1`);
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function earliest(dates: Array<Date | null>): Date | null {
  let best: Date | null = null;
  for (const d of dates) if (d && (!best || d.getTime() < best.getTime())) best = d;
  return best;
}

function latest(dates: Array<Date | null>): Date | null {
  let best: Date | null = null;
  for (const d of dates) if (d && (!best || d.getTime() > best.getTime())) best = d;
  return best;
}

function isLegacyStep(v: unknown): v is LegacyStep {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const s = v as Record<string, unknown>;
  if (!Number.isInteger(s.stepIndex) || (s.stepIndex as number) < 0) return false;
  if (typeof s.delayDays !== 'number' || !Number.isInteger(s.delayDays) || s.delayDays < 0) return false;
  if (s.subjectTemplate != null && typeof s.subjectTemplate !== 'string') return false;
  if (s.bodyTemplate != null && typeof s.bodyTemplate !== 'string') return false;
  return true;
}

export type FromLegacyResult = { ok: true; steps: StepsV2 } | { ok: false; reason: string };

/**
 * `sequences.steps` (an untyped Json column) -> steps.v2. Refuses a value
 * that is not a non-empty array of legacy steps (`not_step_array`,
 * `bad_step:<position>`), duplicate step indices (`duplicate_step_index:<n>`),
 * and anything `parseSteps` refuses after `fromLegacyModexSteps` re-indexes it.
 */
export function fromLegacySequence(raw: unknown): FromLegacyResult {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, reason: 'not_step_array' };
  const seen = new Set<number>();
  for (let i = 0; i < raw.length; i += 1) {
    const s = raw[i];
    if (!isLegacyStep(s)) return { ok: false, reason: `bad_step:${i}` };
    if (seen.has(s.stepIndex)) return { ok: false, reason: `duplicate_step_index:${s.stepIndex}` };
    seen.add(s.stepIndex);
  }
  const v2 = fromLegacyModexSteps(raw as LegacyStep[]);
  const parsed = parseSteps(v2);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  return { ok: true, steps: parsed.steps };
}

/** The enrollment status and stop reason a run's items imply. Exported for its own test. */
export function deriveRunStatus(items: readonly LegacySequenceItem[]): {
  status: EnrollmentStatus;
  stopReason: string | null;
  stoppedBecause: StoppedBecause | null;
} {
  const statuses = items.map((i) => i.status);
  if (statuses.some((s) => PENDING_STATUSES.includes(s))) return { status: 'active', stopReason: null, stoppedBecause: null };
  if (statuses.length > 0 && statuses.every((s) => s === STATUS.sent)) return { status: 'completed', stopReason: null, stoppedBecause: null };
  if (statuses.some((s) => s === STATUS.skipped)) return { status: 'stopped', stopReason: STOP_REASON_UNKNOWN, stoppedBecause: 'skipped_items' };
  return { status: 'stopped', stopReason: STOP_REASON_UNKNOWN, stoppedBecause: 'no_pending_items' };
}

// ---------------------------------------------------------------------------
// Planner
// ---------------------------------------------------------------------------

interface FamilyCtx {
  id: string;
  legacyId: number;
  versionId: string | null;
}

export function planModexLegacy(input: {
  sequences: LegacySequenceRow[];
  items: LegacySequenceItem[];
  existing: ExistingState;
  opts: PlanOptions;
}): ModexLegacyPlan {
  const { sequences, items, existing, opts } = input;
  const importedAt = opts.now.toISOString();

  const warnings: string[] = [];
  const families: FamilyInsert[] = [];
  const versions: VersionInsert[] = [];
  const enrollments: EnrollmentInsert[] = [];
  const itemStamps: ItemStamp[] = [];
  const counts: PlanCounts = {
    sequences: sequences.length,
    items: items.length,
    runs: 0,
    families_new: 0,
    families_existing: 0,
    versions_new: 0,
    versions_existing: 0,
    versions_unparseable: 0,
    enrollments_new: 0,
    enrollments_existing: 0,
    enrollments_skipped: 0,
    enrollments_active: 0,
    enrollments_completed: 0,
    enrollments_stopped: 0,
    item_stamps: 0,
    items_already_stamped: 0,
    items_without_version: 0,
    items_without_run: 0,
  };

  const itemsBySequence = new Map<number, LegacySequenceItem[]>();
  for (const item of items) {
    if (item.sequence_id == null) continue;
    const list = itemsBySequence.get(item.sequence_id) ?? [];
    list.push(item);
    itemsBySequence.set(item.sequence_id, list);
  }

  // Pass 1: families and v1, in sequence id order.
  const ctxBySequence = new Map<number, FamilyCtx>();
  const ordered = [...sequences].sort((a, b) => a.id - b.id);
  for (const row of ordered) {
    if (ctxBySequence.has(row.id)) {
      warnings.push(`duplicate_sequence:${row.id}`);
      continue;
    }
    const found = existing.familiesByLegacyId[String(row.id)];
    const familyId = found ? found.id : familyIdFor(row.id);
    if (found) counts.families_existing += 1;
    else {
      counts.families_new += 1;
      families.push({ id: familyId, legacy_sequence_id: row.id, name: row.name, engine: ENGINE, created_by: opts.importedBy });
    }

    const ctx: FamilyCtx = { id: familyId, legacyId: row.id, versionId: null };
    ctxBySequence.set(row.id, ctx);

    const existingVersions = [...(existing.versionsByFamilyId[familyId] ?? [])].sort((a, b) => a.version - b.version);
    if (existingVersions.length > 0) {
      counts.versions_existing += 1;
      ctx.versionId = existingVersions[0].id;
      continue;
    }

    const converted = fromLegacySequence(row.steps);
    if (!converted.ok) {
      counts.versions_unparseable += 1;
      warnings.push(`unparseable_steps:${row.id}`);
      continue;
    }

    const referencing = itemsBySequence.get(row.id) ?? [];
    const realTouches = referencing.filter((i) => !isInternalRecipient(i.to_email));
    const frozenAt = earliest(realTouches.map((i) => toDate(i.created_at)));
    const versionId = versionIdFor(familyId);
    versions.push({
      id: versionId,
      family_id: familyId,
      legacy_sequence_id: row.id,
      version: 1,
      steps: converted.steps,
      steps_hash: stepsHash(converted.steps),
      status: frozenAt ? 'frozen' : 'draft',
      provenance: { kind: PROVENANCE_KIND, sequence_id: row.id, imported_at: importedAt, imported_by: opts.importedBy },
      frozen_at: frozenAt ? frozenAt.toISOString() : null,
      frozen_by_enrollment_id: null,
      created_by: opts.importedBy,
    });
    counts.versions_new += 1;
    ctx.versionId = versionId;
  }

  // Pass 2: item stamps. Items keyed by their own sequence, whatever run they belong to.
  for (const item of [...items].sort((a, b) => a.id - b.id)) {
    if (item.sequence_id == null) continue;
    const ctx = ctxBySequence.get(item.sequence_id);
    if (!ctx) {
      warnings.push(`item_sequence_missing:${item.id}`);
      counts.items_without_version += 1;
      continue;
    }
    if (!ctx.versionId) {
      counts.items_without_version += 1;
      continue;
    }
    if (item.sequence_version_id !== null && item.sequence_version_id !== undefined) {
      counts.items_already_stamped += 1;
      continue;
    }
    itemStamps.push({ id: item.id, sequence_version_id: ctx.versionId });
    counts.item_stamps += 1;
  }

  // Pass 3: one enrollment per distinct run.
  const itemsByRun = new Map<string, LegacySequenceItem[]>();
  for (const item of items) {
    if (!item.sequence_run_id) {
      counts.items_without_run += 1;
      continue;
    }
    const list = itemsByRun.get(item.sequence_run_id) ?? [];
    list.push(item);
    itemsByRun.set(item.sequence_run_id, list);
  }
  counts.runs = itemsByRun.size;

  const candidates: EnrollmentInsert[] = [];
  for (const runId of [...itemsByRun.keys()].sort()) {
    const runItems = itemsByRun.get(runId)!;
    if (existing.enrollmentsById[runId]) {
      counts.enrollments_existing += 1;
      continue;
    }
    const sequenceIds = new Set(runItems.map((i) => i.sequence_id));
    if (sequenceIds.size !== 1 || sequenceIds.has(null)) {
      warnings.push(`run_spans_sequences:${runId}`);
      counts.enrollments_skipped += 1;
      continue;
    }
    const sequenceId = runItems[0].sequence_id as number;
    const ctx = ctxBySequence.get(sequenceId);
    if (!ctx || !ctx.versionId) {
      warnings.push(`run_without_version:${runId}`);
      counts.enrollments_skipped += 1;
      continue;
    }
    const emails = new Set(runItems.map((i) => i.to_email.trim().toLowerCase()));
    if (emails.size !== 1) {
      warnings.push(`run_mixed_recipients:${runId}`);
      counts.enrollments_skipped += 1;
      continue;
    }
    const email = [...emails][0];
    if (!email) {
      warnings.push(`run_no_recipient:${runId}`);
      counts.enrollments_skipped += 1;
      continue;
    }
    const byCreated = [...runItems].sort((a, b) => (toDate(a.created_at)?.getTime() ?? 0) - (toDate(b.created_at)?.getTime() ?? 0) || a.id - b.id);
    const first = byCreated[0];
    if (existing.accountNames && !existing.accountNames.has(first.account_name)) {
      warnings.push(`account_not_found:${runId}`);
      counts.enrollments_skipped += 1;
      continue;
    }
    const enrolledAt = toDate(first.created_at) ?? opts.now;
    const { status, stopReason, stoppedBecause } = deriveRunStatus(runItems);
    const sentSteps = runItems.filter((i) => i.status === STATUS.sent).map((i) => i.step_index ?? 0);
    const currentStep = sentSteps.length > 0 ? Math.max(...sentSteps) : 0;
    const lastTouch = latest(runItems.map((i) => toDate(i.updated_at) ?? toDate(i.sent_at) ?? toDate(i.created_at)));
    candidates.push({
      id: runId,
      engine: ENGINE,
      family_id: ctx.id,
      sequence_version_id: ctx.versionId,
      legacy_sequence_id: sequenceId,
      account_name: first.account_name,
      persona_id: first.persona_id ?? null,
      to_email: email,
      sender: first.owner,
      owner: first.owner,
      status,
      stop_reason: stopReason,
      stopped_because: stoppedBecause,
      stopped_at: status === 'stopped' ? (lastTouch ?? opts.now).toISOString() : null,
      completed_at: status === 'completed' ? (latest(runItems.map((i) => toDate(i.sent_at))) ?? lastTouch ?? opts.now).toISOString() : null,
      current_step_index: currentStep,
      is_test: isInternalRecipient(email),
      legacy: true,
      enrolled_by: opts.importedBy,
      enrolled_at: enrolledAt.toISOString(),
      item_ids: byCreated.map((i) => i.id),
    });
  }

  // Honour the partial unique on to_email while active: newest active run per address wins.
  const activeByEmail = new Map<string, EnrollmentInsert>();
  for (const e of candidates) {
    if (e.status !== 'active') continue;
    const held = activeByEmail.get(e.to_email);
    if (!held || e.enrolled_at > held.enrolled_at) activeByEmail.set(e.to_email, e);
  }
  for (const e of candidates) {
    if (e.status === 'active') {
      if (existing.activeEmails?.has(e.to_email)) {
        warnings.push(`already_enrolled:${e.id}`);
        counts.enrollments_skipped += 1;
        continue;
      }
      if (activeByEmail.get(e.to_email) !== e) {
        warnings.push(`duplicate_active_recipient:${e.id}`);
        counts.enrollments_skipped += 1;
        continue;
      }
    }
    enrollments.push(e);
    counts.enrollments_new += 1;
    if (e.status === 'active') counts.enrollments_active += 1;
    else if (e.status === 'completed') counts.enrollments_completed += 1;
    else counts.enrollments_stopped += 1;
  }

  return { families, versions, enrollments, itemStamps, warnings, counts };
}
