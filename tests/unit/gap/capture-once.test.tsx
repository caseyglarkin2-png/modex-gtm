/**
 * R44 (GAP OS execution recovery): capture a conversation once. The raw note is kept verbatim with its source; the
 * account, person and deal come from the action that opened Capture; buyer statements, dates and obligations are
 * proposed with the right speaker (the seller's own read and a pasted summary are never buyer words); ONE review
 * confirms all, corrects one and rejects one; a confirmed obligation becomes a commitment. Dictation stays off.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const recordBid = vi.fn();
vi.mock('@/lib/gap/bid/service', () => ({ recordBid: (...a: unknown[]) => recordBid(...a) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams('') }));

import { excludedLines, extractCandidates, extractCommitments } from '@/lib/gap/capture/extract';
import { createCapture, decideBatch, loadCapture } from '@/lib/gap/capture/store';
import { loadCommitments } from '@/lib/gap/work/commitments';
import { CaptureFlow } from '@/components/gap/capture-flow';
import { workDay } from '@/lib/gap/work/list';
import { ledgerDb } from './fixtures/ledger-db';

const SAVED = new Date('2026-10-07T03:30:00Z'); // Tue Oct 6, 11:30 pm New York: "Friday" is Oct 9, never Oct 10
const NOTE = `Casey: How do trailers move at the Tulsa DC today?
Maria (VP DC Ops): We lose about 3 hours per shift hunting for trailers.
Maria: Can you send me the dock schedule template by Friday?
Maria: I'll send you our weekly gate volumes next week.
Casey: I'll send the pilot plan Monday.
Bob (Site GM): The detention charges from carriers are killing us at the gate.
I think they are underreporting the detention.
Summary:
- They lose 3 hours per shift.
- They want a pilot.

Maria: Let's meet on Oct 20 with the Kentucky team.`;

beforeEach(() => {
  recordBid.mockReset();
  recordBid.mockImplementation(async (_p: unknown, x: { rawBuyerLanguage: string }) => ({ ok: true, bidId: `bid:${x.rawBuyerLanguage.slice(0, 12)}`, humanConfirmed: true, supersedesId: null }));
});

describe('statements, dates and obligations with the right speaker (R44)', () => {
  it('a buyer ask is the seller\'s deliverable, a seller promise is the seller\'s own words, a buyer promise waits on them, a named meeting is prepared; the day is New York from when the note was saved', () => {
    const ks = extractCommitments(NOTE, SAVED);
    expect(ks.map((k) => [k.id, k.speaker, k.owner, k.kind, k.title, k.due?.day ?? null])).toEqual([
      ['k1', 'Maria', 'seller', 'deliverable', 'Send Maria the dock schedule template', '2026-10-09'],
      ['k2', 'Maria', 'buyer', 'buyer_promise', 'Maria sends our weekly gate volumes', '2026-10-12'],
      ['k3', 'You', 'seller', 'deliverable', 'Send the pilot plan', '2026-10-12'],
      ['k4', 'Maria', 'seller', 'prepare_meeting', 'Prepare the meeting (Oct 20)', '2026-10-20'],
    ]);
  });
  it('the seller\'s own read and a pasted summary are never proposed as buyer words; a labelled buyer line is', () => {
    const quotes = extractCandidates(NOTE).map((c) => c.quote);
    expect(quotes).not.toContain('I think they are underreporting the detention.');
    expect(quotes).not.toContain('They lose 3 hours per shift.');
    expect(quotes).toContain('We lose about 3 hours per shift hunting for trailers.');
    expect(quotes).toContain('The detention charges from carriers are killing us at the gate.');
    expect(excludedLines(NOTE)).toEqual([
      { text: 'I think they are underreporting the detention.', reason: 'Your own read, not their words' },
      { text: 'They lose 3 hours per shift.', reason: 'A summary, not their words' },
      { text: 'They want a pilot.', reason: 'A summary, not their words' },
    ]);
    // A seller line that sounds like buyer data is still the seller's: never a statement candidate.
    expect(extractCandidates('Casey: We lose about 3 hours per shift at sites like yours.\nMaria: We lose about 3 hours per shift at the gate.').map((c) => c.speaker)).toEqual(['Maria']);
    // A buyer saying "I think" is still the buyer's words.
    expect(extractCandidates('Maria: I think the gate is our biggest bottleneck.').map((c) => c.speaker)).toEqual(['Maria']);
  });
});

describe('one review of the whole note (R44)', () => {
  const seed = () =>
    ledgerDb({
      accounts: ['Pepsi Scratch Co'],
      personas: [
        { id: 7, name: 'Maria Scratch', email: 'maria@pepsi.example.com', account_name: 'Pepsi Scratch Co' },
        { id: 8, name: 'Bob Scratch', email: 'bob@pepsi.example.com', account_name: 'Pepsi Scratch Co' },
      ],
      hypotheses: [{ id: 'h-pep', account_name: 'Pepsi Scratch Co' }],
    });

  it('the note keeps its source, the deal and the person from the action that opened Capture, verbatim', async () => {
    const d = seed();
    const p = d.client();
    const r = await createCapture(p, { accountName: 'Pepsi Scratch Co', personaId: 7, dealId: 'Pepsi yard pilot', source: { kind: 'reply', id: 'gm-1' }, context: 'call', rawText: NOTE, actor: 'casey@freightroll.com', now: SAVED });
    expect(r.ok).toBe(true);
    const view = r.ok ? r.capture : null;
    expect(view).toMatchObject({ accountName: 'Pepsi Scratch Co', personaId: 7, dealId: 'Pepsi yard pilot', source: { kind: 'reply', id: 'gm-1' }, rawText: NOTE });
    expect(view?.commitments.map((k) => k.id)).toEqual(['k1', 'k2', 'k3', 'k4']);
    expect(view?.excluded).toHaveLength(3);
    // An unknown source kind is dropped, never trusted.
    const odd = await createCapture(p, { accountName: 'Pepsi Scratch Co', source: { kind: 'anything', id: 'x' }, context: 'call', rawText: 'Maria: We lose trailers every day at the gate.', actor: 'c', now: SAVED });
    expect(odd.ok && odd.capture.source).toBeNull();
  });

  it('confirm all, correct one, reject one, in ONE press: each item through its own decision, a confirmed obligation becomes a commitment, a second press records nothing twice', async () => {
    const d = seed();
    const p = d.client();
    const made = await createCapture(p, { accountName: 'Pepsi Scratch Co', personaId: 7, dealId: 'Pepsi yard pilot', source: { kind: 'work', id: 'Pepsi Scratch Co' }, context: 'call', rawText: NOTE, actor: 'casey@freightroll.com', now: SAVED });
    const capture = made.ok ? made.capture : null;
    // The statements: only sentences that carry a buyer-truth cue (the asks and the promises are obligations, below).
    const [lose, detention] = capture!.candidates;
    expect(capture!.candidates.map((c) => c.speaker)).toEqual(['Maria (VP DC Ops)', 'Bob (Site GM)']);
    const now = new Date('2026-10-07T13:00:00Z');
    const r = await decideBatch(p, {
      captureId: capture!.id,
      hypothesisId: 'h-pep',
      actor: 'casey@freightroll.com',
      now,
      items: [
        // Correct one: a shorter quote, still inside its sentence; Maria said it.
        { candidateId: lose.id, decision: 'confirm', quote: 'We lose about 3 hours per shift', personaId: 7 },
        // Bob said this one (two buyer speakers: the speaker is the seller's explicit choice).
        { candidateId: detention.id, decision: 'confirm', type: 'impact', personaId: 8 },
        // The obligation, with a corrected title and day.
        { candidateId: 'k1', decision: 'confirm', title: 'Send Maria the dock schedule template and the Tulsa sketch', dueDay: '2026-10-08', personaId: 7 },
        { candidateId: 'k2', decision: 'confirm', personaId: 7 },
        { candidateId: 'k3', decision: 'reject' },
        { candidateId: 'k4', decision: 'confirm' },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.results.map((x) => [x.candidateId, x.ok])).toEqual([[lose.id, true], [detention.id, true], ['k1', true], ['k2', true], ['k3', true], ['k4', true]]);
    expect(recordBid.mock.calls.map((c) => [c[1].rawBuyerLanguage, c[1].contactEmail, c[1].type])).toEqual([
      ['We lose about 3 hours per shift', 'maria@pepsi.example.com', lose.type],
      ['The detention charges from carriers are killing us at the gate.', 'bob@pepsi.example.com', 'impact'],
    ]);
    const owed = await loadCommitments(p, { accountNames: ['Pepsi Scratch Co'] });
    expect(owed.map((c) => [c.kind, c.title, c.status, c.dueAt, c.dealId, c.basis])).toEqual([
      ['deliverable', 'Send Maria the dock schedule template and the Tulsa sketch', 'open', '2026-10-08T13:00:00.000Z', 'Pepsi yard pilot', 'Maria: "Can you send me the dock schedule template by Friday?"'],
      ['buyer_promise', 'Maria sends our weekly gate volumes', 'waiting', '2026-10-12T13:00:00.000Z', 'Pepsi yard pilot', 'Maria: "I\'ll send you our weekly gate volumes next week."'],
      ['prepare_meeting', 'Prepare the meeting (Oct 20)', 'open', '2026-10-20T13:00:00.000Z', 'Pepsi yard pilot', 'Maria: "Let\'s meet on Oct 20 with the Kentucky team."'],
    ]);
    expect(owed[0].source).toEqual({ kind: 'capture', id: `${capture!.id}:k1` });
    const view = await loadCapture(p, capture!.id);
    expect(view?.commitments.map((k) => k.decision?.kind)).toEqual(['confirmed', 'confirmed', 'rejected', 'confirmed']);
    expect(view?.candidates.map((k) => k.decision?.kind)).toEqual(['confirmed', 'confirmed']);
    // The same press again records nothing twice.
    const again = await decideBatch(p, { captureId: capture!.id, hypothesisId: 'h-pep', actor: 'c', now, items: [{ candidateId: 'k1', decision: 'confirm' }, { candidateId: lose.id, decision: 'confirm', personaId: 7 }] });
    expect(again.ok && again.results.map((x) => [x.ok, x.reason])).toEqual([[false, 'already_decided'], [false, 'already_decided']]);
    expect((await loadCommitments(p, { accountNames: ['Pepsi Scratch Co'] })).length).toBe(3);
    expect(recordBid).toHaveBeenCalledTimes(2);
  });

  it('one refused item never blocks the others, and says why; a seller promise is recorded in the seller\'s own words, never as a buyer quote', async () => {
    const d = seed();
    const p = d.client();
    const made = await createCapture(p, { accountName: 'Pepsi Scratch Co', context: 'meeting', rawText: NOTE, actor: 'c', now: SAVED });
    const capture = made.ok ? made.capture : null;
    const r = await decideBatch(p, { captureId: capture!.id, hypothesisId: 'h-pep', actor: 'c', now: SAVED, items: [{ candidateId: capture!.candidates[0].id, decision: 'confirm' }, { candidateId: 'k3', decision: 'confirm' }] });
    expect(r.ok && r.results.map((x) => [x.candidateId, x.ok, x.reason ?? null])).toEqual([[capture!.candidates[0].id, false, 'speaker_required'], ['k3', true, null]]);
    const [mine] = await loadCommitments(p, { accountNames: ['Pepsi Scratch Co'] });
    expect(mine).toMatchObject({ kind: 'deliverable', title: 'Send the pilot plan', basis: 'You: "I\'ll send the pilot plan Monday."' });
    expect(recordBid).not.toHaveBeenCalled();
  });
});

describe('Capture is opened from the action, already filled in (R44)', () => {
  it('a reply card opens it as an email with the person who wrote and the reply as its source; a deal card carries its deal; a meeting opens it as a meeting', () => {
    const NOW = new Date('2026-10-06T15:00:00Z');
    const day = workDay({
      now: NOW,
      candidates: [],
      motions: [],
      held: new Map(),
      inDeals: { status: 'complete', accounts: [{ accountName: 'Kroger Scratch Co', deals: [{ name: 'Kroger yard pilot', stage: 'Proposal' }] }] },
      replies: [{ accountName: 'Nfi Scratch Co', contactEmail: 'ann@nfi.example.com', subject: 'Re', snippet: 'Thursday works for a call.', receivedAt: '2026-10-06T13:00:00Z', id: 'gm-1', personaId: 41 }],
      meetings: [{ accountName: 'Meet Co', at: '2026-10-07T14:00:00Z', what: 'Pilot scoping' }],
    });
    const by = (n: string) => day.cards.find((c) => c.accountName === n)!.capture!;
    // R60, capture once: the reply card's ONE entry is its next move into Capture; no second capture link.
    const nfi = day.cards.find((c) => c.accountName === 'Nfi Scratch Co')!;
    expect(nfi.next).toEqual({ label: 'Log what they said', href: '/gap/capture?account=Nfi+Scratch+Co&person=41&context=email&from=reply%3Agm-1' });
    expect(nfi.capture).toBeNull();
    expect(nfi.reply?.record).toBeNull();
    expect(by('Kroger Scratch Co')).toEqual({ label: 'Log a conversation', href: '/gap/capture?account=Kroger+Scratch+Co&deal=Kroger+yard+pilot&from=work%3AKroger+Scratch+Co' });
    expect(by('Meet Co')).toEqual({ label: 'Log the meeting', href: '/gap/capture?account=Meet+Co&context=meeting&from=meeting%3AMeet+Co' });
  });
});

describe('the capture screen (R44)', () => {
  it('opened from a Work card: the account, person, deal and source are filled in and saved with the note; dictation stays off (a press records nothing)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      if (u.startsWith('/api/gap/capture/lookup')) return new Response(JSON.stringify({ people: [{ id: 7, name: 'Maria Scratch', title: 'VP DC Ops' }], hypotheses: [] }), { status: 200 });
      return new Response(JSON.stringify({ id: 'c1', accountName: 'Pepsi Scratch Co', personaId: 7, candidates: [], commitments: [], excluded: [], meetings: [], rawText: 'x', context: 'email', dealId: 'Pepsi yard pilot', source: { kind: 'reply', id: 'gm-1' } }), { status: 201 });
    });
    render(<CaptureFlow initialAccount="Pepsi Scratch Co" initialPersona={{ id: 7, name: 'Maria Scratch' }} initialDeal="Pepsi yard pilot" initialContext="email" source={{ kind: 'reply', id: 'gm-1' }} />);
    expect(screen.getByTestId('capture-deal')).toHaveTextContent('Deal: Pepsi yard pilot');
    expect(screen.getByTestId('capture-source')).toHaveTextContent('Opened from a reply');
    expect(screen.getByRole('radio', { name: 'Email' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByTestId('dictate-start'));
    expect(fetchSpy.mock.calls.some(([u]) => /transcribe|voice/.test(String(u)))).toBe(false);
    fireEvent.change(screen.getByTestId('capture-text'), { target: { value: 'Maria: Can you send me the template by Friday?' } });
    fireEvent.click(screen.getByTestId('capture-save'));
    await screen.findByTestId('capture-review');
    const save = fetchSpy.mock.calls.find(([u]) => String(u) === '/api/gap/captures')!;
    expect(JSON.parse(String((save[1] as RequestInit).body))).toEqual({ accountName: 'Pepsi Scratch Co', accountHint: null, personaId: 7, context: 'email', rawText: 'Maria: Can you send me the template by Friday?', dealId: 'Pepsi yard pilot', source: { kind: 'reply', id: 'gm-1' } });
    fetchSpy.mockRestore();
  });
});
