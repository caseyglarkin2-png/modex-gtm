/**
 * UX-03: REPLIES ARE CLASSIFIED BEFORE THEY RANK (account-first UX, 2026-10-05). An opt-out ("stop"), an out-of-office,
 * an auto-reply and a bounce are not a buyer talking to you: only a human reply heads the work list, and an opt-out
 * never reads as "Buyer replied". Pure; pinned here. The live cases: Walmart's whole reply was "stop" and NEXT UP
 * called it "Buyer replied"; FedEx's "I am in the office but my responses will be delayed" drove NEXT for 125 days.
 */
import { describe, expect, it } from 'vitest';
import { classifyReply, REPLY_CLASS_LABEL } from '@/lib/gap/replies/classify';

describe('classifyReply: what kind of reply is this, before anything ranks on it', () => {
  it('a one-word stop, unsubscribe or remove-me is an opt-out, never a human reply', () => {
    expect(classifyReply({ snippet: 'stop', subject: 'Re: Leaving this with you' }).kind).toBe('opt_out');
    expect(classifyReply({ snippet: 'STOP.', subject: null }).kind).toBe('opt_out');
    expect(classifyReply({ snippet: 'Please unsubscribe me from these emails.', subject: 'Re: One view' }).kind).toBe('opt_out');
    expect(classifyReply({ snippet: 'Remove me from your list', subject: null }).kind).toBe('opt_out');
    expect(classifyReply({ snippet: 'Not interested, do not contact me again', subject: null }).kind).toBe('opt_out');
  });
  it('an out-of-office or delayed-response notice is out_of_office, by subject or by body', () => {
    expect(classifyReply({ snippet: 'I am in the office but my responses will be delayed due to all day meetings Monday to Thursday.', subject: 'Re: Yard question' }).kind).toBe('out_of_office');
    expect(classifyReply({ snippet: 'Thanks for your note.', subject: 'Automatic reply: Yard question' }).kind).toBe('out_of_office');
    expect(classifyReply({ snippet: 'I am out of the office until Oct 12 with limited access to email.', subject: 'Re: Yard question' }).kind).toBe('out_of_office');
    expect(classifyReply({ snippet: 'I am currently on vacation and will return on Monday.', subject: null }).kind).toBe('out_of_office');
  });
  it('a mailer-daemon or delivery failure is a bounce', () => {
    expect(classifyReply({ snippet: 'Delivery to the following recipient failed permanently', subject: 'Delivery Status Notification (Failure)', from: 'mailer-daemon@googlemail.com' }).kind).toBe('bounce');
    expect(classifyReply({ snippet: 'Your message could not be delivered', subject: 'Undeliverable: Yard question', from: 'postmaster@acme.com' }).kind).toBe('bounce');
  });
  it('anything else is a human reply', () => {
    expect(classifyReply({ snippet: 'Thanks Casey, we are looking at gate dwell at two DCs. Can you send more?', subject: 'Re: Yard question' }).kind).toBe('human');
    expect(classifyReply({ snippet: 'Stop by our booth at MODEX, we would like to talk.', subject: 'Re: MODEX' }).kind).toBe('human');
  });
  it('the class carries a seller label and whether it pauses the account, so no surface rewrites the rule', () => {
    expect(classifyReply({ snippet: 'stop', subject: null })).toMatchObject({ kind: 'opt_out', pausesAccount: false, label: REPLY_CLASS_LABEL.opt_out });
    expect(classifyReply({ snippet: 'Can you send more?', subject: null })).toMatchObject({ kind: 'human', pausesAccount: true });
    expect(classifyReply({ snippet: 'out of the office until Monday', subject: null })).toMatchObject({ kind: 'out_of_office', pausesAccount: false });
    expect(REPLY_CLASS_LABEL.human).toBe('Someone replied');
    expect(REPLY_CLASS_LABEL.opt_out).toBe('Opted out');
  });
});
