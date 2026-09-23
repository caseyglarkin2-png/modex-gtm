import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { selectConfirmedBids } from '@/lib/gap/bid/select';
import { DISPOSITION_OUTCOMES, newestConfirmedDisposition } from '@/lib/gap/hypothesis/machine';
import {
  BASE_CALL_OR_MEETING,
  BASE_EMAIL_OR_LINKEDIN,
  CONFIDENCE_CAP,
  PARTIAL_PENALTY,
  QUOTE_BONUS,
  ROOT_CAUSE_BONUS,
  resolutionRecord,
  scoreResolution,
  type ResolutionBid,
  type ResolutionDisposition,
} from '@/lib/gap/hypothesis/resolution';
import { CHANNELS } from '@/lib/gap/taxonomy';

const T0 = new Date('2026-09-20T12:00:00.000Z');
const T1 = new Date('2026-09-21T12:00:00.000Z');
const T2 = new Date('2026-09-22T12:00:00.000Z');
const RESUME = new Date('2027-01-15T00:00:00.000Z');

function disp(overrides: Partial<ResolutionDisposition> = {}): ResolutionDisposition {
  return {
    id: 'D1',
    responseClass: 'problem_confirmed',
    channel: 'call',
    humanConfirmed: true,
    createdAt: T1,
    ...overrides,
  };
}

function bid(overrides: Partial<ResolutionBid> = {}): ResolutionBid {
  return {
    id: 'B1',
    type: 'business_problem',
    rawBuyerLanguage: 'we lose an hour a shift finding trailers',
    numericValue: null,
    unit: null,
    humanConfirmed: true,
    supersedesId: null,
    metadata: null,
    capturedAt: T1,
    ...overrides,
  };
}

describe('scoreResolution: outcome', () => {
  it('problem_confirmed resolves confirmed at base 70 on a call with no BID', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [] });
    expect(score.outcome).toBe('confirmed');
    expect(score.confidence).toBe(BASE_CALL_OR_MEETING);
    expect(score.refusal).toBeNull();
    expect(score.basis).toEqual({
      dispositionIds: ['D1'],
      bidIds: [],
      quote: false,
      rootCauseConfirmed: false,
      orphanRootCauseBidIds: [],
      impact: 'none',
    });
    expect(score.reasons).toContain('base:70:call');
    expect(score.resumeAt).toBeUndefined();
    expect(score.retarget).toBeUndefined();
    expect(score.referral).toBeUndefined();
  });

  it.each([
    ['call', BASE_CALL_OR_MEETING],
    ['meeting', BASE_CALL_OR_MEETING],
    ['email', BASE_EMAIL_OR_LINKEDIN],
    ['linkedin', BASE_EMAIL_OR_LINKEDIN],
  ])('channel %s scores base %d', (channel, base) => {
    expect(scoreResolution({ dispositions: [disp({ channel })], bids: [] }).confidence).toBe(base);
  });

  it('every taxonomy channel has a base', () => {
    for (const channel of CHANNELS) {
      const score = scoreResolution({ dispositions: [disp({ channel })], bids: [] });
      expect(score.confidence, channel).not.toBeNull();
      expect(score.reasons.some((r) => r.startsWith('base:') && r.endsWith(`:${channel}`)), channel).toBe(true);
    }
  });

  it('an unknown channel scores as the weakest, never higher, and says so', () => {
    const score = scoreResolution({ dispositions: [disp({ channel: 'sms' })], bids: [] });
    expect(score.confidence).toBe(BASE_EMAIL_OR_LINKEDIN);
    expect(score.reasons).toContain('base:60:unknown_channel:sms');
  });

  it('problem_partially_confirmed resolves partially_confirmed at base minus 20', () => {
    const score = scoreResolution({ dispositions: [disp({ responseClass: 'problem_partially_confirmed', channel: 'email' })], bids: [] });
    expect(score.outcome).toBe('partially_confirmed');
    expect(score.confidence).toBe(BASE_EMAIL_OR_LINKEDIN - PARTIAL_PENALTY);
    expect(score.reasons).toContain(`partial:-${PARTIAL_PENALTY}`);
  });

  it('problem_rejected resolves rejected with no confidence', () => {
    const score = scoreResolution({ dispositions: [disp({ responseClass: 'problem_rejected' })], bids: [] });
    expect(score.outcome).toBe('rejected');
    expect(score.confidence).toBeNull();
    expect(score.reasons).toContain('rejected:no_confidence');
    expect(score.basis.dispositionIds).toEqual(['D1']);
  });

  it('the newest confirmed problem_* disposition decides, agreeing with the machine', () => {
    const rows = [
      disp({ id: 'D1', responseClass: 'problem_confirmed', createdAt: T0 }),
      disp({ id: 'D2', responseClass: 'problem_rejected', createdAt: T2 }),
      disp({ id: 'D3', responseClass: 'problem_partially_confirmed', createdAt: T1 }),
    ];
    const score = scoreResolution({ dispositions: rows, bids: [] });
    expect(score.outcome).toBe('rejected');
    expect(score.basis.dispositionIds).toEqual(['D2', 'D3', 'D1']);
    const deciding = newestConfirmedDisposition(rows);
    expect(deciding && DISPOSITION_OUTCOMES[deciding.responseClass]).toBe(score.outcome);
  });

  it('ties on createdAt go to the later entry, as in the machine', () => {
    const rows = [
      disp({ id: 'D1', responseClass: 'problem_rejected', createdAt: T1 }),
      disp({ id: 'D2', responseClass: 'problem_confirmed', createdAt: T1 }),
    ];
    expect(scoreResolution({ dispositions: rows, bids: [] }).outcome).toBe('confirmed');
  });

  it('non-problem dispositions do not decide; outcome null with no_confirmed_disposition', () => {
    const score = scoreResolution({ dispositions: [disp({ responseClass: 'request_information' })], bids: [bid({ type: 'impact' })] });
    expect(score.outcome).toBeNull();
    expect(score.confidence).toBeNull();
    expect(score.refusal).toBeNull();
    expect(score.reasons).toContain('no_confirmed_disposition');
    expect(score.basis.dispositionIds).toEqual([]);
    expect(score.basis.impact).toBe('acknowledged');
  });

  it('no dispositions at all: outcome null, nothing else set', () => {
    const score = scoreResolution({ dispositions: [], bids: [] });
    expect(score).toMatchObject({ outcome: null, confidence: null, refusal: null });
    expect(score.reasons).toEqual(['no_confirmed_disposition']);
  });

  it('reads the channel through channelOf when given', () => {
    const score = scoreResolution({ dispositions: [disp({ channel: 'email' })], bids: [], channelOf: () => 'meeting' });
    expect(score.confidence).toBe(BASE_CALL_OR_MEETING);
  });
});

describe('scoreResolution: confidence bonuses', () => {
  it('+15 for a confirmed business_problem BID with the buyer words', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid()] });
    expect(score.confidence).toBe(BASE_CALL_OR_MEETING + QUOTE_BONUS);
    expect(score.basis.quote).toBe(true);
    expect(score.basis.bidIds).toEqual(['B1']);
    expect(score.reasons).toContain(`quote:+${QUOTE_BONUS}:B1`);
  });

  it('+15 for a current_state quote too', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid({ type: 'current_state' })] });
    expect(score.confidence).toBe(BASE_CALL_OR_MEETING + QUOTE_BONUS);
    expect(score.basis.quote).toBe(true);
  });

  it('a quote on any other type is not the quote bonus', () => {
    for (const type of ['impact', 'metric', 'future_state', 'priority', 'constraint', 'objection']) {
      const score = scoreResolution({ dispositions: [disp()], bids: [bid({ type })] });
      expect(score.basis.quote, type).toBe(false);
      expect(score.confidence, type).toBe(BASE_CALL_OR_MEETING);
    }
  });

  it('a business_problem BID with blank language is not a quote', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid({ rawBuyerLanguage: '   ' })] });
    expect(score.basis.quote).toBe(false);
    expect(score.confidence).toBe(BASE_CALL_OR_MEETING);
  });

  it('+10 for a confirmed root_cause BID when the problem is confirmed', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid({ id: 'B2', type: 'root_cause', rawBuyerLanguage: 'the guard shack does it on paper' })] });
    expect(score.confidence).toBe(BASE_CALL_OR_MEETING + ROOT_CAUSE_BONUS);
    expect(score.basis.rootCauseConfirmed).toBe(true);
    expect(score.basis.orphanRootCauseBidIds).toEqual([]);
    expect(score.reasons).toContain(`root_cause:+${ROOT_CAUSE_BONUS}:B2`);
    expect(resolutionRecord(score).rootCause).toBe('confirmed');
  });

  it('call + quote + root cause lands exactly on the 95 cap', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid(), bid({ id: 'B2', type: 'root_cause' })] });
    expect(score.confidence).toBe(CONFIDENCE_CAP);
    expect(BASE_CALL_OR_MEETING + QUOTE_BONUS + ROOT_CAUSE_BONUS).toBe(CONFIDENCE_CAP);
  });

  it('never exceeds the cap for any channel and BID mix', () => {
    const mixes: ResolutionBid[][] = [
      [],
      [bid()],
      [bid({ id: 'B2', type: 'root_cause' })],
      [bid(), bid({ id: 'B2', type: 'root_cause' }), bid({ id: 'B3', type: 'current_state' }), bid({ id: 'B4', type: 'root_cause' })],
    ];
    for (const channel of CHANNELS) {
      for (const bids of mixes) {
        for (const responseClass of ['problem_confirmed', 'problem_partially_confirmed']) {
          const score = scoreResolution({ dispositions: [disp({ channel, responseClass })], bids });
          expect(score.confidence).not.toBeNull();
          expect(score.confidence as number).toBeLessThanOrEqual(CONFIDENCE_CAP);
          expect(score.confidence as number).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('partial: the same bonuses minus 20 (call + quote + root cause = 75)', () => {
    const score = scoreResolution({
      dispositions: [disp({ responseClass: 'problem_partially_confirmed' })],
      bids: [bid(), bid({ id: 'B2', type: 'root_cause' })],
    });
    expect(score.confidence).toBe(BASE_CALL_OR_MEETING + QUOTE_BONUS + ROOT_CAUSE_BONUS - PARTIAL_PENALTY);
    expect(score.basis.rootCauseConfirmed).toBe(true);
  });

  it('a root_cause BID with a rejected problem is an orphan: no bonus, named in reasons', () => {
    const score = scoreResolution({ dispositions: [disp({ responseClass: 'problem_rejected' })], bids: [bid({ id: 'B2', type: 'root_cause' })] });
    expect(score.confidence).toBeNull();
    expect(score.basis.rootCauseConfirmed).toBe(false);
    expect(score.basis.orphanRootCauseBidIds).toEqual(['B2']);
    expect(score.reasons).toContain('orphan:true:B2');
    expect(resolutionRecord(score).rootCause).toBe('orphan');
  });

  it('a root_cause BID with no problem disposition is an orphan', () => {
    const score = scoreResolution({ dispositions: [], bids: [bid({ id: 'B2', type: 'root_cause' })] });
    expect(score.basis.orphanRootCauseBidIds).toEqual(['B2']);
    expect(score.reasons).toContain('orphan:true:B2');
  });
});

describe('scoreResolution: impact', () => {
  it('acknowledged when an impact BID is confirmed without a number', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid({ id: 'B2', type: 'impact' })] });
    expect(score.basis.impact).toBe('acknowledged');
    expect(score.basis.quantified).toBeUndefined();
    expect(score.reasons).toContain('impact:acknowledged');
    expect(resolutionRecord(score).impact).toBe('acknowledged');
  });

  it('quantified when an impact or metric BID carries a number and a unit, citing the bid ids', () => {
    const score = scoreResolution({
      dispositions: [disp()],
      bids: [
        bid({ id: 'B2', type: 'impact', numericValue: 40, unit: ' trailers/day ' }),
        bid({ id: 'B3', type: 'metric', numericValue: 48, unit: 'minutes' }),
        bid({ id: 'B4', type: 'metric', numericValue: 12, unit: null }),
      ],
    });
    expect(score.basis.impact).toBe('quantified');
    expect(score.basis.quantified).toEqual({ value: 40, unit: 'trailers/day', bidIds: ['B2', 'B3'] });
    expect(score.reasons).toContain('impact:quantified:B2,B3');
    expect(resolutionRecord(score).quantified).toEqual({ value: 40, unit: 'trailers/day', bidIds: ['B2', 'B3'] });
  });

  it('a metric without a unit does not quantify, and without an impact BID the impact is none', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid({ id: 'B4', type: 'metric', numericValue: 12, unit: null })] });
    expect(score.basis.impact).toBe('none');
  });

  it('a number on a non-quantifiable type does not quantify', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid({ type: 'current_state', numericValue: 40, unit: 'doors' })] });
    expect(score.basis.impact).toBe('none');
  });
});

describe('scoreResolution: side signals from the newest disposition', () => {
  it('timing sets resumeAt from metadata.resumeAt', () => {
    const rows = [
      disp({ id: 'D1', responseClass: 'problem_confirmed', createdAt: T0 }),
      disp({ id: 'D2', responseClass: 'timing', createdAt: T1, metadata: { resumeAt: RESUME.toISOString() } }),
    ];
    const score = scoreResolution({ dispositions: rows, bids: [] });
    expect(score.outcome).toBe('confirmed');
    expect(score.resumeAt).toEqual(RESUME);
    expect(score.reasons).toContain(`resume_at:${RESUME.toISOString()}`);
  });

  it('falls back to ai_suggested.resumeAt, and metadata wins when both are set (as routing/inputs.ts reads it)', () => {
    const fromAi = scoreResolution({
      dispositions: [disp({ responseClass: 'timing', aiSuggested: { resumeAt: RESUME.toISOString() } })],
      bids: [],
    });
    expect(fromAi.resumeAt).toEqual(RESUME);
    const later = new Date('2027-03-01T00:00:00.000Z');
    const both = scoreResolution({
      dispositions: [disp({ responseClass: 'timing', aiSuggested: { resumeAt: RESUME.toISOString() }, metadata: { resumeAt: later } })],
      bids: [],
    });
    expect(both.resumeAt).toEqual(later);
  });

  it('timing without a date names it and sets nothing', () => {
    const score = scoreResolution({ dispositions: [disp({ responseClass: 'timing' })], bids: [] });
    expect(score.resumeAt).toBeUndefined();
    expect(score.reasons).toContain('timing_without_resume_at:D1');
    const bad = scoreResolution({ dispositions: [disp({ responseClass: 'timing', metadata: { resumeAt: 'someday' } })], bids: [] });
    expect(bad.resumeAt).toBeUndefined();
  });

  it('an older timing behind a newer problem_confirmed does not set resumeAt', () => {
    const rows = [
      disp({ id: 'D1', responseClass: 'timing', createdAt: T0, metadata: { resumeAt: RESUME } }),
      disp({ id: 'D2', responseClass: 'problem_confirmed', createdAt: T1 }),
    ];
    const score = scoreResolution({ dispositions: rows, bids: [] });
    expect(score.outcome).toBe('confirmed');
    expect(score.resumeAt).toBeUndefined();
  });

  it('wrong_person asks for a re-target', () => {
    const score = scoreResolution({ dispositions: [disp({ responseClass: 'wrong_person' })], bids: [] });
    expect(score.retarget).toBe(true);
    expect(score.outcome).toBeNull();
    expect(score.reasons).toContain('retarget:D1');
  });

  it('referral names the BID that names the person', () => {
    const score = scoreResolution({
      dispositions: [disp({ responseClass: 'referral' })],
      bids: [
        bid({ id: 'B1' }),
        bid({ id: 'B2', type: 'constraint', rawBuyerLanguage: 'talk to Dana, she runs the yards', metadata: { referral: { name: 'Dana', title: 'Director of Yard Ops' } } }),
      ],
    });
    expect(score.referral).toEqual({ fromBidId: 'B2', name: 'Dana', title: 'Director of Yard Ops' });
    expect(score.reasons).toContain('referral:B2');
  });

  it('referral without a naming BID falls back to the disposition metadata and says it is unnamed', () => {
    const score = scoreResolution({
      dispositions: [disp({ responseClass: 'referral', aiSuggested: { referral: { name: 'Dana' } } })],
      bids: [],
    });
    expect(score.referral).toEqual({ fromBidId: null, name: 'Dana' });
    expect(score.reasons).toContain('referral_unnamed:D1');
    const bare = scoreResolution({ dispositions: [disp({ responseClass: 'referral' })], bids: [] });
    expect(bare.referral).toEqual({ fromBidId: null });
  });
});

describe('scoreResolution: refuses unconfirmed and superseded input (belt and braces)', () => {
  it('one unconfirmed problem_confirmed disposition yields outcome null, not confirmed', () => {
    const score = scoreResolution({ dispositions: [disp({ humanConfirmed: false })], bids: [] });
    expect(score.outcome).toBeNull();
    expect(score.confidence).toBeNull();
    expect(score.refusal).toBe('unconfirmed_input');
    expect(score.reasons).toEqual(['unconfirmed_input:disposition:D1']);
    expect(score.basis.dispositionIds).toEqual([]);
  });

  it('an unconfirmed disposition next to a confirmed one still refuses the whole call', () => {
    const score = scoreResolution({
      dispositions: [disp({ id: 'D1' }), disp({ id: 'D2', humanConfirmed: false, createdAt: T2 })],
      bids: [],
    });
    expect(score.outcome).toBeNull();
    expect(score.refusal).toBe('unconfirmed_input');
    expect(score.reasons).toEqual(['unconfirmed_input:disposition:D2']);
  });

  it('an unconfirmed BID refuses the call: the quote bonus can only come from confirmed BIDs', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid({ humanConfirmed: false })] });
    expect(score.outcome).toBeNull();
    expect(score.confidence).toBeNull();
    expect(score.refusal).toBe('unconfirmed_input');
    expect(score.reasons).toEqual(['unconfirmed_input:bid:B1']);
    expect(score.basis.quote).toBe(false);
  });

  it('a BID the input itself supersedes refuses the call', () => {
    const score = scoreResolution({ dispositions: [disp()], bids: [bid({ id: 'B1' }), bid({ id: 'B2', supersedesId: 'B1' })] });
    expect(score.outcome).toBeNull();
    expect(score.refusal).toBe('superseded_input');
    expect(score.reasons).toEqual(['superseded_input:bid:B1']);
  });
});

describe('selectConfirmedBids feeding scoreResolution', () => {
  it('an unconfirmed quote is dropped by the filter and never scores', () => {
    const rows = [bid({ id: 'B1', humanConfirmed: false })];
    const score = scoreResolution({ dispositions: [disp()], bids: selectConfirmedBids(rows) });
    expect(score.outcome).toBe('confirmed');
    expect(score.confidence).toBe(BASE_CALL_OR_MEETING);
    expect(score.basis.quote).toBe(false);
    expect(score.basis.bidIds).toEqual([]);
  });

  it('a confirmed quote superseded by an UNCONFIRMED correction scores as no quote (fail closed)', () => {
    const rows = [bid({ id: 'B1', humanConfirmed: true }), bid({ id: 'B2', humanConfirmed: false, supersedesId: 'B1' })];
    const selected = selectConfirmedBids(rows);
    expect(selected).toEqual([]);
    const score = scoreResolution({ dispositions: [disp()], bids: selected });
    expect(score.confidence).toBe(BASE_CALL_OR_MEETING);
    expect(score.basis.quote).toBe(false);
  });

  it('a confirmed correction scores in place of the row it corrects', () => {
    const rows = [
      bid({ id: 'B1', type: 'impact', numericValue: 30, unit: 'trailers/day' }),
      bid({ id: 'B2', type: 'impact', numericValue: 40, unit: 'trailers/day', supersedesId: 'B1' }),
    ];
    const score = scoreResolution({ dispositions: [disp()], bids: selectConfirmedBids(rows) });
    expect(score.basis.quantified).toEqual({ value: 40, unit: 'trailers/day', bidIds: ['B2'] });
    expect(score.basis.bidIds).toEqual(['B2']);
  });
});

describe('resolutionRecord', () => {
  it('shapes a confirmed score for the resolution JSON', () => {
    const score = scoreResolution({
      dispositions: [disp({ channel: 'email' })],
      bids: [bid(), bid({ id: 'B2', type: 'root_cause' }), bid({ id: 'B3', type: 'impact', numericValue: 40, unit: 'trailers/day' })],
    });
    expect(resolutionRecord(score)).toEqual({
      problem: 'confirmed',
      rootCause: 'confirmed',
      impact: 'quantified',
      confidence: BASE_EMAIL_OR_LINKEDIN + QUOTE_BONUS + ROOT_CAUSE_BONUS,
      quote: true,
      dispositionIds: ['D1'],
      bidIds: ['B1', 'B2', 'B3'],
      quantified: { value: 40, unit: 'trailers/day', bidIds: ['B3'] },
    });
  });

  it('maps partial, rejected and null outcomes', () => {
    expect(resolutionRecord(scoreResolution({ dispositions: [disp({ responseClass: 'problem_partially_confirmed' })], bids: [] })).problem).toBe('partial');
    expect(resolutionRecord(scoreResolution({ dispositions: [disp({ responseClass: 'problem_rejected' })], bids: [] })).problem).toBe('rejected');
    const none = resolutionRecord(scoreResolution({ dispositions: [], bids: [] }));
    expect(none).toEqual({
      problem: null,
      rootCause: 'unknown',
      impact: 'none',
      confidence: null,
      quote: false,
      dispositionIds: [],
      bidIds: [],
      quantified: null,
    });
  });
});

describe('structural', () => {
  it('resolution.ts is pure: no prisma, no fetch, no clock, no em dash', () => {
    const source = readFileSync(path.resolve(__dirname, '../../../src/lib/gap/hypothesis/resolution.ts'), 'utf8');
    expect(source).not.toMatch(/prisma|@prisma\/client|fetch\(|Date\.now\(\)|new Date\(\)/);
    expect(source.includes(String.fromCharCode(0x2014))).toBe(false);
  });
});
