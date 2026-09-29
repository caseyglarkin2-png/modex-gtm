/**
 * Release C: the RESEARCH ORCHESTRATOR. Depths: SCOUT (a company GAP does not know; entity/scout),
 * BRIEF (free: the live projection), DEEPEN (one focused, verified research run on the highest-value
 * missing section). It never re-researches a KNOWN, fresh section, never repeats a focus that came back
 * empty in the last 14 days, says why each task matters, and has no opaque score.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { planResearch, DEEPEN_FOCUS } from '@/lib/gap/account-intel/orchestrate';

const NOW = new Date('2026-09-29T12:00:00Z');
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: [], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [], personas: [], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  ...over,
});
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-10T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };

describe('planResearch', () => {
  it('an account with no live fact deepens catalysts first, because that gates any contact', () => {
    const p = planResearch(buildAccountBrief(inputs(), NOW), [], NOW);
    expect(p.tasks[0]).toMatchObject({ section: 'catalysts', depth: 'DEEPEN', provider: 'research' });
    expect(p.tasks[0].why).toMatch(/gates contact/);
  });

  it('a KNOWN, fresh section is never re-researched', () => {
    const p = planResearch(buildAccountBrief(inputs({ facts: [fact] }), NOW), [], NOW);
    expect(p.tasks.some((t) => t.section === 'catalysts')).toBe(false);
    expect(p.skipped).toContainEqual(expect.objectContaining({ section: 'catalysts', reason: expect.stringMatching(/known and fresh/i) }));
  });

  it('a focus that came back empty in the last 14 days is not repeated', () => {
    const history = [{ section: 'technology', outcome: 'insufficient_evidence', at: '2026-09-25T00:00:00Z' }];
    const p = planResearch(buildAccountBrief(inputs({ facts: [fact] }), NOW), history, NOW);
    expect(p.tasks.some((t) => t.section === 'technology' && t.provider === 'research')).toBe(false);
    expect(p.skipped).toContainEqual(expect.objectContaining({ section: 'technology', reason: expect.stringMatching(/came back empty on 2026-09-25/) }));
  });

  it('what research cannot answer becomes a discovery question for a human, not a web call', () => {
    const p = planResearch(buildAccountBrief(inputs({ facts: [fact] }), NOW), [], NOW);
    const org = p.tasks.find((t) => t.section === 'org');
    expect(org).toMatchObject({ provider: 'human', depth: 'DEEPEN' });
    expect(org?.focus).toMatch(/Who owns yard performance/);
  });

  it('every research task carries its focus; no score anywhere', () => {
    const p = planResearch(buildAccountBrief(inputs(), NOW), [], NOW);
    for (const t of p.tasks.filter((x) => x.provider === 'research')) expect(t.focus).toBe(DEEPEN_FOCUS[t.section as keyof typeof DEEPEN_FOCUS]);
    expect(JSON.stringify(p)).not.toMatch(/score/i);
  });

  it('an open deal is never cold-researched for catalysts; the deal work is the task', () => {
    const p = planResearch(buildAccountBrief(inputs({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'Acme pilot', stage: 'discovery' }] } }), NOW), [], NOW);
    expect(p.tasks[0]).toMatchObject({ section: 'commercial', provider: 'human' });
    expect(p.tasks.some((t) => t.section === 'catalysts')).toBe(false);
  });

  it('an unreadable deal state is re-read before anything else', () => {
    const p = planResearch(buildAccountBrief(inputs({ opportunity: { status: 'UNKNOWN', detail: 'timeout', deals: [] } }), NOW), [], NOW);
    expect(p.tasks[0]).toMatchObject({ section: 'commercial', provider: 'hubspot' });
  });
});
