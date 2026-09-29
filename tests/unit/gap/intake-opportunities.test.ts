/**
 * Cohort output is OPPORTUNITIES worth Casey's attention, never generated
 * emails. Each carries account, person, source/relationship, why this account
 * (the verified fact), thesis, why this person, the suggested approach, what
 * to learn, what would make us wrong, and safety. The approach is the smallest
 * methodology-safe distinction:
 *   fact_led           a verified fact at the account (the normal gated path)
 *   relationship_led   real relationship context, no verified fact: GAP never drafts a first touch
 *   referral_led       a referral source, no verified fact
 *   follow_up          an existing conversation at the account
 */
import { describe, expect, it } from 'vitest';
import { proposeOpportunity, type OpportunityInput } from '@/lib/gap/intake/opportunities';

const base = (over: Partial<OpportunityInput> = {}): OpportunityInput => ({
  member: { id: 'm1', name: 'Angi Acosta', title: 'VP Distribution', accountName: 'Acme Foods', personaId: 7, candidateId: null, relationshipContext: 'MMYQB subscriber', note: null, qualification: 'evidence_ready', alsoFrom: [] },
  source: { name: 'MMYQB LinkedIn subscribers', sourceType: 'newsletter' },
  fact: { signalId: 'f1', quote: 'Acme Foods will open a new distribution center in Reno.', reason: 'a distribution, warehouse, plant or yard change', chain: 'PRIMARY SOURCE Acme Foods · Sep 10' },
  thesis: { summary: 'Arrival variability moves into the yard at the new DC.', useLabel: 'USE IN DRAFT', learn: 'How are inbound trailers staged at the new DC?', wrongIf: 'The DC schedules every arrival already.' },
  conversation: null,
  suggestedAngle: 'Owns the distribution network the new DC joins.',
  ...over,
});

describe('proposeOpportunity', () => {
  it('a verified fact makes it FACT-LED; the relationship is offered as optional context, never as the reason', () => {
    const o = proposeOpportunity(base());
    expect(o.approach).toBe('fact_led');
    expect(o.whyAccount).toBe('Acme Foods will open a new distribution center in Reno.');
    expect(o.suggestedApproach).toMatch(/^Fact-led: open with the verified fact/);
    expect(o.suggestedApproach).toMatch(/you may say you write MMYQB LinkedIn subscribers; never that they subscribe/);
    expect(o.suggestedApproach).not.toMatch(/subscribe[sd]? so/i);
    expect(o.learn).toBe('How are inbound trailers staged at the new DC?');
    expect(o.safety).toEqual({ state: 'ok', lines: ['Every send still runs the normal gates at the click: suppression, deal truth, duplicate send, account motion.'] });
  });

  it('real relationship context and NO verified fact: RELATIONSHIP-LED, and GAP will not draft a first touch', () => {
    const o = proposeOpportunity(base({ fact: null, thesis: null, member: { ...base().member, qualification: 'research' } }));
    expect(o.approach).toBe('relationship_led');
    expect(o.whyAccount).toBeNull();
    expect(o.suggestedApproach).toMatch(/^Relationship-led: ask for their perspective/);
    expect(o.suggestedApproach).not.toMatch(/problem/i);
    expect(o.safety.state).toBe('caution');
    expect(o.safety.lines[0]).toBe('No verified fact at Acme Foods: GAP will not draft a first touch. If you reach out, it is your own note.');
  });

  it('a referral source with no fact: REFERRAL-LED', () => {
    expect(proposeOpportunity(base({ fact: null, thesis: null, source: { name: 'Jake referrals', sourceType: 'referral' }, member: { ...base().member, relationshipContext: 'Introduced by Jake', qualification: 'research' } })).approach).toBe('referral_led');
  });

  it('an existing conversation at the account wins: FOLLOW-UP in the thread, not a cold first touch', () => {
    const o = proposeOpportunity(base({ conversation: { who: 'dana@acmefoods.com', responseClass: 'interested', at: '2026-09-20T12:00:00Z' } }));
    expect(o.approach).toBe('follow_up');
    expect(o.suggestedApproach).toMatch(/^Follow-up: there is a conversation at Acme Foods/);
  });

  it('a staged person (not yet a contact) is caution: promote before GAP can prepare outreach', () => {
    const o = proposeOpportunity(base({ member: { ...base().member, personaId: null, candidateId: 5 } }));
    expect(o.safety.state).toBe('caution');
    expect(o.safety.lines).toContain('Staged, not yet a contact: review and promote the person before GAP can prepare outreach.');
  });

  it('no thesis yet: what to learn and what would make us wrong say so (never invented)', () => {
    const o = proposeOpportunity(base({ thesis: null }));
    expect(o.thesis).toBeNull();
    expect(o.learn).toBe('No thesis yet: draft one from this fact in Research, then set what to learn.');
    expect(o.wrongIf).toBeNull();
  });
});

describe('final review fixes', () => {
  it('a person Casey met (conference / referral / relationship) is a fact-led FOLLOW-UP in the copy, with the blind spot said', () => {
    const o = proposeOpportunity(base({ source: { name: 'Inland26 · Chicago', sourceType: 'conference' }, member: { ...base().member, relationshipContext: 'Inland26 contact (field guide note, Sep 24)' } }));
    expect(o.approach).toBe('fact_led');
    expect(o.suggestedApproach).toMatch(/^Fact-led follow-up: you already know them/);
    expect(o.suggestedApproach).toMatch(/never a second cold first touch/);
    expect(o.safety.lines).toContain('GAP only sees its own sends: check whether you already wrote to them before anything new goes out.');
  });

  it('a newsletter: Casey may say he writes it, never that they subscribe', () => {
    const o = proposeOpportunity(base({ source: { name: 'MMYQB LinkedIn subscribers', sourceType: 'newsletter' } }));
    expect(o.suggestedApproach).toMatch(/you may say you write MMYQB LinkedIn subscribers; never that they subscribe/);
    expect(o.suggestedApproach).not.toMatch(/mention MMYQB subscriber/);
  });

  it('a sensitive fact (layoffs, closure harm, bankruptcy, recall) is flagged: reference the network change, never the people affected', () => {
    const o = proposeOpportunity(base({ fact: { signalId: 'f', quote: 'Tyson Foods announced the closure of its beef plant, throwing more than 2,500 union workers out of work.', reason: 'a physical network transformation', chain: 'SOURCE x' } }));
    expect(o.safety.state).toBe('caution');
    expect(o.safety.lines[0]).toBe('Sensitive fact (people lost their jobs): reference the network change, never the people affected, or choose a different opener.');
  });

  it('a follow-up names who the conversation is with; a no-fact card shows no thesis', () => {
    expect(proposeOpportunity(base({ conversation: { who: 'dana@acmefoods.com', responseClass: 'interested', at: '2026-09-20T12:00:00Z' } })).suggestedApproach).toMatch(/with dana@acmefoods\.com/);
    expect(proposeOpportunity(base({ fact: null, member: { ...base().member, qualification: 'research' } })).thesis).toBeNull();
  });
});
