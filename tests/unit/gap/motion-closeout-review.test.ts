/**
 * Seller / GAP-method final review (2026-09-30): the motion must not send Casey to a company whose fit is
 * unknown on the strength of a newsletter subscription, must say "not a fit" before any HubSpot-link hold,
 * and the brief must not name a board member, a former executive or a do-not-contact person as the owner.
 */
import { describe, expect, it } from 'vitest';
import { decideApproach, type ApproachInput } from '@/lib/gap/motion/approach';
import { suggestAngle } from '@/lib/gap/motion/persona-angle';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';

const base: ApproachInput = { deal: 'CLEAR', contradicted: false, conversation: null, touchHold: null, verifiedFact: false, reachable: true, source: null };
const unknownFit = { fit: 'UNKNOWN', why: 'What it operates is not established.' };

describe('fit unknown: a subscription is not a reason to reach out', () => {
  it('XPO / ShipBob / NFI: fit unknown + a newsletter subscriber + no fact holds, and says why', () => {
    const a = decideApproach({ ...base, fit: unknownFit, source: { sourceType: 'newsletter', context: 'MMYQB subscriber', name: 'MMYQB' } });
    expect(a.kind).toBe('NO_GOOD_MOTION');
    expect(a.why).toBe('Do not contact yet: what this company operates is not established (fit unknown), and "MMYQB subscriber" is context, not a reason to reach out. Scout it first.');
  });
  it('someone Casey MET is still a way in when fit is unknown (conference, referral)', () => {
    expect(decideApproach({ ...base, fit: unknownFit, source: { sourceType: 'conference', context: 'Met at Inland26', name: 'Inland26' } }).kind).toBe('RELATIONSHIP_LED');
    expect(decideApproach({ ...base, fit: unknownFit, source: { sourceType: 'referral', context: 'Intro from Dana', name: 'Referral' } }).kind).toBe('REFERRAL_LED');
  });
  it('a newsletter way in (fit known) never says they subscribe', () => {
    const a = decideApproach({ ...base, fit: { fit: 'POTENTIAL_DIRECT_BUYER', why: 'x' }, source: { sourceType: 'newsletter', context: 'MMYQB subscriber', name: 'MMYQB' } });
    expect(a.kind).toBe('RELATIONSHIP_LED');
    expect(a.why).toMatch(/you write MMYQB; never say they subscribe/);
  });
});

describe('not a fit is said before a HubSpot-link hold', () => {
  it('CHG Healthcare / MTA: NOT_FIT with no HubSpot company reads as not a fit', () => {
    const a = decideApproach({ ...base, deal: 'UNKNOWN', dealUnknownWhy: 'not linked', fit: { fit: 'NOT_FIT', why: 'A staffing firm: no yards.' } });
    expect(a.why).toBe('Not a YardFlow fit on the evidence: A staffing firm: no yards.');
    // an open deal still wins
    expect(decideApproach({ ...base, deal: 'ACTIVE', fit: { fit: 'NOT_FIT', why: 'x' } }).kind).toBe('IN_DEAL');
  });
});

describe('WHY YOU never claims ownership a title does not show', () => {
  it('a mixed-function title is not "Runs transportation"', () => {
    const s = suggestAngle({ title: 'Manufacturing and logistics operations leader', personaKey: null, accountName: 'General Mills' });
    expect(s).not.toMatch(/^Runs/);
    expect(s).toBe('Title spans manufacturing and logistics at General Mills; which part they own is not known. Learn who owns yard performance.');
    expect(suggestAngle({ title: 'VP Transportation', personaKey: null, accountName: 'Kroger' })).toMatch(/^Runs transportation at Kroger/);
  });
});

describe('OWNER: never a board member, a former executive, a non-operations title or a do-not-contact person unflagged', () => {
  const acct = (personas: AccountInputs['personas']): AccountInputs => ({
    account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
    aliases: [], domains: [], siblings: [], watched: true, watchReasons: [], facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas, candidates: [], memberships: [], firstTouches: [], conversation: null, opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  });
  it('Sysco / Kroger / Flexport: no operations title on record is Unknown, not the first contact', () => {
    const b = buildAccountBrief(acct([
      { id: 1, name: 'Francesca Debiase', title: 'Board Director / Former EVP Supply Chain', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
      { id: 2, name: 'Ted Meyers', title: 'Business Development/AI Project Manager', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
      { id: 3, name: 'Celine Ning', title: 'Operations Manager, CEO Office', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
    ]), new Date('2026-09-30T12:00:00Z'));
    expect(b.glance.likelyOwner).toBe('Unknown: nobody on record has an operations title (3 people on record).');
  });
  it('Hormel: a do-not-contact owner is flagged on the OWNER line', () => {
    const b = buildAccountBrief(acct([{ id: 1, name: 'Will Bonifant', title: 'Director of Logistics', doNotContact: true, hasEmail: true, emailStatus: 'valid' }]), new Date('2026-09-30T12:00:00Z'));
    expect(b.glance.likelyOwner).toBe('Will Bonifant, Director of Logistics (LIKELY; ownership never assumed) (do not contact)');
  });
  it('fact-led never goes to whoever is first on record: no operations owner means find one first', () => {
    const fact = { id: 'f1', quote: 'Acme Foods will open a new automated distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'n', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
    const h = { id: 'h1', status: 'draft', observation: fact.quote, problem: 'Arrivals pile up.', rootCauses: [], impacts: [], falsification: [], whatANoMeans: null, primarySignalId: 'f1' };
    const b = buildAccountBrief({ ...acct([{ id: 1, name: 'Francesca Debiase', title: 'Board Director / Former EVP Supply Chain', doNotContact: false, hasEmail: true, emailStatus: 'valid' }]), facts: [fact], hypotheses: [h] } as never, new Date('2026-09-30T12:00:00Z'));
    expect(b.motion.type).toBe('FACT_LED');
    expect(b.glance.nextAction).toBe('Review the thesis, then find the operations owner first: nobody reachable on record has an operations title.');
  });
  it('Caterpillar: a name fragment in the CRM is said as such', () => {
    const b = buildAccountBrief(acct([{ id: 1, name: 'Poorman S', title: 'VP Integrated Logistics', doNotContact: false, hasEmail: true, emailStatus: 'valid' }]), new Date('2026-09-30T12:00:00Z'));
    expect(b.glance.likelyOwner).toBe('Poorman S (name incomplete in the CRM), VP Integrated Logistics (LIKELY; ownership never assumed)');
  });
});
