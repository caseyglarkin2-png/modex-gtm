/**
 * Release F: CONTINUOUS MEMORY. The brief is a live projection, so a new signal updates its section on the next
 * read. What must never happen silently: an APPROVED thesis keeping its standing after the world moved. A
 * material change since Casey approved it flags THESIS NEEDS REVIEW (never a rewrite): buyer truth arriving,
 * its fact going stale, a newer and more relevant fact, a deal opening. Buyer truth outranks public: when the
 * buyer names their yard system, a public mention of a different one is CONTRADICTED by the buyer.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { isValidStatement } from '@/lib/gap/account-intel/truth';

const NOW = new Date('2026-09-29T12:00:00Z');
const fact = (over: Record<string, unknown> = {}) => ({ id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-01T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null, ...over });
const hyp = (over: Record<string, unknown> = {}) => ({ id: 'h1', status: 'approved', reviewedAt: '2026-09-05T00:00:00Z', observation: 'Acme Foods will open a new distribution center in Reno in 2027.', problem: 'My guess is that arrivals pile up at the gate.', rootCauses: [], impacts: [], falsification: ['How are arrivals staged?'], whatANoMeans: 'Arrivals flow.', primarySignalId: 'f1', ...over });
const bid = (over: Record<string, unknown> = {}) => ({ id: 'b1', type: 'current_state', summary: 'We check trailers in on paper at every plant.', quote: 'x', who: 'dana@acme.example', at: '2026-09-20T00:00:00Z', hypothesisId: 'h1', ...over });
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: [], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact()], signals: [], lastResearch: null, hypotheses: [hyp()], bids: [], personas: [{ id: 1, name: 'Dana Ops', title: 'VP Distribution', doNotContact: false, hasEmail: true, emailStatus: 'valid' }],
  candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  ...over,
});

describe('THESIS NEEDS REVIEW', () => {
  it('nothing changed since approval: no flag', () => {
    const b = buildAccountBrief(inputs(), NOW);
    expect(b.hypotheses[0].needsReview).toEqual([]);
    expect(b.thesis.status).toBe('INFERENCE, for your review (never approved by GAP)');
  });

  it('buyer truth after approval flags it, and the thesis is not rewritten', () => {
    const b = buildAccountBrief(inputs({ bids: [bid()] }), NOW);
    expect(b.hypotheses[0].needsReview).toEqual(['The buyer said something after you approved it (current state, Sep 20).']);
    expect(b.hypotheses[0].problem).toBe('arrivals pile up at the gate');
    expect(b.thesis.status).toBe('THESIS NEEDS REVIEW: The buyer said something after you approved it (current state, Sep 20).');
  });

  it('its fact going stale flags it', () => {
    const b = buildAccountBrief(inputs({ facts: [fact({ expiresAt: '2026-09-20T00:00:00Z' })] }), NOW);
    expect(b.hypotheses[0].needsReview).toContain('Its fact is no longer live: the thesis rests on nothing current.');
  });

  it('a newer, more relevant fact flags it', () => {
    const newer = fact({ id: 'f2', quote: 'Acme Foods will consolidate its warehouse network into three regional distribution centers.', publishedAt: '2026-09-25T00:00:00Z' });
    const older = fact({ quote: 'Acme Foods expanded its automation program at one plant.' });
    const b = buildAccountBrief(inputs({ facts: [older, newer], hypotheses: [hyp({ observation: older.quote })] }), NOW);
    expect(b.hypotheses[0].needsReview).toContainEqual(expect.stringMatching(/^A newer fact \(a physical network transformation, Sep 25\) may change the story\.$/));
  });

  it('a BID on a different thesis, or the buyer confirming this one, is not a reason to look again', () => {
    expect(buildAccountBrief(inputs({ bids: [bid({ hypothesisId: 'other' })] }), NOW).hypotheses[0].needsReview).toEqual([]);
    expect(buildAccountBrief(inputs({ bids: [bid({ type: 'business_problem' })] }), NOW).hypotheses[0].needsReview).toEqual([]);
  });

  it('a weak newer fact (outside the US network, a divestiture) does not flag it', () => {
    const weak = fact({ id: 'f3', quote: 'Acme Foods agreed to sell its business in Brazil.', publishedAt: '2026-09-25T00:00:00Z' });
    expect(buildAccountBrief(inputs({ facts: [fact(), weak] }), NOW).hypotheses[0].needsReview).toEqual([]);
  });

  it('after Casey marks it reviewed (a later reviewedAt), the same change no longer flags it', () => {
    expect(buildAccountBrief(inputs({ bids: [bid()], hypotheses: [hyp({ reviewedAt: '2026-09-21T00:00:00Z' })] }), NOW).hypotheses[0].needsReview).toEqual([]);
  });

  it('a draft is never flagged (only what Casey approved can go stale on him)', () => {
    const b = buildAccountBrief(inputs({ hypotheses: [hyp({ status: 'draft', reviewedAt: null })], bids: [bid()] }), NOW);
    expect(b.hypotheses[0].needsReview).toEqual([]);
  });
});

describe('buyer truth outranks public', () => {
  it('the buyer naming their yard system contradicts a public mention of a different one', () => {
    const b = buildAccountBrief(inputs({
      facts: [fact(), fact({ id: 'f9', quote: 'Kaleris announced Acme Foods as a yard management customer.', url: 'https://kaleris.example/news' })],
      bids: [bid({ id: 'b2', summary: 'We use PINC at all 12 plants.' })],
    }), NOW);
    const tech = b.sections.technology.statements;
    expect(tech[0]).toMatchObject({ truth: 'BUYER_CONFIRMED', text: expect.stringMatching(/^PINC/) });
    const k = tech.find((s) => /^Kaleris/.test(s.text));
    expect(k?.truth).toBe('CONTRADICTED');
    expect(k?.contradictedBy?.[0]).toMatchObject({ kind: 'bid' });
    expect(tech.every(isValidStatement)).toBe(true);
    expect(b.sections.technology.status).toBe('CONTRADICTED');
  });
});

describe('review F: what the buyer said about a vendor is read, not just matched', () => {
  const kaleris = fact({ id: 'f9', quote: 'Kaleris announced Acme Foods as a yard management customer.', url: 'https://kaleris.example/news' });
  const pincPublic = fact({ id: 'f8', quote: 'PINC named Acme Foods a yard management customer.', url: 'https://news.example/pinc' });
  it('"we replaced Kaleris with PINC": a public PINC mention stands; a public Kaleris mention is contradicted', () => {
    const b = buildAccountBrief(inputs({ facts: [fact(), pincPublic, kaleris], bids: [bid({ id: 'b3', summary: 'We replaced Kaleris with PINC last year.' })] }), NOW);
    const tech = b.sections.technology.statements;
    expect(tech.find((s) => /^PINC \(yard management; PUBLIC MENTION/.test(s.text))?.truth).toBe('VERIFIED_PUBLIC');
    expect(tech.find((s) => /^Kaleris \(yard management; PARTNER CLAIM/.test(s.text))?.truth).toBe('CONTRADICTED');
    expect(tech.find((s) => /^Kaleris \(yard management; BUYER: no longer in use\)/.test(s.text))).toBeTruthy();
  });
  it('the buyer saying they do not use PINC contradicts a public PINC mention (a buyer rejection is a contradiction)', () => {
    const b = buildAccountBrief(inputs({ facts: [fact(), pincPublic], bids: [bid({ id: 'b4', summary: 'We do not use PINC anywhere.' })] }), NOW);
    const s = b.sections.technology.statements.find((x) => /^PINC \(yard management; PUBLIC MENTION/.test(x.text));
    expect(s?.truth).toBe('CONTRADICTED');
    expect(s?.text).toMatch(/The buyer says they do not use PINC\.$/);
  });
  it('a yard truck vendor is not a yard system: "we run Outrider" does not contradict a public PINC mention', () => {
    const b = buildAccountBrief(inputs({ facts: [fact(), pincPublic], bids: [bid({ id: 'b5', summary: 'We run Outrider trucks at two DCs.' })] }), NOW);
    expect(b.sections.technology.statements.find((x) => /^PINC/.test(x.text))?.truth).toBe('VERIFIED_PUBLIC');
  });
  it('a public HISTORICAL mention agrees with a buyer who moved on', () => {
    const old = fact({ id: 'f7', quote: 'Acme Foods previously used Kaleris at its plants.', url: 'https://news.example/old' });
    const b = buildAccountBrief(inputs({ facts: [fact(), old], bids: [bid({ id: 'b6', summary: 'We use PINC at all 12 plants.' })] }), NOW);
    expect(b.sections.technology.statements.find((x) => /^Kaleris/.test(x.text))?.truth).toBe('VERIFIED_PUBLIC');
  });
});
