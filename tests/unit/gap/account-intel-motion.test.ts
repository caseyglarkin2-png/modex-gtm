/**
 * Release E: INTELLIGENCE INTO MOTION. The brief names one motion, gates first:
 *   IN_DEAL          an open deal is worked from the deal, never cold
 *   NO_GOOD_MOTION   "do not contact yet" is a first-class answer (deal state unreadable, contradicted story,
 *                    nobody reachable, nothing true to say)
 *   FOLLOW_UP        a live conversation
 *   REFERRAL_LED     someone referred Casey in
 *   RELATIONSHIP_LED Casey met them (conference, relationship); a newsletter subscription is context, not a motion
 *   FACT_LED         a live verified fact AND a hypothesis grounded in it
 * The motion never overrides a gate: every send still runs its own checks at the click.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';

const NOW = new Date('2026-09-29T12:00:00Z');
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-10T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const hyp = { id: 'h1', status: 'draft', observation: fact.quote, problem: 'My guess is that inbound arrivals pile up at the gate.', rootCauses: [], impacts: [], falsification: ['How are arrivals staged?'], whatANoMeans: 'Arrivals flow.', primarySignalId: 'f1' };
const person = { id: 1, name: 'Dana Ops', title: 'VP Distribution', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: [], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact], signals: [], lastResearch: null, hypotheses: [hyp], bids: [], personas: [person], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  ...over,
});
const motion = (over: Partial<AccountInputs> = {}) => buildAccountBrief(inputs(over), NOW).motion;

describe('account motion', () => {
  it('a live verified fact with a grounded hypothesis and a reachable person is FACT_LED', () => {
    expect(motion()).toMatchObject({ type: 'FACT_LED', who: 'Dana Ops' });
  });
  it('an open deal is IN_DEAL, whatever else is true', () => {
    expect(motion({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'Acme pilot', stage: 'discovery' }] }, conversation: { who: 'dana@acme.example', responseClass: 'positive', at: '2026-09-20T00:00:00Z' } })).toMatchObject({ type: 'IN_DEAL' });
  });
  it('an unreadable deal state, a contradicted story, or nobody reachable is NO_GOOD_MOTION with the reason', () => {
    expect(motion({ opportunity: { status: 'UNKNOWN', detail: 'timeout', deals: [] } })).toMatchObject({ type: 'NO_GOOD_MOTION', why: expect.stringMatching(/deal state could not be read/) });
    expect(motion({ bids: [{ id: 'b', type: 'objection', summary: 'Not a problem here.', quote: 'x', who: 'dana', at: '2026-09-25T00:00:00Z', hypothesisId: 'h1' }] })).toMatchObject({ type: 'NO_GOOD_MOTION', why: expect.stringMatching(/contradicted/) });
    expect(motion({ personas: [{ ...person, doNotContact: true }] })).toMatchObject({ type: 'NO_GOOD_MOTION', why: expect.stringMatching(/nobody reachable/i) });
  });
  it('a verified fact leads even when Casey met them: the relationship is an optional opener, never the reason', () => {
    expect(motion({ memberships: [{ sourceName: 'Inland26', sourceType: 'conference', relationshipContext: 'Met at Inland26', personName: 'Dana Ops' }] })).toMatchObject({ type: 'FACT_LED', why: expect.stringMatching(/Optional opener: Met at Inland26/) });
  });

  it('a live conversation is FOLLOW_UP', () => {
    expect(motion({ conversation: { who: 'dana@acme.example', responseClass: 'positive_interest', at: '2026-09-20T00:00:00Z' } })).toMatchObject({ type: 'FOLLOW_UP', who: 'dana@acme.example' });
  });
  it('without a verified fact: a referral is REFERRAL_LED, a conference meeting or a newsletter subscriber is RELATIONSHIP_LED (the cohort rules), a CRM list is nothing', () => {
    expect(motion({ facts: [], memberships: [{ sourceName: 'Referrals', sourceType: 'referral', relationshipContext: 'Referred by Pat at Kroger', personName: 'Dana Ops' }] })).toMatchObject({ type: 'REFERRAL_LED', who: 'Dana Ops', why: expect.stringMatching(/Referred by Pat.*GAP drafts nothing until a usable fact and a grounded thesis exist/) });
    expect(motion({ facts: [], memberships: [{ sourceName: 'Inland26', sourceType: 'conference', relationshipContext: 'Met at Inland26', personName: 'Dana Ops' }] })).toMatchObject({ type: 'RELATIONSHIP_LED' });
    expect(motion({ facts: [], memberships: [{ sourceName: 'MMYQB', sourceType: 'newsletter', relationshipContext: 'MMYQB subscriber', personName: 'Dana Ops' }] })).toMatchObject({ type: 'RELATIONSHIP_LED' });
    expect(motion({ facts: [], memberships: [{ sourceName: 'HubSpot list', sourceType: 'crm_list', relationshipContext: null, personName: 'Dana Ops' }] })).toMatchObject({ type: 'NO_GOOD_MOTION' });
    // a do-not-contact person is never the way in, however Casey knows them
    expect(motion({ facts: [], memberships: [{ sourceName: 'Inland26', sourceType: 'conference', relationshipContext: 'Met at Inland26', personName: 'Dana Ops', doNotContact: true }] })).toMatchObject({ type: 'NO_GOOD_MOTION' });
  });
  it('no live fact and no relationship is NO_GOOD_MOTION: do not contact yet', () => {
    expect(motion({ facts: [] })).toMatchObject({ type: 'NO_GOOD_MOTION', why: expect.stringMatching(/Do not contact yet/) });
  });
  it('the glance names the motion', () => {
    expect(buildAccountBrief(inputs(), NOW).glance.motion).toBe('Fact-led: Dana Ops, on the verified fact.');
  });
});

describe('review E fixes', () => {
  it('a buyer who said no is never a follow-up', () => {
    expect(motion({ conversation: { who: 'dana@acme.example', responseClass: 'do_not_contact', at: '2026-09-20T00:00:00Z' } })).toMatchObject({ type: 'NO_GOOD_MOTION', why: expect.stringMatching(/No new outreach/) });
  });
  it('a first touch already out holds the account (the motion gate own reading)', () => {
    expect(motion({ firstTouches: [{ recipient: 'bob@acme.example', sentAt: '2026-09-28T00:00:00Z', state: 'sent' }] })).toMatchObject({ type: 'NO_GOOD_MOTION', why: expect.stringMatching(/bob@acme.example got a first touch/) });
  });
  it('a deal state that was not read is not a green light', () => {
    expect(motion({ opportunity: null })).toMatchObject({ type: 'NO_GOOD_MOTION', why: expect.stringMatching(/was not read here/) });
  });
});
