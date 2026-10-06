/**
 * UX-03 PEOPLE STACK render: the wall is gone by default, the action sits with the chosen person, the tie is said in
 * words with no ordinals, no Best fit without a recommendation, Show all opens the rest with the set-aside reasons,
 * Why this person? discloses the evidence, Choose records the motion choice (never a send). Keyboard: every control is a
 * real button or link with a name; Why carries aria-expanded.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
import { resolveOwner, type OwnerCandidateInput, type OwnerResolutionInput } from '@/lib/gap/people/owner-resolution';
import { buildPeopleStack } from '@/lib/gap/people/stack';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { PeopleStackView } from '@/components/gap/people-stack';
import type { EmploymentRead } from '@/lib/gap/people/employment';

const NOW = new Date('2026-10-05T15:00:00Z');
const unverified: EmploymentRead = { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false };
const left: EmploymentRead = { state: 'LEFT_COMPANY_CONFIRMED', why: 'Current evidence places them at ADUSA.', decidedBy: [], elsewhere: { company: 'ADUSA Distribution', title: null, source: 'LinkedIn profile', url: null, at: '2026-09-20' }, verifyNeeded: false };
const gap = (id: number, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: unverified, ...over });
const hs = (id: string, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `hubspot:${id}`, source: 'hubspot', hubspotContactId: id, name, title, hasEmail: true, location: 'Bentonville, Arkansas, United States', ...over });
const base = (over: Partial<OwnerResolutionInput> = {}): OwnerResolutionInput => ({ account: { name: 'Walmart Inc.', entityType: 'retailer' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [], hubspot: { read: true, count: 0, truncated: false, via: 'linked' }, now: NOW, ...over });
const wall = Array.from({ length: 40 }, (_, k) => hs(String(100 + k), `Person ${k}`, k % 2 ? 'Regional Transportation Director' : 'Director, Transportation Maintenance'));
const r = resolveOwner(base({ candidates: [gap(1, 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics', { location: 'Bentonville, Arkansas, United States' }), gap(45, 'Dakota Socha', 'transportation & reverse logistics', { employment: left }), ...wall] }));
const excluded = r.excluded.map((e) => ({ key: e.candidate.key, name: e.candidate.name, title: e.candidate.title, code: e.code, reason: e.reason }));
const eligibleRows = r.eligible.map((c) => ({ key: c.key, personaId: c.personaId, hubspotContactId: c.hubspotContactId, name: c.name, title: c.title }));
const stateFor = (over: Parameters<typeof projectPursuitState>[0] extends infer T ? Partial<T> : never) =>
  projectPursuitState({ accountName: 'Walmart Inc.', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: eligibleRows, ...over });

beforeEach(() => {
  refresh.mockReset();
  vi.restoreAllMocks();
});

describe('the default view', () => {
  it('shows at most five rows of forty-one eligible, no ordinals on the tie, the tie in words, and no Best fit', () => {
    const state = stateFor({});
    const stack = buildPeopleStack(r, { chosenKey: null });
    render(<PeopleStackView accountName="Walmart Inc." stack={stack} state={state} hypothesisId="h1" excluded={excluded} />);
    expect(screen.getAllByTestId('people-stack-row').length).toBeLessThanOrEqual(5);
    expect(screen.queryAllByTestId('people-stack-ordinal')).toHaveLength(0);
    expect(screen.getByTestId('people-stack-tie').textContent).toMatch(/could not separate/);
    expect(screen.queryAllByTestId('people-stack-badge')).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/Best fit|Recommended/);
    expect(screen.getByTestId('people-stack-choose-label').textContent).toMatch(/Choose who \(\d+\)/);
    expect(screen.getByTestId('people-stack-show-all').textContent).toMatch(/Show \d+ more on record/);
    expect(screen.getByTestId('people-stack-set-aside-line').textContent).toMatch(/1 set aside/);
  });
  it('the departed person is not a row; Show all opens the rest and names them under set aside with the plain reason', () => {
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={excluded} />);
    expect(screen.getAllByTestId('people-stack-row').every((el) => !/Dakota Socha/.test(el.textContent ?? ''))).toBe(true);
    expect(screen.getByTestId('people-stack-set-aside-line').textContent).toMatch(/Dakota Socha \(left the company\)/);
    fireEvent.click(screen.getByTestId('people-stack-show-all'));
    expect(screen.getAllByTestId('people-stack-row').length).toBe(r.eligible.length);
    expect(screen.getByTestId('people-stack-set-aside').textContent).toMatch(/Dakota Socha.*left the company/);
  });
  it('Why this person? is a disclosure (aria-expanded) that reveals every resolver reason and hides it again', () => {
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={excluded} />);
    const why = screen.getAllByTestId('people-stack-why')[0];
    expect(why).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(why);
    expect(why).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('people-stack-why-list').textContent).toMatch(/Source:/);
    fireEvent.click(why);
    expect(screen.queryByTestId('people-stack-why-list')).toBeNull();
  });
});

describe('the chosen person carries the action; the others carry Choose', () => {
  it('the chosen row is first with Prepare email built for THAT person, Call prep and Log a touch; no scrolling past anyone', () => {
    const state = stateFor({ choice: { personaId: 1, by: 'casey@yardflow.ai', at: '2026-10-05T14:00:00Z', source: 'motion' } });
    const stack = buildPeopleStack(r, { chosenKey: state.person!.key, chosenBy: state.person!.chosenBy });
    render(<PeopleStackView accountName="Walmart Inc." stack={stack} state={state} hypothesisId="h1" excluded={excluded} />);
    const rows = screen.getAllByTestId('people-stack-row');
    expect(rows[0]).toHaveAttribute('data-chosen', 'true');
    expect(rows[0].textContent).toMatch(/Doug Estrada/);
    expect(screen.getByTestId('people-stack-chosen').textContent).toMatch(/Chosen by you, Oct 5/);
    expect(screen.getByTestId('people-stack-prepare')).toHaveAttribute('href', '/gap/preview/h1?personaId=1');
    expect(screen.getByTestId('people-stack-call')).toHaveAttribute('href', '/gap/call/1');
    expect(screen.getByTestId('people-stack-log')).toHaveAttribute('href', '/gap/capture?account=Walmart%20Inc.');
    expect(screen.getAllByTestId('people-stack-choose')[0].textContent).toMatch(/first instead/);
  });
  it('Choose on a GAP contact posts the motion choice and says nothing is sent; the page refreshes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 201, json: async () => ({ ok: true }) } as Response);
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={excluded} />);
    const doug = screen.getAllByTestId('people-stack-row').find((el) => el.textContent?.includes('Doug Estrada'))!;
    fireEvent.click(doug.querySelector('[data-testid="people-stack-choose"]')!);
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Doug Estrada is first at Walmart Inc\. Nothing is sent/));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gap/accounts/motion');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ accountName: 'Walmart Inc.', primaryPersonaId: 1 });
    expect(refresh).toHaveBeenCalled();
  });
  it('Choose on a HubSpot-only person adds them to GAP first (the existing import), then records the choice', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, personaId: 777, status: 'created' }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true }) } as Response);
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={excluded} />);
    const hsRow = screen.getAllByTestId('people-stack-row').find((el) => el.getAttribute('data-key')?.startsWith('hubspot:'))!;
    fireEvent.click(hsRow.querySelector('[data-testid="people-stack-choose"]')!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gap/people/import');
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]!.body))).toMatchObject({ primaryPersonaId: 777 });
  });
  it('a refused choice is an alert that says nothing changed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'persona_not_at_account' }) } as Response);
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={excluded} />);
    fireEvent.click(screen.getAllByTestId('people-stack-choose')[0]);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Nothing changed/));
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('holds dominate the actions', () => {
  it('under a human reply, no row offers Choose: the blocker reads instead', () => {
    const state = stateFor({ replies: [{ from: 'x@walmart.com', name: 'Tim', at: '2026-10-05T13:58:00Z', subject: null, snippet: 'Call me Tuesday.', triaged: false }] });
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={state} hypothesisId="h1" excluded={excluded} />);
    expect(screen.queryAllByTestId('people-stack-choose')).toHaveLength(0);
    // UX-05: the hold is said once, in the heading line, never once per row (Kroger said it five times).
    expect(screen.getByTestId('people-stack-on-record').textContent).toMatch(/No cold touch right now/i);
    expect(screen.queryAllByTestId('people-stack-held')).toHaveLength(0);
  });
});

describe('review fixes (UX-03 fresh review)', () => {
  it('under an open deal: no ordinals, no "Choose who", an on-record note instead; Call prep hidden', () => {
    const state = stateFor({ motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'YardFlow - Walmart', stage: 'Discovery' }] } });
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={state} hypothesisId="h1" excluded={excluded} />);
    expect(screen.queryAllByTestId('people-stack-ordinal')).toHaveLength(0);
    expect(screen.queryByTestId('people-stack-choose-label')).toBeNull();
    expect(screen.queryByTestId('people-stack-tie')).toBeNull();
    expect(screen.getByTestId('people-stack-on-record').textContent).toMatch(/no cold touch right now/i);
    expect(screen.queryAllByTestId('people-stack-choose')).toHaveLength(0);
    expect(screen.queryAllByTestId('people-stack-call')).toHaveLength(0);
  });
  it('a relationship-led account: the person you met leads as a Relationship route with Log the touch, and is not confused with the operators', () => {
    const state = stateFor({ motionType: 'RELATIONSHIP_LED', relationship: { name: 'Ryan Heman', title: null, why: 'met at Inland26 · Chicago' } });
    render(<PeopleStackView accountName="Tyson Foods" stack={buildPeopleStack(r, { chosenKey: null })} state={state} hypothesisId="h1" excluded={excluded} />);
    const lead = screen.getByTestId('people-stack-lead');
    expect(lead.textContent).toMatch(/Ryan Heman/);
    expect(lead.textContent).toMatch(/Relationship route/);
    expect(screen.getByTestId('people-stack-lead-log')).toHaveAttribute('href', '/gap/capture?account=Tyson%20Foods');
    expect(screen.getAllByTestId('people-stack-row').every((el) => el.getAttribute('data-slot') !== 'Next operator')).toBe(true);
  });
  it('named sponsor / tech / site people are compact slot lines below the rows, never cards, with Why?', () => {
    const sponsorRes = resolveOwner(base({ candidates: [gap(1, 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics'), gap(2, 'Kelly Kruse', 'Regional Transportation Senior Director'), gap(7, 'Adam Dunbar', 'VP, Supply Chain Operations Support, Fulfillment and Reverse')] }));
    const stack = buildPeopleStack(sponsorRes, { chosenKey: null });
    expect(stack.slots.map((s) => s.name)).toContain('Adam Dunbar');
    render(<PeopleStackView accountName="Walmart Inc." stack={stack} state={stateFor({})} hypothesisId="h1" excluded={[]} />);
    expect(screen.getAllByTestId('people-stack-row').map((el) => el.textContent)).not.toContainEqual(expect.stringMatching(/Adam Dunbar/));
    const slot = screen.getByTestId('people-stack-slot');
    expect(slot.textContent).toMatch(/Executive sponsor.*Adam Dunbar.*not a cold first touch/);
  });
});

describe('UX-07: human priority controls', () => {
  const two = resolveOwner(base({ candidates: [gap(1, 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics', { location: 'Bentonville, Arkansas, United States' }), gap(2, 'Kelly Kruse', 'Regional Transportation Director', { location: 'Bentonville, Arkansas, United States' })] }));
  const rows2 = two.eligible.map((c) => ({ key: c.key, personaId: c.personaId, hubspotContactId: c.hubspotContactId, name: c.name, title: c.title }));
  const chosenState = () => projectPursuitState({ accountName: 'Walmart Inc.', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: { state: 'ready', primary: { personaId: 1, name: 'Doug Estrada', title: null }, next: { personaId: 2, name: 'Kelly Kruse', title: 'Regional Transportation Director', unlock: 'after 5 business days with no response to Doug' }, headline: '' }, choice: { personaId: 1, by: 'casey@freightroll.com', at: '2026-10-05T14:00:00Z', source: 'motion' }, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: rows2 });
  const okFetch = (body: Record<string, unknown> = { ok: true }) => vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 201, json: async () => body } as unknown as Response);

  it('shows NEXT IF NO RESPONSE from the pursuit state and tags that row; the chosen row offers no priority controls', () => {
    const state = chosenState();
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(two, { chosenKey: 'gap:1', chosenBy: 'you, Oct 5', nextPersonaId: 2, nextCandidates: new Set([2]) })} state={state} hypothesisId="h1" excluded={[]} />);
    expect(screen.getByTestId('people-stack-next').textContent).toBe('Next if no response: Kelly Kruse, Regional Transportation Director. after 5 business days with no response to Doug.');
    const kelly = screen.getAllByTestId('people-stack-row').find((el) => /Kelly Kruse/.test(el.textContent ?? ''))!;
    expect(kelly.getAttribute('data-slot')).toBe('Next if no response');
    expect(screen.queryByTestId('people-stack-make-next')).toBeNull(); // Kelly IS next; Doug is chosen: nobody to make next
    expect(screen.getAllByTestId('people-stack-more-controls')).toHaveLength(1); // on Kelly only
  });
  it('Make next is offered only where the motion can line the person up; it records the next person with the chosen primary, reads back with scope and Undo, and sends nothing', async () => {
    const state = chosenState();
    const fetchSpy = okFetch();
    const { unmount } = render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(two, { chosenKey: 'gap:1', chosenBy: 'you, Oct 5' })} state={state} hypothesisId="h1" excluded={[]} />);
    expect(screen.queryByTestId('people-stack-make-next')).toBeNull(); // no ready card for Kelly: no promise the motion would not keep
    unmount();
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(two, { chosenKey: 'gap:1', chosenBy: 'you, Oct 5', nextCandidates: new Set([2]) })} state={state} hypothesisId="h1" excluded={[]} />);
    expect(screen.getByTestId('people-stack-make-next')).toHaveTextContent('Next if Doug is silent');
    fireEvent.click(screen.getByTestId('people-stack-make-next'));
    await waitFor(() => expect(screen.getByTestId('people-stack-note').textContent).toMatch(/^Kelly is next at Walmart Inc only: next if Doug is silent\. Nothing is sent\./));
    expect(fetchSpy).toHaveBeenCalledWith('/api/gap/accounts/motion', expect.objectContaining({ method: 'POST', body: JSON.stringify({ accountName: 'Walmart Inc.', primaryPersonaId: 1, nextPersonaId: 2 }) }));
    expect(refresh).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('people-stack-undo'));
    await waitFor(() => expect(fetchSpy).toHaveBeenLastCalledWith('/api/gap/accounts/motion', expect.objectContaining({ body: JSON.stringify({ accountName: 'Walmart Inc.', primaryPersonaId: 1, nextPersonaId: null }) })));
    expect(fetchSpy.mock.calls.every(([url]) => !/send|enroll|draft|hubspot|apollo/i.test(String(url)))).toBe(true);
  });
  it('Not a fit and Not now post the preference with its reason and date; Undo posts clear; a parked row shows the line with Undo', async () => {
    const state = chosenState();
    const fetchSpy = okFetch();
    const { unmount } = render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(two, { chosenKey: 'gap:1', chosenBy: 'you, Oct 5' })} state={state} hypothesisId="h1" excluded={[]} />);
    const fit = screen.getByTestId('people-stack-not-a-fit');
    fireEvent.change(fit.querySelector('input[name="reason"]')!, { target: { value: 'maintenance, not yards' } });
    fireEvent.submit(fit);
    await waitFor(() => expect(screen.getByTestId('people-stack-note').textContent).toMatch(/^Kelly is set aside at Walmart Inc as not a fit \(maintenance, not yards\)\. Nothing is sent\./));
    expect(fetchSpy).toHaveBeenCalledWith('/api/gap/personas/2/preference', expect.objectContaining({ body: JSON.stringify({ kind: 'not_a_fit', reason: 'maintenance, not yards', until: null }) }));
    fireEvent.click(screen.getByTestId('people-stack-undo'));
    await waitFor(() => expect(fetchSpy).toHaveBeenLastCalledWith('/api/gap/personas/2/preference', expect.objectContaining({ body: JSON.stringify({ kind: 'clear' }) })));
    const notNow = screen.getByTestId('people-stack-not-now');
    fireEvent.change(notNow.querySelector('input[name="until"]')!, { target: { value: '2026-11-05' } });
    fireEvent.submit(notNow);
    await waitFor(() => expect(screen.getByTestId('people-stack-note').textContent).toMatch(/^Kelly is set aside at Walmart Inc until Nov 5\. Nothing is sent\./));
    const last = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
    expect(JSON.parse(String((last[1] as RequestInit).body))).toMatchObject({ kind: 'not_now', reason: null, until: '2026-11-05T12:00:00.000Z' });
    unmount();
    // A parked person reads the seller line in Show more, with Undo in place, and stays choosable.
    const parked = buildPeopleStack(two, { chosenKey: 'gap:1', chosenBy: 'you, Oct 5', preferences: new Map([[2, { personaId: 2, accountName: 'Walmart Inc.', kind: 'not_a_fit' as const, reason: 'maintenance', until: null, by: 'casey@freightroll.com', at: '2026-10-05T00:00:00Z' }]]) });
    render(<PeopleStackView accountName="Walmart Inc." stack={parked} state={state} hypothesisId="h1" excluded={[]} />);
    expect(screen.getAllByTestId('people-stack-row')).toHaveLength(1);
    fireEvent.click(screen.getByTestId('people-stack-show-all'));
    expect(screen.getByTestId('people-stack-preference').textContent).toMatch(/^Not a fit here \(maintenance\), you, Oct 4\. Undo$/);
    expect(screen.getByTestId('people-stack-choose')).toBeInTheDocument();
  });
  it('Left the company and Wrong role post the existing employment correction with NO Undo (a reversal would record a permanent current); Verify role posts the public check and reads the verdict back', async () => {
    const state = chosenState();
    const fetchSpy = okFetch({ verification: { verdict: 'same_role', title: 'Regional Transportation Director', company: 'Walmart' } });
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(two, { chosenKey: 'gap:1', chosenBy: 'you, Oct 5' })} state={state} hypothesisId="h1" excluded={[]} />);
    expect(screen.getByTestId('people-stack-record-controls')).toHaveTextContent(/there is no Undo/);
    fireEvent.click(screen.getByTestId('people-stack-left'));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/gap/personas/2/employment', expect.objectContaining({ body: JSON.stringify({ status: 'left' }) })));
    expect(screen.getByTestId('people-stack-note').textContent).toMatch(/^Kelly is recorded as having left Walmart Inc: no first touch to them\. This correction stands over later evidence; reverse it only with a new correction on their record\./);
    expect(screen.queryByTestId('people-stack-undo')).toBeNull();
    expect(fetchSpy.mock.calls.every(([, init]) => !/"status":"current"/.test(String((init as RequestInit).body ?? '')))).toBe(true);
    fireEvent.click(screen.getByTestId('people-stack-wrong-role'));
    await waitFor(() => expect(fetchSpy).toHaveBeenLastCalledWith('/api/gap/personas/2/employment', expect.objectContaining({ body: JSON.stringify({ status: 'role_changed' }) })));
    fireEvent.click(screen.getByTestId('people-stack-verify-role'));
    await waitFor(() => expect(fetchSpy).toHaveBeenLastCalledWith('/api/gap/personas/2/employment/verify', expect.objectContaining({ method: 'POST' })));
    expect(screen.getByTestId('people-stack-note').textContent).toMatch(/^Role check for Kelly: same role \(Regional Transportation Director, Walmart\)\. Nothing is sent\./);
  });
  it('under a hold no priority control shows at all (never over a reply, an opt-out, a deal or a hold)', () => {
    const held = projectPursuitState({ accountName: 'Walmart Inc.', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: { personaId: 1, by: 'casey@freightroll.com', at: '2026-10-05T14:00:00Z', source: 'motion' }, activePersona: null, replies: [{ from: 'kelly@walmart.com', name: 'Kelly Kruse', at: '2026-10-05T16:00:00Z', subject: 'Re: yards', snippet: 'stop', triaged: false }], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: rows2 });
    expect(held.chooseAllowed).toBe(false);
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(two, { chosenKey: 'gap:1', chosenBy: 'you, Oct 5', nextPersonaId: 2 })} state={held} hypothesisId="h1" excluded={[]} />);
    expect(screen.queryByTestId('people-stack-make-next')).toBeNull();
    expect(screen.queryByTestId('people-stack-more-controls')).toBeNull();
    expect(screen.queryByTestId('people-stack-next')).toBeNull();
  });
});
