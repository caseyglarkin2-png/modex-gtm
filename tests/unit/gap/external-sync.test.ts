/**
 * S2-T4: read-only enrollment-truth sync from the Top100 lane and HubSpot.
 *
 * Every HubSpot read is injected through `deps.readContacts`; no test here
 * touches a real client and no HubSpot token is ever set. Prisma is a
 * hand-rolled in-memory store covering exactly the delegates the module uses,
 * so a call the module was not expected to make throws instead of passing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readManifest, readRoster, type Top100Manifest, type Top100RosterPerson } from '@/lib/gap/top100/reader';
import { LANE_PURPOSES, LANE_PURPOSE_MAP } from '@/lib/gap/taxonomy';
import {
  BLAST_SEQUENCE_2026_09_11,
  GAP_ENROLLMENT_NS,
  READBACK_PROPERTIES,
  applyEnrollments,
  canonicalJson,
  enrollmentId,
  planEnrollments,
  planFamilies,
  readbackContacts,
  runEnrollmentSync,
  stepsHash,
  uuidV5,
  type ContactReadback,
  type EnrollmentPlan,
  type FamilyPlan,
  type ReadContactsDeps,
  type SyncPrisma,
} from '@/lib/gap/sequence/external-sync';

// ---------------------------------------------------------------------------
// Route module mocks (hoisted). Only the route tests use these; the pure
// functions above are imported for real.
// ---------------------------------------------------------------------------

const mockedClaim = vi.fn<(...args: unknown[]) => Promise<{ claimed: boolean; reason?: string; key: string }>>();
const mockedRelease = vi.fn(async () => undefined);
const mockedStarted = vi.fn(async () => undefined);
const mockedSuccess = vi.fn(async () => undefined);
const mockedSkipped = vi.fn(async () => undefined);
const mockedFailure = vi.fn(async () => undefined);
const mockedGetClient = vi.fn(() => {
  throw new Error('route test reached the HubSpot client');
});

vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'route-prisma' } }));
vi.mock('@/lib/cron-idempotency', () => ({
  claimDailyRun: mockedClaim,
  releaseDailyRun: mockedRelease,
}));
vi.mock('@/lib/cron-monitor', () => ({
  markCronStarted: mockedStarted,
  markCronSuccess: mockedSuccess,
  markCronSkipped: mockedSkipped,
  markCronFailure: mockedFailure,
}));
vi.mock('@/lib/hubspot/client', () => ({
  getHubSpotClient: mockedGetClient,
  isHubSpotConfigured: () => false,
  withHubSpotRetry: async (fn: () => Promise<unknown>) => fn(),
}));

const { GET } = await import('@/app/api/cron/gap-enrollment-sync/route');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXTURES = join(process.cwd(), 'tests', 'fixtures', 'gap');
const MODULE_PATH = join(process.cwd(), 'src', 'lib', 'gap', 'sequence', 'external-sync.ts');

const manifest: Top100Manifest = readManifest(readFileSync(join(FIXTURES, 'top100-manifest.json'), 'utf8'));
const dellRoster = readRoster(readFileSync(join(FIXTURES, 'top100-roster.json'), 'utf8'));

const DELL = manifest.accounts['dell-com'];
const JBHUNT = manifest.accounts['jbhunt-com'];
const DELL_SEQ = DELL.sequence!.hubspotSequenceId; // 311420117
const JBHUNT_SEQ = JBHUNT.sequence!.hubspotSequenceId; // 311420229

const NOW = new Date('2026-09-23T12:00:00.000Z');
const OPTS = { program: 'top100-2026-09-12', portal: '3819073', createdBy: 'test' };

// R2-12: the roster fixture is synthesized; these three are its first three selected people.
const fernanda = dellRoster.people.find((p) => p.name === 'Mara Ellison')!;
const audrey = dellRoster.people.find((p) => p.name === 'Devin Okafor')!;
const thean = dellRoster.people.find((p) => p.name === 'Lin Tanaka')!;

function readbackRow(over: Partial<ContactReadback> = {}): ContactReadback {
  return {
    activelyEnrolledCount: 1,
    latestSequenceId: DELL_SEQ,
    latestEnrolledAt: new Date('2026-09-15T17:17:39.791Z'),
    ...over,
  };
}

/** A readback where the first person is in Dell's sequence, the second in the 09-11 blast, the third not enrolled. */
function dellReadback(): Map<string, ContactReadback> {
  return new Map<string, ContactReadback>([
    [fernanda.hubspotContactId!, readbackRow()],
    [audrey.hubspotContactId!, readbackRow({ latestSequenceId: BLAST_SEQUENCE_2026_09_11 })],
    [thean.hubspotContactId!, readbackRow({ activelyEnrolledCount: 0, latestSequenceId: null, latestEnrolledAt: null })],
  ]);
}

// ---------------------------------------------------------------------------
// In-memory prisma. Every delegate the module is allowed to call is here; an
// unexpected delegate or method throws (undefined is not a function).
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function makePrisma(seed: { accounts?: Row[]; families?: Row[]; versions?: Row[]; enrollments?: Row[] } = {}) {
  const accounts: Row[] = seed.accounts ?? [];
  const families: Row[] = seed.families ?? [];
  const versions: Row[] = seed.versions ?? [];
  const enrollments: Row[] = seed.enrollments ?? [];
  let seq = 1;
  const nextId = (p: string) => `${p}_${seq++}`;

  const spies = {
    familyCreate: vi.fn(),
    familyUpdate: vi.fn(),
    versionCreate: vi.fn(),
    versionUpdate: vi.fn(),
    versionUpdateMany: vi.fn(),
    enrollmentCreate: vi.fn(),
    enrollmentUpdate: vi.fn(),
  };

  const prisma = {
    account: {
      findFirst: vi.fn(async ({ where }: { where: { OR: Array<Row> } }) => {
        const hit = accounts.find((a) => where.OR.some((c) => (c.name ? a.name === c.name : a.hubspot_company_id === c.hubspot_company_id)));
        return hit ? { name: hit.name, hubspot_company_id: hit.hubspot_company_id ?? null } : null;
      }),
    },
    sequenceFamily: {
      findUnique: vi.fn(async ({ where }: { where: { hubspot_sequence_id: string } }) =>
        families.find((f) => f.hubspot_sequence_id === where.hubspot_sequence_id) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: Row }) => {
        spies.familyCreate(data);
        const row = { id: nextId('fam'), ...data };
        families.push(row);
        return row;
      }),
      update: vi.fn(async (args: Row) => {
        spies.familyUpdate(args);
        throw new Error('sequenceFamily.update must not be called by the sync');
      }),
    },
    sequenceVersion: {
      findFirst: vi.fn(async ({ where }: { where: { family_id: string; version: number } }) =>
        versions.find((v) => v.family_id === where.family_id && v.version === where.version) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: Row }) => {
        spies.versionCreate(data);
        const row = { id: nextId('ver'), ...data };
        versions.push(row);
        return row;
      }),
      update: vi.fn(async (args: Row) => {
        spies.versionUpdate(args);
        throw new Error('sequenceVersion.update must not be called by the sync');
      }),
      updateMany: vi.fn(async (args: Row) => {
        spies.versionUpdateMany(args);
        throw new Error('sequenceVersion.updateMany must not be called by the sync');
      }),
    },
    sequenceEnrollment: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => enrollments.find((e) => e.id === where.id) ?? null),
      findMany: vi.fn(async ({ where }: { where: Row }) =>
        enrollments.filter(
          (e) =>
            (where.engine === undefined || e.engine === where.engine) &&
            (where.status === undefined || e.status === where.status) &&
            (where.hubspot_sequence_id?.in === undefined || where.hubspot_sequence_id.in.includes(e.hubspot_sequence_id)),
        ),
      ),
      create: vi.fn(async ({ data }: { data: Row }) => {
        spies.enrollmentCreate(data);
        const row = { ...data };
        enrollments.push(row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Row }) => {
        spies.enrollmentUpdate({ where, data });
        const row = enrollments.find((e) => e.id === where.id);
        if (!row) throw new Error(`no enrollment ${where.id}`);
        Object.assign(row, data);
        return row;
      }),
    },
  };

  return { prisma, spies, store: { accounts, families, versions, enrollments } };
}

function dellAndJbHuntAccounts(): Row[] {
  return [
    { name: 'Dell', hubspot_company_id: '54406388074' },
    { name: 'J.B. Hunt', hubspot_company_id: '57209775972' },
  ];
}

async function seededFamilies() {
  const db = makePrisma({ accounts: dellAndJbHuntAccounts() });
  const fam = await upsert(db.prisma, planFamilies(manifest, OPTS));
  return { db, fam };
}

async function upsert(prisma: SyncPrisma, plans: FamilyPlan[], dryRun = false) {
  const { upsertFamilies } = await import('@/lib/gap/sequence/external-sync');
  return upsertFamilies(prisma, plans, { dryRun, now: NOW });
}

// ---------------------------------------------------------------------------
// planFamilies
// ---------------------------------------------------------------------------

describe('planFamilies', () => {
  it('emits exactly one plan per built sequence, rank order, with the manifest fields', () => {
    const plans = planFamilies(manifest, OPTS);
    expect(plans.map((p) => p.key)).toEqual(['dell-com', 'jbhunt-com']);
    expect(plans[0]).toEqual({
      key: 'dell-com',
      accountName: 'Dell',
      hubspotCompanyId: '54406388074',
      hubspotSequenceId: '311420117',
      name: 'YF | Top100 | Dell',
      templateIds: { '1': '129420111', '2': '129420112', '3': '129420113', '4': '129420114' },
      delaysBusinessDays: [0, 4, 5, 6],
      builtAt: '2026-09-14T16:07:47.811Z',
      preferredSender: 'casey@freightroll.com',
      program: OPTS.program,
      portal: OPTS.portal,
      createdBy: OPTS.createdBy,
    });
    expect(plans[1].hubspotSequenceId).toBe(JBHUNT_SEQ);
  });

  it('skips a PARKED account (no sequence id) entirely', () => {
    const parked: Top100Manifest = {
      ...manifest,
      accounts: { ...manifest.accounts, 'parked-co': { ...DELL, key: 'parked-co', name: 'Parked', sequence: null } },
    };
    expect(planFamilies(parked, OPTS).map((p) => p.key)).toEqual(['dell-com', 'jbhunt-com']);
  });
});

// ---------------------------------------------------------------------------
// upsertFamilies
// ---------------------------------------------------------------------------

describe('upsertFamilies', () => {
  it('creates a family and a draft v1 with the steps.v2 scaffold, hash and provenance', async () => {
    const db = makePrisma({ accounts: dellAndJbHuntAccounts() });
    const res = await upsert(db.prisma, planFamilies(manifest, OPTS));

    expect(res.created).toBe(2);
    expect(res.existing).toBe(0);
    expect(res.skipped).toEqual([]);
    expect(db.spies.familyCreate).toHaveBeenCalledTimes(2);
    expect(db.spies.familyCreate.mock.calls[0][0]).toEqual({
      engine: 'hubspot_native',
      program: OPTS.program,
      account_name: 'Dell',
      hubspot_sequence_id: DELL_SEQ,
      hubspot_portal_id: '3819073',
      name: 'YF | Top100 | Dell',
      created_by: 'test',
    });

    expect(db.spies.versionCreate).toHaveBeenCalledTimes(2);
    const v1 = db.spies.versionCreate.mock.calls[0][0];
    expect(v1.version).toBe(1);
    expect(v1.status).toBe('draft');
    expect(v1.family_id).toBe(db.store.families[0].id);
    expect(v1.hubspot_template_ids).toEqual(DELL.sequence!.templateIds);
    expect(v1.created_by).toBe('test');
    expect(v1.provenance).toEqual({
      source: 'manifest',
      builtAt: '2026-09-14T16:07:47.811Z',
      importedAt: NOW.toISOString(),
      importedBy: 'test',
    });

    const steps = v1.steps as Array<Record<string, unknown>>;
    expect(steps).toHaveLength(4);
    steps.forEach((s, i) => {
      expect(s.index).toBe(i);
      expect(s.delay).toEqual({ value: [0, 4, 5, 6][i], unit: 'business_days' });
      expect(s.sourcePurpose).toBe(LANE_PURPOSES[i]);
      expect(s.purpose).toBe(LANE_PURPOSE_MAP[LANE_PURPOSES[i]]);
      expect(s.templates).toEqual({ hubspotTemplateId: DELL.sequence!.templateIds[String(i + 1)] });
      expect(s.requiredEvidenceTypes).toEqual([]);
      expect(s.claimsUsed).toEqual([]);
    });
    expect(steps[0].productProofAllowed).toBe(false);
    expect(v1.steps_hash).toBe(stepsHash(steps));
    expect(v1.steps_hash).toMatch(/^[0-9a-f]{64}$/);

    expect(res.ids[DELL_SEQ]).toEqual({ familyId: db.store.families[0].id, versionId: db.store.versions[0].id });
  });

  it('steps_hash is a sha256 of canonical JSON (key order does not matter)', () => {
    expect(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }] })).toBe('{"a":[{"c":3,"d":2}],"b":1}');
    expect(stepsHash([{ b: 1, a: 2 }])).toBe(stepsHash([{ a: 2, b: 1 }]));
  });

  it('a second call creates nothing and reports the families as existing', async () => {
    const db = makePrisma({ accounts: dellAndJbHuntAccounts() });
    await upsert(db.prisma, planFamilies(manifest, OPTS));
    const again = await upsert(db.prisma, planFamilies(manifest, OPTS));
    expect(again).toMatchObject({ created: 0, existing: 2, skipped: [] });
    expect(db.spies.familyCreate).toHaveBeenCalledTimes(2);
    expect(db.spies.versionCreate).toHaveBeenCalledTimes(2);
    expect(db.spies.familyUpdate).not.toHaveBeenCalled();
    expect(again.ids[DELL_SEQ]).toEqual({ familyId: db.store.families[0].id, versionId: db.store.versions[0].id });
  });

  it('an account missing from Prisma is skipped account_not_found and no stub account is created', async () => {
    const db = makePrisma({ accounts: [{ name: 'Dell', hubspot_company_id: '54406388074' }] });
    const res = await upsert(db.prisma, planFamilies(manifest, OPTS));
    expect(res.created).toBe(1);
    expect(res.skipped).toEqual([{ key: 'jbhunt-com', reason: 'account_not_found' }]);
    expect(db.store.accounts).toHaveLength(1);
    expect(res.ids[JBHUNT_SEQ]).toBeUndefined();
  });

  it('resolves the account by hubspot_company_id when the name differs', async () => {
    const db = makePrisma({ accounts: [{ name: 'Dell Technologies', hubspot_company_id: '54406388074' }] });
    const res = await upsert(db.prisma, [planFamilies(manifest, OPTS)[0]]);
    expect(res.created).toBe(1);
    expect(db.spies.familyCreate.mock.calls[0][0].account_name).toBe('Dell Technologies');
  });

  it('never touches an existing frozen version', async () => {
    const db = makePrisma({
      accounts: dellAndJbHuntAccounts(),
      families: [{ id: 'fam_x', hubspot_sequence_id: DELL_SEQ, engine: 'hubspot_native' }],
      versions: [{ id: 'ver_x', family_id: 'fam_x', version: 1, status: 'frozen', steps: [], steps_hash: 'old' }],
    });
    const res = await upsert(db.prisma, [planFamilies(manifest, OPTS)[0]]);
    expect(res).toMatchObject({ created: 0, existing: 1 });
    expect(res.ids[DELL_SEQ]).toEqual({ familyId: 'fam_x', versionId: 'ver_x' });
    expect(db.spies.versionCreate).not.toHaveBeenCalled();
    expect(db.spies.versionUpdate).not.toHaveBeenCalled();
    expect(db.spies.versionUpdateMany).not.toHaveBeenCalled();
    expect(db.store.versions[0]).toMatchObject({ status: 'frozen', steps_hash: 'old' });
  });

  it('dry run resolves and counts but writes nothing', async () => {
    const db = makePrisma({ accounts: dellAndJbHuntAccounts() });
    const res = await upsert(db.prisma, planFamilies(manifest, OPTS), true);
    expect(res).toMatchObject({ created: 2, existing: 0, skipped: [] });
    expect(db.spies.familyCreate).not.toHaveBeenCalled();
    expect(db.spies.versionCreate).not.toHaveBeenCalled();
    expect(res.ids[DELL_SEQ]).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// readbackContacts
// ---------------------------------------------------------------------------

describe('readbackContacts', () => {
  it('batches ids by 100 and asks for exactly the readback properties', async () => {
    const ids = Array.from({ length: 250 }, (_, i) => String(1000 + i));
    const readContacts = vi.fn<ReadContactsDeps['readContacts']>(async (batch) => batch.map((id) => ({ id, properties: {} })));
    const out = await readbackContacts({ readContacts }, ids);
    expect(readContacts).toHaveBeenCalledTimes(3);
    expect(readContacts.mock.calls.map((c) => c[0].length)).toEqual([100, 100, 50]);
    for (const c of readContacts.mock.calls) expect(c[1]).toEqual(READBACK_PROPERTIES);
    expect(out.size).toBe(250);
  });

  it('maps the three properties: string count to number, ISO date to Date, blanks to null', async () => {
    const readContacts = vi.fn(async () => [
      {
        id: '1',
        properties: {
          hs_sequences_actively_enrolled_count: '2',
          hs_latest_sequence_enrolled: '311420117',
          hs_latest_sequence_enrolled_date: '2026-09-15T17:17:39.791Z',
        },
      },
      {
        id: '2',
        properties: {
          hs_sequences_actively_enrolled_count: '',
          hs_latest_sequence_enrolled: '',
          hs_latest_sequence_enrolled_date: '',
        },
      },
      { id: '3', properties: { hs_sequences_actively_enrolled_count: null, hs_latest_sequence_enrolled: null, hs_latest_sequence_enrolled_date: null } },
      { id: '4', properties: { hs_sequences_actively_enrolled_count: '1', hs_latest_sequence_enrolled: '9', hs_latest_sequence_enrolled_date: '1757956659791' } },
    ]);
    const out = await readbackContacts({ readContacts }, ['1', '2', '3', '4']);
    expect(out.get('1')).toEqual({ activelyEnrolledCount: 2, latestSequenceId: '311420117', latestEnrolledAt: new Date('2026-09-15T17:17:39.791Z') });
    expect(out.get('2')).toEqual({ activelyEnrolledCount: 0, latestSequenceId: null, latestEnrolledAt: null });
    expect(out.get('3')).toEqual({ activelyEnrolledCount: 0, latestSequenceId: null, latestEnrolledAt: null });
    expect(out.get('4')!.latestEnrolledAt).toEqual(new Date(1757956659791));
  });

  it('a blank list makes no call', async () => {
    const readContacts = vi.fn(async () => []);
    const out = await readbackContacts({ readContacts }, []);
    expect(readContacts).not.toHaveBeenCalled();
    expect(out.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// planEnrollments
// ---------------------------------------------------------------------------

describe('planEnrollments', () => {
  const rosters = { 'dell-com': dellRoster.people };

  it('an active contact in the account sequence becomes a legacy active plan with a stable v5 id', () => {
    const { plans, reported } = planEnrollments([DELL], rosters, dellReadback(), { now: NOW, enrolledBy: 'sync' });
    const plan = plans.find((p) => p.hubspotContactId === fernanda.hubspotContactId)!;
    expect(plan).toEqual<EnrollmentPlan>({
      id: enrollmentId(DELL_SEQ, fernanda.hubspotContactId!),
      accountName: 'Dell',
      hubspotContactId: fernanda.hubspotContactId!,
      hubspotSequenceId: DELL_SEQ,
      toEmail: 'mara.ellison@example.com',
      sender: 'casey@freightroll.com',
      owner: 'sync',
      status: 'active',
      enrolledAt: new Date('2026-09-15T17:17:39.791Z'),
      externalState: {
        activelyEnrolledCount: 1,
        latestSequenceId: DELL_SEQ,
        latestEnrolledAt: '2026-09-15T17:17:39.791Z',
        // N7: the readback never carries a step index, so 0 is a placeholder and says so.
        current_step_index_unknown: true,
      },
      legacy: true,
      enrolledBy: 'sync',
    });
    // First person in Dell's sequence; second in the blast; third not enrolled.
    expect(plans).toHaveLength(1);
    expect(reported).toContainEqual({ contactId: audrey.hubspotContactId, reason: 'other_sequence', detail: BLAST_SEQUENCE_2026_09_11 });
    expect(reported).toContainEqual({ contactId: thean.hubspotContactId, reason: 'not_enrolled' });
  });

  it('the id is uuid v5 over `${sequenceId}:${contactId}` in GAP_ENROLLMENT_NS, stable and sequence-specific', () => {
    const a = enrollmentId(DELL_SEQ, '900000000001');
    expect(a).toBe(enrollmentId(DELL_SEQ, '900000000001'));
    expect(a).not.toBe(enrollmentId(JBHUNT_SEQ, '900000000001'));
    expect(a).toBe(uuidV5(GAP_ENROLLMENT_NS, `${DELL_SEQ}:900000000001`));
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('uuidV5 reproduces the RFC 4122 reference vector (DNS namespace, www.example.com)', () => {
    expect(uuidV5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'www.example.com')).toBe('2ed6657d-e927-568b-95e1-2665a8aea6a2');
  });

  it('a contact in the 2026-09-11 blast sequence is reported other_sequence, never planned', () => {
    const { plans, reported } = planEnrollments([DELL], rosters, dellReadback(), { now: NOW, enrolledBy: 'sync' });
    expect(plans.some((p) => p.hubspotContactId === audrey.hubspotContactId)).toBe(false);
    const r = reported.find((x) => x.contactId === audrey.hubspotContactId)!;
    expect(r.reason).toBe('other_sequence');
    expect(r.detail).toBe('311261507');
  });

  it('not enrolled means no row is synthesized', () => {
    const { plans, reported } = planEnrollments([DELL], rosters, dellReadback(), { now: NOW, enrolledBy: 'sync' });
    expect(plans.some((p) => p.hubspotContactId === thean.hubspotContactId)).toBe(false);
    expect(reported.find((x) => x.contactId === thean.hubspotContactId)).toEqual({ contactId: thean.hubspotContactId, reason: 'not_enrolled' });
  });

  it('a roster person without a contact id or without an email is reported, and no readback row reads as not_enrolled', () => {
    const noId: Top100RosterPerson = { ...fernanda, name: 'No Id', hubspotContactId: null };
    const noEmail: Top100RosterPerson = { ...fernanda, name: 'No Email', hubspotContactId: '999', email: null };
    const unread: Top100RosterPerson = { ...fernanda, name: 'Unread', hubspotContactId: '998' };
    const rb = dellReadback();
    rb.set('999', readbackRow());
    const { plans, reported } = planEnrollments([DELL], { 'dell-com': [noId, noEmail, unread] }, rb, { now: NOW, enrolledBy: 'sync' });
    expect(plans).toEqual([]);
    expect(reported).toContainEqual({ contactId: null, reason: 'no_contact_id', detail: 'No Id' });
    expect(reported).toContainEqual({ contactId: '999', reason: 'no_email' });
    expect(reported).toContainEqual({ contactId: '998', reason: 'not_enrolled', detail: 'no_readback_row' });
  });

  it('lowercases the email, falls back to now when the enrolled date is unknown and to unknown when the sender is unset', () => {
    const upper: Top100RosterPerson = { ...fernanda, email: 'Mara.Ellison@Example.com' };
    const rb = new Map([[fernanda.hubspotContactId!, readbackRow({ latestEnrolledAt: null })]]);
    const acct = { ...DELL, preferredSender: null };
    const { plans } = planEnrollments([acct], { 'dell-com': [upper] }, rb, { now: NOW, enrolledBy: 'sync' });
    expect(plans[0].toEmail).toBe('mara.ellison@example.com');
    expect(plans[0].enrolledAt).toEqual(NOW);
    expect(plans[0].sender).toBe('unknown');
  });

  it('N7: a readback without latestEnrolledAt keeps enrolled_at = now (the column is NOT NULL) and marks external_state.enrolled_at_unknown', () => {
    const rb = new Map([[fernanda.hubspotContactId!, readbackRow({ latestEnrolledAt: null })]]);
    const { plans } = planEnrollments([DELL], { 'dell-com': [fernanda] }, rb, { now: NOW, enrolledBy: 'sync' });
    expect(plans[0].enrolledAt).toEqual(NOW);
    expect(plans[0].externalState).toEqual({
      activelyEnrolledCount: 1,
      latestSequenceId: DELL_SEQ,
      latestEnrolledAt: null,
      enrolled_at_unknown: true,
      current_step_index_unknown: true,
    });
    // With a date the marker is absent, so its presence means exactly "placeholder".
    const dated = planEnrollments([DELL], { 'dell-com': [fernanda] }, dellReadback(), { now: NOW, enrolledBy: 'sync' });
    expect(dated.plans[0].externalState).not.toHaveProperty('enrolled_at_unknown');
  });
});

// ---------------------------------------------------------------------------
// applyEnrollments
// ---------------------------------------------------------------------------

describe('applyEnrollments', () => {
  const rosters = { 'dell-com': dellRoster.people };

  async function planned(readback = dellReadback()) {
    const { db, fam } = await seededFamilies();
    const { plans } = planEnrollments([DELL], rosters, readback, { now: NOW, enrolledBy: 'sync' });
    return { db, fam, plans, readback };
  }

  it('creates a legacy row pinned to the family and its v1', async () => {
    const { db, fam, plans, readback } = await planned();
    const res = await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback });
    expect(res).toMatchObject({ created: 1, updated: 0, unchanged: 0, held: [] });
    const row = db.spies.enrollmentCreate.mock.calls[0][0];
    expect(row).toEqual({
      id: enrollmentId(DELL_SEQ, fernanda.hubspotContactId!),
      engine: 'hubspot_native',
      family_id: fam.ids[DELL_SEQ]!.familyId,
      sequence_version_id: fam.ids[DELL_SEQ]!.versionId,
      account_name: 'Dell',
      to_email: 'mara.ellison@example.com',
      hubspot_contact_id: fernanda.hubspotContactId,
      hubspot_sequence_id: DELL_SEQ,
      sender: 'casey@freightroll.com',
      owner: 'sync',
      status: 'active',
      current_step_index: 0,
      external_state: { activelyEnrolledCount: 1, latestSequenceId: DELL_SEQ, latestEnrolledAt: '2026-09-15T17:17:39.791Z', current_step_index_unknown: true },
      external_synced_at: NOW,
      is_test: false,
      legacy: true,
      enrolled_by: 'sync',
      enrolled_at: new Date('2026-09-15T17:17:39.791Z'),
    });
  });

  it('a second run with the same readback is unchanged and writes nothing', async () => {
    const { db, fam, plans, readback } = await planned();
    await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback });
    const again = await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback });
    expect(again).toMatchObject({ created: 0, updated: 0, unchanged: 1, held: [] });
    expect(db.spies.enrollmentCreate).toHaveBeenCalledTimes(1);
    expect(db.spies.enrollmentUpdate).not.toHaveBeenCalled();
  });

  it('R2-6: readback flipping to not enrolled STOPS the active row with stop_reason legacy_unknown, never completed', async () => {
    const { db, fam, plans, readback } = await planned();
    await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback });

    const later = new Date('2026-09-24T12:00:00.000Z');
    const flipped = new Map(readback);
    flipped.set(fernanda.hubspotContactId!, readbackRow({ activelyEnrolledCount: 0, latestSequenceId: DELL_SEQ }));
    const { plans: nowPlans } = planEnrollments([DELL], rosters, flipped, { now: later, enrolledBy: 'sync' });
    expect(nowPlans).toEqual([]);

    const res = await applyEnrollments(db.prisma, nowPlans, { dryRun: false, now: later, familyIds: fam.ids, readback: flipped });
    expect(res).toMatchObject({ created: 0, updated: 1, unchanged: 0, otherSequenceActive: 0 });
    expect(db.spies.enrollmentUpdate).toHaveBeenCalledTimes(1);
    const { where, data } = db.spies.enrollmentUpdate.mock.calls[0][0];
    expect(where).toEqual({ id: enrollmentId(DELL_SEQ, fernanda.hubspotContactId!) });
    // HubSpot only says "no longer actively enrolled": a reply, a bounce, a
    // manual unenroll and a natural finish all look the same, so the row is
    // stopped with the honest reason, not completed.
    expect(data).toEqual({
      status: 'stopped',
      stop_reason: 'legacy_unknown',
      stopped_at: later,
      external_state: { activelyEnrolledCount: 0, latestSequenceId: DELL_SEQ, latestEnrolledAt: '2026-09-15T17:17:39.791Z', current_step_index_unknown: true },
      external_synced_at: later,
    });
    expect(data.status).not.toBe('completed');
    expect(data).not.toHaveProperty('completed_at');
    expect(Object.keys(data)).not.toEqual(expect.arrayContaining(['to_email', 'enrolled_at', 'legacy', 'family_id', 'sequence_version_id']));
  });

  it('R2-6: an active row whose contact is actively enrolled in a DIFFERENT sequence is held other_sequence_active, status untouched', async () => {
    const { db, fam, plans, readback } = await planned();
    await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback });

    const later = new Date('2026-09-24T12:00:00.000Z');
    const elsewhere = new Map(readback);
    // Still enrolled in two sequences; HubSpot reports the blast as the latest.
    elsewhere.set(fernanda.hubspotContactId!, readbackRow({ activelyEnrolledCount: 2, latestSequenceId: BLAST_SEQUENCE_2026_09_11 }));
    const { plans: nowPlans } = planEnrollments([DELL], rosters, elsewhere, { now: later, enrolledBy: 'sync' });
    expect(nowPlans).toEqual([]);

    const res = await applyEnrollments(db.prisma, nowPlans, { dryRun: false, now: later, familyIds: fam.ids, readback: elsewhere });
    expect(res).toMatchObject({ created: 0, updated: 0, unchanged: 0, otherSequenceActive: 1 });
    expect(db.spies.enrollmentUpdate).toHaveBeenCalledTimes(1);
    const { data } = db.spies.enrollmentUpdate.mock.calls[0][0];
    expect(data).toEqual({
      external_state: {
        activelyEnrolledCount: 2,
        latestSequenceId: BLAST_SEQUENCE_2026_09_11,
        latestEnrolledAt: '2026-09-15T17:17:39.791Z',
        current_step_index_unknown: true,
        hold: 'other_sequence_active',
      },
      external_synced_at: later,
    });
    expect(data).not.toHaveProperty('status');
    expect(data).not.toHaveProperty('stop_reason');
    expect(db.store.enrollments[0].status).toBe('active');

    // The same readback again: the hold is already recorded, nothing is written.
    const again = await applyEnrollments(db.prisma, [], { dryRun: false, now: later, familyIds: fam.ids, readback: elsewhere });
    expect(again).toMatchObject({ created: 0, updated: 0, unchanged: 0, otherSequenceActive: 1 });
    expect(db.spies.enrollmentUpdate).toHaveBeenCalledTimes(1);
  });

  it('R2-6: a dry run counts the hold and the stop but writes neither', async () => {
    const { db, fam, plans, readback } = await planned();
    await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback });
    const elsewhere = new Map(readback);
    elsewhere.set(fernanda.hubspotContactId!, readbackRow({ activelyEnrolledCount: 1, latestSequenceId: BLAST_SEQUENCE_2026_09_11 }));
    const held = await applyEnrollments(db.prisma, [], { dryRun: true, now: NOW, familyIds: fam.ids, readback: elsewhere });
    expect(held).toMatchObject({ otherSequenceActive: 1, updated: 0 });
    const gone = new Map(readback);
    gone.set(fernanda.hubspotContactId!, readbackRow({ activelyEnrolledCount: 0 }));
    const stopped = await applyEnrollments(db.prisma, [], { dryRun: true, now: NOW, familyIds: fam.ids, readback: gone });
    expect(stopped).toMatchObject({ otherSequenceActive: 0, updated: 1 });
    expect(db.spies.enrollmentUpdate).not.toHaveBeenCalled();
    expect(db.store.enrollments[0].status).toBe('active');
  });

  it('an active row with a stop requested is not completed by the sync; only the readback is recorded', async () => {
    const { db, fam, plans, readback } = await planned();
    await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback });
    db.store.enrollments[0].stop_requested_at = NOW;
    const flipped = new Map(readback);
    flipped.set(fernanda.hubspotContactId!, readbackRow({ activelyEnrolledCount: 0 }));
    const res = await applyEnrollments(db.prisma, [], { dryRun: false, now: NOW, familyIds: fam.ids, readback: flipped });
    expect(res).toMatchObject({ created: 0, updated: 1 });
    const { data } = db.spies.enrollmentUpdate.mock.calls[0][0];
    expect(data.status).toBeUndefined();
    expect(data.external_state.activelyEnrolledCount).toBe(0);
  });

  it('a stopped row is never reopened even when the readback says active', async () => {
    const { db, fam, plans, readback } = await planned();
    const id = enrollmentId(DELL_SEQ, fernanda.hubspotContactId!);
    db.store.enrollments.push({
      id,
      engine: 'hubspot_native',
      status: 'stopped',
      stop_reason: 'replied',
      hubspot_contact_id: fernanda.hubspotContactId,
      hubspot_sequence_id: DELL_SEQ,
      external_state: null,
    });
    const res = await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback });
    expect(res.created).toBe(0);
    expect(res.held).toEqual([{ id, reason: 'stopped_not_reopened' }]);
    expect(db.store.enrollments[0].status).toBe('stopped');
    expect(db.store.enrollments[0].stop_reason).toBe('replied');
    for (const call of db.spies.enrollmentUpdate.mock.calls) {
      expect(call[0].data.status).toBeUndefined();
      expect(call[0].data.stop_reason).toBeUndefined();
    }
    // The readback is still recorded on the row so the disagreement is visible.
    expect(db.store.enrollments[0].external_state).toEqual({ activelyEnrolledCount: 1, latestSequenceId: DELL_SEQ, latestEnrolledAt: '2026-09-15T17:17:39.791Z', current_step_index_unknown: true });
  });

  it('N7: the unknown markers are sticky: a later readback that carries a date keeps enrolled_at_unknown on the row', async () => {
    const { db, fam } = await seededFamilies();
    const undated = new Map([[fernanda.hubspotContactId!, readbackRow({ latestEnrolledAt: null })]]);
    const { plans: first } = planEnrollments([DELL], rosters, undated, { now: NOW, enrolledBy: 'sync' });
    await applyEnrollments(db.prisma, first, { dryRun: false, now: NOW, familyIds: fam.ids, readback: undated });
    expect(db.store.enrollments[0]).toMatchObject({ enrolled_at: NOW, external_state: { enrolled_at_unknown: true, current_step_index_unknown: true } });

    const later = new Date('2026-09-24T12:00:00.000Z');
    const dated = dellReadback();
    const { plans: second } = planEnrollments([DELL], rosters, dated, { now: later, enrolledBy: 'sync' });
    const res = await applyEnrollments(db.prisma, second, { dryRun: false, now: later, familyIds: fam.ids, readback: dated });
    expect(res).toMatchObject({ created: 0, updated: 1 });
    const { data } = db.spies.enrollmentUpdate.mock.calls[0][0];
    // enrolled_at is pinned and still the placeholder, so the marker must survive.
    expect(data.external_state).toEqual({
      activelyEnrolledCount: 1,
      latestSequenceId: DELL_SEQ,
      latestEnrolledAt: '2026-09-15T17:17:39.791Z',
      enrolled_at_unknown: true,
      current_step_index_unknown: true,
    });
    expect(data).not.toHaveProperty('enrolled_at');

    // The sweep carries them too when the row is stopped.
    const gone = new Map([[fernanda.hubspotContactId!, readbackRow({ activelyEnrolledCount: 0 })]]);
    await applyEnrollments(db.prisma, [], { dryRun: false, now: later, familyIds: fam.ids, readback: gone });
    expect(db.store.enrollments[0].status).toBe('stopped');
    expect(db.store.enrollments[0].external_state).toMatchObject({ enrolled_at_unknown: true, current_step_index_unknown: true });
  });

  it('N7: a unique violation (P2002) on one row is reported enroll_collision:<email> and the run continues', async () => {
    const { db, fam } = await seededFamilies();
    const rb = dellReadback();
    rb.set(thean.hubspotContactId!, readbackRow()); // the third person is in the sequence too
    const { plans } = planEnrollments([DELL], rosters, rb, { now: NOW, enrolledBy: 'sync' });
    expect(plans.map((p) => p.toEmail)).toEqual([fernanda.email, thean.email]);

    const realCreate = db.prisma.sequenceEnrollment.create.getMockImplementation()!;
    db.prisma.sequenceEnrollment.create.mockImplementation(async (args: { data: Row }) => {
      if (args.data.to_email === fernanda.email) {
        throw Object.assign(new Error('Unique constraint failed on the fields: (to_email)'), { code: 'P2002', meta: { target: ['to_email'] } });
      }
      return realCreate(args);
    });

    const res = await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback: rb });
    expect(res).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    expect(res.held).toEqual([{ id: plans[0].id, reason: `enroll_collision:${fernanda.email}` }]);
    expect(db.store.enrollments.map((e) => e.to_email)).toEqual([thean.email]);
  });

  it('N7: any other create error still aborts the run (only P2002 is a collision)', async () => {
    const { db, fam, plans, readback } = await planned();
    db.prisma.sequenceEnrollment.create.mockRejectedValueOnce(Object.assign(new Error('connection reset'), { code: 'P1017' }));
    await expect(applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: fam.ids, readback })).rejects.toThrow('connection reset');
  });

  it('a plan whose family was not resolved is held family_unresolved, not created', async () => {
    const { db, plans, readback } = await planned();
    const res = await applyEnrollments(db.prisma, plans, { dryRun: false, now: NOW, familyIds: {}, readback });
    expect(res.created).toBe(0);
    expect(res.held).toEqual([{ id: plans[0].id, reason: 'family_unresolved' }]);
    expect(db.spies.enrollmentCreate).not.toHaveBeenCalled();
  });

  it('dry run counts what it would do and writes nothing', async () => {
    const { db, fam, plans, readback } = await planned();
    const res = await applyEnrollments(db.prisma, plans, { dryRun: true, now: NOW, familyIds: fam.ids, readback });
    expect(res).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    expect(db.spies.enrollmentCreate).not.toHaveBeenCalled();
    expect(db.spies.enrollmentUpdate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// runEnrollmentSync (end to end over the in-memory prisma)
// ---------------------------------------------------------------------------

describe('runEnrollmentSync', () => {
  it('produces the report from the manifest, rosters and injected readback', async () => {
    const db = makePrisma({ accounts: dellAndJbHuntAccounts() });
    const readContacts = vi.fn(async (ids: string[]) =>
      ids.map((id) => {
        const rb = dellReadback().get(id);
        return {
          id,
          properties: rb
            ? {
                hs_sequences_actively_enrolled_count: String(rb.activelyEnrolledCount),
                hs_latest_sequence_enrolled: rb.latestSequenceId,
                hs_latest_sequence_enrolled_date: rb.latestEnrolledAt?.toISOString() ?? null,
              }
            : { hs_sequences_actively_enrolled_count: '0', hs_latest_sequence_enrolled: null, hs_latest_sequence_enrolled_date: null },
        };
      }),
    );
    const report = await runEnrollmentSync(
      db.prisma,
      { manifest, rosters: { 'dell-com': dellRoster.people }, now: NOW, dryRun: false, program: OPTS.program, portal: OPTS.portal, actor: 'sync' },
      { readContacts },
    );
    expect(report).toEqual({
      dryRun: false,
      families: { created: 2, existing: 0, skipped: [] },
      contactsRead: 7,
      enrollments: { created: 1, updated: 0, unchanged: 0, otherSequenceActive: 0, held: [] },
      reported: { other_sequence: 1, not_enrolled: 5, no_email: 0, no_contact_id: 0 },
      rostersMissing: ['jbhunt-com'],
    });
    expect(readContacts).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Structural: the module has no HubSpot write path
// ---------------------------------------------------------------------------

describe('structural: external-sync.ts has no HubSpot write path', () => {
  const source = readFileSync(MODULE_PATH, 'utf8');

  /**
   * The forbidden list. Prisma delegate calls (prisma.<delegate>.create /
   * update) are the only writes this module may make, so the create/update
   * patterns exclude a `prisma.<delegate>` receiver and catch every other one.
   */
  const FORBIDDEN: Array<[string, RegExp]> = [
    ['import of the HubSpot client or SDK', /@\/lib\/hubspot|@hubspot\/api-client|hubapi\.com/],
    ['a raw fetch', /\bfetch\s*\(/],
    ['a create( call on anything but a prisma delegate', /(?<!prisma\.\w+)\.create\s*\(/],
    ['an update( call on anything but a prisma delegate', /(?<!prisma\.\w+)\.update\s*\(/],
    ['an upsert( call on anything but a prisma delegate', /(?<!prisma\.\w+)\.upsert\s*\(/],
    ['a patch( call', /\.patch\s*\(/],
    ['an archive( or delete( call', /\.(archive|delete|deleteMany)\s*\(/],
    ['the SDK write surfaces', /basicApi\.(create|update|archive)|batchApi\.(create|update|archive|upsert)/],
    ['an enroll* method call', /\.enroll\w*\s*\(/],
    ['the sequences enrollment endpoint', /automation\/v4\/sequences/],
    ['a POST', /\bPOST\b|method:\s*['"]/],
  ];

  for (const [label, re] of FORBIDDEN) {
    it(`contains no ${label}`, () => {
      expect(source).not.toMatch(re);
    });
  }

  it('the regexes are live: each one matches its own forbidden text', () => {
    const samples = [
      "import { getHubSpotClient } from '@/lib/hubspot/client';",
      'await fetch(url)',
      'client.crm.contacts.basicApi.create(x)',
      'client.crm.contacts.basicApi.update(id, x)',
      'client.crm.contacts.batchApi.upsert(x)',
      'api.patch(x)',
      'client.archive(id)',
      'client.crm.contacts.batchApi.archive(x)',
      'sequences.enrollments.enroll(x)',
      "apiRequest({ path: '/automation/v4/sequences/enrollments' })",
      "{ method: 'POST' }",
    ];
    for (const s of samples) expect(FORBIDDEN.some(([, re]) => re.test(s))).toBe(true);
    expect(FORBIDDEN.some(([, re]) => re.test('await prisma.sequenceFamily.create({ data })'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

describe('GET /api/cron/gap-enrollment-sync', () => {
  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    savedEnv = { ...process.env };
    process.env.CRON_SECRET = 'cron-secret';
    delete process.env.GAP_OS_ENABLED;
    delete process.env.GAP_ROUTING_ENABLED;
    delete process.env.GAP_TOP100_DIR;
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    mockedClaim.mockReset();
    mockedClaim.mockResolvedValue({ claimed: true, key: 'k' });
    mockedStarted.mockClear();
    mockedSkipped.mockClear();
    mockedSuccess.mockClear();
    mockedFailure.mockClear();
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in savedEnv)) delete process.env[key];
    }
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value !== undefined) process.env[key] = value;
    }
  });

  function req(query = '', headers: Record<string, string> = {}) {
    return new NextRequest(`http://localhost/api/cron/gap-enrollment-sync${query}`, { headers });
  }

  it('answers 401 without the cron secret', async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(mockedStarted).not.toHaveBeenCalled();
  });

  it('answers 200 with the skip payload when GAP_OS_ENABLED is off', async () => {
    const res = await GET(req('', { 'x-cron-secret': 'cron-secret' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(mockedSkipped).toHaveBeenCalledWith('gap-enrollment-sync', expect.objectContaining({ reason: 'GAP_OS_ENABLED=false' }));
    expect(mockedClaim).not.toHaveBeenCalled();
  });

  it('answers 200 naming GAP_ROUTING_ENABLED when only the master switch is on', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const res = await GET(req('', { 'x-cron-secret': 'cron-secret' }));
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_ROUTING_ENABLED=false' });
  });

  it('answers 200 skipped when GAP_TOP100_DIR is unset, before any claim or HubSpot read', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    const res = await GET(req('?mode=apply', { 'x-cron-secret': 'cron-secret' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_TOP100_DIR unset' });
    expect(mockedClaim).not.toHaveBeenCalled();
    expect(mockedGetClient).not.toHaveBeenCalled();
    expect(mockedSkipped).toHaveBeenCalledWith('gap-enrollment-sync', expect.objectContaining({ reason: 'GAP_TOP100_DIR unset' }));
  });
});
