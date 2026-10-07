/**
 * R60, capture once on a reply (the lead's decision 1). A reply is logged in ONE place: Work's reply card offers only
 * "Log what they said", which opens Capture prefilled with the reply (account, person, the replier's deal, the
 * message as the source); Capture proposes what the reply means as one more confirmable item in its single review, so
 * confirming records the disposition and the buyer's words in one pass. The disposition service and the BID human
 * confirmation still do the writes (mocked here at their boundary, counted exactly). The account page offers no second
 * form for that reply.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const recordBid = vi.fn();
const recordDisposition = vi.fn();
const loadReplyForCapture = vi.fn();
vi.mock('@/lib/gap/bid/service', () => ({ recordBid: (...a: unknown[]) => recordBid(...a) }));
vi.mock('@/lib/gap/disposition/service', () => ({ recordDisposition: (...a: unknown[]) => recordDisposition(...a) }));
vi.mock('@/lib/gap/replies/list', () => ({ loadReplyForCapture: (...a: unknown[]) => loadReplyForCapture(...a) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams('') }));

import { createCapture, decideBatch } from '@/lib/gap/capture/store';
import { CaptureFlow } from '@/components/gap/capture-flow';
import { AccountReplies } from '@/components/gap/account-replies';

const NOW = new Date('2026-10-07T15:00:00.000Z');
const REPLY_TEXT = 'Hi Casey,\n\nThanks for the note. We lose about 3 hours per shift hunting for trailers at the Columbus gate. The detention charges from carriers are killing us. Can you send the case study by Friday?\n\nAnn';
const replyItem = (snippet = REPLY_TEXT) => ({
  item: { id: 'gm-1', source: { kind: 'inbound_message', id: 'gm-1' }, contactEmail: 'ann@kroger.example.com', personaId: 7, accountName: 'Kroger Scratch Co', hypothesisId: 'h-kr', hypothesisTitle: 'gate congestion', subject: 'Re: trailer turns', snippet, receivedAt: '2026-10-07T12:00:00.000Z', enrollmentId: null, enrollmentStatus: null, suggestion: null, fromName: 'Ann Scratch' },
  text: snippet,
  dispositionId: null as string | null,
});

function db() {
  const audit: Array<Record<string, unknown>> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    gapAuditEvent: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        audit.push({ ...data, created_at: new Date(NOW.getTime() + audit.length) });
        return { id: `a${audit.length}` };
      }),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => audit.filter((r) => r.subject_type === where.subject_type && (where.subject_id ? r.subject_id === where.subject_id : true) && (where.kind ? r.kind === where.kind : true))),
    },
    account: { findUnique: vi.fn(async ({ where }: { where: { name: string } }) => (where.name === 'Kroger Scratch Co' ? { name: where.name } : null)) },
    persona: {
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) => (where.id === 7 ? { id: 7, account_name: 'Kroger Scratch Co', email: 'ann@kroger.example.com', name: 'Ann Scratch' } : null)),
      findFirst: vi.fn(async () => null),
    },
    prospectingHypothesis: { findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (where.id === 'h-kr' ? { id: 'h-kr', account_name: 'Kroger Scratch Co' } : null)) },
  };
  return { prisma, audit };
}

const open = async (prisma: unknown) => {
  const r = await createCapture(prisma, { accountName: 'Kroger Scratch Co', personaId: 7, dealId: '392057001', dealName: 'YardFlow - Kroger Scratch Co', source: { kind: 'reply', id: 'gm-1' }, context: 'email', rawText: REPLY_TEXT, actor: 'casey@freightroll.com', now: NOW });
  if (!r.ok) throw new Error(r.reason);
  return r.capture;
};

beforeEach(() => {
  recordBid.mockReset();
  let n = 0;
  recordBid.mockImplementation(async () => ({ ok: true, bidId: `bid-${(n += 1)}`, humanConfirmed: true, supersedesId: null }));
  recordDisposition.mockReset();
  recordDisposition.mockResolvedValue({ ok: true, dispositionId: 'disp-1', bidIds: [], humanConfirmed: true, effects: 'none', refusals: [] });
  loadReplyForCapture.mockReset();
  loadReplyForCapture.mockResolvedValue(replyItem());
});
afterEach(() => vi.unstubAllGlobals());

describe('R60: a reply logged through Capture is recorded once', () => {
  it('the note carries the reply: its source, thesis and person; what it means is for the seller to choose (a plain reply proposes nothing)', async () => {
    const { prisma } = db();
    const c = await open(prisma);
    expect(c.reply).toMatchObject({ id: 'gm-1', sourceKind: 'inbound_message', hypothesisId: 'h-kr', personaId: 7, contactEmail: 'ann@kroger.example.com', from: 'Ann Scratch', proposedClass: null, decision: null });
    expect(c.candidates.map((x) => x.quote)).toEqual(['We lose about 3 hours per shift hunting for trailers at the Columbus gate.', 'The detention charges from carriers are killing us.']);
  });

  it('ONE review: exactly one disposition (the reply as its source, the chosen class, their kept words) and its confirmed BIDs linked to it; a second press writes nothing', async () => {
    const { prisma } = db();
    const c = await open(prisma);
    const items = [
      { candidateId: 'reply', decision: 'confirm' as const, responseClass: 'problem_confirmed' },
      { candidateId: 'c1', decision: 'confirm' as const },
      { candidateId: 'c2', decision: 'confirm' as const },
    ];
    const r = await decideBatch(prisma, { captureId: c.id, items, actor: 'casey@freightroll.com', now: NOW });
    expect(r.ok).toBe(true);
    expect(recordDisposition).toHaveBeenCalledTimes(1);
    expect(recordDisposition.mock.calls[0][1]).toMatchObject({ hypothesisId: 'h-kr', personaId: 7, contactEmail: 'ann@kroger.example.com', channel: 'email', responseClass: 'problem_confirmed', buyerLanguage: 'We lose about 3 hours per shift hunting for trailers at the Columbus gate.', source: { kind: 'inbound_message', id: 'gm-1' }, actorKind: 'human' });
    expect(recordBid).toHaveBeenCalledTimes(2);
    for (const call of recordBid.mock.calls) expect(call[1]).toMatchObject({ hypothesisId: 'h-kr', dispositionId: 'disp-1', contactEmail: 'ann@kroger.example.com', actorKind: 'human', metadata: { replyId: 'gm-1', scope: { dealId: '392057001' } } });
    expect(r.ok && r.capture.reply?.decision).toMatchObject({ kind: 'confirmed', dispositionId: 'disp-1', responseClass: 'problem_confirmed', before: false });
    const again = await decideBatch(prisma, { captureId: c.id, items, actor: 'casey@freightroll.com', now: NOW });
    expect(again.ok && again.results.map((x) => [x.candidateId, x.ok, x.reason])).toEqual([['reply', false, 'already_decided'], ['c1', false, 'already_decided'], ['c2', false, 'already_decided']]);
    expect(recordDisposition).toHaveBeenCalledTimes(1);
    expect(recordBid).toHaveBeenCalledTimes(2);
  });

  it('a disposition already on record for the reply is never written twice: the note says it was recorded before', async () => {
    const { prisma } = db();
    recordDisposition.mockResolvedValueOnce({ ok: false, kind: 'refused', reason: 'duplicate_source', existingId: 'disp-earlier' });
    const c = await open(prisma);
    const r = await decideBatch(prisma, { captureId: c.id, items: [{ candidateId: 'reply', decision: 'confirm', responseClass: 'request_information' }, { candidateId: 'c1', decision: 'confirm' }], actor: 'casey@freightroll.com', now: NOW });
    expect(r.ok && r.capture.reply?.decision).toMatchObject({ kind: 'confirmed', dispositionId: 'disp-earlier', before: true });
    expect(recordBid.mock.calls[0][1]).toMatchObject({ dispositionId: 'disp-earlier' });
    // Opened again on a reply already recorded: shown as recorded, nothing offered to record twice.
    loadReplyForCapture.mockResolvedValueOnce({ ...replyItem(), dispositionId: 'disp-earlier' });
    expect((await open(prisma)).reply?.decision).toMatchObject({ kind: 'confirmed', dispositionId: 'disp-earlier', before: true });
  });

  it('the class is the seller\'s to choose, and a class that needs their words needs a kept statement; nothing is written without them', async () => {
    const { prisma } = db();
    const c = await open(prisma);
    const none = await decideBatch(prisma, { captureId: c.id, items: [{ candidateId: 'reply', decision: 'confirm' }], actor: 'casey@freightroll.com', now: NOW });
    expect(none.ok && none.results[0]).toMatchObject({ ok: false, reason: 'reply_kind_required' });
    const noWords = await decideBatch(prisma, { captureId: c.id, items: [{ candidateId: 'reply', decision: 'confirm', responseClass: 'problem_confirmed' }, { candidateId: 'c1', decision: 'reject' }], actor: 'casey@freightroll.com', now: NOW });
    expect(noWords.ok && noWords.results[0]).toMatchObject({ ok: false, reason: 'quote_required' });
    expect(recordDisposition).not.toHaveBeenCalled();
  });

  it('an opt-out is proposed as do not contact from the message itself; the seller confirms it in the same review', async () => {
    const { prisma } = db();
    loadReplyForCapture.mockResolvedValue(replyItem('stop'));
    const r = await createCapture(prisma, { accountName: 'Kroger Scratch Co', personaId: 7, source: { kind: 'reply', id: 'gm-1' }, context: 'email', rawText: 'stop', actor: 'casey@freightroll.com', now: NOW });
    expect(r.ok && r.capture.reply?.proposedClass).toBe('do_not_contact');
    const d = await decideBatch(prisma, { captureId: r.ok ? r.capture.id : '', items: [{ candidateId: 'reply', decision: 'confirm', responseClass: 'do_not_contact' }], actor: 'casey@freightroll.com', now: NOW });
    expect(d.ok && d.results).toEqual([{ candidateId: 'reply', ok: true, dispositionId: 'disp-1' }]);
    expect(recordDisposition.mock.calls[0][1]).toMatchObject({ responseClass: 'do_not_contact', buyerLanguage: null });
  });

  it('a reply GAP cannot read here keeps the note and says so; nothing about the reply is recorded from it', async () => {
    const { prisma } = db();
    loadReplyForCapture.mockResolvedValue(null);
    const c = await open(prisma);
    expect(c.reply).toBeNull();
    expect(c.source).toEqual({ kind: 'reply', id: 'gm-1' });
  });
});

describe('R60: the seller sees one place to record a reply', () => {
  it('Capture opened on a reply starts with the reply, shows what it means beside their words, and records only once the class is chosen', async () => {
    const { prisma } = db();
    const c = await open(prisma);
    const fetch = vi.fn(async () => new Response(JSON.stringify({ results: [], capture: c }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    render(<CaptureFlow initial={c} initialAccount="Kroger Scratch Co" />);
    const item = screen.getByTestId('capture-reply-kind');
    expect(item).toHaveTextContent("What Ann Scratch's reply means");
    const submit = screen.getByTestId('capture-batch-submit');
    expect(submit).toBeDisabled();
    expect(screen.getByTestId('capture-reply-choose')).toHaveTextContent('Choose what the reply means first.');
    fireEvent.change(within(item).getByTestId('capture-reply-class'), { target: { value: 'request_information' } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() => expect(fetch.mock.calls.some((x) => String((x as unknown as [string])[0]).includes(`/api/gap/captures/${c.id}`))).toBe(true));
    const sent = fetch.mock.calls.map((x) => JSON.parse(String((x as unknown as [string, { body?: string }])[1]?.body ?? '{}'))).find((b) => b.op === 'batch');
    expect(sent.items[0]).toEqual({ candidateId: 'reply', decision: 'confirm', responseClass: 'request_information' });
    expect(sent.items.filter((x: { candidateId: string }) => x.candidateId === 'reply')).toHaveLength(1);
  });

  it('a note opened from a reply starts as that reply', () => {
    render(<CaptureFlow initialAccount="Kroger Scratch Co" initialContext="email" initialText={REPLY_TEXT} source={{ kind: 'reply', id: 'gm-1' }} />);
    expect((screen.getByTestId('capture-text') as HTMLTextAreaElement).value).toBe(REPLY_TEXT);
  });

  it('the account page lists the waiting reply with one link into Capture and no form of its own', () => {
    render(<AccountReplies accountName="Kroger Scratch Co" items={[{ id: 'gm-1', from: 'Ann Scratch', receivedAt: '2026-10-07T12:00:00.000Z', snippet: 'Can you send the case study by Friday?', href: '/gap/capture?account=Kroger+Scratch+Co&person=7&context=email&from=reply%3Agm-1', label: 'Log what they said' }]} />);
    const row = screen.getByTestId('account-reply');
    expect(within(row).getByTestId('account-reply-log')).toHaveAttribute('href', '/gap/capture?account=Kroger+Scratch+Co&person=7&context=email&from=reply%3Agm-1');
    expect(document.querySelectorAll('form, input, select, textarea, button')).toHaveLength(0);
    const page = readFileSync('src/app/gap/accounts/[slug]/page.tsx', 'utf8');
    expect(page).not.toMatch(/RepliesTriage|DispositionForm/);
  });
});
