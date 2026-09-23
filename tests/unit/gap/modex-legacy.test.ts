/**
 * S3-T5: the modex legacy import planner over an inline fixture. Pure: no
 * Prisma, no clock beyond the `now` we pass in.
 *
 * Fixture: three sequences (1 and 2 parse, 3 does not) and six runs:
 *   run-complete   seq 1, both steps sent                      -> completed
 *   run-active     seq 2, step 0 sent, step 1 approved         -> active
 *   run-spans      items on seq 1 AND seq 2                    -> warned, no enrollment
 *   run-skipped    seq 1, step 0 sent, step 1 skipped; item already stamped -> stopped legacy_unknown (skipped_items)
 *   run-bad        seq 3 (unparseable)                         -> no version, no stamp, no enrollment
 *   run-internal   seq 4 sent only to casey@freightroll.com    -> is_test, version stays draft
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fromLegacyModexSteps, stepsHash } from '@/lib/gap/sequence/steps';
import { toLegacySteps } from '@/lib/gap/sequence/resolve-steps';
import {
  deriveRunStatus,
  familyIdFor,
  fromLegacySequence,
  planModexLegacy,
  STOP_REASON_UNKNOWN,
  versionIdFor,
  type ExistingState,
  type LegacySequenceItem,
  type LegacySequenceRow,
  type ModexLegacyPlan,
} from '@/lib/gap/import/modex-legacy';
import { STOP_REASONS } from '@/lib/gap/taxonomy';

const CLI_PATH = join(process.cwd(), 'scripts', 'gap', 'import-modex-legacy.ts');
const PLANNER_PATH = join(process.cwd(), 'src', 'lib', 'gap', 'import', 'modex-legacy.ts');

const NOW = new Date('2026-09-23T12:00:00.000Z');
const OPTS = { now: NOW, importedBy: 'test-import' };

const SEQ1_STEPS = [
  { stepIndex: 0, delayDays: 0, subjectTemplate: 'S0', bodyTemplate: 'B0' },
  { stepIndex: 1, delayDays: 3, subjectTemplate: 'S1', bodyTemplate: 'B1' },
];
const SEQ2_STEPS = [
  { stepIndex: 0, delayDays: 0 },
  { stepIndex: 1, delayDays: 2, subjectTemplate: 'T1' },
  { stepIndex: 2, delayDays: 4, bodyTemplate: 'U2' },
];

const sequences: LegacySequenceRow[] = [
  { id: 1, name: 'Yard intro', owner: 'casey@freightroll.com', steps: SEQ1_STEPS, created_at: '2026-05-01T00:00:00.000Z' },
  { id: 2, name: 'Three touch', owner: 'casey@freightroll.com', steps: SEQ2_STEPS, created_at: '2026-05-02T00:00:00.000Z' },
  { id: 3, name: 'Broken', owner: 'casey@freightroll.com', steps: 'oops', created_at: '2026-05-03T00:00:00.000Z' },
  { id: 4, name: 'Internal only', owner: 'casey@freightroll.com', steps: SEQ1_STEPS, created_at: '2026-05-04T00:00:00.000Z' },
];

function it_(id: number, overrides: Partial<LegacySequenceItem>): LegacySequenceItem {
  return {
    id,
    to_email: 'a@acme.example',
    account_name: 'Acme',
    persona_id: 7,
    owner: 'casey@freightroll.com',
    status: 'sent',
    sequence_id: 1,
    sequence_run_id: 'run-complete',
    step_index: 0,
    sequence_version_id: null,
    created_at: '2026-06-01T14:00:00.000Z',
    updated_at: '2026-06-01T14:05:00.000Z',
    sent_at: '2026-06-01T14:05:00.000Z',
    ...overrides,
  };
}

const items: LegacySequenceItem[] = [
  // run-complete: seq 1, both sent
  it_(10, {}),
  it_(11, { step_index: 1, created_at: '2026-06-04T14:00:00.000Z', updated_at: '2026-06-04T14:05:00.000Z', sent_at: '2026-06-04T14:05:00.000Z' }),
  // run-active: seq 2, step 0 sent, step 1 approved
  it_(20, { to_email: 'b@beta.example', account_name: 'Beta', persona_id: 8, sequence_id: 2, sequence_run_id: 'run-active', created_at: '2026-06-10T14:00:00.000Z', sent_at: '2026-06-10T14:05:00.000Z' }),
  it_(21, { to_email: 'b@beta.example', account_name: 'Beta', persona_id: 8, sequence_id: 2, sequence_run_id: 'run-active', step_index: 1, status: 'approved', created_at: '2026-06-10T14:05:00.000Z', sent_at: null }),
  // run-spans: seq 1 then seq 2
  it_(30, { to_email: 'c@gamma.example', account_name: 'Gamma', sequence_run_id: 'run-spans', created_at: '2026-06-12T14:00:00.000Z' }),
  it_(31, { to_email: 'c@gamma.example', account_name: 'Gamma', sequence_id: 2, sequence_run_id: 'run-spans', step_index: 1, status: 'skipped', created_at: '2026-06-12T14:05:00.000Z', sent_at: null }),
  // run-skipped: seq 1, step 0 sent, step 1 skipped; step 1 already stamped by something else
  it_(50, { to_email: 'd@delta.example', account_name: 'Delta', sequence_run_id: 'run-skipped', created_at: '2026-05-20T14:00:00.000Z', updated_at: '2026-05-20T14:05:00.000Z', sent_at: '2026-05-20T14:05:00.000Z' }),
  it_(51, { to_email: 'd@delta.example', account_name: 'Delta', sequence_run_id: 'run-skipped', step_index: 1, status: 'skipped', sequence_version_id: 'ver-pre', created_at: '2026-05-23T14:00:00.000Z', updated_at: '2026-05-23T15:00:00.000Z', sent_at: null }),
  // run-bad: seq 3 (unparseable)
  it_(60, { to_email: 'e@eps.example', account_name: 'Epsilon', sequence_id: 3, sequence_run_id: 'run-bad', created_at: '2026-06-15T14:00:00.000Z' }),
  // run-internal: seq 4, only ever sent to ourselves
  it_(70, { to_email: 'casey@freightroll.com', account_name: 'FreightRoll', sequence_id: 4, sequence_run_id: 'run-internal', created_at: '2026-06-16T14:00:00.000Z' }),
];

function empty(): ExistingState {
  return { familiesByLegacyId: {}, versionsByFamilyId: {}, enrollmentsById: {} };
}

function plan(existing: ExistingState = empty(), overrideItems: LegacySequenceItem[] = items, overrideSequences: LegacySequenceRow[] = sequences): ModexLegacyPlan {
  return planModexLegacy({ sequences: overrideSequences, items: overrideItems, existing, opts: OPTS });
}

/** Feed a plan's outputs back as the existing state, as the CLI's second run would see them. */
function afterApply(first: ModexLegacyPlan, base: ExistingState = empty()): { existing: ExistingState; items: LegacySequenceItem[] } {
  const familiesByLegacyId = { ...base.familiesByLegacyId };
  for (const f of first.families) familiesByLegacyId[String(f.legacy_sequence_id)] = { id: f.id, legacy_sequence_id: f.legacy_sequence_id };
  const versionsByFamilyId: ExistingState['versionsByFamilyId'] = {};
  for (const [k, v] of Object.entries(base.versionsByFamilyId)) versionsByFamilyId[k] = [...v];
  for (const v of first.versions) (versionsByFamilyId[v.family_id] ??= []).push({ id: v.id, family_id: v.family_id, version: v.version, status: v.status });
  const enrollmentsById = { ...base.enrollmentsById };
  for (const e of first.enrollments) enrollmentsById[e.id] = { id: e.id };
  const stamped = new Map(first.itemStamps.map((s) => [s.id, s.sequence_version_id]));
  const nextItems = items.map((i) => (stamped.has(i.id) ? { ...i, sequence_version_id: stamped.get(i.id)! } : i));
  return { existing: { familiesByLegacyId, versionsByFamilyId, enrollmentsById }, items: nextItems };
}

const FAMILY1 = familyIdFor(1);
const FAMILY2 = familyIdFor(2);
const VERSION1 = versionIdFor(FAMILY1);
const VERSION2 = versionIdFor(FAMILY2);

describe('planModexLegacy: families and versions', () => {
  it('one family per sequences row, engine modex_draft_queue, legacy_sequence_id = the numeric id, name = the row name', () => {
    const p = plan();
    expect(p.families.map((f) => [f.legacy_sequence_id, f.name, f.engine])).toEqual([
      [1, 'Yard intro', 'modex_draft_queue'],
      [2, 'Three touch', 'modex_draft_queue'],
      [3, 'Broken', 'modex_draft_queue'],
      [4, 'Internal only', 'modex_draft_queue'],
    ]);
    expect(p.families.map((f) => f.id)).toEqual([familyIdFor(1), familyIdFor(2), familyIdFor(3), familyIdFor(4)]);
    expect(p.counts.families_new).toBe(4);
    expect(p.counts.families_existing).toBe(0);
  });

  it('one v1 per parseable family: steps = fromLegacySequence(row.steps), hash over the step array, provenance modex_legacy', () => {
    const p = plan();
    const v1 = p.versions.find((v) => v.legacy_sequence_id === 1)!;
    expect(v1.id).toBe(VERSION1);
    expect(v1.family_id).toBe(FAMILY1);
    expect(v1.version).toBe(1);
    expect(v1.steps).toEqual(fromLegacyModexSteps(SEQ1_STEPS));
    expect(v1.steps_hash).toBe(stepsHash(fromLegacyModexSteps(SEQ1_STEPS)));
    expect(v1.provenance).toEqual({ kind: 'modex_legacy', sequence_id: 1, imported_at: NOW.toISOString(), imported_by: 'test-import' });
    expect(v1.frozen_by_enrollment_id).toBeNull();
    // and the runtime can read it back as the legacy shape it started from
    expect(toLegacySteps(v1.steps).map(({ delayUnit: _u, ...s }) => s)).toEqual(SEQ1_STEPS);
  });

  it('a referenced version is FROZEN with frozen_at = the earliest non-test item created_at', () => {
    const p = plan();
    const v1 = p.versions.find((v) => v.legacy_sequence_id === 1)!;
    expect(v1.status).toBe('frozen');
    // item 50 (run-skipped, 2026-05-20) is the earliest item on seq 1
    expect(v1.frozen_at).toBe('2026-05-20T14:00:00.000Z');
    const v2 = p.versions.find((v) => v.legacy_sequence_id === 2)!;
    expect(v2.status).toBe('frozen');
    expect(v2.frozen_at).toBe('2026-06-10T14:00:00.000Z');
  });

  it('a sequence only ever sent to an internal recipient imports as a DRAFT (internal recipients never freeze a version)', () => {
    const p = plan();
    const v4 = p.versions.find((v) => v.legacy_sequence_id === 4)!;
    expect(v4.status).toBe('draft');
    expect(v4.frozen_at).toBeNull();
  });

  it('a sequence nobody references imports as a draft', () => {
    const p = plan(empty(), [], [sequences[0]]);
    expect(p.versions).toHaveLength(1);
    expect(p.versions[0].status).toBe('draft');
    expect(p.enrollments).toEqual([]);
    expect(p.itemStamps).toEqual([]);
  });

  it('unparseable steps: warning unparseable_steps:<id>, family still planned, NO version, items neither stamped nor enrolled', () => {
    const p = plan();
    expect(p.warnings).toContain('unparseable_steps:3');
    expect(p.versions.some((v) => v.legacy_sequence_id === 3)).toBe(false);
    expect(p.families.some((f) => f.legacy_sequence_id === 3)).toBe(true);
    expect(p.itemStamps.some((s) => s.id === 60)).toBe(false);
    expect(p.enrollments.some((e) => e.id === 'run-bad')).toBe(false);
    expect(p.warnings).toContain('run_without_version:run-bad');
    expect(p.counts.versions_unparseable).toBe(1);
    expect(p.counts.items_without_version).toBe(1);
  });
});

describe('planModexLegacy: enrollments', () => {
  it('one enrollment per distinct run, id = the run id, legacy true, fields from the items', () => {
    const p = plan();
    expect(p.enrollments.map((e) => e.id).sort()).toEqual(['run-active', 'run-complete', 'run-internal', 'run-skipped']);
    const complete = p.enrollments.find((e) => e.id === 'run-complete')!;
    expect(complete).toMatchObject({
      engine: 'modex_draft_queue',
      family_id: FAMILY1,
      sequence_version_id: VERSION1,
      legacy_sequence_id: 1,
      account_name: 'Acme',
      persona_id: 7,
      to_email: 'a@acme.example',
      sender: 'casey@freightroll.com',
      owner: 'casey@freightroll.com',
      legacy: true,
      is_test: false,
      enrolled_by: 'test-import',
      enrolled_at: '2026-06-01T14:00:00.000Z',
      item_ids: [10, 11],
    });
    expect(p.counts.runs).toBe(6);
    expect(p.counts.enrollments_new).toBe(4);
  });

  it('completed when every item is sent: completed_at = the latest sent_at, current_step_index = the last sent step', () => {
    const e = plan().enrollments.find((x) => x.id === 'run-complete')!;
    expect(e.status).toBe('completed');
    expect(e.stop_reason).toBeNull();
    expect(e.stopped_at).toBeNull();
    expect(e.completed_at).toBe('2026-06-04T14:05:00.000Z');
    expect(e.current_step_index).toBe(1);
  });

  it('active when any item is draft, approved or sending', () => {
    const e = plan().enrollments.find((x) => x.id === 'run-active')!;
    expect(e.status).toBe('active');
    expect(e.stop_reason).toBeNull();
    expect(e.completed_at).toBeNull();
    expect(e.family_id).toBe(FAMILY2);
    expect(e.sequence_version_id).toBe(VERSION2);
    expect(e.current_step_index).toBe(0);
  });

  it('stopped with legacy_unknown when any item is skipped and none is pending (stopped_because skipped_items, report only); stopped_at = the latest item touch', () => {
    const e = plan().enrollments.find((x) => x.id === 'run-skipped')!;
    expect(e.status).toBe('stopped');
    expect(e.stop_reason).toBe(STOP_REASON_UNKNOWN);
    expect(e.stopped_because).toBe('skipped_items');
    expect(e.stopped_at).toBe('2026-05-23T15:00:00.000Z');
    expect(e.completed_at).toBeNull();
  });

  it('an internal recipient is is_test', () => {
    const e = plan().enrollments.find((x) => x.id === 'run-internal')!;
    expect(e.is_test).toBe(true);
    expect(e.status).toBe('completed');
  });

  it('a run whose items span two sequences: warning run_spans_sequences:<run>, no enrollment, its items are still stamped', () => {
    const p = plan();
    expect(p.warnings).toContain('run_spans_sequences:run-spans');
    expect(p.enrollments.some((e) => e.id === 'run-spans')).toBe(false);
    expect(p.itemStamps.find((s) => s.id === 30)).toEqual({ id: 30, sequence_version_id: VERSION1 });
    expect(p.itemStamps.find((s) => s.id === 31)).toEqual({ id: 31, sequence_version_id: VERSION2 });
    expect(p.counts.enrollments_skipped).toBe(2); // run-spans and run-bad
  });

  it('a run whose items disagree on the recipient is warned run_mixed_recipients and gets no enrollment', () => {
    const mixed = [it_(80, { sequence_run_id: 'run-mixed' }), it_(81, { sequence_run_id: 'run-mixed', step_index: 1, to_email: 'other@acme.example' })];
    const p = plan(empty(), mixed);
    expect(p.warnings).toContain('run_mixed_recipients:run-mixed');
    expect(p.enrollments).toEqual([]);
  });

  it('account_name is a foreign key: an unknown account (when accountNames is given) is warned and skipped', () => {
    const p = plan({ ...empty(), accountNames: new Set(['Acme', 'Beta', 'Gamma', 'FreightRoll']) });
    expect(p.warnings).toContain('account_not_found:run-skipped');
    expect(p.enrollments.some((e) => e.id === 'run-skipped')).toBe(false);
    expect(p.enrollments.some((e) => e.id === 'run-complete')).toBe(true);
  });

  it('partial unique on to_email while active: two active runs for one address keep the NEWEST, the other warns duplicate_active_recipient', () => {
    const dup = [
      it_(90, { sequence_run_id: 'run-old', status: 'approved', created_at: '2026-06-01T00:00:00.000Z' }),
      it_(91, { sequence_run_id: 'run-new', status: 'approved', created_at: '2026-06-08T00:00:00.000Z' }),
    ];
    const p = plan(empty(), dup);
    expect(p.enrollments.map((e) => e.id)).toEqual(['run-new']);
    expect(p.warnings).toContain('duplicate_active_recipient:run-old');
  });

  it('an address already live in the ledger: already_enrolled:<run>, no enrollment', () => {
    const p = plan({ ...empty(), activeEmails: new Set(['b@beta.example']) });
    expect(p.warnings).toContain('already_enrolled:run-active');
    expect(p.enrollments.some((e) => e.id === 'run-active')).toBe(false);
  });

  it('every planned stop_reason is one the taxonomy (and so the SQL CHECK gap_ck_enrollments_stop_reason) accepts', () => {
    const reasons = [...new Set(plan().enrollments.map((e) => e.stop_reason).filter(Boolean))];
    const allowed = STOP_REASONS as readonly string[];
    expect(reasons.length).toBeGreaterThan(0);
    for (const r of reasons) expect(allowed).toContain(r);
    expect(STOP_REASON_UNKNOWN).toBe('legacy_unknown');
  });
});

describe('deriveRunStatus', () => {
  const row = (status: string, id = 1) => it_(id, { status });
  it('any pending item (draft, approved, sending) -> active', () => {
    const active = { status: 'active', stopReason: null, stoppedBecause: null };
    expect(deriveRunStatus([row('sent'), row('draft', 2)])).toEqual(active);
    expect(deriveRunStatus([row('sent'), row('approved', 2)])).toEqual(active);
    expect(deriveRunStatus([row('sent'), row('sending', 2)])).toEqual(active);
    expect(deriveRunStatus([row('skipped'), row('approved', 2)])).toEqual(active);
  });
  it('every item sent -> completed; one unsent item breaks it', () => {
    expect(deriveRunStatus([row('sent'), row('sent', 2)])).toEqual({ status: 'completed', stopReason: null, stoppedBecause: null });
    expect(deriveRunStatus([row('sent'), row('skipped', 2)]).status).not.toBe('completed');
    expect(deriveRunStatus([row('sent'), row('failed', 2)]).status).not.toBe('completed');
  });
  it('skipped and nothing pending -> stopped legacy_unknown (because skipped_items); failed only -> stopped legacy_unknown (no_pending_items)', () => {
    expect(deriveRunStatus([row('sent'), row('skipped', 2)])).toEqual({ status: 'stopped', stopReason: STOP_REASON_UNKNOWN, stoppedBecause: 'skipped_items' });
    expect(deriveRunStatus([row('failed')])).toEqual({ status: 'stopped', stopReason: STOP_REASON_UNKNOWN, stoppedBecause: 'no_pending_items' });
    expect(deriveRunStatus([row('sent'), row('failed', 2)])).toEqual({ status: 'stopped', stopReason: STOP_REASON_UNKNOWN, stoppedBecause: 'no_pending_items' });
  });
});

describe('planModexLegacy: item stamps', () => {
  it('stamps only items whose sequence_version_id is null, with their OWN sequence version', () => {
    const p = plan();
    expect(p.itemStamps.sort((a, b) => a.id - b.id)).toEqual([
      { id: 10, sequence_version_id: VERSION1 },
      { id: 11, sequence_version_id: VERSION1 },
      { id: 20, sequence_version_id: VERSION2 },
      { id: 21, sequence_version_id: VERSION2 },
      { id: 30, sequence_version_id: VERSION1 },
      { id: 31, sequence_version_id: VERSION2 },
      { id: 50, sequence_version_id: VERSION1 },
      { id: 70, sequence_version_id: versionIdFor(familyIdFor(4)) },
    ]);
    expect(p.itemStamps.some((s) => s.id === 51)).toBe(false);
    expect(p.counts.item_stamps).toBe(8);
    expect(p.counts.items_already_stamped).toBe(1);
  });
});

describe('planModexLegacy: idempotence', () => {
  it('a second run over the first run\'s outputs plans nothing', () => {
    const first = plan();
    const next = afterApply(first);
    const second = plan(next.existing, next.items);
    expect(second.families).toEqual([]);
    expect(second.versions).toEqual([]);
    expect(second.enrollments).toEqual([]);
    expect(second.itemStamps).toEqual([]);
    expect(second.counts.families_existing).toBe(4);
    expect(second.counts.families_new).toBe(0);
    expect(second.counts.versions_existing).toBe(3);
    expect(second.counts.versions_new).toBe(0);
    expect(second.counts.enrollments_existing).toBe(4);
    expect(second.counts.enrollments_new).toBe(0);
    expect(second.counts.items_already_stamped).toBe(9);
    // the unparseable sequence stays a warning on every run, never a write
    expect(second.warnings).toContain('unparseable_steps:3');
  });

  it('an existing family with an existing version is reused for stamps and enrollments (no new version)', () => {
    const existing: ExistingState = {
      familiesByLegacyId: { '1': { id: 'fam-existing', legacy_sequence_id: 1 } },
      versionsByFamilyId: { 'fam-existing': [{ id: 'ver-existing-2', family_id: 'fam-existing', version: 2 }, { id: 'ver-existing-1', family_id: 'fam-existing', version: 1 }] },
      enrollmentsById: {},
    };
    const p = plan(existing, [it_(10, {}), it_(11, { step_index: 1 })], [sequences[0]]);
    expect(p.families).toEqual([]);
    expect(p.versions).toEqual([]);
    expect(p.enrollments[0]).toMatchObject({ id: 'run-complete', family_id: 'fam-existing', sequence_version_id: 'ver-existing-1' });
    expect(p.itemStamps).toEqual([
      { id: 10, sequence_version_id: 'ver-existing-1' },
      { id: 11, sequence_version_id: 'ver-existing-1' },
    ]);
  });

  it('ids are deterministic', () => {
    expect(familyIdFor(1)).toBe(familyIdFor(1));
    expect(familyIdFor(1)).not.toBe(familyIdFor(2));
    expect(versionIdFor(FAMILY1)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('fromLegacySequence', () => {
  it('accepts the legacy array and returns steps.v2 that parseSteps accepts', () => {
    const r = fromLegacySequence(SEQ2_STEPS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.steps.steps.map((s) => [s.index, s.delay.value, s.purpose])).toEqual([[0, 0, 'intrigue'], [1, 2, 'root_cause'], [2, 4, 'value_offer']]);
  });
  it('refuses a non-array, an empty array, a malformed step and a duplicate index, each by name', () => {
    expect(fromLegacySequence('oops')).toEqual({ ok: false, reason: 'not_step_array' });
    expect(fromLegacySequence([])).toEqual({ ok: false, reason: 'not_step_array' });
    expect(fromLegacySequence([{ stepIndex: 0 }])).toEqual({ ok: false, reason: 'bad_step:0' });
    expect(fromLegacySequence([{ stepIndex: 0, delayDays: 0 }, { stepIndex: 0, delayDays: 1 }])).toEqual({ ok: false, reason: 'duplicate_step_index:0' });
  });
  it('re-indexes out-of-order and gapped legacy steps 0..n-1 (the runtime looks steps up by index, so the runtime shape changes; documented)', () => {
    const r = fromLegacySequence([{ stepIndex: 5, delayDays: 2 }, { stepIndex: 1, delayDays: 9 }]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.steps.steps.map((s) => [s.index, s.delay.value])).toEqual([[0, 0], [1, 2]]);
  });
});

describe('structural: the CLI and the planner', () => {
  const cli = readFileSync(CLI_PATH, 'utf8');
  const planner = readFileSync(PLANNER_PATH, 'utf8');

  it('the CLI refuses gap_disabled, scrubs HUBSPOT_ACCESS_TOKEN before its first import, defaults to dry run and imports no HubSpot client', () => {
    expect(cli).toContain('gap_disabled');
    expect(cli.indexOf("delete process.env[name]")).toBeLessThan(cli.indexOf('\nimport '));
    expect(cli).toContain("'HUBSPOT_ACCESS_TOKEN'");
    expect(cli).toContain("arg === '--apply'");
    expect(cli).toMatch(/apply:\s*false/);
    expect(cli).not.toMatch(/from ['"][^'"]*hubspot[^'"]*['"]/i);
  });

  it('the CLI stamps items only where sequence_version_id is null and writes with skipDuplicates in one transaction', () => {
    expect(cli).toContain('sequence_version_id: null');
    expect(cli).toContain('$transaction');
    expect((cli.match(/skipDuplicates: true/g) ?? []).length).toBe(3);
  });

  it('the planner never imports Prisma or the send path', () => {
    expect(planner).not.toMatch(/@prisma\/client/);
    expect(planner).not.toMatch(/perform-send|gmail-sender|send-deps/);
  });
});
