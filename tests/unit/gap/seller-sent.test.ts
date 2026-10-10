// @vitest-environment node
/**
 * The people fix of October 10, 2026 (Lazer). Production's October 9 briefing said "No exchange either way in 18 days
 * (last: Sep 21, they wrote)" for Cristian at Lazer Logistics while Casey had replied at 14:38Z on Sep 21 (Gmail
 * 1a0c4673d9d75a75). Root cause, read only: the reply went from casey@freightroll.com; GAP read the inbound from that
 * mailbox (check-inbox) but the Sent from the GAP mailbox (casey@yardflow.ai) alone, and they are two mailboxes.
 * Pinned: the seller's mailboxes are the GAP mailbox and the env mailbox when it is another address; one Sent reader
 * over both merges by id, newest first, and fails whole when one mailbox fails; the people list reads it, so the
 * Lazer line says "we wrote" (the defect, the GAP mailbox alone, says our side is silent); the briefing's intelligence
 * prefers the seller's Sent over its own recovery reader.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { envGmailSender, sellerMailboxes, sellerMailboxSlots, unionListSent, type SellerSentRow } from '@/lib/gap/execution/seller-sent';
import { loadIntelligence } from '@/lib/gap/work/intel';
import { defaultIntel } from '@/lib/gap/work/briefing-send';
import type { GmailSender } from '@/lib/email/gmail-sender';

const NOW = new Date('2026-10-09T23:59:00Z');
const CRISTIAN = 'ccuebas@lazerlogistics.com';
const ENV = { GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'gap-token', GOOGLE_REFRESH_TOKEN: 'env-token' };
const REPLY: SellerSentRow = { id: '1a0c4673d9d75a75', threadId: '1a0c43341c48faff', internalDate: new Date('2026-09-21T14:38:14Z'), to: 'CCuebas@lazerlogistics.com', subject: 'Re: FreightRoll Help On Site Today' };
/** The two mailboxes as production holds them: the reply is in the freightroll Sent only. */
const sentIn = async (s: GmailSender, recipient: string): Promise<SellerSentRow[]> => (s.userEmail === 'casey@freightroll.com' && recipient.toLowerCase() === CRISTIAN ? [REPLY] : []);

function world() {
  return ledgerDb({
    accounts: ['Lazer Logistics'],
    inbound: [{ id: '1a0c4411c8b8b360', thread_id: '1a0c43341c48faff', from_email: CRISTIAN, from_name: 'Cristian Morales', subject: 'Re: FreightRoll Help On Site Today', snippet: 'Thanks Jake, see the photos from the yard this morning.', received_at: new Date('2026-09-21T13:56:20Z'), source: 'gmail', thread: { account_name: null } }],
  }, NOW);
}
const lineFor = async (listSent: (r: string, a: number, b: number) => Promise<SellerSentRow[]>) => (await loadIntelligence(world().client(), { now: NOW, listSent })).people.find((p) => p.id === CRISTIAN)?.line ?? '';

describe('the seller mailboxes', () => {
  it('are the GAP mailbox and the env mailbox when it is another address; one when they are the same; the GAP one alone without the env token', () => {
    expect(sellerMailboxes(ENV).map((m) => m.userEmail)).toEqual(['casey@yardflow.ai', 'casey@freightroll.com']);
    expect(sellerMailboxes({ ...ENV, GMAIL_USER_EMAIL: 'Casey@YardFlow.ai' }).map((m) => m.userEmail)).toEqual(['casey@yardflow.ai']);
    expect(sellerMailboxes({ GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'gap-token' }).map((m) => m.userEmail)).toEqual(['casey@yardflow.ai']);
    expect(envGmailSender({})).toBeNull();
  });

  it('one Sent reader asks every mailbox, merges by id newest first, and fails whole when one mailbox fails', async () => {
    const older = { ...REPLY, id: 'gap-1', internalDate: new Date('2026-09-01T10:00:00Z') };
    const read = unionListSent(sellerMailboxes(ENV), async (s) => (s.userEmail === 'casey@yardflow.ai' ? [older, REPLY] : [REPLY]));
    expect((await read(CRISTIAN, 0, 2_000_000_000)).map((r) => r.id)).toEqual(['1a0c4673d9d75a75', 'gap-1']);
    const failing = unionListSent(sellerMailboxes(ENV), async (s) => { if (s.userEmail === 'casey@freightroll.com') throw new Error('Gmail sent list failed (403)'); return [older]; });
    await expect(failing(CRISTIAN, 0, 2_000_000_000)).rejects.toThrow('403');
  });

  it('account Sent coverage (2026-10-10): every mailbox is a slot, configured or not (a missing one is named, never skipped); every row says the mailbox it came from; a failure names its mailbox', async () => {
    expect(sellerMailboxSlots(ENV).map((m) => [m.address, !!m.sender])).toEqual([['casey@yardflow.ai', true], ['casey@freightroll.com', true]]);
    expect(sellerMailboxSlots({ GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'gap-token' }).map((m) => [m.address, !!m.sender])).toEqual([['casey@yardflow.ai', true], ['casey@freightroll.com', false]]);
    expect(sellerMailboxSlots({ GOOGLE_REFRESH_TOKEN: 'env-token' }).map((m) => [m.address, !!m.sender])).toEqual([['the GAP mailbox', false], ['casey@freightroll.com', true]]);
    expect(sellerMailboxSlots({ ...ENV, GMAIL_USER_EMAIL: 'casey@yardflow.ai' }).map((m) => m.address)).toEqual(['casey@yardflow.ai']);
    // The readable slots are exactly the mailboxes the assignment's relationship reads.
    for (const env of [ENV, { GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'gap-token' }, { GOOGLE_REFRESH_TOKEN: 'env-token' }, {}]) {
      expect(sellerMailboxSlots(env).filter((s) => s.sender).map((s) => s.sender!.userEmail)).toEqual(sellerMailboxes(env).map((s) => s.userEmail));
    }
    const older = { ...REPLY, id: 'gap-1', internalDate: new Date('2026-09-01T10:00:00Z') };
    const rows = await unionListSent(sellerMailboxes(ENV), async (s) => (s.userEmail === 'casey@yardflow.ai' ? [older] : [REPLY]))(CRISTIAN, 0, 2_000_000_000);
    expect(rows.map((r) => [r.id, r.mailbox])).toEqual([['1a0c4673d9d75a75', 'casey@freightroll.com'], ['gap-1', 'casey@yardflow.ai']]);
    const failing = unionListSent(sellerMailboxes(ENV), async (s) => { if (s.userEmail === 'casey@freightroll.com') throw new Error('Gmail sent list failed (403)'); return [older]; });
    await expect(failing(CRISTIAN, 0, 2_000_000_000)).rejects.toThrow('casey@freightroll.com: Gmail sent list failed (403)');
  });
});

describe('the Lazer line', () => {
  // Production read this message's purpose so that the line was the quiet one ("last: Sep 21, they wrote"); here it
  // reads as a buyer's answerable message, so the defect says "nothing sent since". Both are our side unread.
  it('the GAP mailbox alone (the defect) says nothing was sent since; the seller Sent in both mailboxes says we wrote', async () => {
    const gapOnly = unionListSent(sellerMailboxes({ GAP_GMAIL_USER_EMAIL: 'casey@yardflow.ai', GAP_GOOGLE_REFRESH_TOKEN: 'gap-token' }), sentIn);
    expect(await lineFor(gapOnly)).toContain('An answer is owed since Sep 21, 2026: they wrote Sep 21; nothing sent since.');
    const both = unionListSent(sellerMailboxes(ENV), sentIn);
    const fixed = await lineFor(both);
    expect(fixed).toContain('No exchange either way in 18 days (last: Sep 21, we wrote).');
    expect(fixed).not.toContain('nothing sent since');
  });

  it("the briefing's intelligence reads the seller Sent when supplied, never its own recovery reader for the people", async () => {
    const recovery = async () => { throw new Error('the recovery reader is not the people reader'); };
    const intel = await defaultIntel(world().client(), NOW, { listSent: recovery, listSellerSent: unionListSent(sellerMailboxes(ENV), sentIn), inDeals: async () => null, coverage: async () => null });
    expect(intel.people.find((p) => p.id === CRISTIAN)?.line ?? '').toContain('(last: Sep 21, we wrote)');
  });
});
