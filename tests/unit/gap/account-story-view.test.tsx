/**
 * UX-05 at render: the Account Story leads the context column and takes WHY NOW's place; every sentence shows its
 * tag and basis; STORIES THAT MATTER is a closed disclosure; "check before contacting" sits beside the person, after
 * NEXT and before the stack; the stack is a card only for the chosen person (no cards under a hold or a deal); the
 * private line stays its own labelled line and never enters the story.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { AccountNowView } from '@/components/gap/account-now';
import { AccountStoryView } from '@/components/gap/account-story';
import type { NowView } from '@/lib/gap/context/now';
import { resolveOwner, type OwnerCandidateInput } from '@/lib/gap/people/owner-resolution';
import { buildPeopleStack } from '@/lib/gap/people/stack';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import type { AccountStory } from '@/lib/gap/story/story';

const NOW = new Date('2026-10-06T12:00:00Z');
const PRIVATE_SENTINEL = '/for/fedex-private-sentinel';
const v: NowView = {
  name: 'FedEx', stateLine: 'carrier · Direct buyer · Ready for a first touch · Owner: Casey', lastTouch: 'No touch on record.', lastReply: null, unit: null,
  next: { text: 'old next', source: 'motion' }, who: null, betterFit: null, whoUnknown: null, alternate: null,
  whyNow: [{ id: 'w1', text: 'ONGOING PROGRAM: network redesign.', tag: 'Checked', basis: 'reported by sec.gov, Jul 20, 2026', cite: 'OK to cite to the buyer' }],
  gap: [], currentState: 'Current state: not confirmed by the buyer.', know: [], think: null, impact: 'Impact: unknown.', ask: 'How do trailers get checked in today?',
  relationship: null, private: `Private: interest signal, never mention to the buyer. 3 deep sessions on ${PRIVATE_SENTINEL}.`, wedge: null, asset: null, listen: 'FedEx.',
};
const story: AccountStory = {
  rows: [
    { key: 'between_us', label: 'What has happened between us', tag: 'Checked', collapsed: false, wrongIf: null, sentences: [{ text: 'Last email to Courtney Keen, Managing Director, FedEx Supply Chain, Jun 1: "Yard dwell".', tag: 'Checked', basis: 'account history, Jun 1', basisIds: ['touch:1'] }, { text: 'Courtney Keen sent an automatic reply on Jun 2: not an answer.', tag: 'Checked', basis: 'GAP ledger, Jun 2', basisIds: ['touch:2'] }] },
    { key: 'changing', label: 'What is changing', tag: 'Checked', collapsed: false, wrongIf: null, sentences: [{ text: 'FedEx is consolidating its networks under Network 2.0.', tag: 'Checked', basis: 'reported by sec.gov, Jul 20', basisIds: ['evidence:f1'], cite: 'OK to cite to the buyer' }] },
    { key: 'yard', label: 'Yard opportunity', tag: 'Our read', collapsed: false, wrongIf: 'Volume moved without yard strain.', sentences: [{ text: 'The surviving hubs absorb rerouted volume and the yards become the constraint.', tag: 'Our read', basis: 'our read; not confirmed by the buyer', basisIds: ['hypothesis:h1'] }] },
    { key: 'stories', label: 'Stories that matter', tag: 'Checked', collapsed: true, wrongIf: null, sentences: [{ text: 'Memphis is a 940-acre hub.', tag: 'Checked', basis: 'their own publication, Jul 20', basisIds: ['evidence:f2'], cite: 'Checked, not for outreach' }] },
    { key: 'note', label: 'Your note', tag: 'Our read', collapsed: false, wrongIf: null, sentences: [{ text: 'Consolidation makes the yards the constraint.', tag: 'Our read', basis: 'your vault note, Jul 10; never quote it to the buyer', basisIds: ['vault:account-note'] }] },
  ],
  first: [],
  setAsideCaveats: [{ text: 'Ray Hatton, Vice President, FedEx Supply Chain is set aside as a divested unit; that rests on an unverified report (FedEx to sell FedEx Supply Chain to CMA CGM).', tag: 'Unverified', basis: "a third party's report, not checked; Sep 25", basisIds: ['signal:s1', 'set-aside:gap:11'] }],
  checkBeforeContacting: [{ text: 'Check before contacting Courtney Keen: FedEx to sell FedEx Supply Chain to CMA CGM. It names their unit and is not verified.', tag: 'Unverified', basis: "a third party's report, not checked; Sep 25", basisIds: ['signal:s1'] }],
};
const gap = (id: number, name: string, title: string): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false } });
const r = resolveOwner({ account: { name: 'FedEx', entityType: 'carrier' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(7, 'Glen Chaffee', 'Managing Director, Transportation & Logistics'), gap(8, 'Courtney Keen', 'Managing Director, FedEx Supply Chain'), gap(3, 'Lisa Lisson', 'President, Air Network Operations')], hubspot: { read: true, count: 3, truncated: false, via: 'linked' }, now: NOW });
const eligible = r.eligible.map((c) => ({ key: c.key, personaId: c.personaId, hubspotContactId: c.hubspotContactId, name: c.name, title: c.title }));
const stateFor = (over: Partial<Parameters<typeof projectPursuitState>[0]> = {}) =>
  projectPursuitState({ accountName: 'FedEx', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: { personaId: 7, by: 'casey@yardflow.ai', at: '2026-10-05T20:41:00Z', source: 'owner_resolution' }, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible, ...over });

describe('the story view', () => {
  it('shows every sentence with its tag and basis, the cite status where one exists, Wrong if under Our read, and the stories collapsed', () => {
    render(<AccountStoryView story={story} />);
    const rows = screen.getAllByTestId('story-row');
    expect(rows.map((el) => el.getAttribute('data-key'))).toEqual(['between_us', 'changing', 'yard', 'stories', 'note']);
    for (const s of screen.getAllByTestId('story-sentence')) {
      expect(s.getAttribute('data-tag')).toBeTruthy();
      expect(s.textContent).toMatch(new RegExp(s.getAttribute('data-tag')!.replace(/ /g, '\\s')));
    }
    expect(screen.getByTestId('story-wrong-if').textContent).toBe('Wrong if: Volume moved without yard strain.');
    expect(screen.getAllByTestId('story-sentence').find((el) => /Network 2\.0/.test(el.textContent ?? ''))!.textContent).toMatch(/OK to cite to the buyer/);
    const stories = rows.find((el) => el.getAttribute('data-key') === 'stories')!;
    expect(stories.tagName).toBe('DETAILS');
    expect(stories).not.toHaveAttribute('open');
    expect(screen.getByTestId('story-row-summary').textContent).toMatch(/^Stories that matter \(1\)Show/);
    expect(screen.getByTestId('story-row-summary').textContent).toMatch(/Hide$/);
    expect(screen.getByTestId('story-row-summary').querySelector('h3')!.textContent).toBe('Stories that matter (1)');
    expect(screen.getAllByTestId('story-sentence').find((el) => /vault note/.test(el.textContent ?? ''))!.textContent).toMatch(/never quote it to the buyer/);
  });
  it('renders nothing for an empty story', () => {
    const { container } = render(<AccountStoryView story={{ rows: [], first: [], checkBeforeContacting: [], setAsideCaveats: [] }} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('NOW with the story', () => {
  it('the story leads the context column and takes WHY NOW\'s place; check-before-contacting sits after NEXT and before the stack; the private line stays its own line', () => {
    const state = stateFor();
    const stack = buildPeopleStack(r, { chosenKey: state.person!.key, chosenBy: state.person!.chosenBy });
    const { container } = render(<AccountNowView v={v} nextHref="/gap/preview/h1?personaId=7" nextLabel="Prepare the email to Glen" nextText="Prepare the first touch to Glen Chaffee." links={[]} pursuit={{ state, stack, hypothesisId: 'h1', excluded: [], story }} />);
    const idx = (id: string) => container.innerHTML.indexOf(`data-testid="${id}"`);
    const order = ['now-next', 'now-next-control', 'now-check-before', 'people-stack', 'people-stack-set-aside-caveats', 'now-context', 'account-story', 'now-ask', 'now-private'].map(idx);
    expect(order.every((x, k) => x > -1 && (k === 0 || x > order[k - 1]))).toBe(true);
    expect(screen.queryByTestId('now-why-now')).toBeNull();
    expect(screen.queryByTestId('now-know')).toBeNull();
    expect(screen.queryByTestId('now-think')).toBeNull();
    expect(screen.getByTestId('people-stack-set-aside-caveats').textContent).toMatch(/^Ray Hatton.*unverified report/);
    // The story carries the last email and the reply: the header says neither again.
    expect(screen.queryByTestId('now-last-touch')).toBeNull();
    expect(screen.queryByTestId('now-last-inbound')).toBeNull();
    expect(screen.getByTestId('now-check-before').textContent).toMatch(/^Check before contacting Courtney Keen/);
    expect(screen.getByTestId('account-story').textContent).not.toContain(PRIVATE_SENTINEL);
    expect(screen.getByTestId('now-private').textContent).toContain(PRIVATE_SENTINEL);
  });
  it('without a story WHY NOW renders as before', () => {
    const state = stateFor();
    render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} pursuit={{ state, stack: buildPeopleStack(r, { chosenKey: state.person!.key, chosenBy: state.person!.chosenBy }), hypothesisId: 'h1', excluded: [] }} />);
    expect(screen.getByTestId('now-why-now')).toBeInTheDocument();
    expect(screen.queryByTestId('account-story')).toBeNull();
  });
});

describe('the compact stack', () => {
  it('a card only for the chosen person; the alternatives are compact rows with the reason, Make first and Why on one line', () => {
    const state = stateFor();
    render(<AccountNowView v={v} nextHref="/gap/preview/h1?personaId=7" nextLabel="Prepare the email to Glen" links={[]} pursuit={{ state, stack: buildPeopleStack(r, { chosenKey: state.person!.key, chosenBy: state.person!.chosenBy }), hypothesisId: 'h1', excluded: [], story }} />);
    const rows = screen.getAllByTestId('people-stack-row');
    expect(rows[0]).toHaveAttribute('data-compact', 'false');
    expect(rows[0].textContent).toMatch(/Glen Chaffee/);
    expect(rows[0].textContent).toMatch(/Email on record/);
    for (const row of rows.slice(1)) {
      expect(row).toHaveAttribute('data-compact', 'true');
      expect(row.querySelector('[data-testid="people-stack-cue"]')!.textContent).toMatch(/email on record/);
      expect(row.querySelector('[data-testid="people-stack-choose"]')!.textContent).toMatch(/first instead/);
      expect(row.querySelector('[data-testid="people-stack-why"]')).not.toBeNull();
      expect(row.querySelector('[data-testid="people-stack-log"]')).toBeNull();
    }
  });
  it('a compact row carries no hold sentence of its own; the heading says it once', () => {
    const state = stateFor({ motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'YardFlow - FedEx', stage: 'Discovery' }] } });
    render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} pursuit={{ state, stack: buildPeopleStack(r, { chosenKey: null }), hypothesisId: 'h1', excluded: [], story }} />);
    expect(document.body.textContent!.match(/no cold touch right now/gi)).toHaveLength(1);
    for (const row of screen.getAllByTestId('people-stack-row')) expect(row.querySelector('[data-testid="people-stack-cue"]')!.textContent).toMatch(/email on record/);
  });
  it('under a deal or an opt-out no row is a card, the chosen person included', () => {
    for (const state of [
      stateFor({ motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'YardFlow - FedEx', stage: 'Discovery' }] } }),
      stateFor({ replies: [{ from: 'x@fedex.com', name: null, at: '2026-10-05T13:58:00Z', subject: null, snippet: 'stop', triaged: false }] }),
    ]) {
      const { unmount } = render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} pursuit={{ state, stack: buildPeopleStack(r, { chosenKey: state.person?.key ?? null, chosenBy: state.person?.chosenBy ?? null }), hypothesisId: 'h1', excluded: [], story }} />);
      for (const row of screen.getAllByTestId('people-stack-row')) expect(row).toHaveAttribute('data-compact', 'true');
      expect(screen.queryAllByTestId('people-stack-choose')).toHaveLength(0);
      expect(screen.queryAllByTestId('people-stack-prepare')).toHaveLength(0);
      unmount();
    }
  });
  it('a compact row carries a material cue (HubSpot only, a role change) beside its reason, never the plain default', () => {
    const noEmail = resolveOwner({ account: { name: 'FedEx', entityType: 'carrier' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(7, 'Glen Chaffee', 'Managing Director, Transportation & Logistics'), { key: 'hubspot:88', source: 'hubspot', hubspotContactId: '88', name: 'Kym White', title: 'Managing Director, Ground Operations', hasEmail: true }], hubspot: { read: true, count: 2, truncated: false, via: 'linked' }, now: NOW });
    const state = stateFor({ eligible: noEmail.eligible.map((c) => ({ key: c.key, personaId: c.personaId, hubspotContactId: c.hubspotContactId, name: c.name, title: c.title })) });
    render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} pursuit={{ state, stack: buildPeopleStack(noEmail, { chosenKey: state.person!.key, chosenBy: state.person!.chosenBy }), hypothesisId: 'h1', excluded: [], story }} />);
    const kym = screen.getAllByTestId('people-stack-row').find((el) => /Kym White/.test(el.textContent ?? ''))!;
    expect(kym.querySelector('[data-testid="people-stack-cue"]')!.textContent).toMatch(/in HubSpot, not yet a GAP contact/i);
  });
});
