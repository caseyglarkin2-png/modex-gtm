/**
 * R63-A S4 (the R42 gap): after Nfi's reply was recorded as "problem confirmed", the page said "The reply is answered on
 * the account" though nothing was sent, and Work never prompted an answer to Person1. A recorded person's reply now
 * stays on Work as "Answer <them>" with the prepared answer until GAP sends or copies it, the account keeps the
 * prepared answer, and "answered" is never said before a send or a copy.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { loadAnswersOwed } from '@/lib/gap/work/recorded-replies';
import { workDay } from '@/lib/gap/work/list';

const NOW = new Date('2026-10-07T22:00:00Z');
const NFI = 'Nfi Scratch Co r63';
const msg = (id: string, from: string, body: string) => ({ id, thread_id: `t-${id}`, from_email: from, from_name: from.startsWith('person1') ? 'Person1 Scratch' : null, subject: 'Re: trailer turns at your sites', snippet: body.slice(0, 80), body_text: body, received_at: new Date('2026-10-07T19:49:00Z') });
const disp = (source_id: string, response_class: string) => ({ id: `d-${source_id}`, source_kind: 'inbound_message', source_id, account_name: NFI, persona_id: 1, contact_email: 'x', response_class, human_confirmed: true, created_at: new Date('2026-10-07T21:55:00Z') });

describe('R63-A S4: a recorded reply is not an answered reply', () => {
  it('a recorded person\'s reply is owed its answer until it is sent (copied is not sent); an opt-out, a bounce and a referral owe none', async () => {
    const d = ledgerDb({
      inbound: [
        msg('m1', 'person1@nfi-scratch-co-r63.example.com', 'Hi Casey, the detention charges are killing us. Can you send the case study by Friday?'),
        msg('m2', 'doug@walmart-scratch-co-r63.example.com', 'stop'),
        msg('m3', 'person2@nfi-scratch-co-r63.example.com', "I'm not the right person. Talk to Bob Lane."),
      ],
      dispositions: [disp('m1', 'problem_confirmed'), disp('m2', 'do_not_contact'), disp('m3', 'referral')],
    });
    const owed = await loadAnswersOwed(d.client(), NOW);
    expect(owed.map((o) => [o.id, o.accountName, o.fromName, o.recorded])).toEqual([['m1', NFI, 'Person1 Scratch', true]]);
    // X14 (copied is not sent): a copy to send by hand leaves the answer OWED until Sent shows it went; a sent row (GAP's, or
    // the copies reconcile's from Sent) is the answer.
    d.store.gapAuditEvent.push({ id: 'e1', kind: 'execution.reply_copied', subject_type: 'inbound_message', subject_id: 'm1', actor: 'casey@freightroll.com', payload: {}, created_at: NOW });
    expect((await loadAnswersOwed(d.client(), NOW)).map((o) => o.id)).toEqual(['m1']);
    d.store.gapAuditEvent.push({ id: 'e2', kind: 'execution.reply_sent', subject_type: 'inbound_message', subject_id: 'm1', actor: 'cron:gap-mailbox', payload: { reconciledFromSent: true }, created_at: NOW });
    expect(await loadAnswersOwed(d.client(), NOW)).toEqual([]);
  });

  it('Work says "Answer Person1 Scratch" with the prepared answer, never asking to record it again', () => {
    const day = workDay({ now: NOW, candidates: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, replies: [{ accountName: NFI, contactEmail: 'person1@nfi-scratch-co-r63.example.com', fromName: 'Person1 Scratch', subject: 'Re: trailer turns at your sites', snippet: 'Hi Casey, the detention charges are killing us. Can you send the case study by Friday?', receivedAt: '2026-10-07T19:49:00.000Z', id: 'm1', threadId: 't-m1', recorded: true }] });
    const card = day.cards.find((c) => c.accountName === NFI)!;
    expect(card).toMatchObject({ stateKind: 'replied', state: 'Answer Person1 Scratch', next: { label: 'Prepare the answer', href: '/gap/accounts/nfi-scratch-co-r63#reply-answer' }, blocker: null });
    expect(card.why).toMatch(/What they said is recorded; the answer is prepared and nothing goes out until you send or copy it\./);
    expect(card.reply).toMatchObject({ label: 'Recorded; answer them', record: null, answerable: true });
  });

  it('the account keeps the prepared answer; Capture never says "answered" before a send or a copy', () => {
    const page = readFileSync('src/app/gap/accounts/[slug]/page.tsx', 'utf8');
    expect(page).toContain('id="reply-answer"');
    expect(page).toContain('data-testid="reply-answer-owed"');
    const flow = readFileSync('src/components/gap/capture-flow.tsx', 'utf8');
    // Only the comment that records the defect still says it.
    expect(flow.split('\n').filter((l) => l.includes('The reply is answered on the account')).every((l) => l.trim().startsWith('*'))).toBe(true);
    expect(flow).toContain('Your answer to them waits on the account, prepared; nothing goes out until you send or copy it.');
  });
});
