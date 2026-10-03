/**
 * Click test round 5 (2026-10-03):
 *   - General Mills: the 45-day rule pushed its only real trigger (a network redesign, Jul 2) out of WHY NOW. A
 *     physical network transformation is a program, not a one-day event: it stays WHY NOW for 180 days. A plant
 *     closure "this week" (a site change) still ages out at 45.
 *   - the cockpit said "Contact michelle schlie" while NOW said "Michelle Schlie"
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { buildNextUpCandidates } from '@/lib/gap/routing/next-up';

const NOW = new Date('2026-10-03T12:00:00Z');
const base = { url: 'https://news.example/x', title: 'news', expiresAt: '2027-06-01T00:00:00Z', continuity: 'event' as const, currentness: null };
const inputs = (facts: AccountInputs['facts']): AccountInputs => ({
  account: { name: 'General Mills', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: ['generalmills.com'], siblings: [], watched: true, watchReasons: ['priority'],
  facts, signals: [], lastResearch: null, hypotheses: [], bids: [], personas: [], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
});
const ctx = (): AccountContext => ({ relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }), engagement: projectEngagement([], NOW), history: [], assets: [], legacyNote: null });
const whyNow = (facts: AccountInputs['facts']) => { const i = inputs(facts); return projectNow(buildAccountBrief(i, NOW), ctx(), i, NOW).whyNow.map((l) => l.text).join(' | '); };

describe('WHY NOW keeps a network transformation for its program window', () => {
  it('a 93-day-old network redesign stays; a 50-day-old plant closure does not', () => {
    const redesign = { ...base, id: 'f1', quote: 'General Mills will redesign the plant and warehouse network behind Cheerios, Blue Buffalo and Pillsbury, as part of a plan to cut $3 billion in costs by fiscal 2030.', publishedAt: '2026-07-02T00:00:00Z' };
    const closure = { ...base, id: 'f2', quote: 'General Mills announced this week that it will close its plant in Eagle Mountain.', publishedAt: '2026-08-14T00:00:00Z' };
    const t = whyNow([redesign, closure]);
    expect(t).toMatch(/^ONGOING PROGRAM: General Mills will redesign the plant and warehouse network/);
    expect(t).not.toMatch(/Eagle Mountain/);
  });
  it('not past 180 days', () => {
    const old = { ...base, id: 'f3', quote: 'General Mills will redesign the plant and warehouse network behind Cheerios to cut costs.', publishedAt: '2026-03-01T00:00:00Z' };
    expect(whyNow([old])).not.toMatch(/redesign/);
  });
});

describe('the cockpit names people the way NOW does', () => {
  it('a lowercase CRM name is title-cased in "Contact ..."', () => {
    const c = buildNextUpCandidates({
      replies: [], followUps: [], readyOneOffs: [], researchGroups: [], researchCards: [], reviewGroups: [], inbox: [], tiers: new Map(), primaryExpiry: new Map(),
      ready: [{ id: 'r1', account: { name: 'PepsiCo' }, persona: { id: 1, displayName: 'michelle schlie', email: 'm@pepsico.com', title: 'VP' }, hypothesis: { id: 'h1' }, createdAt: '2026-09-20', ruleId: 'enroll' }],
      openHref: (lane: string, id: string) => `/gap?lane=${lane}&open=${id}`,
    } as never);
    expect(c.map((x) => x.title)).toContain('Contact Michelle Schlie');
  });
});
