/**
 * R63-A S8: Fedex's Work card changed its action with no seller action, from "Prepare the email to Glen" to "Put the
 * story in use". The account page refined NEXT with the outreach anchor (R12: an approved story not yet in use is put
 * in use on the page), while the Work warmer remembered NEXT without it, so the card said one move until a page visit
 * and the other after it (and back again once the summary aged out). One function now refines NEXT for the page, the
 * warmer and Ask, so the card's move holds until the seller acts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectPursuitState, type PursuitInput } from '@/lib/gap/pursuit/state';
import { nextFromPursuit } from '@/lib/gap/pursuit/next';
import type { OutreachAnchor } from '@/lib/gap/story/anchor';

const NOW = new Date('2026-10-07T15:00:00Z');
const glen = { key: 'gap:7', personaId: 7, name: 'Glen Scratch', title: 'VP Linehaul Operations' };
const input: PursuitInput = {
  accountName: 'Fedex Scratch Co r63',
  now: NOW,
  motionType: 'FACT_LED',
  opportunity: { status: 'CLEAR', detail: '', deals: [] },
  restriction: null,
  familyHold: null,
  motion: null,
  choice: { personaId: 7, by: 'casey@freightroll.com', at: '2026-10-07T14:00:00Z', source: 'motion' },
  activePersona: null,
  replies: [],
  lastOutbound: null,
  outstandingDraft: null,
  followUpDue: null,
  eligible: [glen],
};
const APPROVED = { primary: { status: 'approved', relevance: { tier: 'direct', why: '' }, factLabel: 'the Memphis hub expansion' }, primaryBy: 'choice', fitsBetter: null, draftable: [], pending: [] } as unknown as OutreachAnchor;

vi.mock('@/lib/gap/account-intel/load', () => ({ loadAccountInputs: vi.fn(async () => ({ hypotheses: [] })) }));
vi.mock('@/lib/gap/account-intel/build', () => ({ buildAccountBrief: vi.fn(() => ({ accountName: 'Fedex Scratch Co r63' })) }));
vi.mock('@/lib/gap/context/load', () => ({ loadAccountContext: vi.fn(async () => ({})) }));
vi.mock('@/lib/gap/pursuit/load', () => ({ loadPursuit: vi.fn(async () => ({ state: projectPursuitState(input), hypothesisId: 'h-fedex', usableTheses: ['h-fedex'], ready: null })) }));
vi.mock('@/lib/gap/story/compose', () => ({ composeStoryAndAnchor: vi.fn(async () => ({ anchor: APPROVED })) }));

import { refineNextWithAnchor } from '@/lib/gap/pursuit/next-anchor';
import { clearPursuitSummaries, summarizePursuit } from '@/lib/gap/pursuit/summary';

const opts = { hypothesisId: 'h-fedex', accountSlugHref: (v: string) => `/gap/accounts/fedex-scratch-co-r63?view=${v}`, replyThreadHref: null, captureHref: '/gap/capture?account=Fedex' };

describe('R63-A S8: the Work card keeps the page\'s move until the seller acts', () => {
  beforeEach(() => clearPursuitSummaries());

  it('an approved story not yet in use: NEXT is "Put the story in use" wherever it is refined; with no anchor it stays the raw move', () => {
    const s = projectPursuitState(input);
    const raw = nextFromPursuit(s, opts);
    expect(raw.control?.label).toBe('Prepare the email to Glen');
    const refined = refineNextWithAnchor(raw, { state: s, anchor: APPROVED });
    expect(refined.control).toEqual({ href: '#outreach-anchor', label: 'Put the story in use' });
    expect(refined.text).toBe('The story for Glen is approved but not yet in use: put it in use below and the email is prepared on it.');
    // Pure: the raw move is untouched (the page's fallback control still reads it).
    expect(raw.control?.label).toBe('Prepare the email to Glen');
    expect(refineNextWithAnchor(raw, { state: s, anchor: null })).toEqual(raw);
  });

  it('the warmer remembers the page\'s move, so the card says "Put the story in use" before any page visit', async () => {
    const s = await summarizePursuit({}, 'Fedex Scratch Co r63', NOW);
    expect(s?.actionable?.allowed).toEqual({ label: 'Put the story in use', href: '#outreach-anchor' });
    expect(s?.nextText).toBe('The story for Glen is approved but not yet in use: put it in use below and the email is prepared on it.');
  });
});
