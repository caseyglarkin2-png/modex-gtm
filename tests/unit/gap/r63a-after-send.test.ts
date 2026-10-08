/**
 * R63-A S10: after one send to Glen the email page said "Every touch in this sequence has been sent." and "Sequence
 * complete" for a single-touch family while Work held his follow-up for Oct 13, and its account row said one fact
 * twice, with an address and an ISO date ("No good motion yet: In motion: glen@... got a first touch on 2026-10-07."
 * and "Do not contact yet: In motion: glen@..."). Now: "Touch 1 sent; the follow-up is on Oct 13.", and one motion
 * line with the person's name and a readable date.
 */
import { describe, expect, it } from 'vitest';
import { afterSendWords, followUpDue, followUpFor } from '@/lib/gap/execution/after-send';
import { computeAccountMotion } from '@/lib/gap/motion/account-motion';
import { accountLines } from '@/lib/gap/execution/six-line-brief';
import type { Commitment } from '@/lib/gap/work/commitment-model';

const SENT = [{ stepIndex: 0, sentAt: '2026-10-07T18:30:00.000Z' }];
const followUp = (over: Partial<Commitment> = {}): Commitment => ({
  commitmentId: 'send:glen:0',
  accountName: 'Fedex Scratch Co r63',
  kind: 'follow_up',
  title: 'Follow up with Glen Scratch',
  basis: null,
  owner: 'casey@freightroll.com',
  dueAt: '2026-10-13T13:00:00.000Z',
  person: { personaId: 7, name: 'Glen Scratch', email: 'glen@fedex-scratch-co-r63.example.com' },
  dealId: null,
  threadId: null,
  status: 'waiting',
  snoozeUntil: null,
  dependency: "Glen's reply",
  proof: null,
  reason: null,
  source: { kind: 'send', id: 'glen:0' },
  detail: { stepIndex: 1, decisionId: 'dec-glen', sentAt: SENT[0].sentAt, noFollowUpCopy: true },
  createdAt: '2026-10-07T18:31:00.000Z',
  createdBy: 'gap:work',
  updatedAt: '2026-10-07T18:31:00.000Z',
  updatedBy: 'gap:work',
  ...over,
});

describe('R63-A S10: after one send, the touch and its follow-up; one motion line', () => {
  it('the follow-up on record gives the day: "Touch 1 sent; the follow-up is on Oct 13."', () => {
    const w = afterSendWords({ sent: SENT, followUp: followUpFor([followUp()], 'dec-glen') });
    expect(w).toEqual({ blocked: 'Touch 1 sent; the follow-up is on Oct 13.', status: 'The follow-up is on Oct 13.' });
    expect(`${w.blocked} ${w.status}`).not.toMatch(/Sequence complete|Every touch/);
  });

  it('before the sweep has written it, the same day by the sweep\'s own rule; a closed follow-up says none is open', () => {
    expect(followUpDue(SENT[0].sentAt).toISOString().slice(0, 10)).toBe('2026-10-13');
    expect(afterSendWords({ sent: SENT, followUp: followUpFor([], 'dec-glen') }).blocked).toBe('Touch 1 sent; the follow-up is on Oct 13.');
    expect(afterSendWords({ sent: SENT, followUp: followUpFor([followUp({ status: 'done' })], 'dec-glen') }).blocked).toBe('Touch 1 sent; no follow-up is open.');
  });

  it('the motion names the person and a readable date once their card has left the ready list', () => {
    const m = computeAccountMotion({ accountName: 'Fedex Scratch Co r63', readyEmailCards: [], choice: null, replyHold: null, now: new Date('2026-10-07T20:00:00Z'), firstTouches: [{ personaId: 7, recipient: 'glen@fedex-scratch-co-r63.example.com', recipientName: 'Glen Scratch', sentAt: SENT[0].sentAt, released: false }] });
    expect(m.headline).toBe('In motion: Glen Scratch got a first touch on Wed, Oct 7. One cold email motion at a time.');
  });

  it('the account row says the motion once', () => {
    const why = 'Do not contact yet: In motion: Glen Scratch got a first touch on Wed, Oct 7. One cold email motion at a time.';
    expect(accountLines({ accountName: 'Fedex Scratch Co r63', motion: { type: 'NO_GOOD_MOTION', who: null, why }, motionLine: `No good motion yet: ${why.replace(/^Do not contact yet: /, '')}`, firstDiscoveryQuestion: null })).toEqual({ motion: '', caution: 'In motion: Glen Scratch got a first touch on Wed, Oct 7. One cold email motion at a time.' });
    expect(accountLines({ accountName: 'X', motion: { type: 'FACT_LED', who: 'Glen Scratch', why: '' }, motionLine: 'Fact-led, on the verified fact.', firstDiscoveryQuestion: null })).toEqual({ motion: 'Fact-led, on the verified fact.', caution: null });
  });
});
