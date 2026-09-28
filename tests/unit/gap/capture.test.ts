/**
 * Phase 2 D1-D4: buyer truth capture. The note is kept as written; candidates
 * are verbatim sentences with a proposed type; ONLY a human confirm records
 * Buyer Input Data (through the existing BID service), and only with a quote
 * that is verbatim in the note; unconfirmed candidates have zero effect.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const recordBid = vi.fn();
const recordDisposition = vi.fn();
vi.mock('@/lib/gap/bid/service', () => ({ recordBid: (...a: unknown[]) => recordBid(...a) }));
vi.mock('@/lib/gap/disposition/service', () => ({ recordDisposition: (...a: unknown[]) => recordDisposition(...a) }));

import { extractCandidates, quoteInSource, sentencesOf } from '@/lib/gap/capture/extract';
import { createCapture, decideCandidate, linkCapture, loadCapture, recordMeetingOutcome } from '@/lib/gap/capture/store';

const NOW = new Date('2026-09-28T18:00:00.000Z');
const NOTE = `Casey: How do you find trailers today?
Maria (VP DC Ops): Right now we walk the yard with a clipboard to find trailers.
Maria: We lose about 3 hours per shift hunting for trailers.
Maria: The detention charges from carriers are killing us.
Maria: Ideally we want the yard to tell the dock what is next.
Casey: Makes sense. Can we meet with your Kentucky team?
Maria: Sure, next week works.`;

function db() {
  const audit: any[] = [];
  const prisma: any = {
    gapAuditEvent: {
      create: vi.fn(async ({ data }: any) => { audit.push({ ...data, created_at: new Date(NOW.getTime() + audit.length) }); return { id: `a${audit.length}` }; }),
      findMany: vi.fn(async ({ where }: any) => audit.filter((r) => r.subject_type === where.subject_type && (where.subject_id ? r.subject_id === where.subject_id : true) && (where.kind ? r.kind === where.kind : true))),
    },
    account: { findUnique: vi.fn(async ({ where }: any) => (['PepsiCo', 'Kroger'].includes(where.name) ? { name: where.name } : null)) },
    persona: {
      findUnique: vi.fn(async ({ where }: any) => (where.id === 7 ? { id: 7, account_name: 'PepsiCo', email: 'maria@pepsico.com' } : where.id === 8 ? { id: 8, account_name: 'PepsiCo', email: 'bob@pepsico.com' } : where.id === 9 ? { id: 9, account_name: 'Kroger', email: 'k@kroger.com' } : null)),
      findFirst: vi.fn(async ({ where }: any) => (({ 'maria@pepsico.com': 'PepsiCo', 'bob@pepsico.com': 'PepsiCo', 'k@kroger.com': 'Kroger' } as Record<string, string>)[where.email.equals] === where.account_name ? { id: 1 } : null)),
    },
    prospectingHypothesis: { findUnique: vi.fn(async ({ where }: any) => (where.id === 'h-pep' ? { id: 'h-pep', account_name: 'PepsiCo' } : where.id === 'h-kr' ? { id: 'h-kr', account_name: 'Kroger' } : null)) },
  };
  return { prisma, audit };
}

beforeEach(() => {
  recordBid.mockReset();
  recordBid.mockResolvedValue({ ok: true, bidId: 'bid-1', humanConfirmed: true, supersedesId: null });
  recordDisposition.mockReset();
  recordDisposition.mockResolvedValue({ ok: true, dispositionId: 'disp-1', bidIds: [], humanConfirmed: true, effects: 'none', refusals: [] });
});

describe('extractCandidates', () => {
  it('proposes buyer sentences only (never the seller lines), cut verbatim from the note, with a proposed type and the cue words', () => {
    const c = extractCandidates(NOTE);
    expect(c.map((x) => [x.type, x.quote])).toEqual([
      ['root_cause', 'Right now we walk the yard with a clipboard to find trailers.'],
      ['metric', 'We lose about 3 hours per shift hunting for trailers.'],
      ['impact', 'The detention charges from carriers are killing us.'],
      ['future_state', 'Ideally we want the yard to tell the dock what is next.'],
    ]);
    for (const x of c) expect(NOTE.includes(x.quote)).toBe(true);
    expect(c.some((x) => /Kentucky|How do you find/.test(x.quote))).toBe(false);
  });

  it("the seller's own claims are never proposed as buyer truth, even when they sound like buyer data", () => {
    const text = ['Casey: Most yards we see lose 2 hours per shift to trailer hunting.', 'Me: The detention charges usually cost a DC a lot.', 'Maria: We lose about 3 hours per shift hunting for trailers.'].join('\n');
    expect(extractCandidates(text).map((c) => c.quote)).toEqual(['We lose about 3 hours per shift hunting for trailers.']);
  });

  it('quoteInSource tolerates whitespace and curly quotes, nothing else', () => {
    expect(quoteInSource('we  lose about 3 hours', NOTE)).toBe(true);
    expect(quoteInSource('We lose about 4 hours per shift', NOTE)).toBe(false);
    expect(sentencesOf('Short one.').length).toBe(0);
  });
});

describe('createCapture / linkCapture', () => {
  it('an unknown account stays UNLINKED with a hint (never guessed); the raw note is kept exactly', async () => {
    const { prisma } = db();
    const r = await createCapture(prisma, { accountHint: 'Pepsi bottler guy', context: 'conference', rawText: NOTE, actor: 'casey', now: NOW });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.capture).toMatchObject({ accountName: null, accountHint: 'Pepsi bottler guy', personaId: null, context: 'conference', rawText: NOTE });
    expect(r.capture.candidates.every((c) => c.decision === null)).toBe(true);
    const linked = await linkCapture(prisma, { captureId: r.capture.id, accountName: 'PepsiCo', actor: 'casey' });
    expect(linked).toMatchObject({ ok: true, capture: { accountName: 'PepsiCo' } });
  });

  it('refuses a person from another account, an empty note, and an unknown context', async () => {
    const { prisma } = db();
    expect(await createCapture(prisma, { accountName: 'PepsiCo', personaId: 9, context: 'meeting', rawText: NOTE, actor: 'c', now: NOW })).toMatchObject({ ok: false, reason: 'persona_not_at_account' });
    expect(await createCapture(prisma, { accountName: 'PepsiCo', context: 'meeting', rawText: '  ', actor: 'c', now: NOW })).toMatchObject({ ok: false, reason: 'empty_note' });
    expect(await createCapture(prisma, { accountName: 'PepsiCo', context: 'tiktok', rawText: NOTE, actor: 'c', now: NOW })).toMatchObject({ ok: false, reason: 'bad_context' });
  });
});

describe('decideCandidate: only a human confirm makes buyer truth', () => {
  async function saved() {
    const t = db();
    const r = await createCapture(t.prisma, { accountName: 'PepsiCo', personaId: 7, context: 'meeting', rawText: NOTE, actor: 'casey', now: NOW });
    if (!r.ok) throw new Error('seed');
    return { ...t, capture: r.capture };
  }

  it('unconfirmed candidates have ZERO effect: no BID, no disposition', async () => {
    await saved();
    expect(recordBid).not.toHaveBeenCalled();
    expect(recordDisposition).not.toHaveBeenCalled();
  });

  it('CONFIRM records a human-confirmed BID with the exact quote, the note as source, and the relabelled type', async () => {
    const { prisma, capture } = await saved();
    const c = capture.candidates[1];
    const r = await decideCandidate(prisma, { captureId: capture.id, candidateId: c.id, decision: 'confirm', type: 'impact', hypothesisId: 'h-pep', actor: 'casey@freightroll.com', now: NOW });
    expect(r).toMatchObject({ ok: true, bidId: 'bid-1' });
    expect(recordBid).toHaveBeenCalledWith(prisma, expect.objectContaining({ hypothesisId: 'h-pep', contactEmail: 'maria@pepsico.com', type: 'impact', rawBuyerLanguage: c.quote, source: 'meeting', actorKind: 'human', actor: 'casey@freightroll.com', metadata: expect.objectContaining({ captureId: capture.id, candidateId: c.id, proposedBy: 'machine', proposedType: 'metric' }) }));
    const again = await decideCandidate(prisma, { captureId: capture.id, candidateId: c.id, decision: 'confirm', hypothesisId: 'h-pep', actor: 'casey', now: NOW });
    expect(again).toMatchObject({ ok: false, reason: 'already_decided' });
    expect((await loadCapture(prisma, capture.id))!.candidates[1].decision).toMatchObject({ kind: 'confirmed', bidId: 'bid-1', type: 'impact' });
  });

  it('an edited quote that is not verbatim in the note can never be confirmed', async () => {
    const { prisma, capture } = await saved();
    const r = await decideCandidate(prisma, { captureId: capture.id, candidateId: capture.candidates[1].id, decision: 'confirm', quote: 'We lose about 5 hours per shift hunting for trailers.', hypothesisId: 'h-pep', actor: 'casey', now: NOW });
    expect(r).toMatchObject({ ok: false, reason: 'quote_not_in_source' });
    expect(recordBid).not.toHaveBeenCalled();
  });

  it('refuses a thesis at another account, an unlinked note, and a note with no known speaker', async () => {
    const { prisma, capture } = await saved();
    expect(await decideCandidate(prisma, { captureId: capture.id, candidateId: 'c1', decision: 'confirm', hypothesisId: 'h-kr', actor: 'c', now: NOW })).toMatchObject({ ok: false, reason: 'hypothesis_not_at_account' });
    const t = db();
    const un = await createCapture(t.prisma, { context: 'meeting', rawText: NOTE, actor: 'c', now: NOW });
    if (!un.ok) throw new Error('seed');
    expect(await decideCandidate(t.prisma, { captureId: un.capture.id, candidateId: 'c1', decision: 'confirm', hypothesisId: 'h-pep', actor: 'c', now: NOW })).toMatchObject({ ok: false, reason: 'capture_unlinked' });
    const noPerson = await createCapture(t.prisma, { accountName: 'PepsiCo', context: 'meeting', rawText: NOTE, actor: 'c', now: NOW });
    if (!noPerson.ok) throw new Error('seed');
    expect(await decideCandidate(t.prisma, { captureId: noPerson.capture.id, candidateId: 'c1', decision: 'confirm', hypothesisId: 'h-pep', actor: 'c', now: NOW })).toMatchObject({ ok: false, reason: 'no_contact' });
    expect(recordBid).not.toHaveBeenCalled();
  });

  it('REJECT records the rejection and no BID', async () => {
    const { prisma, capture } = await saved();
    expect(await decideCandidate(prisma, { captureId: capture.id, candidateId: 'c3', decision: 'reject', actor: 'casey', now: NOW })).toMatchObject({ ok: true, bidId: null });
    expect(recordBid).not.toHaveBeenCalled();
    expect((await loadCapture(prisma, capture.id))!.candidates[2].decision).toMatchObject({ kind: 'rejected' });
  });
});

describe('recordMeetingOutcome (D4)', () => {
  it('a qualified problem needs the buyer’s own words from the note; it records a meeting-channel disposition and the next learning objective', async () => {
    const t = db();
    const r = await createCapture(t.prisma, { accountName: 'PepsiCo', personaId: 7, context: 'meeting', rawText: NOTE, actor: 'casey', now: NOW });
    if (!r.ok) throw new Error('seed');
    expect(await recordMeetingOutcome(t.prisma, { captureId: r.capture.id, outcome: 'qualified_problem', hypothesisId: 'h-pep', actor: 'casey', now: NOW })).toMatchObject({ ok: false, reason: 'quote_required' });
    expect(await recordMeetingOutcome(t.prisma, { captureId: r.capture.id, outcome: 'qualified_problem', hypothesisId: 'h-pep', buyerQuote: 'We have no problems at all.', actor: 'casey', now: NOW })).toMatchObject({ ok: false, reason: 'quote_not_in_source' });
    const ok = await recordMeetingOutcome(t.prisma, { captureId: r.capture.id, outcome: 'qualified_problem', hypothesisId: 'h-pep', buyerQuote: 'The detention charges from carriers are killing us.', nextLearningObjective: 'Quantify detention cost at the Kentucky DC', actor: 'casey', now: NOW });
    expect(ok).toMatchObject({ ok: true, dispositionId: 'disp-1' });
    expect(recordDisposition).toHaveBeenCalledWith(t.prisma, expect.objectContaining({ channel: 'meeting', responseClass: 'problem_confirmed', contactEmail: 'maria@pepsico.com', source: { kind: 'meeting', id: r.capture.id }, actorKind: 'human', nextBestAction: 'Quantify detention cost at the Kentucky DC' }));
    if (ok.ok) expect(ok.capture.meetings[0]).toMatchObject({ outcome: 'qualified_problem', nextLearningObjective: 'Quantify detention cost at the Kentucky DC' });
  });

  it('a meeting existing is not success: no decision maps to no_signal, next meeting to meeting_accepted', async () => {
    const t = db();
    const r = await createCapture(t.prisma, { accountName: 'PepsiCo', personaId: 7, context: 'meeting', rawText: NOTE, actor: 'casey', now: NOW });
    if (!r.ok) throw new Error('seed');
    await recordMeetingOutcome(t.prisma, { captureId: r.capture.id, outcome: 'no_decision', hypothesisId: 'h-pep', actor: 'casey', now: NOW });
    expect(recordDisposition.mock.calls[0][1]).toMatchObject({ responseClass: 'no_signal', channel: 'meeting' });
  });
});

describe('review D P1: speakers and edited quotes', () => {
  const MULTI = ['Casey Larkin: Most yards we see lose 2 hours per shift to trailer hunting.', 'Jane Doe: We walk the yard with a clipboard to find trailers.', 'Bob Smith: The detention charges from carriers are killing us.'].join('\n');

  it('a full-name seller label is a seller line; each candidate keeps its speaker label', () => {
    const c = extractCandidates(MULTI);
    expect(c.map((x) => [x.speaker, x.quote])).toEqual([
      ['Jane Doe', 'We walk the yard with a clipboard to find trailers.'],
      ['Bob Smith', 'The detention charges from carriers are killing us.'],
    ]);
  });

  it('on a multi-speaker note the note person is never assumed: confirm needs an explicit speaker per line', async () => {
    const t = db();
    const r = await createCapture(t.prisma, { accountName: 'PepsiCo', personaId: 7, context: 'meeting', rawText: MULTI, actor: 'casey', now: NOW });
    if (!r.ok) throw new Error('seed');
    expect(await decideCandidate(t.prisma, { captureId: r.capture.id, candidateId: 'c2', decision: 'confirm', hypothesisId: 'h-pep', actor: 'casey', now: NOW })).toMatchObject({ ok: false, reason: 'speaker_required' });
    expect(recordBid).not.toHaveBeenCalled();
    expect(await decideCandidate(t.prisma, { captureId: r.capture.id, candidateId: 'c2', decision: 'confirm', hypothesisId: 'h-pep', personaId: 8, actor: 'casey', now: NOW })).toMatchObject({ ok: true });
    expect(recordBid.mock.calls[0][1]).toMatchObject({ contactEmail: 'bob@pepsico.com' });
  });

  it('an explicit contact email must be a person at this account', async () => {
    const t = db();
    const r = await createCapture(t.prisma, { accountName: 'PepsiCo', context: 'meeting', rawText: NOTE, actor: 'casey', now: NOW });
    if (!r.ok) throw new Error('seed');
    expect(await decideCandidate(t.prisma, { captureId: r.capture.id, candidateId: 'c1', decision: 'confirm', hypothesisId: 'h-pep', contactEmail: 'k@kroger.com', actor: 'casey', now: NOW })).toMatchObject({ ok: false, reason: 'contact_not_at_account' });
    expect(recordBid).not.toHaveBeenCalled();
  });

  it('an edited quote must stay inside its own sentence and keep four words', async () => {
    const t = db();
    const r = await createCapture(t.prisma, { accountName: 'PepsiCo', personaId: 7, context: 'meeting', rawText: NOTE, actor: 'casey', now: NOW });
    if (!r.ok) throw new Error('seed');
    const c2 = r.capture.candidates[1];
    expect(await decideCandidate(t.prisma, { captureId: r.capture.id, candidateId: c2.id, decision: 'confirm', quote: 'The detention charges from carriers are killing us.', hypothesisId: 'h-pep', actor: 'casey', now: NOW })).toMatchObject({ ok: false, reason: 'quote_not_in_source' });
    expect(await decideCandidate(t.prisma, { captureId: r.capture.id, candidateId: c2.id, decision: 'confirm', quote: '3 hours', hypothesisId: 'h-pep', actor: 'casey', now: NOW })).toMatchObject({ ok: false, reason: 'quote_not_in_source' });
    expect(await decideCandidate(t.prisma, { captureId: r.capture.id, candidateId: c2.id, decision: 'confirm', quote: 'We lose about 3 hours per shift', hypothesisId: 'h-pep', actor: 'casey', now: NOW })).toMatchObject({ ok: true });
  });
});


describe('final review P1: a qualified problem is the BUYER’s words', () => {
  it('a line the seller said never qualifies a problem, even though it is in the note', async () => {
    const t = db();
    const r = await createCapture(t.prisma, { accountName: 'PepsiCo', personaId: 7, context: 'meeting', rawText: 'Casey: So dwell time is really what is hurting you here.\nMaria: We walk the yard with a clipboard every morning.', actor: 'casey', now: NOW });
    if (!r.ok) throw new Error('seed');
    expect(await recordMeetingOutcome(t.prisma, { captureId: r.capture.id, outcome: 'qualified_problem', hypothesisId: 'h-pep', buyerQuote: 'So dwell time is really what is hurting you here.', actor: 'casey', now: NOW })).toMatchObject({ ok: false, reason: 'quote_not_in_source' });
  });

  it('with two buyer speakers, Casey says who said it', async () => {
    const t = db();
    const note = 'Maria: The detention charges from carriers are killing us.\nBo: Our gate backs up every single Monday morning.';
    const r = await createCapture(t.prisma, { accountName: 'PepsiCo', personaId: 7, context: 'meeting', rawText: note, actor: 'casey', now: NOW });
    if (!r.ok) throw new Error('seed');
    expect(await recordMeetingOutcome(t.prisma, { captureId: r.capture.id, outcome: 'qualified_problem', hypothesisId: 'h-pep', buyerQuote: 'Our gate backs up every single Monday morning.', actor: 'casey', now: NOW })).toMatchObject({ ok: false, reason: 'speaker_required' });
    expect(await recordMeetingOutcome(t.prisma, { captureId: r.capture.id, outcome: 'qualified_problem', hypothesisId: 'h-pep', personaId: 7, buyerQuote: 'The detention charges from carriers are killing us.', actor: 'casey', now: NOW })).toMatchObject({ ok: true });
  });
});
