// @vitest-environment node
/**
 * Knowledge program C3 + C4 (2026-10-09), end to end through applyCommand on the ledger fixture. What production did
 * on October 9: Casey replied "DONE: we have meeting scheduled for 10.14.2026. sent them a quick note today ..." on
 * the Kenco assignment; GAP recorded an account outcome "logged" with the words and nothing else, and item 2 never
 * arrived because NEXT is an explicit reply. Pinned here:
 *   C3  the same note now records a prepare_meeting commitment at Kenco (Oct 14, 8 am New York, the words as the
 *       basis, source seller_note with the Gmail message id), a `claims` sent record on the applied row, and the
 *       answer says "Recorded: a meeting Oct 14 (to prepare), and your note to them today (GAP checks Sent for it)";
 *       nothing is sent to a buyer and no contact is marked (the outcome stays "logged", self-reported)
 *   C4  the applied DONE advances: item 2 goes out in the same tick as its own email, the applied row carries
 *       `advancedTo`, the answer names it; a second DONE on the same item is refused and does not advance; SKIP and
 *       DEFER advance the same way; a progress-noted DONE does not; with nothing left the answer says so and the row
 *       says why (advanceReason none_left)
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyCommand, COMMAND_APPLIED, COMMAND_REFUSED, loadCommandContext } from '@/lib/gap/replies/commands-apply';
import { ASSIGNMENT_SENT } from '@/lib/gap/work/assignment';
import { ensureCommitment, loadCommitment, loadCommitments } from '@/lib/gap/work/commitments';
import { BRIEFING_SENT } from '@/lib/gap/work/briefing-send';
import { nyDayAt } from '@/lib/gap/work/dates';
import { loadWorkOutcomes } from '@/lib/gap/work/outcome';
import { planDay, type DayPlan } from '@/lib/gap/work/plan';
import type { WorkDay } from '@/lib/gap/work/list';
import type { SellerSettings } from '@/lib/gap/work/settings';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import type { GmailSendPayload } from '@/lib/email/gmail-sender';

const NOW = new Date('2026-10-09T14:00:00Z'); // Fri Oct 9, 10 am New York
const SELLER = 'casey@freightroll.com';
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };
const SETTINGS: SellerSettings = { briefingTo: SELLER, briefingHourNy: 7, commandSenders: [SELLER], mode: 'review', targets: {} };
const AUTH_OK = 'mx.google.com; spf=pass smtp.mailfrom=casey@freightroll.com; dmarc=pass (p=NONE) header.from=freightroll.com';
const OCT9_NOTE = 'DONE: we have meeting scheduled for 10.14.2026. sent them a quick note today to keep em warm and remind them';

/** Kenco first (a follow-up, an account item with Dave named), PepsiCo second (a prepared first touch), Kroger third (an obligation). */
function day(commitmentId: string): WorkDay {
  return {
    cards: [
      { accountName: 'Kenco', href: '/gap/accounts/kenco', lane: 'follow_up', stateKind: 'follow_up', state: 'Follow up due', why: 'A follow-up is due', person: { name: 'Dave Kiesling', title: 'VP Operations' }, next: null, blocker: null, index: 0, source: 'pursuit', tier: 'follow_up' },
      { accountName: 'PepsiCo', href: '/gap/accounts/pepsico', lane: 'ready', stateKind: 'ready', state: 'Ready for a first touch', why: 'A prepared first touch', person: { name: 'Karen Ortiz', title: null }, next: { label: 'Send email', href: '/gap/pack/dec-1' }, blocker: null, index: 1, source: 'pursuit', tier: 'ready' },
      { accountName: 'Kroger', href: '/gap/accounts/kroger', lane: 'deals', stateKind: 'in_deal', state: 'In a deal', why: 'A buyer commitment is due', person: null, next: null, blocker: null, index: 2, source: 'pursuit', tier: 'commitment', obligations: [{ key: commitmentId, commitmentId, kind: 'deliverable', tier: 'commitment', title: 'Send the dock comparison', line: 'Due today', dueAt: null, dueDay: '2026-10-09', person: { name: 'Joey', email: 'joey@kroger.com' }, basis: null, href: null, label: null, canComplete: true }] },
    ],
    waiting: [],
    snoozed: [],
    counts: { needsYou: 3, parked: 0, obligationsDue: 1, waiting: 0, snoozed: 0 },
  };
}

let seq = 0;
function msg(over: Partial<MailboxMessage> = {}): MailboxMessage {
  seq += 1;
  return { id: `cmd-${seq}`, threadId: 'th-item-0', rfcMessageId: `<cmd-${seq}@mail>`, fromEmail: SELLER, fromName: 'Casey', subject: 'Re: GAP 1 of 3', snippet: '', bodyText: 'SKIP', rawText: 'SKIP', bodyHtml: '', deliveryStatus: null, labelIds: ['INBOX'], receivedAt: NOW, headers: { 'Authentication-Results': AUTH_OK }, ...over };
}

/** A day planned and STARTED from the briefing: Kenco is assigned in thread th-item-0; PepsiCo and Kroger are not yet. */
async function started() {
  const db = ledgerDb({ accounts: ['Kenco', 'PepsiCo', 'Kroger'] }, NOW);
  const c = db.client();
  const made = await ensureCommitment(c, { accountName: 'Kroger', kind: 'deliverable', title: 'Send the dock comparison', source: { kind: 'capture', id: 'cap:1' } }, { actor: SELLER, now: NOW });
  const commitmentId = made.ok ? made.commitment.commitmentId : '';
  const plan: DayPlan = await planDay(c, { now: NOW, load: async () => day(commitmentId) }, 'test');
  await c.gapAuditEvent.create({ data: { kind: BRIEFING_SENT, actor: 'test', subject_type: 'work_day', subject_id: '2026-10-09', payload: { to: SELLER, gmailThreadId: 'th-brief', dayToken: 'daytok', items: 3 } } });
  let n = 0;
  const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async (p) => {
    n += 1;
    return { provider: 'gmail', id: `gm-${n}`, threadId: p.threadId ?? `th-item-${n - 1}` };
  });
  // PepsiCo's pack renders a queued email, so its assignment says "a prepared first touch".
  const pack = vi.fn(async () => ({ rendered: { queued: { subject: 'Yards at PepsiCo', body: 'Karen, a line about the gate.' } }, contentHash: 'h1', emailReady: true, persona: { email: 'karen@pepsico.com' } }));
  const deps = { send, askContext: vi.fn(async () => null), pack };
  const run = async (m: MailboxMessage) => {
    const ctx = await loadCommandContext(db.client(), SETTINGS, m.receivedAt);
    return applyCommand(db.client(), { m, ctx, now: m.receivedAt, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron:gap-mailbox' }, deps);
  };
  const start = await run(msg({ threadId: 'th-brief', bodyText: 'START', rawText: 'START' }));
  expect(start).toMatchObject({ applied: true, effect: 'assignment_sent', itemKey: plan.items[0].key });
  const assignments = () => db.store.gapAuditEvent.filter((e) => e.kind === ASSIGNMENT_SENT).map((e) => ({ key: e.subject_id, threadId: e.payload.gmailThreadId as string }));
  expect(assignments()).toEqual([{ key: plan.items[0].key, threadId: 'th-item-0' }]);
  send.mockClear();
  return { db, c, plan, commitmentId, send, run, assignments, applied: () => db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_APPLIED) };
}

describe("C3: Casey's October 9 note on the Kenco assignment becomes records", () => {
  it('a meeting Oct 14 to prepare, a sent-note claim, the outcome logged (self-reported), the answer says what was recorded; nothing to a buyer', async () => {
    const w = await started();
    const m = msg({ threadId: 'th-item-0', bodyText: OCT9_NOTE, rawText: OCT9_NOTE });
    const r = await w.run(m);
    expect(r).toMatchObject({ applied: true, command: 'done', effect: 'account_logged', basis: 'self_reported', outcome: 'accepted', source: { accountName: 'Kenco' }, advancedTo: w.plan.items[1].key, next: 'The next item arrives as its own email; answer it there.' });
    // The outcome: logged, the words, nothing marked as contact.
    expect((await loadWorkOutcomes(w.c, ['Kenco'], NOW)).get('Kenco')).toMatchObject({ kind: 'logged' });
    // The meeting: one prepare_meeting commitment at Kenco, waiting, due 8 am New York Oct 14, the words as the basis, keyed by the message and the day.
    const kenco = await loadCommitments(w.c, { accountNames: ['Kenco'] });
    expect(kenco).toHaveLength(1);
    expect(kenco[0]).toMatchObject({
      kind: 'prepare_meeting',
      status: 'waiting',
      title: 'Prepare the meeting with Dave Kiesling (Oct 14)',
      dueAt: nyDayAt('2026-10-14', 8).toISOString(),
      basis: 'Your note of Oct 9: we have meeting scheduled for 10.14.2026. sent them a quick note today to keep em warm and remind them',
      person: { personaId: null, name: 'Dave Kiesling', email: null },
      source: { kind: 'seller_note', id: `${m.id}:2026-10-14` },
    });
    // The applied row: the claim, the meeting, the advance.
    const row = w.applied().find((e) => e.payload.effect === 'account_logged');
    expect(row?.payload).toMatchObject({
      command: 'done',
      note: 'we have meeting scheduled for 10.14.2026. sent them a quick note today to keep em warm and remind them',
      basis: 'self_reported',
      claims: [{ kind: 'sent', who: 'them', when: '2026-10-09', channel: 'email', words: 'sent them a quick note today to keep em warm and remind them' }],
      meetings: [{ day: '2026-10-14', commitmentId: kenco[0].commitmentId, created: true, title: 'Prepare the meeting with Dave Kiesling (Oct 14)' }],
      advancedTo: w.plan.items[1].key,
      gmailMessageId: m.id,
    });
    // The answer, in the item's thread, after the next assignment went out.
    const texts = w.send.mock.calls.map((c) => c[0]);
    expect(texts.map((t) => t.threadId)).toEqual([undefined, 'th-item-0']);
    expect(texts[1].text).toBe('Logged, by your word: Kenco. Recorded: a meeting Oct 14 (to prepare), and your note to them today (GAP checks Sent for it). GAP counts what it can prove separately. Next: PepsiCo, a prepared first touch, arriving as its own email.');
    // Every send went to the seller (the assignment and the answer); nothing went to a buyer.
    expect(texts.every((t) => t.to === SELLER && t.purpose === 'OPERATOR_ALERT')).toBe(true);
  });

  it('the same note read a second time (the same Gmail id) is a duplicate and writes nothing; a DONE on an obligation records the meeting too', async () => {
    const w = await started();
    const m = msg({ threadId: 'th-item-0', bodyText: OCT9_NOTE, rawText: OCT9_NOTE });
    await w.run(m);
    expect(await w.run(m)).toMatchObject({ applied: false, reason: 'duplicate_message' });
    expect(await loadCommitments(w.c, { accountNames: ['Kenco'] })).toHaveLength(1);
    // Kroger's obligation (assigned by the advance chain): DONE with a meeting completes it and records the meeting at Kroger.
    const pepsi = w.assignments().find((a) => a.key === w.plan.items[1].key)!;
    await w.run(msg({ threadId: pepsi.threadId, bodyText: 'SKIP', rawText: 'SKIP' }));
    const kroger = w.assignments().find((a) => a.key === w.plan.items[2].key)!;
    const done = await w.run(msg({ threadId: kroger.threadId, bodyText: 'DONE: sent Joey the comparison, call Oct 20', rawText: 'DONE: sent Joey the comparison, call Oct 20' }));
    expect(done).toMatchObject({ applied: true, effect: 'commitment_done', advancedTo: null });
    expect((await loadCommitment(w.c, w.commitmentId))?.status).toBe('done');
    const krogerCs = await loadCommitments(w.c, { accountNames: ['Kroger'] });
    // The plan item names Joey (the obligation line's person), so the meeting is with Joey; the stored deliverable carried no address.
    expect(krogerCs.find((c) => c.kind === 'prepare_meeting')).toMatchObject({ status: 'waiting', title: 'Prepare the meeting with Joey (Oct 20)', dueAt: nyDayAt('2026-10-20', 8).toISOString(), person: { personaId: null, name: 'Joey', email: null }, source: { kind: 'seller_note' } });
    expect(w.send.mock.calls.at(-1)?.[0].text).toBe("Done, by your word: Send the dock comparison at Kroger. Recorded: a meeting Oct 20 (to prepare), and your note to Joey today (GAP checks Sent for it). Nothing left on today's list has gone unassigned. Open Work in GAP for what is waiting and parked.");
  });
});

describe('C4: an applied SKIP, DEFER or DONE advances to the next item in the same tick', () => {
  it('DONE advances to item 2 (sent as its own email, recorded on the row); a second DONE on the same item is refused and does not advance; with nothing left the answer says so', async () => {
    const w = await started();
    const done = await w.run(msg({ threadId: 'th-item-0', bodyText: 'DONE: emailed Dave', rawText: 'DONE: emailed Dave' }));
    expect(done).toMatchObject({ applied: true, effect: 'account_logged', advancedTo: w.plan.items[1].key });
    expect(w.assignments().map((a) => a.key), 'item 2 went out').toEqual([w.plan.items[0].key, w.plan.items[1].key]);
    expect(w.send.mock.calls[0][0].subject, 'the assignment email').toMatch(/^GAP 2 of 3, PepsiCo/);
    expect(w.send.mock.calls[1][0].text).toMatch(/Next: PepsiCo, a prepared first touch, arriving as its own email\.$/);
    // A second DONE on the same item: refused, no third assignment, the row says already applied.
    const again = await w.run(msg({ threadId: 'th-item-0', bodyText: 'DONE: emailed Dave again', rawText: 'DONE: emailed Dave again' }));
    expect(again).toMatchObject({ applied: false, reason: 'already_applied' });
    expect(w.assignments(), 'no advance on a refusal').toHaveLength(2);
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_REFUSED)).toHaveLength(1);
    // DONE on item 2 advances to item 3; DONE on item 3 finds nothing left and says so.
    const pepsi = w.assignments()[1];
    const second = await w.run(msg({ threadId: pepsi.threadId, bodyText: 'DONE: sent Karen the note', rawText: 'DONE: sent Karen the note' }));
    expect(second).toMatchObject({ applied: true, advancedTo: w.plan.items[2].key });
    expect(w.send.mock.calls.at(-1)?.[0].text).toMatch(/Next: Kroger, Send the dock comparison, arriving as its own email\.$/);
    const kroger = w.assignments()[2];
    const last = await w.run(msg({ threadId: kroger.threadId, bodyText: 'DONE: sent Joey the comparison', rawText: 'DONE: sent Joey the comparison' }));
    expect(last).toMatchObject({ applied: true, effect: 'commitment_done', advancedTo: null, next: 'Reply NEXT for the next item.' });
    expect(w.applied().find((e) => e.payload.effect === 'commitment_done')?.payload).toMatchObject({ advancedTo: null, advanceReason: 'none_left' });
    expect(w.send.mock.calls.at(-1)?.[0].text).toMatch(/Nothing left on today's list has gone unassigned\./);
    expect(w.assignments()).toHaveLength(3);
  });

  it('SKIP and DEFER advance the same way; a progress-noted DONE does not advance and the item stays open', async () => {
    const w = await started();
    const progress = await w.run(msg({ threadId: 'th-item-0', bodyText: 'DONE: researching catalysts', rawText: 'DONE: researching catalysts' }));
    expect(progress).toMatchObject({ applied: true, effect: 'progress_noted' });
    expect(progress, 'no advance on progress').not.toHaveProperty('advancedTo');
    expect(w.assignments(), 'nothing new went out').toHaveLength(1);
    const skip = await w.run(msg({ threadId: 'th-item-0', bodyText: 'SKIP travel', rawText: 'SKIP travel' }));
    expect(skip).toMatchObject({ applied: true, effect: 'account_skipped', advancedTo: w.plan.items[1].key });
    expect(w.send.mock.calls.at(-1)?.[0].text).toBe('Skipped for today: Kenco. It returns tomorrow. Next: PepsiCo, a prepared first touch, arriving as its own email.');
    expect(w.applied().find((e) => e.payload.effect === 'account_skipped')?.payload).toMatchObject({ reason: 'travel', advancedTo: w.plan.items[1].key });
    const pepsi = w.assignments()[1];
    const defer = await w.run(msg({ threadId: pepsi.threadId, bodyText: 'DEFER Oct 14', rawText: 'DEFER Oct 14' }));
    expect(defer).toMatchObject({ applied: true, effect: 'account_snoozed', until: '2026-10-14', advancedTo: w.plan.items[2].key });
    expect(w.send.mock.calls.at(-1)?.[0].text).toBe('Deferred to 2026-10-14: PepsiCo. Next: Kroger, Send the dock comparison, arriving as its own email.');
    expect(w.applied().filter((e) => typeof e.payload.advancedTo === 'string')).toHaveLength(2);
  });

  it('a failed next send is recorded on the row (advancedTo null, send_failed) and the applied command still stands', async () => {
    const w = await started();
    w.send.mockImplementationOnce(async () => {
      throw new Error('gmail 503');
    });
    const r = await w.run(msg({ threadId: 'th-item-0', bodyText: 'DONE: emailed Dave', rawText: 'DONE: emailed Dave' }));
    expect(r).toMatchObject({ applied: true, effect: 'account_logged', advancedTo: null, next: 'Reply NEXT for the next item.' });
    expect((await loadWorkOutcomes(w.c, ['Kenco'], NOW)).get('Kenco')?.kind).toBe('logged');
    expect(w.applied().find((e) => e.payload.effect === 'account_logged')?.payload).toMatchObject({ advancedTo: null, advanceReason: 'send_failed' });
    expect(w.send.mock.calls.at(-1)?.[0].text).toMatch(/GAP could not send the next item \(PepsiCo: gmail 503\)\. Reply NEXT to try again\.$/);
    expect(w.assignments(), 'the failed send recorded no assignment').toHaveLength(1);
  });
});
