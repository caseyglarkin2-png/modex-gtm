/**
 * UX-11: what the ear gets. The scrubber drops addresses, numbers, links and ids; Listen to today is a concise spoken
 * projection of the Work cards in order; Listen to account is a 150 to 220 word brief that never speaks the private
 * line, the do-not-use list, an address or a URL, and names the first and second person only when a touch is live.
 */
import { describe, expect, it } from 'vitest';
import { completeSentence, forTheEar, spokenPerson, spokenSentence, wordCount } from '@/lib/gap/voice/for-the-ear';
import { todayListenText, TODAY_MAX_CHARS } from '@/lib/gap/voice/today';
import { accountListenText, ACCOUNT_LISTEN_WORDS, type AccountListenInput } from '@/lib/gap/voice/account';
import type { WorkCard } from '@/lib/gap/work/list';

describe('forTheEar', () => {
  it('drops URLs, emails, phone numbers, citation tokens, provenance ids and basis parentheses; machine words become words', () => {
    const t = forTheEar('Call Glen at 901-555-0100 or glen@fedex.com; see https://sec.gov/x [S:cmuwktaz300037kz08pc55j7o] (sec.gov, Jul 20, 2026); evidence:f-denver; transportation_leader.');
    expect(t).not.toMatch(/https?:|@|555|\[S:|evidence:|sec\.gov|_/);
    expect(t).toMatch(/their address/);
    expect(t).toMatch(/transportation leader/);
  });
  it('a spoken sentence carries its tag as an aside unless the words already say it; a person is said with a plain title', () => {
    expect(spokenSentence('PepsiCo is building a DC in Denver.', 'Checked')).toBe('PepsiCo is building a DC in Denver, checked.');
    expect(spokenSentence('Not verified: a sale said to be weighed.', 'Unverified')).toBe('Not verified: a sale said to be weighed.');
    expect(spokenSentence('PepsiCo says: "we will grow".', 'Buyer said')).toBe('PepsiCo says: "we will grow".');
    expect(spokenPerson('Glen Chaffee', 'Managing Director, Transportation & Logistics, FedEx Ground', 'FedEx')).toBe('Glen Chaffee, Managing Director, Transportation & Logistics');
    expect(spokenPerson('Karen Darling', 'Senior Director - PBNA Transportation', 'PepsiCo')).toBe('Karen Darling, Senior Director - PBNA Transportation');
    // A quote the screen cut mid-sentence ends at its last full sentence for the ear.
    expect(completeSentence('PepsiCo and Gatik announced a partnership. It marks the largest commercial...')).toBe('PepsiCo and Gatik announced a partnership.');
    expect(completeSentence('A whole sentence.')).toBe('A whole sentence.');
    expect(spokenSentence('PepsiCo and Gatik announced a partnership to bring autonomous freight into the supply chain, marking the largest commercial', 'Checked')).toBe('PepsiCo and Gatik announced a partnership to bring autonomous freight into the supply chain, marking the largest commercial, checked.');
  });
});

const card = (index: number, accountName: string, stateKind: WorkCard['stateKind'], over: Partial<WorkCard> = {}): WorkCard => ({ accountName, index, lane: 'ready', stateKind, state: 'x', why: `${accountName}: contact Karen Darling.`, person: null, next: { label: 'Contact Karen Darling', href: '/x' }, blocker: null, href: `/gap/accounts/${accountName.toLowerCase()}?from=work&i=${index}`, source: 'cockpit', ...over });

describe('todayListenText', () => {
  it('says how many and what kind, then the first accounts in order with person, action and hold; never an address or a link', () => {
    const cards = [
      card(0, 'NFI Industries', 'replied', { why: 'ops@nfiindustries.com wrote Oct 6: "Send me the comparison". Read it and record what they said.', person: { name: 'ops@nfiindustries.com', title: null }, next: { label: 'Read the reply and record what they said', href: '/gap?lane=replies' }, blocker: 'No cold email to anyone here until it is recorded.' }),
      card(1, 'PepsiCo', 'ready', { person: { name: 'Karen Darling', title: 'Senior Director - PBNA Transportation' } }),
      card(2, 'Kroger', 'in_deal', { why: 'Open HubSpot deal: "Kroger yard pilot" (Proposal).', next: { label: 'Open the deal brief', href: '/x' }, blocker: 'No cold first touch while the deal is open: work it from the deal.' }),
      ...Array.from({ length: 6 }, (_, k) => card(3 + k, `Account ${k}`, 'research', { why: `Account ${k}: 2 cards missing evidence.`, next: { label: `Research Account ${k}`, href: '/x' } })),
    ];
    const t = todayListenText(cards);
    expect(t).toMatch(/^Today\. 9 accounts need you: 1 reply to read, 1 ready for a first touch, 6 in research, 1 in a deal or held\. First, NFI Industries: someone replied\./);
    expect(t).toMatch(/Next, PepsiCo: ready for a first touch\. Contact Karen Darling\. Next person: Karen Darling, Senior Director - PBNA Transportation\. Next action: Contact Karen Darling\./);
    expect(t).toMatch(/Kroger: in a deal\. Open HubSpot deal: "Kroger yard pilot" \(Proposal\)\. Next action: Open the deal brief\. No cold first touch while the deal is open: work it from the deal\./);
    expect(t).toMatch(/4 more follow, in order\.$/);
    expect(t).not.toMatch(/\bcards?\b|below/);
    expect(t).not.toMatch(/@|https?:/);
    expect(t.length).toBeLessThanOrEqual(TODAY_MAX_CHARS);
    expect(t.indexOf('NFI')).toBeLessThan(t.indexOf('PepsiCo'));
  });
  it('says plainly when nothing needs the seller', () => {
    expect(todayListenText([])).toMatch(/^Today\. Nothing needs you right now\./);
  });
});

const PRIVATE = 'Private: interest signal, never mention to the buyer. 3 deep sessions on /for/pepsico-private-sentinel.';
const base = (): AccountListenInput => ({
  accountName: 'PepsiCo',
  state: { accountName: 'PepsiCo', state: 'ready', stateLine: 'Ready for a first touch: Karen Darling', person: { key: 'gap:1', personaId: 1, hubspotContactId: null, name: 'Karen Darling', title: 'Senior Director - PBNA Transportation', chosenBy: 'you, Oct 5' }, blocker: null, unlock: null, coldTouchAllowed: true, chooseAllowed: true, replyClass: null, lastInbound: null, lastOutbound: { to: 'karen@pepsico.com', at: '2026-06-10T14:00:00Z', what: 'Email to karen@pepsico.com, Jun 10: "Network 2.0 and the math on consolidated yards"', source: 'GAP history' }, chosenMissing: null, next: { name: 'Shawn Pierce', title: 'Sr Director Transportation Strategy', unlock: 'after 5 business days with no response to Karen' }, followUp: null, deals: [] } as unknown as AccountListenInput['state'],
  story: {
    rows: [
      { key: 'between_us', label: 'What has happened between us', tag: 'Checked', sentences: [{ text: 'Last email to Karen Darling, Senior Director, Jun 10: "Network 2.0 and the math on consolidated yards". No answer on record.', tag: 'Checked', basis: 'GAP ledger', basisIds: ['touch:2026-06-10'] }], wrongIf: null, collapsed: false },
      { key: 'goal', label: 'Their goal', tag: 'Buyer said', sentences: [{ text: 'PepsiCo says: "productivity and network modernization across PBNA and Frito-Lay".', tag: 'Buyer said', basis: 'sec.gov, Jul 20, 2026', basisIds: ['evidence:f1'] }], wrongIf: null, collapsed: false },
      { key: 'changing', label: 'What is changing', tag: 'Checked', sentences: [{ text: 'The opening story, above.', tag: 'Checked', basis: 'the anchor', basisIds: [] }, { text: 'PepsiCo is ceasing manufacturing at a bottling plant in Maryland, which will result in 143 layoffs', tag: 'Checked', basis: 'sec.gov', basisIds: ['evidence:f3'], cite: 'Checked, not for outreach' }, { text: 'PepsiCo is building a 1.2 million square foot distribution center in Denver (sec.gov, Sep 20, 2026).', tag: 'Checked', basis: 'sec.gov', basisIds: ['evidence:f4'], cite: 'OK to cite to the buyer' }, { text: 'A rumor: PepsiCo said to weigh a sale of Quaker.', tag: 'Unverified', basis: 'rumor.example', basisIds: [] }], wrongIf: null, collapsed: false },
      { key: 'yard', label: 'Yard opportunity', tag: 'Our read', sentences: [{ text: 'Gate and dock handoffs become the constraint before doors do.', tag: 'Our read', basis: 'our read', basisIds: [] }], wrongIf: 'if trailers do not wait', collapsed: false },
      { key: 'learn', label: 'What we need to learn', tag: 'Unknown', sentences: [{ text: 'Which division owns the yard decision is unknown.', tag: 'Unknown', basis: 'no buyer input', basisIds: [] }], wrongIf: null, collapsed: false },
      { key: 'note', label: 'Your note', tag: 'Our read', sentences: [{ text: PRIVATE, tag: 'Our read', basis: 'vault', basisIds: [] }], wrongIf: null, collapsed: false },
    ],
    first: [], checkBeforeContacting: [], setAsideCaveats: [],
  } as unknown as AccountListenInput['story'],
  anchor: {
    person: null, primaryBy: 'their remit', fitsBetter: null, supporting: null, alternatives: [], draftable: [],
    primary: { hypothesisId: 'h', status: 'active', observation: 'PepsiCo and Gatik announced a multi-year partnership to bring autonomous freight into the PepsiCo supply chain [S:f-gatik].', factIds: ['f-gatik'], basis: 'pepsico.com, Aug 25, 2026', relevance: { tier: 'related', why: 'runs transportation' }, factLabel: 'a network program', problem: 'My guess', usable: true, unusableWhy: null },
    whyTheyCare: { text: 'Karen runs transportation: the autonomous linehaul terminates at her DCs.', tag: 'Our read' },
    bestProof: { text: 'Primo Brands: trailer turns 48 to 24 minutes, measured, with about 5% more volume through the same doors, observed; 24 sites live, 260 sites under contract.', tag: 'Our proof, measured' },
    doNotUse: [{ text: 'Their visits to our pages and ROI reads', reason: 'private engagement' }, { text: 'PepsiCo is ceasing manufacturing at a bottling plant in Maryland, which will result in 143 layoffs', reason: 'sensitive' }],
  } as unknown as AccountListenInput['anchor'],
  stack: {
    rows: [
      { key: 'gap:1', personaId: 1, hubspotContactId: null, name: 'Karen Darling', title: 'Senior Director - PBNA Transportation', slot: 'Next operator', ordinal: null, badge: null, reason: 'Runs PBNA transportation; the Gatik program lands on her network', currentness: 'Role confirmed Oct 5 (linkedin.com)', reachability: 'Email on record', why: [], leadOver: null, chosen: true, chosenBy: 'you, Oct 5', action: 'use', caution: null, coldEligible: true, preference: null, isNext: false, canBeNext: false },
      { key: 'gap:2', personaId: 2, hubspotContactId: null, name: 'Shawn Pierce', title: 'Sr Director Transportation Strategy', slot: 'Eligible operator', ordinal: null, badge: null, reason: 'Adjacent operator', currentness: null, reachability: 'Email on record', why: [], leadOver: null, chosen: false, chosenBy: null, action: 'use', caution: null, coldEligible: true, preference: null, isNext: false, canBeNext: true },
    ],
    hidden: 17, showAllLabel: 'Show 17 more', tie: false, tieLine: null, chooseLabel: null, chosenMissing: null, setAside: { count: 1, line: '1 set aside: Dr. Isaac Scott (do not contact).' }, more: [], slots: [],
  } as unknown as AccountListenInput['stack'],
  nextText: 'Prepare the first touch to Karen Darling.',
  doNotContactCount: 1,
});

describe('accountListenText', () => {
  it('is 150 to 220 words for the ear: state, last touch, goal, change, yard, proof measured, first person with the role, second if no reply, the flagged count, the opening and why, the unknown, next', () => {
    const t = accountListenText(base());
    const n = wordCount(t);
    expect(n).toBeGreaterThanOrEqual(ACCOUNT_LISTEN_WORDS.min - 20);
    expect(n).toBeLessThanOrEqual(ACCOUNT_LISTEN_WORDS.max);
    expect(t).toMatch(/^PepsiCo\. Ready for a first touch: Karen Darling\. Last email to Karen Darling, Senior Director, Jun 10/);
    expect(t).toMatch(/Their goal: PepsiCo says: "productivity and network modernization across PBNA and Frito-Lay"\./);
    expect(t).toMatch(/What is changing: PepsiCo is building a 1\.2 million square foot distribution center in Denver, checked\./);
    expect(t).toMatch(/Where the yard fits: Gate and dock handoffs become the constraint before doors do, our read\./);
    expect(t).toMatch(/Our proof, measured: Primo Brands: trailer turns 48 to 24 minutes/);
    expect(t).toMatch(/First: Karen Darling, Senior Director - PBNA Transportation\. Runs PBNA transportation; the Gatik program lands on her network\. Their role is verified\. If no reply, Shawn Pierce, Sr Director Transportation Strategy\./);
    expect(t).toMatch(/1 person is flagged do not contact\./);
    expect(t).toMatch(/The opening: PepsiCo and Gatik announced a multi-year partnership[^.]*, checked\. Why they care, our read: Karen runs transportation/);
    expect(t).toMatch(/Still unknown: Which division owns the yard decision is unknown\./);
    expect(t).toMatch(/Next: Prepare the first touch to Karen Darling\.$/);
  });
  it('never speaks the private line, the do-not-use list, an address, a URL or a citation token', () => {
    const t = accountListenText(base());
    expect(t).not.toMatch(/private|deep sessions|pepsico-private-sentinel/i);
    expect(t).not.toMatch(/visits to our pages|layoffs|ROI reads|Maryland|rumor|Quaker/);
    expect(t).not.toMatch(/@|https?:|\[S:|sec\.gov|pepsico\.com/);
  });
  it('Next always stays when the brief is trimmed, the caution is said once, only a confirmed role is verified, and a tie is spoken as a tie', () => {
    const i = base();
    i.nextText = 'Prepare the first touch to Karen Darling. Caution: the opening fact is a network program and may not land on Karen\'s remit; Shawn Pierce, Sr Director, fits it.';
    i.anchor = { ...i.anchor!, whyTheyCare: { text: 'Karen runs transportation; the fact is a network program and may not land on their remit, and Shawn Pierce (Sr Director) fits it.', tag: 'Our read' } };
    // Pad the goal so the brief runs long: the trim drops whole sections and keeps Next.
    i.story = { ...i.story!, rows: i.story!.rows.map((r) => (r.key === 'goal' ? { ...r, sentences: [{ ...r.sentences[0], text: `PepsiCo says: "${'productivity and modernization '.repeat(12).trim()}".` }] } : r)) } as typeof i.story;
    const t = accountListenText(i);
    expect(t).toMatch(/Next: Prepare the first touch to Karen Darling\.$/);
    expect(t.match(/Caution:/g) ?? []).toHaveLength(0);
    expect(t).not.toMatch(/Their goal:/);
    expect(t).toMatch(/Still unknown:/);
    // A likely role is not a verification.
    const likely = base();
    likely.stack!.rows[0].currentness = 'Role likely Oct 5 (northwestern.edu)';
    expect(accountListenText(likely)).not.toMatch(/Their role is verified/);
    // A tie reads as one.
    const tie = base();
    tie.stack = { ...tie.stack!, tie: true, rows: tie.stack!.rows.map((r) => ({ ...r, chosen: false, chosenBy: null })) } as typeof tie.stack;
    tie.state = { ...tie.state, person: null } as typeof tie.state;
    expect(accountListenText(tie)).toMatch(/GAP could not separate the first people on evidence; in first-name order: Karen Darling/);
    expect(accountListenText(tie)).toMatch(/Then Shawn Pierce, Sr Director Transportation Strategy, on the same evidence\./);
  });
  it('under a hold nobody is named as if they were next and no opening is spoken', () => {
    const i = base();
    i.state = { ...i.state, state: 'opted_out', stateLine: 'Opted out: timothy.cooper@walmart.com, Oct 5', coldTouchAllowed: false, chooseAllowed: false } as AccountListenInput['state'];
    i.nextText = 'Record the opt-out as do not contact.';
    const t = accountListenText(i);
    expect(t).toMatch(/^PepsiCo\. Opted out: their address, Oct 5\./);
    expect(t).not.toMatch(/First: Karen|If no reply|The opening:/);
    expect(t).toMatch(/Next: Record the opt-out as do not contact\.$/);
  });
});
