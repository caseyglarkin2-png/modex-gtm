import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  expireDue,
  linkSignals,
  loadSnapshot,
  proposeHypothesis,
  transitionHypothesis,
  unlinkSignal,
  updateDraftNarrative,
  type ProposeInput,
} from '@/lib/gap/hypothesis/service';

const NOW = new Date('2026-09-23T12:00:00.000Z');
const FUTURE_A = new Date('2026-10-23T12:00:00.000Z');
const FUTURE_B = new Date('2026-10-05T12:00:00.000Z');
const PAST = new Date('2026-09-01T12:00:00.000Z');
const LATER = new Date('2026-09-15T12:00:00.000Z');

/** A spy typed to accept any arguments, so `mock.calls[n][m]` is indexable under strict tsc. */
function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

/**
 * Hand-rolled prisma mock. `$transaction` invokes the callback with `tx`,
 * whose delegates are separate spies from the top-level ones, so a test can
 * assert what ran inside the transaction versus outside it.
 */
function makePrisma() {
  const tx = {
    prospectingHypothesis: { findUnique: asyncSpy(), create: asyncSpy(), update: asyncSpy(), updateMany: asyncSpy() },
    hypothesisSignal: { createMany: asyncSpy(), deleteMany: asyncSpy() },
    hypothesisEvent: { create: asyncSpy(async () => ({ id: 'evt_tx' })) },
  };
  return {
    prospectingHypothesis: {
      findUnique: asyncSpy(),
      findFirst: asyncSpy(),
      findMany: asyncSpy(),
      create: asyncSpy(),
      update: asyncSpy(),
      updateMany: asyncSpy(),
    },
    hypothesisSignal: { createMany: asyncSpy(), deleteMany: asyncSpy() },
    hypothesisEvent: { create: asyncSpy(async () => ({ id: 'evt_outside' })) },
    prospectingSignal: { findMany: asyncSpy() },
    unsubscribedEmail: { findUnique: asyncSpy() },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    tx,
  };
}

type Prisma = ReturnType<typeof makePrisma>;
type AsyncSpy = ReturnType<typeof asyncSpy>;

function proposeInput(overrides: Partial<ProposeInput> = {}): ProposeInput {
  return {
    accountName: 'Acme Logistics',
    primaryPersonaId: 7,
    persona: 'site_ops',
    problemFamily: 'hidden_capacity',
    observation: 'They opened a second DC in Ohio [S:S1]. Trailer counts doubled [S:S2].',
    problemHypothesis: 'My guess is the new DC is running gate checks on paper.',
    rootCauseHypotheses: ['Gate waiting'],
    impactHypotheses: ['Fewer turns'],
    falsificationQuestions: ['Do drivers check in at a guard shack?'],
    confidence: 60,
    signalIds: ['S1', 'S2'],
    primarySignalId: 'S1',
    createdBy: 'casey',
    ...overrides,
  };
}

/** A hypothesis row as `findUnique` with the snapshot includes returns it. */
function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'H1',
    account_name: 'Acme Logistics',
    primary_persona_id: 7,
    sequence_version_id: null,
    status: 'review_required',
    problem_family: 'hidden_capacity',
    persona: 'site_ops',
    observation: 'They opened a second DC in Ohio [S:S1]. Trailer counts doubled [S:S2].',
    problem_hypothesis: 'My guess is the new DC is running gate checks on paper.',
    falsification_questions: ['Do drivers check in at a guard shack?'],
    why_now: 'Second DC opened',
    what_a_no_means: 'Gate is already digital',
    confidence: 60,
    reviewed_by: null,
    expires_at: null,
    account: { hubspot_company_id: '9001' },
    signals: [
      {
        signal_id: 'S1',
        role: 'primary',
        signal: {
          id: 'S1',
          title: 'New Ohio DC',
          evidence_url: 'https://x/a',
          evidence_text: null,
          freshness_expires_at: FUTURE_A,
        },
      },
      {
        signal_id: 'S2',
        role: 'supporting',
        signal: {
          id: 'S2',
          title: 'Trailer count doubled',
          evidence_url: null,
          evidence_text: 'seen on site',
          freshness_expires_at: FUTURE_B,
        },
      },
    ],
    primary_persona: { do_not_contact: false, email: 'Ops@Acme.com' },
    sequence_version: null,
    dispositions: [],
    ...overrides,
  };
}

/**
 * Simulates the optimistic status check at the database: the row is in
 * `dbStatus`, so an updateMany that carries a `status` predicate matches only
 * when the predicate equals `dbStatus`, and an updateMany with no predicate
 * matches unconditionally.
 */
function updateManyAgainst(dbStatus: string) {
  return async (args: { where: { status?: string } }) => ({
    count: args.where.status === undefined || args.where.status === dbStatus ? 1 : 0,
  });
}

describe('proposeHypothesis', () => {
  let prisma: Prisma;
  beforeEach(() => {
    prisma = makePrisma();
    prisma.prospectingSignal.findMany.mockImplementation(async (args: { where: { id: { in: string[] } } }) =>
      args.where.id.in.filter((id) => id === 'S1' || id === 'S2').map((id) => ({ id })),
    );
    prisma.prospectingHypothesis.findFirst.mockResolvedValue(null);
    prisma.tx.prospectingHypothesis.create.mockResolvedValue({ id: 'H_new' });
    prisma.tx.hypothesisSignal.createMany.mockResolvedValue({ count: 2 });
  });

  it('refuses with no_signals and writes nothing when an observation is given with empty signalIds', async () => {
    const out = await proposeHypothesis(prisma, proposeInput({ signalIds: [], primarySignalId: null }));
    expect(out).toEqual({ ok: false, reason: 'no_signals' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.prospectingSignal.findMany).not.toHaveBeenCalled();
  });

  it('accepts an empty observation with empty signalIds as a draft that needs facts: needsObservation metadata, zero join rows', async () => {
    const out = await proposeHypothesis(
      prisma,
      proposeInput({ observation: '', signalIds: [], primarySignalId: null, metadata: { source: 'pic' } }),
    );
    expect(out).toEqual({ ok: true, id: 'H_new', status: 'draft' });
    expect(prisma.prospectingSignal.findMany).not.toHaveBeenCalled();

    const create = prisma.tx.prospectingHypothesis.create.mock.calls[0][0];
    expect(create.data.status).toBe('draft');
    expect(create.data.observation).toBe('');
    expect(create.data.metadata).toEqual({ source: 'pic', needsObservation: true });
    expect(prisma.tx.hypothesisSignal.createMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create.mock.calls[0][0].data).toMatchObject({
      hypothesis_id: 'H_new',
      from_status: null,
      to_status: 'draft',
      action: 'propose',
    });
  });

  it('accepts linked signals with an empty observation (facts linked, prose not yet written)', async () => {
    const out = await proposeHypothesis(prisma, proposeInput({ observation: '' }));
    expect(out).toEqual({ ok: true, id: 'H_new', status: 'draft' });
    expect(prisma.prospectingSignal.findMany).toHaveBeenCalledTimes(1);

    const create = prisma.tx.prospectingHypothesis.create.mock.calls[0][0];
    expect(create.data.observation).toBe('');
    expect(create.data.metadata).toEqual({ needsObservation: true });
    expect(prisma.tx.hypothesisSignal.createMany.mock.calls[0][0].data).toHaveLength(2);
  });

  it('does not flag needsObservation when the observation is present', async () => {
    await proposeHypothesis(prisma, proposeInput({ metadata: { source: 'pic' } }));
    const create = prisma.tx.prospectingHypothesis.create.mock.calls[0][0];
    expect(create.data.metadata).toEqual({ source: 'pic' });
  });

  it('names the unknown signal id', async () => {
    const out = await proposeHypothesis(prisma, proposeInput({ signalIds: ['S1', 'S9'] }));
    expect(out).toEqual({ ok: false, reason: 'unknown_signal:S9' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("passes the observation validator's reason through (uncited_sentence)", async () => {
    const out = await proposeHypothesis(
      prisma,
      proposeInput({ observation: 'They opened a second DC in Ohio [S:S1]. Trailer counts doubled.' }),
    );
    expect(out).toEqual({ ok: false, reason: 'uncited_sentence' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuses an out-of-range confidence', async () => {
    const out = await proposeHypothesis(prisma, proposeInput({ confidence: 101 }));
    expect(out).toEqual({ ok: false, reason: 'bad_confidence' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns duplicate_source_ref with the existing id and zero creates', async () => {
    prisma.prospectingHypothesis.findFirst.mockResolvedValue({ id: 'H_existing' });
    const out = await proposeHypothesis(prisma, proposeInput({ sourceRef: 'pic:acme#3' }));
    expect(out).toEqual({ ok: false, reason: 'duplicate_source_ref', existingId: 'H_existing' });
    expect(prisma.prospectingHypothesis.findFirst).toHaveBeenCalledWith({
      where: { source_ref: 'pic:acme#3' },
      select: { id: true },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.tx.prospectingHypothesis.create).not.toHaveBeenCalled();
    expect(prisma.prospectingHypothesis.create).not.toHaveBeenCalled();
  });

  it('happy path: draft row, N join rows with the primary role on the right id, one event inside tx', async () => {
    const out = await proposeHypothesis(prisma, proposeInput({ sourceRef: 'pic:acme#3' }));
    expect(out).toEqual({ ok: true, id: 'H_new', status: 'draft' });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const create = prisma.tx.prospectingHypothesis.create.mock.calls[0][0];
    expect(create.data.status).toBe('draft');
    expect(create.data.account_name).toBe('Acme Logistics');
    expect(create.data.primary_persona_id).toBe(7);
    expect(create.data.problem_family).toBe('hidden_capacity');
    expect(create.data.persona).toBe('site_ops');
    expect(create.data.confidence).toBe(60);
    expect(create.data.source_ref).toBe('pic:acme#3');
    expect(create.data.created_by).toBe('casey');
    expect(create.data.root_cause_hypotheses).toEqual(['Gate waiting']);
    expect(create.data.falsification_questions).toEqual(['Do drivers check in at a guard shack?']);

    const joins = prisma.tx.hypothesisSignal.createMany.mock.calls[0][0].data;
    expect(joins).toHaveLength(2);
    expect(joins).toEqual(
      expect.arrayContaining([
        { hypothesis_id: 'H_new', signal_id: 'S1', role: 'primary', linked_by: 'casey' },
        { hypothesis_id: 'H_new', signal_id: 'S2', role: 'supporting', linked_by: 'casey' },
      ]),
    );

    expect(prisma.tx.hypothesisEvent.create).toHaveBeenCalledTimes(1);
    const event = prisma.tx.hypothesisEvent.create.mock.calls[0][0].data;
    expect(event).toMatchObject({
      hypothesis_id: 'H_new',
      from_status: null,
      to_status: 'draft',
      action: 'propose',
      actor: 'casey',
    });
    expect(prisma.hypothesisEvent.create).not.toHaveBeenCalled();
  });
});

describe('loadSnapshot', () => {
  it('maps the row, join, persona, version and dispositions into the machine snapshot', async () => {
    const prisma = makePrisma();
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(
      row({
        status: 'approved',
        reviewed_by: 'casey',
        primary_persona: { do_not_contact: false, email: 'Ops@Acme.com' },
        sequence_version: { status: 'frozen', steps: [{ productProofAllowed: true }] },
        dispositions: [{ id: 'D1', response_class: 'problem_confirmed', created_at: PAST }],
      }),
    );
    prisma.unsubscribedEmail.findUnique.mockResolvedValue({ id: 'u1' });

    const snap = await loadSnapshot(prisma, 'H1');
    expect(snap).not.toBeNull();
    expect(snap).toMatchObject({
      id: 'H1',
      accountName: 'Acme Logistics',
      hubspotCompanyId: '9001',
      primaryPersonaId: 7,
      sequenceVersionId: null,
      whyNow: 'Second DC opened',
      whatANoMeans: 'Gate is already digital',
      confidence: 60,
      status: 'approved',
      reviewedBy: 'casey',
      personaSuppressed: true,
      version: { status: 'frozen', firstTouchProductProof: true },
      linkedSignals: [
        { id: 'S1', hasEvidence: true, expiresAt: FUTURE_A, title: 'New Ohio DC', evidenceUrl: 'https://x/a' },
        { id: 'S2', hasEvidence: true, expiresAt: FUTURE_B, title: 'Trailer count doubled', evidenceUrl: null },
      ],
      confirmedDispositions: [{ id: 'D1', responseClass: 'problem_confirmed', createdAt: PAST }],
    });
    expect(prisma.unsubscribedEmail.findUnique).toHaveBeenCalledWith({
      where: { email: 'ops@acme.com' },
      select: { id: true },
    });
    const query = prisma.prospectingHypothesis.findUnique.mock.calls[0][0];
    expect(query.where).toEqual({ id: 'H1' });
    expect(query.include.dispositions).toEqual({
      where: { human_confirmed: true },
      select: { id: true, response_class: true, created_at: true },
    });
    expect(query.include.account).toEqual({ select: { hubspot_company_id: true } });
    expect(query.include.signals.include.signal.select.title).toBe(true);
  });

  it('returns null for a missing row and skips the unsubscribe lookup without a persona email', async () => {
    const prisma = makePrisma();
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(null);
    expect(await loadSnapshot(prisma, 'nope')).toBeNull();

    prisma.prospectingHypothesis.findUnique.mockResolvedValue(row({ primary_persona: { do_not_contact: true, email: null } }));
    const snap = await loadSnapshot(prisma, 'H1');
    expect(snap?.personaSuppressed).toBe(true);
    expect(prisma.unsubscribedEmail.findUnique).not.toHaveBeenCalled();
  });
});

describe('transitionHypothesis', () => {
  let prisma: Prisma;
  let auditSpy: AsyncSpy;
  let mirrorSpy: AsyncSpy;
  let deps: { audit: AsyncSpy; mirror: AsyncSpy };
  beforeEach(() => {
    prisma = makePrisma();
    prisma.unsubscribedEmail.findUnique.mockResolvedValue(null);
    auditSpy = asyncSpy(async () => ({ stored: true, reviewQueued: true }));
    mirrorSpy = asyncSpy(async () => ({ ok: true }));
    deps = { audit: auditSpy, mirror: mirrorSpy };
  });

  it('not_found when the row is missing', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(null);
    const out = await transitionHypothesis(prisma, 'nope', 'approve', { now: NOW, actor: 'casey' });
    expect(out).toEqual({ ok: false, reason: 'not_found' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('passes a machine refusal through unchanged with zero writes', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(row({ status: 'draft' }));
    const out = await transitionHypothesis(prisma, 'H1', 'approve', { now: NOW, actor: 'casey' }, deps);
    expect(out).toEqual({ ok: false, reason: 'ILLEGAL_TRANSITION:draft->approve' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.tx.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
    expect(auditSpy).not.toHaveBeenCalled();
    expect(mirrorSpy).not.toHaveBeenCalled();
  });

  it('approve: optimistic updateMany on the from status, event inside tx, audit after commit', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(row({ status: 'review_required' }));
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('review_required'));

    const out = await transitionHypothesis(prisma, 'H1', 'approve', { now: NOW, actor: 'casey' }, deps);
    expect(out).toEqual({ ok: true, from: 'review_required', to: 'approved', effects: ['set_reviewed'] });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.tx.prospectingHypothesis.updateMany).toHaveBeenCalledWith({
      where: { id: 'H1', status: 'review_required' },
      data: { status: 'approved', reviewed_by: 'casey', reviewed_at: NOW },
    });
    expect(prisma.prospectingHypothesis.updateMany).not.toHaveBeenCalled();

    expect(prisma.tx.hypothesisEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.tx.hypothesisEvent.create.mock.calls[0][0].data).toMatchObject({
      hypothesis_id: 'H1',
      from_status: 'review_required',
      to_status: 'approved',
      action: 'approve',
      actor: 'casey',
      payload: { effects: ['set_reviewed'] },
    });
    expect(prisma.hypothesisEvent.create).not.toHaveBeenCalled();

    expect(auditSpy).toHaveBeenCalledTimes(1);
    const [auditPrisma, auditInput] = auditSpy.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(auditPrisma).toBe(prisma);
    expect(auditInput).toMatchObject({
      kind: 'hypothesis.approved',
      actor: 'casey',
      subjectType: 'hypothesis',
      subjectId: 'H1',
      payload: { from: 'review_required', to: 'approved', effects: ['set_reviewed'] },
      review: { target: 'Acme Logistics', title: 'approve hidden_capacity', intent: 'approve' },
    });

    expect(mirrorSpy).toHaveBeenCalledTimes(1);
    const [mirrorPrisma, mirrorEvent] = mirrorSpy.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(mirrorPrisma).toBe(prisma);
    expect(mirrorEvent).toEqual({
      hypothesisId: 'H1',
      action: 'approved',
      hypothesis: {
        accountName: 'Acme Logistics',
        hubspotCompanyId: '9001',
        problemFamily: 'hidden_capacity',
        observation: 'They opened a second DC in Ohio [S:S1]. Trailer counts doubled [S:S2].',
        problemHypothesis: 'My guess is the new DC is running gate checks on paper.',
        whyNow: 'Second DC opened',
        falsificationQuestions: ['Do drivers check in at a guard shack?'],
        whatANoMeans: 'Gate is already digital',
        confidence: 60,
        status: 'approved',
      },
      evidence: [
        { id: 'S1', title: 'New Ohio DC', url: 'https://x/a' },
        { id: 'S2', title: 'Trailer count doubled', url: null },
      ],
    });
  });

  it('reject_review is audited but never mirrored', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(row({ status: 'review_required' }));
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('review_required'));

    const out = await transitionHypothesis(
      prisma,
      'H1',
      'reject_review',
      { now: NOW, actor: 'casey', reason: 'observation too thin' },
      deps,
    );
    expect(out).toEqual({ ok: true, from: 'review_required', to: 'draft', effects: [] });
    expect(auditSpy.mock.calls[0][1]).toMatchObject({ kind: 'hypothesis.review_rejected' });
    expect(mirrorSpy).not.toHaveBeenCalled();
  });

  it('a rejecting mirror never fails the transition', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(row({ status: 'review_required' }));
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('review_required'));
    mirrorSpy.mockRejectedValue(new Error('hubspot 500'));

    const out = await transitionHypothesis(prisma, 'H1', 'approve', { now: NOW, actor: 'casey' }, deps);
    expect(out).toEqual({ ok: true, from: 'review_required', to: 'approved', effects: ['set_reviewed'] });
    expect(mirrorSpy).toHaveBeenCalledTimes(1);
    // Let the swallowed rejection settle so vitest sees no unhandled rejection.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('a mirror that throws synchronously never fails the transition', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(row({ status: 'draft' }));
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('draft'));
    mirrorSpy.mockImplementation(() => {
      throw new Error('bad delegate');
    });

    const out = await transitionHypothesis(prisma, 'H1', 'submit', { now: NOW, actor: 'casey' }, deps);
    expect(out).toEqual({ ok: true, from: 'draft', to: 'review_required', effects: [] });
    expect(mirrorSpy.mock.calls[0][1]).toMatchObject({ action: 'submitted', hypothesis: { status: 'review_required' } });
  });

  it('stale_status: the row moved under us, so updateMany matches nothing and no event is written', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(row({ status: 'review_required' }));
    // A concurrent approver already moved the row to approved.
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('approved'));

    const out = await transitionHypothesis(prisma, 'H1', 'approve', { now: NOW, actor: 'casey' }, deps);
    expect(out).toEqual({ ok: false, reason: 'stale_status' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
    expect(prisma.hypothesisEvent.create).not.toHaveBeenCalled();
    expect(auditSpy).not.toHaveBeenCalled();
  });

  it('approve refuses no_evidence when no linked signal carries a url or text', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(
      row({
        status: 'review_required',
        observation: 'They opened a second DC in Ohio [S:S1].',
        signals: [
          {
            signal_id: 'S1',
            role: 'primary',
            signal: { id: 'S1', title: 'Bare', evidence_url: null, evidence_text: null, freshness_expires_at: FUTURE_A },
          },
        ],
      }),
    );
    // A permissive DB so a wrongly-passing guard would surface as the wrong result, not a mock crash.
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('review_required'));
    const out = await transitionHypothesis(prisma, 'H1', 'approve', { now: NOW, actor: 'casey' }, deps);
    expect(out).toEqual({ ok: false, reason: 'no_evidence' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(auditSpy).not.toHaveBeenCalled();
  });

  it('approve succeeds when the only evidence is evidence_text', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(
      row({
        status: 'review_required',
        observation: 'They opened a second DC in Ohio [S:S1].',
        signals: [
          {
            signal_id: 'S1',
            role: 'primary',
            signal: {
              id: 'S1',
              title: 'Text only',
              evidence_url: null,
              evidence_text: 'operator said so on the call',
              freshness_expires_at: FUTURE_A,
            },
          },
        ],
      }),
    );
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('review_required'));
    const out = await transitionHypothesis(prisma, 'H1', 'approve', { now: NOW, actor: 'casey' }, deps);
    expect(out).toEqual({ ok: true, from: 'review_required', to: 'approved', effects: ['set_reviewed'] });
  });

  it('activate sets activated_at and expires_at to the earliest signal expiry', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(row({ status: 'approved', reviewed_by: 'casey' }));
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('approved'));

    const out = await transitionHypothesis(prisma, 'H1', 'activate', { now: NOW, actor: 'casey' }, deps);
    expect(out).toEqual({
      ok: true,
      from: 'approved',
      to: 'active',
      effects: ['set_activated', 'freeze_narrative', 'set_expires_at'],
    });
    expect(prisma.tx.prospectingHypothesis.updateMany).toHaveBeenCalledWith({
      where: { id: 'H1', status: 'approved' },
      data: { status: 'active', activated_at: NOW, expires_at: FUTURE_B },
    });
    expect(auditSpy.mock.calls[0][1]).toMatchObject({ kind: 'hypothesis.activated' });
  });

  it('resolve: target from the newest confirmed disposition, resolution cites the problem_* dispositions newest first', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(
      row({
        status: 'active',
        reviewed_by: 'casey',
        dispositions: [
          { id: 'D1', response_class: 'problem_confirmed', created_at: PAST },
          { id: 'D3', response_class: 'request_information', created_at: LATER },
          { id: 'D2', response_class: 'problem_partially_confirmed', created_at: LATER },
        ],
      }),
    );
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('active'));

    const out = await transitionHypothesis(
      prisma,
      'H1',
      'resolve',
      { now: NOW, actor: 'casey', outcome: 'partially_confirmed', reason: 'half the yards' },
      deps,
    );
    expect(out).toEqual({
      ok: true,
      from: 'active',
      to: 'partially_confirmed',
      effects: [
        'set_resolved',
        'stop_enrollments:hypothesis_resolved',
        `resolved_by_disposition:${LATER.toISOString()}`,
      ],
    });
    expect(prisma.tx.prospectingHypothesis.updateMany).toHaveBeenCalledWith({
      where: { id: 'H1', status: 'active' },
      data: {
        status: 'partially_confirmed',
        resolved_at: NOW,
        resolved_by: 'casey',
        resolution: {
          problem: 'partial',
          rootCause: 'unknown',
          impact: 'unknown',
          notes: 'half the yards',
          dispositionIds: ['D2', 'D1'],
          bidIds: [],
        },
      },
    });
    expect(auditSpy.mock.calls[0][1]).toMatchObject({
      kind: 'hypothesis.resolved',
      review: { intent: 'half the yards' },
    });
  });

  it('resolve without ctx.outcome derives confirmed from a lone problem_confirmed disposition', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(
      row({
        status: 'active',
        reviewed_by: 'casey',
        dispositions: [{ id: 'D1', response_class: 'problem_confirmed', created_at: PAST }],
      }),
    );
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('active'));

    const out = await transitionHypothesis(prisma, 'H1', 'resolve', { now: NOW, actor: 'casey' }, deps);
    expect(out).toMatchObject({ ok: true, to: 'confirmed' });
    const data = prisma.tx.prospectingHypothesis.updateMany.mock.calls[0][0].data;
    expect(data.status).toBe('confirmed');
    expect(data.resolution).toMatchObject({ problem: 'confirmed', dispositionIds: ['D1'], notes: null });
  });

  it('resolve with a mismatching ctx.outcome passes the machine refusal through with zero writes', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(
      row({
        status: 'active',
        reviewed_by: 'casey',
        dispositions: [{ id: 'D1', response_class: 'problem_rejected', created_at: PAST }],
      }),
    );
    const out = await transitionHypothesis(
      prisma,
      'H1',
      'resolve',
      { now: NOW, actor: 'casey', outcome: 'confirmed' },
      deps,
    );
    expect(out).toEqual({ ok: false, reason: 'outcome_mismatch:rejected' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('withdraw stamps resolved_at and resolved_by without a resolution JSON', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(row({ status: 'draft' }));
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(updateManyAgainst('draft'));

    const out = await transitionHypothesis(
      prisma,
      'H1',
      'withdraw',
      { now: NOW, actor: 'casey', reason: 'wrong account' },
      deps,
    );
    expect(out).toEqual({ ok: true, from: 'draft', to: 'rejected', effects: [] });
    expect(prisma.tx.prospectingHypothesis.updateMany).toHaveBeenCalledWith({
      where: { id: 'H1', status: 'draft' },
      data: { status: 'rejected', resolved_at: NOW, resolved_by: 'casey' },
    });
    expect(auditSpy.mock.calls[0][1]).toMatchObject({ kind: 'hypothesis.withdrawn' });
  });
});

describe('updateDraftNarrative', () => {
  let prisma: Prisma;
  /** The narrative row as the in-transaction findUnique returns it. */
  function narrativeRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'H1',
      status: 'draft',
      problem_family: 'hidden_capacity',
      secondary_families: [],
      persona: 'site_ops',
      observation: 'They opened a second DC in Ohio [S:S1]. Trailer counts doubled [S:S2].',
      problem_hypothesis: 'My guess is the new DC is running gate checks on paper.',
      root_cause_hypotheses: ['Gate waiting'],
      impact_hypotheses: ['Fewer turns'],
      why_now: null,
      falsification_questions: ['Do drivers check in at a guard shack?'],
      what_a_no_means: null,
      contrary_evidence: null,
      predicted_buyer_language: null,
      buying_center: null,
      confidence: 60,
      signals: [
        { signal_id: 'S1', role: 'primary' },
        { signal_id: 'S2', role: 'supporting' },
      ],
      ...overrides,
    };
  }
  beforeEach(() => {
    prisma = makePrisma();
    prisma.prospectingSignal.findMany.mockImplementation(async (args: { where: { id: { in: string[] } } }) =>
      args.where.id.in.filter((id) => id === 'S1' || id === 'S2' || id === 'S3').map((id) => ({ id })),
    );
    prisma.tx.hypothesisSignal.deleteMany.mockResolvedValue({ count: 2 });
    prisma.tx.hypothesisSignal.createMany.mockResolvedValue({ count: 1 });
  });

  it('narrative_frozen on an active row: read inside tx, zero writes', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(narrativeRow({ status: 'active' }));
    const out = await updateDraftNarrative(prisma, 'H1', { whyNow: 'new DC' }, 'casey');
    expect(out).toEqual({ ok: false, reason: 'narrative_frozen' });
    expect(prisma.tx.prospectingHypothesis.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.prospectingHypothesis.findUnique).not.toHaveBeenCalled();
    expect(prisma.tx.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisSignal.deleteMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('narrative_frozen when a patch races an approve: the status-in predicate matches nothing and nothing else runs', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(narrativeRow({ status: 'review_required' }));
    // Between the read and the write a reviewer approved the row.
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(
      async (args: { where: { status?: { in: string[] } } }) => ({
        count: args.where.status === undefined || args.where.status.in.includes('approved') ? 1 : 0,
      }),
    );
    const out = await updateDraftNarrative(
      prisma,
      'H1',
      { whyNow: 'new DC', signalIds: ['S3'], observation: 'Trailer counts doubled [S:S3].' },
      'casey',
    );
    expect(out).toEqual({ ok: false, reason: 'narrative_frozen' });
    expect(prisma.tx.prospectingHypothesis.updateMany).toHaveBeenCalledWith({
      where: { id: 'H1', status: { in: ['draft', 'review_required'] } },
      data: { why_now: 'new DC', observation: 'Trailer counts doubled [S:S3].' },
    });
    expect(prisma.tx.hypothesisSignal.deleteMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisSignal.createMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('fails closed with the validator reason when the new observation cites an unlinked signal', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(narrativeRow({ status: 'draft' }));
    const out = await updateDraftNarrative(
      prisma,
      'H1',
      { observation: 'Trailer counts doubled [S:S3].' },
      'casey',
    );
    expect(out).toEqual({ ok: false, reason: 'unlinked_citation' });
    expect(prisma.tx.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('happy path: optimistic updateMany, join rows replaced after the count check, edit event carries before/after', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(narrativeRow({ status: 'review_required' }));
    prisma.tx.prospectingHypothesis.updateMany.mockResolvedValue({ count: 1 });
    const out = await updateDraftNarrative(
      prisma,
      'H1',
      {
        observation: 'Trailer counts doubled [S:S3].',
        signalIds: ['S3'],
        primarySignalId: 'S3',
        whyNow: 'new DC',
        confidence: 60,
      },
      'casey',
    );
    expect(out).toEqual({ ok: true, id: 'H1', status: 'review_required' });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.tx.prospectingHypothesis.updateMany).toHaveBeenCalledWith({
      where: { id: 'H1', status: { in: ['draft', 'review_required'] } },
      data: { observation: 'Trailer counts doubled [S:S3].', why_now: 'new DC', confidence: 60 },
    });
    expect(prisma.tx.prospectingHypothesis.update).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisSignal.deleteMany).toHaveBeenCalledWith({ where: { hypothesis_id: 'H1' } });
    expect(prisma.tx.hypothesisSignal.createMany).toHaveBeenCalledWith({
      data: [{ hypothesis_id: 'H1', signal_id: 'S3', role: 'primary', linked_by: 'casey' }],
    });
    // Order inside the transaction: count check before the join replacement.
    const updateOrder = prisma.tx.prospectingHypothesis.updateMany.mock.invocationCallOrder[0];
    const deleteOrder = prisma.tx.hypothesisSignal.deleteMany.mock.invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(deleteOrder);

    expect(prisma.tx.hypothesisEvent.create.mock.calls[0][0].data).toEqual({
      hypothesis_id: 'H1',
      from_status: 'review_required',
      to_status: 'review_required',
      action: 'edit',
      actor: 'casey',
      reason: null,
      payload: {
        fields: ['observation', 'signalIds', 'primarySignalId', 'whyNow', 'confidence'],
        // confidence 60 -> 60 is unchanged, so it has no before/after entry.
        changes: {
          observation: {
            before: 'They opened a second DC in Ohio [S:S1]. Trailer counts doubled [S:S2].',
            after: 'Trailer counts doubled [S:S3].',
          },
          whyNow: { before: null, after: 'new DC' },
          signalIds: { before: ['S1', 'S2'], after: ['S3'] },
          primarySignalId: { before: 'S1', after: 'S3' },
        },
      },
    });
    expect(prisma.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('empty_patch and bad_confidence refuse before any read', async () => {
    expect(await updateDraftNarrative(prisma, 'H1', {}, 'casey')).toEqual({ ok: false, reason: 'empty_patch' });
    expect(await updateDraftNarrative(prisma, 'H1', { confidence: 140 }, 'casey')).toEqual({
      ok: false,
      reason: 'bad_confidence',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('linkSignals', () => {
  let prisma: Prisma;
  /** The link row as the in-transaction findUnique returns it. */
  function linkRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'H1',
      status: 'draft',
      observation: 'They opened a second DC in Ohio [S:S1].',
      signals: [{ signal_id: 'S1', role: 'primary' }],
      ...overrides,
    };
  }
  beforeEach(() => {
    prisma = makePrisma();
    prisma.prospectingSignal.findMany.mockImplementation(async (args: { where: { id: { in: string[] } } }) =>
      args.where.id.in.filter((id) => ['S1', 'S2', 'S3'].includes(id)).map((id) => ({ id })),
    );
    prisma.tx.prospectingHypothesis.updateMany.mockResolvedValue({ count: 1 });
    prisma.tx.hypothesisSignal.createMany.mockResolvedValue({ count: 1 });
  });

  it('no_signals on an empty list and unknown_signal:<id> before any transaction', async () => {
    expect(await linkSignals(prisma, 'H1', [], 'casey')).toEqual({ ok: false, reason: 'no_signals' });
    expect(await linkSignals(prisma, 'H1', ['S2', 'S9'], 'casey')).toEqual({ ok: false, reason: 'unknown_signal:S9' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('narrative_frozen on an active row: read inside tx, zero writes', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(linkRow({ status: 'active' }));
    const out = await linkSignals(prisma, 'H1', ['S2'], 'casey');
    expect(out).toEqual({ ok: false, reason: 'narrative_frozen' });
    expect(prisma.tx.prospectingHypothesis.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.tx.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisSignal.createMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('narrative_frozen when the link races an approve: the status-in predicate matches nothing, no join rows, no event', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(linkRow({ status: 'review_required' }));
    prisma.tx.prospectingHypothesis.updateMany.mockResolvedValue({ count: 0 });
    const out = await linkSignals(prisma, 'H1', ['S2'], 'casey');
    expect(out).toEqual({ ok: false, reason: 'narrative_frozen' });
    expect(prisma.tx.prospectingHypothesis.updateMany).toHaveBeenCalledWith({
      where: { id: 'H1', status: { in: ['draft', 'review_required'] } },
      data: {},
    });
    expect(prisma.tx.hypothesisSignal.createMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('not_found when the row is missing', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(null);
    expect(await linkSignals(prisma, 'H1', ['S2'], 'casey')).toEqual({ ok: false, reason: 'not_found' });
    expect(prisma.tx.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
  });

  it('idempotent relink: an already-linked id is reported in `already`, nothing is written', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(linkRow());
    const out = await linkSignals(prisma, 'H1', ['S1', 'S1'], 'casey');
    expect(out).toEqual({ ok: true, id: 'H1', status: 'draft', linked: [], already: ['S1'] });
    expect(prisma.tx.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisSignal.createMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('happy path: only the new ids become supporting join rows after the count check; the edit event carries before/after', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(linkRow({ status: 'review_required' }));
    const out = await linkSignals(prisma, 'H1', ['S1', 'S2', 'S3', 'S2'], 'casey');
    expect(out).toEqual({ ok: true, id: 'H1', status: 'review_required', linked: ['S2', 'S3'], already: ['S1'] });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.tx.hypothesisSignal.createMany).toHaveBeenCalledWith({
      data: [
        { hypothesis_id: 'H1', signal_id: 'S2', role: 'supporting', linked_by: 'casey' },
        { hypothesis_id: 'H1', signal_id: 'S3', role: 'supporting', linked_by: 'casey' },
      ],
    });
    expect(prisma.tx.hypothesisSignal.deleteMany).not.toHaveBeenCalled();
    const updateOrder = prisma.tx.prospectingHypothesis.updateMany.mock.invocationCallOrder[0];
    const createOrder = prisma.tx.hypothesisSignal.createMany.mock.invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(createOrder);

    expect(prisma.tx.hypothesisEvent.create.mock.calls[0][0].data).toEqual({
      hypothesis_id: 'H1',
      from_status: 'review_required',
      to_status: 'review_required',
      action: 'edit',
      actor: 'casey',
      reason: null,
      payload: {
        fields: ['signalIds'],
        changes: { signalIds: { before: ['S1'], after: ['S1', 'S2', 'S3'] } },
      },
    });
    expect(prisma.hypothesisEvent.create).not.toHaveBeenCalled();
  });
});

describe('unlinkSignal', () => {
  let prisma: Prisma;
  function linkRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'H1',
      status: 'draft',
      observation: 'They opened a second DC in Ohio [S:S1]. Trailer counts doubled [S:S2].',
      signals: [
        { signal_id: 'S1', role: 'primary' },
        { signal_id: 'S2', role: 'supporting' },
      ],
      ...overrides,
    };
  }
  beforeEach(() => {
    prisma = makePrisma();
    prisma.tx.prospectingHypothesis.updateMany.mockResolvedValue({ count: 1 });
    prisma.tx.hypothesisSignal.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('narrative_frozen on an approved row: zero writes', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(linkRow({ status: 'approved' }));
    const out = await unlinkSignal(prisma, 'H1', 'S2', 'casey');
    expect(out).toEqual({ ok: false, reason: 'narrative_frozen' });
    expect(prisma.tx.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisSignal.deleteMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('not_linked when the id is not on the row, with zero writes', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(linkRow());
    expect(await unlinkSignal(prisma, 'H1', 'S9', 'casey')).toEqual({ ok: false, reason: 'not_linked' });
    expect(prisma.tx.hypothesisSignal.deleteMany).not.toHaveBeenCalled();
  });

  it('unlinked_citation when the observation still cites the signal: the post-unlink set is what the validator sees, zero writes', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(linkRow());
    const out = await unlinkSignal(prisma, 'H1', 'S2', 'casey');
    expect(out).toEqual({ ok: false, reason: 'unlinked_citation' });
    expect(prisma.tx.prospectingHypothesis.updateMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisSignal.deleteMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('unlinking the last signal refuses unlinked_citation while the observation cites it, and succeeds once the observation is empty', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(
      linkRow({ observation: 'Only fact [S:S1].', signals: [{ signal_id: 'S1', role: 'primary' }] }),
    );
    expect(await unlinkSignal(prisma, 'H1', 'S1', 'casey')).toEqual({ ok: false, reason: 'unlinked_citation' });
    expect(prisma.tx.hypothesisSignal.deleteMany).not.toHaveBeenCalled();

    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(
      linkRow({ observation: '', signals: [{ signal_id: 'S1', role: 'primary' }] }),
    );
    expect(await unlinkSignal(prisma, 'H1', 'S1', 'casey')).toEqual({ ok: true, id: 'H1', status: 'draft', unlinked: 'S1' });
    expect(prisma.tx.hypothesisSignal.deleteMany).toHaveBeenCalledWith({ where: { hypothesis_id: 'H1', signal_id: 'S1' } });
  });

  it('narrative_frozen when the unlink races an approve: status-in predicate matches nothing, no delete, no event', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(
      linkRow({ status: 'review_required', observation: 'They opened a second DC in Ohio [S:S1].' }),
    );
    prisma.tx.prospectingHypothesis.updateMany.mockResolvedValue({ count: 0 });
    const out = await unlinkSignal(prisma, 'H1', 'S2', 'casey');
    expect(out).toEqual({ ok: false, reason: 'narrative_frozen' });
    expect(prisma.tx.prospectingHypothesis.updateMany).toHaveBeenCalledWith({
      where: { id: 'H1', status: { in: ['draft', 'review_required'] } },
      data: {},
    });
    expect(prisma.tx.hypothesisSignal.deleteMany).not.toHaveBeenCalled();
    expect(prisma.tx.hypothesisEvent.create).not.toHaveBeenCalled();
  });

  it('happy path: an uncited signal is removed after the count check; the edit event carries before/after', async () => {
    prisma.tx.prospectingHypothesis.findUnique.mockResolvedValue(
      linkRow({ status: 'review_required', observation: 'They opened a second DC in Ohio [S:S1].' }),
    );
    const out = await unlinkSignal(prisma, 'H1', 'S2', 'casey');
    expect(out).toEqual({ ok: true, id: 'H1', status: 'review_required', unlinked: 'S2' });
    expect(prisma.tx.hypothesisSignal.deleteMany).toHaveBeenCalledWith({ where: { hypothesis_id: 'H1', signal_id: 'S2' } });
    const updateOrder = prisma.tx.prospectingHypothesis.updateMany.mock.invocationCallOrder[0];
    const deleteOrder = prisma.tx.hypothesisSignal.deleteMany.mock.invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(deleteOrder);
    expect(prisma.tx.hypothesisEvent.create.mock.calls[0][0].data).toEqual({
      hypothesis_id: 'H1',
      from_status: 'review_required',
      to_status: 'review_required',
      action: 'edit',
      actor: 'casey',
      reason: null,
      payload: {
        fields: ['signalIds'],
        changes: { signalIds: { before: ['S1', 'S2'], after: ['S1'] } },
      },
    });
  });
});

describe('expireDue', () => {
  it('expires every due row and reports machine refusals in skipped', async () => {
    const prisma = makePrisma();
    const auditSpy = asyncSpy(async () => ({ stored: true, reviewQueued: true }));
    prisma.unsubscribedEmail.findUnique.mockResolvedValue(null);
    prisma.prospectingHypothesis.findMany.mockResolvedValue([{ id: 'H1' }, { id: 'H2' }, { id: 'H3' }]);
    const rows: Record<string, ReturnType<typeof row>> = {
      H1: row({ id: 'H1', status: 'approved', expires_at: PAST }),
      H2: row({ id: 'H2', status: 'active', expires_at: PAST }),
      // Listed as due but its expiry is still ahead: the machine refuses it.
      H3: row({ id: 'H3', status: 'active', expires_at: FUTURE_A }),
    };
    prisma.prospectingHypothesis.findUnique.mockImplementation(async (args: { where: { id: string } }) => rows[args.where.id]);
    prisma.tx.prospectingHypothesis.updateMany.mockImplementation(async (args: { where: { id: string; status?: string } }) => ({
      count: args.where.status === rows[args.where.id].status ? 1 : 0,
    }));

    const mirrorSpy = asyncSpy(async () => ({ ok: true }));
    const out = await expireDue(prisma, NOW, 'cron', { audit: auditSpy, mirror: mirrorSpy });
    expect(out).toEqual({ expired: 2, skipped: [{ id: 'H3', reason: 'not_yet_expired' }] });
    expect(mirrorSpy).toHaveBeenCalledTimes(2);
    expect(mirrorSpy.mock.calls.map((c) => (c[1] as { action: string }).action)).toEqual(['expired', 'expired']);

    expect(prisma.prospectingHypothesis.findMany).toHaveBeenCalledWith({
      where: { status: { in: ['approved', 'active'] }, expires_at: { lte: NOW } },
      select: { id: true },
    });
    expect(prisma.tx.prospectingHypothesis.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.tx.prospectingHypothesis.updateMany.mock.calls.map((c) => c[0].data.status)).toEqual([
      'expired',
      'expired',
    ]);
    expect(auditSpy).toHaveBeenCalledTimes(2);
    expect(auditSpy.mock.calls.every((c) => (c[1] as { kind: string }).kind === 'hypothesis.expired')).toBe(true);
  });
});
