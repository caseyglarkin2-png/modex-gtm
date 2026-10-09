// @vitest-environment node
/**
 * Knowledge program C3 (2026-10-09): the DONE note becomes records. `readDoneNote(note, { now })` reads a completion
 * note for FACTS: a dated meeting (a day on or after today, read in New York) and a sent note (to whom, which day,
 * which channel); without a clock the reading is exactly what it was (the done-note pins stand). The commitment writer
 * `commitmentsFromSellerNote` turns a meeting fact into ONE prepare_meeting commitment at the account (waiting, due
 * 8 am New York on the day, the seller's words as the basis, source seller_note keyed by the Gmail message and the
 * day), idempotent by the day and by the source; a sent fact writes nothing there. Casey's October 9 Kenco note is the pin.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { doneNoteFacts, readDoneNote } from '@/lib/gap/work/done-note';
import { commitmentsFromSellerNote, loadCommitments, SELLER_NOTE_MEETING_HOUR } from '@/lib/gap/work/commitments';
import { nyDayAt } from '@/lib/gap/work/dates';

const NOW = new Date('2026-10-09T14:00:00Z'); // Fri Oct 9, 10 am New York
const OCT9 = 'we have meeting scheduled for 10.14.2026. sent them a quick note today to keep em warm and remind them';

describe('C3: the facts a DONE note states', () => {
  it("Casey's October 9 note: a completion with a meeting Oct 14 and a note sent to them today; without a clock, no facts", () => {
    const r = readDoneNote(OCT9, { now: NOW });
    expect(r).toEqual({
      kind: 'completion',
      note: OCT9,
      facts: [
        { kind: 'meeting', day: '2026-10-14', phrase: '10/14/2026', ambiguous: false, words: 'we have meeting scheduled for 10/14/2026.' },
        { kind: 'sent', who: 'them', when: '2026-10-09', channel: 'email', phrase: 'sent', words: 'sent them a quick note today to keep em warm and remind them' },
      ],
    });
    expect(readDoneNote(OCT9), 'no clock: the reading is what it was').toEqual({ kind: 'completion', note: OCT9 });
    // With the signature block the facts are the same (the words are cut before they are read).
    expect(readDoneNote(`${OCT9}\n\n--\nCasey Larkin · Founding AE, YardFlow by FreightRoll`, { now: NOW })).toMatchObject({ kind: 'completion', note: OCT9 });
  });

  it('a dated meeting: "meeting Oct 14", "call next Tuesday" (ambiguous), a past day is none, a held meeting is none', () => {
    expect(doneNoteFacts('meeting Oct 14 with Dave', NOW)).toEqual([{ kind: 'meeting', day: '2026-10-14', phrase: 'Oct 14', ambiguous: false, words: 'meeting Oct 14 with Dave' }]);
    expect(doneNoteFacts('call next Tuesday', NOW)).toEqual([{ kind: 'meeting', day: '2026-10-13', phrase: 'next Tuesday', ambiguous: true, words: 'call next Tuesday' }]);
    expect(doneNoteFacts('demo tomorrow at 2', NOW)[0]).toMatchObject({ kind: 'meeting', day: '2026-10-10' });
    expect(doneNoteFacts('meeting Oct 1 went well', NOW), 'a day before today is not a meeting to prepare').toEqual([]);
    expect(doneNoteFacts('had the call today, they want a pilot', NOW), 'a held meeting is a conversation, not a meeting ahead').toEqual([]);
    expect(doneNoteFacts('meeting with Dave, no date yet', NOW), 'no day named: no fact').toEqual([]);
    expect(doneNoteFacts('spent 1.5 hours on the deck', NOW), 'a decimal is not a date').toEqual([]);
  });

  it('a sent note: who, which day (today unless said; a weekday is the one just past; yesterday), which channel', () => {
    expect(doneNoteFacts('emailed Dave', NOW)).toEqual([{ kind: 'sent', who: 'Dave', when: '2026-10-09', channel: 'email', phrase: 'emailed', words: 'emailed Dave' }]);
    expect(doneNoteFacts('called Craig', NOW)[0]).toMatchObject({ kind: 'sent', who: 'Craig', when: '2026-10-09', channel: 'call' });
    expect(doneNoteFacts('sent the deck to Dave Kiesling', NOW)[0]).toMatchObject({ kind: 'sent', who: 'Dave Kiesling', channel: 'email' });
    expect(doneNoteFacts('left them a voicemail yesterday', NOW)[0]).toMatchObject({ kind: 'sent', who: 'them', when: '2026-10-08', channel: 'call' });
    expect(doneNoteFacts('emailed Dave Monday', NOW)[0], 'Monday said on a Friday is the Monday just past').toMatchObject({ when: '2026-10-05' });
    expect(doneNoteFacts('texted Craig', NOW)[0]).toMatchObject({ channel: 'message' });
    expect(doneNoteFacts('sent it over', NOW)[0], 'nobody named is null, still a send').toMatchObject({ kind: 'sent', who: null });
    // The first clause decides the send's day: "called Joey, he will send the comparison Friday" is a call today.
    expect(doneNoteFacts('called Joey, he will send the comparison Friday', NOW)).toEqual([{ kind: 'sent', who: 'Joey', when: '2026-10-09', channel: 'call', phrase: 'called', words: 'called Joey' }]);
    expect(doneNoteFacts('researching catalysts', NOW), 'no fact in a progress note').toEqual([]);
  });
});

describe('C3: commitmentsFromSellerNote, the writer', () => {
  const facts = () => doneNoteFacts(OCT9, NOW);

  it('a meeting fact writes one prepare_meeting at the account: waiting, due 8 am New York on the day, the words as the basis, source seller_note; a sent fact writes nothing', async () => {
    const db = ledgerDb({ accounts: ['Kenco'] }, NOW);
    const c = db.client();
    const r = await commitmentsFromSellerNote(c, { accountName: 'Kenco', facts: facts(), note: OCT9, gmailMessageId: 'gm-oct9', person: { personaId: 7, name: 'Dave Kiesling', email: 'dave.kiesling@kencogroup.com' }, actor: 'casey@freightroll.com', now: NOW });
    expect(r.meetings).toEqual([{ day: '2026-10-14', commitmentId: 'seller_note:gm-oct9:2026-10-14', created: true, title: 'Prepare the meeting with Dave Kiesling (Oct 14)' }]);
    const all = await loadCommitments(c, { accountNames: ['Kenco'] });
    expect(all, 'one commitment, never one per sent fact').toHaveLength(1);
    expect(all[0]).toMatchObject({
      kind: 'prepare_meeting',
      status: 'waiting',
      dueAt: nyDayAt('2026-10-14', SELLER_NOTE_MEETING_HOUR).toISOString(),
      dependency: 'the meeting day, Oct 14',
      basis: `Your note of Oct 9: ${OCT9}`,
      person: { personaId: 7, name: 'Dave Kiesling', email: 'dave.kiesling@kencogroup.com' },
      source: { kind: 'seller_note', id: 'gm-oct9:2026-10-14' },
      detail: { meetingAt: nyDayAt('2026-10-14', 8).toISOString() },
    });
    expect(all[0].dueAt).toBe('2026-10-14T12:00:00.000Z');
  });

  it('idempotent by the day: a second note naming the same day (another message) returns the existing one; a different day is a second commitment; the same message read twice writes nothing', async () => {
    const db = ledgerDb({ accounts: ['Kenco'] }, NOW);
    const c = db.client();
    const first = await commitmentsFromSellerNote(c, { accountName: 'Kenco', facts: facts(), note: OCT9, gmailMessageId: 'gm-oct9', actor: 'casey@freightroll.com', now: NOW });
    const again = await commitmentsFromSellerNote(c, { accountName: 'Kenco', facts: doneNoteFacts('meeting Oct 14 confirmed', NOW), note: 'meeting Oct 14 confirmed', gmailMessageId: 'gm-later', actor: 'casey@freightroll.com', now: new Date('2026-10-10T14:00:00Z') });
    expect(again.meetings).toEqual([{ day: '2026-10-14', commitmentId: first.meetings[0].commitmentId, created: false, title: 'Prepare the meeting (Oct 14)' }]);
    const same = await commitmentsFromSellerNote(c, { accountName: 'Kenco', facts: facts(), note: OCT9, gmailMessageId: 'gm-oct9', actor: 'casey@freightroll.com', now: NOW });
    expect(same.meetings[0]).toMatchObject({ commitmentId: first.meetings[0].commitmentId, created: false });
    const other = await commitmentsFromSellerNote(c, { accountName: 'Kenco', facts: doneNoteFacts('walkthrough Oct 21', NOW), note: 'walkthrough Oct 21', gmailMessageId: 'gm-3', actor: 'casey@freightroll.com', now: NOW });
    expect(other.meetings[0]).toMatchObject({ day: '2026-10-21', created: true });
    expect(await loadCommitments(c, { accountNames: ['Kenco'] })).toHaveLength(2);
    // Two meetings in one note: two days, two commitments, one write each.
    const db2 = ledgerDb({ accounts: ['Kenco'] }, NOW);
    const two = await commitmentsFromSellerNote(db2.client(), { accountName: 'Kenco', facts: doneNoteFacts('call Oct 14. site visit Oct 28.', NOW), note: 'x', gmailMessageId: 'gm-2', actor: 'a', now: NOW });
    expect(two.meetings.map((m) => [m.day, m.created])).toEqual([['2026-10-14', true], ['2026-10-28', true]]);
  });

  it('no meeting fact, an unknown account, or an unreadable ledger: nothing is written and nothing throws', async () => {
    const db = ledgerDb({ accounts: ['Kenco'] }, NOW);
    expect((await commitmentsFromSellerNote(db.client(), { accountName: 'Kenco', facts: doneNoteFacts('emailed Dave', NOW), note: 'emailed Dave', gmailMessageId: 'g', actor: 'a', now: NOW })).meetings).toEqual([]);
    expect((await commitmentsFromSellerNote(db.client(), { accountName: 'Nobody Co', facts: facts(), note: OCT9, gmailMessageId: 'g', actor: 'a', now: NOW })).meetings, 'the writer refuses an unknown account').toEqual([]);
    expect(db.store.gapAuditEvent).toHaveLength(0);
    expect((await commitmentsFromSellerNote({}, { accountName: 'Kenco', facts: facts(), note: OCT9, gmailMessageId: 'g', actor: 'a', now: NOW })).meetings).toEqual([]);
  });
});
