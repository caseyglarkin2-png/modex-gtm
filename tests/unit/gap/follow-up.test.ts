/**
 * R43 (GAP OS execution recovery): follow-up execution and recovery. The follow-up reads the PERSON's actual history
 * and offers the prepared follow-up or a justified wait; a saved Gmail draft is never a send; an unknown send is never
 * resent; a hold stops it; a follow-up sent by hand from the GAP mailbox is reconciled from Sent (the obligation
 * closes with the message as proof) and blocks a second follow-up at the click.
 */
import { describe, expect, it } from 'vitest';
import { planFollowUp, type FollowUpHistory } from '@/lib/gap/execution/follow-up-plan';
import { reconcileFollowUpsFromSent } from '@/lib/gap/execution/follow-up-load';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { DIRECT_SENT } from '@/lib/gap/execution/draft-ledger';
import { ensureCommitment, loadCommitments } from '@/lib/gap/work/commitments';
import { nyDayAt } from '@/lib/gap/work/dates';
import { workDay } from '@/lib/gap/work/list';
import type { Commitment } from '@/lib/gap/work/commitment-model';
import { ledgerDb } from './fixtures/ledger-db';
import { baseDeps, db, HC, NOW as SELLER_NOW, prismaOf } from './fixtures/seller-db';

const NOW = new Date('2026-10-12T15:00:00Z'); // Mon Oct 12, 11 am New York
const followUp = (over: Partial<Commitment> = {}): Commitment => ({
  commitmentId: 'send:k0',
  accountName: 'Fedex Scratch Co',
  kind: 'follow_up',
  title: 'Follow up with Glen Scratch',
  basis: null,
  owner: 'casey@freightroll.com',
  dueAt: nyDayAt('2026-10-12').toISOString(),
  person: { personaId: 7, name: 'Glen Scratch', email: 'glen@fedex.example.com' },
  dealId: null,
  threadId: null,
  status: 'waiting',
  snoozeUntil: null,
  dependency: "Glen's reply",
  proof: null,
  reason: null,
  source: { kind: 'send', id: 'k0' },
  detail: { stepIndex: 1, decisionId: 'dec-1', sentAt: '2026-10-06T15:00:00Z' },
  createdAt: '2026-10-06T15:05:00Z',
  createdBy: 'gap:work',
  updatedAt: '2026-10-06T15:05:00Z',
  updatedBy: 'gap:work',
  ...over,
});
const history = (over: Partial<FollowUpHistory> = {}): FollowUpHistory => ({ sent: [{ stepIndex: 0, sentAt: '2026-10-06T15:00:00Z', subject: 'Doors versus spots', senderIdentity: 'casey@yardflow.ai', gmailThreadId: 'thr-1', gmailSentMessageId: 'm0' }], drafts: [], unresolvedClaims: [], ...over });
const plan = (over: Partial<Parameters<typeof planFollowUp>[0]> = {}) => planFollowUp({ commitment: followUp(), history: history(), nextStepHasCopy: false, hold: null, now: NOW, mailbox: 'casey@yardflow.ai', ...over });

describe('the follow-up plan reads the person\'s actual history (R43)', () => {
  it('due with copy for the next step: prepare it on the existing card; due with none: follow up by hand in the same thread', () => {
    expect(plan({ nextStepHasCopy: true })).toMatchObject({ action: 'prepare', href: '/gap?lane=follow_up&open=dec-1', label: 'Prepare touch 2', lastTouch: { stepIndex: 0, from: 'casey@yardflow.ai', threadId: 'thr-1' } });
    expect(plan()).toMatchObject({ action: 'by_hand', label: 'Follow up in Gmail', href: 'https://mail.google.com/mail/u/0/?authuser=casey%40yardflow.ai#all/thr-1' });
    expect(plan().line).toBe('Touch 2 is due and this family has no follow-up copy yet: follow up by hand in the thread, then mark it done (GAP also finds it in Sent).');
  });
  it('not due: a justified wait that names the last touch; a saved draft is never a send; an unknown send is never resent; a hold stops it; a later touch already out completes it', () => {
    expect(plan({ commitment: followUp({ dueAt: nyDayAt('2026-10-14').toISOString() }) })).toMatchObject({ action: 'wait', line: 'Wait until Oct 14: no reply from Glen Scratch yet since touch 1 on Oct 6, and the follow-up interval has not passed.' });
    expect(plan({ history: history({ drafts: [{ fate: 'drafted', drafted: { stepIndex: 1, createdAt: '2026-10-11T15:00:00Z', gmailDraftId: 'r-1' } }] }) })).toMatchObject({ action: 'draft_saved', label: 'Open Gmail drafts', line: 'A Gmail draft of touch 2 is saved, not sent (yesterday). Send or delete it in Gmail; GAP counts it only once Gmail shows it sent.' });
    // A draft of touch 2 that WAS sent is a send, not a saved draft.
    expect(plan({ history: history({ sent: [...history().sent, { stepIndex: 1, sentAt: '2026-10-11T16:00:00Z', subject: 'Re: Doors versus spots', senderIdentity: 'casey@yardflow.ai', gmailThreadId: 'thr-1', gmailSentMessageId: 'm1' }], drafts: [{ fate: 'sent', drafted: { stepIndex: 1, createdAt: '2026-10-11T15:00:00Z', gmailDraftId: 'r-1' } }] }) })).toMatchObject({ action: 'complete', line: 'Touch 2 went out yesterday.' });
    expect(plan({ history: history({ unresolvedClaims: [{ stepIndex: 1, claimedAt: '2026-10-12T14:00:00Z' }] }) })).toMatchObject({ action: 'outcome_unknown', label: 'Check Gmail Sent' });
    expect(plan({ hold: { kind: 'deal', detail: 'An open HubSpot deal at Fedex Scratch Co: work it from the deal.' } })).toMatchObject({ action: 'held', href: null, line: 'An open HubSpot deal at Fedex Scratch Co: work it from the deal. No follow-up while it stands.' });
  });
  it('on Work the follow-up row says its plan; a held follow-up never promotes a held account', () => {
    const c = followUp();
    const day = workDay({ now: NOW, candidates: [], replies: [], motions: [], inDeals: { status: 'complete', accounts: [] }, held: new Map(), commitments: [c], followUpPlans: new Map([[c.commitmentId, plan()]]) });
    expect(day.cards[0].obligations?.[0]).toMatchObject({ line: plan().line, label: 'Follow up in Gmail', href: plan().href });
    const held = workDay({ now: NOW, candidates: [], replies: [], motions: [], inDeals: { status: 'complete', accounts: [{ accountName: 'Fedex Scratch Co', deals: [{ name: 'Fedex pilot', stage: 'Proposal' }] }] }, held: new Map(), commitments: [c], followUpPlans: new Map([[c.commitmentId, plan({ hold: { kind: 'deal', detail: 'An open HubSpot deal at Fedex Scratch Co: work it from the deal.' } })]]) });
    expect(held.cards[0]).toMatchObject({ stateKind: 'in_deal', tier: 'held' });
    expect(held.cards[0].obligations?.[0].href).toBeNull();
  });
});

describe('a follow-up sent outside GAP (R43)', () => {
  const glen = { id: 7, name: 'Glen Scratch', email: 'glen@fedex.example.com', account_name: 'Fedex Scratch Co' };
  const seed = () =>
    ledgerDb({
      accounts: ['Fedex Scratch Co'],
      personas: [glen],
      routingDecisions: [{ id: 'dec-1', persona_id: 7, account_name: 'Fedex Scratch Co' }],
      audit: [{ id: 'sent-0', kind: DIRECT_SENT, actor: 'casey@freightroll.com', subject_type: 'routing_decision', subject_id: 'dec-1', created_at: new Date('2026-10-06T15:00:00Z'), payload: { accountName: 'Fedex Scratch Co', personaId: 7, recipient: 'glen@fedex.example.com', stepIndex: 0, sentAt: '2026-10-06T15:00:00Z', gmailSentMessageId: 'm0', gmailThreadId: 'thr-1', idempotencyKey: 'k0' } }],
    });
  it('is reconciled from the mailbox Sent folder: the obligation closes with the message as proof, recorded sends are not counted, nothing else is written', async () => {
    const d = seed();
    const p = d.client();
    await ensureCommitment(p, { accountName: 'Fedex Scratch Co', kind: 'follow_up', status: 'waiting', dependency: "Glen's reply", title: 'Follow up with Glen Scratch', dueAt: nyDayAt('2026-10-12'), person: { personaId: 7, name: 'Glen Scratch', email: 'glen@fedex.example.com' }, source: { kind: 'send', id: 'k0' }, detail: { stepIndex: 1, decisionId: 'dec-1', sentAt: '2026-10-06T15:00:00Z' } }, { actor: 'gap:work', now: NOW });
    const rowsBefore = d.store.gapAuditEvent.length;
    const recordedOnly = await reconcileFollowUpsFromSent(p, { now: NOW }, { listSent: async () => [{ id: 'm0', threadId: 'thr-1', internalDate: new Date('2026-10-06T15:00:00Z'), to: 'glen@fedex.example.com', subject: 'Doors versus spots' }] });
    expect(recordedOnly).toEqual({ checked: 1, reconciled: 0, unknown: [] });
    const unreadable = await reconcileFollowUpsFromSent(p, { now: NOW }, { listSent: async () => { throw new Error('Gmail sent list failed (503)'); } });
    expect(unreadable.unknown).toEqual([{ commitmentId: 'send:k0', reason: 'gmail_error', detail: 'Gmail sent list failed (503)' }]);
    expect(d.store.gapAuditEvent.length).toBe(rowsBefore);
    const byHand = await reconcileFollowUpsFromSent(p, { now: NOW }, { listSent: async () => [{ id: 'm0', threadId: 'thr-1', internalDate: new Date('2026-10-06T15:00:00Z'), to: 'glen@fedex.example.com', subject: 'Doors versus spots' }, { id: 'manual-9', threadId: 'thr-1', internalDate: new Date('2026-10-12T13:00:00Z'), to: 'Glen <glen@fedex.example.com>', subject: 'Re: Doors versus spots' }] });
    expect(byHand).toEqual({ checked: 1, reconciled: 1, unknown: [] });
    const [fu] = await loadCommitments(p, { accountNames: ['Fedex Scratch Co'] });
    expect(fu).toMatchObject({ status: 'done', proof: { kind: 'mailbox_sent', id: 'manual-9', note: 'Followed up outside GAP on today ("Re: Doors versus spots"); found in Sent.' } });
    // Exactly one row more: the obligation's status. No ledger send is fabricated for copy GAP did not render.
    expect(d.store.gapAuditEvent.length).toBe(rowsBefore + 1);
    expect(d.store.gapAuditEvent.filter((r) => r.kind === DIRECT_SENT)).toHaveLength(1);
  });

  it('at the click, a follow-up over one sent by hand is refused (emailed_outside_gap); an unreadable Sent refuses; only GAP-recorded mail passes', async () => {
    const steps = JSON.parse(JSON.stringify(HC.steps));
    steps.steps[1].templates.bodyTemplate = 'Hi {{first_name}},\nFollowing up on the question about empty doors.\n\nMy guess is the lot, not the doors, sets the pace.\n\nWorth a short scorecard?\n\nCasey Larkin, YardFlow by FreightRoll';
    const sentTouch = { stepIndex: 0, sentAt: '2026-09-24T15:00:00.000Z', subject: 'Doors versus spots', gmailSentMessageId: 'm0', gmailThreadId: 't1' };
    const due = { state: 'due' as const, stepIndex: 1, dueAt: '2026-09-25T14:00:00.000Z', sent: [sentTouch], threadFrom: sentTouch, pendingDraftId: null };
    const make = () => {
      const d = db();
      d.versions[0].steps = steps;
      d.audit.push({ kind: DIRECT_SENT, actor: 'c', subject_type: 'routing_decision', subject_id: 'dec-joey', payload: { accountName: 'Kroger', personaId: 1886, recipient: 'joey.maggard@kroger.com', stepIndex: 0, sentAt: '2026-09-24T15:00:00.000Z', gmailSentMessageId: 'm0', gmailThreadId: 't1', idempotencyKey: 'k0', sequenceVersionId: 'ver-hc' }, created_at: new Date('2026-09-24T15:00:00.000Z') } as never);
      return d;
    };
    const manual = { id: 'hand-1', internalDate: new Date('2026-09-25T12:00:00.000Z'), subject: 'Re: Doors versus spots' };
    const d1 = make();
    const refused = await createSellerGmailDraft(prismaOf(d1), { decisionId: 'dec-joey', actor: 'c', now: SELLER_NOW, stepIndex: 1 }, { ...baseDeps(d1), nextTouch: async () => due, mailboxSentTo: async () => [{ id: 'm0', internalDate: new Date('2026-09-24T15:00:00.000Z'), subject: 'Doors versus spots' }, manual] });
    expect(refused).toMatchObject({ ok: false, reason: 'emailed_outside_gap' });
    const d2 = make();
    expect(await createSellerGmailDraft(prismaOf(d2), { decisionId: 'dec-joey', actor: 'c', now: SELLER_NOW, stepIndex: 1 }, { ...baseDeps(d2), nextTouch: async () => due, mailboxSentTo: async () => { throw new Error('Gmail sent list failed (503)'); } })).toMatchObject({ ok: false, reason: 'mailbox_sent_unreadable' });
    const d3 = make();
    const ok = await createSellerGmailDraft(prismaOf(d3), { decisionId: 'dec-joey', actor: 'c', now: SELLER_NOW, stepIndex: 1 }, { ...baseDeps(d3), nextTouch: async () => due, mailboxSentTo: async () => [{ id: 'm0', internalDate: new Date('2026-09-24T15:00:00.000Z'), subject: 'Doors versus spots' }] });
    expect(ok).toMatchObject({ ok: true });
  });
});
