/**
 * R42b (GAP OS execution recovery): the prepared, editable answer to a buyer's reply. What they asked is read from the
 * actual message; the answer cites only what GAP holds (the account's materials; beside it the buyer's confirmed words,
 * the fact the conversation started from, the last touch) and lists everything else as missing information with a
 * placeholder in the text. GAP never invents a price, availability, an attachment, a commitment or buyer agreement.
 * A referral or an opt-out prepares no reply (an opt-out stops everything). Copying, a Gmail draft and a send are three
 * distinct ledger states; the send goes only through the seller-send preview and CONFIRM + SEND with its gates.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { prepareAnswer, readAsks, unfilledPlaceholders, type AnswerInput } from '@/lib/gap/replies/answer';
import { bodyRefusal, createSellerReplyDraft, loadReplyContext, prepareSellerReply, recordReplyCopied } from '@/lib/gap/execution/seller-reply';
import { sendSellerReply } from '@/lib/gap/execution/seller-send';
import { REPLY_COPIED, REPLY_DRAFTED, REPLY_SENT } from '@/lib/gap/execution/draft-ledger';
import { ReplyAnswer } from '@/components/gap/reply-answer';
import { ledgerDb } from './fixtures/ledger-db';
import { auth } from '@/lib/auth';

const holder = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return holder.client; } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const NOW = new Date('2026-10-06T19:00:00Z');
const ACTOR = 'casey@freightroll.com';
const ACCOUNT = 'Nfi Scratch Co';
const ANN = 'ann@nfi.example.com';
const SENDER = { serviceAccountJson: '{}', userEmail: 'casey@yardflow.ai', displayName: 'Casey Larkin' };

const answerInput = (text: string, over: Partial<AnswerInput> = {}): AnswerInput => ({ messageText: text, subject: 'Re: trailer turns at your sites', from: ANN, fromName: 'Ann Scratch', now: NOW, materials: [], confirmed: [], story: null, lastTouch: null, dependency: null, ...over });

describe('what they asked, and an answer that invents nothing (R42b)', () => {
  it('every ask is read from their words with its topic', () => {
    expect(readAsks('Thanks Casey. What would this cost per site? Can you send the two-site comparison by Friday? Are you free Thursday for a call?', NOW).map((a) => [a.topic, a.thing, a.day?.day ?? null])).toEqual([
      ['pricing', null, null],
      ['material', 'the two-site comparison', '2026-10-09'],
      ['availability', null, '2026-10-08'],
    ]);
  });

  it('planted asks for a price, a time, an attachment GAP lacks, a security answer, a commitment and buyer agreement: no value is fabricated; each is missing information and a placeholder', () => {
    const text = 'Thanks for the note. What would this cost per site? Are you free Thursday at 2pm for a call? Can you send the two-site comparison? Has your security team finished a SOC 2 audit? Can you guarantee it goes live by March? Can you confirm we agreed to a pilot?';
    const a = prepareAnswer(answerInput(text));
    expect(a.status).toBe('ready');
    expect(a.asks.map((x) => x.topic)).toEqual(['pricing', 'availability', 'material', 'security_legal', 'commitment', 'question']);
    expect(a.missing).toEqual([
      'Pricing ("What would this cost per site?"): GAP holds no price for them; you decide what to quote.',
      'Your availability ("Are you free Thursday at 2pm for a call?"): GAP does not know your calendar; they named Thursday.',
      'The two-site comparison ("Can you send the two-site comparison?"): GAP holds no such material; attach it yourself or say when it will come.',
      'Security, legal or contract ("Has your security team finished a SOC 2 audit?"): GAP records no such answer or approval.',
      'Timing or a commitment ("Can you guarantee it goes live by March?"): GAP never promises a date or an outcome for you.',
      'Your answer to "Can you confirm we agreed to a pilot?".',
    ]);
    expect(unfilledPlaceholders(a.body)).toHaveLength(6);
    // Outside its placeholders the prepared text asserts nothing: no price, no time, no attachment, no commitment, no agreement.
    const asserted = a.body.replace(/\[Fill in:[^\]]*\]/g, '');
    expect(asserted).not.toMatch(/\$|\d|\bam\b|\bpm\b|attach|available|guarantee|agree|confirm|approved|live by|soc/i);
    expect(asserted.trim()).toBe('Hi Ann,\n\nThanks for getting back to me.');
    // And it can never leave as written: the placeholders refuse a draft or a send.
    expect(bodyRefusal(a.body)).toMatchObject({ ok: false, reason: 'unfilled_placeholders' });
  });

  it('a material GAP holds is linked (Ours); their confirmed words, the first fact and the last touch are citable beside the text', () => {
    const a = prepareAnswer(answerInput('Could you send me the demo?', { materials: [{ kind: 'demo', label: 'a demo for Nfi Scratch Co', href: 'https://yardflow.ai/demo/nfi/' }], confirmed: [{ type: 'business_problem', quote: 'We lose about 3 hours per shift hunting for trailers.', at: '2026-10-02T15:00:00.000Z' }], story: { title: 'Nfi opens New Jersey terminal', url: 'https://news.example.com/nfi', at: '2026-09-28T00:00:00.000Z' }, lastTouch: { subject: 'Trailer turns at your sites', at: '2026-10-01T15:00:00.000Z' } }));
    expect(a.body).toBe('Hi Ann,\n\nThanks for getting back to me.\n\nHere is a demo for Nfi Scratch Co: https://yardflow.ai/demo/nfi/');
    expect(a.missing).toEqual([]);
    expect(a.known.map((k) => [k.trust, k.text])).toEqual([
      ['Ours', 'a demo for Nfi Scratch Co'],
      ['Buyer confirmed', '"We lose about 3 hours per shift hunting for trailers."'],
      ['Public source', 'Nfi opens New Jersey terminal'],
      ['Recorded', 'Your last note: "Trailer turns at your sites"'],
    ]);
    expect(bodyRefusal(a.body)).toBeNull();
  });

  it('an opt-out, a referral, an automatic notice prepare no answer; an objection prepares one that acknowledges it; a missing thread is PARTIAL and names the dependency', () => {
    expect(prepareAnswer(answerInput('stop'))).toMatchObject({ status: 'none', body: '', why: expect.stringMatching(/^They opted out: no reply goes back/) });
    expect(prepareAnswer(answerInput("I'm not the right person. You should talk to Bob Lane."))).toMatchObject({ status: 'none', why: expect.stringMatching(/^A referral prepares no reply/) });
    expect(prepareAnswer(answerInput('I am out of the office until Oct 12.', { subject: 'Automatic reply' })).status).toBe('none');
    const obj = prepareAnswer(answerInput('We already run a YMS across the network.'));
    expect(obj.body).toContain('[Fill in: acknowledge "We already run a YMS across the network." and ask one question that tests it.]');
    const partial = prepareAnswer(answerInput('Can you send the two-site comparison?', { dependency: 'the Gmail thread: this reply came in through HubSpot.' }));
    expect(partial).toMatchObject({ status: 'partial', dependency: 'the Gmail thread: this reply came in through HubSpot.' });
    expect(partial.body).not.toBe('');
  });
});

// ---------------------------------------------------------------------------------------------------------------------

function world(over: { inbound?: Array<Record<string, unknown>>; dispositions?: Array<Record<string, unknown>>; persona?: Record<string, unknown> } = {}) {
  return ledgerDb({
    accounts: [ACCOUNT],
    personas: [{ id: 41, name: 'Ann Scratch', email: ANN, account_name: ACCOUNT, do_not_contact: false, hubspot_contact_id: '900', ...(over.persona ?? {}) }],
    inbound: over.inbound ?? [{ id: 'msg-1', thread_id: 'thr-1', rfc_message_id: '<ann-1@nfi.example.com>', from_email: ANN, from_name: 'Ann Scratch', subject: 'Re: trailer turns at your sites', body_text: 'Thanks Casey. Can you send the two-site comparison? What would it cost per site?', body_html: null, snippet: 'Thanks Casey.', received_at: new Date('2026-10-06T13:00:00Z'), source: 'gmail', thread: { account_name: ACCOUNT } }],
    dispositions: over.dispositions ?? [],
  }, new Date('2026-10-06T18:00:00Z'));
}
const FILLED = 'Hi Ann,\n\nThanks for getting back to me.\n\nI will send the comparison Thursday. On pricing, it depends on the number of sites; can we cover it on a call?';
const deps = (gmail: { sent: unknown[]; drafts: unknown[] }, over: Record<string, unknown> = {}) => ({
  gapSender: () => SENDER,
  materials: async () => [],
  signature: async () => null,
  mailboxSentTo: async () => [] as Array<{ id: string; internalDate: Date; subject: string }>,
  gmail: { createGmailDraft: vi.fn(async (p: unknown) => { gmail.drafts.push(p); return { provider: 'gmail' as const, draftId: `d-${gmail.drafts.length}`, messageId: 'dm-1', threadId: 'thr-1' }; }) },
  gmailTransport: { sendViaGmail: vi.fn(async (p: unknown) => { gmail.sent.push(p); return { provider: 'gmail' as const, id: `s-${gmail.sent.length}`, threadId: 'thr-1' }; }) },
  ...over,
});

describe('three distinct states, the send only through preview and CONFIRM + SEND (R42b)', () => {
  it('copy is recorded and sends nothing; the send previews exactly the text, then CONFIRM + SEND sends it once in their thread as HUMAN_APPROVED_1TO1; a replay answers already sent', async () => {
    const db = world();
    const p = db.client();
    const gmail = { sent: [] as unknown[], drafts: [] as unknown[] };
    const ctx = await loadReplyContext(p, 'msg-1', NOW, deps(gmail));
    expect(ctx?.answer.asks.map((a) => a.topic)).toEqual(['material', 'pricing']);
    expect((await recordReplyCopied(p, { messageId: 'msg-1', body: ctx!.answer.body, actor: ACTOR, now: NOW }, deps(gmail))).ok).toBe(true);
    expect(gmail.sent).toEqual([]);
    // The prepared text still has its placeholders: nothing is previewed for sending.
    expect(await sendSellerReply(p, { messageId: 'msg-1', body: ctx!.answer.body, actor: ACTOR, now: NOW }, deps(gmail))).toMatchObject({ ok: false, reason: 'unfilled_placeholders' });
    const pv = await sendSellerReply(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW }, deps(gmail));
    expect(pv).toMatchObject({ ok: true, preview: { from: 'casey@yardflow.ai', to: ANN, subject: 'Re: trailer turns at your sites', body: FILLED } });
    const hash = 'preview' in pv && pv.ok ? pv.preview.contentHash : '';
    expect(await sendSellerReply(p, { messageId: 'msg-1', body: `${FILLED} Edited.`, actor: ACTOR, now: NOW, confirm: { contentHash: hash, recipient: ANN } }, deps(gmail))).toMatchObject({ ok: false, reason: 'copy_changed_since_review' });
    const sent = await sendSellerReply(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW, confirm: { contentHash: hash, recipient: ANN } }, deps(gmail));
    expect(sent).toMatchObject({ ok: true, alreadySent: false, sent: { recipient: ANN, gmailSentMessageId: 's-1', inReplyTo: '<ann-1@nfi.example.com>' } });
    expect(gmail.sent).toHaveLength(1);
    expect(gmail.sent[0]).toMatchObject({ to: ANN, threadId: 'thr-1', subject: 'Re: trailer turns at your sites', purpose: 'HUMAN_APPROVED_1TO1', humanConfirmation: { actor: ACTOR, recipient: ANN, contentHash: hash }, headers: { 'In-Reply-To': '<ann-1@nfi.example.com>', References: '<ann-1@nfi.example.com>' } });
    const again = await sendSellerReply(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW, confirm: { contentHash: hash, recipient: ANN } }, deps(gmail));
    expect(again).toMatchObject({ ok: true, alreadySent: true });
    expect(gmail.sent).toHaveLength(1);
    // After a send, a draft is refused (already answered); the three facts are distinct ledger kinds.
    expect(await createSellerReplyDraft(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW }, deps(gmail))).toMatchObject({ ok: false, reason: 'already_answered' });
    const kinds = db.store.gapAuditEvent.filter((r) => r.subject_type === 'inbound_message').map((r) => r.kind);
    expect(kinds).toEqual([REPLY_COPIED, 'execution.reply_claimed', REPLY_SENT]);
  });

  it('the confirm binds the sending mailbox as well as the text and the recipient; a newer message after the preview makes it stale', async () => {
    const db = world();
    const p = db.client();
    const gmail = { sent: [] as unknown[], drafts: [] as unknown[] };
    const pv = await sendSellerReply(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW }, deps(gmail));
    const hash = 'preview' in pv && pv.ok ? pv.preview.contentHash : '';
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    const confirm = { contentHash: hash, recipient: ANN };
    const otherMailbox = deps(gmail, { gapSender: () => ({ ...SENDER, userEmail: 'casey@freightroll.com' }) });
    expect(await sendSellerReply(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW, confirm }, otherMailbox)).toMatchObject({ ok: false, reason: 'copy_changed_since_review' });
    db.store.inboundMessage.push({ id: 'msg-2', thread_id: 'thr-1', rfc_message_id: null, from_email: ANN, from_name: 'Ann Scratch', subject: 'Re: trailer turns at your sites', body_text: 'One more thing: who else uses it?', body_html: null, snippet: 'One more thing', received_at: new Date('2026-10-06T18:30:00Z'), source: 'gmail', thread: { account_name: ACCOUNT } });
    expect(await sendSellerReply(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW, confirm }, deps(gmail))).toMatchObject({ ok: false, reason: 'newer_message' });
    expect(gmail.sent).toEqual([]);
  });

  it('the copy guard holds the edited text: no claim of approval the buyer did not make (their own quoted sentence is exempt), no "throughput"', () => {
    expect(bodyRefusal('Hi Ann,\n\nLegal has approved the pilot, so we can start Monday.')).toMatchObject({ ok: false, reason: 'copy_problem', detail: expect.stringContaining('a claim of approval or acceptance the buyer did not make') });
    expect(bodyRefusal('Hi Ann,\n\nGood news that you have agreed to proceed.')).toMatchObject({ ok: false, reason: 'copy_problem' });
    expect(bodyRefusal('Hi Ann,\n\nYou wrote: "Legal has approved the pilot." Great, next is the kickoff call.', ['Legal has approved the pilot.'])).toBeNull();
    expect(bodyRefusal('Hi Ann,\n\nIt lifts throughput at the gate.')).toMatchObject({ ok: false, reason: 'copy_problem', detail: expect.stringContaining('"throughput"') });
  });

  it('a Gmail draft in their thread is NOT a send: drafting twice makes one draft; a send while the draft exists is refused', async () => {
    const db = world();
    const p = db.client();
    const gmail = { sent: [] as unknown[], drafts: [] as unknown[] };
    const d1 = await createSellerReplyDraft(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW }, deps(gmail));
    expect(d1).toMatchObject({ ok: true, alreadyDrafted: false, drafted: { gmailDraftId: 'd-1' } });
    expect(gmail.drafts[0]).toMatchObject({ to: ANN, threadId: 'thr-1', headers: { 'In-Reply-To': '<ann-1@nfi.example.com>' } });
    expect((gmail.drafts[0] as { purpose?: string }).purpose).not.toBe('HUMAN_APPROVED_1TO1');
    expect(await createSellerReplyDraft(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW }, deps(gmail))).toMatchObject({ ok: true, alreadyDrafted: true });
    expect(await createSellerReplyDraft(p, { messageId: 'msg-1', body: `${FILLED} More.`, actor: ACTOR, now: NOW }, deps(gmail))).toMatchObject({ ok: false, reason: 'draft_outstanding' });
    expect(gmail.drafts).toHaveLength(1);
    expect(await sendSellerReply(p, { messageId: 'msg-1', body: FILLED, actor: ACTOR, now: NOW }, deps(gmail))).toMatchObject({ ok: false, reason: 'draft_outstanding' });
    expect(gmail.sent).toEqual([]);
    expect(db.store.gapAuditEvent.filter((r) => r.kind === REPLY_DRAFTED)).toHaveLength(1);
  });

  it('the controls hold at the click: an opt-out (even a later one) stops everything, a referral prepares nothing, a recorded do-not-contact, a newer message, an answer sent by hand in Gmail, an unreadable Sent folder, a HubSpot-inbox reply (partial, the dependency named)', async () => {
    const gmail = { sent: [] as unknown[], drafts: [] as unknown[] };
    const at = (id: string, text: string, when: string, over: Record<string, unknown> = {}) => ({ id, thread_id: 'thr-1', rfc_message_id: null, from_email: ANN, from_name: 'Ann Scratch', subject: 'Re: trailer turns', body_text: text, body_html: null, snippet: text, received_at: new Date(when), source: 'gmail', thread: { account_name: ACCOUNT }, ...over });
    const run = async (w: ReturnType<typeof world>, id = 'msg-1', d = deps(gmail)) => prepareSellerReply(w.client(), { messageId: id, body: FILLED, actor: ACTOR, now: NOW }, d);
    expect(await run(world({ inbound: [at('msg-1', 'Can you send the comparison?', '2026-10-06T13:00:00Z'), at('msg-2', 'Please remove me from your list.', '2026-10-06T14:00:00Z')] }))).toMatchObject({ ok: false, reason: 'opted_out' });
    expect(await run(world({ inbound: [at('msg-1', 'stop', '2026-10-06T13:00:00Z')] }))).toMatchObject({ ok: false, reason: 'opted_out' });
    expect(await run(world({ inbound: [at('msg-1', "I'm not the right person. You should talk to Bob Lane.", '2026-10-06T13:00:00Z')] }))).toMatchObject({ ok: false, reason: 'referral_prepares_no_reply' });
    expect(await run(world({ dispositions: [{ id: 'd1', contact_email: ANN, human_confirmed: true, response_class: 'do_not_contact' }] }))).toMatchObject({ ok: false, reason: 'opted_out' });
    expect(await run(world({ persona: { do_not_contact: true } }))).toMatchObject({ ok: false, reason: 'person_do_not_contact' });
    expect(await run(world({ inbound: [at('msg-1', 'Can you send the comparison?', '2026-10-06T13:00:00Z'), at('msg-2', 'Also, who else uses it?', '2026-10-06T15:00:00Z')] }))).toMatchObject({ ok: false, reason: 'newer_message' });
    expect(await run(world(), 'msg-1', deps(gmail, { mailboxSentTo: async () => [{ id: 'by-hand', internalDate: new Date('2026-10-06T16:00:00Z'), subject: 'Re: trailer turns' }] }))).toMatchObject({ ok: false, reason: 'answered_in_gmail' });
    expect(await run(world(), 'msg-1', deps(gmail, { mailboxSentTo: async () => { throw new Error('Gmail 500'); } }))).toMatchObject({ ok: false, reason: 'mailbox_sent_unreadable' });
    const hs = world({ inbound: [at('hs:42', 'Can you send the comparison?', '2026-10-06T13:00:00Z', { source: 'hubspot' })] });
    const ctx = await loadReplyContext(hs.client(), 'hs:42', NOW, deps(gmail));
    expect(ctx?.answer).toMatchObject({ status: 'partial', dependency: expect.stringMatching(/^the Gmail thread: this reply came in through HubSpot/) });
    expect(await run(hs, 'hs:42')).toMatchObject({ ok: false, reason: 'no_gmail_thread' });
    expect(await run(world(), 'msg-1', deps(gmail, { gapSender: () => null }))).toMatchObject({ ok: false, reason: 'gap_sender_unconfigured' });
    expect(gmail.sent).toEqual([]);
    expect(gmail.drafts).toEqual([]);
  });
});

describe('the route and the panel (R42b)', () => {
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
  });

  it('GET prepares the answer; with no GAP mailbox it is PARTIAL and names that dependency; POST copied records it; a draft or a send with placeholders is refused; a non-owner cannot draft or send', async () => {
    const db = world();
    holder.client = db.client();
    const { GET, POST } = await import('@/app/api/gap/replies/[id]/answer/route');
    const ctx = { params: Promise.resolve({ id: 'msg-1' }) };
    const post = async (b: unknown) => {
      const r = await POST(new NextRequest('http://localhost/api/gap/replies/msg-1/answer', { method: 'POST', body: JSON.stringify(b), headers: { 'content-type': 'application/json' } }), ctx);
      return [r.status, ((await r.json()) as { error?: string }).error ?? null];
    };
    const saved = { user: process.env.GAP_GMAIL_USER_EMAIL, sa: process.env.GAP_GOOGLE_DWD_SA_JSON, rt: process.env.GAP_GOOGLE_REFRESH_TOKEN };
    delete process.env.GAP_GMAIL_USER_EMAIL;
    delete process.env.GAP_GOOGLE_DWD_SA_JSON;
    delete process.env.GAP_GOOGLE_REFRESH_TOKEN;
    try {
      const got = await GET(new NextRequest('http://localhost/api/gap/replies/msg-1/answer'), ctx);
      const body = (await got.json()) as { answer: { status: string; dependency: string | null; missing: string[]; body: string }; blocked: { reason: string } | null };
      expect(got.status).toBe(200);
      expect(body.answer).toMatchObject({ status: 'partial', dependency: expect.stringMatching(/^the GAP mailbox sender \(GAP_GMAIL_USER_EMAIL and its credential\) is not configured here/) });
      expect(body.answer.missing).toHaveLength(2);
      expect(await post({ op: 'copied', body: body.answer.body })).toEqual([200, null]);
      expect(await post({ op: 'draft', body: FILLED })).toEqual([409, 'gap_sender_unconfigured']);
      process.env.GAP_GMAIL_USER_EMAIL = 'casey@yardflow.ai';
      process.env.GAP_GOOGLE_DWD_SA_JSON = '{}';
      // The text still carries its placeholders: refused before anything reaches Gmail.
      expect(await post({ op: 'draft', body: body.answer.body })).toEqual([409, 'unfilled_placeholders']);
      expect(await post({ op: 'send', body: body.answer.body })).toEqual([409, 'unfilled_placeholders']);
      expect(await post({ op: 'send', body: 'Hi Ann \u2014 yes.' })).toEqual([409, 'em_dash']);
      vi.mocked(auth).mockResolvedValueOnce({ user: { email: 'rep@freightroll.com' } } as never);
      expect(await post({ op: 'send', body: FILLED })).toEqual([403, 'forbidden']);
      vi.mocked(auth).mockResolvedValueOnce({ user: { email: 'rep@freightroll.com' } } as never);
      expect(await post({ op: 'draft', body: FILLED })).toEqual([403, 'forbidden']);
      expect(db.store.gapAuditEvent.map((r) => r.kind)).toEqual([REPLY_COPIED]);
    } finally {
      for (const [k, v] of [['GAP_GMAIL_USER_EMAIL', saved.user], ['GAP_GOOGLE_DWD_SA_JSON', saved.sa], ['GAP_GOOGLE_REFRESH_TOKEN', saved.rt]] as const) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it('the panel loads the answer on request and shows the text, the missing information, the citable facts and three separate actions', async () => {
    const answer = prepareAnswer(answerInput('Can you send the two-site comparison? What would it cost?'));
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ answer, states: { copied: null, drafted: null, sent: null, openClaim: null }, blocked: null }), { status: 200 })));
    render(<ReplyAnswer messageId="msg-1" />);
    fireEvent.click(screen.getByTestId('reply-answer-prepare'));
    await waitFor(() => expect(screen.getByTestId('reply-answer')).toBeTruthy());
    expect((screen.getByTestId('reply-answer-text') as HTMLTextAreaElement).value).toBe(answer.body);
    expect(screen.getByTestId('reply-answer-missing').textContent).toMatch(/GAP holds no price for them/);
    expect(screen.getByTestId('reply-answer-placeholders').textContent).toBe('2 parts still to fill in before a draft or a send.');
    expect((screen.getByTestId('reply-answer-draft') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId('reply-answer-send') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId('reply-answer-copy') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.change(screen.getByTestId('reply-answer-text'), { target: { value: FILLED } });
    expect((screen.getByTestId('reply-answer-send') as HTMLButtonElement).disabled).toBe(false);
    vi.unstubAllGlobals();
  });
});
