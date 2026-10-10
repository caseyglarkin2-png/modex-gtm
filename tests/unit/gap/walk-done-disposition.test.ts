// @vitest-environment node
/**
 * THE WALK FIX, part 2 (Casey, 2026-10-10: "yes, change the command. optimize!"): DONE records the disposition. His
 * October 9 DONE on Kenco produced a "logged" outcome that expired the next day, so Kenco, Boston Beer and Gusto came
 * back as "Someone replied" every morning. Pinned here:
 *   - DONE on a reply item SETTLES the reply by his word (the C35 resolution row on its message): the reply list never
 *     lists it again, the pursuit read counts it handled, and no CRM write, disposition or enrollment stop runs
 *   - DONE on an opt-out never settles it: the one-day log as before, and the answer says it stays until recorded
 *   - DONE on any other item records a `done` outcome that does not expire the next day: the card stays off the day
 *     (parked, never a plan item) until something new happens at the account (a buyer message, the deal's activity)
 *   - after DONE, nextAssignableItem never offers the item again on later days; after a progress note it still does
 *   - a card the summary relabels "Someone replied" is bound to the reply's message (an object key, not a day key),
 *     and a DONE newer than that reply keeps the summary from relabelling it again
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyCommand, COMMAND_APPLIED, loadCommandContext } from '@/lib/gap/replies/commands-apply';
import { nextAssignableItem, sendAssignment } from '@/lib/gap/work/assignment';
import { loadWorkOutcomes } from '@/lib/gap/work/outcome';
import { REPLY_RESOLVED } from '@/lib/gap/work/recorded-replies';
import { planDay, itemsForDay, type DayPlan } from '@/lib/gap/work/plan';
import { doneSettles, doneStillHolds, workDay, type WorkCard, type WorkDay, type WorkInput } from '@/lib/gap/work/list';
import { listReplies, resolvedMessages } from '@/lib/gap/replies/list';
import type { WorkOutcome } from '@/lib/gap/work/outcome-model';
import type { PursuitSummary } from '@/lib/gap/pursuit/summary';
import type { SellerSettings } from '@/lib/gap/work/settings';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import type { GmailSendPayload } from '@/lib/email/gmail-sender';

const NOW = new Date('2026-10-09T14:00:00Z');
const NEXT_DAY = new Date('2026-10-10T13:00:00Z');
const LATER = new Date('2026-10-14T13:00:00Z');
const SELLER = 'casey@freightroll.com';
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };
const SETTINGS: SellerSettings = { briefingTo: SELLER, briefingHourNy: 7, commandSenders: [SELLER], mode: 'review', targets: {} };
const AUTH_OK = 'mx.google.com; spf=pass smtp.mailfrom=casey@freightroll.com; dmarc=pass (p=NONE) header.from=freightroll.com';
const CRAIG = 'craig.morrison@kencogroup.com';

const prep = (messageId: string, from: string, fromName: string | null, at: string, snippet: string) =>
  ({ messageId, from, fromName, at, subject: 'Re: yards', snippet, kind: 'human', human: null, label: 'replied', copyFamily: null, answerable: true, noAnswerLine: null, notes: [], threadHref: '', record: null }) as unknown as WorkCard['reply'];

const card = (c: Partial<WorkCard> & Pick<WorkCard, 'accountName' | 'stateKind' | 'state'>): WorkCard => ({ href: `/gap/accounts/${c.accountName.toLowerCase()}`, lane: 'ready', why: '', person: null, next: null, blocker: null, index: 0, source: 'cockpit', ...c });

function day1(): WorkDay {
  return {
    cards: [
      card({ accountName: 'Kenco', stateKind: 'replied', state: 'Someone replied', tier: 'reply', lane: 'replies', person: { name: 'Craig Morrison', title: null }, reply: prep('m-craig', CRAIG, 'Craig Morrison', '2026-09-24T15:00:00.000Z', 'Can you send the two-site comparison?') }),
      card({ accountName: 'Boston Beer', stateKind: 'in_deal', state: 'In a deal', tier: 'deal', lane: 'deals', dealNextStep: 'Send the four documents', move: 'Next step on the deal: Send the four documents' }),
      card({ accountName: 'Walmart Inc.', stateKind: 'opted_out', state: 'Opted out', tier: 'admin', lane: 'replies', person: { name: 'Tim Cooper', title: null }, reply: prep('m-stop', 'timothy.cooper@walmart.com', 'Tim Cooper', '2026-10-05T14:00:00.000Z', 'stop') }),
      card({ accountName: 'PepsiCo', stateKind: 'ready', state: 'Ready for a first touch', tier: 'ready', person: { name: 'Karen Ortiz', title: null }, next: { label: 'Send email', href: '/gap/pack/dec-1' } }),
    ],
    waiting: [],
    snoozed: [],
    counts: { needsYou: 4, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 },
  };
}

function msg(threadId: string, bodyText: string, receivedAt = NOW): MailboxMessage {
  return { id: `cmd-${Math.random().toString(16).slice(2, 8)}`, threadId, rfcMessageId: '<cmd@mail>', fromEmail: SELLER, fromName: 'Casey', subject: 'Re: GAP', snippet: '', bodyText, rawText: bodyText, bodyHtml: '', deliveryStatus: null, labelIds: ['INBOX'], receivedAt, headers: { 'Authentication-Results': AUTH_OK } };
}

async function world() {
  const db = ledgerDb({ accounts: ['Kenco', 'Boston Beer', 'Walmart Inc.', 'PepsiCo'] }, NOW);
  const c = db.client();
  const plan: DayPlan = await planDay(c, { now: NOW, load: async () => day1() }, 'test');
  let n = 0;
  const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async (p) => {
    n += 1;
    return { provider: 'gmail', id: `gm-${n}`, threadId: p.threadId ?? `th-item-${n - 1}` };
  });
  const deps = { send, askContext: vi.fn(async () => null), pack: vi.fn(async () => null) };
  for (const item of plan.items) await sendAssignment(c, { plan, item, revision: 0, to: SELLER, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW, actor: 'test' }, deps);
  send.mockClear();
  const ctx = await loadCommandContext(c, SETTINGS, NOW);
  const run = (threadId: string, text: string) => applyCommand(db.client(), { m: msg(threadId, text), ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron:gap-mailbox' }, deps);
  const thread = (key: string) => `th-item-${plan.items.findIndex((i) => i.key === key)}`;
  return { db, c, plan, deps, send, run, thread };
}

/** The next day's Work, built by the one builder from the same inputs a later read would hold. */
const dealInput = (over: Partial<WorkInput> = {}): WorkInput => ({
  now: NEXT_DAY,
  candidates: [],
  replies: [],
  motions: [],
  inDeals: { status: 'complete', accounts: [{ accountName: 'Boston Beer', deals: [{ id: '901', name: 'YardFlow - Boston Beer', stage: 'Proposal', nextStep: 'Send the four documents', lastActivityAt: '2026-10-01T12:00:00.000Z' }] }] },
  held: new Map(),
  ...over,
});

describe('DONE on a reply item settles the reply by his word', () => {
  it('Kenco: the resolution row on the message, no outcome, no disposition; the answer says it does not come back', async () => {
    const w = await world();
    const r = await w.run(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day');
    expect(r).toMatchObject({ applied: true, command: 'done', effect: 'reply_settled', basis: 'self_reported' });
    const resolved = w.db.store.gapAuditEvent.filter((e) => e.kind === REPLY_RESOLVED);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({ subject_type: 'inbound_message', subject_id: 'm-craig', actor: SELLER });
    expect(String(resolved[0].payload.reason)).toBe('DONE by email: answered Craig from Gmail the same day');
    expect(await loadWorkOutcomes(w.c, ['Kenco'], NOW)).toEqual(new Map());
    expect(w.db.store.conversationDisposition).toEqual([]);
    expect(w.send.mock.calls.at(-1)![0].text).toMatch(/^Settled, by your word: Craig Morrison's reply at Kenco\. Recorded: "answered Craig from Gmail the same day"\. It does not come back; a new message from them does\./);
    expect([...(await resolvedMessages(w.c, ['m-craig', 'm-other'])).keys()]).toEqual(['m-craig']);
  });

  it('on later days nextAssignableItem never offers it, even from a read that still holds it; the reply list no longer lists it', async () => {
    const w = await world();
    await w.run(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day');
    const fresh = card({ accountName: 'Gusto', stateKind: 'ready', state: 'Ready for a first touch', tier: 'ready', person: { name: 'Dana Ruiz', title: null }, next: { label: 'Send email', href: '/gap/pack/dec-2' } });
    const plan2 = await planDay(w.c, { now: NEXT_DAY, load: async () => ({ ...day1(), cards: [day1().cards[0], fresh] }) }, 'test');
    expect(plan2.items.map((i) => i.key)).toEqual(['reply:m-craig', 'first_touch:dec-2']);
    expect((await nextAssignableItem(w.c, plan2)).item?.key).toBe('first_touch:dec-2');

    const prisma = listPrisma([{ kind: REPLY_RESOLVED, subject_type: 'inbound_message', subject_id: 'm5', created_at: new Date('2026-10-09T14:00:00Z') }]);
    const open = await listReplies(prisma, { state: 'undispositioned' });
    expect(open.items.map((x) => x.id)).toEqual(['m3']);
    const all = await listReplies(prisma, { state: 'all' });
    expect(all.items.find((x) => x.id === 'm5')).toMatchObject({ resolvedAt: '2026-10-09T14:00:00.000Z' });
    expect(all.items.find((x) => x.id === 'm3')?.resolvedAt).toBeUndefined();
  });

  it('an opt-out is never settled by DONE: the one-day log as before, no resolution row, and the answer says it stays until recorded', async () => {
    const w = await world();
    const r = await w.run(w.thread('reply:m-stop'), 'DONE: noted it');
    expect(r).toMatchObject({ applied: true, effect: 'account_logged' });
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === REPLY_RESOLVED)).toEqual([]);
    expect((await loadWorkOutcomes(w.c, ['Walmart Inc.'], NOW)).get('Walmart Inc.')?.kind).toBe('logged');
    expect(w.send.mock.calls.at(-1)![0].text).toContain('The opt-out stays on your list until it is recorded as do not contact on the account.');
  });
});

describe('DONE on any other item records a done outcome that does not expire the next day', () => {
  it('Boston Beer: a done outcome for 90 days; the next day the deal card is parked, never a plan item, and START never offers it', async () => {
    const w = await world();
    const r = await w.run(w.thread('deal:Boston Beer:2026-10-09'), 'DONE: sent Phil the four documents');
    expect(r).toMatchObject({ applied: true, effect: 'account_done', basis: 'self_reported' });
    const said = w.send.mock.calls.at(-1)![0].text;
    // The note states a send, so the record names it as a claim GAP checks against Sent (C3), then the hold in words.
    expect(said, said).toMatch(/^Done, by your word: Boston Beer\. Recorded: your note to Phil today \(GAP checks Sent for it\)\. It stays off your day until something new happens there; GAP counts what it can prove separately\./);
    const next = await loadWorkOutcomes(w.c, ['Boston Beer'], NEXT_DAY);
    expect(next.get('Boston Beer')).toMatchObject({ kind: 'done', reason: 'sent Phil the four documents', until: new Date(NOW.getTime() + 90 * 86_400_000).toISOString() });
    // The one-day log of before would be gone by now; done is not.
    expect((await loadWorkOutcomes(w.c, ['Boston Beer'], LATER)).get('Boston Beer')?.kind).toBe('done');

    const day2 = workDay(dealInput({ outcomes: next }));
    expect(day2.cards.find((c) => c.accountName === 'Boston Beer')).toMatchObject({ tier: 'later', outcome: { kind: 'done' } });
    expect(itemsForDay(day2, '2026-10-10')).toEqual([]);
    const plan2 = await planDay(w.c, { now: NEXT_DAY, load: async () => day2 }, 'test');
    expect((await nextAssignableItem(w.c, plan2)).item).toBeNull();
  });

  it('something new at the account lets the done go: the deal\'s own activity after it, or a buyer message after it', async () => {
    const w = await world();
    await w.run(w.thread('deal:Boston Beer:2026-10-09'), 'DONE: sent Phil the four documents');
    const outcomes = await loadWorkOutcomes(w.c, ['Boston Beer'], NEXT_DAY);
    const moved = workDay(dealInput({ outcomes, inDeals: { status: 'complete', accounts: [{ accountName: 'Boston Beer', deals: [{ id: '901', name: 'YardFlow - Boston Beer', stage: 'Proposal', nextStep: 'Review the documents with legal', lastActivityAt: '2026-10-10T09:00:00.000Z' }] }] } }));
    expect(moved.cards.find((c) => c.accountName === 'Boston Beer')).toMatchObject({ tier: 'deal' });
    expect(itemsForDay(moved, '2026-10-10').map((i) => i.key)).toEqual(['deal:Boston Beer:2026-10-10']);
    const o = outcomes.get('Boston Beer') as WorkOutcome;
    expect(doneStillHolds(o, { buyerActivityAt: 0, dealActivity: ['2026-10-01T12:00:00.000Z'] })).toBe(true);
    expect(doneStillHolds(o, { buyerActivityAt: new Date('2026-10-10T08:00:00Z').getTime(), dealActivity: [] })).toBe(false);
  });

  it('a progress note records no outcome, and the next day the item is offered again', async () => {
    const w = await world();
    expect(await w.run(w.thread('deal:Boston Beer:2026-10-09'), 'DONE: will send Phil the documents tomorrow')).toMatchObject({ applied: true, effect: 'progress_noted' });
    const outcomes = await loadWorkOutcomes(w.c, ['Boston Beer'], NEXT_DAY);
    expect(outcomes.get('Boston Beer')).toBeUndefined();
    const plan2 = await planDay(w.c, { now: NEXT_DAY, load: async () => workDay(dealInput({ outcomes })) }, 'test');
    expect((await nextAssignableItem(w.c, plan2)).item?.key).toBe('deal:Boston Beer:2026-10-10');
  });

  it('the applied row of a completion DONE settles its key for good; the effect names what was recorded', async () => {
    const w = await world();
    await w.run(w.thread('first_touch:dec-1'), 'DONE: wrote Karen from my own mailbox');
    const row = w.db.store.gapAuditEvent.find((e) => e.kind === COMMAND_APPLIED && e.subject_id === 'first_touch:dec-1');
    expect(row?.payload).toMatchObject({ command: 'done', effect: 'account_done', note: 'wrote Karen from my own mailbox' });
  });
});

describe('a "Someone replied" the summary relabels is bound to its message, and a DONE settles it', () => {
  const summary = (over: Partial<PursuitSummary> = {}): PursuitSummary => ({ accountName: 'Boston Beer', state: 'replied', stateLine: 'Someone replied: Phil Savastano, Jun 12', person: { name: 'Phil Savastano', title: null }, blocker: null, coldTouchAllowed: false, nextText: null, at: '2026-10-10T12:55:00.000Z', reply: { id: 'm-phil', at: '2026-06-12T14:00:00.000Z' }, ...over });

  it('the relabelled deal card carries the reply\'s message: the plan key is reply:<message>, never a day key', () => {
    const day = workDay(dealInput({ summaries: new Map([['Boston Beer', summary()]]) }));
    const c = day.cards.find((x) => x.accountName === 'Boston Beer')!;
    expect(c).toMatchObject({ stateKind: 'replied', replyRef: { messageId: 'm-phil', at: '2026-06-12T14:00:00.000Z' } });
    expect(itemsForDay(day, '2026-10-10').map((i) => i.key)).toEqual(['reply:m-phil']);
  });

  it('a done outcome newer than the reply keeps the summary from relabelling; a reply newer than the done relabels', () => {
    const done: WorkOutcome = { accountName: 'Boston Beer', kind: 'done', reason: 'answered Phil', until: '2027-01-07T14:00:00.000Z', by: SELLER, at: '2026-10-09T14:00:00.000Z' };
    const settled = workDay(dealInput({ summaries: new Map([['Boston Beer', summary({ reply: { id: null, at: '2026-06-12T14:00:00.000Z' } })]]), outcomes: new Map([['Boston Beer', done]]) }));
    expect(settled.cards.find((x) => x.accountName === 'Boston Beer')?.stateKind).not.toBe('replied');
    expect(itemsForDay(settled, '2026-10-10').some((i) => i.key.startsWith('reply:'))).toBe(false);
    const newer = workDay(dealInput({ summaries: new Map([['Boston Beer', summary({ reply: { id: 'm-new', at: '2026-10-10T08:00:00.000Z' } })]]), outcomes: new Map([['Boston Beer', done]]) }));
    expect(newer.cards.find((x) => x.accountName === 'Boston Beer')?.stateKind).toBe('replied');
    expect(doneSettles(done, '2026-06-12T14:00:00.000Z')).toBe(true);
    expect(doneSettles({ ...done, kind: 'logged' }, '2026-06-12T14:00:00.000Z')).toBe(false);
    expect(doneSettles(done, null)).toBe(false);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function listPrisma(audit: any[]) {
  const T = (n: number) => new Date(Date.UTC(2026, 8, 23, 12, 0, n));
  const messages = [
    { id: 'm5', source: 'gmail', thread_id: 't5', from_email: 'jordan@acme.example', from_name: 'Jordan', subject: 'Re: yards', body_text: 'Yes we lose trailers every week. Call me.', body_html: null, snippet: null, received_at: T(5) },
    { id: 'm3', source: 'gmail', thread_id: 't3', from_email: 'jordan@acme.example', from_name: 'Jordan', subject: 'Re: yards', body_text: 'Thursday works.', body_html: null, snippet: null, received_at: T(3) },
  ];
  return {
    sequenceEnrollment: { findMany: async () => [{ id: 'E1', to_email: 'jordan@acme.example', status: 'paused', hypothesis_id: 'H1', persona_id: 7, account_name: 'Acme Logistics', hubspot_contact_id: null, enrolled_at: T(0) }] },
    persona: { findMany: async () => [] },
    inboundMessage: {
      findMany: async (q: any) => (q.where?.from_email?.in ? messages.filter((m) => q.where.from_email.in.includes(m.from_email)).slice(0, q.take) : []),
    },
    conversationDisposition: { findMany: async () => [] },
    gapAuditEvent: { findMany: async (q: any) => audit.filter((a) => (q.where.subject_id?.in ?? []).includes(a.subject_id) && (typeof q.where.kind === 'string' ? a.kind === q.where.kind : true)) },
  };
}
