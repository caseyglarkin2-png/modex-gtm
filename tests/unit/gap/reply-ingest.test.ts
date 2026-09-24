/**
 * S4-T4: reply ingestion (src/lib/gap/replies/ingest.ts).
 *
 * The enrollment service (`pause`, `stop`), the queue runtime
 * (`stopRunsForRecipient`) and `audit` are module mocks so the CALL SHAPES are
 * asserted, not re-implemented; sequence-enrollment.test.ts and
 * immediate-stop.test.ts own what those functions do inside. The prisma the
 * flag-off test hands in is a throwing proxy: any property read is a failure,
 * which is how "zero reads" is proven rather than assumed.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedPause, mockedStop, mockedStopRuns, mockedAudit } = vi.hoisted(() => ({
  mockedPause: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedStop: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedStopRuns: vi.fn<(...args: any[]) => Promise<number>>(),
  mockedAudit: vi.fn<(...args: any[]) => Promise<{ stored: boolean; reviewQueued: boolean }>>(async () => ({
    stored: true,
    reviewQueued: false,
  })),
}));

vi.mock('@/lib/gap/sequence/enrollment', () => ({ pause: mockedPause, stop: mockedStop }));
vi.mock('@/lib/queue/sequence-runtime', () => ({ stopRunsForRecipient: mockedStopRuns }));
vi.mock('@/lib/gap/audit', () => ({ audit: mockedAudit }));

import {
  INGEST_ACTOR,
  REPLY_PENDING_MARKER,
  REPLY_STOP_REASON,
  ingestReply,
  replyPendingMarker,
  type IngestReplyInput,
} from '@/lib/gap/replies/ingest';

const NOW = new Date('2026-09-23T15:00:00.000Z');
const RECEIVED = new Date('2026-09-23T14:58:00.000Z');

function input(overrides: Partial<IngestReplyInput> = {}): IngestReplyInput {
  return {
    contactEmail: 'Pat@Acme.Example',
    source: 'gmail',
    inboundMessageId: 'gm-msg-1',
    receivedAt: RECEIVED,
    isAutoresponder: false,
    now: NOW,
    ...overrides,
  };
}

const MODEX = { id: 'enr_modex', engine: 'modex_draft_queue', status: 'active' };
const NATIVE = { id: 'enr_native', engine: 'hubspot_native', status: 'active' };

function makePrisma(rows: Array<{ id: string; engine: string; status: string }> = []) {
  return {
    sequenceEnrollment: {
      findMany: vi.fn<(...args: any[]) => Promise<any>>(async () => rows),
      updateMany: vi.fn<(...args: any[]) => Promise<any>>(async () => ({ count: 1 })),
    },
    draftQueueItem: { updateMany: vi.fn(), deleteMany: vi.fn() },
  };
}

/** Every property read throws: the only way to PROVE zero reads. */
function throwingPrisma(): any {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        throw new Error(`prisma.${String(prop)} was read`);
      },
    },
  );
}

function expectNoWrites(prisma: ReturnType<typeof makePrisma>) {
  expect(mockedPause).not.toHaveBeenCalled();
  expect(mockedStop).not.toHaveBeenCalled();
  expect(mockedStopRuns).not.toHaveBeenCalled();
  expect(mockedAudit).not.toHaveBeenCalled();
  expect(prisma.sequenceEnrollment.updateMany).not.toHaveBeenCalled();
  expect(prisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
  expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
}

const savedFlag = process.env.GAP_OS_ENABLED;
beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
  mockedPause.mockReset();
  mockedStop.mockReset();
  mockedStopRuns.mockReset();
  mockedAudit.mockClear();
  mockedPause.mockImplementation(async (_p: any, id: string) => ({ ok: true, id, status: 'paused' }));
  mockedStop.mockImplementation(async (_p: any, id: string) => ({ ok: true, id, status: 'stop_pending', skipped: 0 }));
  mockedStopRuns.mockResolvedValue(3);
});
afterEach(() => {
  if (savedFlag === undefined) delete process.env.GAP_OS_ENABLED;
  else process.env.GAP_OS_ENABLED = savedFlag;
});

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

describe('ingestReply: guards', () => {
  it('flag off: answers gap_disabled with ZERO prisma reads (throwing proxy) and no service call', async () => {
    delete process.env.GAP_OS_ENABLED;
    const r = await ingestReply(throwingPrisma(), input());
    expect(r).toEqual({ ok: true, action: 'none', enrollments: [], itemsStopped: 0, reason: 'gap_disabled' });
    expect(mockedPause).not.toHaveBeenCalled();
    expect(mockedStop).not.toHaveBeenCalled();
    expect(mockedStopRuns).not.toHaveBeenCalled();
    expect(mockedAudit).not.toHaveBeenCalled();
  });

  it('flag spelled "false" or "0" is off too', async () => {
    for (const v of ['false', '0', '', 'no']) {
      process.env.GAP_OS_ENABLED = v;
      expect((await ingestReply(throwingPrisma(), input())).reason).toBe('gap_disabled');
    }
  });

  it('autoresponder: answers autoresponder with zero reads and zero writes, even with an active enrollment on the address', async () => {
    const prisma = makePrisma([MODEX, NATIVE]);
    const r = await ingestReply(prisma, input({ isAutoresponder: true }));
    expect(r).toEqual({ ok: true, action: 'none', enrollments: [], itemsStopped: 0, reason: 'autoresponder' });
    expect(prisma.sequenceEnrollment.findMany).not.toHaveBeenCalled();
    expectNoWrites(prisma);
  });

  it('blank address: blank_email, no read', async () => {
    const prisma = makePrisma([MODEX]);
    expect((await ingestReply(prisma, input({ contactEmail: '   ' }))).reason).toBe('blank_email');
    expect(prisma.sequenceEnrollment.findMany).not.toHaveBeenCalled();
    expectNoWrites(prisma);
  });

  it('no live enrollment on the address: not_enrolled, zero writes', async () => {
    const prisma = makePrisma([]);
    const r = await ingestReply(prisma, input());
    expect(r).toEqual({ ok: true, action: 'none', enrollments: [], itemsStopped: 0, reason: 'not_enrolled' });
    expectNoWrites(prisma);
  });

  it('reads the LOWERCASED address across every live status, never the terminal ones', async () => {
    const prisma = makePrisma([]);
    await ingestReply(prisma, input({ contactEmail: '  Pat@Acme.Example ' }));
    expect(prisma.sequenceEnrollment.findMany).toHaveBeenCalledTimes(1);
    const arg = prisma.sequenceEnrollment.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ to_email: 'pat@acme.example', status: { in: ['active', 'paused', 'stop_pending'] } });
    expect(arg.where.status.in).not.toContain('stopped');
    expect(arg.where.status.in).not.toContain('completed');
  });
});

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

describe('ingestReply: modex enrollment', () => {
  it('pauses through the service as actor ingest, marks reply_pending in external_state, stops the unsent items with reason replied and returns the count', async () => {
    const prisma = makePrisma([MODEX]);
    const r = await ingestReply(prisma, input());

    expect(mockedPause).toHaveBeenCalledTimes(1);
    expect(mockedPause).toHaveBeenCalledWith(prisma, 'enr_modex', INGEST_ACTOR, NOW);
    expect(mockedStop).not.toHaveBeenCalled();

    expect(mockedStopRuns).toHaveBeenCalledTimes(1);
    expect(mockedStopRuns).toHaveBeenCalledWith(prisma, 'pat@acme.example', 'replied');
    expect(REPLY_STOP_REASON).toBe('replied');

    // The marker: scoped to the row AND the paused status, external_state carries reply_pending.
    expect(prisma.sequenceEnrollment.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.sequenceEnrollment.updateMany).toHaveBeenCalledWith({
      where: { id: 'enr_modex', status: 'paused' },
      data: {
        external_state: {
          [REPLY_PENDING_MARKER]: {
            source: 'gmail',
            inbound_message_id: 'gm-msg-1',
            received_at: RECEIVED.toISOString(),
            at: NOW.toISOString(),
          },
        },
      },
    });
    // stop_reason is never written by ingest: it stays null until a disposition decides.
    const data = prisma.sequenceEnrollment.updateMany.mock.calls[0][0].data;
    expect(Object.keys(data)).toEqual(['external_state']);

    expect(r).toEqual({
      ok: true,
      action: 'paused',
      enrollments: [{ id: 'enr_modex', engine: 'modex_draft_queue', previous: 'active', next: 'paused' }],
      itemsStopped: 3,
    });

    // Never a delete.
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });

  it('audits reply.ingested with the enrollment ids and the item count', async () => {
    const prisma = makePrisma([MODEX]);
    await ingestReply(prisma, input({ hubspotContactId: '9001' }));
    expect(mockedAudit).toHaveBeenCalledTimes(1);
    const [client, event] = mockedAudit.mock.calls[0];
    expect(client).toBe(prisma);
    expect(event).toMatchObject({
      kind: 'reply.ingested',
      actor: INGEST_ACTOR,
      subjectType: 'inbound_message',
      subjectId: 'gm-msg-1',
      payload: {
        source: 'gmail',
        toEmail: 'pat@acme.example',
        hubspotContactId: '9001',
        enrollmentIds: ['enr_modex'],
        itemsStopped: 3,
      },
    });
  });

  it('a pause that loses the status race is reported as a refusal, and the items are still stopped', async () => {
    mockedPause.mockResolvedValue({ ok: false, reason: 'stale_status' });
    const prisma = makePrisma([MODEX]);
    const r = await ingestReply(prisma, input());
    expect(r).toEqual({
      ok: true,
      action: 'none',
      enrollments: [],
      itemsStopped: 3,
      reason: 'already_paused',
      refusals: [{ id: 'enr_modex', engine: 'modex_draft_queue', reason: 'stale_status' }],
    });
    expect(mockedStopRuns).toHaveBeenCalledWith(prisma, 'pat@acme.example', 'replied');
    // No marker on a row the pause did not win, and no audit for a no-op.
    expect(prisma.sequenceEnrollment.updateMany).not.toHaveBeenCalled();
    expect(mockedAudit).not.toHaveBeenCalled();
  });
});

describe('ingestReply: hubspot_native enrollment', () => {
  it('stop-requests through the service with reason replied (stop_pending); the modex item sweep is NOT run', async () => {
    const prisma = makePrisma([NATIVE]);
    const r = await ingestReply(prisma, input({ source: 'hubspot', inboundMessageId: 'hs:5551', hubspotContactId: '9001' }));

    expect(mockedStop).toHaveBeenCalledTimes(1);
    expect(mockedStop).toHaveBeenCalledWith(prisma, 'enr_native', 'replied', INGEST_ACTOR, NOW);
    expect(mockedPause).not.toHaveBeenCalled();
    expect(mockedStopRuns).not.toHaveBeenCalled();
    expect(prisma.sequenceEnrollment.updateMany).not.toHaveBeenCalled();

    expect(r).toEqual({
      ok: true,
      action: 'paused',
      enrollments: [{ id: 'enr_native', engine: 'hubspot_native', previous: 'active', next: 'stop_pending' }],
      itemsStopped: 0,
    });
  });

  it('a Gmail reply from someone enrolled natively in HubSpot stop-requests that enrollment too (both engines, either source)', async () => {
    const prisma = makePrisma([NATIVE]);
    await ingestReply(prisma, input({ source: 'gmail' }));
    expect(mockedStop).toHaveBeenCalledWith(prisma, 'enr_native', 'replied', INGEST_ACTOR, NOW);
  });

  it('the manual engine goes through stop as well (anything that is not modex is stop_pending)', async () => {
    const prisma = makePrisma([{ id: 'enr_manual', engine: 'manual', status: 'active' }]);
    const r = await ingestReply(prisma, input());
    expect(mockedStop).toHaveBeenCalledWith(prisma, 'enr_manual', 'replied', INGEST_ACTOR, NOW);
    expect(r.enrollments[0]).toMatchObject({ engine: 'manual', next: 'stop_pending' });
  });
});

describe('ingestReply: both engines at once', () => {
  it('pauses the modex row, stop-requests the native row, sweeps the items once, audits once', async () => {
    const prisma = makePrisma([MODEX, NATIVE]);
    const r = await ingestReply(prisma, input());

    expect(mockedPause).toHaveBeenCalledWith(prisma, 'enr_modex', INGEST_ACTOR, NOW);
    expect(mockedStop).toHaveBeenCalledWith(prisma, 'enr_native', 'replied', INGEST_ACTOR, NOW);
    expect(mockedStopRuns).toHaveBeenCalledTimes(1);
    expect(mockedAudit).toHaveBeenCalledTimes(1);

    expect(r).toEqual({
      ok: true,
      action: 'paused',
      enrollments: [
        { id: 'enr_modex', engine: 'modex_draft_queue', previous: 'active', next: 'paused' },
        { id: 'enr_native', engine: 'hubspot_native', previous: 'active', next: 'stop_pending' },
      ],
      itemsStopped: 3,
    });
    expect(mockedAudit.mock.calls[0][1].payload.enrollmentIds).toEqual(['enr_modex', 'enr_native']);
  });
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

describe('ingestReply: idempotency', () => {
  it('a second call for the same inbound (rows now paused / stop_pending) answers already_paused with zero writes', async () => {
    const prisma = makePrisma([
      { ...MODEX, status: 'paused' },
      { ...NATIVE, status: 'stop_pending' },
    ]);
    const r = await ingestReply(prisma, input());
    expect(r).toEqual({ ok: true, action: 'none', enrollments: [], itemsStopped: 0, reason: 'already_paused' });
    expectNoWrites(prisma);
  });

  it('first call pauses, second call (state advanced) is a no-op: the full sequence', async () => {
    const store = [{ ...MODEX }];
    const prisma = makePrisma(store);
    mockedPause.mockImplementation(async (_p: any, id: string) => {
      const row = store.find((s) => s.id === id)!;
      row.status = 'paused';
      return { ok: true, id, status: 'paused' };
    });

    const first = await ingestReply(prisma, input());
    expect(first.action).toBe('paused');
    const second = await ingestReply(prisma, input());
    expect(second).toMatchObject({ action: 'none', reason: 'already_paused' });

    expect(mockedPause).toHaveBeenCalledTimes(1);
    expect(mockedStopRuns).toHaveBeenCalledTimes(1);
    expect(mockedAudit).toHaveBeenCalledTimes(1);
    expect(prisma.sequenceEnrollment.updateMany).toHaveBeenCalledTimes(1);
  });

  it('a paused-then-stopped enrollment is untouched: terminal rows are outside the read, and one that leaks in is never acted on', async () => {
    // The where clause excludes stopped/completed (asserted above). Belt and
    // braces: even a sloppy store that returns a stopped row gets no call.
    const prisma = makePrisma([{ id: 'enr_done', engine: 'modex_draft_queue', status: 'stopped' }]);
    const r = await ingestReply(prisma, input());
    expect(r).toMatchObject({ action: 'none', reason: 'already_paused' });
    expectNoWrites(prisma);
  });
});

// ---------------------------------------------------------------------------
// Helpers and structure
// ---------------------------------------------------------------------------

describe('ingest helpers', () => {
  it('replyPendingMarker names the source, the inbound id and both timestamps under reply_pending', () => {
    expect(replyPendingMarker(input({ source: 'hubspot', inboundMessageId: 'hs:1' }))).toEqual({
      reply_pending: {
        source: 'hubspot',
        inbound_message_id: 'hs:1',
        received_at: RECEIVED.toISOString(),
        at: NOW.toISOString(),
      },
    });
  });
});

describe('S4-T4 structural', () => {
  const ROOT = path.resolve(__dirname, '../../..');
  const INGEST = readFileSync(path.join(ROOT, 'src/lib/gap/replies/ingest.ts'), 'utf8');
  const CHECK_INBOX = readFileSync(path.join(ROOT, 'src/app/api/cron/check-inbox/route.ts'), 'utf8');
  const POLLER = readFileSync(path.join(ROOT, 'src/lib/gap/replies/hubspot-poller.ts'), 'utf8');
  const AUDIT = readFileSync(path.join(ROOT, 'src/lib/gap/audit.ts'), 'utf8');

  it('ingest.ts imports no HubSpot client and never deletes', () => {
    expect(INGEST).not.toMatch(/from ['"]@\/lib\/hubspot\//);
    expect(INGEST).not.toContain('getHubSpotClient');
    expect(INGEST).not.toContain('deleteMany');
    expect(INGEST).not.toContain('.delete(');
  });

  it('ingest.ts reuses the runtime and the enrollment service instead of re-implementing the stop', () => {
    expect(INGEST).toContain("from '@/lib/queue/sequence-runtime'");
    expect(INGEST).toContain('stopRunsForRecipient(prisma, email, REPLY_STOP_REASON)');
    expect(INGEST).toContain("from '@/lib/gap/sequence/enrollment'");
    expect(INGEST).not.toContain('draftQueueItem.');
  });

  it('the flag guard is the FIRST statement of ingestReply and sits before any prisma access', () => {
    const body = INGEST.slice(INGEST.indexOf('export async function ingestReply'));
    const flagAt = body.indexOf('if (!isGapOsEnabled()) return none');
    const autoAt = body.indexOf('if (input.isAutoresponder) return none');
    const prismaAt = body.indexOf('prisma.');
    expect(flagAt).toBeGreaterThan(0);
    expect(autoAt).toBeGreaterThan(flagAt);
    expect(prismaAt).toBeGreaterThan(autoAt);
  });

  it('both writers call ingestReply exactly once, behind isGapOsEnabled(), after their InboundMessage write', () => {
    for (const [name, src] of [
      ['check-inbox', CHECK_INBOX],
      ['hubspot-poller', POLLER],
    ] as const) {
      expect(src.match(/ingestReply\(/g)?.length, name).toBe(1);
      expect(src, name).toContain('isGapOsEnabled()');
      expect(src.indexOf('inboundMessage.upsert'), name).toBeLessThan(src.indexOf('ingestReply('));
      expect(src.indexOf('isGapOsEnabled()'), name).toBeLessThan(src.indexOf('ingestReply('));
    }
  });

  it('the audit union carries reply.ingested', () => {
    expect(AUDIT).toContain("| 'reply.ingested'");
  });
});
