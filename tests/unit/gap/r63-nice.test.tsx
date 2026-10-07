/**
 * R63-B NICE items fixed in passing (each under ten minutes, or named by the lead as a fix):
 *   N1  "7 hypothesises" on the thesis list (the plural; the object is a thesis)
 *   N3  the composer's title had an em dash ("Compose — pick a recipient")
 *   N4  "Why this person?" did not close on Escape
 *   N5  screen-reader text ran together ("To learnLearn", "Buyer confirmedProblem:", "Deal step:Reopened", "r63· ...")
 *   N8  the proof line said "260 sites under contract" (the canon says "260 sites committed") and was typed by hand
 *   N10 "HubSpot next step: Pilot scope call with Ann" beside "Canceled: Pilot scope" (a canceled meeting is not the next step)
 * N2 (a stale Record shown as success) is pinned in r63-capture-announce.test.tsx with the Capture fixture.
 */
import { readFileSync } from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { CANON_PROOF } from '@/lib/gap/compiler/canon';
import { canonPhrasingProblems } from '@/lib/gap/compiler/checks/c01-evidence';
import { BEST_PROOF_MEASURED } from '@/lib/gap/story/anchor';
import { nextStepLine } from '@/components/gap/deal-opportunities';
import { MeetingPrepView } from '@/components/gap/meeting-prep';
import { HypothesisList } from '@/app/gap/hypotheses/hypothesis-list';
import type { HypothesisRow } from '@/components/gap/hypothesis-drawer';
import { resolveOwner } from '@/lib/gap/people/owner-resolution';
import { buildPeopleStack } from '@/lib/gap/people/stack';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { PeopleStackView } from '@/components/gap/people-stack';

describe('R63-B NICE', () => {
  it('N8: the proof line is the canon\'s own phrases, "260 sites committed", and passes the compiler\'s phrasing rule', () => {
    for (const phrase of Object.values(CANON_PROOF)) expect(BEST_PROOF_MEASURED.toLowerCase()).toContain(phrase.toLowerCase());
    expect(BEST_PROOF_MEASURED).toContain('260 sites committed');
    expect(BEST_PROOF_MEASURED).not.toMatch(/under contract/);
    expect(canonPhrasingProblems(BEST_PROOF_MEASURED)).toEqual([]);
    // The old line broke the nearest-qualifier rule twice (measured beside 5%, live beside 260).
    expect(canonPhrasingProblems('Primo Brands: trailer turns 48 to 24 minutes, measured, with about 5% more volume through the same doors, observed; 24 sites live, 260 sites under contract.').length).toBeGreaterThan(0);
  });

  it('N10: a canceled meeting is not the next step', () => {
    expect(nextStepLine('Pilot scope call with Ann', ['Pilot scope'])).toEqual({ kind: 'canceled', text: 'HubSpot still lists "Pilot scope call with Ann" as the next step, but that meeting was canceled: there is no next step until it is rebooked or a new one is set.' });
    expect(nextStepLine('Pilot scope call with Ann', ['Columbus yard walk'])).toEqual({ kind: 'next', text: 'HubSpot next step: Pilot scope call with Ann' });
    expect(nextStepLine(null, ['Pilot scope']).kind).toBe('none');
  });

  it('N3: no em dash in the composer\'s title', () => {
    expect(readFileSync('src/components/global-compose-button.tsx', 'utf8')).not.toContain('—');
  });

  it('N1: the thesis list counts theses', () => {
    const row = (id: string): HypothesisRow => ({ id, account_name: 'Mills Scratch Co r63', problem_family: 'hidden_capacity', persona: 'vp_operations', status: 'active', confidence: 40, observation: 'x', problem_hypothesis: 'y', updated_at: '2026-10-07T00:00:00.000Z' }) as HypothesisRow;
    const { unmount } = render(<HypothesisList items={[row('a'), row('b')]} status="active" />);
    expect(document.body.textContent).toContain('2 theses');
    expect(document.body.textContent).not.toMatch(/hypothesises/);
    unmount();
    render(<HypothesisList items={[row('a')]} status="active" />);
    expect(document.body.textContent).toContain('1 thesis');
  });

  it('N5: a trust word and the line after it are read as two words', () => {
    render(
      <MeetingPrepView
        prep={{ meetingId: 1, at: '2026-10-08T14:00:00.000Z', state: 'upcoming', headline: 'Meeting Thu, Oct 8, 10:00 AM: Columbus yard walk', what: 'Columbus yard walk', dealId: '1', dealName: 'Columbus DC', objective: { text: 'Columbus yard walk with Ben', trust: 'Recorded', source: 'the meeting on record' }, attendees: [], lastCommitment: null, confirmedNeeds: [{ text: 'Problem: "We lose about 3 hours per shift."', trust: 'Buyer confirmed', source: 'Ben, Oct 7' }], openQuestions: [{ text: 'Learn how their yards run today.', trust: 'To learn' }], toTest: [], publicContext: [], materials: [], startingPoint: 'x' }}
      />,
    );
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/To learnLearn|Buyer confirmedProblem|RecordedColumbus/);
    expect(text).toMatch(/To learn Learn how/);
  });

  it('N4: Escape closes an open "Why this person?" and focus goes back to its button', () => {
    const NOW = new Date('2026-10-05T15:00:00Z');
    const r = resolveOwner({ account: { name: 'Walmart Inc.', entityType: 'retailer' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [{ key: 'gap:1', source: 'gap', personaId: 1, name: 'Doug Estrada', title: 'Senior Director, Transportation', hasEmail: true, employment: { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false } }], hubspot: { read: true, count: 0, truncated: false, via: 'linked' }, now: NOW });
    const eligible = r.eligible.map((c) => ({ key: c.key, personaId: c.personaId, hubspotContactId: c.hubspotContactId, name: c.name, title: c.title }));
    const state = projectPursuitState({ accountName: 'Walmart Inc.', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible });
    render(<PeopleStackView accountName="Walmart Inc." stack={buildPeopleStack(r, { chosenKey: null })} state={state} hypothesisId="h1" excluded={[]} />);
    const why = screen.getAllByTestId('people-stack-why')[0];
    fireEvent.click(why);
    expect(why).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(why.getAttribute('aria-controls')!)!;
    fireEvent.keyDown(panel.querySelector('li') ?? panel, { key: 'Escape' });
    expect(why).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(why);
  });
});
