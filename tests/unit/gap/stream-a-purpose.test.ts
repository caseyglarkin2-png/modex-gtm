// @vitest-environment node
/**
 * C09 and C11 (the commercial-context audit, 2026-10-08): message purpose and commercial relationship judged apart,
 * each with its evidence. The fixtures named by the audit: the Lazer device-support message, the Riserify pitch, a
 * referral request, a court-summons-like calendar invitation, Dave's roadmap. Unknown stays unknown; purpose never
 * proves relationship; suspicious-only and calendar-only senders are never re-engaged.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classifyPurpose, classifyRelationship, reengageEligible } from '@/lib/gap/context/purpose';
import { classifyMailType } from '@/lib/gap/context/thread-context';

const inbound = (from: string, subject: string, excerpt: string, extra: Record<string, unknown> = {}) => ({ from, subject, excerpt, direction: 'inbound' as const, type: 'email', ...extra });

const LAZER = inbound('ops@lazerlogistics.example', 'Gate tablet at Dock 4', 'The gate tablet at Dock 4 stopped scanning this morning. Can someone troubleshoot the device or send a replacement unit?');
const RISERIFY = inbound('seb@riserify.example', 'Pipeline for YardFlow', 'We provide outsourced SDR services for logistics software companies. Would you be open to a 15-minute call to see how we can fill your pipeline?');
const REFERRAL = inbound('jo@brokerage.example', 'Intro?', 'Could you introduce me to whoever runs the Kenco yards? Happy to set up a referral partner arrangement.');
const SUMMONS_SUBJECT = 'Invitation: Court Summons Case 4471, appear in court @ Mon Oct 20, 2026 9am - 10am (EDT) (casey@freightroll.com)';
const SUMMONS = inbound('calendar-notification@google.com', SUMMONS_SUBJECT, 'You have been invited. Click the link to view the case file.', { type: 'calendar', calendar: classifyMailType({ subject: SUMMONS_SUBJECT, from: 'calendar-notification@google.com' }).calendar });
const DAVE = inbound('dave.kiesling@kencogroup.com', 'Re: YardFlow and the 2027 roadmap', 'We will keep Open Dock at the ungated locations and pilot Blue Yonder YMS where the WMS is migrating. Please cancel for now and reconnect toward the end of October during 2027 budgeting.');

describe('C09: purpose, with evidence', () => {
  it('the audit fixtures: support, vendor, partner referral, suspicious calendar, buyer conversation', () => {
    expect(classifyPurpose(LAZER, { customer: true })).toEqual({ purpose: 'customer_support', confidence: 'high', evidence: ['a person wrote back', 'their account is a customer', 'support words: "Gate tablet at"'] });
    expect(classifyPurpose(LAZER)).toMatchObject({ purpose: 'customer_support', confidence: 'medium' });
    expect(classifyPurpose(RISERIFY)).toMatchObject({ purpose: 'vendor_solicitation', evidence: expect.arrayContaining(['a pitch in their own words: "We provide"', 'sender is not a known person']) });
    expect(classifyPurpose(REFERRAL)).toMatchObject({ purpose: 'partner_referral', evidence: expect.arrayContaining(['referral or partner words: "introduce me to"']) });
    expect(classifyPurpose(SUMMONS)).toMatchObject({ purpose: 'suspicious', confidence: 'high', evidence: ['a calendar invitation', 'threat or lure words: "Summons"', 'not a buyer statement; do not follow its links'] });
    expect(classifyPurpose(DAVE, { knownPerson: true, inDeal: true })).toEqual({ purpose: 'buyer_conversation', confidence: 'high', evidence: ['a person wrote back', 'a known person at an account', 'their account is in an open deal', 'buyer vocabulary: "roadmap"'] });
    expect(classifyPurpose(DAVE)).toMatchObject({ purpose: 'buyer_conversation', confidence: 'medium' });
  });

  it('calendar, automated, internal, media; a plain calendar RSVP is calendar, a consumer-address invitation nobody knows is suspicious', () => {
    const rsvpSubject = 'Accepted: Yard walk @ Tue Oct 14, 2026 2pm - 3pm (EDT) (casey@freightroll.com)';
    const rsvp = inbound('dave.kiesling@kencogroup.com', rsvpSubject, 'Dave Kiesling has accepted this invitation.', { type: 'calendar', calendar: classifyMailType({ subject: rsvpSubject, from: 'dave.kiesling@kencogroup.com' }).calendar });
    expect(classifyPurpose(rsvp)).toEqual({ purpose: 'calendar', confidence: 'high', evidence: ['a calendar accepted for "yard walk"'] });
    const lure = inbound('winner77@gmail.com', 'Invitation: Prize pickup @ Mon Oct 20, 2026 9am (EDT)', '', { type: 'calendar', calendar: { kind: 'invitation', meetingKey: 'prize pickup', startsAt: null } });
    expect(classifyPurpose(lure).purpose).toBe('suspicious');
    expect(classifyPurpose(inbound('dave.kiesling@kencogroup.com', 'Automatic reply: YardFlow', 'I am out of the office until Monday.'))).toMatchObject({ purpose: 'automated', evidence: ['an out-of-office or automatic reply'] });
    expect(classifyPurpose(inbound('mailer-daemon@googlemail.com', 'Delivery Status Notification (Failure)', 'Address not found'))).toMatchObject({ purpose: 'automated', evidence: ['a delivery failure notice'] });
    expect(classifyPurpose(inbound('noreply@docusign.example', 'Completed: MSA', 'All parties have signed.'))).toMatchObject({ purpose: 'automated' });
    expect(classifyPurpose(inbound('x@y.example', 'hello', 'hi', { headers: { 'Auto-Submitted': 'auto-generated' } }))).toMatchObject({ purpose: 'automated' });
    expect(classifyPurpose(inbound('casey@freightroll.com', 'Re: Kenco', 'Sending the recap now.'))).toMatchObject({ purpose: 'internal' });
    expect(classifyPurpose(inbound('ann@freightwaves.example', 'Story on yard automation', "I'm a reporter at FreightWaves working on a story about yard automation. Could I interview you this week?"))).toMatchObject({ purpose: 'media' });
    expect(classifyPurpose(inbound('x@y.example', 'URGENT', 'Your account has been suspended. Verify your identity within 24 hours.'))).toMatchObject({ purpose: 'suspicious', confidence: 'medium' });
  });

  it('unknown stays unknown; a draft and our own sends are never a contact of theirs; each axis is judged apart', () => {
    expect(classifyPurpose(inbound('stranger@somewhere.example', 'quick question', 'Hey, quick question for you.'))).toEqual({ purpose: 'unknown', confidence: 'low', evidence: ['a person wrote back', 'no purpose cue matched: review it'] });
    expect(classifyPurpose({ from: 'casey@freightroll.com', subject: 'Re: Kenco', excerpt: 'Three numbers', direction: 'outbound', isDraft: true }, { knownPerson: true })).toMatchObject({ purpose: 'buyer_conversation', evidence: ['a draft: preparation, not a contact'] });
    expect(classifyPurpose({ from: 'casey@freightroll.com', subject: 'Re', excerpt: 'Hi', direction: 'outbound' })).toMatchObject({ purpose: 'unknown' });
    // A customer asks a new buying question: purpose buyer_conversation; the relationship (customer) is not changed by it.
    const customerBuying = classifyPurpose(inbound('ops@lazerlogistics.example', 'Memphis', 'We want to add the Memphis yard to the rollout. What is the pricing for three more sites?'), { customer: true });
    expect(customerBuying.purpose).toBe('buyer_conversation');
    // A partner sends a pitch: purpose vendor_solicitation at low confidence; the relationship stays what the CRM says.
    const partnerPitch = classifyPurpose(inbound('pat@partnerco.example', 'Co-marketing', 'We offer a co-marketing package for our integration partners this quarter. Special offer through Friday.'), { knownPerson: true });
    expect(partnerPitch).toMatchObject({ purpose: 'vendor_solicitation', confidence: 'low' });
    expect(classifyRelationship({ openDeal: false, partner: true }).value).toBe('partner');
  });
});

describe('C09: relationship from CRM and ledger evidence only', () => {
  it('open deal, customer, prospect, vendor; several at once are mixed; nothing is unknown and says the CRM was not read', () => {
    expect(classifyRelationship({ openDeal: true, persona: true })).toEqual({ value: 'active_opportunity', evidence: ['an open deal under a complete CRM read'] });
    expect(classifyRelationship({ openDeal: false, customer: true })).toEqual({ value: 'customer', evidence: ['a customer account'] });
    expect(classifyRelationship({ openDeal: false, persona: true })).toEqual({ value: 'prospect', evidence: ['a GAP persona at an account with no open deal'] });
    expect(classifyRelationship({ openDeal: null, accountPlaced: true })).toEqual({ value: 'prospect', evidence: ['placed at an account with no open deal', 'open deal unknown: the CRM was not read'] });
    expect(classifyRelationship({ openDeal: false, vendor: true, sources: ['HubSpot company type: Vendor'] })).toEqual({ value: 'vendor', evidence: ['a vendor flag', 'HubSpot company type: Vendor'] });
    expect(classifyRelationship({ openDeal: true, customer: true })).toMatchObject({ value: 'mixed', evidence: expect.arrayContaining(['active_opportunity and customer at once']) });
    expect(classifyRelationship({ openDeal: null })).toEqual({ value: 'unknown', evidence: ['open deal unknown: the CRM was not read', 'no CRM, persona or flag evidence'] });
    expect(classifyRelationship({ openDeal: false })).toEqual({ value: 'unknown', evidence: ['no CRM, persona or flag evidence'] });
    expect(classifyRelationship({ openDeal: false, internal: true }).value).toBe('internal');
  });
});

describe('C11: suspect correspondence is reviewed, never a prospect claim', () => {
  it('the court-summons invitation cannot yield a re-engage; a calendar-only sender cannot; a real conversation beside a suspicious one is reviewed', () => {
    expect(reengageEligible({ purposes: ['suspicious'], relationship: 'unknown' })).toEqual({ eligible: false, reason: 'only suspicious messages: not a prospect conversation', review: false });
    expect(reengageEligible({ purposes: ['calendar', 'calendar'], relationship: 'prospect' })).toEqual({ eligible: false, reason: 'only calendar messages: not a prospect conversation', review: false });
    expect(reengageEligible({ purposes: ['automated', 'vendor_solicitation'], relationship: 'unknown' }).eligible).toBe(false);
    expect(reengageEligible({ purposes: ['buyer_conversation', 'calendar'], relationship: 'prospect' })).toEqual({ eligible: true, reason: 'buyer_conversation', review: false });
    expect(reengageEligible({ purposes: ['buyer_conversation', 'suspicious'], relationship: 'prospect' })).toEqual({ eligible: true, reason: 'buyer_conversation; one suspicious message beside it: review', review: true });
    expect(reengageEligible({ purposes: ['unknown'], relationship: 'unknown' })).toEqual({ eligible: true, reason: 'purpose unknown: review before any outreach', review: true });
    expect(reengageEligible({ purposes: ['buyer_conversation'], relationship: 'prospect', optedOut: true })).toEqual({ eligible: false, reason: 'opted out', review: false });
    expect(reengageEligible({ purposes: ['buyer_conversation'], relationship: 'vendor' })).toEqual({ eligible: false, reason: 'relationship vendor', review: false });
    expect(reengageEligible({ purposes: [], relationship: 'prospect' })).toEqual({ eligible: false, reason: 'no message to re-engage on', review: false });
  });

  it('the classifier follows no link and deletes nothing: the module has no fetch, no network and no delete call', () => {
    const src = readFileSync('src/lib/gap/context/purpose.ts', 'utf8');
    expect(src).not.toMatch(/\bfetch\s*\(|https?:\/\/|\.delete\(|trash|prisma/);
  });
});
