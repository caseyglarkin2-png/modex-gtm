// @vitest-environment node
/**
 * The lead's wiring of C09/C11 (purpose and re-engage eligibility) and C10 (two-sided state) into the people ranker
 * (the commercial-context audit, 2026-10-08). With the seller's Sent read: a person we wrote to after their message
 * is not quiet (the Kenco Dave case: Sep 16 inbound, Oct 1 send); a person who is owed an answer is a reply
 * obligation, not a re-engagement; a person quiet on both sides is listed with the basis in words. A vendor pitch is
 * out; an unknown purpose is listed with a review note. Without the Sent read, the line says so.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { loadIntelligence } from '@/lib/gap/work/intel';

const NOW = new Date('2026-10-08T15:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const DAVE = 'dave.kiesling@kencogroup.com';
const BOB = 'bob@costco.example';
const OWED = 'owed@acme.example';
const VENDOR = 'growth@agency.example';
const PAT = 'pat@unknownco.example';

const msg = (id: string, from: string, subject: string, snippet: string, at: Date) => ({ id, thread_id: `t-${id}`, from_email: from, from_name: null, subject, snippet, received_at: at, source: 'gmail', thread: { account_name: null } });

function db() {
  return ledgerDb({
    accounts: ['Kenco', 'Costco Wholesale'],
    personas: [{ id: 1, email: DAVE, name: 'Dave Kiesling', title: 'VP Operations', account_name: 'Kenco', do_not_contact: false }, { id: 2, email: BOB, name: 'Bob', title: 'Director DC Ops', account_name: 'Costco Wholesale', do_not_contact: false }],
    inbound: [
      msg('m-dave', DAVE, 'Re: yards roadmap', 'We will keep Open Dock at the ungated yards and pilot the YMS where the WMS migrates.', days(22)),
      msg('m-bob', BOB, 'Re: our yards', 'Our yards in Tracy are the pain; send the pilot scope.', days(40)),
      msg('m-owed', OWED, 'Pricing for our yards', 'Can you send pricing for a pilot at two yards?', days(18)),
      msg('m-vendor', VENDOR, 'Grow your pipeline', 'We offer SEO services for logistics software companies. Reply for a free audit.', days(30)),
      msg('m-pat', PAT, 'hello', 'hi', days(45)),
    ],
  }, NOW);
}

describe('C09/C10 wired into the people ranker', () => {
  it('with the Sent read: a person we wrote to after their message is not quiet, an owed answer is not a re-engagement, a two-sided quiet person is listed with the basis, a vendor is out, an unknown purpose carries a review note', async () => {
    const listSent = vi.fn(async (recipient: string) => {
      if (recipient === DAVE) return [{ id: 's-oct1', threadId: 't-m-dave', internalDate: days(7), to: DAVE, subject: 'Re: yards roadmap' }];
      if (recipient === BOB) return [{ id: 's-sep3', threadId: 't-m-bob', internalDate: days(35), to: BOB, subject: 'Re: our yards' }];
      return [];
    });
    const x = await loadIntelligence(db().client(), { now: NOW, identity: null, listSent });
    const ids = x.people.map((p) => p.id);
    expect(ids).not.toContain(DAVE);
    expect(ids).not.toContain(OWED);
    expect(ids).not.toContain(VENDOR);
    expect(ids).toContain(BOB);
    expect(ids).toContain(PAT);
    const bob = x.people.find((p) => p.id === BOB)!;
    expect(bob.line).toMatch(/No exchange either way in 35 days \(last: Sep 3, we wrote\)\.$/);
    expect(bob.state).toMatchObject({ quietDays: 35, nextMeetingAt: null });
    expect(bob.state?.lastOutboundAt).toBe(days(35).toISOString());
    const pat = x.people.find((p) => p.id === PAT)!;
    expect(pat.line).toMatch(/Review before outreach: purpose unknown: review before any outreach\.$/);
    expect(pat.review).toBe('purpose unknown: review before any outreach');
    expect(x.selection.people).toMatch(/our Sent read for the \d+ who would be listed/);
    // The Sent read is bounded to the people that would be listed, never the whole intake.
    expect(listSent.mock.calls.length).toBeLessThanOrEqual(5);
  });

  it('without the Sent read: quiet is judged from their last message alone and every line says so; the vendor is still out', async () => {
    const x = await loadIntelligence(db().client(), { now: NOW, identity: null });
    const ids = x.people.map((p) => p.id);
    expect(ids).toContain(DAVE);
    expect(ids).toContain(OWED);
    expect(ids).not.toContain(VENDOR);
    const dave = x.people.find((p) => p.id === DAVE)!;
    expect(dave.line).toContain('Our Sent was not read for this list, so a reply of ours may exist.');
    expect(dave.state).toBeUndefined();
    expect(x.selection.people).toContain('our Sent not read: quiet is judged from their last message alone');
  });

  it('a Sent read that fails for one person leaves that person judged by the inbound date, said so, and the rest by both sides', async () => {
    const listSent = vi.fn(async (recipient: string) => {
      if (recipient === DAVE) throw new Error('Gmail 503');
      return [];
    });
    const x = await loadIntelligence(db().client(), { now: NOW, identity: null, listSent });
    const dave = x.people.find((p) => p.id === DAVE)!;
    expect(dave.line).toContain('Our Sent could not be read for them, so a reply of ours may exist.');
    expect(x.selection.people).toMatch(/\(1 read failed\)/);
    expect(x.people.find((p) => p.id === OWED)).toBeUndefined();
  });
});
