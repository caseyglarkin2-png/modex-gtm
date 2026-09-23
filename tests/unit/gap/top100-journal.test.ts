/**
 * S3-T4: the Top100 journal import planner over a synthetic lane fixture.
 * Pure: no Prisma, no HubSpot, no clock beyond the `now` we pass in.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { renderedStepsHash } from '@/lib/gap/sequence/copy-events';
import { stepsHash } from '@/lib/gap/sequence/steps';
import { pickVersionAt } from '@/lib/gap/sequence/version';
import {
  copyEventIdFor,
  copyEventKey,
  familyIdFor,
  journalOp,
  parseJournal,
  parseRevision,
  planTop100Journal,
  versionIdFor,
  type ExistingEnrollment,
  type ExistingState,
  type ExistingVersion,
  type JournalPlan,
} from '@/lib/gap/import/top100-journal';
import { readManifest } from '@/lib/gap/top100/reader';

const FIXTURES = join(process.cwd(), 'tests', 'fixtures', 'gap', 'top100-journal');
const PLANNER_PATH = join(process.cwd(), 'src', 'lib', 'gap', 'import', 'top100-journal.ts');
const CLI_PATH = join(process.cwd(), 'scripts', 'gap', 'import-top100-journal.ts');

const journalRows = parseJournal(readFileSync(join(FIXTURES, 'crm_changes.jsonl'), 'utf8'));
const manifest = readManifest(readFileSync(join(FIXTURES, 'run_manifest.json'), 'utf8'));

const NOW = new Date('2026-09-23T12:00:00.000Z');
const OPTS = { now: NOW, importedBy: 'test-import' };

const ALPHA_SEQ = '311000001';
const BETA_SEQ = '311000002';
const GAMMA_SEQ = '311000003';
const ALPHA_FAMILY = familyIdFor(ALPHA_SEQ);
const CONTACT_A = '700000001';
const CONTACT_B = '700000002';

const V1_TS = '2026-09-14T15:00:00.000Z';
const V2_TS = '2026-09-14T16:00:00.000Z';
const REPUSH_TS = '2026-09-14T17:00:00.000Z';

function empty(): ExistingState {
  return { familiesByHubspotId: {}, versionsByFamilyId: {}, copyEventKeys: new Set(), enrollmentsByKey: {} };
}

function enrollment(id: string, enrolledAt: string, overrides: Partial<ExistingEnrollment> = {}): ExistingEnrollment {
  return {
    id,
    family_id: ALPHA_FAMILY,
    hubspot_contact_id: CONTACT_A,
    enrolled_at: enrolledAt,
    sequence_version_id: null,
    rendered_steps: null,
    ...overrides,
  };
}

function plan(existing: ExistingState = empty()): JournalPlan {
  return planTop100Journal({ journalRows, manifest, existing, opts: OPTS });
}

/** Feed a plan's outputs back as the existing state, as the CLI's second run would see them. */
function afterApply(first: JournalPlan, base: ExistingState): ExistingState {
  const familiesByHubspotId = { ...base.familiesByHubspotId };
  for (const f of first.families) familiesByHubspotId[f.hubspot_sequence_id] = { id: f.id, hubspot_sequence_id: f.hubspot_sequence_id };
  const versionsByFamilyId: Record<string, ExistingVersion[]> = {};
  for (const [k, v] of Object.entries(base.versionsByFamilyId)) versionsByFamilyId[k] = [...v];
  for (const v of first.versions) {
    (versionsByFamilyId[v.family_id] ??= []).push({ id: v.id, family_id: v.family_id, version: v.version, provenance: v.provenance, created_at: NOW, status: v.status });
  }
  const copyEventKeys = new Set(base.copyEventKeys);
  for (const e of first.copyEvents) copyEventKeys.add(e.key);
  const enrollmentsByKey: Record<string, ExistingEnrollment> = {};
  for (const [id, e] of Object.entries(base.enrollmentsByKey)) {
    const u = first.enrollmentUpdates.find((x) => x.id === id);
    enrollmentsByKey[id] = u ? { ...e, sequence_version_id: u.sequence_version_id, rendered_steps: u.rendered_steps } : e;
  }
  return { familiesByHubspotId, versionsByFamilyId, copyEventKeys, enrollmentsByKey, accountNames: base.accountNames };
}

describe('journal row helpers', () => {
  it('journalOp normalizes action/object and passes a literal op through', () => {
    expect(journalOp({ ts: 't', action: 'create', object: 'sequence' })).toBe('create/sequence');
    expect(journalOp({ ts: 't', op: 'list_add' })).toBe('list_add');
    expect(journalOp({ ts: 't' })).toBeNull();
  });

  it('parseRevision reads the lane evidence string', () => {
    expect(parseRevision('data/sequences/alpha-example-com.json revision 2')).toBe('2');
    expect(parseRevision('data/seq_steps/alpha/log.txt; API readback')).toBeNull();
    expect(parseRevision(undefined)).toBeNull();
  });

  it('parseJournal names a malformed line', () => {
    expect(() => parseJournal('{"ts":"a"}\nnot json\n')).toThrow('bad_journal_line:2');
    expect(() => parseJournal('{"no_ts":1}')).toThrow('bad_journal_line:1');
    expect(parseJournal('\n{"ts":"a"}\n\n')).toHaveLength(1);
  });

  it('ids are deterministic uuid v5', () => {
    expect(familyIdFor(ALPHA_SEQ)).toBe(familyIdFor(ALPHA_SEQ));
    expect(familyIdFor(ALPHA_SEQ)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(versionIdFor(ALPHA_FAMILY, V1_TS)).not.toBe(versionIdFor(ALPHA_FAMILY, V2_TS));
    expect(copyEventIdFor('a|b|c')).toBe(copyEventIdFor('a|b|c'));
  });
});

describe('planTop100Journal over the fixture (empty ledger)', () => {
  const p = plan();

  it('counts exactly what the fixture holds', () => {
    expect(p.counts).toEqual({
      rows: 11,
      families_new: 3,
      families_existing: 0,
      families_manifest_only: 1,
      versions_new: 5,
      versions_existing: 0,
      copy_events_journal: 6,
      copy_events_new: 6,
      copy_events_existing: 0,
      enrollments_pending: 0,
      enrollments_attributed: 0,
      enrollments_unattributed: 0,
      ignored_ops: 2,
    });
    expect(p.warnings).toEqual(['manifest_only:gamma-example-com']);
  });

  it('families: one per create/sequence row plus the manifest-only one, engine hubspot_native, keyed on the sequence id', () => {
    expect(p.families.map((f) => f.hubspot_sequence_id)).toEqual([ALPHA_SEQ, BETA_SEQ, GAMMA_SEQ]);
    const alpha = p.families[0];
    expect(alpha).toMatchObject({
      id: ALPHA_FAMILY,
      key: 'alpha-example-com',
      name: 'YF | Top100 | Alpha Freight Example',
      engine: 'hubspot_native',
      program: 'top100-fixture',
      account_name: 'Alpha Freight Example',
      hubspot_portal_id: '3819073',
      created_by: 'test-import',
    });
  });

  it('versions: v1 from create/sequence, v2 from the footer row, manifest v1 for gamma, scaffold steps hashed', () => {
    const alpha = p.versions.filter((v) => v.family_id === ALPHA_FAMILY).sort((a, b) => a.version - b.version);
    expect(alpha.map((v) => [v.version, v.provenance.op, v.provenance.journal_ts])).toEqual([
      [1, 'create/sequence', V1_TS],
      [2, 'update/sequence_templates', V2_TS],
    ]);
    expect(alpha[0].provenance).toMatchObject({
      kind: 'journal',
      evidence: 'data/seq_steps/alpha-example-com/log.txt; API readback',
      built_at: V1_TS,
      imported_at: NOW.toISOString(),
      imported_by: 'test-import',
    });
    expect(alpha[0].steps.schema).toBe('steps.v2');
    expect(alpha[0].steps.steps).toHaveLength(4);
    expect(alpha[0].steps.steps.map((s) => s.delay.value)).toEqual([0, 4, 5, 6]);
    expect(alpha[0].steps.steps[2].templates?.hubspotTemplateId).toBe('t-a3');
    expect(alpha[0].steps_hash).toBe(stepsHash(alpha[0].steps));
    expect(alpha[0].hubspot_template_ids).toEqual({ '1': 't-a1', '2': 't-a2', '3': 't-a3', '4': 't-a4' });
    expect(alpha[1].change_note).toContain('unsubscribe line belongs below the signature');
    expect(alpha[1].id).toBe(versionIdFor(ALPHA_FAMILY, V2_TS));
    // Twins on purpose: same steps_hash, distinguishable by provenance.template_change.
    expect(alpha[1].steps_hash).toBe(alpha[0].steps_hash);
    expect(alpha[0].provenance.template_change).toBeUndefined();
    expect(alpha[1].provenance.template_change).toEqual({
      record_ids: ['311000001', '311000002'],
      old: '{{ contact.yf_top100_stepN_body }} + typed address',
      new: '{{ contact.yf_top100_stepN_body }} only; address moves to the signature',
    });

    const beta = p.versions.filter((v) => v.hubspot_sequence_id === BETA_SEQ);
    expect(beta.map((v) => v.version)).toEqual([1, 2]);

    const gamma = p.versions.filter((v) => v.hubspot_sequence_id === GAMMA_SEQ);
    expect(gamma).toHaveLength(1);
    expect(gamma[0].provenance).toMatchObject({ kind: 'manifest', op: null, journal_ts: '2026-09-14T15:00:02.000Z' });
  });

  it('versions are draft with no frozen_at when the family has no enrollment', () => {
    for (const v of p.versions) {
      expect(v.status).toBe('draft');
      expect(v.frozen_at).toBeNull();
      expect(v.frozen_by_enrollment_id).toBeNull();
    }
  });

  it('copy events: zero-based step_index, parsed revision, deterministic ids, journal fields carried', () => {
    const a1subject = p.copyEvents.find((e) => e.hubspotContactId === CONTACT_A && e.property === 'yf_top100_step1_subject');
    expect(a1subject).toMatchObject({
      key: copyEventKey(CONTACT_A, 'yf_top100_step1_subject', '2026-09-14T15:10:00.000Z'),
      id: copyEventIdFor(copyEventKey(CONTACT_A, 'yf_top100_step1_subject', '2026-09-14T15:10:00.000Z')),
      accountKey: 'alpha-example-com',
      stepIndex: 0,
      field: 'subject',
      oldValue: null,
      newValue: 'Subject A1 rev1',
      evidence: 'data/sequences/alpha-example-com.json revision 1',
      revision: '1',
      readback: 'MATCH',
      result: 'APPLIED',
      pushedBy: null,
      source: 'journal_import',
    });
    expect(a1subject!.ts).toEqual(new Date('2026-09-14T15:10:00.000Z'));

    const b3 = p.copyEvents.find((e) => e.hubspotContactId === CONTACT_B && e.property === 'yf_top100_step3_subject');
    expect(b3).toMatchObject({ stepIndex: 2, field: 'subject' });
    const b2 = p.copyEvents.find((e) => e.hubspotContactId === CONTACT_B && e.property === 'yf_top100_step2_body');
    expect(b2).toMatchObject({ stepIndex: 1, field: 'body' });
  });

  it('a re-push produces two events for the same property with distinct ts and the old value kept', () => {
    const bodies = p.copyEvents
      .filter((e) => e.hubspotContactId === CONTACT_A && e.property === 'yf_top100_step1_body')
      .sort((a, b) => a.ts.getTime() - b.ts.getTime());
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toMatchObject({ oldValue: null, newValue: 'Body A1 rev1', revision: '1' });
    expect(bodies[1]).toMatchObject({ oldValue: 'Body A1 rev1', newValue: 'Body A1 rev2', revision: '2' });
    expect(bodies[1].ts.toISOString()).toBe(REPUSH_TS);
    expect(bodies[0].key).not.toBe(bodies[1].key);
  });

  it('the yf_top100_account row and the list_create row are ignored, not warned', () => {
    expect(p.copyEvents.some((e) => e.property === 'yf_top100_account')).toBe(false);
    expect(p.counts.ignored_ops).toBe(2);
    expect(p.warnings.some((w) => w.includes('yf_top100_account') || w.includes('list_create'))).toBe(false);
  });

  it('second run over the same inputs plus the first run outputs plans nothing', () => {
    const again = plan(afterApply(p, empty()));
    expect(again.families).toEqual([]);
    expect(again.versions).toEqual([]);
    expect(again.copyEvents).toEqual([]);
    expect(again.enrollmentUpdates).toEqual([]);
    expect(again.counts).toMatchObject({ families_new: 0, families_existing: 3, versions_new: 0, versions_existing: 5, copy_events_new: 0, copy_events_existing: 6 });
    // The manifest-only warning is about the journal, not the ledger, so it persists.
    expect(again.warnings).toEqual(['manifest_only:gamma-example-com']);
  });

  it('account names not in the accounts table are nulled with a warning when the set is given', () => {
    const q = plan({ ...empty(), accountNames: new Set(['Alpha Freight Example']) });
    expect(q.families.find((f) => f.key === 'alpha-example-com')!.account_name).toBe('Alpha Freight Example');
    expect(q.families.find((f) => f.key === 'beta-example-com')!.account_name).toBeNull();
    expect(q.warnings).toContain('account_not_found:beta-example-com');
  });
});

describe('legacy enrollments', () => {
  function withEnrollments(list: ExistingEnrollment[]): ExistingState {
    const existing = empty();
    existing.familiesByHubspotId[ALPHA_SEQ] = { id: ALPHA_FAMILY, hubspot_sequence_id: ALPHA_SEQ };
    for (const e of list) existing.enrollmentsByKey[e.id] = e;
    return existing;
  }

  it('versions of a family with an enrollment are frozen at journal_ts with no freezing enrollment', () => {
    const p = plan(withEnrollments([enrollment('e-frozen', V2_TS)]));
    const alpha = p.versions.filter((v) => v.family_id === ALPHA_FAMILY);
    expect(alpha).toHaveLength(2);
    for (const v of alpha) {
      expect(v.status).toBe('frozen');
      expect(v.frozen_at).toBe(v.provenance.journal_ts);
      expect(v.frozen_by_enrollment_id).toBeNull();
    }
    const beta = p.versions.filter((v) => v.hubspot_sequence_id === BETA_SEQ);
    expect(beta.every((v) => v.status === 'draft')).toBe(true);
    expect(p.counts.families_existing).toBe(1);
    expect(p.counts.families_new).toBe(2);
  });

  it('pickVersionAt boundary: enrolled_at equal to the v2 journal_ts picks v2; one ms earlier picks v1', () => {
    const p = plan(withEnrollments([enrollment('e-at-v2', V2_TS), enrollment('e-before-v2', '2026-09-14T15:59:59.999Z')]));
    const byId = Object.fromEntries(p.enrollmentUpdates.map((u) => [u.id, u]));
    expect(byId['e-at-v2'].sequence_version_id).toBe(versionIdFor(ALPHA_FAMILY, V2_TS));
    expect(byId['e-before-v2'].sequence_version_id).toBe(versionIdFor(ALPHA_FAMILY, V1_TS));
    expect(p.counts).toMatchObject({ enrollments_pending: 2, enrollments_attributed: 2, enrollments_unattributed: 0 });
  });

  it('rendered_steps at enrolled_at carry the copy BEFORE the later re-push and cite the event ids', () => {
    const p = plan(withEnrollments([enrollment('e-at-v2', V2_TS)]));
    const u = p.enrollmentUpdates[0];
    expect(u.rendered_steps).toHaveLength(4);
    expect(u.rendered_steps[0]).toEqual({
      stepIndex: 0,
      subject: 'Subject A1 rev1',
      body: 'Body A1 rev1',
      copyEventIds: [
        copyEventIdFor(copyEventKey(CONTACT_A, 'yf_top100_step1_subject', '2026-09-14T15:10:00.000Z')),
        copyEventIdFor(copyEventKey(CONTACT_A, 'yf_top100_step1_body', '2026-09-14T15:10:00.100Z')),
      ],
    });
    expect(u.rendered_steps[1]).toEqual({ stepIndex: 1, subject: null, body: null, copyEventIds: [] });
    expect(u.rendered_steps_hash).toBe(renderedStepsHash(u.rendered_steps));

    const later = plan(withEnrollments([enrollment('e-after-repush', '2026-09-14T17:00:00.000Z')]));
    expect(later.enrollmentUpdates[0].rendered_steps[0].body).toBe('Body A1 rev2');
  });

  it('an enrollment older than every version gets a warning and no update', () => {
    const p = plan(withEnrollments([enrollment('e-too-early', '2026-09-14T14:59:59.999Z')]));
    expect(p.enrollmentUpdates).toEqual([]);
    expect(p.warnings).toContain('no_version_before_enrollment:e-too-early');
    expect(p.counts).toMatchObject({ enrollments_pending: 1, enrollments_attributed: 0, enrollments_unattributed: 1 });
  });

  it('an enrollment that already carries a version and rendered copy is not pending', () => {
    const p = plan(withEnrollments([enrollment('e-done', V2_TS, { sequence_version_id: 'v-existing', rendered_steps: [] })]));
    expect(p.enrollmentUpdates).toEqual([]);
    expect(p.counts.enrollments_pending).toBe(0);
  });

  it('only versions with a journal_ts are attribution candidates (the Sprint 2 manifest placeholder is not)', () => {
    const existing = withEnrollments([enrollment('e-at-v2', V2_TS)]);
    existing.versionsByFamilyId[ALPHA_FAMILY] = [
      { id: 'placeholder-v1', family_id: ALPHA_FAMILY, version: 1, status: 'draft', provenance: { source: 'manifest', builtAt: V1_TS }, created_at: NOW },
    ];
    const p = plan(existing);
    // The placeholder holds version 1, so the journal versions number from 2.
    expect(p.versions.filter((v) => v.family_id === ALPHA_FAMILY).map((v) => v.version)).toEqual([2, 3]);
    expect(p.enrollmentUpdates[0].sequence_version_id).toBe(versionIdFor(ALPHA_FAMILY, V2_TS));
  });

  it('second run after attribution plans no enrollment updates', () => {
    const base = withEnrollments([enrollment('e-at-v2', V2_TS)]);
    const first = plan(base);
    expect(first.enrollmentUpdates).toHaveLength(1);
    const again = plan(afterApply(first, base));
    expect(again.enrollmentUpdates).toEqual([]);
    expect(again.versions).toEqual([]);
    expect(again.copyEvents).toEqual([]);
    expect(again.families).toEqual([]);
  });

  it('pickVersionAt (S3-T3) is the one the planner uses: equal timestamps count', () => {
    const v1 = { id: 'a', version: 1, provenance: { journal_ts: V1_TS }, created_at: NOW };
    const v2 = { id: 'b', version: 2, provenance: { journal_ts: V2_TS }, created_at: NOW };
    expect(pickVersionAt([v1, v2], new Date(V2_TS))?.id).toBe('b');
    expect(pickVersionAt([v1, v2], new Date(new Date(V2_TS).getTime() - 1))?.id).toBe('a');
  });
});

describe('structural: no HubSpot reach from the planner or the CLI', () => {
  const planner = readFileSync(PLANNER_PATH, 'utf8');
  const cli = readFileSync(CLI_PATH, 'utf8');

  it('neither file imports a hubspot client or calls fetch(', () => {
    for (const source of [planner, cli]) {
      expect(source).not.toMatch(/from ['"]@\/lib\/hubspot/);
      expect(source).not.toMatch(/from ['"][^'"]*src\/lib\/hubspot/);
      expect(source).not.toMatch(/@hubspot\/api-client/);
      expect(source).not.toMatch(/fetch\(/);
    }
  });

  it('the planner never touches Prisma; the CLI scrubs the token first and refuses gap_disabled', () => {
    expect(planner).not.toMatch(/prisma\.|PrismaClient|@prisma\/client|\$transaction/);
    expect(cli.indexOf("delete process.env[name]")).toBeLessThan(cli.indexOf("import { existsSync"));
    expect(cli).toMatch(/HUBSPOT_ACCESS_TOKEN/);
    expect(cli).toMatch(/gap_disabled/);
    expect(cli).toMatch(/WHERE id = \$\{u\.id\} AND legacy = true AND rendered_steps IS NULL/);
    expect(cli).not.toMatch(/sequence_version_id IS NULL/);
  });

  it('the CLI does not hardcode the lane path', () => {
    expect(cli).not.toMatch(/yardflow-hubspot/);
  });
});
