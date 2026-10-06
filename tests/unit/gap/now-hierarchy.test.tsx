/**
 * UX-04 ACCOUNT WORKSPACE HIERARCHY: the account reads as DECISION (state with its hold colour, NEXT with the one
 * primary control, the People Stack with the chosen person first, the relationship route, the flags) then CONTEXT
 * (why now, know, think, ask, tools). THE GAP shows only when the buyer confirmed something; IMPACT only when a cost
 * is known; the chosen row carries no second primary when NEXT has it; the phone bottom bar carries Listen and Log a
 * touch; DOM order is the reading order at every width (the grid never reorders).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { AccountNowView } from '@/components/gap/account-now';
import type { NowView } from '@/lib/gap/context/now';
import { resolveOwner, type OwnerCandidateInput } from '@/lib/gap/people/owner-resolution';
import { buildPeopleStack } from '@/lib/gap/people/stack';
import { projectPursuitState } from '@/lib/gap/pursuit/state';

const NOW = new Date('2026-10-06T12:00:00Z');
const v: NowView = {
  name: 'FedEx', stateLine: 'carrier · Direct buyer · Ready for a first touch · Owner: Casey', lastTouch: 'Last touch Jun 2, 2026 (125 days ago): their reply, below.', lastReply: null, unit: null,
  next: { text: 'old next', source: 'motion' }, who: { name: 'Courtney Keen', title: 'CFO', why: 'They wrote last.', route: null }, betterFit: null, whoUnknown: null, alternate: null,
  whyNow: [{ id: 'w1', text: 'ONGOING PROGRAM: network redesign.', tag: 'Checked', basis: 'reported by sec.gov, Jul 20, 2026', cite: 'OK to cite to the buyer' }],
  gap: [{ element: 'Current state', state: 'Unknown' }, { element: 'Problem', state: 'Our read' }, { element: 'Impact', state: 'Unknown' }, { element: 'Root cause', state: 'Unknown' }],
  currentState: 'Current state: not confirmed by the buyer.', know: [], think: { text: 'the change moves load onto the yards', wrongIf: null, testedBy: null }, impact: 'Impact: unknown. The buyer has not named a cost (our model is in BRIEF, never their pain).', ask: 'How do trailers get checked in today?',
  relationship: 'Chris Anderson: Inland26 contact (field guide note, Sep 24).', private: 'Private: interest signal, never mention to the buyer.', wedge: null, asset: null, listen: 'FedEx.',
};
const gap = (id: number, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false }, ...over });
const r = resolveOwner({ account: { name: 'FedEx', entityType: 'carrier' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(7, 'Glen Chaffee', 'Managing Director, Transportation & Logistics'), gap(2187, 'Jeffrey Tallman', 'Vice President, Operations Planning and Engineering, North America'), gap(3, 'Lisa Lisson', 'President, Air Network Operations')], hubspot: { read: true, count: 3, truncated: false, via: 'linked' }, now: NOW });
const eligible = r.eligible.map((c) => ({ key: c.key, personaId: c.personaId, hubspotContactId: c.hubspotContactId, name: c.name, title: c.title }));
const state = projectPursuitState({ accountName: 'FedEx', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: { personaId: 7, by: 'casey@yardflow.ai', at: '2026-10-05T20:41:00Z', source: 'owner_resolution' }, activePersona: null, replies: [{ from: 'courtney.keen@fedex.com', name: 'Courtney Keen', at: '2026-06-02T12:00:00Z', subject: null, snippet: 'I am in the office but my responses will be delayed.', triaged: false }], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
const stack = buildPeopleStack(r, { chosenKey: state.person!.key, chosenBy: state.person!.chosenBy });
const pursuit = { state, stack, hypothesisId: 'h1', excluded: [] };

describe('UX-04 hierarchy', () => {
  it('reads decision then context: state, NEXT (one primary control), the chosen person first, the relationship route, then why now and the rest', () => {
    const { container } = render(<AccountNowView v={v} nextHref="/gap/preview/h1?personaId=7" nextLabel="Prepare the email to Glen" nextText="Prepare the first touch to Glen Chaffee." links={[{ label: 'Log what happened', href: '/gap/capture?account=FedEx' }]} pursuit={pursuit} />);
    const idx = (id: string) => container.innerHTML.indexOf(`data-testid="${id}"`);
    const order = ['now-decision', 'now-state', 'now-next', 'now-next-control', 'people-stack', 'now-relationship', 'now-context', 'now-why-now', 'now-think', 'now-ask', 'now-links'].map(idx);
    expect(order.every((x, k) => x > -1 && (k === 0 || x > order[k - 1]))).toBe(true);
    expect(screen.getByTestId('now-state').textContent).toMatch(/Ready for a first touch: Glen Chaffee/);
    expect(screen.getByTestId('now-state').className).toMatch(/emerald/);
    expect(screen.queryByTestId('now-last-touch')).toBeNull();
    expect(screen.getByTestId('now-last-inbound').textContent).toMatch(/^Automatic reply: Courtney Keen/);
    const control = screen.getByTestId('now-next-control');
    expect(control).toHaveAttribute('href', '/gap/preview/h1?personaId=7');
    expect(control.className).toMatch(/bg-\[var\(--primary\)\]/);
    // One primary control: the chosen row carries Call prep and Log a touch, not a second Prepare email.
    expect(screen.queryByTestId('people-stack-prepare')).toBeNull();
    expect(screen.getByTestId('people-stack-call')).toBeInTheDocument();
    expect(screen.getAllByTestId('people-stack-row')[0].textContent).toMatch(/Glen Chaffee/);
  });
  it('THE GAP and IMPACT are absent when the buyer confirmed nothing; present when the buyer did', () => {
    render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} pursuit={pursuit} />);
    expect(screen.queryByTestId('now-gap')).toBeNull();
    expect(screen.queryByTestId('now-impact')).toBeNull();
  });
  it('a buyer-confirmed current state brings THE GAP back; a named cost brings IMPACT back', () => {
    const vb: NowView = { ...v, gap: [{ element: 'Current state', state: 'Buyer said' }, { element: 'Problem', state: 'Our read' }, { element: 'Impact', state: 'Buyer said' }, { element: 'Root cause', state: 'Unknown' }], currentState: 'Current state (buyer said, Oct 1): trailers are found by radio.', impact: 'Impact (buyer said, Oct 1): about 40 minutes per load.' };
    render(<AccountNowView v={vb} nextHref={null} nextLabel={null} links={[]} pursuit={pursuit} />);
    expect(screen.getByTestId('now-gap').textContent).toMatch(/trailers are found by radio/);
    expect(screen.getByTestId('now-impact').textContent).toMatch(/40 minutes per load/);
  });
  it('the phone bottom bar carries Listen and Log a touch at 44 px, and the context column is a sibling after the decision (never reordered)', () => {
    const { container } = render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} pursuit={pursuit} />);
    const bar = screen.getByTestId('now-bottom-bar');
    expect(bar).toHaveAttribute('role', 'group');
    expect(screen.getByTestId('now-bottom-log')).toHaveAttribute('href', '/gap/capture?account=FedEx');
    expect(screen.getByTestId('now-bottom-log').className).toMatch(/min-h-11/);
    const root = container.querySelector('[data-testid="account-now"]')!;
    expect(root.className).toMatch(/min-\[1100px\]:grid/);
    const kids = [...root.children].map((el) => el.getAttribute('data-testid'));
    expect(kids.slice(0, 2)).toEqual(['now-decision', 'now-context']);
  });
  it('under a hold the state line reads in the hold colour and no primary control exists', () => {
    const held = projectPursuitState({ accountName: 'Walmart Inc.', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [{ from: 'tim@walmart.com', name: null, at: '2026-10-05T13:58:00Z', subject: null, snippet: 'stop', triaged: false }], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
    render(<AccountNowView v={{ ...v, name: 'Walmart Inc.' }} nextHref="/gap?lane=replies" nextLabel="Record the opt-out" nextText="Record the opt-out." links={[]} pursuit={{ ...pursuit, state: held, stack: buildPeopleStack(r, { chosenKey: null }) }} />);
    expect(screen.getByTestId('now-state').className).toMatch(/red/);
    expect(screen.queryByTestId('people-stack-prepare')).toBeNull();
    expect(screen.queryAllByTestId('people-stack-choose')).toHaveLength(0);
  });
});

describe('UX-04 review fixes', () => {
  it('under a deal the people heading says on record and in a deal, never "eligible for a first touch"', () => {
    const inDeal = projectPursuitState({ accountName: 'Kroger', now: NOW, motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'YardFlow - Kroger', stage: 'Discovery' }] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
    render(<AccountNowView v={{ ...v, name: 'Kroger' }} nextHref="/gap/accounts/kroger?view=brief" nextLabel="Open the deal brief" nextText="Work the deal." links={[]} pursuit={{ ...pursuit, state: inDeal, stack: buildPeopleStack(r, { chosenKey: null }) }} />);
    expect(screen.getByTestId('people-stack').querySelector('h2')!.textContent).toMatch(/People on record.*in a deal/);
    expect(screen.getByTestId('people-stack').querySelector('h2')!.textContent).not.toMatch(/eligible for a first touch/);
  });
  it('the phone bar carries the NEXT control when there is one, else Log a touch', () => {
    render(<AccountNowView v={v} nextHref="/gap/preview/h1?personaId=7" nextLabel="Prepare the email to Glen" nextText="Prepare." links={[]} pursuit={pursuit} />);
    expect(screen.getByTestId('now-bottom-next')).toHaveAttribute('href', '/gap/preview/h1?personaId=7');
    expect(screen.queryByTestId('now-bottom-log')).toBeNull();
  });
});

describe('UX-04 review: no duplicated lines', () => {
  it('an automatic notice is one line, not a touch line plus an inbound line; an opt-out consequence is not repeated under an opted-out state', () => {
    render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} pursuit={pursuit} />);
    expect(screen.queryByTestId('now-last-touch')).toBeNull();
    expect(screen.getByTestId('now-last-inbound').textContent).toMatch(/^Automatic reply: Courtney Keen, Jun 2, 2026\. An automatic notice/);
    const held = projectPursuitState({ accountName: 'Walmart Inc.', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [{ from: 'tim@walmart.com', name: null, at: '2026-10-05T13:58:00Z', subject: null, snippet: 'stop', triaged: false }], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
    render(<AccountNowView v={{ ...v, name: 'Walmart Inc.', lastTouch: 'No touch on record.' }} nextHref="/gap?lane=replies" nextLabel="Record the opt-out" nextText="Record the opt-out." links={[]} pursuit={{ ...pursuit, state: held, stack: buildPeopleStack(r, { chosenKey: null }) }} />);
    const inbound = screen.getAllByTestId('now-last-inbound')[1];
    expect(inbound.textContent).toBe('Opted out: tim@walmart.com, Oct 5, 2026.');
  });
  it('under a deal NEXT does not repeat the deal sentence as a blocker', () => {
    const inDeal = projectPursuitState({ accountName: 'Kroger', now: NOW, motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'YardFlow - Kroger', stage: 'Discovery' }] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
    render(<AccountNowView v={{ ...v, name: 'Kroger' }} nextHref="/x" nextLabel="Open the deal brief" nextText="Work the deal." links={[]} pursuit={{ ...pursuit, state: inDeal, stack: buildPeopleStack(r, { chosenKey: null }) }} />);
    expect(screen.queryByTestId('now-blocker')).toBeNull();
  });
});

describe('UX-04 accessibility review fixes', () => {
  it('the Why button\'s accessible name starts with its visible text (WCAG 2.5.3) and names the person', () => {
    render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} pursuit={pursuit} />);
    const why = screen.getAllByTestId('people-stack-why')[0];
    expect(why.textContent).toBe('Why this person?');
    expect(why.getAttribute('aria-label')).toMatch(/^Why this person\? Glen Chaffee$/);
  });
  it('no "Eligible operator" chip on plain eligible rows; the chosen person keeps Next operator', () => {
    render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} pursuit={pursuit} />);
    const rows = screen.getAllByTestId('people-stack-row');
    expect(rows[0].textContent).toMatch(/Next operator/i);
    expect(rows.slice(1).every((el) => !/Eligible operator/i.test(el.textContent ?? ''))).toBe(true);
    expect(document.body.textContent).not.toMatch(/Choosing records your choice/);
  });
});
