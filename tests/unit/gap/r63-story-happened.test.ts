/**
 * R63-B S9: Kroger's page said "Nothing has happened between us yet" and "no buyer input on record" while the same page
 * quoted "We lose about 3 hours per shift..." and "We pay about forty thousand a month...", with two open deals and a
 * meeting tomorrow. The between-us row read only the email ledgers. One reader (story.ts happenedSoFar: the touches,
 * the buyer's words on record, a recorded conversation, the open deals, a meeting ahead) now feeds both lines.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs, type BidInput } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { happenedSoFar, projectStory } from '@/lib/gap/story/story';

const NOW = new Date('2026-10-07T15:00:00Z');
const PILOT = { id: '312797001', name: 'YardFlow - Kroger Scratch Co r63', stage: 'Appointment scheduled', contactIds: ['c-ann'] };
const COLUMBUS = { id: '312797002', name: 'Kroger Scratch Co r63 Columbus DC', stage: 'Appointment scheduled', contactIds: ['c-ben'] };
const bid = (id: string, type: string, summary: string, at: string): BidInput => ({ id, type, summary, quote: summary, who: 'Ben Scratch', at, hypothesisId: null, scope: `Deal: ${COLUMBUS.name}` });
const BIDS = [bid('b1', 'business_problem', 'We lose about 3 hours per shift hunting for trailers at the Columbus gate.', '2026-10-07T13:00:00.000Z'), bid('b2', 'metric', 'We pay about forty thousand a month in detention at Columbus.', '2026-10-06T13:00:00.000Z')];

const inputsWith = (over: Partial<AccountInputs>): AccountInputs =>
  ({
    account: { name: 'Kroger Scratch Co r63', tier: 'Tier 1', priorityBand: 'A', vertical: 'retail', parentBrand: null, hubspotCompanyId: '1' },
    aliases: [], domains: ['kroger-scratch-co-r63.example.com'], siblings: [], watched: true, watchReasons: [],
    facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas: [], candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'CLEAR', detail: '', deals: [] },
    pack: null, microsite: null, facilityFact: null, roi: null,
    ...over,
  }) as unknown as AccountInputs;
const ctx: AccountContext = {
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
  engagement: projectEngagement([], NOW),
  history: [],
  assets: [],
  legacyNote: null,
};
const storyOf = (inputs: AccountInputs, booked: { at: string; what: string } | null = null) => {
  const deals = inputs.opportunity?.status === 'ACTIVE' ? inputs.opportunity.deals : [];
  const state = projectPursuitState({ accountName: inputs.account.name, now: NOW, motionType: deals.length ? 'IN_DEAL' : 'FACT_LED', opportunity: { status: inputs.opportunity?.status ?? 'CLEAR', detail: '', deals: deals.map((d) => ({ name: d.name, stage: d.stage })) }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [] });
  const brief = buildAccountBrief(inputs, NOW);
  const v = projectNow(brief, ctx, inputs, NOW);
  return projectStory({ accountName: inputs.account.name, now: NOW, state, brief, inputs, whyNow: v.whyNow, know: v.know, touches: [], clawdRead: 'ok', vaultNote: null, excluded: [], booked });
};
const texts = (story: ReturnType<typeof projectStory>, key: string) => story.rows.find((r) => r.key === key)?.sentences.map((s) => s.text) ?? [];

describe('R63-B S9: one reader for "has anything happened between us"', () => {
  it('Kroger: two open deals, the buyer\'s words and a meeting tomorrow are what has happened; the learn line does not say "no buyer input"', () => {
    const kroger = inputsWith({ bids: BIDS, opportunity: { status: 'ACTIVE', detail: '', deals: [PILOT, COLUMBUS] } });
    const story = storyOf(kroger, { at: '2026-10-08T14:00:00.000Z', what: 'Columbus yard walk with Ben' });
    expect(texts(story, 'between_us')).toEqual([
      'In 2 open deals: YardFlow - Kroger Scratch Co r63; Kroger Scratch Co r63 Columbus DC.',
      'Their own words are on record: 2 statements, the newest from Ben Scratch on Oct 7.',
      'A meeting is booked for Oct 8: Columbus yard walk with Ben.',
    ]);
    expect(JSON.stringify(story.rows)).not.toMatch(/Nothing has happened|no buyer input on record/);
    const learn = story.rows.find((r) => r.key === 'learn')!;
    expect(learn.sentences[0]).toMatchObject({ text: 'Nothing from the buyer yet on how they run the yards today or why it happens.', tag: 'Unknown', basis: "the buyer's 2 statements on record do not cover these" });
    // The same reader, read directly.
    expect(happenedSoFar({ touches: [], inputs: kroger, booked: null, now: NOW })).toMatchObject({ any: true, touched: false, buyerWords: { count: 2, newest: { who: 'Ben Scratch' } }, deals: [{ name: PILOT.name }, { name: COLUMBUS.name }] });
  });

  it('a recorded conversation alone is something that happened, in the seller words for it', () => {
    const story = storyOf(inputsWith({ conversation: { who: 'Ann Scratch', responseClass: 'meeting_accepted', at: '2026-10-06T15:00:00.000Z' } }));
    expect(texts(story, 'between_us')).toEqual(['A conversation is recorded with Ann Scratch on Oct 6: they agreed to meet.']);
  });

  it('with nothing on record the lines stay as they were: nothing between us, no buyer input', () => {
    const story = storyOf(inputsWith({}));
    expect(texts(story, 'between_us')).toEqual(['No touch on record between us.']);
    expect(story.rows.find((r) => r.key === 'learn')!.sentences[0].basis).toBe('no buyer input on record');
    expect(happenedSoFar({ touches: [], inputs: inputsWith({}), booked: null, now: NOW }).any).toBe(false);
  });
});
