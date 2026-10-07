/**
 * R63-A B1: a seller's own promise was recorded as the buyer's. The note "I will send Ben a one-page agenda for the
 * walk by tonight." was labeled "They owe this: GAP waits, then reminds you to chase it.", retitled "They sends Ben a
 * one-page agenda for the walk", and Work then said "Ben Scratch promised it by today; it has not arrived. Chase it."
 * A first-person promise in the seller's own note is owed by the seller; a third-person one is theirs; the review
 * shows who owes it as a choice before anything is recorded; the record, Work and the brief follow it.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams('') }));
import { commitmentTitle, extractCommitments } from '@/lib/gap/capture/extract';
import { createCapture, decideBatch } from '@/lib/gap/capture/store';
import { loadCommitments, withPhases } from '@/lib/gap/work/commitments';
import { workDay } from '@/lib/gap/work/list';
import { CaptureFlow } from '@/components/gap/capture-flow';
import { ledgerDb } from './fixtures/ledger-db';

const NOW = new Date('2026-10-07T21:00:00.000Z'); // 5 pm New York: "by tonight" is today
const ACCOUNT = 'Kroger Scratch Co r63';
const AGENDA = 'I will send Ben a one-page agenda for the walk by tonight.';
const pick = (text: string, opts?: { firstPersonIsBuyer?: boolean }) => extractCommitments(text, NOW, opts).map((k) => [k.owner, k.kind, k.speaker, k.title]);

describe('R63-A B1: who owes a promise', () => {
  it('first person in the seller\'s own note is the seller\'s; third person is theirs; "They send", never "They sends"', () => {
    expect(pick(AGENDA)).toEqual([['seller', 'deliverable', 'You', 'Send Ben a one-page agenda for the walk']]);
    expect(pick("I'll send the dock map to Ann on Friday.")[0].slice(0, 3)).toEqual(['seller', 'deliverable', 'You']);
    expect(pick('We will send the pilot plan Monday.')[0].slice(0, 3)).toEqual(['seller', 'deliverable', 'You']);
    expect(pick('I owe Ben the detention numbers by Friday.')[0].slice(0, 3)).toEqual(['seller', 'deliverable', 'You']);
    expect(pick('Ben will send us the gate volumes next week.')).toEqual([['buyer', 'buyer_promise', 'Ben', 'Ben sends the gate volumes']]);
    expect(pick("They'll share the yard map on Friday.")).toEqual([['buyer', 'buyer_promise', null, 'They send the yard map']]);
    // A labelled buyer line stays theirs; the buyer's own message (opened from a reply) reads an unlabelled "I" as theirs.
    expect(pick("Maria: I'll send you our weekly gate volumes next week.")).toEqual([['buyer', 'buyer_promise', 'Maria', 'Maria sends our weekly gate volumes']]);
    expect(pick('I will send the volumes on Friday.', { firstPersonIsBuyer: true })).toEqual([['buyer', 'buyer_promise', null, 'They send the volumes']]);
    expect(commitmentTitle('buyer', 'the volumes', null, 'x')).toBe('They send the volumes');
  });

  it('recorded, it is the seller\'s deliverable: Work never says to chase the buyer, and the seller\'s choice of who owes it is the record', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT], personas: [{ id: 2, name: 'Ben Scratch', email: 'ben@kroger.example.com', account_name: ACCOUNT }] }, NOW);
    const p = db.client();
    const made = await createCapture(p, { accountName: ACCOUNT, personaId: 2, context: 'meeting', rawText: `${AGENDA}\nBen will send us the gate volumes on Friday.`, actor: 'casey@freightroll.com', now: NOW });
    if (!made.ok) throw new Error(made.reason);
    const [mine, theirs] = made.capture.commitments;
    expect([mine.owner, theirs.owner]).toEqual(['seller', 'buyer']);
    // The seller keeps their own promise as theirs, and changes the second to their own as well (the choice is the record).
    const r = await decideBatch(p, { captureId: made.capture.id, items: [{ candidateId: mine.id, decision: 'confirm' }, { candidateId: theirs.id, decision: 'confirm', owner: 'seller' }], actor: 'casey@freightroll.com', now: NOW });
    expect(r.ok).toBe(true);
    const all = await loadCommitments(db.client(), { accountNames: [ACCOUNT] });
    expect(all.map((c) => [c.kind, c.status, c.title, c.basis])).toEqual([
      ['deliverable', 'open', 'Send Ben a one-page agenda for the walk', `You: "${AGENDA}"`],
      ['deliverable', 'open', 'Send the gate volumes', 'You: "Ben will send us the gate volumes on Friday."'],
    ]);
    const day = workDay({ now: NOW, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, commitments: withPhases(all, NOW) as never });
    const text = JSON.stringify(day);
    expect(text).not.toMatch(/Chase it|promised it|has not arrived/);
    expect(text).toContain('Send Ben a one-page agenda for the walk');
  });

  it('the review shows who owes it as a choice, Me for the seller\'s own promise, and Them retitles an untouched title', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] }, NOW);
    const made = await createCapture(db.client(), { accountName: ACCOUNT, personaId: null, context: 'meeting', rawText: AGENDA, actor: 'casey@freightroll.com', now: NOW });
    if (!made.ok) throw new Error(made.reason);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    render(<CaptureFlow initial={made.capture} initialAccount={ACCOUNT} />);
    const item = screen.getByTestId('capture-commitment');
    expect((within(item).getByTestId('commitment-owner-seller') as HTMLInputElement).checked).toBe(true);
    expect(within(item).getByTestId('commitment-owner-line')).toHaveTextContent('You owe this');
    expect((within(item).getByTestId('commitment-title') as HTMLInputElement).value).toBe('Send Ben a one-page agenda for the walk');
    fireEvent.click(within(item).getByTestId('commitment-owner-buyer'));
    expect(within(item).getByTestId('commitment-owner-line')).toHaveTextContent('They owe this');
    expect((within(item).getByTestId('commitment-title') as HTMLInputElement).value).toBe('They send Ben a one-page agenda for the walk');
    vi.unstubAllGlobals();
  });
});
