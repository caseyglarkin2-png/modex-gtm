/**
 * Batch item 4 (audit at 31f09c71): the Gatik agreement is not an event. A partnership announcement and a software
 * deployment were classified physical (facts.ts transport rule; claim-types.ts ran the physical check first; the
 * event-led gate ignored claim_class), so they opened EVENT-LED first touches carrying "this change moves load onto
 * the gates, yards and docks" (the prohibited leap). Now: each classifies as what it is, event-led refuses it, an
 * ongoing partnership opens a FIT-LED thesis (a complementary-workflow question, no why-now), a one-time software
 * deployment opens nothing and the page says so; and (R31) the draft text is read off the fact, never one sentence for
 * every account.
 */
import { describe, expect, it } from 'vitest';
import { isPhysicalOpsFact, isSoftwareOrPartnershipClaim } from '@/lib/gap/research/facts';
import { classifyClaim } from '@/lib/gap/research/claim-types';
import { outreachFactRefusal, VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';
import { draftApproachFor, noOpeningLine } from '@/lib/gap/story/draft-approach';
import { draftDefaultsForFact, EVENT_DRAFT_DEFAULTS, siteOf, storyDraftPayload } from '@/lib/gap/story/draft-defaults';

const GATIK = 'PepsiCo and Gatik announced a multi-year agreement to deploy autonomous freight across its North America distribution network.';
const WMS = 'Kroger deployed a new warehouse management system across its Ohio distribution centers.';
const WMS_IMPL = 'Kroger implemented a new warehouse management system across its Ohio distribution centers.';
const TULSA = 'PepsiCo will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.';
const DENVER = 'PepsiCo is building a 1.2 million square foot distribution center in Denver, opening in 2027.';
const signal = (text: string, over: Record<string, unknown> = {}) => ({ id: 's1', account_name: 'PepsiCo', source_kind: 'evidence_record', source_type: 'public_primary', evidence_text: text, evidence_url: 'https://www.pepsico.com/en/newsroom/x', observed_at: new Date('2026-09-20T00:00:00Z'), external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, title: 'PepsiCo news', claim_class: null, ...over });

describe('what each sentence is (item 4)', () => {
  it('a partnership announcement and a software deployment are claims of their own type, never a physical change; deployed and implemented read the same', () => {
    expect([isPhysicalOpsFact(GATIK), classifyClaim(GATIK).type]).toEqual([false, 'partnership']);
    expect([isPhysicalOpsFact(WMS), classifyClaim(WMS).type]).toEqual([false, 'technology']);
    expect([isPhysicalOpsFact(WMS_IMPL), classifyClaim(WMS_IMPL).type]).toEqual([false, 'technology']);
  });
  it('hardware in the yard and a building stay physical: autonomous yard trucks, a closure, an opening; a lease with rail service is not read as a partnership', () => {
    for (const s of ['Walmart deployed 40 autonomous yard trucks at its Texas distribution centers.', TULSA, DENVER]) {
      expect([s, isPhysicalOpsFact(s), classifyClaim(s).type]).toEqual([s, true, 'physical_change']);
    }
    expect(isSoftwareOrPartnershipClaim('Kroger signed a lease for a new 500,000 square foot distribution center with rail service in Dallas.')).toBe(false);
  });
});

describe('the gate by approach (item 4)', () => {
  it('event-led refuses the partnership by its words, and by its class when stored; fit-led admits it as an ongoing program', () => {
    expect(outreachFactRefusal(signal(GATIK), 'PepsiCo')).toBe('not_a_physical_network_change');
    expect(outreachFactRefusal(signal(GATIK, { claim_class: 'PARTNERSHIP' }), 'PepsiCo')).toBe('claim_not_admitted_for_approach');
    expect(outreachFactRefusal(signal(GATIK), 'PepsiCo', { approach: 'fit_led' })).toBeNull();
    expect(outreachFactRefusal(signal(GATIK, { claim_class: 'PARTNERSHIP' }), 'PepsiCo', { approach: 'fit_led' })).toBeNull();
  });
  it('a one-time software deployment opens neither: event-led refuses its words, fit-led refuses it as not an ongoing state', () => {
    expect(outreachFactRefusal(signal(WMS, { account_name: 'Kroger' }), 'Kroger')).toBe('not_a_physical_network_change');
    expect(outreachFactRefusal(signal(WMS, { account_name: 'Kroger', claim_class: 'TECHNOLOGY' }), 'Kroger', { approach: 'fit_led' })).toBe('not_an_ongoing_state');
  });
});

describe('the approach a fact opens, one chooser for the page and the service (items 4 and 6)', () => {
  it('a posting is job-led, a physical change event-led, an ongoing partnership fit-led, a one-time deployment nothing, an ended program nothing', () => {
    expect(draftApproachFor({ text: 'Tyson is hiring a Yard Operations Supervisor at its Amarillo DC.', claimClass: 'JOB_POSTING' })).toBe('job_procurement_led');
    expect(draftApproachFor({ text: TULSA })).toBe('event_led');
    expect(draftApproachFor({ text: GATIK })).toBe('fit_led');
    expect(draftApproachFor({ text: GATIK, claimClass: 'PARTNERSHIP' })).toBe('fit_led');
    expect(draftApproachFor({ text: 'Kroger operates twelve distribution centers across the Midwest, each with its own yard.' })).toBe('fit_led');
    expect(draftApproachFor({ text: WMS })).toBeNull();
    expect(draftApproachFor({ text: GATIK, continuity: 'ended' })).toBeNull();
    expect(noOpeningLine(WMS)).toBe('Checked, but a technology deployment is not an opening for a first touch: context only.');
  });
});

describe('R31: the draft text is read off the fact, never one sentence for every account', () => {
  it('the site and the change class shape the guess, the falsification and what a no means', () => {
    expect(siteOf(TULSA)).toBe('the Tulsa, Oklahoma, production facility');
    expect(siteOf(DENVER)).toBe('the distribution center in Denver');
    const tulsa = draftDefaultsForFact({ text: TULSA, approach: 'event_led' });
    expect(tulsa).toEqual({
      problem: 'My guess is that closing the Tulsa, Oklahoma, production facility moves its volume onto the sites that remain, and their gates and yards are where that load shows up first.',
      falsification: 'Have trailers started waiting longer at the sites that took on the volume from the Tulsa, Oklahoma, production facility?',
      noMeans: 'If the sites that took on that volume do not hold trailers longer, the closure moved no load onto their yards: this thesis is closed for them.',
    });
    const denver = draftDefaultsForFact({ text: DENVER, approach: 'event_led' });
    expect(denver.problem).toBe('My guess is that the distribution center in Denver opens on gate, yard and dock habits it inherits, and its first months are where that capacity is won or lost.');
    // Two unrelated accounts never share the guess, and neither is the old generic sentence.
    expect(denver.problem).not.toBe(tulsa.problem);
    expect([tulsa.problem, denver.problem]).not.toContain(EVENT_DRAFT_DEFAULTS.problem);
  });
  it('a fit-led fact asks a complementary-workflow question with no why-now and no diagnosed load', () => {
    const fit = draftDefaultsForFact({ text: GATIK, approach: 'fit_led' });
    expect(fit.problem).toBe('My guess is that the Gatik program sends trailers to the yards on a schedule they have to keep, and the yards may be where the day gets lost; nothing new prompted this, it is a fit question.');
    expect(fit.problem).not.toMatch(/moves load onto the gates, yards and docks/);
    expect(fit.falsification).toMatch(/\?$/);
  });
  it('the payload carries the edited falsification, else the derived one, and reads the quote when no fact text is passed', () => {
    const obs = `pepsico.com: "${TULSA.replace(/\.$/, '')}" [S:f-tulsa].`;
    const base = { accountName: 'PepsiCo', factId: 'f-tulsa', claimClass: null, proposedObservation: obs, person: { personaId: 1, title: 'VP Transportation' } };
    expect(storyDraftPayload(base).falsificationQuestions).toEqual(['Have trailers started waiting longer at the sites that took on the volume from the Tulsa, Oklahoma, production facility?']);
    expect(storyDraftPayload({ ...base, falsification: 'Did the Muskogee yard start holding trailers longer?' }).falsificationQuestions).toEqual(['Did the Muskogee yard start holding trailers longer?']);
    expect(storyDraftPayload({ ...base, factText: GATIK, approach: 'fit_led' }).problemHypothesis).toMatch(/Gatik program/);
  });
});
