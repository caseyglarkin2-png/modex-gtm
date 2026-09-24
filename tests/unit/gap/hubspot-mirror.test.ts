/**
 * S1-T11: HubSpot mirror for hypothesis events.
 *
 * Every HubSpot call is stubbed through `deps`. No test here ever touches a
 * real client, and NODE_ENV=test keeps the external-write guard armed for the
 * one test that exercises it on purpose.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  dispositionMirrorKey,
  dispositionNoteBody,
  hypothesisNoteBody,
  mirrorDisposition,
  mirrorHypothesisEvent,
  mirrorKey,
  statusForAction,
  type MirrorDeps,
  type MirrorDispositionDeps,
  type MirrorDispositionInput,
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

  it('retrying a row whose note landed but whose property update failed reuses the note and never posts a second one', async () => {
    const prisma = makePrisma();
    prisma.gapHubSpotMirror.findUnique.mockResolvedValue({
      key: 'gap:hyp:hyp_1:submitted',
      error: 'PROPERTY_DOESNT_EXIST',
      note_id: 'note_77',
    });
    const deps = makeDeps();

    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);

    expect(result).toEqual({ status: 'written', noteId: 'note_77' });
    expect(deps.createCompanyNote).toHaveBeenCalledTimes(0);
    expect(deps.updateCompanyProperties).toHaveBeenCalledTimes(1);
    expect(deps.updateCompanyProperties).toHaveBeenCalledWith('901', {
      yardflow_gap_status: 'hypothesis_proposed',
      yardflow_gap_problem_family: 'hidden_capacity',
    });
    expect(prisma.gapHubSpotMirror.upsert).toHaveBeenCalledTimes(1);
    const args = prisma.gapHubSpotMirror.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ key: 'gap:hyp:hyp_1:submitted' });
    expect(args.update).toEqual({
      object_type: 'company',
      object_id: '901',
      note_id: 'note_77',
      written_at: new Date('2026-09-23T12:00:00Z'),
      error: null,
    });
  });

  it('a retry that fails again on the property update keeps the stored note id on the row', async () => {
    const prisma = makePrisma();
    prisma.gapHubSpotMirror.findUnique.mockResolvedValue({
      key: 'gap:hyp:hyp_1:submitted',
      error: 'PROPERTY_DOESNT_EXIST',
      note_id: 'note_77',
    });
    const deps = makeDeps({
      updateCompanyProperties: vi.fn().mockRejectedValue(new Error('PROPERTY_DOESNT_EXIST')),
    });

    const result = await mirrorHypothesisEvent(prisma, makeEvent(), deps);

    expect(result).toEqual({ status: 'error', reason: 'PROPERTY_DOESNT_EXIST', noteId: 'note_77' });
    expect(deps.createCompanyNote).toHaveBeenCalledTimes(0);
    expect(prisma.gapHubSpotMirror.upsert.mock.calls[0][0].update.note_id).toBe('note_77');
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

// ---------------------------------------------------------------------------
// S4-T6: contact-level mirror for dispositions.
// ---------------------------------------------------------------------------

function makeDisposition(overrides: Partial<MirrorDispositionInput> = {}): MirrorDispositionInput {
  return {
    dispositionId: 'disp_1',
    hubspotContactId: '5001',
    responseClass: 'problem_confirmed',
    confirmedAt: new Date('2026-09-23T11:30:00Z'),
    hypothesisId: 'hyp_1',
    accountName: 'Acme Foods',
    summary: 'problem_confirmed via email on "Ohio DC runs the old gate process"',
    channel: 'email',
    hypothesisTitle: 'Ohio DC runs the old gate process',
    ...overrides,
  };
}

type DispPrismaStub = {
  gapHubSpotMirror: { findUnique: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> };
  conversationDisposition: { findFirst: ReturnType<typeof vi.fn> };
};

function makeDispPrisma(
  existing: { key: string; error: string | null; note_id?: string | null } | null = null,
  newer: { id: string } | null = null,
): DispPrismaStub {
  return {
    gapHubSpotMirror: {
      findUnique: vi.fn().mockResolvedValue(existing),
      upsert: vi.fn().mockImplementation(async (args: { create: unknown }) => args.create),
    },
    conversationDisposition: { findFirst: vi.fn().mockResolvedValue(newer) },
  };
}

type MockedDispDeps = MirrorDispositionDeps & {
  createContactNote: Mock<(contactId: string, body: string) => Promise<string | null>>;
  updateContactProperties: Mock<(contactId: string, properties: Record<string, string>) => Promise<unknown>>;
  ensureGapProperties: Mock<() => Promise<void>>;
};

function makeDispDeps(overrides: Partial<MirrorDispositionDeps> = {}): MockedDispDeps {
  const defaults: MockedDispDeps = {
    createContactNote: vi.fn<(contactId: string, body: string) => Promise<string | null>>(async () => 'note_91'),
    updateContactProperties: vi.fn<(contactId: string, properties: Record<string, string>) => Promise<unknown>>(
      async () => undefined,
    ),
    ensureGapProperties: vi.fn(async () => undefined),
    syncEnabled: () => true,
    assertWriteAllowed: () => undefined,
    now: () => new Date('2026-09-23T12:00:00Z'),
  };
  return { ...defaults, ...overrides } as MockedDispDeps;
}

function hubspotCallCount(deps: MockedDispDeps): number {
  return (
    deps.ensureGapProperties.mock.calls.length +
    deps.createContactNote.mock.calls.length +
    deps.updateContactProperties.mock.calls.length
  );
}

type RecordedRow = { error: string | null; note_id: string | null };
function recordedRows(prisma: DispPrismaStub): RecordedRow[] {
  return prisma.gapHubSpotMirror.upsert.mock.calls.map((c) => (c as [{ create: RecordedRow }])[0].create);
}

describe('dispositionNoteBody', () => {
  it('carries the class, channel, account, hypothesis title, summary and the gap:disp marker; never an em dash', () => {
    const body = dispositionNoteBody({ key: 'gap:disp:disp_1', ...makeDisposition() });
    expect(body).toContain('<b>GAP · DISPOSITION PROBLEM_CONFIRMED</b> <i>(email, 2026-09-23T11:30:00.000Z)</i>');
    expect(body).toContain('<br>Account: Acme Foods');
    expect(body).toContain('<br>Hypothesis: Ohio DC runs the old gate process');
    expect(body).toContain('<br>Summary: problem_confirmed via email on &quot;Ohio DC runs the old gate process&quot;');
    expect(body).toContain('<span style="color:#888">gap:disp:disp_1</span>');
    expect(body).not.toContain('—');
  });

  it('falls back to the hypothesis id and "unknown channel", and escapes HTML', () => {
    const body = dispositionNoteBody({
      key: 'k',
      ...makeDisposition({ channel: undefined, hypothesisTitle: undefined, summary: '<b>x</b>' }),
    });
    expect(body).toContain('(unknown channel, ');
    expect(body).toContain('<br>Hypothesis: hyp_1');
    expect(body).toContain('Summary: &lt;b&gt;x&lt;/b&gt;');
  });

  it('withholds a summary or title that carries a private-intent token', () => {
    const body = dispositionNoteBody({
      key: 'k',
      ...makeDisposition({
        summary: 'problem_confirmed after they visited our demo page',
        hypothesisTitle: 'intent_score 80 on /demo/acme',
      }),
    });
    expect(body).not.toContain('visited our demo');
    expect(body).not.toContain('/demo/');
    expect(body).not.toContain('intent_score');
    expect(body).toContain('Summary: (withheld: private intent token)');
    expect(body).toContain('Hypothesis: (withheld: private intent token)');
  });

  it('has no input for the buyer raw language', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/lib/gap/hubspot-mirror.ts'), 'utf8');
    const start = src.indexOf('export function dispositionNoteBody');
    const end = src.indexOf('export async function mirrorDisposition');
    expect(start).toBeGreaterThan(0);
    expect(src.slice(start, end)).not.toMatch(/buyerLanguage|buyer_language/);
  });
});

describe('mirrorDisposition gates (in order, with call counts)', () => {
  it('GAP_OS_ENABLED off -> skipped:gap_disabled, zero prisma and zero HubSpot calls', async () => {
    delete process.env.GAP_OS_ENABLED;
    const prisma = makeDispPrisma();
    const deps = makeDispDeps();
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(result).toEqual({ status: 'skipped:gap_disabled' });
    expect(prisma.gapHubSpotMirror.findUnique).toHaveBeenCalledTimes(0);
    expect(hubspotCallCount(deps)).toBe(0);
  });

  it('GAP_HUBSPOT_MIRROR_ENABLED off -> skipped:gap_mirror_disabled with zero calls, even with sync on', async () => {
    delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
    const prisma = makeDispPrisma();
    const deps = makeDispDeps({ syncEnabled: () => true });
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(result).toEqual({ status: 'skipped:gap_mirror_disabled' });
    expect(prisma.gapHubSpotMirror.findUnique).toHaveBeenCalledTimes(0);
    expect(prisma.gapHubSpotMirror.upsert).toHaveBeenCalledTimes(0);
    expect(hubspotCallCount(deps)).toBe(0);
  });

  it('the mirror flag is checked before HUBSPOT_SYNC_ENABLED', async () => {
    process.env.GAP_HUBSPOT_MIRROR_ENABLED = 'false';
    const result = await mirrorDisposition(makeDispPrisma(), makeDisposition(), makeDispDeps({ syncEnabled: () => false }));
    expect(result.status).toBe('skipped:gap_mirror_disabled');
  });

  it('sync off -> skipped:hubspot_sync_disabled, zero calls', async () => {
    const prisma = makeDispPrisma();
    const deps = makeDispDeps({ syncEnabled: () => false });
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(result).toEqual({ status: 'skipped:hubspot_sync_disabled' });
    expect(prisma.gapHubSpotMirror.findUnique).toHaveBeenCalledTimes(0);
    expect(hubspotCallCount(deps)).toBe(0);
  });

  it('no contact id -> skipped:no_contact_id before the row lookup, zero calls', async () => {
    const prisma = makeDispPrisma();
    const deps = makeDispDeps();
    const result = await mirrorDisposition(prisma, makeDisposition({ hubspotContactId: null }), deps);
    expect(result).toEqual({ status: 'skipped:no_contact_id' });
    expect(prisma.gapHubSpotMirror.findUnique).toHaveBeenCalledTimes(0);
    expect(hubspotCallCount(deps)).toBe(0);
  });
});

describe('mirrorDisposition idempotency', () => {
  it('builds the documented key', () => {
    expect(dispositionMirrorKey('disp_1')).toBe('gap:disp:disp_1');
  });

  it('second call with an existing error-free row -> skipped:already_mirrored and ZERO HubSpot calls', async () => {
    const prisma = makeDispPrisma({ key: 'gap:disp:disp_1', error: null, note_id: 'note_old' });
    const deps = makeDispDeps();
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(result).toEqual({ status: 'skipped:already_mirrored', mirrorId: 'gap:disp:disp_1', noteId: 'note_old' });
    expect(prisma.gapHubSpotMirror.findUnique).toHaveBeenCalledWith({ where: { key: 'gap:disp:disp_1' } });
    expect(deps.ensureGapProperties).toHaveBeenCalledTimes(0);
    expect(deps.createContactNote).toHaveBeenCalledTimes(0);
    expect(deps.updateContactProperties).toHaveBeenCalledTimes(0);
    expect(prisma.gapHubSpotMirror.upsert).toHaveBeenCalledTimes(0);
  });

  it('first call writes, second call (row now present) makes zero HubSpot calls', async () => {
    const prisma = makeDispPrisma();
    const deps = makeDispDeps();
    const first = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(first.status).toBe('written');
    expect(hubspotCallCount(deps)).toBe(3);

    prisma.gapHubSpotMirror.findUnique.mockResolvedValue(recordedRows(prisma)[0]);
    const second = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(second.status).toBe('skipped:already_mirrored');
    expect(hubspotCallCount(deps)).toBe(3);
    expect(prisma.gapHubSpotMirror.upsert).toHaveBeenCalledTimes(1);
  });
});

describe('mirrorDisposition happy path', () => {
  it('ensures properties, writes one contact note with the marker, stamps class and ISO time, records a contact row', async () => {
    const prisma = makeDispPrisma();
    const deps = makeDispDeps();
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);

    expect(result).toEqual({ status: 'written', mirrorId: 'gap:disp:disp_1', noteId: 'note_91' });
    expect(deps.ensureGapProperties).toHaveBeenCalledTimes(1);
    expect(deps.createContactNote).toHaveBeenCalledTimes(1);
    const [contactId, body] = deps.createContactNote.mock.calls[0] as [string, string];
    expect(contactId).toBe('5001');
    expect(body).toContain('gap:disp:disp_1');
    expect(body).toContain('PROBLEM_CONFIRMED');
    expect(deps.updateContactProperties).toHaveBeenCalledTimes(1);
    expect(deps.updateContactProperties).toHaveBeenCalledWith('5001', {
      yardflow_gap_last_disposition: 'problem_confirmed',
      yardflow_gap_last_disposition_at: '2026-09-23T11:30:00.000Z',
    });
    expect(prisma.conversationDisposition.findFirst).toHaveBeenCalledWith({
      where: {
        hubspot_contact_id: '5001',
        human_confirmed: true,
        confirmed_at: { gt: new Date('2026-09-23T11:30:00Z') },
        id: { not: 'disp_1' },
      },
      select: { id: true },
    });
    expect(prisma.gapHubSpotMirror.upsert).toHaveBeenCalledTimes(1);
    const args = prisma.gapHubSpotMirror.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ key: 'gap:disp:disp_1' });
    expect(args.create).toEqual({
      key: 'gap:disp:disp_1',
      object_type: 'contact',
      object_id: '5001',
      note_id: 'note_91',
      written_at: new Date('2026-09-23T12:00:00Z'),
      error: null,
    });
  });

  it('writes the note before the property stamp', async () => {
    const order: string[] = [];
    const deps = makeDispDeps({
      createContactNote: vi.fn(async () => {
        order.push('note');
        return 'note_91';
      }),
      updateContactProperties: vi.fn(async () => {
        order.push('props');
      }),
    });
    await mirrorDisposition(makeDispPrisma(), makeDisposition(), deps);
    expect(order).toEqual(['note', 'props']);
  });

  it('recency guard: a newer confirmed disposition on the contact keeps the note but withholds the stamp', async () => {
    const prisma = makeDispPrisma(null, { id: 'disp_2' });
    const deps = makeDispDeps();
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(result).toEqual({
      status: 'written',
      mirrorId: 'gap:disp:disp_1',
      noteId: 'note_91',
      propertiesSkipped: 'newer_disposition_exists',
    });
    expect(deps.createContactNote).toHaveBeenCalledTimes(1);
    expect(deps.updateContactProperties).toHaveBeenCalledTimes(0);
    expect(recordedRows(prisma)[0].error).toBeNull();
  });
});

describe('mirrorDisposition failures (recorded, never thrown)', () => {
  it('null note id -> error:note_id_missing recorded, NO mirror row (error null) written, no property stamp', async () => {
    const prisma = makeDispPrisma();
    const deps = makeDispDeps({ createContactNote: vi.fn().mockResolvedValue(null) });
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(result).toEqual({ status: 'error:note_id_missing', mirrorId: 'gap:disp:disp_1', noteId: null });
    expect(deps.updateContactProperties).toHaveBeenCalledTimes(0);
    const rows = recordedRows(prisma);
    expect(rows.filter((r) => r.error === null)).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].error).toBe('note_id_missing');
    expect(rows[0].note_id).toBeNull();

    // The retry runs both halves because nothing landed.
    prisma.gapHubSpotMirror.findUnique.mockResolvedValue({ key: 'gap:disp:disp_1', error: 'note_id_missing', note_id: null });
    deps.createContactNote.mockResolvedValueOnce('note_92');
    const retry = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(retry).toEqual({ status: 'written', mirrorId: 'gap:disp:disp_1', noteId: 'note_92' });
    expect(deps.createContactNote).toHaveBeenCalledTimes(2);
    expect(deps.updateContactProperties).toHaveBeenCalledTimes(1);
  });

  it('HubSpot throwing on the property stamp -> error:<reason> with the note id kept, no throw', async () => {
    const prisma = makeDispPrisma();
    const deps = makeDispDeps({
      updateContactProperties: vi.fn().mockRejectedValue(new Error('HubSpot 429: rate limited')),
    });
    await expect(mirrorDisposition(prisma, makeDisposition(), deps)).resolves.toEqual({
      status: 'error:HubSpot 429: rate limited',
      mirrorId: 'gap:disp:disp_1',
      noteId: 'note_91',
    });
    const row = recordedRows(prisma)[0];
    expect(row.error).toBe('HubSpot 429: rate limited');
    expect(row.note_id).toBe('note_91');
  });

  it('a retry after a failed stamp reuses the recorded note id: zero new notes, one stamp, success row', async () => {
    const prisma = makeDispPrisma({ key: 'gap:disp:disp_1', error: 'HubSpot 429: rate limited', note_id: 'note_91' });
    const deps = makeDispDeps();
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(result).toEqual({ status: 'written', mirrorId: 'gap:disp:disp_1', noteId: 'note_91' });
    expect(deps.createContactNote).toHaveBeenCalledTimes(0);
    expect(deps.updateContactProperties).toHaveBeenCalledTimes(1);
    expect(prisma.gapHubSpotMirror.upsert.mock.calls[0][0].update).toEqual({
      object_type: 'contact',
      object_id: '5001',
      note_id: 'note_91',
      written_at: new Date('2026-09-23T12:00:00Z'),
      error: null,
    });
  });

  it('HubSpot throwing on the note -> error recorded with note_id null, no stamp attempted', async () => {
    const prisma = makeDispPrisma();
    const deps = makeDispDeps({ createContactNote: vi.fn().mockRejectedValue(new Error('HubSpot 500: notes down')) });
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(result.status).toBe('error:HubSpot 500: notes down');
    expect(deps.updateContactProperties).toHaveBeenCalledTimes(0);
    expect(recordedRows(prisma)[0].note_id).toBeNull();
  });

  it('the real external-write guard blocks under NODE_ENV=test with zero HubSpot calls', async () => {
    Object.assign(process.env, { NODE_ENV: 'test' });
    delete process.env.ALLOW_EXTERNAL_WRITES_IN_TEST;
    delete process.env.BLOCK_EXTERNAL_WRITES_IN_TEST;
    const prisma = makeDispPrisma();
    const deps = makeDispDeps({ assertWriteAllowed: undefined });
    const result = await mirrorDisposition(prisma, makeDisposition(), deps);
    expect(result.status).toMatch(/^error:\[external-write-guard\] blocked hubspot write in test mode: gap\.mirrorDisposition/);
    expect(hubspotCallCount(deps)).toBe(0);
  });

  it('never throws when the mirror table is unreachable', async () => {
    const prisma = {
      gapHubSpotMirror: {
        findUnique: vi.fn().mockRejectedValue(new Error('db down')),
        upsert: vi.fn().mockRejectedValue(new Error('db down')),
      },
      conversationDisposition: { findFirst: vi.fn() },
    };
    const deps = makeDispDeps();
    await expect(mirrorDisposition(prisma, makeDisposition(), deps)).resolves.toEqual({ status: 'error:db down' });
    expect(hubspotCallCount(deps)).toBe(0);
  });
});

describe('mirrorDisposition never touches pipeline stages (structural)', () => {
  it('the mirror module source contains no "deal" and no stage or lifecycle property', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/lib/gap/hubspot-mirror.ts'), 'utf8');
    expect(src.toLowerCase()).not.toContain('deal');
    expect(src).not.toMatch(/hs_pipeline|dealstage|lifecyclestage/i);
  });
});
