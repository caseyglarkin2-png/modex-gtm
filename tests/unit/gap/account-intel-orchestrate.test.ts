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
    expect(p.skipped).toContainEqual(expect.objectContaining({ section: 'technology', reason: expect.stringMatching(/came back empty for this section on 2026-09-25/) }));
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

  it('an unreadable or unread deal state is re-read first and NOTHING is researched until then (review C P0)', () => {
    for (const opportunity of [{ status: 'UNKNOWN' as const, detail: 'timeout', deals: [] }, null]) {
      const p = planResearch(buildAccountBrief(inputs({ opportunity }), NOW), [], NOW);
      expect(p.tasks).toEqual([expect.objectContaining({ section: 'commercial', provider: 'hubspot' })]);
      expect(p.tasks.some((t) => t.provider === 'research')).toBe(false);
    }
  });

  it('an open deal gets no research at all, only the next thing to learn from the buyer', () => {
    const p = planResearch(buildAccountBrief(inputs({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'x', stage: 'y' }] } }), NOW), [], NOW);
    expect(p.tasks.every((t) => t.provider === 'human')).toBe(true);
  });

  it('a section researched in the last day waits; a run still in flight blocks a second one', () => {
    const b = buildAccountBrief(inputs({ facts: [fact] }), NOW);
    const done = planResearch(b, [{ section: 'footprint', outcome: 'evidence_found', at: '2026-09-29T02:00:00Z' }], NOW);
    expect(done.skipped).toContainEqual({ section: 'footprint', reason: 'Researched on 2026-09-29; once a day per section.' });
    const running = planResearch(b, [{ section: 'footprint', outcome: 'running', at: '2026-09-29T11:58:00Z' }], NOW);
    expect(running.skipped).toContainEqual({ section: 'footprint', reason: expect.stringMatching(/has not finished/) });
    expect(running.tasks.some((t) => t.section === 'footprint')).toBe(false);
  });
});

describe('Release J: when YardFlow fit is unknown, the first task is an identity Scout', () => {
  it('an account of unknown type gets "what is it and what does it run" before anything else', () => {
    const p = planResearch(buildAccountBrief(inputs({ account: { ...inputs().account, vertical: 'Unknown' } }), NOW), [], NOW);
    expect(p.tasks[0]).toMatchObject({ section: 'identity', depth: 'SCOUT', provider: 'research' });
  });
  it('a known shipper does not spend a Scout on identity', () => {
    expect(planResearch(buildAccountBrief(inputs(), NOW), [], NOW).tasks.some((t) => t.section === 'identity')).toBe(false);
  });
});

describe('Release M: section outcomes and account motion', () => {
  const brief = () => buildAccountBrief(inputs({ facts: [fact] }), NOW);
  it('a pass the web could not run is retried after an hour, never held for 14 days', () => {
    const recent = planResearch(brief(), [{ section: 'technology', outcome: 'provider_unavailable', at: new Date(NOW.getTime() - 20 * 60_000).toISOString() }], NOW);
    expect(recent.skipped).toContainEqual(expect.objectContaining({ section: 'technology', reason: expect.stringMatching(/web search was unavailable/) }));
    const later = planResearch(brief(), [{ section: 'technology', outcome: 'provider_unavailable', at: new Date(NOW.getTime() - 2 * 3_600_000).toISOString() }], NOW);
    expect(later.tasks.some((t) => t.section === 'technology' && t.provider === 'research')).toBe(true);
  });
  it('a run whose facts landed elsewhere is empty FOR THIS SECTION', () => {
    const p = planResearch(brief(), [{ section: 'technology', outcome: 'nothing_for_section', at: '2026-09-25T00:00:00Z' }], NOW);
    expect(p.tasks.some((t) => t.section === 'technology' && t.provider === 'research')).toBe(false);
  });
  it('a live conversation holds web research; the next task is the conversation', () => {
    const p = planResearch({ ...brief(), motion: { type: 'FOLLOW_UP', who: 'Dana Ops', why: 'A live conversation.' } }, [], NOW);
    expect(p.tasks).toEqual([expect.objectContaining({ provider: 'human', focus: expect.stringMatching(/Continue the conversation with Dana Ops/) })]);
    expect(p.skipped.every((s) => /live conversation/.test(s.reason))).toBe(true);
  });
  it('a ready first touch is reviewed before any more research', () => {
    const p = planResearch({ ...brief(), motion: { type: 'FACT_LED', who: 'Angi Acosta', why: 'A verified fact and a thesis.' } }, [], NOW);
    expect(p.tasks).toEqual([expect.objectContaining({ provider: 'human', focus: expect.stringMatching(/first touch to Angi Acosta/) })]);
  });
  it('relationship-led: the ask is first; research stays as context', () => {
    const p = planResearch({ ...brief(), motion: { type: 'RELATIONSHIP_LED', who: 'Pat Lee', why: 'Met at MODEX.' } }, [], NOW);
    expect(p.tasks[0]).toMatchObject({ provider: 'human', section: 'relationships', focus: expect.stringMatching(/Ask Pat Lee/) });
    expect(p.tasks.some((t) => t.provider === 'research')).toBe(true);
  });
});
