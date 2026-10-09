// @vitest-environment node
/**
 * C25 (the commercial-context audit, 2026-10-08): before another draft proposal is generated from an angle, the
 * existing drafts and in-flight work for the same identity, deal, thread and purpose are found and offered for reuse
 * or revision. Pinned: the October 5 Kenco drafts to Dave show as existing work for a Pursue on the Kenco deal; the
 * one with the seller's own edits is offered for revision only and is never overwritten; a vendor-support draft to
 * another person at the account is not competing; a draft to Dave in another thread competes through the person and
 * the deal; a retry with the same inputs gives the same items in the same order; nothing on record says not found.
 */
import { describe, expect, it } from 'vitest';
import { competingWork, type ExistingDraft } from '@/lib/gap/context/assemble';
import type { TimelineEvent } from '@/lib/gap/context/commercial-context';
import { DAVE_EMAIL } from './stream-b-fixture';

const drafts: ExistingDraft[] = [
  { id: 'r5338182872211554541', provider: 'gmail', threadId: 't-kenco', to: [DAVE_EMAIL], subject: 'Re: YardFlow and the 2027 roadmap', dealId: '62704698979', purpose: 'buyer_conversation', updatedAt: '2026-10-05T10:00:00.000Z', sellerEdited: false },
  { id: 'r5338182872211554542', provider: 'gmail', threadId: 't-kenco', to: [DAVE_EMAIL], subject: 'Phased 2027 proposal', dealId: '62704698979', purpose: 'buyer_conversation', updatedAt: '2026-10-05T11:30:00.000Z', sellerEdited: true },
  { id: 'gap-prop-7', provider: 'gap', threadId: null, to: [DAVE_EMAIL], subject: 'A phased split for 2027', dealId: '62704698979', purpose: 'buyer_conversation', updatedAt: '2026-10-04T09:00:00.000Z', sellerEdited: false, revision: 2 },
  { id: 'r-vendor', provider: 'gmail', threadId: 't-vendor', to: ['seb@riserify.example'], subject: 'Re: your sales services', dealId: null, purpose: 'vendor_solicitation', updatedAt: '2026-10-06T08:00:00.000Z', sellerEdited: false },
  { id: 'r-craig-support', provider: 'gmail', threadId: 't-support', to: ['craig.morrison@kencogroup.com'], subject: 'Re: device support', dealId: null, purpose: 'customer_support', updatedAt: '2026-10-06T09:00:00.000Z', sellerEdited: false },
];
const timeline: TimelineEvent[] = [
  { id: 'm-sep16', at: '2026-09-16T14:02:00.000Z', direction: 'inbound', type: 'email', provider: 'gmail', providerIds: ['1a0aa7d3c587d944'], from: DAVE_EMAIL, to: ['casey@freightroll.com'], subject: 'Re: YardFlow and the 2027 roadmap', excerpt: 'We will keep Open Dock.', isDraft: false, purpose: 'buyer_conversation' },
  { id: 'd-oct5', at: '2026-10-05T10:00:00.000Z', direction: 'outbound', type: 'draft', provider: 'gmail', providerIds: ['r5338182872211554541'], from: 'casey@freightroll.com', to: [DAVE_EMAIL], subject: 'Re: YardFlow and the 2027 roadmap', excerpt: null, isDraft: true, purpose: null },
  { id: 'd-oct7', at: '2026-10-07T18:00:00.000Z', direction: 'outbound', type: 'draft', provider: 'gmail', providerIds: ['r-oct7'], from: 'casey@freightroll.com', to: [DAVE_EMAIL], subject: 'Budget notes', excerpt: null, isDraft: true, purpose: null },
];
const q = { emails: [DAVE_EMAIL], dealId: '62704698979', threadId: 't-kenco', purpose: 'buyer_conversation' as const };

describe('C25: competing work before another draft', () => {
  it('the October 5 Kenco drafts and the GAP proposal show as existing work, newest first; the seller-edited one is revise-only and never overwritten; a timeline draft no proposal wrote is in-flight seller work; the vendor and support drafts are not competing', () => {
    const r = competingWork(timeline, drafts, q);
    expect(r.found).toBe(true);
    if (!r.found) return;
    expect(r.items.map((i) => `${i.kind}:${i.id}`)).toEqual(['in_flight:r-oct7', 'draft:r5338182872211554542', 'draft:r5338182872211554541', 'draft:gap-prop-7']);
    expect(r.items.every((i) => i.overwrite === false)).toBe(true);
    expect(r.items.find((i) => i.id === 'r5338182872211554542')).toMatchObject({ sellerEdited: true, offer: 'revise', why: ['same_thread', 'same_person', 'same_deal', 'same_purpose'] });
    expect(r.items.find((i) => i.id === 'r5338182872211554541')).toMatchObject({ sellerEdited: false, offer: 'reuse' });
    expect(r.items.find((i) => i.id === 'gap-prop-7')).toMatchObject({ provider: 'gap', why: ['same_person', 'same_deal', 'same_purpose'], offer: 'reuse' });
    expect(r.items.find((i) => i.id === 'r-oct7')).toMatchObject({ kind: 'in_flight', sellerEdited: true, offer: 'revise', why: ['same_person'] });
    expect(r.items.some((i) => i.id === 'r-vendor' || i.id === 'r-craig-support')).toBe(false);
    expect(r.line).toBe('4 existing drafts for this person and deal (2 with your own edits, never overwritten): reuse or revise before a new one is written.');
    // The retry: the same inputs, the same answer; no second conflicting agenda is invented.
    expect(competingWork(timeline, drafts, q)).toEqual(r);
    expect(competingWork([...timeline].reverse(), [...drafts].reverse(), q)).toEqual(r);
  });

  it('a draft to Dave in another thread for another deal is not competing; one for the same deal is; a support purpose to the same person is not; nothing on record is not found', () => {
    const other: ExistingDraft = { id: 'r-other', provider: 'gmail', threadId: 't-other', to: [DAVE_EMAIL], subject: 'x', dealId: '999', purpose: 'buyer_conversation', updatedAt: '2026-10-06T10:00:00.000Z', sellerEdited: false };
    expect(competingWork([], [other], { ...q, purpose: null })).toEqual({ found: false });
    const sameDeal = competingWork([], [{ ...other, dealId: '62704698979' }], { ...q, purpose: null });
    expect(sameDeal.found && sameDeal.items[0].why).toEqual(['same_person', 'same_deal']);
    expect(competingWork([], [{ ...other, dealId: null, purpose: 'customer_support' }], q)).toEqual({ found: false });
    expect(competingWork([], [{ ...other, dealId: null, purpose: null }], q).found).toBe(true);
    expect(competingWork([], [], q)).toEqual({ found: false });
    expect(competingWork(timeline.filter((e) => !e.isDraft), [], q)).toEqual({ found: false });
  });
});
