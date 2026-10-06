/**
 * UX-03: NOW renders from the pursuit state when the page loaded it: the state line carries the pursuit state, the
 * inbound line carries the reply class (an opt-out never reads as "replied"), the People Stack replaces the WHO slot,
 * NEXT is the pursuit sentence with its control. Without a pursuit the old WHO path still renders (older callers).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
import { AccountNowView } from '@/components/gap/account-now';
import type { NowView } from '@/lib/gap/context/now';
import { resolveOwner, type OwnerCandidateInput } from '@/lib/gap/people/owner-resolution';
import { buildPeopleStack } from '@/lib/gap/people/stack';
import { projectPursuitState } from '@/lib/gap/pursuit/state';

const NOW = new Date('2026-10-05T15:00:00Z');
const v: NowView = {
  name: 'Walmart Inc.', stateLine: 'retailer · Direct buyer · Ready for a first touch · Owner: Casey', lastTouch: 'No touch on record.', lastReply: null, unit: null,
  next: { text: 'Review the thesis, then use the verified fact in a first touch to Doug Estrada.', source: 'motion' }, who: { name: 'Doug Estrada', title: 'Senior Director', why: 'Primary operator.', route: null }, betterFit: null, whoUnknown: null, alternate: null,
  whyNow: [], gap: [], currentState: 'Current state: not confirmed by the buyer.', know: [], think: null, impact: 'Impact: unknown.', ask: null, relationship: null, private: null, wedge: null, asset: null, listen: 'Walmart.',
};
const gap = (id: number, name: string, title: string): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false } });
const r = resolveOwner({ account: { name: 'Walmart Inc.', entityType: 'retailer' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(1, 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics'), gap(2, 'Kelly Kruse', 'Regional Transportation Senior Director')], hubspot: { read: true, count: 2, truncated: false, via: 'linked' }, now: NOW });
const eligible = r.eligible.map((c) => ({ key: c.key, personaId: c.personaId, hubspotContactId: c.hubspotContactId, name: c.name, title: c.title }));

describe('NOW with a pursuit state', () => {
  it('an opt-out reply: the state line says Opted out (never Ready, never replied), the inbound line carries the class, the stack offers no Choose', () => {
    const state = projectPursuitState({ accountName: 'Walmart Inc.', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [{ from: 'timothy.cooper@walmart.com', name: null, at: '2026-10-05T13:58:00Z', subject: 'Re: Leaving this with you', snippet: 'stop', triaged: false }], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
    render(<AccountNowView v={v} nextHref="/gap?lane=replies" nextLabel="Record the opt-out" nextText="Record the opt-out as do not contact." links={[]} pursuit={{ state, stack: buildPeopleStack(r, { chosenKey: null }), hypothesisId: 'h1', excluded: r.excluded.map((e) => ({ key: e.candidate.key, name: e.candidate.name, title: e.candidate.title, code: e.code, reason: e.reason })) }} />);
    const line = screen.getByTestId('now-state');
    expect(line.textContent).toMatch(/^retailer · Direct buyer · Opted out: timothy.cooper@walmart.com, Oct 5 · Owner: Casey$/);
    expect(line.textContent).not.toMatch(/Ready for a first touch/);
    expect(line).toHaveAttribute('data-pursuit-state', 'opted_out');
    expect(screen.getByTestId('now-last-inbound')).toHaveAttribute('data-reply-class', 'opt_out');
    expect(screen.getByTestId('now-last-inbound').textContent).toMatch(/Opted out: timothy.cooper@walmart.com/);
    expect(screen.queryByTestId('now-who')).toBeNull();
    expect(screen.getByTestId('people-stack')).toBeInTheDocument();
    expect(screen.queryAllByTestId('people-stack-choose')).toHaveLength(0);
    expect(screen.getByTestId('now-next').textContent).toMatch(/Record the opt-out as do not contact/);
  });
  it('a chosen person: the state line names them, the stack puts them first with Prepare email, NEXT opens the same person\'s pack', () => {
    const state = projectPursuitState({ accountName: 'Walmart Inc.', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: { personaId: 2, by: 'casey@yardflow.ai', at: '2026-10-05T14:00:00Z', source: 'motion' }, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
    const stack = buildPeopleStack(r, { chosenKey: state.person!.key, chosenBy: state.person!.chosenBy });
    render(<AccountNowView v={v} nextHref="/gap/preview/h1?personaId=2" nextLabel="Prepare the email to Kelly" nextText="Prepare the first touch to Kelly Kruse." links={[]} pursuit={{ state, stack, hypothesisId: 'h1', excluded: r.excluded.map((e) => ({ key: e.candidate.key, name: e.candidate.name, title: e.candidate.title, code: e.code, reason: e.reason })) }} />);
    expect(screen.getByTestId('now-state').textContent).toMatch(/Ready for a first touch: Kelly Kruse/);
    expect(screen.getAllByTestId('people-stack-row')[0].textContent).toMatch(/Kelly Kruse/);
    expect(screen.getByTestId('people-stack-prepare')).toHaveAttribute('href', '/gap/preview/h1?personaId=2');
    expect(screen.getByTestId('now-next-control')).toHaveAttribute('href', '/gap/preview/h1?personaId=2');
  });
  it('without a pursuit the WHO slot still renders', () => {
    render(<AccountNowView v={v} nextHref={null} nextLabel={null} links={[]} />);
    expect(screen.getByTestId('now-who')).toBeInTheDocument();
    expect(screen.queryByTestId('people-stack')).toBeNull();
  });
});
