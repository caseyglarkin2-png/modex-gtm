import { readFileSync } from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  captureBid,
  confirmBid,
  confirmedOnCapture,
  correctBid,
  editSummary,
  validateBidInput,
  type BidActor,
  type CaptureBidInput,
} from '@/lib/gap/bid/capture';
import { bidFromRow, numericValueOf, selectConfirmedBids, supersededIds, type SelectableBid } from '@/lib/gap/bid/select';
import { BID_TYPES } from '@/lib/gap/taxonomy';

const NOW = new Date('2026-09-23T12:00:00.000Z');
const HUMAN: BidActor = { id: 'casey', kind: 'human' };
const AGENT: BidActor = { id: 'clawd', kind: 'agent' };

/* eslint-disable @typescript-eslint/no-explicit-any */
/** A spy typed to accept any arguments, so `mock.calls[n][m]` is indexable under strict tsc. */
function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function makePrisma() {
  return {
    buyerInputData: {
      create: asyncSpy(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'B_new', ...data })),
      findUnique: asyncSpy(),
      findFirst: asyncSpy(),
      update: asyncSpy(async () => ({})),
    },
  };
}
type Prisma = ReturnType<typeof makePrisma>;

function input(overrides: Partial<CaptureBidInput> = {}): CaptureBidInput {
  return {
    hypothesisId: 'H1',
    accountName: 'Acme Logistics',
    personaId: 7,
    contactEmail: 'Ops.Lead@Example.com',
    dispositionId: 'D1',
    type: 'business_problem',
    rawBuyerLanguage: '  we lose an hour a shift finding trailers  ',
    source: 'call',
    capturedBy: HUMAN,
    ...overrides,
  };
}

/** A stored row as findUnique returns it. */
function storedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'B1',
    hypothesis_id: 'H1',
    account_name: 'Acme Logistics',
    persona_id: 7,
    contact_email: 'ops.lead@example.com',
    disposition_id: 'D1',
    inbound_message_id: null,
    activity_id: null,
    type: 'impact',
    raw_buyer_language: 'about forty trailers a day sit past their window',
    normalized_summary: null,
    numeric_value: null,
    unit: null,
    source: 'call',
    captured_at: NOW,
    captured_by: 'casey',
    ai_extracted: false,
    human_confirmed: false,
    confirmed_by: null,
    confirmed_at: null,
    supersedes_id: null,
    metadata: null,
    ...overrides,
  };
}

describe('validateBidInput', () => {
  it('normalizes a valid human capture', () => {
    const result = validateBidInput(input({ confirm: true, normalizedSummary: '  lost hour per shift ' }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.contactEmail).toBe('ops.lead@example.com');
    expect(result.value.rawBuyerLanguage).toBe('we lose an hour a shift finding trailers');
    expect(result.value.normalizedSummary).toBe('lost hour per shift');
    expect(result.value.humanConfirmed).toBe(true);
    expect(result.value.numericValue).toBeNull();
  });

  it.each([
    ['hypothesisId', { hypothesisId: ' ' }, 'no_hypothesis'],
    ['accountName', { accountName: '' }, 'no_account'],
    ['contactEmail', { contactEmail: '   ' }, 'no_contact_email'],
    ['type', { type: 'pain_point' }, 'unknown_bid_type'],
    ['source', { source: 'sms' }, 'unknown_bid_source'],
    ['rawBuyerLanguage', { rawBuyerLanguage: '   ' }, 'empty_buyer_language'],
    ['numericValue', { numericValue: 'forty' }, 'invalid_numeric_value'],
    ['unit', { type: 'impact', numericValue: 40 }, 'unit_required'],
    ['unit', { type: 'metric', numericValue: '40' }, 'unit_required'],
    ['capturedBy', { capturedBy: { id: '', kind: 'human' } }, 'no_actor'],
  ] as const)('refuses on %s with %j as %s', (field, overrides, reason) => {
    expect(validateBidInput(input(overrides))).toEqual({ ok: false, field, reason });
  });

  it('accepts a number with a unit on impact and metric, and a bare count on other types', () => {
    const impact = validateBidInput(input({ type: 'impact', numericValue: '40.5', unit: ' trailers/day ' }));
    expect(impact.ok).toBe(true);
    if (impact.ok) {
      expect(impact.value.numericValue).toBe(40.5);
      expect(impact.value.unit).toBe('trailers/day');
    }
    const count = validateBidInput(input({ type: 'current_state', numericValue: 12 }));
    expect(count.ok).toBe(true);
    if (count.ok) expect(count.value.unit).toBeNull();
  });

  it.each(BID_TYPES)('accepts type %s', (type) => {
    expect(validateBidInput(input({ type })).ok).toBe(true);
  });
});

describe('confirmedOnCapture', () => {
  it('is true only for a human who asked to confirm', () => {
    expect(confirmedOnCapture(HUMAN, true)).toBe(true);
    expect(confirmedOnCapture(HUMAN, false)).toBe(false);
    expect(confirmedOnCapture(HUMAN, undefined)).toBe(false);
    expect(confirmedOnCapture(AGENT, true)).toBe(false);
    expect(confirmedOnCapture(AGENT, false)).toBe(false);
  });
});

describe('captureBid', () => {
  let prisma: Prisma;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('inserts a confirmed row for a human with confirm', async () => {
    const result = await captureBid(prisma, input({ confirm: true }), { now: NOW });
    expect(result).toEqual({ ok: true, id: 'B_new', humanConfirmed: true, supersedesId: null });
    expect(prisma.buyerInputData.create).toHaveBeenCalledTimes(1);
    const data = prisma.buyerInputData.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      hypothesis_id: 'H1',
      account_name: 'Acme Logistics',
      persona_id: 7,
      contact_email: 'ops.lead@example.com',
      disposition_id: 'D1',
      type: 'business_problem',
      raw_buyer_language: 'we lose an hour a shift finding trailers',
      source: 'call',
      captured_at: NOW,
      captured_by: 'casey',
      ai_extracted: false,
      human_confirmed: true,
      confirmed_by: 'casey',
      confirmed_at: NOW,
      supersedes_id: null,
    });
    expect(prisma.buyerInputData.update).not.toHaveBeenCalled();
  });

  it('never confirms an agent capture, even with confirm: true', async () => {
    const result = await captureBid(prisma, input({ capturedBy: AGENT, confirm: true, aiExtracted: true }), { now: NOW });
    expect(result).toEqual({ ok: true, id: 'B_new', humanConfirmed: false, supersedesId: null });
    const data = prisma.buyerInputData.create.mock.calls[0][0].data;
    expect(data.human_confirmed).toBe(false);
    expect(data.confirmed_by).toBeNull();
    expect(data.confirmed_at).toBeNull();
    expect(data.ai_extracted).toBe(true);
    expect(data.captured_by).toBe('clawd');
  });

  it('leaves a human capture unconfirmed without confirm', async () => {
    const result = await captureBid(prisma, input(), { now: NOW });
    expect(result).toMatchObject({ ok: true, humanConfirmed: false });
    expect(prisma.buyerInputData.create.mock.calls[0][0].data.human_confirmed).toBe(false);
  });

  it('uses an explicit capturedAt over now', async () => {
    const at = new Date('2026-09-20T09:00:00.000Z');
    await captureBid(prisma, input({ capturedAt: at }), { now: NOW });
    expect(prisma.buyerInputData.create.mock.calls[0][0].data.captured_at).toBe(at);
  });

  it('refuses before touching the database', async () => {
    const result = await captureBid(prisma, input({ contactEmail: '' }));
    expect(result).toEqual({ ok: false, field: 'contactEmail', reason: 'no_contact_email' });
    expect(prisma.buyerInputData.create).not.toHaveBeenCalled();
  });
});

describe('correctBid', () => {
  let prisma: Prisma;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('inserts a new row pointing at the old one and inherits its identity', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(storedRow());
    prisma.buyerInputData.findFirst.mockResolvedValue(null);
    const result = await correctBid(
      prisma,
      'B1',
      { rawBuyerLanguage: 'about forty trailers a day sit past their window, on a bad day sixty', numericValue: 40, unit: 'trailers/day', capturedBy: HUMAN, confirm: true },
      { now: NOW },
    );
    expect(result).toEqual({ ok: true, id: 'B_new', humanConfirmed: true, supersedesId: 'B1' });
    expect(prisma.buyerInputData.create).toHaveBeenCalledTimes(1);
    const data = prisma.buyerInputData.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      hypothesis_id: 'H1',
      account_name: 'Acme Logistics',
      persona_id: 7,
      contact_email: 'ops.lead@example.com',
      disposition_id: 'D1',
      type: 'impact',
      source: 'call',
      numeric_value: 40,
      unit: 'trailers/day',
      supersedes_id: 'B1',
      human_confirmed: true,
    });
    expect(prisma.buyerInputData.update).not.toHaveBeenCalled();
  });

  it('refuses bid_not_found', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(null);
    expect(await correctBid(prisma, 'B9', { rawBuyerLanguage: 'x', capturedBy: HUMAN })).toEqual({ ok: false, reason: 'bid_not_found' });
    expect(prisma.buyerInputData.create).not.toHaveBeenCalled();
  });

  it('refuses already_superseded when a correction exists', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(storedRow());
    prisma.buyerInputData.findFirst.mockResolvedValue({ id: 'B2' });
    expect(await correctBid(prisma, 'B1', { rawBuyerLanguage: 'x', capturedBy: HUMAN })).toEqual({ ok: false, reason: 'already_superseded' });
    expect(prisma.buyerInputData.create).not.toHaveBeenCalled();
  });

  it('maps a unique violation on supersedes_id to already_superseded', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(storedRow());
    prisma.buyerInputData.findFirst.mockResolvedValue(null);
    prisma.buyerInputData.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    expect(await correctBid(prisma, 'B1', { rawBuyerLanguage: 'x', capturedBy: HUMAN })).toEqual({ ok: false, reason: 'already_superseded' });
  });

  /**
   * B3 (Opus adversarial review, 2026-09-24). Before this fix, an agent's
   * unconfirmed correction could supersede a human-confirmed BID: by the
   * fail-closed rule in bid/select.ts (only human_confirmed && !superseded
   * rows feed resolution), the confirmed evidence would silently drop out
   * of resolution and learning the moment the new, unconfirmed row existed.
   * Mutate the guard back to remove the human_confirmed check and this
   * goes RED.
   */
  it('B3: an agent correcting a human-confirmed row is refused correction_requires_human, no write', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(storedRow({ human_confirmed: true, confirmed_by: 'casey', confirmed_at: NOW }));
    const result = await correctBid(prisma, 'B1', { rawBuyerLanguage: 'the agent guesses forty', capturedBy: AGENT });
    expect(result).toEqual({ ok: false, reason: 'correction_requires_human' });
    expect(prisma.buyerInputData.create).not.toHaveBeenCalled();
    // The pre-check happens before the already_superseded read, not after.
    expect(prisma.buyerInputData.findFirst).not.toHaveBeenCalled();
  });

  it('B3 control: a human can still correct a human-confirmed row', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(storedRow({ human_confirmed: true, confirmed_by: 'casey', confirmed_at: NOW }));
    prisma.buyerInputData.findFirst.mockResolvedValue(null);
    const result = await correctBid(prisma, 'B1', { rawBuyerLanguage: 'actually it is sixty', capturedBy: HUMAN, confirm: true });
    expect(result).toEqual({ ok: true, id: 'B_new', humanConfirmed: true, supersedesId: 'B1' });
  });

  it('B3 control: an agent may still correct its OWN unconfirmed row', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(storedRow({ human_confirmed: false }));
    prisma.buyerInputData.findFirst.mockResolvedValue(null);
    const result = await correctBid(prisma, 'B1', { rawBuyerLanguage: 'revised guess', capturedBy: AGENT });
    expect(result).toEqual({ ok: true, id: 'B_new', humanConfirmed: false, supersedesId: 'B1' });
  });

  it('validates the correction like a capture', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(storedRow());
    prisma.buyerInputData.findFirst.mockResolvedValue(null);
    expect(await correctBid(prisma, 'B1', { rawBuyerLanguage: '  ', capturedBy: HUMAN })).toEqual({
      ok: false,
      field: 'rawBuyerLanguage',
      reason: 'empty_buyer_language',
    });
    expect(await correctBid(prisma, 'B1', { rawBuyerLanguage: 'forty', numericValue: 40, capturedBy: HUMAN })).toEqual({
      ok: false,
      field: 'unit',
      reason: 'unit_required',
    });
  });
});

describe('confirmBid', () => {
  let prisma: Prisma;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('flips false to true with the confirming actor, guarded on human_confirmed: false', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue({ id: 'B1', human_confirmed: false });
    expect(await confirmBid(prisma, 'B1', HUMAN, { now: NOW })).toEqual({ ok: true, id: 'B1', alreadyConfirmed: false });
    expect(prisma.buyerInputData.update).toHaveBeenCalledTimes(1);
    const call = prisma.buyerInputData.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'B1', human_confirmed: false });
    expect(call.data).toEqual({ human_confirmed: true, confirmed_by: 'casey', confirmed_at: NOW });
    expect(Object.keys(call.data)).not.toContain('raw_buyer_language');
  });

  it('refuses an agent', async () => {
    expect(await confirmBid(prisma, 'B1', AGENT)).toEqual({ ok: false, reason: 'not_human' });
    expect(prisma.buyerInputData.findUnique).not.toHaveBeenCalled();
    expect(prisma.buyerInputData.update).not.toHaveBeenCalled();
  });

  it('refuses bid_not_found', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(null);
    expect(await confirmBid(prisma, 'B1', HUMAN)).toEqual({ ok: false, reason: 'bid_not_found' });
  });

  it('is idempotent on an already confirmed row and does not touch it', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue({ id: 'B1', human_confirmed: true });
    expect(await confirmBid(prisma, 'B1', HUMAN)).toEqual({ ok: true, id: 'B1', alreadyConfirmed: true });
    expect(prisma.buyerInputData.update).not.toHaveBeenCalled();
  });

  it('treats a lost race (P2025) as already confirmed', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue({ id: 'B1', human_confirmed: false });
    prisma.buyerInputData.update.mockRejectedValue(Object.assign(new Error('gone'), { code: 'P2025' }));
    expect(await confirmBid(prisma, 'B1', HUMAN)).toEqual({ ok: true, id: 'B1', alreadyConfirmed: true });
  });
});

describe('editSummary', () => {
  let prisma: Prisma;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('moves only normalized_summary while unconfirmed', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue({ id: 'B1', human_confirmed: false });
    expect(await editSummary(prisma, 'B1', '  forty trailers a day past window ')).toEqual({ ok: true, id: 'B1' });
    const call = prisma.buyerInputData.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'B1', human_confirmed: false });
    expect(call.data).toEqual({ normalized_summary: 'forty trailers a day past window' });
  });

  it('refuses a confirmed row without touching it', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue({ id: 'B1', human_confirmed: true });
    expect(await editSummary(prisma, 'B1', 'x')).toEqual({ ok: false, reason: 'bid_confirmed' });
    expect(prisma.buyerInputData.update).not.toHaveBeenCalled();
  });

  it('refuses bid_not_found, and a lost race as bid_confirmed', async () => {
    prisma.buyerInputData.findUnique.mockResolvedValue(null);
    expect(await editSummary(prisma, 'B1', 'x')).toEqual({ ok: false, reason: 'bid_not_found' });
    prisma.buyerInputData.findUnique.mockResolvedValue({ id: 'B1', human_confirmed: false });
    prisma.buyerInputData.update.mockRejectedValue(Object.assign(new Error('gone'), { code: 'P2025' }));
    expect(await editSummary(prisma, 'B1', 'x')).toEqual({ ok: false, reason: 'bid_confirmed' });
  });
});

describe('selectConfirmedBids', () => {
  const b = (id: string, humanConfirmed: boolean, supersedesId: string | null = null): SelectableBid => ({ id, humanConfirmed, supersedesId });

  it('keeps confirmed, unsuperseded rows in input order', () => {
    const rows = [b('B1', true), b('B2', false), b('B3', true)];
    expect(selectConfirmedBids(rows).map((r) => r.id)).toEqual(['B1', 'B3']);
  });

  it('drops an unconfirmed row', () => {
    expect(selectConfirmedBids([b('B1', false)])).toEqual([]);
  });

  it('a confirmed correction replaces the row it supersedes', () => {
    const rows = [b('B1', true), b('B2', true, 'B1')];
    expect(selectConfirmedBids(rows).map((r) => r.id)).toEqual(['B2']);
  });

  it('an UNCONFIRMED correction removes the old evidence and adds none (fail closed)', () => {
    const rows = [b('B1', true), b('B2', false, 'B1')];
    expect(selectConfirmedBids(rows)).toEqual([]);
    expect(supersededIds(rows)).toEqual(new Set(['B1']));
  });

  it('a chain of corrections leaves only the newest confirmed head', () => {
    const rows = [b('B1', true), b('B2', true, 'B1'), b('B3', true, 'B2')];
    expect(selectConfirmedBids(rows).map((r) => r.id)).toEqual(['B3']);
  });

  it('returns nothing for an empty input', () => {
    expect(selectConfirmedBids([])).toEqual([]);
  });
});

describe('bidFromRow and numericValueOf', () => {
  it('reads a Prisma Decimal, a numeric string, a number and null', () => {
    expect(numericValueOf({ toNumber: () => 40.5 })).toBe(40.5);
    expect(numericValueOf('12')).toBe(12);
    expect(numericValueOf(7)).toBe(7);
    expect(numericValueOf(null)).toBeNull();
    expect(numericValueOf(undefined)).toBeNull();
    expect(numericValueOf('forty')).toBeNull();
    expect(numericValueOf(Number.NaN)).toBeNull();
    expect(numericValueOf('')).toBeNull();
  });

  it('maps a stored row to the resolution shape', () => {
    const mapped = bidFromRow(storedRow({ numeric_value: { toNumber: () => 40 }, unit: 'trailers/day', human_confirmed: true, supersedes_id: 'B0' }));
    expect(mapped).toEqual({
      id: 'B1',
      type: 'impact',
      rawBuyerLanguage: 'about forty trailers a day sit past their window',
      numericValue: 40,
      unit: 'trailers/day',
      humanConfirmed: true,
      supersedesId: 'B0',
      metadata: null,
      capturedAt: NOW,
    });
  });
});

describe('structural: capture.ts is append-only', () => {
  const source = readFileSync(path.resolve(__dirname, '../../../src/lib/gap/bid/capture.ts'), 'utf8');

  /** The argument text of every `<delegate>.<method>(` call, by brace matching from the opening paren. */
  function callArguments(delegateMethod: string): string[] {
    const out: string[] = [];
    let from = 0;
    for (;;) {
      const start = source.indexOf(`${delegateMethod}(`, from);
      if (start === -1) break;
      let depth = 0;
      let i = start + delegateMethod.length;
      for (; i < source.length; i += 1) {
        const ch = source[i];
        if (ch === '(' || ch === '{' || ch === '[') depth += 1;
        else if (ch === ')' || ch === '}' || ch === ']') {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      out.push(source.slice(start, i + 1));
      from = i + 1;
    }
    return out;
  }

  it('has exactly two buyerInputData.update sites and no updateMany', () => {
    expect(callArguments('buyerInputData.update')).toHaveLength(2);
    expect(source.match(/buyerInputData\.updateMany\(/g)).toBeNull();
    expect(source.match(/buyerInputData\.upsert\(/g)).toBeNull();
  });

  it('never removes a row', () => {
    expect(source.match(/\.delete(Many)?\s*\(/g)).toBeNull();
    expect(source.match(/buyerInputData\.delete/g)).toBeNull();
    expect(source.match(/\$executeRaw|\$queryRaw/g)).toBeNull();
  });

  it('never writes raw_buyer_language inside an update', () => {
    const updates = callArguments('buyerInputData.update');
    expect(updates).toHaveLength(2);
    for (const call of updates) {
      expect(call.includes('raw_buyer_language')).toBe(false);
      expect(call.includes('rawBuyerLanguage')).toBe(false);
    }
  });

  it('carries no em dash in the source', () => {
    expect(source.includes(String.fromCharCode(0x2014))).toBe(false);
  });
});
