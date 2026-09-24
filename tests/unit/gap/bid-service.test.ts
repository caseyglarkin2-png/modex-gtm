/**
 * BID service (GAP Prospecting OS, Sprint 4, S4-T3): the audited wrapper
 * over capture.ts. Pins: the account and persona come from the hypothesis,
 * a human row is confirmed on capture and an agent row is not, a
 * `supersedesId` goes through correctBid (a NEW row, never an update),
 * `disposition_mismatch`, the field-naming refusals, the `bid.captured` and
 * `bid.confirmed` audit lines, and `listBids` selection.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { confirmBidByHuman, listBids, recordBid, type RecordBidInput } from '@/lib/gap/bid/service';

/* eslint-disable @typescript-eslint/no-explicit-any */
const NOW = new Date('2026-09-23T15:00:00.000Z');

function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

function makePrisma() {
  let seq = 0;
  return {
    prospectingHypothesis: { findUnique: asyncSpy(async () => ({ id: 'H1', account_name: 'Acme Logistics' })) },
    conversationDisposition: { findUnique: asyncSpy(async () => ({ id: 'D1', hypothesis_id: 'H1' })) },
    persona: { findFirst: asyncSpy(async () => ({ id: 7 })) },
    buyerInputData: {
      create: asyncSpy(async ({ data }: { data: Record<string, unknown> }) => ({ id: `B${++seq}`, ...data })),
      findUnique: asyncSpy(),
      findFirst: asyncSpy(async () => null),
      findMany: asyncSpy(async () => []),
      update: asyncSpy(async () => ({})),
    },
    gapAuditEvent: { create: asyncSpy(async () => ({ id: 'A' })) },
  };
}
type Prisma = ReturnType<typeof makePrisma>;

function input(overrides: Partial<RecordBidInput> = {}): RecordBidInput {
  return {
    hypothesisId: 'H1',
    contactEmail: 'Jordan@Acme.example',
    type: 'business_problem',
    rawBuyerLanguage: 'we lose trailers every week',
    source: 'call',
    actor: 'casey',
    actorKind: 'human',
    now: NOW,
    ...overrides,
  };
}

let prisma: Prisma;
let audit: ReturnType<typeof asyncSpy>;

beforeEach(() => {
  prisma = makePrisma();
  audit = asyncSpy(async () => ({ stored: true, reviewQueued: false }));
});

describe('recordBid', () => {
  it('captures a confirmed row for a human with the account and persona resolved from the hypothesis', async () => {
    const out = await recordBid(prisma, input({ dispositionId: 'D1' }), { audit });
    expect(out).toEqual({ ok: true, bidId: 'B1', humanConfirmed: true, supersedesId: null });
    const data = prisma.buyerInputData.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      hypothesis_id: 'H1',
      account_name: 'Acme Logistics',
      persona_id: 7,
      contact_email: 'jordan@acme.example',
      disposition_id: 'D1',
      type: 'business_problem',
      raw_buyer_language: 'we lose trailers every week',
      source: 'call',
      captured_at: NOW,
      captured_by: 'casey',
      human_confirmed: true,
      confirmed_by: 'casey',
      confirmed_at: NOW,
      supersedes_id: null,
    });
    expect(prisma.persona.findFirst).toHaveBeenCalledWith({ where: { email: 'jordan@acme.example', account_name: 'Acme Logistics' }, select: { id: true } });
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][1]).toMatchObject({ kind: 'bid.captured', actor: 'casey', subjectType: 'bid', subjectId: 'B1', payload: { humanConfirmed: true, dispositionId: 'D1' } });
  });

  it('an agent row is never confirmed on capture', async () => {
    const out = await recordBid(prisma, input({ actor: 'cron', actorKind: 'agent' }), { audit });
    expect(out).toEqual({ ok: true, bidId: 'B1', humanConfirmed: false, supersedesId: null });
    expect(prisma.buyerInputData.create.mock.calls[0][0].data).toMatchObject({ human_confirmed: false, confirmed_by: null, confirmed_at: null });
  });

  it('supersedesId corrects through correctBid: a NEW row pointing at the old one, no update', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValueOnce({
      id: 'B_old', hypothesis_id: 'H1', account_name: 'Acme Logistics', persona_id: 7, contact_email: 'jordan@acme.example', disposition_id: 'D1',
      inbound_message_id: null, activity_id: null, type: 'metric', source: 'call',
    });
    const out = await recordBid(prisma, input({ supersedesId: 'B_old', type: 'metric', rawBuyerLanguage: '45 minutes a truck', numericValue: 45, unit: 'minutes' }), { audit });
    expect(out).toEqual({ ok: true, bidId: 'B1', humanConfirmed: true, supersedesId: 'B_old' });
    expect(prisma.buyerInputData.create.mock.calls[0][0].data).toMatchObject({ supersedes_id: 'B_old', numeric_value: 45, unit: 'minutes', disposition_id: 'D1' });
    expect(prisma.buyerInputData.update).not.toHaveBeenCalled();
    expect(audit.mock.calls[0][1].payload).toMatchObject({ supersedesId: 'B_old' });
  });

  it('a second correction of the same row is refused already_superseded', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValueOnce({ id: 'B_old', hypothesis_id: 'H1', account_name: 'Acme Logistics', contact_email: 'j@a.e', type: 'metric', source: 'call' });
    prisma.buyerInputData.findFirst.mockResolvedValueOnce({ id: 'B_prev' });
    const out = await recordBid(prisma, input({ supersedesId: 'B_old' }), { audit });
    expect(out).toEqual({ ok: false, kind: 'refused', reason: 'already_superseded' });
    expect(audit).not.toHaveBeenCalled();
  });

  it('hypothesis_not_found and disposition_mismatch refuse before any write', async () => {
    prisma.prospectingHypothesis.findUnique.mockResolvedValueOnce(null);
    expect(await recordBid(prisma, input(), { audit })).toEqual({ ok: false, kind: 'refused', reason: 'hypothesis_not_found' });
    prisma.conversationDisposition.findUnique.mockResolvedValueOnce({ id: 'D9', hypothesis_id: 'H_other' });
    expect(await recordBid(prisma, input({ dispositionId: 'D9' }), { audit })).toEqual({ ok: false, kind: 'refused', reason: 'disposition_mismatch' });
    expect(prisma.buyerInputData.create).not.toHaveBeenCalled();
  });

  it('validation refusals name the field: unknown type, unknown source, unit_required on a bare impact number', async () => {
    expect(await recordBid(prisma, input({ type: 'feeling' }), { audit })).toEqual({ ok: false, kind: 'invalid_body', field: 'type', reason: 'unknown_bid_type' });
    expect(await recordBid(prisma, input({ source: 'carrier_pigeon' }), { audit })).toEqual({ ok: false, kind: 'invalid_body', field: 'source', reason: 'unknown_bid_source' });
    expect(await recordBid(prisma, input({ type: 'impact', numericValue: 12 }), { audit })).toEqual({ ok: false, kind: 'invalid_body', field: 'unit', reason: 'unit_required' });
    expect(await recordBid(prisma, input({ rawBuyerLanguage: '   ' }), { audit })).toEqual({ ok: false, kind: 'invalid_body', field: 'rawBuyerLanguage', reason: 'empty_buyer_language' });
    expect(prisma.buyerInputData.create).not.toHaveBeenCalled();
  });
});

describe('confirmBidByHuman', () => {
  it('flips the row and audits bid.confirmed once', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValueOnce({ id: 'B1', human_confirmed: false });
    const out = await confirmBidByHuman(prisma, 'B1', 'casey', 'human', NOW, { audit });
    expect(out).toEqual({ ok: true, bidId: 'B1', alreadyConfirmed: false });
    expect(prisma.buyerInputData.update).toHaveBeenCalledWith({ where: { id: 'B1', human_confirmed: false }, data: { human_confirmed: true, confirmed_by: 'casey', confirmed_at: NOW } });
    expect(audit.mock.calls[0][1]).toMatchObject({ kind: 'bid.confirmed', subjectId: 'B1' });
  });

  it('an already-confirmed row is reported and not re-audited; an agent is refused not_human', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValueOnce({ id: 'B1', human_confirmed: true });
    expect(await confirmBidByHuman(prisma, 'B1', 'casey', 'human', NOW, { audit })).toEqual({ ok: true, bidId: 'B1', alreadyConfirmed: true });
    expect(audit).not.toHaveBeenCalled();
    expect(await confirmBidByHuman(prisma, 'B1', 'cron', 'agent', NOW, { audit })).toEqual({ ok: false, reason: 'not_human' });
  });
});

describe('listBids', () => {
  it('returns every row and the confirmed unsuperseded subset', async () => {
    prisma.buyerInputData.findMany.mockResolvedValueOnce([
      { id: 'B1', type: 'metric', raw_buyer_language: '40 min', numeric_value: '40', unit: 'minutes', human_confirmed: true, supersedes_id: null, captured_at: NOW },
      { id: 'B2', type: 'metric', raw_buyer_language: '45 min', numeric_value: 45, unit: 'minutes', human_confirmed: false, supersedes_id: 'B1', captured_at: NOW },
      { id: 'B3', type: 'impact', raw_buyer_language: 'we miss loads', numeric_value: null, unit: null, human_confirmed: true, supersedes_id: null, captured_at: NOW },
    ]);
    const out = await listBids(prisma, 'H1');
    expect(out.all.map((b) => b.id)).toEqual(['B1', 'B2', 'B3']);
    // B1 is superseded by the unconfirmed B2 (fail closed), B2 is unconfirmed, so only B3 feeds resolution.
    expect(out.confirmed.map((b) => b.id)).toEqual(['B3']);
    expect(out.all[0].numericValue).toBe(40);
  });
});
