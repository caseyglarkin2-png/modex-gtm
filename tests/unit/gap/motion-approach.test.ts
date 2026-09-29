/**
 * ONE approach decision (review E P1): the account motion, the cohort opportunity cards and the six-line brief
 * all call decideApproach, so they cannot disagree. Gates first; "do not contact yet" is first-class.
 */
import { describe, expect, it } from 'vitest';
import { decideApproach, type ApproachInput } from '@/lib/gap/motion/approach';

const base: ApproachInput = { deal: 'CLEAR', contradicted: false, conversation: null, touchHold: null, verifiedFact: true, reachable: true, source: null };
const kind = (over: Partial<ApproachInput>) => decideApproach({ ...base, ...over }).kind;

describe('decideApproach', () => {
  it('deal gates first', () => {
    expect(kind({ deal: 'ACTIVE', conversation: { who: 'a', responseClass: 'meeting_accepted', at: '2026-09-01' } })).toBe('IN_DEAL');
    expect(kind({ deal: 'UNKNOWN' })).toBe('NO_GOOD_MOTION');
    expect(kind({ deal: 'NOT_READ' })).toBe('NO_GOOD_MOTION');
  });
  it('a buyer "no", "not now" or "stop" is never a follow-up', () => {
    for (const c of ['do_not_contact', 'meeting_declined', 'problem_rejected', 'not_priority']) {
      const a = decideApproach({ ...base, conversation: { who: 'dana@acme.example', responseClass: c, at: '2026-09-20T00:00:00Z' } });
      expect(a.kind).toBe('NO_GOOD_MOTION');
      expect(a.why).toMatch(/No new outreach/);
    }
    expect(kind({ conversation: { who: 'dana', responseClass: 'request_information', at: '2026-09-20' } })).toBe('FOLLOW_UP');
  });
  it('a contradicted story, a first touch already out, or nobody reachable holds', () => {
    expect(kind({ contradicted: true })).toBe('NO_GOOD_MOTION');
    expect(decideApproach({ ...base, touchHold: 'In motion: Bob got a first touch on 2026-09-25. One cold email motion at a time.' }).why).toMatch(/^Do not contact yet: In motion: Bob/);
    expect(kind({ reachable: false })).toBe('NO_GOOD_MOTION');
  });
  it('a verified fact leads; the relationship is an optional opener', () => {
    const a = decideApproach({ ...base, source: { sourceType: 'conference', context: 'Met at Inland26', name: 'Inland26' } });
    expect(a).toEqual({ kind: 'FACT_LED', why: 'A verified fact to open with. Optional opener: Met at Inland26.' });
  });
  it('no fact: referral, then any real relationship (met or a relational source such as a newsletter), else hold', () => {
    expect(kind({ verifiedFact: false, source: { sourceType: 'referral', context: 'Pat introduced us', name: 'Referrals' } })).toBe('REFERRAL_LED');
    expect(kind({ verifiedFact: false, source: { sourceType: 'conference', context: null, name: 'Inland26' } })).toBe('RELATIONSHIP_LED');
    expect(kind({ verifiedFact: false, source: { sourceType: 'newsletter', context: 'MMYQB subscriber', name: 'MMYQB' } })).toBe('RELATIONSHIP_LED');
    expect(kind({ verifiedFact: false, source: { sourceType: 'crm_list', context: null, name: 'HubSpot list' } })).toBe('NO_GOOD_MOTION');
    expect(kind({ verifiedFact: false })).toBe('NO_GOOD_MOTION');
  });
});
