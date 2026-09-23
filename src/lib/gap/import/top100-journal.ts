/**
 * S3-T4: Top100 journal import planner (pure, no Prisma).
 *
 * The lane's `crm_changes.jsonl` is the record of every write the rig made
 * into HubSpot for the Top100 program. This planner turns it, together with
 * `run_manifest.json`, into rows for the GAP sequence ledger:
 *
 * - one `SequenceFamily` per `create/sequence` row (keyed on the HubSpot
 *   sequence id, exactly like external-sync's Sprint 2 rows), plus one per
 *   manifest sequence the journal never recorded (`manifest_only:<key>`);
 * - `SequenceVersion` rows: v1 from the `create/sequence` row and one more
 *   version per `update/sequence_templates` row that touched the family
 *   (the CAN-SPAM footer was added, then stripped again, on 2026-09-14, so a
 *   family can carry v1..v3). Steps are the lane scaffold from the manifest.
 *   A footer change lives in the HubSpot template body, not in steps.v2, so
 *   this import writes TWINS on purpose: consecutive versions share a
 *   steps_hash and differ in `provenance.template_change`
 *   ({record_ids, old, new} from the journal row, values as found). The
 *   `identical_to_version` refusal in createVersion (S3-T3) guards operator
 *   edits and does not apply to journal imports, which write with
 *   createMany. Idempotency key is `provenance.journal_ts`;
 * - `SequenceCopyEvent` rows: one per `update/contact` row whose property is
 *   `yf_top100_step{N}_{subject,body}`, keyed `${contact}|${property}|${ts}`;
 * - enrollment attribution: every existing enrollment still lacking a
 *   pinned version or rendered copy gets the family version whose journal_ts
 *   is the newest at or before `enrolled_at` (`pickVersionAt`, S3-T3) and its
 *   `rendered_steps` reconstructed from the journal's copy events at that
 *   moment (`reconstructRenderedSteps`, S3-T3).
 *
 * Journal row shape, read from the lane on 2026-09-23: CRM writes carry
 * `action` ("create" | "update") and `object` ("sequence" |
 * "sequence_templates" | "contact" | ...), never a composite `op`; the
 * `op` field appears only on the list and eligibility rows. `journalOp`
 * normalizes both spellings to `action/object`. The HubSpot record id is
 * `record_id` (a string); for `create/sequence` it is the sequence id, for
 * `update/contact` the contact id, and for `update/sequence_templates` a
 * comma-separated list (template ids when `key` names one account, sequence
 * ids when `key` is "*").
 *
 * Legacy frozen versions: when a family already has an enrollment, the
 * imported versions are `frozen` with `frozen_at = journal_ts` and
 * `frozen_by_enrollment_id = null`. Nobody enrolled through GAP, so there is
 * no single freezing enrollment to cite; the journal timestamp is the moment
 * the shape became real in HubSpot.
 *
 * Ids are deterministic (uuid v5 in GAP_JOURNAL_NS over the natural key) so
 * a re-run plans the same ids and `rendered_steps.copyEventIds` can cite
 * copy events before they are written.
 *
 * Voice: no em dashes.
 */
import {
  parsePropertyName,
  reconstructRenderedSteps,
  renderedStepsHash,
  type CopyEvent,
  type RenderedStep,
} from '@/lib/gap/sequence/copy-events';
import { uuidV5 } from '@/lib/gap/sequence/external-sync';
import { fromLaneScaffold, stepsHash, type StepsV2 } from '@/lib/gap/sequence/steps';
import { pickVersionAt, type VersionAtCandidate } from '@/lib/gap/sequence/version';
import { builtSequences, type Top100Manifest } from '@/lib/gap/top100/reader';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed namespace for family, version and copy-event ids planned here. Never rotate. */
export const GAP_JOURNAL_NS = '9c4e2b17-5f0a-4d83-b6e1-3a7f8c2d9e45';

export const ENGINE = 'hubspot_native';
export const DEFAULT_PROGRAM = 'top100';
export const COPY_EVENT_SOURCE = 'journal_import' as const;

export const OP_CREATE_SEQUENCE = 'create/sequence';
export const OP_UPDATE_TEMPLATES = 'update/sequence_templates';
export const OP_UPDATE_CONTACT = 'update/contact';

const REVISION_RE = /revision\s+(\d+)/i;

// ---------------------------------------------------------------------------
// Input shapes
// ---------------------------------------------------------------------------

/** One line of crm_changes.jsonl, as parsed. Only the fields the planner reads are typed. */
export interface JournalRow {
  ts: string;
  key?: string;
  op?: string;
  action?: string;
  object?: string;
  record_id?: string | number;
  hubspot_contact_id?: string | number;
  property?: string;
  old?: unknown;
  new?: unknown;
  evidence?: string;
  reason?: string;
  readback?: unknown;
  result?: unknown;
  by?: string;
  dry_run?: boolean;
}

export interface ExistingFamily {
  id: string;
  hubspot_sequence_id: string;
}

export interface ExistingVersion extends VersionAtCandidate {
  family_id: string;
  status?: string;
}

export interface ExistingEnrollment {
  id: string;
  family_id: string;
  hubspot_contact_id: string | null;
  enrolled_at: Date | string;
  sequence_version_id: string | null;
  rendered_steps?: unknown;
}

export interface ExistingState {
  /** hubspot_sequence_id -> family row. */
  familiesByHubspotId: Record<string, ExistingFamily>;
  /** family id -> its versions (any status). */
  versionsByFamilyId: Record<string, ExistingVersion[]>;
  /** `${hubspot_contact_id}|${property}|${ts}` of copy events already stored. */
  copyEventKeys: Set<string>;
  /** enrollment id -> row. */
  enrollmentsByKey: Record<string, ExistingEnrollment>;
  /** Account names that exist in `accounts`; when given, unknown names are nulled with a warning. */
  accountNames?: Set<string>;
}

export interface PlanOptions {
  now: Date;
  importedBy: string;
  /** Defaults to the manifest run id, else `top100`. */
  program?: string;
}

// ---------------------------------------------------------------------------
// Output shapes
// ---------------------------------------------------------------------------

export interface FamilyUpsert {
  id: string;
  key: string;
  hubspot_sequence_id: string;
  name: string;
  engine: typeof ENGINE;
  program: string;
  account_name: string | null;
  hubspot_portal_id: string | null;
  created_by: string;
}

export interface VersionProvenance {
  kind: 'journal' | 'manifest';
  op: string | null;
  journal_ts: string;
  evidence: string | null;
  journal_evidence: string | null;
  reason: string | null;
  built_at: string | null;
  imported_at: string;
  imported_by: string;
  /** Only on versions from update/sequence_templates rows: what the footer row changed. */
  template_change?: TemplateChange;
}

export interface TemplateChange {
  record_ids: string[];
  old: unknown;
  new: unknown;
}

export interface VersionInsert {
  id: string;
  family_id: string;
  hubspot_sequence_id: string;
  version: number;
  steps: StepsV2;
  steps_hash: string;
  status: 'draft' | 'frozen';
  hubspot_template_ids: Record<string, string>;
  provenance: VersionProvenance;
  change_note: string | null;
  frozen_at: string | null;
  frozen_by_enrollment_id: null;
  created_by: string;
}

export interface CopyEventInsert extends CopyEvent {
  id: string;
  /** `${hubspot_contact_id}|${property}|${ts}`, the unique key. */
  key: string;
  ts: Date;
  source: typeof COPY_EVENT_SOURCE;
}

export interface EnrollmentUpdate {
  id: string;
  sequence_version_id: string;
  rendered_steps: RenderedStep[];
  rendered_steps_hash: string;
}

export interface PlanCounts {
  rows: number;
  families_new: number;
  families_existing: number;
  families_manifest_only: number;
  versions_new: number;
  versions_existing: number;
  copy_events_journal: number;
  copy_events_new: number;
  copy_events_existing: number;
  enrollments_pending: number;
  enrollments_attributed: number;
  enrollments_unattributed: number;
  ignored_ops: number;
}

export interface JournalPlan {
  families: FamilyUpsert[];
  versions: VersionInsert[];
  copyEvents: CopyEventInsert[];
  enrollmentUpdates: EnrollmentUpdate[];
  warnings: string[];
  counts: PlanCounts;
}

// ---------------------------------------------------------------------------
// Row helpers
// ---------------------------------------------------------------------------

/** `op` when the row carries one, else `action/object`, else null. */
export function journalOp(row: JournalRow): string | null {
  if (typeof row.op === 'string' && row.op.length > 0) return row.op;
  if (typeof row.action === 'string' && typeof row.object === 'string') return `${row.action}/${row.object}`;
  return null;
}

function idString(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string' && v.length > 0) return v;
  return null;
}

function text(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** "data/sequences/<key>.json revision 2" -> "2"; null when no revision is named. */
export function parseRevision(evidence: unknown): string | null {
  if (typeof evidence !== 'string') return null;
  const m = REVISION_RE.exec(evidence);
  return m ? m[1] : null;
}

function isoOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : v;
}

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

export function copyEventKey(hubspotContactId: string, property: string, ts: string): string {
  return `${hubspotContactId}|${property}|${ts}`;
}

export function familyIdFor(hubspotSequenceId: string): string {
  return uuidV5(GAP_JOURNAL_NS, `family:${hubspotSequenceId}`);
}

export function versionIdFor(familyId: string, journalTs: string): string {
  return uuidV5(GAP_JOURNAL_NS, `version:${familyId}:${journalTs}`);
}

export function copyEventIdFor(key: string): string {
  return uuidV5(GAP_JOURNAL_NS, `copy:${key}`);
}

// ---------------------------------------------------------------------------
// Planner
// ---------------------------------------------------------------------------

interface FamilyCtx {
  id: string;
  key: string;
  hubspotSequenceId: string;
  isNew: boolean;
  hasEnrollment: boolean;
  /** Existing versions plus the ones planned in this run, for numbering and attribution. */
  candidates: ExistingVersion[];
}

export function planTop100Journal(input: {
  journalRows: JournalRow[];
  manifest: Top100Manifest;
  existing: ExistingState;
  opts: PlanOptions;
}): JournalPlan {
  const { journalRows, manifest, existing, opts } = input;
  const program = opts.program ?? (manifest.runId || DEFAULT_PROGRAM);
  const portal = manifest.portal || null;
  const importedAt = opts.now.toISOString();

  const warnings: string[] = [];
  const families: FamilyUpsert[] = [];
  const versions: VersionInsert[] = [];
  const copyEvents: CopyEventInsert[] = [];
  const enrollmentUpdates: EnrollmentUpdate[] = [];
  const counts: PlanCounts = {
    rows: journalRows.length,
    families_new: 0,
    families_existing: 0,
    families_manifest_only: 0,
    versions_new: 0,
    versions_existing: 0,
    copy_events_journal: 0,
    copy_events_new: 0,
    copy_events_existing: 0,
    enrollments_pending: 0,
    enrollments_attributed: 0,
    enrollments_unattributed: 0,
    ignored_ops: 0,
  };

  const rows = [...journalRows].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));

  const enrollmentsByFamily = new Map<string, ExistingEnrollment[]>();
  for (const e of Object.values(existing.enrollmentsByKey)) {
    const list = enrollmentsByFamily.get(e.family_id) ?? [];
    list.push(e);
    enrollmentsByFamily.set(e.family_id, list);
  }

  const bySequenceId = new Map<string, FamilyCtx>();
  const byKey = new Map<string, FamilyCtx>();

  function ensureFamily(key: string, hubspotSequenceId: string, manifestOnly: boolean): FamilyCtx {
    const known = bySequenceId.get(hubspotSequenceId);
    if (known) return known;
    const acct = manifest.accounts[key];
    const found = existing.familiesByHubspotId[hubspotSequenceId];
    const id = found ? found.id : familyIdFor(hubspotSequenceId);
    if (found) counts.families_existing += 1;
    else {
      counts.families_new += 1;
      let accountName: string | null = acct?.name || null;
      if (accountName && existing.accountNames && !existing.accountNames.has(accountName)) {
        warnings.push(`account_not_found:${key}`);
        accountName = null;
      }
      families.push({
        id,
        key,
        hubspot_sequence_id: hubspotSequenceId,
        name: acct?.sequence?.name || `${key} Top100`,
        engine: ENGINE,
        program,
        account_name: accountName,
        hubspot_portal_id: portal,
        created_by: opts.importedBy,
      });
    }
    if (manifestOnly) {
      counts.families_manifest_only += 1;
      warnings.push(`manifest_only:${key}`);
    }
    const ctx: FamilyCtx = {
      id,
      key,
      hubspotSequenceId,
      isNew: !found,
      hasEnrollment: (enrollmentsByFamily.get(id) ?? []).length > 0,
      candidates: [...(existing.versionsByFamilyId[id] ?? [])],
    };
    bySequenceId.set(hubspotSequenceId, ctx);
    byKey.set(key, ctx);
    return ctx;
  }

  function versionAlreadyAt(ctx: FamilyCtx, journalTs: string): boolean {
    return ctx.candidates.some((v) => {
      const prov = v.provenance as { journal_ts?: unknown } | null | undefined;
      return prov && typeof prov === 'object' && prov.journal_ts === journalTs;
    });
  }

  function addVersion(
    ctx: FamilyCtx,
    row: { ts: string; op: string | null; evidence?: string; reason?: string; kind: 'journal' | 'manifest'; templateChange?: TemplateChange },
    changeNote: string | null,
  ): void {
    if (versionAlreadyAt(ctx, row.ts)) {
      counts.versions_existing += 1;
      return;
    }
    const seq = manifest.accounts[ctx.key]?.sequence ?? null;
    if (!seq) {
      warnings.push(`no_manifest_sequence:${ctx.key}`);
      return;
    }
    const steps = fromLaneScaffold(seq.delaysBusinessDays, seq.templateIds);
    const max = ctx.candidates.reduce((m, v) => (v.version > m ? v.version : m), 0);
    const id = versionIdFor(ctx.id, row.ts);
    const insert: VersionInsert = {
      id,
      family_id: ctx.id,
      hubspot_sequence_id: ctx.hubspotSequenceId,
      version: max + 1,
      steps,
      steps_hash: stepsHash(steps),
      status: ctx.hasEnrollment ? 'frozen' : 'draft',
      hubspot_template_ids: { ...seq.templateIds },
      provenance: {
        kind: row.kind,
        op: row.op,
        journal_ts: row.ts,
        evidence: text(row.evidence),
        journal_evidence: text(row.evidence),
        reason: text(row.reason),
        built_at: seq.builtAt,
        imported_at: importedAt,
        imported_by: opts.importedBy,
        ...(row.templateChange ? { template_change: row.templateChange } : {}),
      },
      change_note: changeNote,
      frozen_at: ctx.hasEnrollment ? row.ts : null,
      frozen_by_enrollment_id: null,
      created_by: opts.importedBy,
    };
    versions.push(insert);
    counts.versions_new += 1;
    ctx.candidates.push({ id, family_id: ctx.id, version: insert.version, provenance: insert.provenance, created_at: row.ts, status: insert.status });
  }

  // Pass 1: families and v1 from create/sequence rows, in journal order.
  const createRows = rows.filter((r) => journalOp(r) === OP_CREATE_SEQUENCE);
  for (const row of createRows) {
    const seqId = idString(row.record_id);
    const key = text(row.key);
    if (!seqId || !key) {
      warnings.push(`create_row_unusable:${row.ts}`);
      continue;
    }
    if (bySequenceId.has(seqId)) {
      warnings.push(`duplicate_create:${seqId}`);
      continue;
    }
    const ctx = ensureFamily(key, seqId, false);
    addVersion(ctx, { ts: row.ts, op: OP_CREATE_SEQUENCE, evidence: row.evidence, reason: row.reason, kind: 'journal' }, text(row.reason));
  }

  // Manifest sequences the journal never recorded.
  for (const acct of builtSequences(manifest)) {
    const seq = acct.sequence!;
    if (bySequenceId.has(seq.hubspotSequenceId)) continue;
    const ctx = ensureFamily(acct.key, seq.hubspotSequenceId, true);
    if (seq.builtAt && isoOrNull(seq.builtAt)) {
      addVersion(ctx, { ts: seq.builtAt, op: null, evidence: 'run_manifest.json accounts[key].sequence.built_at', reason: undefined, kind: 'manifest' }, 'manifest built_at; no create/sequence journal row');
    }
  }

  // Pass 2: later versions from update/sequence_templates rows, in journal order.
  for (const row of rows) {
    if (journalOp(row) !== OP_UPDATE_TEMPLATES) continue;
    const key = text(row.key);
    const targets: FamilyCtx[] = [];
    const recordIds = String(row.record_id ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (key && key !== '*') {
      const ctx = byKey.get(key);
      if (ctx) targets.push(ctx);
    } else {
      for (const id of recordIds) {
        const ctx = bySequenceId.get(id);
        if (ctx) targets.push(ctx);
      }
    }
    const templateChange: TemplateChange = { record_ids: recordIds, old: row.old ?? null, new: row.new ?? null };
    if (targets.length === 0) {
      warnings.push(`footer_row_unresolved:${row.ts}`);
      continue;
    }
    const note = [text(row.reason), text(row.new)].filter(Boolean).join(' | ') || null;
    for (const ctx of targets) {
      addVersion(ctx, { ts: row.ts, op: OP_UPDATE_TEMPLATES, evidence: row.evidence, reason: row.reason, kind: 'journal', templateChange }, note);
    }
  }

  // Pass 3: copy events. Every matching journal row is kept for reconstruction;
  // only the ones not already stored are emitted for insert.
  const journalEvents: CopyEventInsert[] = [];
  const seenKeys = new Set<string>();
  for (const row of rows) {
    const op = journalOp(row);
    if (op === OP_CREATE_SEQUENCE || op === OP_UPDATE_TEMPLATES) continue;
    if (op !== OP_UPDATE_CONTACT) {
      counts.ignored_ops += 1;
      continue;
    }
    const parsed = parsePropertyName(row.property ?? '');
    if (!parsed.ok) {
      counts.ignored_ops += 1;
      continue;
    }
    const contactId = idString(row.hubspot_contact_id) ?? idString(row.record_id);
    if (!contactId) {
      warnings.push(`copy_event_no_contact:${row.ts}`);
      continue;
    }
    if (typeof row.new !== 'string') {
      warnings.push(`copy_event_bad_value:${copyEventKey(contactId, row.property!, row.ts)}`);
      continue;
    }
    const key = copyEventKey(contactId, row.property!, row.ts);
    if (seenKeys.has(key)) {
      warnings.push(`duplicate_copy_event:${key}`);
      continue;
    }
    seenKeys.add(key);
    counts.copy_events_journal += 1;
    const event: CopyEventInsert = {
      id: copyEventIdFor(key),
      key,
      hubspotContactId: contactId,
      accountKey: text(row.key) ?? '',
      property: row.property!,
      stepIndex: parsed.stepIndex,
      field: parsed.field,
      oldValue: typeof row.old === 'string' ? row.old : row.old == null ? null : JSON.stringify(row.old),
      newValue: row.new,
      ts: new Date(row.ts),
      evidence: text(row.evidence),
      revision: parseRevision(row.evidence),
      readback: row.readback ?? null,
      result: typeof row.result === 'string' ? row.result : row.result == null ? null : JSON.stringify(row.result),
      pushedBy: text(row.by),
      source: COPY_EVENT_SOURCE,
    };
    journalEvents.push(event);
    if (existing.copyEventKeys.has(key)) counts.copy_events_existing += 1;
    else {
      copyEvents.push(event);
      counts.copy_events_new += 1;
    }
  }

  const eventsByContact = new Map<string, CopyEventInsert[]>();
  for (const e of journalEvents) {
    const list = eventsByContact.get(e.hubspotContactId) ?? [];
    list.push(e);
    eventsByContact.set(e.hubspotContactId, list);
  }

  // Pass 4: legacy enrollment attribution.
  const ctxByFamilyId = new Map<string, FamilyCtx>();
  for (const ctx of bySequenceId.values()) ctxByFamilyId.set(ctx.id, ctx);

  const pending = Object.values(existing.enrollmentsByKey)
    .filter((e) => e.sequence_version_id === null || e.rendered_steps === null || e.rendered_steps === undefined)
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const e of pending) {
    counts.enrollments_pending += 1;
    const ctx = ctxByFamilyId.get(e.family_id);
    const candidates = (ctx ? ctx.candidates : (existing.versionsByFamilyId[e.family_id] ?? [])).filter((v) => {
      const prov = v.provenance as { journal_ts?: unknown } | null | undefined;
      return !!prov && typeof prov === 'object' && typeof prov.journal_ts === 'string';
    });
    const enrolledAt = toDate(e.enrolled_at);
    const version = pickVersionAt(candidates, enrolledAt);
    if (!version) {
      counts.enrollments_unattributed += 1;
      warnings.push(`no_version_before_enrollment:${e.id}`);
      continue;
    }
    const stepCount = stepCountOf(version, versions);
    const events = e.hubspot_contact_id ? (eventsByContact.get(e.hubspot_contact_id) ?? []) : [];
    const rendered = reconstructRenderedSteps(events, enrolledAt, stepCount, e.hubspot_contact_id ?? undefined);
    enrollmentUpdates.push({
      id: e.id,
      sequence_version_id: version.id,
      rendered_steps: rendered,
      rendered_steps_hash: renderedStepsHash(rendered),
    });
    counts.enrollments_attributed += 1;
  }

  return { families, versions, copyEvents, enrollmentUpdates, warnings, counts };
}

/** Steps in the picked version: a planned insert knows its steps; an existing row falls back to the four-step lane. */
function stepCountOf(version: VersionAtCandidate, planned: VersionInsert[]): number {
  const own = planned.find((v) => v.id === version.id);
  if (own) return own.steps.steps.length;
  const steps = (version as { steps?: unknown }).steps;
  if (Array.isArray(steps)) return steps.length;
  if (steps && typeof steps === 'object' && Array.isArray((steps as { steps?: unknown }).steps)) {
    return (steps as { steps: unknown[] }).steps.length;
  }
  return 4;
}

/** Parse crm_changes.jsonl text. Blank lines are skipped; a malformed line throws `bad_journal_line:<n>`. */
export function parseJournal(text: string): JournalRow[] {
  const out: JournalRow[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    let row: unknown;
    try {
      row = JSON.parse(line);
    } catch {
      throw new Error(`bad_journal_line:${i + 1}`);
    }
    if (!row || typeof row !== 'object' || typeof (row as { ts?: unknown }).ts !== 'string') {
      throw new Error(`bad_journal_line:${i + 1}`);
    }
    out.push(row as JournalRow);
  }
  return out;
}
