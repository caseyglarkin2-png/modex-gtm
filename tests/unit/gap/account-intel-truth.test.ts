/**
 * The TRUTH CONTRACT of account intelligence (2026-09-29): every material
 * statement is exactly one of BUYER_CONFIRMED, VERIFIED_PUBLIC,
 * MODELED_ESTIMATE, INFERENCE, UNKNOWN, CONTRADICTED, and the type system plus
 * a validator make a mislabeled statement impossible to render.
 */
import { describe, expect, it } from 'vitest';
import { statementProblems, sectionStatus, orderStatements, type Statement } from '@/lib/gap/account-intel/truth';

const src = (kind: 'evidence' | 'bid' | 'hubspot' | 'audit' | 'gap', over: Record<string, unknown> = {}) => ({ kind, ref: 'r1', label: 'x', url: kind === 'evidence' ? 'https://example.com/a' : null, at: '2026-09-01T00:00:00Z', ...over });
const NOW = new Date('2026-09-29T12:00:00Z');

describe('a statement must carry what its class requires', () => {
  it('VERIFIED_PUBLIC needs a source-backed piece of evidence', () => {
    expect(statementProblems({ text: 'Acme opened a DC in Reno.', truth: 'VERIFIED_PUBLIC', sources: [] })).toEqual(['verified_public_without_source']);
    expect(statementProblems({ text: 'Acme opened a DC in Reno.', truth: 'VERIFIED_PUBLIC', sources: [src('gap')] })).toEqual(['verified_public_without_source']);
    expect(statementProblems({ text: 'Acme opened a DC in Reno.', truth: 'VERIFIED_PUBLIC', sources: [src('evidence')] })).toEqual([]);
  });
  it('BUYER_CONFIRMED needs a confirmed buyer input', () => {
    expect(statementProblems({ text: 'PINC at all 12 plants', truth: 'BUYER_CONFIRMED', sources: [src('evidence')] })).toEqual(['buyer_confirmed_without_bid']);
    expect(statementProblems({ text: 'PINC at all 12 plants', truth: 'BUYER_CONFIRMED', sources: [src('bid')] })).toEqual([]);
  });
  it('MODELED_ESTIMATE needs inputs, formula, range and assumptions (no fake precision)', () => {
    expect(statementProblems({ text: '~40 trailer moves a day', truth: 'MODELED_ESTIMATE', sources: [] })).toEqual(['modeled_without_model']);
    const model = { inputs: { docks: 40 }, formula: 'docks x turns', range: [30, 55] as [number, number], unit: 'moves/day', assumptions: ['1 turn per dock per shift'] };
    expect(statementProblems({ text: '30-55 trailer moves a day', truth: 'MODELED_ESTIMATE', sources: [], model })).toEqual([]);
    expect(statementProblems({ text: '42 trailer moves a day', truth: 'MODELED_ESTIMATE', sources: [], model: { ...model, range: [42, 42] as [number, number] } })).toEqual(['modeled_point_estimate']);
  });
  it('INFERENCE must be falsifiable; CONTRADICTED must name what contradicts it', () => {
    expect(statementProblems({ text: 'Handoffs may slow the yard.', truth: 'INFERENCE', sources: [] })).toEqual(['inference_not_falsifiable']);
    expect(statementProblems({ text: 'Handoffs may slow the yard.', truth: 'INFERENCE', sources: [], falsifiableBy: 'Arrivals are scheduled already.' })).toEqual([]);
    expect(statementProblems({ text: 'They run PINC.', truth: 'CONTRADICTED', sources: [src('evidence')] })).toEqual(['contradicted_without_counter']);
  });
  it('UNKNOWN is a first-class answer and needs nothing', () => {
    expect(statementProblems({ text: 'Current YMS', truth: 'UNKNOWN', sources: [] })).toEqual([]);
  });
});

describe('section status (no score)', () => {
  const v = (at = '2026-09-20T00:00:00Z'): Statement => ({ text: 'fact', truth: 'VERIFIED_PUBLIC', sources: [src('evidence', { at })], asOf: at });
  it('CONTRADICTED wins while anything is contradicted', () => {
    expect(sectionStatus([v(), { text: 'x', truth: 'CONTRADICTED', sources: [src('evidence')], contradictedBy: [src('bid')] }], [], 90, NOW)).toBe('CONTRADICTED');
  });
  it('KNOWN with verified truth and nothing open; PARTIAL with open unknowns; MODELED when only modeled or inferred; UNKNOWN when nothing', () => {
    expect(sectionStatus([v()], [], 90, NOW)).toBe('KNOWN');
    expect(sectionStatus([v()], ['Which YMS?'], 90, NOW)).toBe('PARTIAL');
    expect(sectionStatus([{ text: 'x', truth: 'INFERENCE', sources: [], falsifiableBy: 'y' }], [], 90, NOW)).toBe('MODELED');
    expect(sectionStatus([], ['everything'], 90, NOW)).toBe('UNKNOWN');
  });
  it('STALE when the newest verified truth is older than the section freshness', () => {
    expect(sectionStatus([v('2026-01-01T00:00:00Z')], [], 90, NOW)).toBe('STALE');
  });
});

describe('precedence: buyer truth outranks public inference, contradictions stay visible', () => {
  it('orders buyer confirmed, contradicted, verified, modeled, inference, unknown', () => {
    const s: Statement[] = [
      { text: 'u', truth: 'UNKNOWN', sources: [] },
      { text: 'i', truth: 'INFERENCE', sources: [], falsifiableBy: 'f' },
      { text: 'v', truth: 'VERIFIED_PUBLIC', sources: [src('evidence')] },
      { text: 'b', truth: 'BUYER_CONFIRMED', sources: [src('bid')] },
      { text: 'c', truth: 'CONTRADICTED', sources: [src('evidence')], contradictedBy: [src('bid')] },
    ];
    expect(orderStatements(s).map((x) => x.text)).toEqual(['b', 'c', 'v', 'i', 'u']);
  });
});
