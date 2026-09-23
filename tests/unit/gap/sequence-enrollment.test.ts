/**
 * S3-T3: SequenceEnrollment service. Hand-rolled prisma; `$transaction`
 * passes a separate `tx` object so a test can tell inside from outside.
 * `stopRun` and `audit` are module mocks so the call shapes are asserted,
 * not re-implemented.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedStopRun, mockedAudit } = vi.hoisted(() => ({
  mockedStopRun: vi.fn<(...args: any[]) => Promise<number>>(async () => 2),
  mockedAudit: vi.fn<(...args: any[]) => Promise<{ stored: boolean; reviewQueued: boolean }>>(async () => ({
    stored: true,
    reviewQueued: false,
  })),
}));

vi.mock('@/lib/queue/sequence-runtime', () => ({ stopRun: mockedStopRun }));
vi.mock('@/lib/gap/audit', () => ({ audit: mockedAudit }));

import {
  complete,
  confirmStop,
  enroll,
  pause,
  readbackShowsEnrolled,
  recordExternalEnrollment,
  resume,
  stop,
  stopEnrollmentsForHypothesis,
  stopEnrollmentsForVersion,
  type EnrollInput,
  type RecordExternalEnrollmentInput,
} from '@/lib/gap/sequence/enrollment';

const NOW = new Date('2026-09-23T15:00:00.000Z');

function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

function makePrisma() {
  const tx = {
    sequenceEnrollment: { create: asyncSpy(async () => ({ id: 'x' })), updateMany: asyncSpy(async () => ({ count: 1 })) },
    sequenceVersion: {
      findUnique: asyncSpy(async () => ({ id: 'v1', status: 'draft' })),
      updateMany: asyncSpy(async () => ({ count: 1 })),
    },
    draftQueueItem: { updateMany: asyncSpy(async () => ({ count: 1 })) },
  };
  return {
    sequenceVersion: { findUnique: asyncSpy(async () => ({ id: 'v1', family_id: 'fam_1', status: 'draft' })) },
    unsubscribedEmail: { findUnique: asyncSpy(async () => null) },
    persona: { findUnique: asyncSpy(async () => ({ do_not_contact: false })) },
    sequenceEnrollment: {
      findFirst: asyncSpy(async () => null),
      findUnique: asyncSpy(async () => null),
      findMany: asyncSpy(async () => []),
      updateMany: asyncSpy(async () => ({ count: 1 })),
    },
    prospectingHypothesis: { findUnique: asyncSpy(async () => ({ status: 'approved' })) },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    tx,
  };
}

type Prisma = ReturnType<typeof makePrisma>;

function enrollInput(overrides: Partial<EnrollInput> = {}): EnrollInput {
  return {
    familyId: 'fam_1',
    versionId: 'v1',
    engine: 'modex_draft_queue',
    toEmail: 'Jane.Doe@Acme-Logistics.com',
    accountName: 'Acme Logistics',
    personaId: 7,
    hypothesisId: 'H1',
    sender: 'casey@yardflow.ai',
    owner: 'casey@freightroll.com',
    draftItemId: 4242,
    now: NOW,
    enrolledBy: 'casey',
    ...overrides,
  };
}

function externalInput(overrides: Partial<RecordExternalEnrollmentInput> = {}): RecordExternalEnrollmentInput {
  return {
    id: 'enr-uuid-v5',
    familyId: 'fam_1',
    versionId: 'v1',
    toEmail: 'ops@acme-logistics.com',
    accountName: 'Acme Logistics',
    hubspotContactId: '9001',
    hubspotSequenceId: '311',
    sender: 'casey@freightroll.com',
    owner: 'casey@freightroll.com',
    externalState: { activelyEnrolledCount: 1, latestSequenceId: '311', latestEnrolledAt: '2026-09-15T12:00:00.000Z' },
    enrolledAt: new Date('2026-09-15T12:00:00.000Z'),
    enrolledBy: 'sync',
    now: NOW,
    ...overrides,
  };
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'enr_1',
    engine: 'modex_draft_queue',
    status: 'active',
    to_email: 'jane.doe@acme-logistics.com',
    account_name: 'Acme Logistics',
    sequence_version_id: 'v1',
    hypothesis_id: 'H1',
    hubspot_contact_id: null,
    hubspot_sequence_id: null,
    stop_requested_at: null,
    ...overrides,
  };
}

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

beforeEach(() => {
  process.env.GAP_OS_ENABLED = '1';
  delete process.env.FROM_EMAIL;
  mockedStopRun.mockClear();
  mockedAudit.mockClear();
});

afterEach(() => {
  delete process.env.GAP_OS_ENABLED;
});

// ---------------------------------------------------------------------------
// enroll: refusals in order
// ---------------------------------------------------------------------------

describe('enroll refusals, in guard order', () => {
  it('gap_disabled when the flag is off, before any read', async () => {
    delete process.env.GAP_OS_ENABLED;
    const prisma = makePrisma();
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'gap_disabled' });
    expect(prisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('version_retired before suppression is consulted', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', family_id: 'fam_1', status: 'retired' });
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'version_retired' });
    expect(prisma.unsubscribedEmail.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('version_not_found and family_mismatch are distinct refusals', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValueOnce(null);
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'version_not_found' });
    prisma.sequenceVersion.findUnique.mockResolvedValueOnce({ id: 'v1', family_id: 'fam_other', status: 'draft' });
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'family_mismatch' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('suppressed via unsubscribed_emails, looked up on the lowercased address, before already_enrolled', async () => {
    const prisma = makePrisma();
    prisma.unsubscribedEmail.findUnique.mockResolvedValue({ id: 'u1' });
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'suppressed' });
    expect(prisma.unsubscribedEmail.findUnique.mock.calls[0][0]).toEqual({
      where: { email: 'jane.doe@acme-logistics.com' },
      select: { id: true },
    });
    expect(prisma.sequenceEnrollment.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('suppressed via the persona do_not_contact flag', async () => {
    const prisma = makePrisma();
    prisma.persona.findUnique.mockResolvedValue({ do_not_contact: true });
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'suppressed' });
    expect(prisma.persona.findUnique.mock.calls[0][0]).toEqual({ where: { id: 7 }, select: { do_not_contact: true } });
    expect(prisma.sequenceEnrollment.findFirst).not.toHaveBeenCalled();
  });

  it('already_enrolled when a live enrollment exists for the address, before the hypothesis check', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findFirst.mockResolvedValue({ id: 'enr_live' });
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'already_enrolled' });
    expect(prisma.sequenceEnrollment.findFirst.mock.calls[0][0]).toEqual({
      where: { to_email: 'jane.doe@acme-logistics.com', status: { in: ['active', 'paused', 'stop_pending'] } },
      select: { id: true },
    });
    expect(prisma.prospectingHypothesis.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('hypothesis_not_ready for any status outside approved or active', async () => {
    for (const status of ['draft', 'review_required', 'confirmed', 'expired']) {
      const prisma = makePrisma();
      prisma.prospectingHypothesis.findUnique.mockResolvedValue({ status });
      expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'hypothesis_not_ready' });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    }
  });

  it('hypothesis_not_found when the id does not resolve; no check without a hypothesis', async () => {
    const prisma = makePrisma();
    prisma.prospectingHypothesis.findUnique.mockResolvedValue(null);
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'hypothesis_not_found' });
    const prisma2 = makePrisma();
    expect((await enroll(prisma2, enrollInput({ hypothesisId: null }))).ok).toBe(true);
    expect(prisma2.prospectingHypothesis.findUnique).not.toHaveBeenCalled();
  });

  it('already_enrolled when the partial unique index rejects the insert inside the transaction', async () => {
    const prisma = makePrisma();
    prisma.tx.sequenceEnrollment.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'already_enrolled' });
    expect(mockedAudit).not.toHaveBeenCalled();
  });

  it('draft_item_not_found when the stamp touches no row, so the transaction rolls back', async () => {
    const prisma = makePrisma();
    prisma.tx.draftQueueItem.updateMany.mockResolvedValue({ count: 0 });
    expect(await enroll(prisma, enrollInput())).toEqual({ ok: false, reason: 'draft_item_not_found' });
    expect(mockedAudit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// enroll: happy path
// ---------------------------------------------------------------------------

describe('enroll happy path', () => {
  it('external recipient: inserts is_test false, freezes the version, stamps the draft item, all inside the tx, then audits enroll.live', async () => {
    const prisma = makePrisma();
    const r = await enroll(prisma, enrollInput());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.id).toMatch(uuidRe);
    expect(r).toMatchObject({ isTest: false, frozen: true });

    const data = prisma.tx.sequenceEnrollment.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      id: r.id,
      engine: 'modex_draft_queue',
      family_id: 'fam_1',
      sequence_version_id: 'v1',
      hypothesis_id: 'H1',
      account_name: 'Acme Logistics',
      persona_id: 7,
      to_email: 'jane.doe@acme-logistics.com',
      sender: 'casey@yardflow.ai',
      owner: 'casey@freightroll.com',
      status: 'active',
      current_step_index: 0,
      rendered_steps: null,
      is_test: false,
      legacy: false,
      enrolled_by: 'casey',
      enrolled_at: NOW,
    });

    expect(prisma.tx.sequenceVersion.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 'v1', status: 'draft' },
      data: { status: 'frozen', frozen_at: NOW, frozen_by_enrollment_id: r.id },
    });

    expect(prisma.tx.draftQueueItem.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 4242 },
      data: { sequence_run_id: r.id, step_index: 0, sequence_version_id: 'v1' },
    });

    expect(mockedAudit).toHaveBeenCalledTimes(1);
    expect(mockedAudit.mock.calls[0][1]).toMatchObject({
      kind: 'enroll.live',
      actor: 'casey',
      subjectType: 'sequence_enrollment',
      subjectId: r.id,
      payload: { toEmail: 'jane.doe@acme-logistics.com', draftItemId: 4242, isTest: false, frozen: true },
    });
    expect(mockedAudit.mock.calls[0][1].review).toBeUndefined();
  });

  it('internal recipient casey@freightroll.com: is_test true and the version is NOT frozen', async () => {
    const prisma = makePrisma();
    const r = await enroll(prisma, enrollInput({ toEmail: 'Casey@FreightRoll.com' }));
    expect(r).toMatchObject({ ok: true, isTest: true, frozen: false });
    expect(prisma.tx.sequenceEnrollment.create.mock.calls[0][0].data).toMatchObject({
      to_email: 'casey@freightroll.com',
      is_test: true,
    });
    expect(prisma.tx.sequenceVersion.findUnique).not.toHaveBeenCalled();
    expect(prisma.tx.sequenceVersion.updateMany).not.toHaveBeenCalled();
    expect(prisma.tx.draftQueueItem.updateMany).toHaveBeenCalledTimes(1);
  });

  it('an already frozen version stays frozen and the enrollment still lands (frozen: false in the result)', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', family_id: 'fam_1', status: 'frozen' });
    prisma.tx.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', status: 'frozen' });
    const r = await enroll(prisma, enrollInput());
    expect(r).toMatchObject({ ok: true, isTest: false, frozen: false });
    expect(prisma.tx.sequenceVersion.updateMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// recordExternalEnrollment
// ---------------------------------------------------------------------------

describe('recordExternalEnrollment', () => {
  it('refuses no_readback without external_state, before any read', async () => {
    const prisma = makePrisma();
    expect(await recordExternalEnrollment(prisma, externalInput({ externalState: null }))).toEqual({ ok: false, reason: 'no_readback' });
    expect(prisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
  });

  it('shares the suppression and already_enrolled guards', async () => {
    const prisma = makePrisma();
    prisma.unsubscribedEmail.findUnique.mockResolvedValue({ id: 'u' });
    expect(await recordExternalEnrollment(prisma, externalInput())).toEqual({ ok: false, reason: 'suppressed' });

    const prisma2 = makePrisma();
    prisma2.sequenceEnrollment.findUnique.mockResolvedValue({ id: 'enr-uuid-v5' });
    expect(await recordExternalEnrollment(prisma2, externalInput())).toEqual({ ok: false, reason: 'already_enrolled' });

    const prisma3 = makePrisma();
    prisma3.sequenceEnrollment.findFirst.mockResolvedValue({ id: 'other' });
    expect(await recordExternalEnrollment(prisma3, externalInput())).toEqual({ ok: false, reason: 'already_enrolled' });
    expect(prisma3.$transaction).not.toHaveBeenCalled();
  });

  it('inserts hubspot_native with the readback and freezes the version for an external, non-legacy row', async () => {
    const prisma = makePrisma();
    const r = await recordExternalEnrollment(prisma, externalInput());
    expect(r).toEqual({ ok: true, id: 'enr-uuid-v5', isTest: false, frozen: true });
    expect(prisma.tx.sequenceEnrollment.create.mock.calls[0][0].data).toMatchObject({
      id: 'enr-uuid-v5',
      engine: 'hubspot_native',
      hubspot_contact_id: '9001',
      hubspot_sequence_id: '311',
      external_state: { activelyEnrolledCount: 1, latestSequenceId: '311' },
      external_synced_at: NOW,
      is_test: false,
      legacy: false,
      enrolled_at: new Date('2026-09-15T12:00:00.000Z'),
    });
    expect(prisma.tx.sequenceVersion.updateMany.mock.calls[0][0].data).toMatchObject({
      status: 'frozen',
      frozen_by_enrollment_id: 'enr-uuid-v5',
    });
  });

  it('legacy true: the row is recorded as legacy and the version is NOT frozen', async () => {
    const prisma = makePrisma();
    const r = await recordExternalEnrollment(prisma, externalInput({ legacy: true }));
    expect(r).toEqual({ ok: true, id: 'enr-uuid-v5', isTest: false, frozen: false });
    expect(prisma.tx.sequenceEnrollment.create.mock.calls[0][0].data).toMatchObject({ legacy: true, is_test: false });
    expect(prisma.tx.sequenceVersion.findUnique).not.toHaveBeenCalled();
    expect(prisma.tx.sequenceVersion.updateMany).not.toHaveBeenCalled();
    expect(mockedAudit.mock.calls[0][1].payload).toMatchObject({ legacy: true, frozen: false });
  });

  it('internal recipient: is_test true, no freeze', async () => {
    const prisma = makePrisma();
    const r = await recordExternalEnrollment(prisma, externalInput({ toEmail: 'jake@yardflow.ai' }));
    expect(r).toEqual({ ok: true, id: 'enr-uuid-v5', isTest: true, frozen: false });
    expect(prisma.tx.sequenceVersion.updateMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// stop
// ---------------------------------------------------------------------------

describe('stop', () => {
  it('modex: sets stopped with reason, stopped_at and stopped_by, and calls stopRun with the enrollment id and reason inside the tx', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(row());
    const r = await stop(prisma, 'enr_1', 'replied', 'casey', NOW);
    expect(r).toEqual({ ok: true, id: 'enr_1', status: 'stopped', skipped: 2 });

    expect(prisma.tx.sequenceEnrollment.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 'enr_1', status: { in: ['active', 'paused'] } },
      data: { status: 'stopped', stop_reason: 'replied', stopped_at: NOW, stopped_by: 'casey' },
    });
    expect(mockedStopRun).toHaveBeenCalledTimes(1);
    expect(mockedStopRun.mock.calls[0][0]).toBe(prisma.tx);
    expect(mockedStopRun.mock.calls[0].slice(1)).toEqual(['enr_1', 'replied']);
    expect(prisma.sequenceEnrollment.updateMany).not.toHaveBeenCalled();

    expect(mockedAudit.mock.calls[0][1]).toMatchObject({
      kind: 'decision.human_action',
      actor: 'casey',
      subjectId: 'enr_1',
      payload: { action: 'enrollment.stop', reason: 'replied', skipped: 2 },
    });
  });

  it('modex from paused also stops', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(row({ status: 'paused' }));
    expect(await stop(prisma, 'enr_1', 'manual', 'casey', NOW)).toMatchObject({ ok: true, status: 'stopped' });
  });

  it('hubspot_native: moves to stop_pending with stop_requested_at, never calls stopRun, audits with a review block naming the contact and sequence', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(
      row({ engine: 'hubspot_native', to_email: 'ops@acme-logistics.com', hubspot_contact_id: '9001', hubspot_sequence_id: '311' }),
    );
    const r = await stop(prisma, 'enr_1', 'dnc', 'casey', NOW);
    expect(r).toEqual({ ok: true, id: 'enr_1', status: 'stop_pending', skipped: 0 });
    expect(prisma.sequenceEnrollment.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 'enr_1', status: { in: ['active', 'paused'] } },
      data: { status: 'stop_pending', stop_reason: 'dnc', stop_requested_at: NOW },
    });
    expect(mockedStopRun).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();

    const auditInput = mockedAudit.mock.calls[0][1];
    expect(auditInput).toMatchObject({
      kind: 'decision.human_action',
      subjectId: 'enr_1',
      payload: { action: 'enrollment.stop_requested', reason: 'dnc', hubspotContactId: '9001', hubspotSequenceId: '311' },
    });
    expect(auditInput.review.target).toBe('ops@acme-logistics.com');
    expect(auditInput.review.title).toContain('311');
    expect(auditInput.review.intent).toContain('9001');
    expect(auditInput.review.intent).toContain('311');
    expect(auditInput.review.intent).toContain('dnc');
  });

  it('refuses bad_reason before any read', async () => {
    const prisma = makePrisma();
    expect(await stop(prisma, 'enr_1', 'bored', 'casey', NOW)).toEqual({ ok: false, reason: 'bad_reason' });
    expect(prisma.sequenceEnrollment.findUnique).not.toHaveBeenCalled();
  });

  it('refuses terminal for stopped and completed, and stop_pending for a pending stop, with zero writes', async () => {
    for (const status of ['stopped', 'completed']) {
      const prisma = makePrisma();
      prisma.sequenceEnrollment.findUnique.mockResolvedValue(row({ status }));
      expect(await stop(prisma, 'enr_1', 'manual', 'casey', NOW)).toEqual({ ok: false, reason: 'terminal' });
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.sequenceEnrollment.updateMany).not.toHaveBeenCalled();
    }
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(row({ engine: 'hubspot_native', status: 'stop_pending' }));
    expect(await stop(prisma, 'enr_1', 'manual', 'casey', NOW)).toEqual({ ok: false, reason: 'stop_pending' });
    expect(prisma.sequenceEnrollment.updateMany).not.toHaveBeenCalled();
  });

  it('reports stale_status when the optimistic move touches no row and does not call stopRun', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(row());
    prisma.tx.sequenceEnrollment.updateMany.mockResolvedValue({ count: 0 });
    expect(await stop(prisma, 'enr_1', 'manual', 'casey', NOW)).toEqual({ ok: false, reason: 'stale_status' });
    expect(mockedStopRun).not.toHaveBeenCalled();
    expect(mockedAudit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// confirmStop
// ---------------------------------------------------------------------------

describe('confirmStop', () => {
  const pending = () => row({ engine: 'hubspot_native', status: 'stop_pending', hubspot_contact_id: '9001', hubspot_sequence_id: '311' });

  it('refuses still_enrolled when the readback still shows the contact in that sequence', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(pending());
    const r = await confirmStop(prisma, 'enr_1', { activelyEnrolledCount: 1, latestSequenceId: '311', latestEnrolledAt: null }, 'rig', NOW);
    expect(r).toEqual({ ok: false, reason: 'still_enrolled' });
    expect(prisma.sequenceEnrollment.updateMany).not.toHaveBeenCalled();
  });

  it('moves stop_pending -> stopped with the readback when unenrolled, or enrolled elsewhere', async () => {
    for (const readback of [
      { activelyEnrolledCount: 0, latestSequenceId: '311', latestEnrolledAt: null },
      { activelyEnrolledCount: 1, latestSequenceId: '999', latestEnrolledAt: null },
    ]) {
      const prisma = makePrisma();
      prisma.sequenceEnrollment.findUnique.mockResolvedValue(pending());
      expect(await confirmStop(prisma, 'enr_1', readback, 'rig', NOW)).toEqual({ ok: true, id: 'enr_1', status: 'stopped' });
      expect(prisma.sequenceEnrollment.updateMany.mock.calls[0][0]).toEqual({
        where: { id: 'enr_1', status: { in: ['stop_pending'] } },
        data: { status: 'stopped', stopped_at: NOW, stopped_by: 'rig', external_state: readback, external_synced_at: NOW },
      });
    }
  });

  it('refuses not_stop_pending for an active row and terminal for a stopped one', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValueOnce(row({ engine: 'hubspot_native', status: 'active' }));
    const rb = { activelyEnrolledCount: 0, latestSequenceId: null, latestEnrolledAt: null };
    expect(await confirmStop(prisma, 'enr_1', rb, 'rig', NOW)).toEqual({ ok: false, reason: 'not_stop_pending' });
    prisma.sequenceEnrollment.findUnique.mockResolvedValueOnce(row({ engine: 'hubspot_native', status: 'stopped' }));
    expect(await confirmStop(prisma, 'enr_1', rb, 'rig', NOW)).toEqual({ ok: false, reason: 'terminal' });
  });

  it('readbackShowsEnrolled mirrors the lane rule', () => {
    expect(readbackShowsEnrolled({ activelyEnrolledCount: 1, latestSequenceId: '311', latestEnrolledAt: null }, '311')).toBe(true);
    expect(readbackShowsEnrolled({ activelyEnrolledCount: 0, latestSequenceId: '311', latestEnrolledAt: null }, '311')).toBe(false);
    expect(readbackShowsEnrolled({ activelyEnrolledCount: 2, latestSequenceId: null, latestEnrolledAt: null }, null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// pause, resume, complete, terminal
// ---------------------------------------------------------------------------

describe('pause, resume and complete', () => {
  it('pause: active -> paused; resume: paused -> active unless the version is retired', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(row());
    expect(await pause(prisma, 'enr_1', 'casey', NOW)).toEqual({ ok: true, id: 'enr_1', status: 'paused' });
    expect(prisma.sequenceEnrollment.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 'enr_1', status: { in: ['active'] } },
      data: { status: 'paused' },
    });

    prisma.sequenceEnrollment.findUnique.mockResolvedValue(row({ status: 'paused' }));
    prisma.sequenceVersion.findUnique.mockResolvedValueOnce({ status: 'retired' });
    expect(await resume(prisma, 'enr_1', 'casey', NOW)).toEqual({ ok: false, reason: 'version_retired' });
    prisma.sequenceVersion.findUnique.mockResolvedValueOnce({ status: 'frozen' });
    expect(await resume(prisma, 'enr_1', 'casey', NOW)).toEqual({ ok: true, id: 'enr_1', status: 'active' });
  });

  it('pause on a hubspot_native row posts a review line', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(row({ engine: 'hubspot_native', hubspot_sequence_id: '311' }));
    expect(await pause(prisma, 'enr_1', 'casey', NOW)).toMatchObject({ ok: true, status: 'paused' });
    expect(mockedAudit.mock.calls[0][1].review.title).toContain('311');
  });

  it('pause and resume refuse the wrong source status', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(row({ status: 'paused' }));
    expect(await pause(prisma, 'enr_1', 'casey', NOW)).toEqual({ ok: false, reason: 'not_active' });
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(row({ status: 'active' }));
    expect(await resume(prisma, 'enr_1', 'casey', NOW)).toEqual({ ok: false, reason: 'not_paused' });
  });

  it('complete: active -> completed; refused while a stop is requested', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValueOnce(row());
    expect(await complete(prisma, 'enr_1', 'system', NOW)).toEqual({ ok: true, id: 'enr_1', status: 'completed' });
    expect(prisma.sequenceEnrollment.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 'enr_1', status: { in: ['active'] } },
      data: { status: 'completed', completed_at: NOW },
    });
    prisma.sequenceEnrollment.findUnique.mockResolvedValueOnce(row({ stop_requested_at: NOW }));
    expect(await complete(prisma, 'enr_1', 'system', NOW)).toEqual({ ok: false, reason: 'stop_pending' });
  });

  it('every transition refuses terminal on stopped and completed rows, and not_found on a missing id', async () => {
    for (const status of ['stopped', 'completed']) {
      const prisma = makePrisma();
      prisma.sequenceEnrollment.findUnique.mockResolvedValue(row({ status }));
      const rb = { activelyEnrolledCount: 0, latestSequenceId: null, latestEnrolledAt: null };
      expect(await pause(prisma, 'enr_1', 'c', NOW)).toEqual({ ok: false, reason: 'terminal' });
      expect(await resume(prisma, 'enr_1', 'c', NOW)).toEqual({ ok: false, reason: 'terminal' });
      expect(await stop(prisma, 'enr_1', 'manual', 'c', NOW)).toEqual({ ok: false, reason: 'terminal' });
      expect(await confirmStop(prisma, 'enr_1', rb, 'c', NOW)).toEqual({ ok: false, reason: 'terminal' });
      expect(await complete(prisma, 'enr_1', 'c', NOW)).toEqual({ ok: false, reason: 'terminal' });
      expect(prisma.sequenceEnrollment.updateMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    }
    const prisma = makePrisma();
    expect(await pause(prisma, 'ghost', 'c', NOW)).toEqual({ ok: false, reason: 'not_found' });
  });
});

// ---------------------------------------------------------------------------
// Bulk stops
// ---------------------------------------------------------------------------

describe('stopEnrollmentsForVersion and stopEnrollmentsForHypothesis', () => {
  function bulkPrisma() {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findMany.mockResolvedValue([{ id: 'm1' }, { id: 'h1' }]);
    prisma.sequenceEnrollment.findUnique.mockImplementation(async (args: any) =>
      args.where.id === 'm1'
        ? row({ id: 'm1' })
        : row({ id: 'h1', engine: 'hubspot_native', hubspot_contact_id: '9', hubspot_sequence_id: '311' }),
    );
    return prisma;
  }

  it('stops every active or paused run on a version: modex stopped, hubspot pending', async () => {
    const prisma = bulkPrisma();
    const r = await stopEnrollmentsForVersion(prisma, 'v1', 'sequence_retired', 'casey', NOW);
    expect(r).toEqual({ stopped: ['m1'], pending: ['h1'], refused: [] });
    expect(prisma.sequenceEnrollment.findMany.mock.calls[0][0]).toEqual({
      where: { sequence_version_id: 'v1', status: { in: ['active', 'paused'] } },
      select: { id: true },
      orderBy: { enrolled_at: 'asc' },
    });
    expect(mockedStopRun).toHaveBeenCalledTimes(1);
    expect(mockedStopRun.mock.calls[0].slice(1)).toEqual(['m1', 'sequence_retired']);
  });

  it('stops by hypothesis with the machine effect reason', async () => {
    const prisma = bulkPrisma();
    const r = await stopEnrollmentsForHypothesis(prisma, 'H1', 'hypothesis_resolved', 'machine', NOW);
    expect(r).toEqual({ stopped: ['m1'], pending: ['h1'], refused: [] });
    expect(prisma.sequenceEnrollment.findMany.mock.calls[0][0].where).toEqual({
      hypothesis_id: 'H1',
      status: { in: ['active', 'paused'] },
    });
  });

  it('a bad reason refuses every row and writes nothing', async () => {
    const prisma = bulkPrisma();
    const r = await stopEnrollmentsForVersion(prisma, 'v1', 'whatever', 'casey', NOW);
    expect(r).toEqual({
      stopped: [],
      pending: [],
      refused: [
        { id: 'm1', reason: 'bad_reason' },
        { id: 'h1', reason: 'bad_reason' },
      ],
    });
    expect(mockedStopRun).not.toHaveBeenCalled();
  });
});
