/**
 * Release K in the brief: the family is shown, never merged. Frito-Lay's brief names PepsiCo as its parent and
 * shows PepsiCo's live activity as a HOLD, but never PepsiCo's facts or buyer truth. The motion holds and the
 * research plan stops spending until Casey records a separate buying motion.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { planResearch } from '@/lib/gap/account-intel/orchestrate';

const NOW = new Date('2026-09-29T12:00:00Z');
const fact = { id: 'f1', quote: 'Frito-Lay will open a new distribution center in Perry, Georgia.', url: 'https://news.example/perry', title: 'news', publishedAt: '2026-09-10T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const hyp = { id: 'h1', status: 'draft', observation: fact.quote, problem: 'My guess is that inbound arrivals pile up at the new DC.', rootCauses: [], impacts: [], falsification: ['How are arrivals staged?'], whatANoMeans: 'Arrivals flow.', primarySignalId: 'f1' };
const hold = { detail: 'Related account activity. Frito-Lay is part of PepsiCo in GAP. PepsiCo (its parent): active opportunity: YardFlow - PepsiCo (discovery). Confirm this is a separate buying motion before any cold outreach.', accounts: ['PepsiCo'], unknown: false };
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Frito-Lay', tier: 'Tier 1', priorityBand: 'B', vertical: 'Food & Beverage', parentBrand: 'PepsiCo', hubspotCompanyId: null },
  aliases: [], domains: [], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact], signals: [], lastResearch: null, hypotheses: [hyp], bids: [], personas: [{ id: 1, name: 'Dana Ops', title: 'VP Distribution', doNotContact: false, hasEmail: true, emailStatus: 'valid' }],
  candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  family: { parentName: 'PepsiCo', members: [{ accountName: 'PepsiCo', relation: 'parent', source: 'parent_brand' }], related: [{ accountName: 'PepsiCo', relation: 'parent', activity: ['active opportunity: YardFlow - PepsiCo (discovery)'], unknown: false }], separate: null, hold },
  ...over,
});

describe('family in the brief', () => {
  it('the 30-second view shows the family and the related activity, compactly', () => {
    expect(buildAccountBrief(inputs(), NOW).glance.family).toBe('Parent: PepsiCo · Related GAP activity: PepsiCo, active opportunity: YardFlow - PepsiCo (discovery)');
  });
  it('related activity holds the motion and says why; the plan stops spending on research', () => {
    const b = buildAccountBrief(inputs(), NOW);
    expect(b.motion).toMatchObject({ type: 'NO_GOOD_MOTION', why: expect.stringMatching(/^Do not contact yet: Related account activity\. Frito-Lay is part of PepsiCo/) });
    const p = planResearch(b, [], NOW);
    expect(p.tasks).toEqual([expect.objectContaining({ provider: 'human', focus: expect.stringMatching(/separate buying motion/) })]);
  });
  it('intelligence stays entity-specific: the parent appears as a relation, never its facts or buyer truth', () => {
    const b = buildAccountBrief(inputs(), NOW);
    expect(JSON.stringify(b.sections)).toMatch(/Parent: PepsiCo \(a separate GAP account: its intelligence and buyer truth stay its own\)/);
    expect(b.glance.bestFact).toMatch(/^Frito-Lay will open/);
    expect(b.sections.commercial.statements.map((s) => s.text).join(' ')).not.toMatch(/YardFlow - PepsiCo/);
  });
  it('a separate buying motion lifts the hold (and says so); no family is "None known"', () => {
    const b = buildAccountBrief(inputs({ family: { ...inputs().family!, hold: null, separate: { relatedAccounts: ['PepsiCo'], reason: 'Separate DC ops budget.', actor: 'casey@freightroll.com', at: '2026-09-29T00:00:00Z', expiresAt: '2026-12-28T00:00:00Z' } } }), NOW);
    expect(b.motion.type).toBe('FACT_LED');
    expect(b.glance.family).toMatch(/Separate buying motion confirmed by casey@freightroll.com until 2026-12-28$/);
    expect(buildAccountBrief(inputs({ family: null }), NOW).glance.family).toBe('None known');
  });
});
