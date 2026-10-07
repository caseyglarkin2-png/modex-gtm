/**
 * Sprint 5 review, SHOULD 5 (R50): the account-level views showed one deal's words unlabeled and contradicted the
 * brief. The account story's "Yard opportunity" was Ben's Columbus quote with no deal named; "What we need to learn"
 * said nothing was known on cost beside Ben's detention figure; "Commercial history" listed Ann's and Ben's lines with
 * no deal. Now every buyer input carries its opportunity's label (deals/scope.ts, the deal brief's own rule) into NOW,
 * the brief and the story, and a cost in money or detention terms counts as what it costs them.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs, type BidInput } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectBrief } from '@/lib/gap/context/brief';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { projectStory } from '@/lib/gap/story/story';
import { isCostBid } from '@/lib/gap/bid/cost';
import { bidScopeLabeler } from '@/lib/gap/deals/opportunities';

const NOW = new Date('2026-10-07T15:00:00Z');
const PILOT = { id: '392057001', name: 'YardFlow - Kroger Scratch Co', stage: 'Appointment scheduled', contactIds: ['c-ann'] };
const COLUMBUS = { id: '392057002', name: 'Kroger Scratch Co Columbus DC', stage: 'Qualified to buy', contactIds: ['c-ben'] };
const PEOPLE = [
  { personaId: 1, name: 'Ann Scratch', title: 'VP Supply Chain Operations', email: 'ann@kroger.example.com', hubspotContactId: 'c-ann' },
  { personaId: 2, name: 'Ben Scratch', title: 'Director, Columbus Distribution Center', email: 'ben@kroger.example.com', hubspotContactId: 'c-ben' },
  { personaId: 3, name: 'Cal Scratch', title: 'VP Transportation', email: 'cal@kroger.example.com', hubspotContactId: 'c-cal' },
];
const open = { status: 'ACTIVE', detail: '', deals: [PILOT, COLUMBUS] };

describe('Sprint 5 review: what it costs them', () => {
  it('an impact, or a metric in money or detention terms, is the cost; a volume figure alone is not', () => {
    expect(isCostBid({ type: 'metric', summary: 'We pay about forty thousand a month in detention at Columbus.' })).toBe(true);
    expect(isCostBid({ type: 'metric', summary: 'About 300 trailers a day come through the Columbus gate.' })).toBe(false);
    expect(isCostBid({ type: 'impact', summary: 'Drivers wait.' })).toBe(true);
    expect(isCostBid({ type: 'constraint', summary: 'Any pilot has to run on our existing gate cameras; no new spend this year.' })).toBe(false);
  });
});

describe('Sprint 5 review: each buyer input carries its opportunity in the account views', () => {
  const label = bidScopeLabeler(open, PEOPLE);
  it('recorded scope, the person on one deal, account-level; nothing at an account with no deal or an unread one', () => {
    expect(label({ metadata: { scope: { dealId: COLUMBUS.id } }, contactEmail: 'ben@kroger.example.com' })).toBe('Deal: Kroger Scratch Co Columbus DC');
    expect(label({ metadata: null, contactEmail: 'ANN@kroger.example.com' })).toBe('Deal: YardFlow - Kroger Scratch Co (through Ann Scratch)');
    expect(label({ metadata: null, contactEmail: 'cal@kroger.example.com' })).toBe('account-level');
    expect(bidScopeLabeler({ status: 'CLEAR', deals: [] }, PEOPLE)({ metadata: null, contactEmail: 'ann@kroger.example.com' })).toBeNull();
    expect(bidScopeLabeler({ status: 'UNKNOWN', deals: [] }, PEOPLE)({ metadata: { scope: { dealId: COLUMBUS.id } }, contactEmail: null })).toBeNull();
    expect(bidScopeLabeler(null, PEOPLE)({ metadata: null, contactEmail: null })).toBeNull();
  });
  it('a closed deal is named with its outcome; with only closed deals, the rest is account-level', () => {
    const closedOnly = bidScopeLabeler({ status: 'CLEAR', deals: [], closed: [{ id: COLUMBUS.id, name: COLUMBUS.name, won: true, closedAt: '2026-10-07T12:00:00Z' }] }, PEOPLE);
    expect(closedOnly({ metadata: { scope: { dealId: COLUMBUS.id } }, contactEmail: 'ben@kroger.example.com' })).toBe('Deal: Kroger Scratch Co Columbus DC (closed won, Oct 7, 2026)');
    expect(closedOnly({ metadata: null, contactEmail: 'ann@kroger.example.com' })).toBe('account-level');
  });

  const bid = (id: string, type: string, summary: string, who: string, scope: string): BidInput => ({ id, type, summary, quote: summary, who, at: '2026-10-07T13:00:00.000Z', hypothesisId: null, scope });
  const bids: BidInput[] = [
    bid('b1', 'business_problem', 'We lose about 3 hours per shift hunting for trailers at the Columbus gate.', 'Ben Scratch', 'Deal: Kroger Scratch Co Columbus DC'),
    bid('b2', 'metric', 'We pay about forty thousand a month in detention at Columbus.', 'Ben Scratch', 'Deal: Kroger Scratch Co Columbus DC'),
    bid('b3', 'constraint', 'Any pilot has to run on our existing gate cameras.', 'Ann Scratch', 'Deal: YardFlow - Kroger Scratch Co (through Ann Scratch)'),
  ];
  const inputs: AccountInputs = {
    account: { name: 'Kroger Scratch Co', tier: 'Tier 1', priorityBand: 'A', vertical: 'grocery', parentBrand: null, hubspotCompanyId: '1' },
    aliases: [], domains: ['kroger.example.com'], siblings: [], watched: true, watchReasons: [],
    facts: [], signals: [], lastResearch: null, hypotheses: [], bids,
    personas: PEOPLE.map((p) => ({ id: p.personaId, name: p.name, title: p.title, doNotContact: false, hasEmail: true, emailStatus: 'valid' })),
    candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'ACTIVE', detail: '', deals: [PILOT, COLUMBUS] },
    pack: null, microsite: null, facilityFact: null, roi: null,
  } as unknown as AccountInputs;
  const ctx: AccountContext = {
    relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
    engagement: projectEngagement([], NOW),
    history: [],
    assets: [],
    legacyNote: null,
  };
  const brief = buildAccountBrief(inputs, NOW);

  it('Commercial history names the deal on each buyer line; every buyer source carries it', () => {
    const sections = projectBrief(brief, ctx, inputs, NOW);
    const commercial = sections.find((s) => s.key === 'commercial')!;
    const said = commercial.notes.filter((n) => n.startsWith('Buyer said'));
    expect(said).toEqual([
      'Buyer said (business problem), Deal: Kroger Scratch Co Columbus DC: We lose about 3 hours per shift hunting for trailers at the Columbus gate.',
      'Buyer said (constraint), Deal: YardFlow - Kroger Scratch Co (through Ann Scratch): Any pilot has to run on our existing gate cameras.',
    ]);
    // The detention figure is told once across the brief (its own section), with the deal on its basis.
    const detention = sections.flatMap((s) => [...s.lines.map((l) => `${l.text} | ${l.basis}`), ...s.notes]).filter((t) => /forty thousand/.test(t));
    expect(detention).toHaveLength(1);
    expect(detention[0]).toMatch(/Deal: Kroger Scratch Co Columbus DC/);
    const sources = Object.values(brief.sections).flatMap((s) => s.statements).flatMap((s) => s.sources).filter((s) => s.kind === 'bid');
    expect(sources.length).toBeGreaterThan(0);
    for (const s of sources) expect(s.label).toMatch(/; Deal: /);
  });

  it('NOW reads the detention figure as the impact the buyer gave', () => {
    const v = projectNow(brief, ctx, inputs, NOW);
    expect(v.gap.find((g) => g.element === 'Impact')?.state).toBe('Buyer said');
  });

  it('the story: Yard opportunity names the Columbus deal on each sentence; What we need to learn no longer says cost is unknown', () => {
    const state = projectPursuitState({ accountName: 'Kroger Scratch Co', now: NOW, motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [PILOT, COLUMBUS].map((d) => ({ name: d.name, stage: d.stage })) }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [] });
    const v = projectNow(brief, ctx, inputs, NOW);
    const story = projectStory({ accountName: 'Kroger Scratch Co', now: NOW, state, brief, inputs, whyNow: v.whyNow, know: v.know, touches: [], clawdRead: 'ok', vaultNote: null, excluded: [] });
    const yard = story.rows.find((r) => r.key === 'yard')!;
    expect(yard.sentences.map((s) => [s.text, s.basis])).toEqual([
      ['We lose about 3 hours per shift hunting for trailers at the Columbus gate.', 'buyer said, Ben Scratch, Oct 7; Deal: Kroger Scratch Co Columbus DC'],
      ['We pay about forty thousand a month in detention at Columbus.', 'buyer said, Ben Scratch, Oct 7; Deal: Kroger Scratch Co Columbus DC'],
    ]);
    const learn = story.rows.find((r) => r.key === 'learn');
    expect(learn?.sentences[0].text ?? '').not.toMatch(/what it costs them/);
  });
});
