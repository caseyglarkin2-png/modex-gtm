/**
 * UX-05 ACCOUNT STORY (derived, never stored): one pure projection over readers GAP already has. Every sentence
 * carries a tag and basis ids; a row's tag is the weakest class of its sentences; GOAL / NETWORK / YARD are never
 * Checked without a buyer input or a verified fact id; a line containing an Unverified signal's text is Unverified;
 * WHAT HAS HAPPENED BETWEEN US names the last person touched and the reply class; an Unverified item that names the
 * chosen person's unit rises beside the person; the sentinel private page never appears in any story or listen text.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectPursuitState, type PursuitState } from '@/lib/gap/pursuit/state';
import { projectStory, storyListenText, STRENGTH, weakestTag, type StoryInput } from '@/lib/gap/story/story';
import { mergeTouches, nameFromAddress, type StoryTouch } from '@/lib/gap/story/touches';

const NOW = new Date('2026-10-06T12:00:00Z');
const PRIVATE_SENTINEL = '/for/fedex-private-sentinel';

// FedEx: a verified network program, an unverified sale of FedEx Supply Chain, Courtney Keen (FedEx Supply Chain)
// on an automatic reply, Glen Chaffee chosen by Casey, clawd sends to Michael Jeannotte.
const fedexFact = { id: 'f-n2', quote: 'FedEx is consolidating its Ground and Express networks under Network 2.0, closing facilities and rerouting volume.', url: 'https://sec.gov/fedex-10k', title: '10-K', publishedAt: '2026-07-20T00:00:00Z', expiresAt: null, continuity: 'ongoing_state' as const, currentness: null };
const fedexHyp = { id: 'h-fedex', status: 'active', observation: fedexFact.quote, problem: 'The surviving hubs absorb rerouted volume and the yards become the constraint.', rootCauses: ['Gate check-in is not tied to dock assignment'], impacts: [], falsification: ['Do the surviving hubs run more trailers through the same gates?'], whatANoMeans: 'Volume moved without yard strain. A no means the gate is not the constraint.', primarySignalId: 'f-n2', reviewedAt: '2026-09-01T00:00:00Z' };
const fedexInputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'FedEx', tier: 'Tier 1', priorityBand: 'A', vertical: 'carrier', parentBrand: null, hubspotCompanyId: '1' },
  aliases: [], domains: ['fedex.com'], siblings: [], watched: true, watchReasons: [],
  facts: [fedexFact], signals: [{ id: 's-cma', title: 'FedEx to sell FedEx Supply Chain to CMA CGM', url: 'https://news.example/cma', publishedAt: '2026-09-25T00:00:00Z', researchStatus: 'pending' }], lastResearch: null,
  hypotheses: [fedexHyp], bids: [],
  personas: [
    { id: 7, name: 'Glen Chaffee', title: 'Managing Director, Transportation & Logistics', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
    { id: 8, name: 'Courtney Keen', title: 'Managing Director, FedEx Supply Chain', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
    { id: 9, name: 'Michael Jeannotte', title: 'VP, Ground Operations', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
  ],
  candidates: [], memberships: [], firstTouches: [], conversation: null, opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  ...over,
});
const ctxFor = (history: AccountContext['history'] = []): AccountContext => ({
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
  engagement: { ...projectEngagement([], NOW), sessions: 3, material: true, pages: [PRIVATE_SENTINEL], line: `Private: interest signal, never mention to the buyer. 3 deep sessions on ${PRIVATE_SENTINEL}.` },
  history,
  assets: [],
  legacyNote: null,
});
const fedexHistory: AccountContext['history'] = [
  { at: '2026-06-02T12:00:00Z', kind: 'reply', visibility: 'seller', text: 'Reply from Courtney Keen: I am in the office but my responses will be delayed.' },
  { at: '2026-06-01T12:00:00Z', kind: 'email_sent', visibility: 'seller', text: 'Email to courtney.keen@fedex.com: Yard dwell at the surviving hubs' },
];
const fedexState = (inputs: AccountInputs, over: Partial<Parameters<typeof projectPursuitState>[0]> = {}): PursuitState =>
  projectPursuitState({ accountName: 'FedEx', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: { personaId: 7, by: 'casey@yardflow.ai', at: '2026-10-05T20:41:00Z', source: 'owner_resolution' }, activePersona: null, replies: [{ from: 'courtney.keen@fedex.com', name: 'Courtney Keen', at: '2026-06-02T12:00:00Z', subject: null, snippet: 'I am in the office but my responses will be delayed.', triaged: false }], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: inputs.personas.map((p) => ({ key: `gap:${p.id}`, personaId: p.id, name: p.name, title: p.title })), ...over });

function build(inputs: AccountInputs, ctx: AccountContext, state: PursuitState, over: Partial<StoryInput> = {}) {
  const brief = buildAccountBrief(inputs, NOW);
  const v = projectNow(brief, ctx, inputs, NOW);
  const replies = state.replyClass && state.lastInbound ? [{ from: state.lastInbound.who, at: state.lastInbound.at, snippet: 'I am in the office but my responses will be delayed.', kind: state.replyClass.kind, label: state.replyClass.label }] : [];
  const touches: StoryTouch[] = over.touches ?? mergeTouches({ history: ctx.history, firstTouches: inputs.firstTouches, clawd: { read: 'ok', sends: [] }, replies, people: inputs.personas, now: NOW });
  const input: StoryInput = { accountName: inputs.account.name, now: NOW, state, brief, inputs, whyNow: v.whyNow, know: v.know, touches, clawdRead: 'ok', vaultNote: null, excluded: [], ...over };
  return { story: projectStory(input), v, brief };
}

describe('story: tags and bases', () => {
  it('every sentence carries a tag and basis ids; a row takes the weakest class of its sentences', () => {
    const inputs = fedexInputs();
    const { story } = build(inputs, ctxFor(fedexHistory), fedexState(inputs));
    expect(story.rows.length).toBeGreaterThan(0);
    for (const row of story.rows) {
      expect(row.sentences.length).toBeGreaterThan(0);
      for (const s of row.sentences) {
        expect(STRENGTH[s.tag]).toBeDefined();
        expect(s.basis).not.toBe('');
        expect(Array.isArray(s.basisIds)).toBe(true);
      }
      expect(row.tag).toBe(weakestTag(row.sentences.map((s) => s.tag)));
    }
    expect(weakestTag(['Checked', 'Unverified'])).toBe('Unverified');
    expect(weakestTag(['Buyer said', 'Our read'])).toBe('Our read');
    expect(weakestTag(['Checked', 'Unknown'])).toBe('Unknown');
  });
  it('GOAL / NETWORK / YARD are never Checked without a buyer input or a verified fact id; YARD is Our read with its Wrong if', () => {
    const inputs = fedexInputs();
    const { story } = build(inputs, ctxFor(fedexHistory), fedexState(inputs));
    const row = (k: string) => story.rows.find((r) => r.key === k);
    expect(row('goal')).toBeUndefined();
    const changing = row('changing')!;
    expect(changing.sentences.every((s) => s.tag !== 'Checked' || s.basisIds.some((id) => /^(evidence:|bid:)/.test(id)))).toBe(true);
    expect(changing.sentences[0].basisIds).toContain('evidence:f-n2');
    // A source speaking as itself is attributed, never read as GAP's claim; a third-person fact is not.
    expect(changing.sentences[0].text).toMatch(/^FedEx is consolidating/);
    const firstPerson = fedexInputs({ facts: [{ ...fedexFact, id: 'f-we', quote: 'With Tricolor, we are redesigning our international air network by deploying our aircraft strategically.' }], hypotheses: [] });
    const fp = build(firstPerson, ctxFor(), fedexState(firstPerson, { replies: [] })).story.rows.find((r) => r.key === 'changing')!;
    expect(fp.sentences[0].text).toBe('FedEx says: "With Tricolor, we are redesigning our international air network by deploying our aircraft strategically."');
    expect(fp.sentences[0].tag).toBe('Checked');
    const withGoal = build(fedexInputs({ bids: [{ id: 'b9', type: 'future_state', summary: 'We want one process at every hub by 2027.', quote: 'x', who: 'glen@fedex.com', at: '2026-10-01T00:00:00Z', hypothesisId: null }] }), ctxFor(), fedexState(inputs)).story;
    expect(withGoal.rows.find((r) => r.key === 'goal')!.tag).toBe('Buyer said');
    expect(withGoal.rows.map((r) => r.key).indexOf('goal')).toBe(1);
    // The brief builder sets an angle's inference to its problem, so NETWORK is absent here (YARD says it once).
    expect(row('network')).toBeUndefined();
    const distinct = projectStory({ accountName: 'FedEx', now: NOW, state: fedexState(inputs), brief: { ...buildAccountBrief(inputs, NOW), hypotheses: buildAccountBrief(inputs, NOW).hypotheses.map((h) => ({ ...h, inference: 'Rerouted volume lands on fewer, larger hubs.' })) }, inputs, whyNow: [], know: [], touches: [], clawdRead: 'ok', vaultNote: null, excluded: [] });
    const network = distinct.rows.find((r) => r.key === 'network')!;
    expect(network.tag).toBe('Our read');
    expect(network.sentences[0].basisIds).toContain('hypothesis:h-fedex');
    expect(network.sentences[0].basisIds).toContain('evidence:f-n2');
    const yard = row('yard')!;
    expect(yard.tag).toBe('Our read');
    expect(yard.wrongIf).toMatch(/Volume moved without yard strain/);
    expect(yard.sentences[0].text).toMatch(/surviving hubs absorb rerouted volume/);
    // An angle whose inference is its problem in the same words shows YARD once, never NETWORK too (FedEx live data).
    const same = fedexInputs({ hypotheses: [{ ...fedexHyp, problem: 'The surviving hubs absorb rerouted volume.' }] });
    const b2 = buildAccountBrief(same, NOW);
    const sameStory = projectStory({ accountName: 'FedEx', now: NOW, state: fedexState(same), brief: { ...b2, hypotheses: b2.hypotheses.map((h) => ({ ...h, inference: 'the surviving hubs absorb rerouted volume' })) }, inputs: same, whyNow: [], know: [], touches: [], clawdRead: 'ok', vaultNote: null, excluded: [] });
    expect(sameStory.rows.find((r) => r.key === 'network')).toBeUndefined();
    expect(sameStory.rows.find((r) => r.key === 'yard')!.sentences[0].text).toBe('The surviving hubs absorb rerouted volume.');
    // Without a grounded hypothesis and without a BID, NETWORK and YARD are absent, never manufactured.
    const bare = fedexInputs({ hypotheses: [] });
    const { story: s2 } = build(bare, ctxFor(), fedexState(bare));
    expect(s2.rows.find((r) => r.key === 'network')).toBeUndefined();
    expect(s2.rows.find((r) => r.key === 'yard')).toBeUndefined();
  });
  it('a buyer-confirmed problem makes YARD "Buyer said" with the BID id and no Wrong if', () => {
    const inputs = fedexInputs({ bids: [{ id: 'b1', type: 'business_problem', summary: 'Trailers wait two hours at Memphis before a door opens.', quote: 'x', who: 'glen@fedex.com', at: '2026-10-01T00:00:00Z', hypothesisId: 'h-fedex' }] });
    const { story } = build(inputs, ctxFor(), fedexState(inputs));
    const yard = story.rows.find((r) => r.key === 'yard')!;
    expect(yard.tag).toBe('Buyer said');
    expect(yard.sentences[0].basisIds).toContain('bid:b1');
    expect(yard.sentences[0].text).toMatch(/Trailers wait two hours at Memphis/);
    expect(yard.wrongIf).toBeNull();
  });
  it("a line containing an Unverified signal's text is Unverified", () => {
    const inputs = fedexInputs();
    const { story } = build(inputs, ctxFor(), fedexState(inputs));
    for (const row of story.rows) for (const s of row.sentences) if (/CMA CGM/.test(s.text)) expect(s.tag).toBe('Unverified');
    for (const s of story.checkBeforeContacting) expect(s.tag).toBe('Unverified');
  });
});

describe('story: what has happened between us', () => {
  it('names the last person touched with their title and the reply class', () => {
    const inputs = fedexInputs();
    const { story } = build(inputs, ctxFor(fedexHistory), fedexState(inputs));
    const row = story.rows.find((r) => r.key === 'between_us')!;
    const text = row.sentences.map((s) => s.text).join(' ');
    expect(text).toMatch(/Courtney Keen, Managing Director, FedEx Supply Chain/);
    expect(text).toMatch(/Jun 1/);
    expect(text).toMatch(/automatic reply/i);
    expect(row.sentences.find((s) => /automatic reply/i.test(s.text))!.tag).toBe('Checked');
    // The June notice answers the June email: no silence claimed.
    expect(text).not.toMatch(/No answer on record/);
    // A newer send after that notice is unanswered: the silence is said against the LAST email.
    const later = mergeTouches({ history: fedexHistory, firstTouches: [], clawd: { read: 'ok', sends: [{ type: 'send', date: '2026-08-07T20:05:38+00:00', subject: 'Network 2.0', status: 'sent', to: 'michael.jeannotte@fedex.com' }] }, replies: [{ from: 'courtney.keen@fedex.com', at: '2026-06-02T12:00:00Z', snippet: 'I am in the office but my responses will be delayed.', kind: 'out_of_office', label: 'Automatic reply' }], people: inputs.personas, now: NOW });
    const t2 = build(inputs, ctxFor(fedexHistory), fedexState(inputs), { touches: later }).story.rows.find((r) => r.key === 'between_us')!.sentences.map((s) => s.text).join(' ');
    expect(t2).toMatch(/Last email to Michael Jeannotte, VP, Ground Operations, Aug 7: "Network 2.0"\. No answer on record\./);
    expect(t2).toMatch(/Courtney Keen.*automatic reply on Jun 2/);
    // The story's first rows for the 820 second screen: between us, what is changing, the yard opportunity.
    expect(story.first.map((r) => r.key)).toEqual(['between_us', 'changing', 'yard']);
  });
  it('an opt-out reads as Buyer said with their words; clawd sends count as touches with the person named from the address', () => {
    const inputs = fedexInputs();
    const state = fedexState(inputs, { replies: [{ from: 'michael.jeannotte@fedex.com', name: null, at: '2026-08-08T12:00:00Z', subject: 'Re: Network 2.0', snippet: 'stop', triaged: false }] });
    const touches = mergeTouches({
      history: [],
      firstTouches: [],
      clawd: { read: 'ok', sends: [{ type: 'send', date: '2026-08-07T20:05:38+00:00', subject: 'Re: Network 2.0 and the math on consolidated yards', status: 'sent', to: 'michael.jeannotte@fedex.com' }, { type: 'send', date: '2026-07-31T14:13:17+00:00', subject: 'Yard management at FedEx', status: 'sent', to: 'kym.white@fedex.com' }] },
      replies: [{ from: 'michael.jeannotte@fedex.com', at: '2026-08-08T12:00:00Z', snippet: 'stop', kind: state.replyClass!.kind, label: state.replyClass!.label }],
      people: inputs.personas,
      now: NOW,
    });
    expect(nameFromAddress('michael.jeannotte@fedex.com')).toBe('Michael Jeannotte');
    const { story } = build(inputs, ctxFor(), state, { touches });
    const row = story.rows.find((r) => r.key === 'between_us')!;
    const text = row.sentences.map((s) => s.text).join(' ');
    expect(text).toMatch(/Michael Jeannotte, VP, Ground Operations/);
    expect(text).toMatch(/Aug 7/);
    expect(text).toMatch(/opted out/i);
    expect(row.sentences.find((s) => /opted out/i.test(s.text))!.tag).toBe('Buyer said');
    expect(text).toMatch(/2 emails to 2 people/);
    // The opt-out answered an email GAP sent (Aug 7): no orphan note. An opt-out with no prior send says so.
    expect(text).not.toMatch(/not in GAP's ledgers/);
    const orphan = build(inputs, ctxFor(), state, { touches: mergeTouches({ history: [], firstTouches: [], clawd: { read: 'ok', sends: [] }, replies: [{ from: 'michael.jeannotte@fedex.com', at: '2026-08-08T12:00:00Z', snippet: 'stop', kind: 'opt_out', label: 'Opted out' }], people: inputs.personas, now: NOW }) }).story;
    expect(orphan.rows.find((r) => r.key === 'between_us')!.sentences[0].text).toMatch(/opted out on Aug 8 \("stop"\)\. The email it answered is not in GAP's ledgers\./);
    expect(row.sentences.find((s) => /2 emails/.test(s.text))!.basis).toMatch(/clawd/);
  });
  it('nothing on record is said as Checked when every ledger answered, and as Unknown when clawd could not be read', () => {
    const inputs = fedexInputs();
    const ok = build(inputs, ctxFor(), fedexState(inputs, { replies: [] }), { touches: [], clawdRead: 'ok' }).story.rows.find((r) => r.key === 'between_us')!;
    expect(ok.tag).toBe('Checked');
    expect(ok.sentences[0].text).toMatch(/No touch on record between us/);
    const down = build(inputs, ctxFor(), fedexState(inputs, { replies: [] }), { touches: [], clawdRead: 'unavailable' }).story.rows.find((r) => r.key === 'between_us')!;
    expect(down.tag).toBe('Unknown');
    expect(down.sentences[0].text).toMatch(/could not be read/);
  });
});

describe('story: check before contacting and the private guard', () => {
  it("an Unverified sale that names the chosen person's unit rises beside the person (FedEx: the CMA CGM sale against Courtney Keen)", () => {
    const inputs = fedexInputs();
    const courtney = fedexState(inputs, { choice: { personaId: 8, by: 'casey@yardflow.ai', at: '2026-10-05T20:41:00Z', source: 'owner_resolution' }, replies: [] });
    const { story } = build(inputs, ctxFor(), courtney);
    expect(story.checkBeforeContacting).toHaveLength(1);
    expect(story.checkBeforeContacting[0].text).toMatch(/^Check before contacting Courtney Keen: .*CMA CGM/);
    expect(story.checkBeforeContacting[0].tag).toBe('Unverified');
    expect(story.checkBeforeContacting[0].basisIds).toContain('signal:s-cma');
    // Glen (Transportation & Logistics) is not named by that report: nothing rises.
    const glen = build(inputs, ctxFor(), fedexState(inputs, { replies: [] })).story;
    expect(glen.checkBeforeContacting).toHaveLength(0);
  });
  it('a person set aside as a divested unit on the strength of that unverified sale is said so', () => {
    const inputs = fedexInputs();
    const { story } = build(inputs, ctxFor(), fedexState(inputs, { replies: [] }), { excluded: [{ key: 'gap:11', name: 'Ray Hatton', title: 'Director, FedEx Supply Chain', code: 'divested_entity', reason: 'FedEx Supply Chain is being sold to CMA CGM.' }] });
    expect(story.checkBeforeContacting).toHaveLength(0);
    const ray = story.setAsideCaveats.find((s) => /Ray Hatton/.test(s.text));
    expect(ray).toBeDefined();
    expect(ray!.tag).toBe('Unverified');
    expect(ray!.text).toMatch(/^Ray Hatton, Director, FedEx Supply Chain is set aside as a divested unit; that rests on an unverified report \(FedEx to sell FedEx Supply Chain to CMA CGM\)\.$/);
    // Two people on the same report are one sentence, never two.
    const two = build(inputs, ctxFor(), fedexState(inputs, { replies: [] }), { excluded: [{ key: 'gap:11', name: 'Ray Hatton', title: 'Director, FedEx Supply Chain', code: 'divested_entity', reason: 'sold' }, { key: 'gap:12', name: 'Scott Temple', title: 'President, FedEx Supply Chain', code: 'divested_entity', reason: 'sold' }] }).story;
    expect(two.setAsideCaveats).toHaveLength(1);
    expect(two.setAsideCaveats[0].text).toMatch(/^Ray Hatton and Scott Temple are set aside as a divested unit/);
    expect(two.setAsideCaveats[0].basisIds).toEqual(['signal:s-cma', 'set-aside:gap:11', 'set-aside:gap:12']);
  });
  it('a set-aside backed by the company\'s own release is Checked and names the release; the same deal from a third party is never told beside it', () => {
    const inputs = fedexInputs();
    const source = { url: 'https://newsroom.fedex.com/fedex-completes-sale-of-fedex-supply-chain-to-cma-cgm-group', publisher: 'FedEx newsroom', quote: 'FedEx Corp. (NYSE: FDX) today announced the completion of its sale of FedEx Supply Chain, a subsidiary of FedEx Corp., to CMA CGM Group for an enterprise value of $1.4 billion.', publishedAt: '2026-10-01' };
    const { story } = build(inputs, ctxFor(), fedexState(inputs, { replies: [] }), { excluded: [{ key: 'gap:11', name: 'Ray Hatton', title: 'Director, FedEx Supply Chain', code: 'divested_entity', reason: 'sold', source }, { key: 'gap:12', name: 'Scott Temple', title: 'President, FedEx Supply Chain', code: 'divested_entity', reason: 'sold', source }] });
    expect(story.setAsideCaveats).toHaveLength(1);
    expect(story.setAsideCaveats[0].tag).toBe('Checked');
    expect(story.setAsideCaveats[0].text).toBe('Ray Hatton and Scott Temple are set aside as a divested unit: FedEx Corp. announced on Oct 1 the completion of its sale of FedEx Supply Chain, a subsidiary of FedEx Corp., to CMA CGM Group for an enterprise value of $1.4 billion.');
    expect(story.setAsideCaveats[0].basis).toBe('FedEx newsroom, Oct 1');
    expect(story.setAsideCaveats[0].basisIds).toContain('first-party:https://newsroom.fedex.com/fedex-completes-sale-of-fedex-supply-chain-to-cma-cgm-group');
    // The third party's "FedEx to sell FedEx Supply Chain to CMA CGM" is the same deal: not a story line any more.
    expect(story.rows.flatMap((r) => r.sentences).some((s) => /CMA CGM/.test(s.text))).toBe(false);
  });
  it('the sentinel private page never appears in any story or listen text; private engagement is never a row', () => {
    const inputs = fedexInputs();
    const { story, v } = build(inputs, ctxFor(fedexHistory), fedexState(inputs));
    const all = [...story.rows.flatMap((r) => r.sentences.map((s) => `${s.text} ${s.basis}`)), ...story.checkBeforeContacting.map((s) => s.text), ...story.setAsideCaveats.map((s) => s.text), storyListenText(story)].join(' ');
    expect(all).not.toContain(PRIVATE_SENTINEL);
    expect(all).not.toMatch(/deep session|ROI read|interest signal/i);
    expect(story.rows.map((r) => r.key)).not.toContain('private');
    expect(v.private).toContain(PRIVATE_SENTINEL);
  });
  it('Listen reads the rows with their tags in words, never the vault note', () => {
    const inputs = fedexInputs();
    const { story } = build(inputs, ctxFor(fedexHistory), fedexState(inputs), { vaultNote: { text: 'Consolidation makes the yards the constraint.', at: '2026-07-10' } });
    expect(story.rows.find((r) => r.key === 'note')!.tag).toBe('Our read');
    const listen = storyListenText(story);
    expect(listen).toMatch(/^Account story\./);
    expect(listen).toMatch(/What has happened between us:/);
    expect(listen).toMatch(/\(checked\)/);
    expect(listen).toMatch(/\(our read\)/);
    expect(listen).not.toMatch(/Consolidation makes the yards the constraint/);
  });
});

describe('story: seller prose and one idea once', () => {
  it('strips a press-release dateline and a currentness note; the same idea in two sources is told once, the checked one', () => {
    const inputs = fedexInputs({
      facts: [
        fedexFact,
        { id: 'f-cin', quote: 'CINCINNATI -- FedEx plans to invest more than $300 million in a new hub in Turtlecreek Township, creating 300 jobs and expanding its investment in Greater Cincinnati.', url: 'https://jobsohio.com/x', title: 'press', publishedAt: '2026-09-28T00:00:00Z', expiresAt: null, continuity: 'ongoing_state' as const, currentness: { url: 'https://jobsohio.com/x', publishedAt: '2026-10-01T00:00:00Z' } },
      ],
      signals: [{ id: 's-cin', title: 'FedEx commits to $300M project in Cincinnati-Dayton corridor', url: 'https://news.example/cin', publishedAt: '2026-09-28T00:00:00Z', researchStatus: 'pending' }],
      hypotheses: [],
    });
    const { story } = build(inputs, ctxFor(), fedexState(inputs, { replies: [] }), { touches: [] });
    const all = story.rows.flatMap((r) => r.sentences.map((s) => s.text));
    expect(all.some((t) => /^CINCINNATI/.test(t))).toBe(false);
    expect(all.some((t) => /current as of/i.test(t))).toBe(false);
    expect(all.filter((t) => /\$300/.test(t))).toHaveLength(1);
    expect(story.rows.flatMap((r) => r.sentences).find((s) => /\$300/.test(s.text))!.tag).toBe('Checked');
  });
});

describe('story: a broken number, an incidental headline, the Wrong if clause', () => {
  const krogerFacts = [
    { id: 'f-uni', quote: 'Kroger has rolled out new outfits, based on customer feedback, for its in-store staff members.', url: 'https://news.example/uniforms', title: 'news', publishedAt: '2026-09-30T00:00:00Z', expiresAt: null, continuity: 'event' as const, currentness: null },
    { id: 'f-merge', quote: 'Kroger and Giant Eagle announced a definitive merger agreement that will combine and consolidate their distribution networks across the Midwest.', url: 'https://sec.gov/kroger-8k', title: '8-K', publishedAt: '2026-09-20T00:00:00Z', expiresAt: null, continuity: 'ongoing_state' as const, currentness: null },
  ];
  it('a Checked line whose dollar figure does not parse is downgraded to Unverified and never leads', () => {
    const heb = fedexInputs({ account: { name: 'H-E-B', tier: 'Tier 1', priorityBand: 'A', vertical: 'grocery', parentBrand: null, hubspotCompanyId: '4' }, domains: ['heb.com'], facts: [{ id: 'f-175', quote: 'H-E-B plans to build a $175 new refrigerated facility at its campus.', url: 'https://news.example/heb', title: 'news', publishedAt: '2026-09-25T00:00:00Z', expiresAt: null, continuity: 'event' as const, currentness: null }, { id: 'f-ok', quote: 'H-E-B is opening a 1 million square foot distribution center in San Antonio in 2027.', url: 'https://news.example/sa', title: 'news', publishedAt: '2026-09-26T00:00:00Z', expiresAt: null, continuity: 'event' as const, currentness: null }], signals: [], hypotheses: [] });
    const { story } = build(heb, ctxFor(), fedexState(heb, { replies: [] }), { touches: [] });
    const all = story.rows.flatMap((r) => r.sentences);
    const broken = all.find((s) => /\$175/.test(s.text))!;
    expect(broken.tag).toBe('Unverified');
    expect(broken.basis).toMatch(/does not parse/);
    expect(broken.cite ?? null).toBeNull();
    const changing = story.rows.find((r) => r.key === 'changing')!;
    expect(changing.sentences[0].text).toMatch(/San Antonio/);
  });
  it('a merger leads a uniform story; the same deal under a signal is told once; a long filing sentence is cut at a word; "Wrong if" never doubles the if', () => {
    const inputs = fedexInputs({ account: { name: 'Kroger', tier: 'Tier 1', priorityBand: 'A', vertical: 'grocery', parentBrand: null, hubspotCompanyId: '3' }, domains: ['kroger.com'], facts: krogerFacts, signals: [{ id: 's-ge', title: 'Kroger Announces Agreement to Acquire Giant Eagle', url: 'https://news.example/ge', publishedAt: '2026-09-21T00:00:00Z', researchStatus: 'pending' }], hypotheses: [{ ...fedexHyp, id: 'h-k', observation: krogerFacts[1].quote, primarySignalId: 'f-merge', whatANoMeans: 'If trailers do not wait longer at the sites that remain, the change moved no load onto the yard. A no closes it.' }] });
    const { story } = build(inputs, ctxFor(), fedexState(inputs, { replies: [] }), { touches: [] });
    const changing = story.rows.find((r) => r.key === 'changing')!;
    expect(changing.sentences[0].text).toMatch(/Giant Eagle/);
    expect(changing.sentences.some((s) => /outfits/.test(s.text))).toBe(false);
    expect(story.rows.flatMap((r) => r.sentences).filter((s) => /Giant Eagle/.test(s.text))).toHaveLength(1);
    const long = fedexInputs({ facts: [{ ...fedexFact, id: 'f-long', quote: 'These milestones reflect continued progress during a period of significant network transformation, closely aligned with our broader network redesign, which is reshaping how fleets and infrastructure are deployed across our operations and markets worldwide.' }], hypotheses: [] });
    const cut = build(long, ctxFor(), fedexState(long, { replies: [] }), { touches: [] }).story.rows.find((r) => r.key === 'changing')!.sentences[0].text;
    expect(cut.length).toBeLessThanOrEqual(220);
    expect(cut).toMatch(/\.\.\./);
    expect(story.rows.find((r) => r.key === 'yard')!.wrongIf).toMatch(/^if trailers do not wait longer/);
  });
});

describe('story: PepsiCo (research, nothing between us, a verified fact with no grounded angle)', () => {
  const pepsiFact = { id: 'f-pep', quote: 'PepsiCo is building a 1.2 million square foot distribution center in Denver, opening in 2027.', url: 'https://news.example/pep', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-03-01T00:00:00Z', continuity: 'event' as const, currentness: null };
  const pepsi = fedexInputs({ account: { name: 'PepsiCo', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '2' }, domains: ['pepsico.com'], facts: [pepsiFact], signals: [], hypotheses: [], personas: [{ id: 1, name: 'Karen Darling', title: 'Sr Director PBNA Transportation', doNotContact: false, hasEmail: true, emailStatus: 'valid' }, { id: 2, name: 'Shawn Pierce', title: 'Sr Director Transportation Strategy', doNotContact: false, hasEmail: true, emailStatus: 'valid' }] });
  it('WHAT IS CHANGING carries the checked fact with its cite status; WHAT WE NEED TO LEARN is Unknown; no NETWORK or YARD row without an angle', () => {
    const state = projectPursuitState({ accountName: 'PepsiCo', now: NOW, motionType: 'NO_GOOD_MOTION', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: pepsi.personas.map((p) => ({ key: `gap:${p.id}`, personaId: p.id, name: p.name, title: p.title })), briefNext: 'No thesis grounded on the verified fact yet: draft and review one.' });
    const { story } = build(pepsi, ctxFor(), state, { touches: [] });
    const changing = story.rows.find((r) => r.key === 'changing')!;
    expect(changing.tag).toBe('Checked');
    expect(changing.sentences[0].text).toMatch(/Denver/);
    expect(changing.sentences[0].cite).toBe('OK to cite to the buyer');
    expect(changing.sentences[0].basisIds).toContain('evidence:f-pep');
    const learn = story.rows.find((r) => r.key === 'learn')!;
    expect(learn.tag).toBe('Unknown');
    expect(learn.sentences).toHaveLength(1);
    expect(learn.sentences[0].text).toBe('Nothing from the buyer yet on how they run the yards today, what it costs them or why it happens.');
    expect(story.rows.find((r) => r.key === 'network')).toBeUndefined();
    expect(story.rows.find((r) => r.key === 'yard')).toBeUndefined();
    expect(story.rows.find((r) => r.key === 'between_us')!.sentences[0].text).toMatch(/No touch on record/);
    // A send with no reply is one sentence, Checked when every ledger answered, Unknown when clawd could not be read.
    const sent = [{ kind: 'send' as const, at: '2026-06-10T12:00:00Z', name: 'Laura Maxwell', title: 'SVP Supply Chain', address: 'laura.maxwell@pepsico.com', what: 'One live view across your yards', source: 'account history' as const }];
    const okRow = build(pepsi, ctxFor(), state, { touches: sent, clawdRead: 'ok' }).story.rows.find((r) => r.key === 'between_us')!;
    expect(okRow.sentences).toHaveLength(1);
    expect(okRow.sentences[0].text).toBe('Last email to Laura Maxwell, SVP Supply Chain, Jun 10: "One live view across your yards". No answer on record.');
    const gapTouch = build(pepsi, ctxFor(), state, { touches: [{ ...sent[0], what: 'GAP first touch', source: 'GAP ledger' }], clawdRead: 'ok' }).story.rows.find((r) => r.key === 'between_us')!;
    expect(gapTouch.sentences[0].text).toBe('Last email to Laura Maxwell, SVP Supply Chain, Jun 10 (a GAP first touch). No answer on record.');
    expect(okRow.tag).toBe('Checked');
    const downRow = build(pepsi, ctxFor(), state, { touches: sent, clawdRead: 'unavailable' }).story.rows.find((r) => r.key === 'between_us')!;
    expect(downRow.tag).toBe('Unknown');
    expect(downRow.sentences[0].text).toMatch(/could not be read/);
    // Nothing in the story is email copy: no greeting, no sign-off, no "I ... you".
    for (const r of story.rows) for (const s of r.sentences) expect(s.text).not.toMatch(/^(Hi|Hello|Dear)\b|\bI\b .*\byou\b/);
  });
});
