/**
 * R10: ONE actionable result from the one pursuit state and its NEXT: identical state yields the identical intent,
 * person, allowed action, blocker, preparation and completion event on every surface; a held account never carries
 * an allowed cold action; a proposal under review is its own intent.
 */
import { describe, expect, it } from 'vitest';
import { actionableFromPursuit, INTENT_TEXT } from '@/lib/gap/pursuit/actionable';
import { nextFromPursuit } from '@/lib/gap/pursuit/next';
import { projectPursuitState, type PursuitInput } from '@/lib/gap/pursuit/state';

const NOW = new Date('2026-10-06T15:00:00Z');
const tom = { key: 'gap:1', personaId: 1, name: 'Tom Scratch', title: 'Senior Director - Logistics, Distribution & Transportation' };
const base = (over: Partial<PursuitInput> = {}): PursuitInput => ({
  accountName: 'Pepsi Scratch Co',
  now: NOW,
  motionType: 'FACT_LED',
  opportunity: { status: 'CLEAR', detail: '', deals: [] },
  restriction: null,
  familyHold: null,
  motion: null,
  choice: { personaId: 1, by: 'casey@freightroll.com', at: '2026-10-06T14:00:00Z', source: 'motion' },
  activePersona: null,
  replies: [],
  lastOutbound: null,
  outstandingDraft: null,
  followUpDue: null,
  eligible: [tom],
  ...over,
});
const opts = { accountSlugHref: (v: string) => `/gap/accounts/pepsi-scratch-co?view=${v}`, replyThreadHref: null, captureHref: '/gap/capture?account=Pepsi%20Scratch%20Co' };
const derive = (i: PursuitInput, extra: { hypothesisId: string | null; usableTheses: string[]; pendingProposals?: number; incompleteProposals?: number }) => {
  const s = projectPursuitState(i);
  return actionableFromPursuit(s, nextFromPursuit(s, { hypothesisId: extra.hypothesisId, ...opts }), extra);
};

describe('actionableFromPursuit', () => {
  it('a chosen person with a usable thesis is a prepared cold first touch whose allowed action is the email preview and whose completion is the sent touch', () => {
    const a = derive(base(), { hypothesisId: 'h1', usableTheses: ['h1'] });
    expect(a).toMatchObject({ intent: 'cold_first_touch', preparation: 'ready', completion: 'touch_sent', person: { name: 'Tom Scratch', personaId: 1 }, allowed: { label: 'Prepare the email to Tom', href: '/gap/preview/h1?personaId=1' }, blocker: null, hypothesisId: 'h1' });
  });
  it('a reply, an opt-out, a deal and an unknown read carry no cold action: the allowed action records or works the hold, never a first touch', () => {
    const reply = derive(base({ replies: [{ from: 'tom@example.com', name: 'Tom Scratch', at: '2026-10-06T12:00:00Z', subject: 'Re: yards', snippet: 'Happy to talk next week, send times.', triaged: false }] }), { hypothesisId: 'h1', usableTheses: ['h1'] });
    expect(reply).toMatchObject({ intent: 'reply', completion: 'reply_recorded' });
    expect(reply.allowed?.label).toMatch(/reply/i);
    expect(reply.allowed?.href).not.toMatch(/preview/);
    const stop = derive(base({ replies: [{ from: 'tom@example.com', name: 'Tom Scratch', at: '2026-10-06T12:00:00Z', subject: null, snippet: 'stop', triaged: false }] }), { hypothesisId: 'h1', usableTheses: ['h1'] });
    expect(stop).toMatchObject({ intent: 'opt_out', completion: 'opt_out_recorded' });
    const deal = derive(base({ opportunity: { status: 'ACTIVE', detail: 'one open deal', deals: [{ name: 'YardFlow - Pepsi', stage: 'Appointment scheduled' }] } }), { hypothesisId: 'h1', usableTheses: ['h1'] });
    expect(deal).toMatchObject({ intent: 'deal', completion: 'deal_step_recorded' });
    expect(deal.allowed?.href).toMatch(/view=brief/);
    const unknown = derive(base({ opportunity: { status: 'UNKNOWN', detail: 'HubSpot unreadable', deals: [] } }), { hypothesisId: 'h1', usableTheses: ['h1'] });
    expect(unknown).toMatchObject({ intent: 'hold', allowed: null, completion: 'hold_lifted' });
    expect(unknown.blocker).toMatch(/HubSpot/);
  });
  it('a research account with a proposal under review is REVIEW A PROPOSAL (under review, or incomplete when the family is missing); without one it is research', () => {
    const research = base({ motionType: 'NO_GOOD_MOTION', briefNext: 'No thesis grounded on the fact yet.' });
    expect(derive(research, { hypothesisId: null, usableTheses: [], pendingProposals: 1 })).toMatchObject({ intent: 'review_proposal', preparation: 'under_review', completion: 'proposal_decided' });
    expect(derive(research, { hypothesisId: null, usableTheses: [], pendingProposals: 2, incompleteProposals: 1 })).toMatchObject({ intent: 'review_proposal', preparation: 'incomplete' });
    expect(derive(research, { hypothesisId: null, usableTheses: [] })).toMatchObject({ intent: 'research', preparation: 'none', completion: 'fact_verified' });
  });
  it('a relationship-led account is a warm touch logged in Capture; the intent words exist for every intent', () => {
    const warm = derive(base({ motionType: 'RELATIONSHIP_LED', relationship: { name: 'Ryan Heman', title: 'VP', why: 'met at MODEX' } }), { hypothesisId: null, usableTheses: [] });
    expect(warm).toMatchObject({ intent: 'warm_touch', preparation: 'ready', completion: 'touch_logged' });
    expect(warm.allowed?.href).toMatch(/capture/);
    for (const k of Object.keys(INTENT_TEXT)) expect(INTENT_TEXT[k as keyof typeof INTENT_TEXT]).toBeTruthy();
  });
});
