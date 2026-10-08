/**
 * UX-06 at render: the outreach anchor block (primary, why they care, supporting, BEST PROOF as ours, DO NOT USE
 * collapsed, a different story is one click and records the choice, a draft is prefilled and submitted through the
 * hypothesis authority); the chosen card says why #1 over #2 or that GAP cannot separate them; the pre-call brief
 * says the account hold first and offers no opener; a keyword hit is never captioned as an observed fact; the
 * six-line brief carries BEST PROOF as YardFlow's.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { OutreachAnchorView, personaKeyFor } from '@/components/gap/outreach-anchor';
import { PreCallBrief } from '@/components/gap/pre-call-brief';
import { SixLineBriefView } from '@/components/gap/six-line-brief';
import { PeopleStackView } from '@/components/gap/people-stack';
import type { OutreachAnchor } from '@/lib/gap/story/anchor';
import { BEST_PROOF_MEASURED } from '@/lib/gap/story/anchor';
import type { CallBrief } from '@/lib/gap/ui/gap-api-client';
import type { SixLineBrief } from '@/lib/gap/execution/six-line-brief';
import { resolveOwner, type OwnerCandidateInput } from '@/lib/gap/people/owner-resolution';
import { buildPeopleStack } from '@/lib/gap/people/stack';
import { projectPursuitState } from '@/lib/gap/pursuit/state';

const NOW = new Date('2026-10-06T12:00:00Z');
const anchor: OutreachAnchor = {
  person: { personaId: 1, name: 'Karen Darling', title: 'Senior Director - PBNA Transportation' },
  primary: { hypothesisId: 'h-denver', status: 'approved', observation: 'PepsiCo is building a 1.2 million square foot distribution center in Denver, opening in 2027.', factIds: ['f-denver'], basis: 'news.example, Sep 20, 2026', relevance: { tier: 'direct', why: 'runs transportation: the fact is a site opening' }, factLabel: 'a site opening or expansion', problem: 'My guess is that a new DC opens on the old yard habits.', usable: true, unusableWhy: null },
  primaryBy: 'their remit',
  fitsBetter: null,
  whyTheyCare: { text: 'Karen runs transportation: the fact is a site opening.', tag: 'Our read' },
  supporting: { text: 'PepsiCo and Gatik announced a multi-year partnership.', tag: 'Checked', basis: 'pepsico.com, Aug 25, 2026', basisIds: ['evidence:f-gatik'], cite: 'OK to cite to the buyer' },
  bestProof: { text: BEST_PROOF_MEASURED, tag: 'Our proof, measured' },
  doNotUse: [{ text: 'Their visits to our pages and ROI reads', reason: 'private engagement: interest, never a reason to write' }, { text: 'PepsiCo said to weigh sale of Quaker Foods unit.', reason: 'unverified: a third party said it and nobody checked' }],
  alternatives: [
    { hypothesisId: 'h-gatik', status: 'active', observation: 'PepsiCo and Gatik announced a multi-year partnership.', factIds: ['f-gatik'], basis: 'pepsico.com, Aug 25, 2026', relevance: { tier: 'related', why: 'runs transportation, adjacent to an automation change' }, factLabel: 'an automation or technology change', problem: 'My guess is that autonomous linehaul lands trailers on a schedule.', usable: true, unusableWhy: null },
    { hypothesisId: 'h-brazil', status: 'active', observation: 'General Mills entered into an agreement to sell its business in Brazil.', factIds: ['f-brazil'], basis: 'sec.gov, Sep 23, 2026', relevance: { tier: 'none', why: 'runs transportation, which the fact does not touch' }, factLabel: 'a divestiture', problem: 'My guess is that...', usable: false, unusableWhy: 'the angle needs your review: it opens on activity outside the North America network' },
  ],
  draftable: [{ story: 'PepsiCo is ceasing operations at a bottling plant in Maryland.', sourceLabel: 'fooddive.com, Sep 16, 2026', sourceUrl: 'https://fooddive.com/x', factId: 'f-plant', proposedObservation: 'fooddive.com: "PepsiCo is ceasing operations at a bottling plant in Maryland" [S:f-plant].' }],
  pending: [],
};
const pendingItem = { hypothesisId: 'h-pend', status: 'review_required' as const, factId: 'f-tulsa', story: 'PepsiCo will close its warehouse operations at its Tulsa production facility.', sourceLabel: 'supplychaindive.com, Jul 23, 2026', sourceUrl: 'https://supplychaindive.com/t', observation: 'PepsiCo to cease warehouse operations: "PepsiCo will close its warehouse operations at its Tulsa production facility".', observationRaw: 'PepsiCo to cease warehouse operations: "PepsiCo will close its warehouse operations at its Tulsa production facility" [S:f-tulsa].', problem: 'My guess is that the closure moves load onto the sites that remain.', wouldProveWrong: ['Did dwell at the remaining sites change?'], family: 'hidden_capacity', familyKnown: true, personaId: 1, personName: 'Karen Darling', gate: 'sendable' as const };

beforeEach(() => {
  refresh.mockReset();
  vi.restoreAllMocks();
});

describe('item 2a: stories past their currentness on the page', () => {
  it('a too-old story is listed with its reason and no draft control; a stale proposal says why and offers only Not this story', () => {
    const view = { ...anchor, primary: null, primaryBy: null, whyTheyCare: null, supporting: null, alternatives: [], draftable: [], tooOld: [{ story: 'PepsiCo will close its warehouse operations at its Tulsa production facility.', sourceLabel: 'news.example, Jul 23, 2026', sourceUrl: 'https://news.example/tulsa', factId: 'f-tulsa', line: 'This story is too old for a first touch: it was current until Sep 5, 2026.' }], pending: [{ ...pendingItem, stale: 'This story is too old for a first touch: it was current until Sep 5, 2026.' }] } as OutreachAnchor;
    render(<OutreachAnchorView accountName="PepsiCo" anchor={view} coldTouchAllowed />);
    expect(screen.getByTestId('anchor-too-old').textContent).toMatch(/Not offered: too old for a first touch.*Tulsa.*it was current until Sep 5, 2026\./s);
    expect(screen.getByTestId('anchor-pending-stale').textContent).toBe('This story is too old for a first touch: it was current until Sep 5, 2026. Set it aside; it cannot be approved for a first touch.');
    expect(screen.queryByTestId('anchor-pending-approve')).toBeNull();
    expect(screen.queryByTestId('anchor-pending-family-form')).toBeNull();
    expect(screen.getByTestId('anchor-pending-withdraw')).toHaveTextContent('Not this story');
    expect(screen.queryByTestId('anchor-draft-open')).toBeNull();
  });
});

describe('item 2: drafting a story that was set aside or is in use', () => {
  it('a set-aside story answers in plain words and nothing is drafted; an in-use story never reads as under review', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'story_set_aside', detail: 'You set this story aside (Not this story): GAP will not draft it again. A newer fact about it is a new story.' }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, hypothesisId: 'h-denver', status: 'active', existing: true, existingVia: 'same_fact', family: 'hidden_capacity', familyBasis: 'recorded on the draft', preparation: 'in_use', missing: [], submitRefusal: null }) } as Response);
    render(<OutreachAnchorView accountName="PepsiCo" anchor={anchor} coldTouchAllowed />);
    fireEvent.click(screen.getByTestId('anchor-draft-open'));
    fireEvent.click(screen.getByTestId('anchor-draft-submit'));
    await waitFor(() => expect(screen.getByTestId('anchor-alert').textContent).toBe('You set this story aside (Not this story): GAP will not draft it again. A newer fact about it is a new story. Nothing was drafted.'));
    expect(screen.queryByTestId('anchor-drafted')).toBeNull();
    fireEvent.click(screen.getByTestId('anchor-draft-submit'));
    await waitFor(() => expect(screen.getByTestId('anchor-note').textContent).toBe('This story is already approved and in use for Karen: nothing new was drafted.'));
    expect(screen.getByTestId('anchor-drafted').textContent).not.toMatch(/under review/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('item 3: the family question is one confirm, posts the person of the proposal, and can be set aside', () => {
  it('an incomplete proposal preselects the suggestion, offers only families with copy and Not this story, and posts the person of the proposal', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, hypothesisId: 'h-kay', status: 'review_required', existing: true, family: 'hidden_capacity', familyBasis: 'chosen by you', preparation: 'submitted', missing: [], submitRefusal: null }) } as Response);
    const incomplete = { ...pendingItem, hypothesisId: 'h-kay', status: 'draft' as const, family: 'unmapped', familyKnown: false, gate: 'not_judged' as const, suggestedFamily: 'hidden_capacity', suggestedBasis: 'a site closure or consolidation moves load onto the physical handoffs that remain', personaId: 2, personName: 'Kay Scratch', personTitle: 'Senior Director - Transportation' };
    render(<OutreachAnchorView accountName="PepsiCo" anchor={{ ...anchor, pending: [incomplete] }} coldTouchAllowed />);
    const select = screen.getByTestId('anchor-pending-family-select') as HTMLSelectElement;
    expect(select.value).toBe('hidden_capacity');
    expect([...select.options].map((o) => o.value)).toEqual(['network_standardization', 'hidden_capacity', 'automation_readiness']);
    expect(screen.getByTestId('anchor-pending-family-form').textContent).toMatch(/Suggested: hidden capacity \(a site closure/);
    expect(screen.getByTestId('anchor-pending-withdraw')).toHaveTextContent('Not this story');
    fireEvent.click(screen.getByTestId('anchor-pending-set-family'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]!.body));
    // The anchor's chosen person is Karen (1); the proposal is Kay's (2): the post carries Kay.
    expect(body).toMatchObject({ factId: 'f-tulsa', personaId: 2, problemFamily: 'hidden_capacity' });
  });
});

describe('item 4 and R31: the draft form is read off the fact, and the falsification is editable', () => {
  it('a fit-led story opens with its own guess and question; the edited falsification is what is posted; a story that opens nothing says so', async () => {
    const gatik = { story: 'PepsiCo and Gatik announced a multi-year agreement to deploy autonomous freight across its North America distribution network.', sourceLabel: 'pepsico.com, Jun 8, 2026', sourceUrl: 'https://pepsico.com/g', factId: 'f-gatik', proposedObservation: 'pepsico.com: "PepsiCo and Gatik announced a multi-year agreement to deploy autonomous freight across its North America distribution network" [S:f-gatik].', approach: 'fit_led' as const };
    const view = { ...anchor, draftable: [gatik], notAnOpening: [{ story: 'PepsiCo deployed a new warehouse management system across its Texas distribution centers.', sourceLabel: 'news.example, Sep 20, 2026', sourceUrl: null, factId: 'f-wms', line: 'Checked, but a technology deployment is not an opening for a first touch: context only.' }] } as OutreachAnchor;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, hypothesisId: 'h-fit', status: 'review_required', existing: false, family: 'automation_readiness', familyBasis: 'x', preparation: 'submitted', missing: [], submitRefusal: null }) } as Response);
    render(<OutreachAnchorView accountName="PepsiCo" anchor={view} coldTouchAllowed />);
    expect(screen.getByTestId('anchor-not-an-opening').textContent).toMatch(/Not offered: not an opening.*warehouse management system.*context only\./s);
    fireEvent.click(screen.getByTestId('anchor-draft-open'));
    expect((screen.getByTestId('anchor-draft-problem') as HTMLTextAreaElement).value).toMatch(/^My guess is that the Gatik program sends trailers to the yards/);
    expect(screen.getByLabelText('What would prove it wrong')).toHaveAttribute('aria-describedby');
    fireEvent.change(screen.getByTestId('anchor-draft-falsification'), { target: { value: 'Do the Gatik trailers wait at the Dallas yard today?' } });
    fireEvent.click(screen.getByTestId('anchor-draft-submit'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]!.body));
    expect(body.falsificationQuestions).toEqual(['Do the Gatik trailers wait at the Dallas yard today?']);
    expect(body.problemHypothesis).toMatch(/Gatik program/);
  });
});

describe('the outreach anchor block', () => {
  it('shows the primary anchor and why they care in the open; the supporting fact, BEST PROOF (ours) and DO NOT USE sit behind one disclosure; an unusable thesis has no Use button', () => {
    render(<OutreachAnchorView accountName="PepsiCo" anchor={anchor} coldTouchAllowed />);
    expect(screen.getByTestId('anchor-primary')).toHaveAttribute('data-hypothesis', 'h-denver');
    expect(screen.getByTestId('anchor-primary').textContent).toMatch(/Denver.*basis: it lands on their remit/s);
    expect(screen.getByRole('heading', { level: 2, name: 'Opening story for Karen' })).toBeInTheDocument();
    expect(screen.getByTestId('anchor-why').textContent).toMatch(/Our read.*Karen runs transportation/s);
    const more = screen.getByTestId('anchor-more');
    expect(more.tagName).toBe('DETAILS');
    expect(more).not.toHaveAttribute('open');
    expect(more.textContent).toMatch(/the do-not-use list \(2\)/i);
    expect(more.textContent).toMatch(/Show/);
    expect(screen.getByTestId('anchor-supporting').textContent).toMatch(/Checked.*Gatik/s);
    expect(screen.getByTestId('anchor-proof').textContent).toMatch(/Our proof, measured.*48 to 24 minutes, measured.*YardFlow's own number, never theirs/s);
    expect(screen.getByTestId('anchor-proof').textContent).not.toMatch(/Checked/);
    expect(screen.getByTestId('anchor-do-not-use').textContent).toMatch(/private engagement/);
    const alts = screen.getByTestId('anchor-alternatives');
    expect(alts.tagName).toBe('DETAILS');
    expect(alts).not.toHaveAttribute('open');
    expect(screen.getAllByTestId('anchor-use-story')).toHaveLength(1);
    expect(screen.getByTestId('anchor-unusable').textContent).toMatch(/Not usable: General Mills.*\. the angle needs your review: it opens on activity outside the North America network\./s);
    expect(screen.getByTestId('anchor-unusable').textContent).not.toMatch(/\(\(/);
  });
  it('Use this story posts the anchor choice for the person and refreshes; it never sends', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 201, json: async () => ({ personaId: 1, hypothesisId: 'h-gatik' }) } as Response);
    render(<OutreachAnchorView accountName="PepsiCo" anchor={anchor} coldTouchAllowed />);
    fireEvent.click(screen.getByTestId('anchor-use-story'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/opening now builds on that thesis. Nothing is sent/));
    // Focus moves to the status line (the clicked control unmounts on refresh).
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId('anchor-note')));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gap/personas/1/anchor');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ hypothesisId: 'h-gatik' });
    expect(refresh).toHaveBeenCalled();
  });
  it('under a hold no story can be switched; the alternatives still read', () => {
    render(<OutreachAnchorView accountName="PepsiCo" anchor={anchor} coldTouchAllowed={false} />);
    expect(screen.queryByTestId('anchor-use-story')).toBeNull();
    expect(screen.getByTestId('anchor-alternative')).toBeInTheDocument();
  });
  it('Draft + review opens a prefilled form (story, source, proposed observation) and posts ONE call to the draft service, which derives the family and submits; the proposal then reads as under review here', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, hypothesisId: 'h-new', status: 'review_required', existing: false, existingVia: null, family: 'hidden_capacity', familyBasis: 'a site closure or consolidation moves load onto the physical handoffs that remain', preparation: 'submitted', missing: [], submitRefusal: null }) } as Response);
    render(<OutreachAnchorView accountName="PepsiCo" anchor={anchor} coldTouchAllowed />);
    fireEvent.click(screen.getByTestId('anchor-draft-open'));
    const form = screen.getByTestId('anchor-draft-form');
    expect(form.textContent).toMatch(/Story.*Maryland.*Source.*fooddive\.com/s);
    expect((screen.getByTestId('anchor-draft-observation') as HTMLTextAreaElement).value).toMatch(/\[S:f-plant\]\.$/);
    expect((screen.getByTestId('anchor-draft-problem') as HTMLTextAreaElement).value).toMatch(/^My guess is that/);
    // Each textarea is labelled and described (the helper is not part of the name).
    const obs = screen.getByLabelText('Proposed outreach observation');
    expect(obs).toHaveAttribute('aria-describedby');
    expect(screen.getByLabelText('Our guess (hedged)')).toHaveAttribute('aria-describedby');
    expect(screen.getByTestId('anchor-draft-submit').textContent).toBe('Submit for review');
    fireEvent.click(screen.getByTestId('anchor-draft-submit'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gap/story/draft');
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]!.body));
    // Never `problemFamily: 'unmapped'` on the submit path: the service derives it or asks.
    expect(body).toMatchObject({ accountName: 'PepsiCo', factId: 'f-plant', personaId: 1, persona: 'transportation', problemFamily: null });
    expect(body.observation).toMatch(/\[S:f-plant\]\.$/);
    expect(body.falsificationQuestions.length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByTestId('anchor-drafted').textContent).toMatch(/under review above/));
    expect(screen.getByTestId('anchor-note').textContent).toMatch(/Drafted and under review below for Karen.*Nothing is sent/);
    expect(screen.getByTestId('anchor-drafted').querySelector('a')).toHaveAttribute('href', '#outreach-anchor');
    expect(refresh).toHaveBeenCalled();
  });
  it('an incomplete proposal asks the one question (the problem family) and submits through the same service; a refused fact drafts nothing', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, hypothesisId: 'h-inc', status: 'draft', existing: false, family: 'unmapped', familyBasis: null, preparation: 'incomplete', missing: ['problem_family'], submitRefusal: null }) } as Response);
    const { rerender } = render(<OutreachAnchorView accountName="PepsiCo" anchor={anchor} coldTouchAllowed />);
    fireEvent.click(screen.getByTestId('anchor-draft-open'));
    fireEvent.click(screen.getByTestId('anchor-draft-submit'));
    await waitFor(() => expect(screen.getByTestId('anchor-note').textContent).toMatch(/One thing is missing: which problem this fact points at/));
    // The page re-renders with the proposal in progress: the family chooser, no approve button.
    rerender(<OutreachAnchorView accountName="PepsiCo" anchor={{ ...anchor, pending: [{ ...pendingItem, hypothesisId: 'h-inc', status: 'draft', family: 'unmapped', familyKnown: false, gate: 'not_judged' }] }} coldTouchAllowed />);
    const item = screen.getByTestId('anchor-pending');
    expect(item.textContent).toMatch(/Proposal: one thing missing/);
    expect(screen.queryByTestId('anchor-pending-approve')).toBeNull();
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, hypothesisId: 'h-inc', status: 'review_required', existing: true, family: 'hidden_capacity', familyBasis: 'chosen by you', preparation: 'submitted', missing: [], submitRefusal: null }) } as Response);
    fireEvent.change(screen.getByTestId('anchor-pending-family-select'), { target: { value: 'hidden_capacity' } });
    fireEvent.click(screen.getByTestId('anchor-pending-set-family'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse(String(fetchMock.mock.calls[1][1]!.body));
    expect(body).toMatchObject({ factId: 'f-tulsa', problemFamily: 'hidden_capacity' });
    expect(body.observation).toMatch(/\[S:f-tulsa\]\.$/);
    await waitFor(() => expect(screen.getByTestId('anchor-note').textContent).toMatch(/under review below/));
    // A fact the send gate refuses: nothing drafted, said in words.
    fetchMock.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'fact_not_outreach_evidence', detail: 'third_party_statement' }) } as Response);
    fireEvent.click(screen.getByTestId('anchor-draft-open'));
    fireEvent.click(screen.getByTestId('anchor-draft-submit'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/would be refused by the send gate \(third_party_statement\): nothing was drafted/));
  });
  it('a proposal under review is reviewed where the action lives: the opening sentence, the guess, the person, the family and the gate read; APPROVE AND USE runs the audited advance; NOT THIS STORY withdraws with a reason', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ hypothesisId: 'h-pend', ok: true, from: 'review_required', to: 'active', detail: 'approved and in use' }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ from: 'review_required', to: 'rejected', effects: [] }) } as Response);
    render(<OutreachAnchorView accountName="PepsiCo" anchor={{ ...anchor, primary: null, primaryBy: null, whyTheyCare: null, pending: [pendingItem] }} coldTouchAllowed />);
    expect(screen.getByTestId('anchor-none').textContent).toMatch(/A proposal below is waiting for your review/);
    const item = screen.getByTestId('anchor-pending');
    expect(item).toHaveAttribute('data-status', 'review_required');
    expect(item.textContent).toMatch(/Proposal under review/);
    expect(screen.getByTestId('anchor-pending-observation').textContent).toMatch(/Tulsa production facility/);
    expect(item.textContent).toMatch(/For.*Karen Darling/s);
    expect(screen.getByTestId('anchor-pending-family').textContent).toBe('hidden capacity');
    expect(item.textContent).toMatch(/Send gate.*would let this opening out/s);
    expect(item.textContent).toMatch(/Would prove wrong.*remaining sites/s);
    expect(item.textContent).toMatch(/Nothing is sent/);
    fireEvent.click(screen.getByTestId('anchor-pending-approve'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gap/hypotheses/h-pend');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ advance: 'approve_and_use' });
    await waitFor(() => expect(screen.getByTestId('anchor-note').textContent).toMatch(/Approved and in use for Karen.*separate step/));
    fireEvent.click(screen.getByTestId('anchor-pending-withdraw'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]!.body))).toMatchObject({ action: 'withdraw', reason: expect.stringMatching(/not this story/) });
    await waitFor(() => expect(screen.getByTestId('anchor-note').textContent).toMatch(/Set aside/));
  });
  it('an approved story not yet in use carries PUT THIS STORY IN USE (the audited advance); an active one does not; under a hold neither', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ hypothesisId: 'h-denver', ok: true, from: 'approved', to: 'active', detail: 'now in use' }) } as Response);
    const { unmount } = render(<OutreachAnchorView accountName="PepsiCo" anchor={anchor} coldTouchAllowed />);
    expect(screen.getByTestId('anchor-primary').textContent).toMatch(/an approved thesis, not yet in use/);
    fireEvent.click(screen.getByTestId('anchor-use-primary'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gap/hypotheses/h-denver');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ advance: 'approve_and_use' });
    await waitFor(() => expect(screen.getByTestId('anchor-note').textContent).toMatch(/In use for Karen.*separate step/));
    unmount();
    render(<OutreachAnchorView accountName="PepsiCo" anchor={{ ...anchor, primary: { ...anchor.primary!, status: 'active' } }} coldTouchAllowed />);
    expect(screen.queryByTestId('anchor-use-primary')).toBeNull();
    cleanup();
    render(<OutreachAnchorView accountName="PepsiCo" anchor={anchor} coldTouchAllowed={false} />);
    expect(screen.queryByTestId('anchor-use-primary')).toBeNull();
  });
  it('a refused approval says why in words and changes nothing; under a hold the approve control is disabled', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ hypothesisId: 'h-pend', ok: false, from: 'review_required', to: 'review_required', detail: 'approve refused: evidence_insufficient', reason: 'evidence_insufficient' }) } as Response);
    const { unmount } = render(<OutreachAnchorView accountName="PepsiCo" anchor={{ ...anchor, pending: [pendingItem] }} coldTouchAllowed />);
    fireEvent.click(screen.getByTestId('anchor-pending-approve'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Not approved: The send gate would refuse this opening/));
    unmount();
    render(<OutreachAnchorView accountName="PepsiCo" anchor={{ ...anchor, pending: [pendingItem] }} coldTouchAllowed={false} approvalHold="An open HubSpot deal: work it from the deal, never a cold first touch." />);
    const held = screen.getByTestId('anchor-pending-approve');
    expect(held).toBeDisabled();
    expect(held).toHaveAttribute('title', 'An open HubSpot deal: work it from the deal, never a cold first touch.');
  });
  it('2026-10-08 (PepsiCo, production): under RESEARCH no cold touch is allowed yet, and that is exactly when the proposal must be approvable; only a real hold disables it', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ hypothesisId: 'h-pend', ok: true, from: 'review_required', to: 'active', detail: 'approved and in use' }) } as Response);
    render(<OutreachAnchorView accountName="PepsiCo" anchor={{ ...anchor, primary: null, primaryBy: null, whyTheyCare: null, pending: [pendingItem] }} coldTouchAllowed={false} approvalHold={null} />);
    const approve = screen.getByTestId('anchor-pending-approve');
    expect(approve).toBeEnabled();
    expect(approve).not.toHaveAttribute('title');
    fireEvent.click(approve);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ advance: 'approve_and_use' });
    await waitFor(() => expect(screen.getByTestId('anchor-note').textContent).toMatch(/Approved and in use for Karen/));
  });
  it('a title-shaped observation is refused in plain words and nothing is submitted', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'title_shaped_observation' }) } as Response);
    render(<OutreachAnchorView accountName="PepsiCo" anchor={anchor} coldTouchAllowed />);
    fireEvent.click(screen.getByTestId('anchor-draft-open'));
    fireEvent.click(screen.getByTestId('anchor-draft-submit'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/reads like a headline/));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('anchor-drafted')).toBeNull();
  });
  it('with no approved thesis it says so and offers the draftable story; the persona key follows the title', () => {
    render(<OutreachAnchorView accountName="PepsiCo" anchor={{ ...anchor, primary: null, primaryBy: null, whyTheyCare: null, supporting: null, alternatives: [] }} coldTouchAllowed />);
    expect(screen.getByTestId('anchor-none').textContent).toMatch(/No usable thesis at PepsiCo yet/);
    // The draft path reads as what it is and stays closed (the seller opens it); NEXT carries the state.
    expect(screen.getByTestId('anchor-alternatives')).not.toHaveAttribute('open');
    expect(screen.getByTestId('anchor-alternatives').textContent).toMatch(/Draft a thesis from a checked fact \(1\)/);
    expect(screen.getByTestId('anchor-draftable')).toBeInTheDocument();
    expect(screen.getByTestId('anchor-draft-open').textContent).toBe('Draft a thesis from this fact');
    expect(personaKeyFor('Senior Director - PBNA Transportation')).toBe('transportation');
    expect(personaKeyFor('VP Supply Chain')).toBe('supply_chain');
    expect(personaKeyFor('Chief Operating Officer')).toBe('executive_ops');
  });
});

describe('why #1 over #2 on the chosen card', () => {
  const gap = (id: number, name: string, title: string): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false } });
  const state = (eligible: Array<{ key: string; personaId: number | null; name: string; title: string | null }>, personaId: number) =>
    projectPursuitState({ accountName: 'FedEx', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: { personaId, by: 'casey@yardflow.ai', at: '2026-10-05T14:00:00Z', source: 'motion' }, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
  it('names the first dimension the chosen person leads on, or says GAP cannot separate them', () => {
    const r = resolveOwner({ account: { name: 'FedEx', entityType: 'carrier' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(7, 'Glen Chaffee', 'Managing Director, Transportation & Logistics'), gap(3, 'Pat Ops', 'Director, Logistics')], hubspot: { read: true, count: 2, truncated: false, via: 'linked' }, now: NOW });
    const eligible = r.eligible.map((c) => ({ key: c.key, personaId: c.personaId, name: c.name, title: c.title }));
    const s = state(eligible, 7);
    render(<PeopleStackView accountName="FedEx" stack={buildPeopleStack(r, { chosenKey: s.person!.key, chosenBy: s.person!.chosenBy })} state={s} hypothesisId="h1" excluded={[]} />);
    const lead = screen.getByTestId('people-stack-lead-over');
    expect(lead).toHaveAttribute('data-tie', 'false');
    // A human choice reads as the choice first, then what the evidence says.
    expect(lead.textContent).toMatch(/^You chose Glen \(you, Oct 5\)\. The evidence agrees: Glen ranks ahead of Pat. Glen/);
    const tie = resolveOwner({ account: { name: 'Walmart Inc.', entityType: 'retailer' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(1, 'Doug Estrada', 'Regional Transportation Director'), gap(2, 'Kelly Kruse', 'Regional Transportation Director')], hubspot: { read: true, count: 2, truncated: false, via: 'linked' }, now: NOW });
    const te = tie.eligible.map((c) => ({ key: c.key, personaId: c.personaId, name: c.name, title: c.title }));
    const ts = state(te, 1);
    const { unmount } = render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(tie, { chosenKey: ts.person!.key, chosenBy: ts.person!.chosenBy })} state={ts} hypothesisId="h1" excluded={[]} />);
    expect(screen.getAllByTestId('people-stack-lead-over').pop()!.textContent).toMatch(/^You chose Doug \(you, Oct 5\)\. On evidence GAP cannot separate Doug and Kelly\./);
    unmount();
  });
});

describe('call prep on the pursuit state', () => {
  const brief: CallBrief = {
    persona: { id: 1, personaKey: null, name: 'Timothy Cooper', title: 'Director', email: 't@walmart.com', phone: null, role: null, doNotContact: false } as CallBrief['persona'],
    account: { name: 'Walmart Inc.', hubspotCompanyId: null, tier: '1', vertical: 'retail' } as CallBrief['account'],
    hypothesis: { id: 'h1', status: 'active', problemFamily: 'hidden_capacity', confidence: 50, observation: 'Walmart is overhauling its network [S:s1].', signals: [{ id: 's1', title: 'x', source_kind: 'evidence_record', evidence_url: 'https://x', evidence_text: 'Walmart is overhauling its network', observed_at: null }], problemHypothesis: 'My guess is that...', rootCauseHypotheses: [], impactHypotheses: [], whyNow: null, falsificationQuestions: [], whatANoMeans: null, contraryEvidence: null, predictedBuyerLanguage: null, wouldProveWrong: [], verifiedFact: true },
    lastDispositions: [], openBids: [], suggestedQuestions: [], afterAcknowledgementQuestions: [],
  };
  it('says the hold first and offers no opener when the account is opted out, in a deal, held or on a reply', () => {
    render(<PreCallBrief brief={{ ...brief, suggestedQuestions: ['Did the change above add trailer volume?'], afterAcknowledgementQuestions: ['How many trailers wait?'], pursuit: { state: 'opted_out', stateLine: 'Opted out: timothy.cooper@walmart.com, Oct 5', blocker: 'Timothy Cooper replied "stop" on Oct 5: record it as do not contact.', holdsCall: true, hypothesisId: null, usableTheses: [], caution: null } }} />);
    const hold = screen.getByTestId('brief-hold');
    expect(hold).toHaveAttribute('data-pursuit-state', 'opted_out');
    expect(hold.textContent).toMatch(/^Opted out: timothy.cooper@walmart.com, Oct 5\. Timothy Cooper replied "stop"/);
    expect(screen.queryByTestId('fact-block')).toBeNull();
    expect(screen.getByTestId('brief-no-opener').textContent).toMatch(/No opener while the account is opted out/);
    // Seller re-check: a question to ask the buyer is an opener too; under a hold none shows, nor the thesis's own
    // "would prove wrong"; the history and the outcome recorder stay.
    expect(screen.queryByTestId('brief-questions')).toBeNull();
    expect(screen.queryByTestId('brief-after-acknowledgement')).toBeNull();
    expect(screen.queryByTestId('brief-prove-wrong')).toBeNull();
    expect(screen.queryByTestId('hypothesis-block')).toBeNull();
    expect(screen.getByTestId('brief-dispositions')).toBeInTheDocument();
    expect(screen.getByTestId('brief-bids')).toBeInTheDocument();
    // The hold precedes everything else in reading order.
    expect(document.body.innerHTML.indexOf('data-testid="brief-hold"')).toBeLessThan(document.body.innerHTML.indexOf('data-testid="brief-persona"'));
  });
  it('while the state is being read, and when it could not be read, no opener is offered (fail closed)', () => {
    const { unmount } = render(<PreCallBrief brief={brief} checking />);
    expect(screen.getByTestId('brief-checking')).toBeInTheDocument();
    expect(screen.queryByTestId('fact-block')).toBeNull();
    expect(screen.getByTestId('brief-no-opener').textContent).toMatch(/once the account state is known/);
    unmount();
    render(<PreCallBrief brief={brief} stateUnreadable />);
    expect(screen.getByTestId('brief-state-unreadable').textContent).toMatch(/could not be read just now: no opener/);
    expect(screen.queryByTestId('fact-block')).toBeNull();
  });
  it('without a hold the FACT block renders; a keyword hit is captioned as such, never as an observed fact', () => {
    const { unmount } = render(<PreCallBrief brief={{ ...brief, suggestedQuestions: ['Did the change above add trailer volume?'], pursuit: { state: 'ready', stateLine: 'Ready for a first touch', blocker: null, holdsCall: false, hypothesisId: 'h1', usableTheses: ['h1'], caution: null } }} />);
    expect(screen.queryByTestId('brief-hold')).toBeNull();
    expect(screen.getByTestId('brief-questions')).toHaveTextContent('Did the change above add trailer volume?');
    expect(screen.getByTestId('fact-block').textContent).toMatch(/FACT.*Observed, cited/s);
    unmount();
    render(<PreCallBrief brief={{ ...brief, hypothesis: { ...brief.hypothesis!, verifiedFact: false } }} />);
    expect(screen.getByTestId('fact-block').textContent).toMatch(/KEYWORD HIT.*Not a verified fact: never read aloud as one/s);
    expect(screen.getByTestId('fact-block').className).toMatch(/border-l-amber-600/);
    expect(screen.getByTestId('fact-block').textContent).not.toMatch(/Observed, cited/);
  });
});

describe('call prep agrees with the send gate and NEXT (seller re-check)', () => {
  const brief: CallBrief = {
    persona: { id: 7, personaKey: null, name: 'Ryan Dixon', title: 'Director Logistics', email: 'r@generalmills.com', phone: null, role: null, doNotContact: false } as CallBrief['persona'],
    account: { name: 'General Mills', hubspotCompanyId: null, tier: '1', vertical: 'cpg' } as CallBrief['account'],
    hypothesis: { id: 'h-brazil', status: 'active', problemFamily: 'hidden_capacity', confidence: 50, observation: 'General Mills agreed to sell its business in Brazil [S:s1].', signals: [{ id: 's1', title: 'x', source_kind: 'evidence_record', evidence_url: 'https://x', evidence_text: 'y', confidence: 1, external_ok: true, kind: 'network_change' }], problemHypothesis: 'My guess is that the network change moves volume.', rootCauseHypotheses: [], impactHypotheses: [], whyNow: null, falsificationQuestions: ['Does the Brazil sale touch a North America yard?'], whatANoMeans: null, wouldProveWrong: [] } as unknown as CallBrief['hypothesis'],
    lastDispositions: [], openBids: [], suggestedQuestions: ['Did the change above add trailer volume or dwell at the sites that remain?'], afterAcknowledgementQuestions: [],
  };
  it('a thesis the send gate would refuse (not in the usable set) is no opener: no fact, no thesis, no question; the recorder stays', () => {
    render(<PreCallBrief brief={{ ...brief, pursuit: { state: 'research', stateLine: 'Research: the angle needs your review before it is used', blocker: null, holdsCall: false, hypothesisId: null, usableTheses: [], caution: null } }} />);
    expect(screen.getByTestId('brief-state')).toHaveTextContent('Research: the angle needs your review before it is used.');
    expect(screen.getByTestId('brief-no-opener').textContent).toMatch(/^No opener until the thesis is usable: the send gate would refuse it or it needs review\./);
    expect(screen.queryByTestId('fact-block')).toBeNull();
    expect(screen.queryByTestId('hypothesis-block')).toBeNull();
    expect(screen.queryByTestId('brief-questions')).toBeNull();
    expect(screen.getByTestId('brief-dispositions')).toBeInTheDocument();
  });
  it('a usable thesis opens; a missing usable set reads as nothing usable (fail closed)', () => {
    const { unmount } = render(<PreCallBrief brief={{ ...brief, pursuit: { state: 'ready', stateLine: 'Ready for a first touch: Ryan Dixon', blocker: null, holdsCall: false, hypothesisId: 'h-brazil', usableTheses: ['h-brazil'], caution: null } }} />);
    expect(screen.getByTestId('fact-block')).toBeInTheDocument();
    expect(screen.getByTestId('brief-questions')).toBeInTheDocument();
    unmount();
    render(<PreCallBrief brief={{ ...brief, pursuit: { state: 'ready', stateLine: 'Ready for a first touch: Ryan Dixon', blocker: null, holdsCall: false } as unknown as NonNullable<CallBrief['pursuit']> }} />);
    expect(screen.queryByTestId('fact-block')).toBeNull();
    expect(screen.getByTestId('brief-no-opener').textContent).toMatch(/No opener until the thesis is usable/);
  });
  it('the remit caution NEXT carries shows on the call page with the opener, and never under a hold', () => {
    const caution = "Caution: the opening fact is an air network change (aircraft, flights) and may not land on Glen's remit; Lisa Lisson, President, Air Network Operations, fits it.";
    const { unmount } = render(<PreCallBrief brief={{ ...brief, pursuit: { state: 'ready', stateLine: 'Ready for a first touch: Glen Chaffee', blocker: null, holdsCall: false, hypothesisId: 'h-brazil', usableTheses: ['h-brazil'], caution } }} />);
    expect(screen.getByTestId('brief-caution')).toHaveTextContent(caution);
    expect(document.body.innerHTML.indexOf('data-testid="brief-caution"')).toBeLessThan(document.body.innerHTML.indexOf('data-testid="fact-block"'));
    unmount();
    render(<PreCallBrief brief={{ ...brief, pursuit: { state: 'in_deal', stateLine: 'In a deal', blocker: 'Work the deal.', holdsCall: true, hypothesisId: null, usableTheses: [], caution } }} />);
    expect(screen.queryByTestId('brief-caution')).toBeNull();
  });
});

describe('the six-line brief carries BEST PROOF as ours', () => {
  it('renders the proof row with the canon phrasing and the ownership line', () => {
    const b: SixLineBrief = { know: { fact: null, reason: 'No fact is linked to this thesis.' }, proof: { text: BEST_PROOF_MEASURED, tag: 'Our proof, measured' }, think: null, learn: null, whyYou: null, history: [], historyState: 'clear', wrongIf: null, context: [], account: null };
    render(<SixLineBriefView brief={b} personaId={null} accountName="PepsiCo" />);
    const row = screen.getByTestId('brief-proof');
    expect(row.textContent).toMatch(/Our proof, measured.*48 to 24 minutes, measured.*YardFlow's own number, never theirs/s);
    expect(document.body.innerHTML.indexOf('data-testid="brief-know"')).toBeLessThan(document.body.innerHTML.indexOf('data-testid="brief-proof"'));
  });
});
