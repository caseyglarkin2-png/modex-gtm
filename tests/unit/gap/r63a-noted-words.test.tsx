/**
 * R63-A S5: the seller's paraphrase "He said the gate still checks trailers in on paper..." was badged BUYER CONFIRMED
 * and the recap to Ben quoted it "in your words". Only their own words are quoted (their message, a transcript's
 * labelled line); a paraphrase is "what you noted they said" everywhere: the record, the deal's list, the meeting
 * brief, the story and the recap.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const recordBid = vi.fn<(p: unknown, x: Record<string, unknown>) => Promise<{ ok: true; bidId: string; humanConfirmed: boolean; supersedesId: null }>>(async () => ({ ok: true, bidId: 'bid-1', humanConfirmed: true, supersedesId: null }));
vi.mock('@/lib/gap/bid/service', () => ({ recordBid: (p: unknown, x: Record<string, unknown>) => recordBid(p, x) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { bidWording, wordingOf } from '@/lib/gap/bid/wording';
import { createCapture, decideBatch } from '@/lib/gap/capture/store';
import { prepareArtifacts } from '@/lib/gap/deals/artifacts';
import { planFor } from '@/lib/gap/deals/action-plan';
import { prepareMeeting } from '@/lib/gap/deals/meeting-prep';
import { DealOpportunities } from '@/components/gap/deal-opportunities';
import { ledgerDb } from './fixtures/ledger-db';

const NOW = new Date('2026-10-07T21:00:00Z');
const ACCOUNT = 'Kroger Scratch Co r63';
const PARA = 'He said the gate still checks trailers in on paper and the yard drivers search row by row for the trailer they need.';
const OWN = 'We lose about 3 hours per shift hunting for trailers at the Columbus gate.';

describe('R63-A S5: a paraphrase is what you noted they said, never a quote', () => {
  it('the wording rule: reported speech and the seller\'s own note lines are noted; their message and a labelled transcript line are theirs', () => {
    expect(bidWording(PARA, { reply: false, speakerLabelled: false })).toBe('noted');
    expect(bidWording(PARA, { reply: false, speakerLabelled: true })).toBe('noted');
    expect(bidWording(OWN, { reply: false, speakerLabelled: true })).toBe('verbatim');
    expect(bidWording(OWN, { reply: true, speakerLabelled: false })).toBe('verbatim');
    expect(bidWording(OWN, { reply: false, speakerLabelled: false })).toBe('noted');
    // A statement recorded before the rule: reported speech reads as noted, anything else as before.
    expect([wordingOf(null, PARA), wordingOf(null, OWN), wordingOf({ wording: 'noted' }, OWN)]).toEqual(['noted', 'verbatim', 'noted']);
  });

  it('Capture records the wording with the statement', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT], personas: [{ id: 2, name: 'Ben Scratch', email: 'ben@kroger.example.com', account_name: ACCOUNT }], hypotheses: [{ id: 'h1', account_name: ACCOUNT }] }, NOW);
    const p = db.client();
    const made = await createCapture(p, { accountName: ACCOUNT, personaId: 2, context: 'call', rawText: `${PARA}\nBen: ${OWN}`, actor: 'casey@freightroll.com', now: NOW });
    if (!made.ok) throw new Error(made.reason);
    const items = made.capture.candidates.map((c) => ({ candidateId: c.id, decision: 'confirm' as const }));
    await decideBatch(p, { captureId: made.capture.id, hypothesisId: 'h1', items, actor: 'casey@freightroll.com', now: NOW });
    const recorded = recordBid.mock.calls.map(([, x]) => [x.rawBuyerLanguage, (x.metadata as Record<string, unknown>).wording]);
    expect(recorded).toEqual(expect.arrayContaining([[PARA, 'noted'], [OWN, 'verbatim']]));
  });

  it('the recap says "in your words" only for their own words; the paraphrase is said as understood, unquoted', () => {
    const [recap] = prepareArtifacts({
      accountName: ACCOUNT,
      deal: { id: '1', name: 'Columbus DC', contacts: [{ name: 'Ben Scratch', title: null }] },
      needs: [
        { id: 'b1', type: 'business_problem', quote: OWN, who: 'Ben Scratch', at: '2026-10-07T13:00:00.000Z', accountLevel: false },
        { id: 'b2', type: 'root_cause', quote: PARA, who: 'Ben Scratch', at: '2026-10-07T13:00:00.000Z', accountLevel: false, noted: true },
      ],
      plan: planFor('1', [], []),
      commitments: [],
      roi: null,
    });
    expect(recap.text).toContain(`in your words, so you can correct anything I got wrong:\n- "${OWN}" (Ben Scratch)`);
    expect(recap.text).toContain('What I understood from our conversation:\n- The gate still checks trailers in on paper and the yard drivers search row by row for the trailer they need.');
    expect(recap.text).not.toContain(`"${PARA}"`);
    expect(recap.citations.map((c) => c.label)).toEqual(expect.arrayContaining([expect.stringMatching(/\(as you noted it\)/)]));
  });

  it('the meeting brief and the deal\'s list say "You noted", never quoting the paraphrase', () => {
    const prep = prepareMeeting({ meeting: { id: 1, at: '2026-10-08T14:00:00.000Z', status: 'Scheduled', objective: 'Columbus yard walk', attendees: null, dealId: '1', createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' }, now: NOW, deal: null, people: [], commitments: [], needs: [{ type: 'root_cause', quote: PARA, who: 'Ben Scratch', at: '2026-10-07T13:00:00.000Z', scopeLabel: 'Deal: Columbus DC', noted: true }], unknownQuestions: [], learningObjective: null, guesses: [], publicFacts: [], materials: [] } as never);
    expect(prep.confirmedNeeds[0]).toMatchObject({ trust: 'You noted', text: `Why it happens: ${PARA}` });
    const need = { id: 'b2', type: 'root_cause', quote: PARA, summary: null, contactEmail: 'ben@kroger.example.com', at: '2026-10-07T13:00:00.000Z', metadata: { wording: 'noted' }, who: 'Ben Scratch', scope: { basis: 'recorded', label: 'Deal: Columbus DC', dealId: '1', unmatched: null } };
    render(<DealOpportunities view={{ accountName: ACCOUNT, cold: 'x', deals: [{ dealId: '1', name: 'Columbus DC', stage: 'Qualified', nextStep: null, closeDate: null, amount: null, lastActivityAt: null, contacts: [], otherContacts: 0, commitments: [], needs: [need], actions: [] }], accountLevel: { commitments: [], needs: [] }, elsewhere: { commitments: [], needs: [] } } as never} />);
    expect(screen.getByTestId('deal-need').textContent).toContain('You noted they said · Ben Scratch');
    expect(screen.getByTestId('deal-need').querySelector('q')).toBeNull();
  });
});
