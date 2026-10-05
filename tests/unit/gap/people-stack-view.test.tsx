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
    render(<PeopleStackView accountName="Walmart Inc." stack={stack} state={state} hypothesisId="h1" excluded={r.excluded} />);
    expect(screen.getAllByTestId('people-stack-row').length).toBeLessThanOrEqual(5);
    expect(screen.queryAllByTestId('people-stack-ordinal')).toHaveLength(0);
    expect(screen.getByTestId('people-stack-tie').textContent).toMatch(/could not separate/);
    expect(screen.queryAllByTestId('people-stack-badge')).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/Best fit|Recommended/);
    expect(screen.getByTestId('people-stack-choose-label').textContent).toMatch(/Choose who \(\d+\)/);
    expect(screen.getByTestId('people-stack-show-all').textContent).toMatch(/Show \d+ more on record/);
    expect(screen.getByTestId('people-stack-show-all').textContent).toMatch(/1 set aside/);
  });
  it('the departed person is not a row; Show all opens the rest and names them under set aside with the plain reason', () => {
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={r.excluded} />);
    expect(screen.queryByText(/Dakota Socha/)).toBeNull();
    fireEvent.click(screen.getByTestId('people-stack-show-all'));
    expect(screen.getAllByTestId('people-stack-row').length).toBe(r.eligible.length);
    expect(screen.getByTestId('people-stack-set-aside').textContent).toMatch(/Dakota Socha.*left the company/);
  });
  it('Why this person? is a disclosure (aria-expanded) that reveals every resolver reason and hides it again', () => {
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={r.excluded} />);
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
    render(<PeopleStackView accountName="Walmart Inc." stack={stack} state={state} hypothesisId="h1" excluded={r.excluded} />);
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
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={r.excluded} />);
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
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={r.excluded} />);
    const hsRow = screen.getAllByTestId('people-stack-row').find((el) => el.getAttribute('data-key')?.startsWith('hubspot:'))!;
    fireEvent.click(hsRow.querySelector('[data-testid="people-stack-choose"]')!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/gap/people/import');
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]!.body))).toMatchObject({ primaryPersonaId: 777 });
  });
  it('a refused choice is an alert that says nothing changed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'persona_not_at_account' }) } as Response);
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={stateFor({})} hypothesisId="h1" excluded={r.excluded} />);
    fireEvent.click(screen.getAllByTestId('people-stack-choose')[0]);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Nothing changed/));
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('holds dominate the actions', () => {
  it('under a human reply, no row offers Choose: the blocker reads instead', () => {
    const state = stateFor({ replies: [{ from: 'x@walmart.com', name: 'Tim', at: '2026-10-05T13:58:00Z', subject: null, snippet: 'Call me Tuesday.', triaged: false }] });
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={state} hypothesisId="h1" excluded={r.excluded} />);
    expect(screen.queryAllByTestId('people-stack-choose')).toHaveLength(0);
    expect(screen.getAllByTestId('people-stack-held')[0].textContent).toMatch(/No cold email to anyone at Walmart Inc\./);
  });
});
