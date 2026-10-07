/**
 * Sprint 5 review, the NICEs in files the review fixes touched: NOW's NEXT let a meeting ten days out outrank a promise
 * due today; the recap said "1 confirmed statement ... send them back"; the story told a future canceled meeting as
 * Checked under "What has happened between us" (and repeated the history's "Meeting (status):" prefix).
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { projectStory } from '@/lib/gap/story/story';
import type { StoryTouch } from '@/lib/gap/story/touches';
import { prepareArtifacts } from '@/lib/gap/deals/artifacts';
import { planFor } from '@/lib/gap/deals/action-plan';

const NOW = new Date('2026-10-07T15:00:00Z');
const inputs = {
  account: { name: 'Kroger Scratch Co', tier: 'Tier 1', priorityBand: 'A', vertical: 'grocery', parentBrand: null, hubspotCompanyId: '1' },
  aliases: [], domains: ['kroger.example.com'], siblings: [], watched: true, watchReasons: [],
  facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
  personas: [{ id: 1, name: 'Ann Scratch', title: 'VP Supply Chain Operations', doNotContact: false, hasEmail: true, emailStatus: 'valid' }],
  candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'ACTIVE', detail: '', deals: [{ id: '392057001', name: 'YardFlow - Kroger Scratch Co', stage: 'Appointment scheduled', contactIds: [] }] },
  pack: null, microsite: null, facilityFact: null, roi: null,
} as unknown as AccountInputs;
const ctxWith = (meetingAt: string): AccountContext => ({
  relationship: { ...projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }), meetings: { upcoming: { at: meetingAt, what: 'Pilot review with Ann' }, last: null } },
  engagement: projectEngagement([], NOW),
  history: [],
  assets: [],
  legacyNote: null,
});
const brief = buildAccountBrief(inputs, NOW);

describe('Sprint 5 review NICE: a promise due now outranks a meeting more than a day away', () => {
  const due = { title: 'Send Ann the dock schedule template', scope: 'Deal: YardFlow - Kroger Scratch Co' };
  it('a meeting in ten days: the due promise leads, and the meeting is named next', () => {
    const v = projectNow(brief, ctxWith('2026-10-17T14:00:00Z'), inputs, NOW, { dueNow: due });
    expect(v.next).toEqual({ text: 'Due now: Send Ann the dock schedule template (Deal: YardFlow - Kroger Scratch Co). Then prepare for the meeting on Oct 17, 2026: Pilot review with Ann.', source: 'obligation' });
  });
  it('a meeting within a day still leads; with nothing due the meeting leads as before', () => {
    expect(projectNow(brief, ctxWith('2026-10-08T13:00:00Z'), inputs, NOW, { dueNow: due }).next.source).toBe('meeting');
    expect(projectNow(brief, ctxWith('2026-10-17T14:00:00Z'), inputs, NOW, {}).next.source).toBe('meeting');
  });
});

describe('Sprint 5 review NICE: the recap counts its statements in words that agree', () => {
  const base = { accountName: 'Kroger Scratch Co', deal: { id: '392057001', name: 'YardFlow - Kroger Scratch Co', contacts: [{ name: 'Ann Scratch', title: null }] }, plan: planFor('392057001', [], []), commitments: [], roi: null };
  it('one statement: send it back; two: send them back', () => {
    const need = (id: string) => ({ id, type: 'business_problem', quote: `Quote ${id}.`, who: 'Ann Scratch', at: '2026-10-02T15:00:00.000Z', accountLevel: false });
    expect(prepareArtifacts({ ...base, needs: [need('b1')] })[0].why).toMatch(/^1 confirmed statement from Ann Scratch on YardFlow - Kroger Scratch Co: send it back so Ann can correct it./);
    expect(prepareArtifacts({ ...base, needs: [need('b1'), need('b2')] })[0].why).toMatch(/: send them back so Ann/);
  });
  it('two statements by one person on one day each say which words they rest on; a single one keeps the plain label', () => {
    const ben = (id: string, quote: string) => ({ id, type: 'metric', quote, who: 'Ben Scratch', at: '2026-10-07T13:00:00.000Z', accountLevel: false });
    const [recap] = prepareArtifacts({ ...base, needs: [ben('b1', 'We lose about 3 hours per shift hunting for trailers.'), ben('b2', 'We pay about forty thousand a month in detention.')] });
    expect(recap.citations.map((c) => c.label)).toEqual(['Ben Scratch, Oct 7 (buyer confirmed): "We lose about 3 hours per..."', 'Ben Scratch, Oct 7 (buyer confirmed): "We pay about forty thousand a..."']);
    expect(prepareArtifacts({ ...base, needs: [ben('b1', 'Short quote.')] })[0].citations[0].label).toBe('Ben Scratch, Oct 7 (buyer confirmed)');
  });
});

describe('Sprint 5 review NICE: only a meeting that took place has happened between us', () => {
  const state = projectPursuitState({ accountName: 'Kroger Scratch Co', now: NOW, motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'YardFlow - Kroger Scratch Co', stage: 'Appointment scheduled' }] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [] });
  const between = (touches: StoryTouch[]) => {
    const v = projectNow(brief, ctxWith('2026-10-17T14:00:00Z'), inputs, NOW);
    return projectStory({ accountName: 'Kroger Scratch Co', now: NOW, state, brief, inputs, whyNow: v.whyNow, know: v.know, touches, clawdRead: 'ok', vaultNote: null, excluded: [] }).rows.find((r) => r.key === 'between_us')!;
  };
  const meeting = (at: string, what: string): StoryTouch => ({ kind: 'meeting', at, name: 'the account', title: null, address: null, what, source: 'account history' });
  it('a future canceled meeting is not told as a Checked meeting; a booked future one is said as booked', () => {
    expect(between([meeting('2026-10-09T14:00:00Z', 'Meeting (Canceled): Pilot check-in with Ann')]).sentences.map((s) => s.text)).toEqual(['Nothing has happened between us yet.']);
    expect(between([meeting('2026-10-09T14:00:00Z', 'Meeting (Scheduled): Pilot check-in with Ann')]).sentences.map((s) => s.text)).toEqual(['Nothing has happened between us yet; a meeting is booked for Oct 9.']);
  });
  it('a held meeting is told once, without the history prefix', () => {
    const r = between([meeting('2026-10-02T14:00:00Z', 'Meeting (Held): Discovery with Ann')]);
    expect(r.sentences.map((s) => [s.text, s.tag])).toEqual([['Meeting Oct 2: Discovery with Ann.', 'Checked']]);
  });
});
