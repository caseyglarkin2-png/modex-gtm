/**
 * R35 (GAP OS execution recovery, 2026-10-06): a conversational request to PREPARE something uses the same
 * preparation service as the page. "Help me approach this person", "draft an angle from the job posting" and
 * "research X deeper" come back as ONE typed proposal built from the page's own controls: the exact payload of an
 * existing route (the opening story's draft, the research plan's deepen) or a link to the control. No model call
 * makes a proposal; the model never sees the controls; a request to send, enroll, look up, suppress or write copy is
 * still answered by naming its control; the component's button calls only the existing route.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proposalFor, proposalIntent, researchSectionOf, type AskControls } from '@/lib/gap/ask/proposal';
import { askPrompt, clearAskContexts, compactContext, rememberAskContext } from '@/lib/gap/ask/grounding';
import { EVENT_DRAFT_DEFAULTS, POSTING_DRAFT_DEFAULTS, storyDraftPayload } from '@/lib/gap/story/draft-defaults';
import { AskGap } from '@/components/gap/ask-gap';
import type { PursuitState } from '@/lib/gap/pursuit/state';
import type { OutreachAnchor } from '@/lib/gap/story/anchor';
import type { PeopleStack } from '@/lib/gap/people/stack';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn() }), usePathname: () => '/gap/accounts/pepsico' }));
const generate = vi.hoisted(() => vi.fn(async () => ({ text: 'Karen leads Shawn.', provider: 'stub' })));
vi.mock('@/lib/ai/client', () => ({ generateTextWithMetadata: generate }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const JOB_OBS = 'Yard Operations Manager - Tulsa | PepsiCo Careers: "PepsiCo is hiring a Yard Operations Manager at its Tulsa distribution center to manage trailer moves and dock appointments" [S:f-job].';
const EVENT_OBS = 'PepsiCo news: "PepsiCo is building a 1.2 million square foot distribution center in Denver" [S:f-denver].';
const base: AskControls = {
  accountHref: '/gap/accounts/pepsico',
  person: { personaId: 1, name: 'Tom Scratch', title: 'Senior Director, Transportation' },
  people: [{ personaId: 1, name: 'Tom Scratch', title: 'Senior Director, Transportation' }, { personaId: 2, name: 'Ana Ortiz', title: 'Yard Manager, Tulsa' }],
  primary: null,
  pending: [],
  draftable: [],
  next: null,
};
const jobFact = { factId: 'f-job', story: 'PepsiCo is hiring a Yard Operations Manager at its Tulsa distribution center.', proposedObservation: JOB_OBS, claimClass: 'JOB_POSTING' };
const eventFact = { factId: 'f-denver', story: 'PepsiCo is building a distribution center in Denver.', proposedObservation: EVENT_OBS, claimClass: null };

describe('R35: which requests are proposals', () => {
  it('reads the three preparation requests; a name after the verb is the person', () => {
    expect(proposalIntent('help me approach this person')).toEqual({ kind: 'approach', name: null });
    expect(proposalIntent('How should I approach Ana?')).toEqual({ kind: 'approach', name: 'Ana' });
    expect(proposalIntent('Approach Ana Ortiz')).toEqual({ kind: 'approach', name: 'Ana Ortiz' });
    expect(proposalIntent('draft an angle from the job posting')).toEqual({ kind: 'draft_from_posting' });
    expect(proposalIntent('Draft a different angle')).toEqual({ kind: 'draft_angle' });
    expect(proposalIntent('research their footprint deeper')).toEqual({ kind: 'research', section: 'footprint' });
    expect(proposalIntent('Can you research the technology they run?')).toEqual({ kind: 'research', section: 'technology' });
    expect(proposalIntent('Research PepsiCo deeper')).toEqual({ kind: 'research', section: 'catalysts' });
    expect(researchSectionOf('look into their freight and carriers')).toBe('freight');
  });
  it('an explanation stays an answer, and a request to act or write copy is never a proposal', () => {
    for (const q of ['Why this approach?', 'What research has been done here?', 'Why this person over the next one?', 'What do we still need to learn?', 'Send Tom the email', 'Draft an email to Tom', 'Write the first email to Glen', 'give me a subject line for Karen', 'enroll Shawn in the sequence', 'look up her phone number on Apollo', 'mark him do not contact', 'make Shawn next']) {
      expect(proposalIntent(q), q).toBeNull();
    }
  });
});

describe('R35: the proposal is the page\'s own control', () => {
  it('approach with an approved opening: the link to NEXT\'s prepared email, nothing drafted', () => {
    const r = proposalFor({ kind: 'approach', name: null }, 'PepsiCo', { ...base, primary: { hypothesisId: 'h1', observation: 'PepsiCo is building a DC in Denver.', usable: true }, next: { label: 'Prepare the email to Tom', href: '/gap?lane=ready&open=d1' } });
    expect(r.proposal).toEqual({ kind: 'open_control', label: 'Prepare the email to Tom', href: '/gap?lane=ready&open=d1' });
    expect(r.answer).toMatch(/Tom's opening is prepared on the approved story/);
    expect(r.answer).toMatch(/Nothing is sent from here/);
  });
  it('approach with no story: the opening story\'s exact draft payload on the checked fact, for the chosen person', () => {
    const r = proposalFor({ kind: 'approach', name: null }, 'PepsiCo', { ...base, draftable: [eventFact] });
    expect(r.proposal).toEqual({ kind: 'draft_thesis', label: 'Draft the thesis for Tom', route: '/api/gap/story/draft', payload: storyDraftPayload({ accountName: 'PepsiCo', factId: 'f-denver', claimClass: null, proposedObservation: EVENT_OBS, person: { personaId: 1, title: 'Senior Director, Transportation' } }) });
    const payload = (r.proposal as { payload: Record<string, unknown> }).payload;
    // The same text the page's control posts, read off THIS fact (R31, item 4: the Denver opening), never model text and
    // never the one generic sentence.
    expect(payload.problemHypothesis).not.toBe(EVENT_DRAFT_DEFAULTS.problem);
    expect(payload).toMatchObject({ personaId: 1, persona: 'transportation', observation: EVENT_OBS, problemHypothesis: expect.stringMatching(/Denver opens on gate, yard and dock habits it inherits/), falsificationQuestions: [expect.stringMatching(/Denver when it opens\?$/)], whatANoMeans: expect.stringMatching(/opening adds no yard question/), problemFamily: null });
  });
  it('draft from the job posting: the posting\'s own draft text, for the named person; nothing posted means nothing to draft', () => {
    const r = proposalFor({ kind: 'draft_from_posting' }, 'PepsiCo', { ...base, draftable: [eventFact, jobFact] });
    expect(r.proposal?.kind).toBe('draft_thesis');
    expect((r.proposal as { payload: Record<string, unknown> }).payload).toMatchObject({ factId: 'f-job', observation: JOB_OBS, problemHypothesis: POSTING_DRAFT_DEFAULTS.problem, falsificationQuestions: [POSTING_DRAFT_DEFAULTS.falsification] });
    expect(r.answer).toMatch(/job-led thesis for Tom from the checked posting/);
    const none = proposalFor({ kind: 'draft_from_posting' }, 'PepsiCo', { ...base, draftable: [eventFact] });
    expect(none.proposal).toEqual({ kind: 'open_control', label: 'Open Coverage', href: '/gap/coverage' });
    expect(none.answer).toMatch(/no checked job posting or procurement notice/);
    const ana = proposalFor({ kind: 'approach', name: 'Ana' }, 'PepsiCo', { ...base, draftable: [jobFact] });
    expect((ana.proposal as { payload: Record<string, unknown> }).payload).toMatchObject({ personaId: 2, persona: 'site_ops' });
  });
  it('a proposal under review is the move; with nobody chosen, the people rows; with nothing checked, one research pass', () => {
    expect(proposalFor({ kind: 'approach', name: null }, 'PepsiCo', { ...base, pending: [{ hypothesisId: 'h9', status: 'review_required', story: 'x', claimClass: null }] }).proposal).toEqual({ kind: 'open_control', label: 'Review the proposal', href: '/gap/accounts/pepsico#outreach-anchor' });
    expect(proposalFor({ kind: 'approach', name: null }, 'PepsiCo', { ...base, person: null }).proposal).toEqual({ kind: 'open_control', label: 'Choose who hears this first', href: '/gap/accounts/pepsico#people-stack' });
    expect(proposalFor({ kind: 'approach', name: null }, 'PepsiCo', base).proposal).toEqual({ kind: 'research', label: 'Research what is changing there', route: '/api/gap/accounts/deepen', payload: { accountName: 'PepsiCo', section: 'catalysts' } });
    expect(proposalFor({ kind: 'research', section: 'footprint' }, 'PepsiCo', base).proposal).toEqual({ kind: 'research', label: 'Research the footprint (sites and facilities)', route: '/api/gap/accounts/deepen', payload: { accountName: 'PepsiCo', section: 'footprint' } });
  });
});

describe('R35: the context carries the controls; the model never sees them', () => {
  const state = { accountName: 'PepsiCo', state: 'research', stateLine: 'Research: no usable angle', person: { key: 'gap:1', personaId: 1, hubspotContactId: null, name: 'Tom Scratch', title: 'Senior Director, Transportation', chosenBy: 'you' }, blocker: null, unlock: null, coldTouchAllowed: false, chooseAllowed: true, replyClass: null, lastInbound: null, lastOutbound: null, chosenMissing: null, next: null, followUp: null, deals: [] } as unknown as PursuitState;
  const anchor = { person: null, primary: null, primaryBy: null, whyTheyCare: null, fitsBetter: null, supporting: null, bestProof: { text: 'Primo', tag: 'Our proof, measured' }, doNotUse: [], alternatives: [], draftable: [{ ...jobFact, sourceLabel: 'pepsicojobs.com', sourceUrl: null }], pending: [] } as unknown as OutreachAnchor;
  const stack = { rows: [{ key: 'gap:1', personaId: 1, name: 'Tom Scratch', title: 'Senior Director, Transportation', slot: 'Next operator', reason: 'r', currentness: null, chosen: true, coldEligible: true, leadOver: null, preference: null }], more: [], slots: [], setAside: { count: 0, line: null } } as unknown as PeopleStack;
  it('compactContext builds the controls from the page\'s projections; askPrompt drops them', () => {
    const ctx = compactContext({ accountName: 'PepsiCo', state, nextText: 'Draft a thesis.', story: null, anchor, stack, nav: { accountHref: '/gap/accounts/pepsico', next: { label: 'Draft a thesis from the checked fact', href: '#outreach-anchor' } } });
    expect(ctx.controls).toMatchObject({ accountHref: '/gap/accounts/pepsico', person: { personaId: 1, name: 'Tom Scratch' }, draftable: [{ factId: 'f-job', proposedObservation: JOB_OBS, claimClass: 'JOB_POSTING' }], next: { href: '#outreach-anchor' } });
    const prompt = askPrompt(ctx, 'What do we know?');
    expect(prompt).not.toMatch(/"controls"|f-job|proposedObservation|personaId/);
  });
});

describe('R35: the route answers a preparation request with the proposal, never the model', () => {
  afterEach(() => {
    generate.mockClear();
    clearAskContexts();
  });
  const ctxWith = (controls: Partial<AskControls>) => ({ ...compactContext({ accountName: 'PepsiCo', state: { state: 'research', stateLine: 's', person: null, blocker: null, coldTouchAllowed: false } as unknown as PursuitState, nextText: 'n', story: null, anchor: null, stack: null }), controls: { ...base, ...controls } });
  it('a proposal for a preparation request with no model call; copy is still refused by name; a question still goes to the model', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    rememberAskContext(ctxWith({ draftable: [jobFact] }));
    const { POST } = await import('@/app/api/gap/ask/route');
    const ask = (question: string) => POST(new NextRequest('http://localhost/api/gap/ask', { method: 'POST', body: JSON.stringify({ accountName: 'PepsiCo', question }), headers: { 'content-type': 'application/json' } }));
    const r = await ask('draft an angle from the job posting');
    const body = (await r.json()) as { proposal?: { kind: string; route?: string; payload?: { factId: string } }; acted?: boolean; grounded?: boolean };
    expect(r.status).toBe(200);
    expect(body.proposal).toMatchObject({ kind: 'draft_thesis', route: '/api/gap/story/draft', payload: { factId: 'f-job' } });
    expect(body).toMatchObject({ acted: false, grounded: false });
    expect(generate).not.toHaveBeenCalled();
    const copy = (await (await ask('Write the first email to Tom')).json()) as { answer: string; proposal?: unknown };
    expect(copy.answer).toMatch(/cannot write outreach copy/);
    expect(copy.proposal).toBeUndefined();
    expect(generate).not.toHaveBeenCalled();
    const q = (await (await ask('Why Tom over the next one?')).json()) as { answer: string; proposal?: unknown };
    expect(generate).toHaveBeenCalledTimes(1);
    expect(q.proposal).toBeUndefined();
  }, 120_000);
});

describe('<AskGap> renders the proposal as the page\'s control', () => {
  afterEach(() => vi.restoreAllMocks());
  it('the button posts the exact payload to the existing route and says what happened; nothing else is called', async () => {
    const payload = storyDraftPayload({ accountName: 'PepsiCo', factId: 'f-job', claimClass: 'JOB_POSTING', proposedObservation: JOB_OBS, person: { personaId: 1, title: 'Senior Director, Transportation' } });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url) === '/api/gap/ask'
        ? ({ ok: true, status: 200, json: async () => ({ answer: 'GAP can draft a job-led thesis for Tom from the checked posting.', grounded: false, provider: null, proposal: { kind: 'draft_thesis', label: 'Draft the thesis for Tom from the posting', route: '/api/gap/story/draft', payload } }) } as unknown as Response)
        : ({ ok: true, status: 201, json: async () => ({ ok: true, hypothesisId: 'h-new', preparation: 'submitted' }) } as unknown as Response),
    );
    render(<AskGap accountName="PepsiCo" />);
    fireEvent.change(screen.getByTestId('ask-gap-input'), { target: { value: 'draft an angle from the job posting' } });
    fireEvent.click(screen.getByTestId('ask-gap-submit'));
    const button = await screen.findByTestId('ask-gap-proposal');
    expect(button).toHaveTextContent('Draft the thesis for Tom from the posting');
    expect(screen.getByTestId('ask-gap-answer')).toHaveTextContent("The button runs the page's own control");
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByTestId('ask-gap-proposal-result')).toHaveTextContent('Drafted and under review on this page'));
    expect(fetchSpy.mock.calls.map(([u]) => String(u))).toEqual(['/api/gap/ask', '/api/gap/story/draft']);
    expect(JSON.parse(String((fetchSpy.mock.calls[1][1] as RequestInit).body))).toEqual(payload);
    expect(refresh).toHaveBeenCalled();
  });
  it('a link proposal is a plain link to the control; a refused draft says nothing changed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ answer: 'Tom\'s opening is prepared.', grounded: false, provider: null, proposal: { kind: 'open_control', label: 'Prepare the email to Tom', href: '/gap?lane=ready&open=d1' } }) } as unknown as Response);
    render(<AskGap accountName="PepsiCo" />);
    fireEvent.change(screen.getByTestId('ask-gap-input'), { target: { value: 'help me approach this person' } });
    fireEvent.click(screen.getByTestId('ask-gap-submit'));
    const link = await screen.findByTestId('ask-gap-proposal');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/gap?lane=ready&open=d1');
  });
});
