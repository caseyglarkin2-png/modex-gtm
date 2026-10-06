/**
 * UX-13 ASK GAP: the context is exactly what the page shows (never the vault note, the private line, the do-not-use
 * list or an address); a request to act is answered by naming the control, with no model call; the prompt carries
 * the trust rules; the box is read-only and renders the answer with its grounding line.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { actionRequest, askPrompt, clearAskContexts, compactContext, guardBuyerSaid, recallAskContext, rememberAskContext, tidyAnswer } from '@/lib/gap/ask/grounding';
import { AskGap } from '@/components/gap/ask-gap';
import type { PursuitState } from '@/lib/gap/pursuit/state';
import type { AccountStory } from '@/lib/gap/story/story';
import type { OutreachAnchor } from '@/lib/gap/story/anchor';
import type { PeopleStack } from '@/lib/gap/people/stack';

const PRIVATE = 'Private: interest signal, never mention to the buyer. 3 deep sessions on /for/pepsico-private-sentinel.';
const state = { accountName: 'PepsiCo', state: 'ready', stateLine: 'Ready for a first touch: Karen Darling', person: { key: 'gap:1', personaId: 1, hubspotContactId: null, name: 'Karen Darling', title: 'Senior Director', chosenBy: 'you, Oct 5' }, blocker: null, unlock: null, coldTouchAllowed: true, chooseAllowed: true, replyClass: null, lastInbound: null, lastOutbound: null, chosenMissing: null, next: null, followUp: null, deals: [] } as unknown as PursuitState;
const story = {
  rows: [
    { key: 'goal', label: 'Their goal', tag: 'Buyer said', sentences: [{ text: 'PepsiCo says: "network modernization".', tag: 'Buyer said', basis: 'sec.gov, Jul 20', basisIds: [] }], wrongIf: null, collapsed: false },
    { key: 'changing', label: 'What is changing', tag: 'Checked', sentences: [{ text: 'PepsiCo is building a DC in Denver; contact ops@pepsico.com.', tag: 'Checked', basis: 'news.example, Sep 20', basisIds: [], cite: 'OK to cite to the buyer' }, { text: 'DO-NOT-USE-SENTINEL layoffs fact', tag: 'Checked', basis: 'sec.gov', basisIds: [], cite: 'Checked, not for outreach' }, { text: 'NOT-FOR-OUTREACH-LINE: a plant audit photo shows 40 trailers.', tag: 'Checked', basis: 'imagery', basisIds: [], cite: 'Never cite (from imagery)' }, { text: 'UNVERIFIED-LINE: a rumor.', tag: 'Unverified', basis: 'rumor', basisIds: [] }], wrongIf: null, collapsed: false },
    { key: 'note', label: 'Your note', tag: 'Our read', sentences: [{ text: 'VAULT SECRET: Casey met the CFO at a bar.', tag: 'Our read', basis: 'vault', basisIds: [] }], wrongIf: null, collapsed: false },
  ],
  first: [], checkBeforeContacting: [], setAsideCaveats: [],
} as unknown as AccountStory;
const anchor = {
  person: null, primaryBy: 'their remit', fitsBetter: null, alternatives: [{ hypothesisId: 'h2', status: 'active', observation: 'PepsiCo and Gatik announced a partnership.', factIds: [], basis: 'pepsico.com', relevance: { tier: 'related', why: '' }, factLabel: '', problem: '', usable: true, unusableWhy: null }], draftable: [],
  primary: { hypothesisId: 'h1', status: 'approved', observation: 'PepsiCo is building a DC in Denver.', factIds: ['f1'], basis: 'news.example, Sep 20', relevance: { tier: 'direct', why: 'runs transportation' }, factLabel: 'a site opening', problem: 'My guess', usable: true, unusableWhy: null },
  whyTheyCare: { text: 'Karen runs transportation: a new DC opens on her network.', tag: 'Our read' },
  supporting: null,
  bestProof: { text: 'Primo Brands: trailer turns 48 to 24 minutes, measured.', tag: 'Our proof, measured' },
  doNotUse: [{ text: 'Their visits to our pages and ROI reads', reason: 'private engagement' }, { text: 'DO-NOT-USE-SENTINEL layoffs fact', reason: 'sensitive' }],
} as unknown as OutreachAnchor;
const stack = {
  rows: [{ key: 'gap:1', personaId: 1, hubspotContactId: null, name: 'Karen Darling', title: 'Senior Director', slot: 'Next operator', ordinal: null, badge: null, reason: 'Runs PBNA transportation', currentness: 'Role confirmed Oct 5', reachability: 'Email on record', why: [], leadOver: { over: 'Shawn Pierce', text: 'Karen is the more senior title.', tie: false, leads: true }, chosen: true, chosenBy: 'you, Oct 5', action: 'use', caution: null, coldEligible: true, preference: null, isNext: false, canBeNext: false }, { key: 'gap:2', personaId: 2, hubspotContactId: null, name: 'Shawn Pierce', title: 'Sr Director', slot: 'Eligible operator', ordinal: null, badge: null, reason: 'Adjacent operator', currentness: null, reachability: 'Email on record', why: [], leadOver: null, chosen: false, chosenBy: null, action: 'use', caution: null, coldEligible: true, preference: { kind: 'not_now', line: 'Not now until Nov 5, you, Oct 6.' }, isNext: false, canBeNext: false }],
  hidden: 0, showAllLabel: null, tie: false, tieLine: null, chooseLabel: null, chosenMissing: null, setAside: { count: 1, line: '1 set aside: Dr. Isaac Scott (do not contact).' }, more: [], slots: [],
} as unknown as PeopleStack;

describe('compactContext and askPrompt', () => {
  it('carries the state, the people with why-over-next and set-asides, the story with tags and bases, the opening and proof, the alternatives and buyer inputs; never the vault note, the private line, the do-not-use list or an address', () => {
    const ctx = compactContext({ accountName: 'PepsiCo', state, nextText: 'Prepare the first touch to Karen Darling.', story, anchor, stack, buyerSaid: [{ text: 'Trucks wait an hour at the gate.', who: 'Karen', at: '2026-09-01' }] });
    const json = JSON.stringify(ctx);
    expect(ctx.people[0]).toMatchObject({ name: 'Karen Darling', chosen: true, whyOverNext: 'leads Shawn Pierce: Karen is the more senior title.' });
    expect(ctx.people[1].setAsideByYou).toBe('Not now until Nov 5, you, Oct 6.');
    expect(ctx.story.map((r) => r.label)).toEqual(['Their goal', 'What is changing']);
    expect(ctx.story[0].lines[0]).toEqual({ text: 'PepsiCo says: "network modernization".', tag: 'Buyer said', basis: 'sec.gov, Jul 20' });
    expect(ctx.story[1].lines).toHaveLength(1); // the citable Denver line only
    expect(json).not.toMatch(/NOT-FOR-OUTREACH-LINE|UNVERIFIED-LINE/);
    expect(ctx.opening).toMatchObject({ fact: 'PepsiCo is building a DC in Denver.', whyTheyCare: 'Karen runs transportation: a new DC opens on her network.', proof: 'Primo Brands: trailer turns 48 to 24 minutes, measured.' });
    expect(ctx.otherStories).toEqual([{ fact: 'PepsiCo and Gatik announced a partnership.', usable: true, why: null }]);
    expect(ctx.buyerSaid[0].text).toBe('Trucks wait an hour at the gate.');
    expect(json).not.toMatch(/VAULT SECRET|Your note|pepsico-private-sentinel|deep sessions|DO-NOT-USE-SENTINEL|visits to our pages|@pepsico\.com/);
    expect(json).toMatch(/their address/);
    const prompt = askPrompt(ctx, 'Why Karen over Shawn?');
    expect(prompt).toMatch(/read-only account copilot/);
    expect(prompt).toMatch(/"the buyer said", "checked", "our read", "not verified" or "unknown"/);
    expect(prompt).toMatch(/GAP does not know that yet/);
    expect(prompt).toMatch(/If two items conflict, say so/);
    expect(prompt).toMatch(/Never recommend sending, enrolling, an Apollo lookup, changing a flag or deleting/);
    expect(prompt).toMatch(/QUESTION:\nWhy Karen over Shawn\?\nANSWER:$/);
    expect(prompt).not.toMatch(/VAULT SECRET|DO-NOT-USE-SENTINEL/);
  });
  it('a request to act is answered by naming the control, never by the model; a plain question is not', () => {
    expect(actionRequest('Send Karen the email now')).toMatch(/cannot send or draft\. The email is prepared from NEXT/);
    expect(actionRequest('enroll Shawn in the sequence')).toMatch(/cannot enroll/);
    expect(actionRequest('look up her phone number on Apollo')).toMatch(/never spends Apollo/);
    expect(actionRequest('mark him do not contact')).toMatch(/cannot change a do-not-contact/);
    expect(actionRequest('delete this account')).toMatch(/cannot delete or merge/);
    expect(actionRequest('make Shawn next')).toMatch(/cannot choose or reorder people/);
    expect(actionRequest('Why Karen over Shawn?')).toBeNull();
    expect(actionRequest('What do we still need to learn here?')).toBeNull();
    // A question word opens a read, never an action: these ask.
    expect(actionRequest('What did we send them?')).toBeNull();
    expect(actionRequest('Who is flagged do not contact?')).toBeNull();
    expect(actionRequest('Did we enroll anyone here?')).toBeNull();
    expect(actionRequest('Can you send Karen the email?')).toMatch(/cannot send/);
  });
  it('with no buyer input the prompt says so and an invented "the buyer said" is dropped from the answer, the truth said first', () => {
    const ctx = compactContext({ accountName: 'NFI Industries', state, nextText: 'See the people.', story: null, anchor: null, stack: null, buyerSaid: [] });
    expect(askPrompt(ctx, 'Who owns transportation?')).toMatch(/There is NO buyer input on record at this account: never write "the buyer said"/);
    expect(guardBuyerSaid('The buyer said no one else owns transportation. Our read is that Jenny Wilson runs network operations. Transportation ownership is not stated.', ctx)).toBe('Nothing from the buyer is on record here, so GAP cannot say what they said. Our read is that Jenny Wilson runs network operations. Transportation ownership is not stated.');
    expect(guardBuyerSaid('Our read is that Jenny runs it.', ctx)).toBe('Our read is that Jenny runs it.');
    // Other attributions are caught too; GAP's own words and our read are not.
    expect(guardBuyerSaid('Jenny said the yard is fine. They told us Mondays are worst. GAP says the fact is checked.', ctx)).toBe('Nothing from the buyer is on record here, so GAP cannot say what they said. GAP says the fact is checked.');
    // A human reply IS buyer input: the context carries it and the guard stands down.
    const replied = compactContext({ accountName: 'NFI Industries', state: { ...state, state: 'replied', lastInbound: { who: 'Jenny Wilson', at: '2026-10-06T09:00:00Z', kind: 'human', label: 'Someone replied', snippet: 'Send me the two-site comparison and we can talk Thursday.' } } as unknown as PursuitState, nextText: 'Read the reply.', story: null, anchor: null, stack: null, buyerSaid: [] });
    expect(replied.buyerSaid[0]).toEqual({ text: 'Send me the two-site comparison and we can talk Thursday.', who: 'Jenny Wilson', at: '2026-10-06T09:00:00Z' });
    expect(askPrompt(replied, 'What did they say?')).not.toMatch(/NO buyer input/);
    expect(guardBuyerSaid('The buyer said to send the comparison.', replied)).toBe('The buyer said to send the comparison.');
    const withInput = compactContext({ accountName: 'NFI Industries', state, nextText: 'x', story: null, anchor: null, stack: null, buyerSaid: [{ text: 'Trucks wait an hour.', who: 'Jenny', at: null }] });
    expect(guardBuyerSaid('The buyer said trucks wait an hour.', withInput)).toBe('The buyer said trucks wait an hour.');
  });
  it('the page remembers its context for a short while and the route recalls it; a stale one is dropped', () => {
    clearAskContexts();
    const ctx = compactContext({ accountName: 'PepsiCo', state, nextText: 'x', story: null, anchor: null, stack: null });
    const t0 = new Date('2026-10-06T15:00:00Z');
    rememberAskContext(ctx, t0);
    expect(recallAskContext('PepsiCo', new Date(t0.getTime() + 60_000))).toBe(ctx);
    expect(recallAskContext('PepsiCo', new Date(t0.getTime() + 16 * 60_000))).toBeNull();
    expect(recallAskContext('Kroger', t0)).toBeNull();
  });
  it('tidyAnswer drops a leading Answer label, em dashes and runaway length', () => {
    expect(tidyAnswer('Answer: Karen leads — checked.')).toBe('Karen leads , checked.');
    expect(tidyAnswer(Array.from({ length: 400 }, () => 'w').join(' ')).split(' ')).toHaveLength(200);
  });
});

describe('<AskGap>', () => {
  it('posts the question for the account, renders the grounded answer with its line, and acts on nothing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ answer: 'Karen leads Shawn: she is the more senior title, checked Oct 5. GAP does not know her budget yet.', grounded: true, provider: 'gemini' }) } as unknown as Response);
    render(<AskGap accountName="PepsiCo" />);
    fireEvent.change(screen.getByTestId('ask-gap-input'), { target: { value: 'Why Karen over Shawn?' } });
    fireEvent.click(screen.getByTestId('ask-gap-submit'));
    await waitFor(() => expect(screen.getByTestId('ask-gap-answer')).toHaveTextContent('Karen leads Shawn'));
    expect(fetchSpy).toHaveBeenCalledWith('/api/gap/ask', expect.objectContaining({ method: 'POST', body: JSON.stringify({ accountName: 'PepsiCo', question: 'Why Karen over Shawn?' }) }));
    expect(screen.getByTestId('ask-gap-answer')).toHaveTextContent('From the story, the state and the people above.');
    expect(fetchSpy.mock.calls.every(([u]) => String(u) === '/api/gap/ask')).toBe(true);
    fetchSpy.mockRestore();
  });
  it('an example chip asks at once; a provider outage says the page still holds everything', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: 'no_provider' }) } as unknown as Response);
    render(<AskGap accountName="PepsiCo" />);
    fireEvent.click(screen.getAllByTestId('ask-gap-example')[0]);
    await waitFor(() => expect(screen.getByTestId('ask-gap-error')).toHaveTextContent(/No AI provider answered just now/));
    expect(screen.getByTestId('ask-gap-input')).toHaveValue('Who else here owns transportation?');
    fetchSpy.mockRestore();
  });
});
