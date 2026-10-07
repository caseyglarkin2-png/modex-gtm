/**
 * R42 (GAP OS execution recovery): reply triage through reply execution. The reply kinds are told apart (a real reply,
 * a referral, an objection, an opt-out, an automatic notice, a bounce); the incoming message is shown with prepared
 * notes and NO governed reply copy (fail closed: GAP never writes the reply and offers no send); a real reply stops
 * cold follow-up at the account; a referral names a person who gets no cold action and no implied relationship; an
 * out-of-office return day moves the follow-up; one message imported twice is one piece of work.
 */
import { describe, expect, it } from 'vitest';
import { classifyReply } from '@/lib/gap/replies/classify';
import { detectNamed, NO_ANSWER_OPT_OUT, NO_ANSWER_REFERRAL, prepareReply, threadLink } from '@/lib/gap/replies/prepare';
import { areTwins, twinGroups } from '@/lib/gap/replies/twins';
import { listReplies } from '@/lib/gap/replies/list';
import { projectPursuitState, type PursuitInput } from '@/lib/gap/pursuit/state';
import { workDay } from '@/lib/gap/work/list';
import { ensureCommitment, loadCommitments, syncReturnRemindersFromReplies } from '@/lib/gap/work/commitments';
import { nyDayAt } from '@/lib/gap/work/dates';
import { buildDispositionBody, emptyDraft } from '@/components/gap/disposition-form';
import { ledgerDb } from './fixtures/ledger-db';

const NOW = new Date('2026-10-06T15:00:00Z'); // Tue Oct 6, 11 am New York
const reply = (snippet: string, over: Partial<{ id: string; from: string; subject: string | null; receivedAt: string; threadId: string | null; fromName: string | null }> = {}) => ({ id: 'm1', from: 'ann@nfi.example.com', fromName: 'Ann Scratch', subject: 'Re: trailer turns', snippet, receivedAt: '2026-10-06T13:00:00Z', threadId: 'thr-1', accountName: 'Nfi Scratch Co', ...over });

describe('the reply kinds (R42)', () => {
  it('a human reply says whether it is a real reply, a referral or an objection; every one of them still pauses the account', () => {
    const real = classifyReply({ snippet: 'Thanks Casey. Can you send the two-site comparison? Thursday works for a call.', subject: 'Re: yards' });
    const referral = classifyReply({ snippet: "I'm not the right person for this. You should talk to Bob Lane, he runs our yards.", subject: 'Re: yards' });
    const objection = classifyReply({ snippet: 'We already run a YMS across the network, so this is not a priority for us.', subject: 'Re: yards' });
    expect([real, referral, objection].map((c) => [c.kind, c.human, c.pausesAccount, c.label])).toEqual([
      ['human', 'reply', true, 'Someone replied'],
      ['human', 'referral', true, 'They named someone'],
      ['human', 'objection', true, 'They objected'],
    ]);
    // An opt-out inside a longer message is an opt-out, never a conversation; the other kinds carry no human subtype.
    expect(classifyReply({ snippet: 'Please remove me from your list. Thanks.', subject: null })).toMatchObject({ kind: 'opt_out', human: null, pausesAccount: false });
    expect(classifyReply({ snippet: 'I am out of the office until Oct 12.', subject: 'Automatic reply' }).human).toBeNull();
  });
});

describe('the prepared reply (R42; R42b makes a real reply answerable)', () => {
  it('a real reply: the message, what they asked, the day they named (New York), the thread to answer in and the record form; no governed copy family, answerable through the gated answer (no send link here)', () => {
    const prep = prepareReply(reply('Thanks Casey. Can you send the two-site comparison? Thursday works for a call.'), { mailbox: 'casey@yardflow.ai', now: NOW });
    expect(prep).toMatchObject({ kind: 'human', human: 'reply', copyFamily: null, answerable: true, noAnswerLine: null, record: { href: '/gap?lane=replies', label: 'Record what they said' } });
    expect(prep.notes).toEqual([
      'They asked: "Can you send the two-site comparison?". Answer that first.',
      'They named a day: Thursday (Oct 8). Offer a time then, or ask what suits.',
      'Then record what they said; the next step follows from it, and nobody at the account gets a cold email until then.',
    ]);
    expect(prep.threadHref).toBe('https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#all/thr-1');
    // Never a send path, never a chat-generated draft: the only links are the Gmail thread and the record form.
    expect(JSON.stringify(prep)).not.toMatch(/\/send|compose|draft|preview/i);
    // A HubSpot copy has no Gmail thread: a search for the sender in the GAP mailbox, never whichever account is /u/0.
    expect(threadLink(null, 'ann@nfi.example.com', 'casey@yardflow.ai')).toBe('https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#search/from%3A%22ann%40nfi.example.com%22');
  });

  it('a referral names the person and says they get no cold email; an objection is quoted; an opt-out gets no reply; an automatic notice has nothing to answer; a bounce asks for an address', () => {
    const ref = prepareReply(reply("I'm not the right person. You should talk to Bob Lane, he runs our yards."), { now: NOW });
    expect(ref).toMatchObject({ human: 'referral', named: 'Bob Lane', record: { label: 'Record who they named' }, answerable: false, noAnswerLine: NO_ANSWER_REFERRAL });
    expect(ref.notes[1]).toBe('Bob Lane gets no cold email: record the referral and GAP lists them as named by Ann Scratch; you decide how to approach them.');
    expect(detectNamed('please reach out to bob.lane@nfi.example.com directly')).toBe('bob.lane@nfi.example.com');
    const obj = prepareReply(reply('Appreciate it. We already run a YMS across the network.'), { now: NOW });
    expect(obj.notes[0]).toBe('They pushed back: "We already run a YMS across the network.". Acknowledge it and ask one question that tests it; do not argue.');
    expect(prepareReply(reply('stop'), { now: NOW })).toMatchObject({ kind: 'opt_out', answerable: false, noAnswerLine: NO_ANSWER_OPT_OUT, notes: ['No reply goes back.', 'Record it as do not contact; the person is set aside and the account cools.'] });
    expect(obj).toMatchObject({ answerable: true, noAnswerLine: null });
    const ooo = prepareReply(reply('I am out of the office and will return on Monday, October 12.', { subject: 'Automatic reply: trailer turns' }), { now: NOW });
    expect(ooo).toMatchObject({ kind: 'out_of_office', record: null, day: { day: '2026-10-12' } });
    expect(ooo.notes).toEqual(['An automatic notice: there is nothing to answer.', 'They are back Oct 12: the follow-up waits until then.']);
    expect(prepareReply(reply('Delivery to the following recipient failed permanently', { from: 'mailer-daemon@googlemail.com' }), { now: NOW }).kind).toBe('bounce');
  });
});

describe('a real reply stops cold follow-up at the account (R42, pinned)', () => {
  it('the pursuit read is replied with no cold touch for a referral or an objection too, and the follow-up waiting there is blocked by the reply, never offered', () => {
    const base: PursuitInput = { accountName: 'Nfi Scratch Co', now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [{ key: 'p:1', personaId: 1, name: 'Ann Scratch', title: 'VP Transportation' }] };
    for (const snippet of ['Thursday works.', 'You should talk to Bob Lane instead.', 'We already run a YMS.']) {
      const s = projectPursuitState({ ...base, replies: [{ from: 'ann@nfi.example.com', name: 'Ann Scratch', at: '2026-10-06T13:00:00Z', subject: 'Re', snippet, triaged: false }] });
      expect([s.state, s.coldTouchAllowed]).toEqual(['replied', false]);
    }
    const followUp = { commitmentId: 'send:k', accountName: 'Nfi Scratch Co', kind: 'follow_up' as const, title: 'Follow up with Ann Scratch', basis: null, owner: 'x', dueAt: '2026-10-06T13:00:00.000Z', person: { personaId: 1, name: 'Ann Scratch', email: 'ann@nfi.example.com' }, dealId: null, threadId: null, status: 'waiting' as const, snoozeUntil: null, dependency: "Ann's reply", proof: null, reason: null, source: { kind: 'send' as const, id: 'k' }, detail: { stepIndex: 1 }, createdAt: '2026-10-01T13:00:00.000Z', createdBy: 'x', updatedAt: '2026-10-01T13:00:00.000Z', updatedBy: 'x' };
    const day = workDay({ now: NOW, candidates: [], motions: [], inDeals: { status: 'complete', accounts: [] }, held: new Map(), commitments: [followUp], replies: [{ accountName: 'Nfi Scratch Co', contactEmail: 'ann@nfi.example.com', subject: 'Re', snippet: 'You should talk to Bob Lane instead.', receivedAt: '2026-10-06T13:30:00Z', id: 'm9', threadId: 't9' }], mailbox: 'casey@yardflow.ai' });
    const card = day.cards[0];
    expect([card.stateKind, card.state, card.next?.label]).toEqual(['replied', 'They named someone', 'Record who they named']);
    expect(card.obligations).toEqual([]);
    expect(card.reply).toMatchObject({ human: 'referral', named: 'Bob Lane', copyFamily: null });
    expect(day.waiting.map((w) => [w.title, w.line])).toEqual([['Follow up with Ann Scratch', 'ann@nfi.example.com replied Oct 6. Answer that, not a follow-up.']]);
  });
});

describe('an out-of-office return day adjusts the reminder (R42)', () => {
  const notice = (over: Record<string, unknown> = {}) => ({ accountName: 'Nfi Scratch Co', contactEmail: 'ann@nfi.example.com', fromName: 'Ann Scratch', subject: 'Automatic reply: trailer turns', snippet: 'I am out of the office and will return on Wednesday, October 14.', receivedAt: '2026-10-06T13:00:00Z', ...over });
  it('the waiting follow-up moves to the day they are back (never earlier); a re-read and a duplicate import change nothing', async () => {
    const db = ledgerDb({ accounts: ['Nfi Scratch Co'] });
    const p = db.client();
    await ensureCommitment(p, { accountName: 'Nfi Scratch Co', kind: 'follow_up', status: 'waiting', dependency: "Ann's reply", title: 'Follow up with Ann Scratch', dueAt: nyDayAt('2026-10-12'), person: { personaId: 1, name: 'Ann Scratch', email: 'ann@nfi.example.com' }, source: { kind: 'send', id: 'k0' } }, { actor: 'x', now: NOW });
    expect(await syncReturnRemindersFromReplies(p, [notice()], NOW)).toEqual({ adjusted: 1, created: 0 });
    expect(await syncReturnRemindersFromReplies(p, [notice(), notice({ subject: 'Automatic reply: trailer turns ' })], NOW)).toEqual({ adjusted: 0, created: 0 });
    const [fu] = await loadCommitments(p, { accountNames: ['Nfi Scratch Co'] });
    expect(fu).toMatchObject({ status: 'waiting', dueAt: '2026-10-14T13:00:00.000Z', dependency: 'Ann is out of the office until Oct 14' });
  });
  it('with no follow-up waiting, ONE reminder snoozed until the return day, whatever the number of copies; a notice with no day changes nothing', async () => {
    const db = ledgerDb({ accounts: ['Nfi Scratch Co'] });
    const p = db.client();
    expect(await syncReturnRemindersFromReplies(p, [notice(), notice()], NOW)).toEqual({ adjusted: 0, created: 1 });
    expect(await syncReturnRemindersFromReplies(p, [notice({ snippet: 'I am out of the office with limited access to email.' })], NOW)).toEqual({ adjusted: 0, created: 0 });
    const all = await loadCommitments(p, { accountNames: ['Nfi Scratch Co'] });
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ kind: 'reminder', status: 'snoozed', snoozeUntil: '2026-10-14T13:00:00.000Z', title: 'Follow up with Ann Scratch when they are back', source: { kind: 'reply', id: 'ooo:ann@nfi.example.com:2026-10-14' } });
  });
});

describe('one message imported twice is one piece of work (R42)', () => {
  const T = (min: number) => new Date(Date.UTC(2026, 9, 6, 13, min));
  const gmail = { id: 'gm-1', source: 'gmail', thread_id: 'thr-1', from_email: 'ann@nfi.example.com', from_name: 'Ann Scratch', subject: 'Re: trailer turns', body_text: 'Thursday works for a call.', body_html: null, snippet: null, received_at: T(0) };
  const hubspot = { id: 'hs:9001', source: 'hubspot', thread_id: 'hs-thread', from_email: 'Ann@nfi.example.com', from_name: null, subject: 'RE: trailer turns', body_text: 'Thursday works for a call.', body_html: null, snippet: null, received_at: T(3) };
  function fakePrisma(dispositions: Array<{ id: string; source_id: string; human_confirmed: boolean }>) {
    const rows = [gmail, hubspot];
    return {
      sequenceEnrollment: { findMany: async () => [] },
      persona: { findMany: async () => [{ id: 1, email: 'ann@nfi.example.com', account_name: 'Nfi Scratch Co', hubspot_contact_id: null, prospecting_hypotheses: [{ id: 'H1', status: 'active', problem_family: 'hidden_capacity', created_at: T(0) }] }] },
      inboundMessage: { findMany: async (q: { where: { id?: { notIn: string[] } } }) => rows.filter((r) => !q.where.id?.notIn.includes(r.id)).sort((a, b) => b.received_at.getTime() - a.received_at.getTime()) },
      conversationDisposition: { findMany: async (q: { where: { source_id: { in: string[] } } }) => dispositions.filter((d) => q.where.source_id.in.includes(d.source_id)).map((d) => ({ ...d, source_kind: 'inbound_message', created_by: 'casey', ai_suggested: null })) },
    };
  }
  it('the Gmail copy and the HubSpot copy are twins: one reply, the Gmail copy represents it and names the other', async () => {
    expect(areTwins({ id: 'a', from: 'ann@nfi.example.com', subject: 'Re: x', snippet: 'Thursday works.', receivedAt: T(0).toISOString() }, { id: 'b', from: 'ANN@nfi.example.com', subject: 'RE: x', snippet: 'Thursday works.', receivedAt: T(9).toISOString() })).toBe(true);
    expect(areTwins({ id: 'a', from: 'ann@nfi.example.com', subject: 'Re: x', snippet: 'Thursday works.', receivedAt: T(0).toISOString() }, { id: 'b', from: 'ann@nfi.example.com', subject: 'Re: x', snippet: 'Friday instead, sorry.', receivedAt: T(5).toISOString() })).toBe(false);
    expect(twinGroups([{ id: 'hs:1', from: 'a@x.com', subject: 's', snippet: 'z', receivedAt: T(1).toISOString(), source: 'hubspot' }, { id: 'g', from: 'a@x.com', subject: 's', snippet: 'z', receivedAt: T(2).toISOString(), source: 'gmail' }])[0].rep.id).toBe('g');
    const page = await listReplies(fakePrisma([]) as never, { state: 'undispositioned' });
    expect(page.items.map((i) => [i.id, i.twinIds, i.threadId])).toEqual([['gm-1', ['hs:9001'], 'thr-1']]);
  });
  it('a human-confirmed disposition on EITHER copy settles the reply: nothing is left waiting as work; an AI suggestion settles nothing', async () => {
    expect((await listReplies(fakePrisma([{ id: 'D1', source_id: 'hs:9001', human_confirmed: true }]) as never, { state: 'undispositioned' })).items).toEqual([]);
    expect((await listReplies(fakePrisma([{ id: 'D2', source_id: 'gm-1', human_confirmed: true }]) as never, { state: 'undispositioned' })).items).toEqual([]);
    expect((await listReplies(fakePrisma([{ id: 'D3', source_id: 'hs:9001', human_confirmed: false }]) as never, { state: 'undispositioned' })).items.map((i) => i.id)).toEqual(['gm-1']);
    // The twin outside the page (a page of one) carries only an AI suggestion: the reply is still waiting.
    const onePage = await listReplies(fakePrisma([{ id: 'D4', source_id: 'gm-1', human_confirmed: false }]) as never, { state: 'undispositioned', limit: 1 });
    expect(onePage.items.map((i) => [i.id, i.twinIds])).toEqual([['hs:9001', ['gm-1']]]);
    // ...and a human-confirmed disposition on that outside twin settles it.
    expect((await listReplies(fakePrisma([{ id: 'D5', source_id: 'gm-1', human_confirmed: true }]) as never, { state: 'undispositioned', limit: 1 })).items).toEqual([]);
  });
});

describe('the disposition form carries who a referral named and when a not-now comes back (R42)', () => {
  const prefill = { hypothesisId: 'H1', contactEmail: 'Ann@nfi.example.com', channel: 'email' as const, source: { kind: 'inbound_message' as const, id: 'gm-1' } };
  it('referral and timing add their fields to the contract body; other classes never do', () => {
    expect(buildDispositionBody(prefill, { ...emptyDraft(), responseClass: 'referral', referralName: ' Bob Lane ', referralTitle: 'VP Operations', referralEmail: 'BOB@nfi.example.com' })).toMatchObject({ referral: { name: 'Bob Lane', title: 'VP Operations', email: 'bob@nfi.example.com' } });
    expect(buildDispositionBody(prefill, { ...emptyDraft(), responseClass: 'timing', resumeDay: '2026-11-02' })).toMatchObject({ resumeAt: '2026-11-02T14:00:00.000Z' });
    const other = buildDispositionBody(prefill, { ...emptyDraft(), responseClass: 'request_information', referralName: 'Bob', resumeDay: '2026-11-02' });
    expect(other).not.toHaveProperty('referral');
    expect(other).not.toHaveProperty('resumeAt');
  });
});
