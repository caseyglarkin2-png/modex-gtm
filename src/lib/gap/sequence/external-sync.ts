/**
 * S2-T4: enrollment-truth sync from the Top100 lane and HubSpot (READ-ONLY).
 *
 * Phase 1 is ledger only. modex records what the lane's manifest says was
 * built and what HubSpot says about each roster contact, as `SequenceFamily`
 * rows (one per built sequence), a placeholder draft `SequenceVersion` v1 per
 * family, and `legacy=true` `SequenceEnrollment` rows for the contacts HubSpot
 * reports as actively enrolled in that account's own Top100 sequence. modex
 * never enrolls or unenrolls anyone here; the rig and Casey remain the
 * actuators. This module has no HubSpot client import and no write surface:
 * the only external call is `deps.readContacts`, injected by the caller, and
 * a structural test greps this file for any write pattern.
 *
 * Readback semantics, mirrored from the lane's scripts/enrolled-truth.mjs:
 * a contact counts as in the account's sequence when
 * `hs_sequences_actively_enrolled_count > 0` and
 * `hs_latest_sequence_enrolled` equals the account's sequence id. Actively
 * enrolled elsewhere (for instance the 2026-09-11 blast sequence) is reported,
 * not guessed. Not enrolled produces no row: a stopped legacy row is never
 * synthesized because we cannot know the contact ever ran.
 *
 * Idempotency: families upsert on `hubspot_sequence_id`; enrollment ids are
 * uuid v5 over `${hubspot_sequence_id}:${hubspot_contact_id}` in
 * GAP_ENROLLMENT_NS, so a second run with the same readback writes nothing.
 * On an existing enrollment only `external_state`, `external_synced_at`,
 * `status` (active to stopped), `stop_reason` and `stopped_at` ever change;
 * the pinned columns are never written (the GAP_ENROLLMENT_PIN trigger refuses
 * them anyway), a stopped row is never reopened, and a row with a stop
 * requested keeps its status for the stop path to finish.
 *
 * Completion sweep (R2-6): an active row whose contact HubSpot no longer
 * reports in that sequence is `stopped` with `stop_reason: 'legacy_unknown'`,
 * never `completed`, because the readback cannot tell a natural finish from a
 * reply, a bounce or a manual unenroll. When the contact is still actively
 * enrolled somewhere (`activelyEnrolledCount > 0`) but the latest sequence
 * differs, the row may still be running in ours (HubSpot exposes only the
 * latest), so the sweep holds: `external_state.hold = 'other_sequence_active'`
 * is recorded, the status is untouched, and the row is counted
 * `otherSequenceActive`.
 */
import { hash } from 'node:crypto';

import { LANE_PURPOSES, LANE_PURPOSE_MAP } from '@/lib/gap/taxonomy';
import { builtSequences, type Top100Manifest, type Top100ManifestAccount, type Top100RosterPerson } from '@/lib/gap/top100/reader';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed namespace for enrollment ids. Changing it re-keys every legacy row; never rotate. */
export const GAP_ENROLLMENT_NS = '4b2f1c9e-7d3a-4f6b-9c1e-2a8d5e0b7f31';

/** The 2026-09-11 blast sequence; roster contacts still in it are reported, not counted as Top100. */
export const BLAST_SEQUENCE_2026_09_11 = '311261507';

/** Exactly the properties the lane's enrolled-truth script reads. */
export const READBACK_PROPERTIES = [
  'hs_sequences_actively_enrolled_count',
  'hs_latest_sequence_enrolled',
  'hs_latest_sequence_enrolled_date',
] as const;

export const READBACK_BATCH_SIZE = 100;

const ENGINE = 'hubspot_native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FamilyPlan {
  key: string;
  accountName: string;
  hubspotCompanyId: string | null;
  hubspotSequenceId: string;
  name: string;
  templateIds: Record<string, string>;
  delaysBusinessDays: number[];
  builtAt: string | null;
  preferredSender: string | null;
  program: string;
  portal: string;
  createdBy: string;
}

export type FamilySkipReason = 'account_not_found';

export interface FamilyIds {
  familyId: string;
  versionId: string;
}

export interface FamilyUpsertResult {
  created: number;
  existing: number;
  skipped: Array<{ key: string; reason: FamilySkipReason }>;
  /** hubspot_sequence_id -> ids; null when a dry run would have created the family. */
  ids: Record<string, FamilyIds | null>;
}

export interface ContactReadback {
  activelyEnrolledCount: number;
  latestSequenceId: string | null;
  latestEnrolledAt: Date | null;
}

/** The JSON shape stored in `external_state`; dates as ISO strings so deep equality is stable. */
export interface ExternalState {
  activelyEnrolledCount: number;
  latestSequenceId: string | null;
  latestEnrolledAt: string | null;
  /** R2-6: set by the sweep when the contact is actively enrolled elsewhere and this row could not be resolved. */
  hold?: 'other_sequence_active';
  /**
   * N7: `enrolled_at` is NOT NULL in the schema, so when the readback carries
   * no `hs_latest_sequence_enrolled_date` the row is written with `now` and
   * this marker says the column is a placeholder. Sticky for the life of the
   * row: the column is pinned and a later date cannot correct it.
   */
  enrolled_at_unknown?: true;
  /**
   * N7: `current_step_index` is NOT NULL and the readback never carries a
   * step, so every HubSpot-native legacy row holds 0 as a placeholder.
   */
  current_step_index_unknown?: true;
}

export interface ReadContactsDeps {
  readContacts: (
    ids: string[],
    properties: string[],
  ) => Promise<Array<{ id: string; properties: Record<string, string | null | undefined> }>>;
}

export type ReportedReason = 'other_sequence' | 'not_enrolled' | 'no_email' | 'no_contact_id';

export interface ReportedContact {
  contactId: string | null;
  reason: ReportedReason;
  detail?: string;
}

export interface EnrollmentPlan {
  id: string;
  accountName: string;
  hubspotContactId: string;
  hubspotSequenceId: string;
  toEmail: string;
  sender: string;
  owner: string;
  status: 'active';
  enrolledAt: Date;
  externalState: ExternalState;
  legacy: true;
  enrolledBy: string;
}

export type HeldReason =
  | 'stopped_not_reopened'
  | 'not_reopened'
  | 'family_unresolved'
  /** N7: the partial unique on to_email refused the create; the run continues. */
  | `enroll_collision:${string}`;

export interface ApplyResult {
  created: number;
  updated: number;
  unchanged: number;
  /** R2-6: active rows held because the contact is actively enrolled in a different sequence. Not counted in updated/unchanged. */
  otherSequenceActive: number;
  held: Array<{ id: string; reason: HeldReason }>;
}

export interface SyncReport {
  dryRun: boolean;
  families: Omit<FamilyUpsertResult, 'ids'>;
  contactsRead: number;
  enrollments: ApplyResult;
  reported: Record<ReportedReason, number>;
  rostersMissing: string[];
}

// Minimal structural view of the Prisma delegates this module touches, so the
// tests can hand in an in-memory store and the module compiles without the
// generated client types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = any;
export interface SyncPrisma {
  account: { findFirst(args: Args): PromiseLike<Row | null> };
  sequenceFamily: { findUnique(args: Args): PromiseLike<Row | null>; create(args: Args): PromiseLike<Row> };
  sequenceVersion: { findFirst(args: Args): PromiseLike<Row | null>; create(args: Args): PromiseLike<Row> };
  sequenceEnrollment: {
    findUnique(args: Args): PromiseLike<Row | null>;
    findMany(args: Args): PromiseLike<Row[]>;
    create(args: Args): PromiseLike<Row>;
    update(args: Args): PromiseLike<Row>;
  };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** JSON with object keys sorted at every depth; arrays keep their order. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortKeys((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

/** sha256 hex of the canonical JSON of a steps array. */
export function stepsHash(steps: unknown): string {
  return hash('sha256', canonicalJson(steps), 'hex');
}

/** RFC 4122 v5: sha1(namespace bytes + name), version and variant bits set. */
export function uuidV5(namespace: string, name: string): string {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const digest = hash('sha1', Buffer.concat([ns, Buffer.from(name, 'utf8')]), 'buffer');
  const b = Buffer.from(digest.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Deterministic enrollment id for a HubSpot-native enrollment (no external id exists). */
export function enrollmentId(hubspotSequenceId: string, hubspotContactId: string): string {
  return uuidV5(GAP_ENROLLMENT_NS, `${hubspotSequenceId}:${hubspotContactId}`);
}

function toExternalState(rb: ContactReadback): ExternalState {
  return {
    activelyEnrolledCount: rb.activelyEnrolledCount,
    latestSequenceId: rb.latestSequenceId,
    latestEnrolledAt: rb.latestEnrolledAt ? rb.latestEnrolledAt.toISOString() : null,
  };
}

function sameState(a: unknown, b: ExternalState): boolean {
  return canonicalJson(a ?? null) === canonicalJson(b);
}

/** N7: the placeholder markers, once on a row, survive every later readback. */
function withStickyMarkers(existing: unknown, next: ExternalState): ExternalState {
  const prev = (existing && typeof existing === 'object' ? existing : {}) as Partial<ExternalState>;
  return {
    ...next,
    ...(prev.enrolled_at_unknown === true ? { enrolled_at_unknown: true as const } : {}),
    ...(prev.current_step_index_unknown === true ? { current_step_index_unknown: true as const } : {}),
  };
}

/** Prisma's unique-violation code, matched structurally so the module needs no client import. */
function isUniqueViolation(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: unknown }).code === 'P2002';
}

function inSequence(rb: ContactReadback | undefined, sequenceId: string): boolean {
  return !!rb && rb.activelyEnrolledCount > 0 && rb.latestSequenceId === sequenceId;
}

/**
 * The placeholder steps.v2 scaffold for a lane-built family. Sprint 3 replaces
 * it with the real version reconstructed from the journal. Step 0 never allows
 * product proof; later steps default to allowed because the lane's later
 * touches cite claims, and the compiler re-decides per step when it runs.
 */
function scaffoldSteps(plan: FamilyPlan) {
  return LANE_PURPOSES.map((sourcePurpose, i) => ({
    index: i,
    delay: { value: plan.delaysBusinessDays[i] ?? 0, unit: 'business_days' },
    purpose: LANE_PURPOSE_MAP[sourcePurpose],
    sourcePurpose,
    condition: null,
    askType: null,
    productProofAllowed: i > 0,
    requiredEvidenceTypes: [] as string[],
    claimsUsed: [] as string[],
    templates: { hubspotTemplateId: plan.templateIds[String(i + 1)] ?? null },
  }));
}

// ---------------------------------------------------------------------------
// Families
// ---------------------------------------------------------------------------

/** One plan per built sequence in the manifest, in rank order. */
export function planFamilies(
  manifest: Top100Manifest,
  opts: { program: string; portal: string; createdBy: string },
): FamilyPlan[] {
  return builtSequences(manifest).map((acct) => {
    const seq = acct.sequence!;
    return {
      key: acct.key,
      accountName: acct.name,
      hubspotCompanyId: acct.hubspotCompanyId,
      hubspotSequenceId: seq.hubspotSequenceId,
      name: seq.name,
      templateIds: { ...seq.templateIds },
      delaysBusinessDays: [...seq.delaysBusinessDays],
      builtAt: seq.builtAt,
      preferredSender: acct.preferredSender,
      program: opts.program,
      portal: opts.portal,
      createdBy: opts.createdBy,
    };
  });
}

async function resolveAccountName(prisma: SyncPrisma, plan: FamilyPlan): Promise<string | null> {
  const or: Row[] = [];
  if (plan.accountName) or.push({ name: plan.accountName });
  if (plan.hubspotCompanyId) or.push({ hubspot_company_id: plan.hubspotCompanyId });
  if (or.length === 0) return null;
  const hit = await prisma.account.findFirst({ where: { OR: or }, select: { name: true, hubspot_company_id: true } });
  return hit ? (hit.name as string) : null;
}

/**
 * Ensure a `SequenceFamily` and its placeholder draft v1 exist for each plan.
 * Missing accounts are skipped (`account_not_found`); no stub account is
 * created here. An existing family or version is never modified.
 */
export async function upsertFamilies(
  prisma: SyncPrisma,
  plans: FamilyPlan[],
  opts: { dryRun: boolean; now: Date },
): Promise<FamilyUpsertResult> {
  const result: FamilyUpsertResult = { created: 0, existing: 0, skipped: [], ids: {} };

  for (const plan of plans) {
    const accountName = await resolveAccountName(prisma, plan);
    if (!accountName) {
      result.skipped.push({ key: plan.key, reason: 'account_not_found' });
      continue;
    }

    let family = await prisma.sequenceFamily.findUnique({ where: { hubspot_sequence_id: plan.hubspotSequenceId } });
    if (family) {
      result.existing += 1;
    } else {
      result.created += 1;
      if (opts.dryRun) {
        result.ids[plan.hubspotSequenceId] = null;
        continue;
      }
      family = await prisma.sequenceFamily.create({
        data: {
          engine: ENGINE,
          program: plan.program,
          account_name: accountName,
          hubspot_sequence_id: plan.hubspotSequenceId,
          hubspot_portal_id: plan.portal,
          name: plan.name,
          created_by: plan.createdBy,
        },
      });
    }

    let version = await prisma.sequenceVersion.findFirst({ where: { family_id: family.id, version: 1 } });
    if (!version) {
      if (opts.dryRun) {
        result.ids[plan.hubspotSequenceId] = null;
        continue;
      }
      const steps = scaffoldSteps(plan);
      version = await prisma.sequenceVersion.create({
        data: {
          family_id: family.id,
          version: 1,
          steps,
          steps_hash: stepsHash(steps),
          status: 'draft',
          hubspot_template_ids: { ...plan.templateIds },
          provenance: {
            source: 'manifest',
            builtAt: plan.builtAt,
            importedAt: opts.now.toISOString(),
            importedBy: plan.createdBy,
          },
          created_by: plan.createdBy,
        },
      });
    }

    result.ids[plan.hubspotSequenceId] = { familyId: family.id as string, versionId: version.id as string };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Readback
// ---------------------------------------------------------------------------

function parseCount(v: string | null | undefined): number {
  if (typeof v !== 'string' || v.trim() === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(v: string | null | undefined): Date | null {
  if (typeof v !== 'string' || v.trim() === '') return null;
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function nonEmpty(v: string | null | undefined): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** Read the three sequence properties for each contact id, batching by 100. */
export async function readbackContacts(deps: ReadContactsDeps, contactIds: string[]): Promise<Map<string, ContactReadback>> {
  const out = new Map<string, ContactReadback>();
  const ids = [...new Set(contactIds)];
  for (let i = 0; i < ids.length; i += READBACK_BATCH_SIZE) {
    const rows = await deps.readContacts(ids.slice(i, i + READBACK_BATCH_SIZE), [...READBACK_PROPERTIES]);
    for (const row of rows) {
      const p = row.properties ?? {};
      out.set(String(row.id), {
        activelyEnrolledCount: parseCount(p.hs_sequences_actively_enrolled_count),
        latestSequenceId: nonEmpty(p.hs_latest_sequence_enrolled),
        latestEnrolledAt: parseDate(p.hs_latest_sequence_enrolled_date),
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

/**
 * Decide, per roster person, whether HubSpot says they are in the account's
 * Top100 sequence (a plan) or something else (reported). Pure.
 */
export function planEnrollments(
  manifestAccounts: Top100ManifestAccount[],
  rosterByKey: Record<string, Top100RosterPerson[]>,
  readback: Map<string, ContactReadback>,
  opts: { now: Date; enrolledBy: string; owner?: string },
): { plans: EnrollmentPlan[]; reported: ReportedContact[] } {
  const plans: EnrollmentPlan[] = [];
  const reported: ReportedContact[] = [];
  const owner = opts.owner ?? opts.enrolledBy;

  for (const acct of manifestAccounts) {
    const seq = acct.sequence;
    if (!seq) continue;
    for (const person of rosterByKey[acct.key] ?? []) {
      const contactId = person.hubspotContactId;
      if (!contactId) {
        reported.push({ contactId: null, reason: 'no_contact_id', detail: person.name });
        continue;
      }
      const rb = readback.get(contactId);
      if (!rb) {
        reported.push({ contactId, reason: 'not_enrolled', detail: 'no_readback_row' });
        continue;
      }
      if (rb.activelyEnrolledCount <= 0) {
        reported.push({ contactId, reason: 'not_enrolled' });
        continue;
      }
      if (rb.latestSequenceId !== seq.hubspotSequenceId) {
        reported.push({ contactId, reason: 'other_sequence', detail: rb.latestSequenceId ?? 'unknown' });
        continue;
      }
      if (!person.email) {
        reported.push({ contactId, reason: 'no_email' });
        continue;
      }
      plans.push({
        id: enrollmentId(seq.hubspotSequenceId, contactId),
        accountName: acct.name,
        hubspotContactId: contactId,
        hubspotSequenceId: seq.hubspotSequenceId,
        toEmail: person.email.toLowerCase(),
        sender: acct.preferredSender ?? 'unknown',
        owner,
        status: 'active',
        enrolledAt: rb.latestEnrolledAt ?? opts.now,
        externalState: {
          ...toExternalState(rb),
          ...(rb.latestEnrolledAt ? {} : { enrolled_at_unknown: true as const }),
          current_step_index_unknown: true,
        },
        legacy: true,
        enrolledBy: opts.enrolledBy,
      });
    }
  }

  return { plans, reported };
}

/**
 * Write the plans and reconcile existing HubSpot-native rows against the
 * readback. Only `external_state`, `external_synced_at`, `status` (active to
 * stopped), `stop_reason` and `stopped_at` are ever written on an existing row.
 */
export async function applyEnrollments(
  prisma: SyncPrisma,
  plans: EnrollmentPlan[],
  opts: { dryRun: boolean; now: Date; familyIds: Record<string, FamilyIds | null>; readback: Map<string, ContactReadback> },
): Promise<ApplyResult> {
  const result: ApplyResult = { created: 0, updated: 0, unchanged: 0, otherSequenceActive: 0, held: [] };
  const seen = new Set<string>();

  for (const plan of plans) {
    seen.add(plan.id);
    const existing = await prisma.sequenceEnrollment.findUnique({ where: { id: plan.id } });

    if (!existing) {
      const ids = opts.familyIds[plan.hubspotSequenceId];
      if (!ids && !opts.dryRun) {
        result.held.push({ id: plan.id, reason: 'family_unresolved' });
        continue;
      }
      if (opts.dryRun) {
        result.created += 1;
        continue;
      }
      try {
        await prisma.sequenceEnrollment.create({
          data: {
            id: plan.id,
            engine: ENGINE,
            family_id: ids!.familyId,
            sequence_version_id: ids!.versionId,
            account_name: plan.accountName,
            to_email: plan.toEmail,
            hubspot_contact_id: plan.hubspotContactId,
            hubspot_sequence_id: plan.hubspotSequenceId,
            sender: plan.sender,
            owner: plan.owner,
            status: plan.status,
            // N7: placeholder; external_state.current_step_index_unknown says so.
            current_step_index: 0,
            external_state: plan.externalState,
            external_synced_at: opts.now,
            is_test: false,
            legacy: plan.legacy,
            enrolled_by: plan.enrolledBy,
            // N7: placeholder (now) when the readback had no date; external_state.enrolled_at_unknown says so.
            enrolled_at: plan.enrolledAt,
          },
        });
        result.created += 1;
      } catch (err) {
        // N7: the partial unique on to_email (active/paused/stop_pending) says
        // this address already has a live row under another id. Report it and
        // keep going; anything else is a real failure and aborts the run.
        if (!isUniqueViolation(err)) throw err;
        result.held.push({ id: plan.id, reason: `enroll_collision:${plan.toEmail}` });
      }
      continue;
    }

    // HubSpot says active in this sequence; the row already exists.
    if (existing.status !== 'active') {
      result.held.push({ id: plan.id, reason: existing.status === 'stopped' ? 'stopped_not_reopened' : 'not_reopened' });
    }
    const nextState = withStickyMarkers(existing.external_state, plan.externalState);
    if (sameState(existing.external_state, nextState)) {
      if (existing.status === 'active') result.unchanged += 1;
      continue;
    }
    result.updated += 1;
    if (opts.dryRun) continue;
    await prisma.sequenceEnrollment.update({
      where: { id: plan.id },
      data: { external_state: nextState, external_synced_at: opts.now },
    });
  }

  // Active rows not in this run's plans: if the readback covers the contact
  // and says they are no longer actively enrolled anywhere, the run is over
  // for a reason HubSpot does not expose (stopped, legacy_unknown). If they
  // are still actively enrolled but the latest sequence is another one, hold.
  const sequenceIds = [...new Set([...Object.keys(opts.familyIds), ...plans.map((p) => p.hubspotSequenceId)])];
  if (sequenceIds.length > 0) {
    const active = await prisma.sequenceEnrollment.findMany({
      where: { engine: ENGINE, status: 'active', hubspot_sequence_id: { in: sequenceIds } },
    });
    for (const row of active) {
      if (seen.has(row.id)) continue;
      const rb = row.hubspot_contact_id ? opts.readback.get(String(row.hubspot_contact_id)) : undefined;
      if (!rb) continue; // not observed this run; say nothing
      if (inSequence(rb, String(row.hubspot_sequence_id))) continue; // covered by a plan if it was in scope
      const state = withStickyMarkers(row.external_state, toExternalState(rb));
      if (rb.activelyEnrolledCount > 0) {
        // R2-6: actively enrolled elsewhere; ours may still be running.
        const heldState: ExternalState = { ...state, hold: 'other_sequence_active' };
        result.otherSequenceActive += 1;
        if (sameState(row.external_state, heldState) || opts.dryRun) continue;
        await prisma.sequenceEnrollment.update({
          where: { id: row.id },
          data: { external_state: heldState, external_synced_at: opts.now },
        });
        continue;
      }
      const stopRequested = row.stop_requested_at !== null && row.stop_requested_at !== undefined;
      if (stopRequested && sameState(row.external_state, state)) {
        result.unchanged += 1;
        continue;
      }
      result.updated += 1;
      if (opts.dryRun) continue;
      await prisma.sequenceEnrollment.update({
        where: { id: row.id },
        data: stopRequested
          ? { external_state: state, external_synced_at: opts.now }
          : { status: 'stopped', stop_reason: 'legacy_unknown', stopped_at: opts.now, external_state: state, external_synced_at: opts.now },
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

/** The whole sync: families from the manifest, enrollments from the injected readback. */
export async function runEnrollmentSync(
  prisma: SyncPrisma,
  opts: {
    manifest: Top100Manifest;
    rosters: Record<string, Top100RosterPerson[]>;
    now: Date;
    dryRun: boolean;
    program: string;
    portal: string;
    actor: string;
  },
  deps: ReadContactsDeps,
): Promise<SyncReport> {
  const familyPlans = planFamilies(opts.manifest, { program: opts.program, portal: opts.portal, createdBy: opts.actor });
  const families = await upsertFamilies(prisma, familyPlans, { dryRun: opts.dryRun, now: opts.now });

  const accounts = builtSequences(opts.manifest);
  const rostersMissing: string[] = [];
  const contactIds: string[] = [];
  for (const acct of accounts) {
    const people = opts.rosters[acct.key];
    if (!people) {
      rostersMissing.push(acct.key);
      continue;
    }
    for (const p of people) if (p.hubspotContactId) contactIds.push(p.hubspotContactId);
  }

  const readback = await readbackContacts(deps, contactIds);
  const { plans, reported } = planEnrollments(accounts, opts.rosters, readback, { now: opts.now, enrolledBy: opts.actor });
  const enrollments = await applyEnrollments(prisma, plans, { dryRun: opts.dryRun, now: opts.now, familyIds: families.ids, readback });

  const counts: Record<ReportedReason, number> = { other_sequence: 0, not_enrolled: 0, no_email: 0, no_contact_id: 0 };
  for (const r of reported) counts[r.reason] += 1;

  return {
    dryRun: opts.dryRun,
    families: { created: families.created, existing: families.existing, skipped: families.skipped },
    contactsRead: readback.size,
    enrollments,
    reported: counts,
    rostersMissing,
  };
}
