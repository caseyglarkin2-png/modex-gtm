// @vitest-environment node
/**
 * GUI-10 (the Gmail action UI audit, 2026-10-10): reconciliation, verified. A later completion or send must update the
 * existing item, never duplicate a send or a task, and a receipt must say what the provider confirmed.
 *   (a) a DONE after a real send completes the item once; a retry of the same tick (the same Gmail message) writes no
 *       second row and sends no second answer; a DONE that reports a send becomes a claim on the row, never a task
 *   (b) sendAssignment of the same (item, revision) twice sends once
 *   (c) a receipt names the provider id when Gmail confirmed the send and says "recorded, not confirmed" when it
 *       did not; the activity projection reads a sent row the same way (provider with the id, self-reported without)
 *   (d) a later Gmail Sent to the same person updates the person's state (answer no longer owed, the last send moved),
 *       and adds no commitment
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyCommand, COMMAND_APPLIED, COMMAND_REFUSED, loadCommandContext } from '@/lib/gap/replies/commands-apply';
import { ASSIGNMENT_SENT, sendAssignment } from '@/lib/gap/work/assignment';
import { projectActivity } from '@/lib/gap/work/activity';
import { BRIEFING_SENT } from '@/lib/gap/work/briefing-send';
import { COMMITMENT_EVENT } from '@/lib/gap/work/commitment-model';
import { ensureCommitment, loadCommitment } from '@/lib/gap/work/commitments';
import { peopleState, type PersonCommitment, type StateEvent } from '@/lib/gap/work/people-state';
import { planDay, type DayPlan } from '@/lib/gap/work/plan';
import { MANUAL_SENT, DIRECT_SENT } from '@/lib/gap/execution/draft-ledger';
import type { WorkDay } from '@/lib/gap/work/list';
import type { SellerSettings } from '@/lib/gap/work/settings';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import type { GmailSendPayload } from '@/lib/email/gmail-sender';

const NOW = new Date('2026-10-08T14:00:00Z');
const SELLER = 'casey@freightroll.com';
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };
const SETTINGS: SellerSettings = { briefingTo: SELLER, briefingHourNy: 7, commandSenders: [SELLER], mode: 'review', targets: {} };
const AUTH_OK = 'mx.google.com; spf=pass smtp.mailfrom=casey@freightroll.com; dmarc=pass (p=NONE) header.from=freightroll.com';

function day(commitmentId: string): WorkDay {
  return {
    cards: [
      { accountName: 'PepsiCo', href: '/gap/accounts/pepsico', lane: 'ready', stateKind: 'ready', state: 'Ready for a first touch', why: 'A prepared first touch', person: { name: 'Karen Ortiz', title: null }, next: { label: 'Send email', href: '/gap/pack/dec-1' }, blocker: null, index: 0, source: 'pursuit', tier: 'ready' },
      { accountName: 'Kroger', href: '/gap/accounts/kroger', lane: 'deals', stateKind: 'in_deal', state: 'In a deal', why: 'A buyer commitment is due', person: null, next: null, blocker: null, index: 1, source: 'pursuit', tier: 'commitment', obligations: [{ key: commitmentId, commitmentId, kind: 'deliverable', tier: 'commitment', title: 'Send the dock comparison', line: 'Due today', dueAt: null, dueDay: '2026-10-08', person: { name: 'Joey', email: 'joey@kroger.com' }, basis: null, href: null, label: null, canComplete: true }] },
    ],
    waiting: [],
    snoozed: [],
    counts: { needsYou: 2, parked: 0, obligationsDue: 1, waiting: 0, snoozed: 0 },
  };
}

function msg(over: Partial<MailboxMessage> = {}): MailboxMessage {
  return { id: `cmd-${Math.random().toString(16).slice(2, 10)}`, threadId: 'th-item-1', rfcMessageId: '<cmd@mail>', fromEmail: SELLER, fromName: 'Casey', subject: 'Re: GAP 2 of 2', snippet: '', bodyText: 'DONE: sent Joey the comparison', rawText: '', bodyHtml: '', deliveryStatus: null, labelIds: ['INBOX'], receivedAt: NOW, headers: { 'Authentication-Results': AUTH_OK }, ...over };
}

/** Two items planned and both assigned (real sends with Gmail ids), the briefing sent. */
async function world(sendId: string | null = 'gm') {
  const db = ledgerDb({ accounts: ['PepsiCo', 'Kroger'] }, NOW);
  const c = db.client();
  const made = await ensureCommitment(c, { accountName: 'Kroger', kind: 'deliverable', title: 'Send the dock comparison', source: { kind: 'capture', id: 'cap:1' } }, { actor: SELLER, now: NOW });
  const commitmentId = made.ok ? made.commitment.commitmentId : '';
  const plan: DayPlan = await planDay(c, { now: NOW, load: async () => day(commitmentId) }, 'test');
  let n = 0;
  const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async (p) => {
    n += 1;
    return { provider: 'gmail', id: sendId ? `${sendId}-${n}` : null, threadId: p.threadId ?? `th-item-${n - 1}` };
  });
  const deps = { send, askContext: vi.fn(async () => null), pack: vi.fn(async () => null) };
  const common = { revision: 0, to: SELLER, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW, actor: 'test' };
  return { db, c, plan, commitmentId, send, deps, common };
}

describe('GUI-10 (a): a DONE after a real send completes the item once; the same tick replayed writes nothing', () => {
  it('one applied row, one answer; the replay is duplicate_message with no row and no send; the sent claim is a claim on the row, not a task', async () => {
    const w = await world();
    await sendAssignment(w.c, { ...w.common, plan: w.plan, item: w.plan.items[0] }, w.deps);
    await sendAssignment(w.c, { ...w.common, plan: w.plan, item: w.plan.items[1] }, w.deps);
    await w.c.gapAuditEvent.create({ data: { kind: BRIEFING_SENT, actor: 'test', subject_type: 'work_day', subject_id: '2026-10-08', payload: { to: SELLER, gmailThreadId: 'th-brief', dayToken: 'daytok', items: 2 } } });
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === ASSIGNMENT_SENT).map((e) => e.payload.gmailMessageId), 'the sends were real (Gmail ids)').toEqual(['gm-1', 'gm-2']);
    w.send.mockClear();
    const ctx = await loadCommandContext(w.c, SETTINGS, NOW);
    const m = msg({ bodyText: 'DONE: sent Joey the comparison today' });
    const commitmentsBefore = w.db.store.gapAuditEvent.filter((e) => e.kind === COMMITMENT_EVENT).length;
    const input = { ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron:gap-mailbox' };
    const first = await applyCommand(w.db.client(), { m, ...input }, w.deps);
    expect(first).toMatchObject({ applied: true, command: 'done', effect: 'commitment_done', basis: 'self_reported', itemKey: w.plan.items[1].key });
    expect((await loadCommitment(w.c, w.commitmentId))?.status).toBe('done');
    const applied = () => w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_APPLIED && e.payload.effect === 'commitment_done');
    expect(applied()).toHaveLength(1);
    expect(applied()[0].payload.claims, 'the reported send is a claim on the row, labelled self-reported').toHaveLength(1);
    expect(applied()[0].payload.claims[0]).toMatchObject({ kind: 'sent', who: 'Joey', channel: 'email' });
    expect(applied()[0].payload.basis).toBe('self_reported');
    expect(w.send).toHaveBeenCalledTimes(1);
    expect(w.send.mock.calls[0][0].text).toMatch(/^Done, by your word: Send the dock comparison at Kroger\. Recorded: your note to Joey today \(GAP checks Sent for it\)\./);
    // The same tick again (an overlapping cron run, a retry after a lost answer): nothing written, nothing sent.
    const replay = await applyCommand(w.db.client(), { m, ...input }, w.deps);
    expect(replay).toMatchObject({ applied: false, command: 'done', reason: 'duplicate_message', outcome: 'refused' });
    expect(applied()).toHaveLength(1);
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_REFUSED), 'a replay writes no refused row either').toHaveLength(0);
    expect(w.send).toHaveBeenCalledTimes(1);
    // A second DONE in a NEW message is refused already_applied, still one applied row.
    const second = await applyCommand(w.db.client(), { m: msg({ bodyText: 'DONE: sent it again' }), ...input }, w.deps);
    expect(second).toMatchObject({ applied: false, reason: 'already_applied' });
    expect(applied()).toHaveLength(1);
    // No task was created by the reported send: the commitment ledger grew only by the transition to done.
    const after = w.db.store.gapAuditEvent.filter((e) => e.kind === COMMITMENT_EVENT);
    expect(after.length - commitmentsBefore).toBe(1);
    expect(after.at(-1)?.payload.op).toBe('status');
    expect(after.at(-1)?.payload.commitment?.status).toBe('done');
  });
});

describe('GUI-10 (b): the same (item, revision) is sent once', () => {
  it('the second sendAssignment answers already_sent, calls Gmail once and leaves one assignment row; an explicit resend is the only second send', async () => {
    const w = await world();
    const first = await sendAssignment(w.c, { ...w.common, plan: w.plan, item: w.plan.items[0] }, w.deps);
    expect(first).toMatchObject({ sent: true, gmailMessageId: 'gm-1' });
    const again = await sendAssignment(w.db.client(), { ...w.common, plan: w.plan, item: w.plan.items[0] }, w.deps);
    expect(again).toEqual({ sent: false, reason: 'already_sent' });
    expect(w.send).toHaveBeenCalledTimes(1);
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === ASSIGNMENT_SENT)).toHaveLength(1);
    const resend = await sendAssignment(w.db.client(), { ...w.common, plan: w.plan, item: w.plan.items[0], resend: true }, w.deps);
    expect(resend).toMatchObject({ sent: true });
    expect(w.send).toHaveBeenCalledTimes(2);
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === ASSIGNMENT_SENT).map((e) => e.payload.resend)).toEqual([false, true]);
  });
});

describe('GUI-10 (c): receipts say what the provider confirmed', () => {
  async function startFrom(sendId: string | null) {
    const w = await world(sendId);
    // Southern Glazer's ahead of the two, research-shaped, so START answers in words beside the assignment it sends.
    const db = ledgerDb({ accounts: ["Southern Glazer's", 'PepsiCo', 'Kroger'] }, NOW);
    const c = db.client();
    const made = await ensureCommitment(c, { accountName: 'Kroger', kind: 'deliverable', title: 'Send the dock comparison', source: { kind: 'capture', id: 'cap:3' } }, { actor: SELLER, now: NOW });
    const base = day(made.ok ? made.commitment.commitmentId : '');
    const sgws = { accountName: "Southern Glazer's", href: '/gap/accounts/southern-glazers', lane: 'follow_up', stateKind: 'follow_up', state: 'Reminder: Follow up with Diego Fonseca when they are back', why: 'Out of office, May 26', person: { name: 'Diego Fonseca', title: null }, next: null, blocker: null, index: 0, source: 'pursuit', tier: 'follow_up' } as WorkDay['cards'][number];
    const plan = await planDay(c, { now: NOW, load: async () => ({ ...base, cards: [sgws, ...base.cards] }) }, 'test');
    await c.gapAuditEvent.create({ data: { kind: BRIEFING_SENT, actor: 'test', subject_type: 'work_day', subject_id: '2026-10-08', payload: { to: SELLER, gmailThreadId: 'th-brief', dayToken: 'daytok', items: 3 } } });
    const askContext = vi.fn(async (_p: unknown, accountName: string) => (accountName.startsWith('Southern') ? { accountName, state: { state: 'follow_up', stateLine: 'They were out of office in May.', blocker: null, next: 'Research the catalysts before reaching Diego.', coldTouchAllowed: false }, people: [], setAside: null, story: [], opening: null, otherStories: [], buyerSaid: [] } : null));
    const deps = { ...w.deps, askContext };
    const ctx = await loadCommandContext(c, SETTINGS, NOW);
    const r = await applyCommand(db.client(), { m: msg({ threadId: 'th-brief', bodyText: 'START' }), ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' }, deps);
    return { r, db, plan, send: w.send };
  }

  it('Gmail answered an id: the applied row says provider_confirmed with the id and the answer names it', async () => {
    const { r, db, send } = await startFrom('gm');
    expect(r).toMatchObject({ applied: true, effect: 'assignment_sent' });
    const row = db.store.gapAuditEvent.find((e) => e.kind === COMMAND_APPLIED && e.payload.effect === 'assignment_sent');
    expect(row?.payload).toMatchObject({ receipt: 'provider_confirmed', gmailMessageId: 'gm-1', sent: true });
    // The walk fix (2026-10-10): the walk takes Kroger's due commitment (item 3) before PepsiCo's first touch.
    expect(send.mock.calls[1][0].text).toContain('Sent item 3, Kroger: Send the dock comparison, as its own email (Gmail message gm-1).');
  });

  it('Gmail answered no id: the row says recorded_not_confirmed and the answer says "recorded, not confirmed by Gmail"', async () => {
    const { r, db, send } = await startFrom(null);
    expect(r).toMatchObject({ applied: true, effect: 'assignment_sent' });
    const row = db.store.gapAuditEvent.find((e) => e.kind === COMMAND_APPLIED && e.payload.effect === 'assignment_sent');
    expect(row?.payload).toMatchObject({ receipt: 'recorded_not_confirmed', gmailMessageId: null, sent: true });
    expect(send.mock.calls[1][0].text).toContain('Sent item 3, Kroger: Send the dock comparison, as its own email (recorded, not confirmed by Gmail).');
  });

  it('the activity projection: a sent row with a Gmail id is provider-confirmed with the id as evidence; a by-hand record without one is self-reported and says so', () => {
    const base = { subject_type: 'routing_decision', subject_id: 'dec-1', actor: 'casey', created_at: NOW };
    const confirmed = projectActivity({ ...base, kind: DIRECT_SENT, payload: { recipient: 'karen@pepsico.com', gmailMessageId: 'gm-77', stepIndex: 0 } });
    expect(confirmed).toMatchObject({ kind: 'message_sent', basis: 'provider', evidence: 'gm-77' });
    const byHand = projectActivity({ ...base, kind: MANUAL_SENT, payload: { recipient: 'karen@pepsico.com', stepIndex: 0 } });
    expect(byHand).toMatchObject({ kind: 'message_sent', basis: 'self_reported', evidence: null });
    expect(byHand?.line).toContain('(said by hand, no Gmail id)');
    const byHandFound = projectActivity({ ...base, kind: MANUAL_SENT, payload: { recipient: 'karen@pepsico.com', gmailMessageId: 'gm-78', stepIndex: 0 } });
    expect(byHandFound).toMatchObject({ kind: 'message_sent', basis: 'provider', evidence: 'gm-78' });
  });
});

describe('GUI-10 (d): a later Gmail Sent to the same person updates the existing state, never a task', () => {
  const ev = (over: Partial<StateEvent> & { id: string; at: string; direction: StateEvent['direction'] }): StateEvent => ({ type: 'message', isDraft: false, from: null, to: [], purpose: null, ...over });
  const joey = 'joey@kroger.com';
  const commitments: PersonCommitment[] = [{ id: 'c-1', sourceId: 'in-1', person: joey, title: 'Send the dock comparison', kind: 'deliverable', status: 'waiting' } as unknown as PersonCommitment];

  it('an inbound buyer message owes an answer until our later send; the send moves lastOutboundAt and settles the answer; the commitment list is unchanged; a draft changes nothing', () => {
    const inbound = ev({ id: 'in-1', at: '2026-10-06T15:00:00.000Z', direction: 'inbound', from: joey, to: [SELLER], purpose: 'buyer_conversation' });
    const before = peopleState([inbound], NOW, { ownAddresses: new Set([SELLER]), commitments }).get(joey)!;
    expect(before.answerOwed).toMatchObject({ owed: true, messageId: 'in-1' });
    expect(before.lastOutboundAt).toBeNull();
    expect(before.commitments.map((c) => c.id)).toEqual(['c-1']);
    // A draft is never a send.
    const draft = ev({ id: 'd-1', at: '2026-10-07T09:00:00.000Z', direction: 'outbound', from: SELLER, to: [joey], isDraft: true, type: 'draft' });
    const drafted = peopleState([inbound, draft], NOW, { ownAddresses: new Set([SELLER]), commitments }).get(joey)!;
    expect(drafted.answerOwed.owed).toBe(true);
    expect(drafted.lastOutboundAt).toBeNull();
    expect(drafted.lastDraftAt).toBe('2026-10-07T09:00:00.000Z');
    // The later Sent (found in Gmail) to the same person: the state moves, nothing is added.
    const sent = ev({ id: 'out-1', at: '2026-10-07T16:00:00.000Z', direction: 'outbound', from: SELLER, to: [joey], providerIds: ['gm-9'] });
    const after = peopleState([inbound, draft, sent], NOW, { ownAddresses: new Set([SELLER]), commitments }).get(joey)!;
    expect(after.answerOwed).toMatchObject({ owed: false, since: null, messageId: null });
    expect(after.answerOwed.basis).toBe('they wrote Oct 6 and we sent Oct 7 after it');
    expect(after.lastOutboundAt).toBe('2026-10-07T16:00:00.000Z');
    expect(after.quiet).toMatchObject({ quiet: false, since: '2026-10-07T16:00:00.000Z' });
    expect(after.commitments.map((c) => c.id), 'the same one commitment; the send created no task').toEqual(['c-1']);
    expect(peopleState([inbound, draft, sent], NOW, { ownAddresses: new Set([SELLER]), commitments }).size, 'one person, one state').toBe(1);
  });
});
