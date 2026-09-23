/**
 * S1-T11: HubSpot mirror for hypothesis events.
 *
 * Every HubSpot call is stubbed through `deps`. No test here ever touches a
 * real client, and NODE_ENV=test keeps the external-write guard armed for the
 * one test that exercises it on purpose.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  hypothesisNoteBody,
  mirrorHypothesisEvent,
  mirrorKey,
  statusForAction,
  type MirrorDeps,
  type MirrorEvent,
} from '@/lib/gap/hubspot-mirror';
import { PROBLEM_FAMILIES, RESPONSE_CLASSES } from '@/lib/gap/taxonomy';

let savedEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  savedEnv = { ...process.env };
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_HUBSPOT_MIRROR_ENABLED = 'true';
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in savedEnv)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value !== undefined) process.env[key] = value;
  }
});

function makeEvent(overrides: Partial<MirrorEvent> = {}): MirrorEvent {
  return {
    hypothesisId: 'hyp_1',
    action: 'submitted',
    hypothesis: {
      accountName: 'Acme Foods',
      hubspotCompanyId: '901',
      problemFamily: 'hidden_capacity',
      observation: 'Acme opened a second DC in Ohio [S:sig1] and is hiring yard jockeys [S:sig2].',
      problemHypothesis: 'My guess is the new site runs on the old gate process.',
      whyNow: 'Site opens Q4.',
      falsificationQuestions: ['Is the gate already automated?', 'Does a 3PL run the yard?'],
      whatANoMeans: 'The yard is already instrumented.',
      confidence: 62,
      status: 'draft',
      version: 2,
    },
    evidence: [
      { id: 'sig1', title: 'Ohio DC announcement', url: 'https://example.com/ohio' },
      { id: 'sig2', title: 'Job posting', url: null },
    ],
    ...overrides,
  };
}

type PrismaStub = {
  gapHubSpotMirror: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

function makePrisma(existing: { key: string; error: string | null } | null = null): PrismaStub {
  return {
    gapHubSpotMirror: {
      findUnique: vi.fn().mockResolvedValue(existing),
      upsert: vi.fn().mockImplementation(async (args: { create: unknown }) => args.create),
    },
  };
}

type MockedDeps = MirrorDeps & {
  createCompanyNote: Mock<(companyId: string, body: string) => Promise<string | null>>;
  updateCompanyProperties: Mock<(companyId: string, properties: Record<string, string>) => Promise<unknown>>;
  ensureGapProperties: Mock<() => Promise<void>>;
};

function makeDeps(overrides: Partial<MirrorDeps> = {}): MockedDeps {
  const defaults: MockedDeps = {
    createCompanyNote: vi.fn<(companyId: string, body: string) => Promise<string | null>>(async () => 'note_77'),
    updateCompanyProperties: vi.fn<(companyId: string, properties: Record<string, string>) => Promise<unknown>>(
      async () => undefined,
    ),
    ensureGapProperties: vi.fn(async () => undefined),
    syncEnabled: () => true,
    assertWriteAllowed: () => undefined,
    now: () => new Date('2026-09-23T12:00:00Z'),
  };
  // Overrides may replace a mock with a differently-typed mock; the tests that
  // do so only call the Mock API on the one they passed in.
  return { ...defaults, ...overrides } as MockedDeps;
}

describe('mirrorKey / statusForAction', () => {
  it('builds the documented idempotency key', () => {
    expect(mirrorKey('hyp_1', 'approved')).toBe('gap:hyp:hyp_1:approved');
  });

  it('maps every action to a yardflow_gap_status option', () => {
    expect(statusForAction('submitted', 'draft')).toBe('hypothesis_proposed');
    expect(statusForAction('approved', 'approved')).toBe('hypothesis_approved');
    expect(statusForAction('activated', 'active')).toBe('hypothesis_approved');
    expect(statusForAction('resolved', 'confirmed')).toBe('resolved_confirmed');
    expect(statusForAction('resolved', 'partially_confirmed')).toBe('resolved_confirmed');
    expect(statusForAction('resolved', 'rejected')).toBe('resolved_rejected');
    expect(statusForAction('resolved', 'unresolved')).toBe('resolved_rejected');
    expect(statusForAction('withdrawn', 'rejected')).toBe('nurture');
    expect(statusForAction('expired', 'expired')).toBe('nurture');
    expect(statusForAction('closed_unresolved', 'unresolved')).toBe('nurture');
  });
});

describe('hypothesisNoteBody', () => {
  it('escapes HTML in user text and numbers evidence citations', () => {
    const event = makeEvent({
      hypothesis: {
        ...makeEvent().hypothesis,
        observation: 'Bad <script>alert(1)</script> text [S:sig1] and [S:sig2] and [S:unknown]',
      },
    });
    const body = hypothesisNoteBody({ key: 'gap:hyp:hyp_1:submitted', ...event });
    expect(body).not.toContain('<script>');
    expect(body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(body).toContain('<a href="https://example.com/ohio">[1]</a>');
    // sig2 has no url: plain numbered token, no anchor.
    expect(body).toContain(' [2] ');
    expect(body).not.toContain('<a href="">');
    // Unknown citation ids are left as visible text so a reviewer sees the gap.
    expect(body).toContain('[S:unknown]');
  });

  it('carries the header, version, confidence, every section and the key marker', () => {
    const body = hypothesisNoteBody({ key: 'gap:hyp:hyp_1:approved', ...makeEvent({ action: 'approved' }) });
    expect(body).toContain('<b>GAP · HYPOTHESIS APPROVED - hidden_capacity</b> <i>(v2, 62%)</i>');
    expect(body).toContain('<br>Hypothesis: My guess is the new site runs on the old gate process.');
    expect(body).toContain('<br>Why now: Site opens Q4.');
    expect(body).toContain(
      '<br>Would prove wrong: Is the gate already automated? | Does a 3PL run the yard?',
    );
    expect(body).toContain('<span style="color:#888">gap:hyp:hyp_1:approved</span>');
    expect(body).not.toContain('—');
  });

  it('falls back to whatANoMeans, then n/a, and defaults the version to 1', () => {
    const base = makeEvent().hypothesis;
    const withNo = hypothesisNoteBody({
      key: 'k',
      ...makeEvent({ hypothesis: { ...base, falsificationQuestions: [], version: undefined, whyNow: null } }),
    });
    expect(withNo).toContain('(v1, 62%)');
    expect(withNo).toContain('Why now: n/a');
    expect(withNo).toContain('Would prove wrong: The yard is already instrumented.');
    const bare = hypothesisNoteBody({
      key: 'k',
      ...makeEvent({ hypothesis: { ...base, falsificationQuestions: [], whatANoMeans: null } }),
    });
    expect(bare).toContain('Would prove wrong: n/a');
  });
});

describe('mirrorHypothesisEvent gates', () => {
  it('skips with gap_disabled when GAP_OS_ENABLED is off and calls nothing', async () => {
    delete process.env.GAP_OS_ENABLED;
    const prisma = makePrisma();
    const deps = makeDeps();
    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(result).toEqual({ status: 'skipped', reason: 'gap_disabled' });
    expect(prisma.gapHubSpotMirror.findUnique).not.toHaveBeenCalled();
    expect(deps.ensureGapProperties).not.toHaveBeenCalled();
    expect(deps.createCompanyNote).not.toHaveBeenCalled();
    expect(deps.updateCompanyProperties).not.toHaveBeenCalled();
  });

  it('skips with gap_mirror_disabled when GAP_HUBSPOT_MIRROR_ENABLED is unset, even with sync on, and calls nothing', async () => {
    delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
    const prisma = makePrisma();
    const deps = makeDeps({ syncEnabled: () => true });
    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(result).toEqual({ status: 'skipped', reason: 'gap_mirror_disabled' });
    expect(prisma.gapHubSpotMirror.findUnique).not.toHaveBeenCalled();
    expect(deps.ensureGapProperties).not.toHaveBeenCalled();
    expect(deps.createCompanyNote).not.toHaveBeenCalled();
    expect(deps.updateCompanyProperties).not.toHaveBeenCalled();
  });

  it('skips with gap_mirror_disabled when the flag is spelled false', async () => {
    process.env.GAP_HUBSPOT_MIRROR_ENABLED = 'false';
    const result = await mirrorHypothesisEvent(makePrisma(), makeEvent(), makeDeps());
    expect(result).toEqual({ status: 'skipped', reason: 'gap_mirror_disabled' });
  });

  it('checks GAP_OS_ENABLED before the mirror flag', async () => {
    delete process.env.GAP_OS_ENABLED;
    delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
    const result = await mirrorHypothesisEvent(makePrisma(), makeEvent(), makeDeps());
    expect(result).toEqual({ status: 'skipped', reason: 'gap_disabled' });
  });

  it('checks the mirror flag before HUBSPOT_SYNC_ENABLED', async () => {
    delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
    const result = await mirrorHypothesisEvent(makePrisma(), makeEvent(), makeDeps({ syncEnabled: () => false }));
    expect(result).toEqual({ status: 'skipped', reason: 'gap_mirror_disabled' });
  });

  it('skips with hubspot_sync_disabled when sync is off', async () => {
    const prisma = makePrisma();
    const deps = makeDeps({ syncEnabled: () => false });
    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(result).toEqual({ status: 'skipped', reason: 'hubspot_sync_disabled' });
    expect(deps.createCompanyNote).not.toHaveBeenCalled();
  });

  it('skips with no_company_id when the hypothesis has no HubSpot company', async () => {
    const prisma = makePrisma();
    const deps = makeDeps();
    const event = makeEvent({ hypothesis: { ...makeEvent().hypothesis, hubspotCompanyId: null } });
    const result = await mirrorHypothesisEvent(prisma, event, deps);
    expect(result).toEqual({ status: 'skipped', reason: 'no_company_id' });
    expect(prisma.gapHubSpotMirror.findUnique).not.toHaveBeenCalled();
    expect(deps.createCompanyNote).not.toHaveBeenCalled();
  });
});

describe('mirrorHypothesisEvent idempotency', () => {
  it('skips with already_written and makes ZERO HubSpot calls when the row exists without error', async () => {
    const prisma = makePrisma({ key: 'gap:hyp:hyp_1:submitted', error: null });
    const deps = makeDeps();
    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(result).toEqual({ status: 'skipped', reason: 'already_written', noteId: null });
    expect(prisma.gapHubSpotMirror.findUnique).toHaveBeenCalledWith({
      where: { key: 'gap:hyp:hyp_1:submitted' },
    });
    expect(deps.ensureGapProperties).toHaveBeenCalledTimes(0);
    expect(deps.createCompanyNote).toHaveBeenCalledTimes(0);
    expect(deps.updateCompanyProperties).toHaveBeenCalledTimes(0);
    expect(prisma.gapHubSpotMirror.upsert).not.toHaveBeenCalled();
  });

  it('returns the stored note id on already_written', async () => {
    const prisma = makePrisma();
    prisma.gapHubSpotMirror.findUnique.mockResolvedValue({
      key: 'gap:hyp:hyp_1:submitted',
      error: null,
      note_id: 'note_old',
    });
    const result = await mirrorHypothesisEvent(prisma, makeEvent(), makeDeps());
    expect(result).toEqual({ status: 'skipped', reason: 'already_written', noteId: 'note_old' });
  });
});

describe('mirrorHypothesisEvent happy path', () => {
  it('ensures properties, writes one note with the key and a [1] link, stamps the mapped status, upserts the row', async () => {
    const prisma = makePrisma();
    const deps = makeDeps();
    const result = await mirrorHypothesisEvent(prisma, makeEvent({ action: 'approved' }), deps);

    expect(result).toEqual({ status: 'written', noteId: 'note_77' });
    expect(deps.ensureGapProperties).toHaveBeenCalledTimes(1);
    expect(deps.createCompanyNote).toHaveBeenCalledTimes(1);
    const [companyId, body] = deps.createCompanyNote.mock.calls[0] as [string, string];
    expect(companyId).toBe('901');
    expect(body).toContain('gap:hyp:hyp_1:approved');
    expect(body).toContain('<a href="https://example.com/ohio">[1]</a>');
    expect(deps.updateCompanyProperties).toHaveBeenCalledTimes(1);
    expect(deps.updateCompanyProperties).toHaveBeenCalledWith('901', {
      yardflow_gap_status: 'hypothesis_approved',
      yardflow_gap_problem_family: 'hidden_capacity',
    });
    expect(prisma.gapHubSpotMirror.upsert).toHaveBeenCalledTimes(1);
    const upsertArgs = prisma.gapHubSpotMirror.upsert.mock.calls[0][0];
    expect(upsertArgs.where).toEqual({ key: 'gap:hyp:hyp_1:approved' });
    expect(upsertArgs.create).toEqual({
      key: 'gap:hyp:hyp_1:approved',
      object_type: 'company',
      object_id: '901',
      note_id: 'note_77',
      written_at: new Date('2026-09-23T12:00:00Z'),
      error: null,
    });
    expect(upsertArgs.update).toEqual({
      object_type: 'company',
      object_id: '901',
      note_id: 'note_77',
      written_at: new Date('2026-09-23T12:00:00Z'),
      error: null,
    });
  });

  it('stamps resolved_rejected for a resolved hypothesis whose status is rejected', async () => {
    const prisma = makePrisma();
    const deps = makeDeps();
    const event = makeEvent({
      action: 'resolved',
      hypothesis: { ...makeEvent().hypothesis, status: 'rejected' },
    });
    await mirrorHypothesisEvent(prisma, event, deps);
    expect(deps.updateCompanyProperties).toHaveBeenCalledWith('901', {
      yardflow_gap_status: 'resolved_rejected',
      yardflow_gap_problem_family: 'hidden_capacity',
    });
  });
});

describe('mirrorHypothesisEvent failures', () => {
  it('records a createCompanyNote throw on the row, returns error, never throws, and retries next time', async () => {
    const prisma = makePrisma();
    const deps = makeDeps({
      createCompanyNote: vi.fn().mockRejectedValueOnce(new Error('HubSpot 500: notes down')),
    });

    const first = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(first.status).toBe('error');
    expect(first.reason).toBe('HubSpot 500: notes down');
    expect(deps.updateCompanyProperties).not.toHaveBeenCalled();
    expect(prisma.gapHubSpotMirror.upsert).toHaveBeenCalledTimes(1);
    const errArgs = prisma.gapHubSpotMirror.upsert.mock.calls[0][0];
    expect(errArgs.create.error).toBe('HubSpot 500: notes down');
    expect(errArgs.update.error).toBe('HubSpot 500: notes down');
    expect(errArgs.create.note_id).toBeNull();

    // Second call: the row now exists WITH an error, so it must retry and write.
    prisma.gapHubSpotMirror.findUnique.mockResolvedValue({
      key: 'gap:hyp:hyp_1:submitted',
      error: 'HubSpot 500: notes down',
      note_id: null,
    });
    deps.createCompanyNote.mockResolvedValueOnce('note_78');
    const second = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(second).toEqual({ status: 'written', noteId: 'note_78' });
    expect(deps.createCompanyNote).toHaveBeenCalledTimes(2);
    expect(deps.updateCompanyProperties).toHaveBeenCalledTimes(1);
    expect(prisma.gapHubSpotMirror.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.gapHubSpotMirror.upsert.mock.calls[1][0].update.error).toBeNull();
  });

  it('treats a null note id (fail-open createCompanyNote) as an error so the row retries', async () => {
    const prisma = makePrisma();
    const deps = makeDeps({ createCompanyNote: vi.fn().mockResolvedValue(null) });
    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(result.status).toBe('error');
    expect(result.reason).toBe('note_not_created');
    expect(deps.updateCompanyProperties).not.toHaveBeenCalled();
    expect(prisma.gapHubSpotMirror.upsert.mock.calls[0][0].create.error).toBe('note_not_created');
  });

  it('records an updateCompanyProperties throw with the note id so the note is not lost', async () => {
    const prisma = makePrisma();
    const deps = makeDeps({
      updateCompanyProperties: vi.fn().mockRejectedValue(new Error('PROPERTY_DOESNT_EXIST')),
    });
    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(result).toEqual({ status: 'error', reason: 'PROPERTY_DOESNT_EXIST', noteId: 'note_77' });
    const args = prisma.gapHubSpotMirror.upsert.mock.calls[0][0];
    expect(args.create.error).toBe('PROPERTY_DOESNT_EXIST');
    expect(args.create.note_id).toBe('note_77');
  });

  it('records the real external-write guard message under NODE_ENV=test with zero HubSpot calls', async () => {
    Object.assign(process.env, { NODE_ENV: 'test' });
    delete process.env.ALLOW_EXTERNAL_WRITES_IN_TEST;
    delete process.env.BLOCK_EXTERNAL_WRITES_IN_TEST;
    const prisma = makePrisma();
    const deps = makeDeps({ assertWriteAllowed: undefined });
    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(result.status).toBe('error');
    expect(result.reason).toMatch(/^\[external-write-guard\] blocked hubspot write in test mode: gap\.mirrorHypothesisEvent/);
    expect(deps.ensureGapProperties).not.toHaveBeenCalled();
    expect(deps.createCompanyNote).not.toHaveBeenCalled();
    expect(deps.updateCompanyProperties).not.toHaveBeenCalled();
    expect(prisma.gapHubSpotMirror.upsert.mock.calls[0][0].create.error).toMatch(/external-write-guard/);
  });

  it('never throws even when the mirror table itself is unreachable', async () => {
    const prisma = {
      gapHubSpotMirror: {
        findUnique: vi.fn().mockRejectedValue(new Error('db down')),
        upsert: vi.fn().mockRejectedValue(new Error('db down')),
      },
    };
    const deps = makeDeps();
    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);
    expect(result.status).toBe('error');
    expect(result.reason).toBe('db down');
    expect(deps.createCompanyNote).not.toHaveBeenCalled();
  });
});

describe('ensureGapProperties (src/lib/hubspot/properties)', () => {
  function fakeClient() {
    const getByName = vi.fn().mockRejectedValue(new Error('not found'));
    const create = vi.fn().mockResolvedValue({});
    const client = { crm: { properties: { coreApi: { getByName, create } } } };
    return { client, getByName, create };
  }

  it('creates the two company and two contact properties with taxonomy-backed options, once per process', async () => {
    const { ensureGapProperties, __resetYardflowPropertyCache, GAP_PROPERTY_NAMES } = await import(
      '@/lib/hubspot/properties'
    );
    __resetYardflowPropertyCache();
    const { client, create } = fakeClient();

    await ensureGapProperties(client as never);
    await ensureGapProperties(client as never);

    expect(create).toHaveBeenCalledTimes(4);
    const calls = create.mock.calls as Array<[string, Record<string, unknown>]>;
    const byName = Object.fromEntries(calls.map(([objectType, def]) => [def.name, { objectType, def }]));

    expect(GAP_PROPERTY_NAMES).toEqual({
      companyStatus: 'yardflow_gap_status',
      companyProblemFamily: 'yardflow_gap_problem_family',
      contactLastDisposition: 'yardflow_gap_last_disposition',
      contactLastDispositionAt: 'yardflow_gap_last_disposition_at',
    });

    const status = byName.yardflow_gap_status;
    expect(status.objectType).toBe('companies');
    expect(status.def.type).toBe('enumeration');
    expect(status.def.fieldType).toBe('select');
    expect(status.def.label).toBe('YardFlow GAP Status');
    expect((status.def.options as Array<{ value: string }>).map((o) => o.value)).toEqual([
      'none',
      'hypothesis_proposed',
      'hypothesis_approved',
      'in_sequence',
      'conversation',
      'resolved_confirmed',
      'resolved_rejected',
      'nurture',
    ]);
    expect(String(status.def.description)).toMatch(/modex GAP layer/);
    expect(String(status.def.description)).toMatch(/advisory/i);

    const family = byName.yardflow_gap_problem_family;
    expect(family.objectType).toBe('companies');
    expect(family.def.label).toBe('YardFlow GAP Problem Family');
    expect((family.def.options as Array<{ value: string }>).map((o) => o.value)).toEqual([...PROBLEM_FAMILIES]);

    const disp = byName.yardflow_gap_last_disposition;
    expect(disp.objectType).toBe('contacts');
    expect(disp.def.type).toBe('enumeration');
    expect((disp.def.options as Array<{ value: string }>).map((o) => o.value)).toEqual([...RESPONSE_CLASSES]);

    const dispAt = byName.yardflow_gap_last_disposition_at;
    expect(dispAt.objectType).toBe('contacts');
    expect(dispAt.def.type).toBe('datetime');
  });

  it('skips creation for properties that already exist and tolerates a 409 on create', async () => {
    const { ensureGapProperties, __resetYardflowPropertyCache } = await import('@/lib/hubspot/properties');
    __resetYardflowPropertyCache();
    const { client, getByName, create } = fakeClient();
    getByName.mockImplementation(async (_obj: string, name: string) => {
      if (name === 'yardflow_gap_status') return { name };
      throw new Error('not found');
    });
    create.mockImplementation(async (_obj: string, def: { name: string }) => {
      if (def.name === 'yardflow_gap_problem_family') {
        throw new Error('409 Property already exists');
      }
      return {};
    });
    await expect(ensureGapProperties(client as never)).resolves.toBeUndefined();
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('does not memoize a failure, so the next call retries', async () => {
    const { ensureGapProperties, __resetYardflowPropertyCache } = await import('@/lib/hubspot/properties');
    __resetYardflowPropertyCache();
    const { client, create } = fakeClient();
    create.mockRejectedValueOnce(new Error('HubSpot 500'));
    await expect(ensureGapProperties(client as never)).rejects.toThrow('HubSpot 500');
    await expect(ensureGapProperties(client as never)).resolves.toBeUndefined();
    expect(create).toHaveBeenCalledTimes(5);
  });
});
