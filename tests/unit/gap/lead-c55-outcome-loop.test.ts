// @vitest-environment node
/**
 * C55 (the commercial-context audit, 2026-10-08): the loop from real outcomes to recommendations. A rejected
 * hypothesis does not recur as a fact (a vault wedge restating it is superseded by the rejection and never
 * externally usable); a seller edit is never buyer evidence; a confirmed buyer quote is buyer_said cited by its
 * disposition id; an unconfirmed row is nothing; a not-now and a referral become attributed advice; a small sample
 * never implies causal uplift; routing's why-now cites the disposition id.
 */
import { describe, expect, it } from 'vitest';
import { guardFacts, outcomeLoop, upliftLine } from '@/lib/gap/learning/outcome-loop';
import { externallyUsable, type ContextClaim } from '@/lib/gap/context/commercial-context';
import { MIN_RELIABLE_SAMPLE } from '@/lib/gap/learning/metrics';
import { buildWhyNow } from '@/lib/gap/routing/explain';

const NOW = new Date('2026-10-08T15:00:00Z');
const K = 'Kestrel Logistics';

describe('C55: the outcome loop', () => {
  it('a rejected hypothesis is marked at the account with its citation, and a vault wedge that restates it is superseded by the rejection, visible but never externally usable; buyer words are untouched', () => {
    const loop = outcomeLoop({
      now: NOW,
      dispositions: [{ id: 'd1', accountName: K, personaEmail: 'd.keller@kestrelgroup.example', responseClass: 'problem_rejected', humanConfirmed: true, at: '2026-09-20T15:00:00.000Z', quote: 'Detention is not our problem; our carriers eat it under the contract.' }],
      hypotheses: [{ id: 'h1', accountName: K, family: 'detention', status: 'rejected', problemHypothesis: 'Kestrel pays detention at the Chattanooga yards because trailers wait at the gate.', resolvedAt: '2026-09-20T15:00:00.000Z', resolutionOutcome: 'rejected', resolvedBy: 'd1' }],
    });
    expect(loop.rejected).toEqual([{ accountName: K, family: 'detention', problemHypothesis: expect.stringContaining('detention'), at: '2026-09-20T15:00:00.000Z', citedBy: ['hypothesis:h1', 'disposition:d1'] }]);
    const wedge: ContextClaim = { claimId: 'w1', sourceId: 'clawd:vault wedge:2026-08-20', sourceKind: 'clawd', authority: 'seller_interpretation', eventAt: null, observedAt: '2026-08-20T00:00:00.000Z', indexedAt: '2026-10-08T13:02:52.000Z', url: null, version: '2026-08-20', completeness: 'complete', visibility: 'external_ok', text: 'Wedge: Kestrel pays detention at the Chattanooga yards because trailers wait at the gate.', claimClass: 'checked_public', about: 'account', subjectId: K };
    const other: ContextClaim = { ...wedge, claimId: 'w2', text: 'Kestrel opens a second cross-dock in Memphis with 40 doors.' };
    const guarded = guardFacts([...loop.claims, wedge, other], loop.rejected);
    const g = guarded.find((c) => c.claimId === 'w1')!;
    expect(g.supersededBy).toBe('rejected:hypothesis:h1');
    expect(g.conflictsWith).toEqual(['hypothesis:h1']);
    expect(g.text).toMatch(/\[rejected Sep 20, 2026: hypothesis:h1, disposition:d1\]$/);
    expect(externallyUsable(guarded).map((c) => c.claimId)).toEqual(['w2']);
    const quote = loop.claims.find((c) => c.claimClass === 'buyer_said')!;
    expect(quote).toMatchObject({ sourceId: 'disposition:d1', authority: 'buyer_words', visibility: 'internal', text: 'd.keller@kestrelgroup.example: Detention is not our problem; our carriers eat it under the contract.' });
    expect(guarded.find((c) => c.claimId === quote.claimId)!.supersededBy).toBeUndefined();
    expect(loop.advice).toEqual([{ accountName: K, personaEmail: 'd.keller@kestrelgroup.example', line: 'The problem was named on Sep 20, 2026; a reply must answer that, never restate the hypothesis.', citedBy: ['disposition:d1'], attribution: 'buyer' }]);
  });

  it('a seller edit is seller_noted and never buyer evidence; an unconfirmed disposition is nothing; a not-now and a referral are advice attributed to the buyer; a meeting outcome never moves a stage; a loss carries its reason', () => {
    const loop = outcomeLoop({
      now: NOW,
      dispositions: [
        { id: 'd2', accountName: K, personaEmail: 'c.ortiz@kestrelgroup.example', responseClass: 'problem_confirmed', humanConfirmed: false, at: '2026-10-01T15:00:00.000Z', quote: 'AI thought they said yes.' },
        { id: 'd3', accountName: K, personaEmail: 'c.ortiz@kestrelgroup.example', responseClass: 'timing', humanConfirmed: true, at: '2026-10-02T15:00:00.000Z', quote: null, resumeAt: '2027-01-15T00:00:00.000Z' },
        { id: 'd4', accountName: K, personaEmail: 'c.ortiz@kestrelgroup.example', responseClass: 'referral', humanConfirmed: true, at: '2026-10-03T15:00:00.000Z', quote: null, referral: { name: 'Sam Rowe', title: 'VP Transportation' } },
        { id: 'd5', accountName: 'Harbor Co', personaEmail: null, responseClass: 'closed_lost', humanConfirmed: true, at: '2026-10-04T15:00:00.000Z', quote: null, reason: 'went with the incumbent YMS renewal' },
      ],
      hypotheses: [],
      sellerEdits: [{ id: 'e1', accountName: K, at: '2026-10-05T15:00:00.000Z', kind: 'seller_edit', text: 'They are clearly frustrated with Open Dock.' }],
      meetings: [{ id: 'm1', accountName: K, at: '2026-10-06T15:00:00.000Z', outcome: 'agreed to a site walk in November', basis: 'self_reported' }],
    });
    expect(loop.claims.filter((c) => c.sourceId === 'disposition:d2')).toEqual([]);
    const edit = loop.claims.find((c) => c.sourceId === 'seller:seller_edit:e1')!;
    expect(edit).toMatchObject({ claimClass: 'seller_noted', authority: 'seller_interpretation', visibility: 'internal' });
    expect(externallyUsable(loop.claims)).toEqual([]);
    expect(loop.advice.map((a) => [a.attribution, a.line])).toEqual([
      ['buyer', 'Not now: resume after Jan 14, 2027 (the buyer said so on Oct 2, 2026).'],
      ['buyer', 'Referred to Sam Rowe, VP Transportation on Oct 3, 2026.'],
      ['seller', 'A meeting outcome is on record (Oct 6, 2026); the next step follows it, and no stage moves on it.'],
    ]);
    expect(loop.claims.find((c) => c.sourceId === 'disposition:d5')!.text).toBe('lost on Oct 4, 2026: went with the incumbent YMS renewal');
    expect(loop.claims.find((c) => c.sourceId === 'meeting:m1')!.text).toContain('(basis: self_reported)');
  });

  it('a small sample never implies causal uplift; routing cites the disposition id and the referral in why-now', () => {
    expect(upliftLine(0, 0)).toBe('no sends yet, so nothing replied: no rate, no claim.');
    expect(upliftLine(3, 7)).toBe(`3 of 7 replied: an early observation at n under ${MIN_RELIABLE_SAMPLE}, not a rate and not a cause.`);
    expect(upliftLine(30, 100, 'booked')).toBe('30 of 100 booked (30%): observed, not causal; a comparison needs a control.');
    const inputs = {
      now: NOW, freshness: { evidenceMaxAgeDays: 45 }, hypothesis: null, signals: { freshTriggers: [] },
      comms: { lastDisposition: { id: 'd4', responseClass: 'referral', at: new Date('2026-10-03T15:00:00.000Z'), referral: { name: 'Sam Rowe', title: 'VP Transportation' } } },
    } as never;
    expect(buildWhyNow(inputs)).toContain('Last disposition referral 5 d ago [disposition:d4], referred to Sam Rowe (VP Transportation).');
    const timing = { ...(inputs as object), comms: { lastDisposition: { id: 'd3', responseClass: 'timing', at: new Date('2026-10-02T15:00:00.000Z'), resumeAt: new Date('2027-01-15T00:00:00.000Z') } } } as never;
    expect(buildWhyNow(timing)).toContain('Last disposition timing 6 d ago [disposition:d3], resume after 2027-01-15.');
  });
});
