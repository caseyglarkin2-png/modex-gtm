/**
 * R40 (GAP OS execution recovery): one durable commitment per obligation, its identity derived from its source, its
 * lifecycle explicit. Pinned here: a duplicate source writes nothing; done needs proof and is terminal (no transition,
 * no source re-firing and no reload reopens it); waiting, blocked, snoozed and skipped differ; two obligations at one
 * account stay two; the sources (a disposition, a snooze, a proven send) create exactly the record they should; the
 * phase read is New York days (no timezone shift).
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { addDays, dayLabel, endOfNyDay, nextBusinessDay, nyDay, nyDayAt, parseDuePhrase, parseReturnDate } from '@/lib/gap/work/dates';
import { commitmentPhase, commitmentTier, type Commitment } from '@/lib/gap/work/commitment-model';
import { commitmentIdFor, commitmentsFromDisposition, commitmentsFromOutcome, ensureCommitment, foldCommitments, loadCommitment, loadCommitments, syncFollowUpsFromLedger, transitionCommitment } from '@/lib/gap/work/commitments';
import { DIRECT_SENT } from '@/lib/gap/execution/draft-ledger';

const NOW = new Date('2026-10-06T19:00:00Z'); // Tue Oct 6, 3 pm New York
const ACTOR = 'casey@freightroll.com';
const ctx = { actor: ACTOR, now: NOW };

describe('the seller calendar is New York (no timezone shift)', () => {
  it('a late-evening phrase names the New York day, across daylight saving too', () => {
    const lateTuesday = new Date('2026-10-07T03:30:00Z'); // Tue Oct 6, 11:30 pm New York; already Wednesday in UTC
    expect(nyDay(lateTuesday)).toBe('2026-10-06');
    expect(parseDuePhrase('can you send me the dock schedule by Friday?', lateTuesday)).toEqual({ day: '2026-10-09', phrase: 'Friday', ambiguous: false });
    expect(parseDuePhrase('tomorrow works', lateTuesday)?.day).toBe('2026-10-07');
    expect(parseDuePhrase('next Friday', lateTuesday)).toMatchObject({ day: '2026-10-09', ambiguous: true });
    expect(parseDuePhrase('by Oct 20', NOW)?.day).toBe('2026-10-20');
    expect(parseDuePhrase('on 11/2', NOW)?.day).toBe('2026-11-02');
    expect(parseDuePhrase('end of the week', NOW)?.day).toBe('2026-10-09');
    expect(parseDuePhrase('no date in this sentence', NOW)).toBeNull();
    expect(nyDayAt('2026-10-30').toISOString()).toBe('2026-10-30T13:00:00.000Z'); // EDT
    expect(nyDayAt('2026-11-02').toISOString()).toBe('2026-11-02T14:00:00.000Z'); // EST after Nov 1
    expect(endOfNyDay(NOW).toISOString()).toBe('2026-10-07T04:00:00.000Z');
    expect(nextBusinessDay('2026-10-09')).toBe('2026-10-12');
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
    expect(dayLabel('2026-10-07', NOW)).toBe('tomorrow');
    expect(dayLabel('2026-10-12', NOW)).toBe('Oct 12');
    expect(parseReturnDate('I am out of the office and will return on Monday, October 12.', NOW)?.day).toBe('2026-10-12');
    expect(parseReturnDate('Out of office through Friday Oct 9 with limited access to email.', NOW)?.day).toBe('2026-10-12');
  });
});

describe('identity and lifecycle (R40)', () => {
  it('a duplicate source writes nothing: the id is the source, the create is one-shot', async () => {
    const db = ledgerDb({ accounts: ['Pepsi Scratch Co'] });
    const p = db.client();
    const input = { accountName: 'Pepsi Scratch Co', kind: 'deliverable' as const, title: 'Send Ann the dock schedule template', dueAt: nyDayAt('2026-10-09'), source: { kind: 'capture' as const, id: 'cap1:c2' } };
    const a = await ensureCommitment(p, input, ctx);
    const b = await ensureCommitment(p, { ...input, title: 'A different title from a retry' }, ctx);
    expect(a).toMatchObject({ ok: true, created: true });
    expect(b).toMatchObject({ ok: true, created: false });
    expect(b.ok && b.commitment.title).toBe('Send Ann the dock schedule template');
    expect(db.store.gapAuditEvent).toHaveLength(1);
    expect(a.ok && a.commitment.commitmentId).toBe(commitmentIdFor(input.source));
    expect(await ensureCommitment(p, { ...input, accountName: 'Nobody Co', source: { kind: 'capture', id: 'x' } }, ctx)).toEqual({ ok: false, reason: 'account_not_found' });
    expect(await ensureCommitment(p, { ...input, title: '  ', source: { kind: 'capture', id: 'y' } }, ctx)).toEqual({ ok: false, reason: 'title_required' });
    expect(await ensureCommitment(p, { ...input, status: 'waiting', source: { kind: 'capture', id: 'z' } }, ctx)).toEqual({ ok: false, reason: 'dependency_required' });
  });

  it('done needs proof and is terminal: no transition, no re-fired source and no reload (another instance) reopens it', async () => {
    const db = ledgerDb({ accounts: ['Pepsi Scratch Co'] });
    const p = db.client();
    const made = await ensureCommitment(p, { accountName: 'Pepsi Scratch Co', kind: 'answer_request', title: 'Answer Ann', source: { kind: 'disposition', id: 'd1' } }, ctx);
    const id = made.ok ? made.commitment.commitmentId : '';
    expect(await transitionCommitment(p, { commitmentId: id, to: 'done', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'proof_required' });
    expect(await transitionCommitment(p, { commitmentId: id, to: 'done', proof: { kind: 'ledger' }, actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'proof_required' });
    // Batch item 8: the seller's own Done is proved by its words; a bare click (no note, or blank) proves nothing.
    expect(await transitionCommitment(p, { commitmentId: id, to: 'done', proof: { kind: 'seller' }, actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'proof_required' });
    expect(await transitionCommitment(p, { commitmentId: id, to: 'done', proof: { kind: 'seller', note: '   ' }, actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'proof_required' });
    const done = await transitionCommitment(p, { commitmentId: id, to: 'done', proof: { kind: 'seller', note: 'sent the spec sheet from my phone' }, actor: ACTOR, now: NOW });
    expect(done.ok && done.commitment.proof).toMatchObject({ kind: 'seller', id: null, note: 'sent the spec sheet from my phone', by: ACTOR });
    expect(await transitionCommitment(p, { commitmentId: id, to: 'open', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'terminal', status: 'done' });
    expect(await ensureCommitment(p, { accountName: 'Pepsi Scratch Co', kind: 'answer_request', title: 'Answer Ann', source: { kind: 'disposition', id: 'd1' } }, ctx)).toMatchObject({ ok: true, created: false, commitment: { status: 'done' } });
    // Another instance: a fresh client over the same rows.
    expect((await loadCommitment(db.client(), id))?.status).toBe('done');
    // Even a hand-written later row cannot reopen it (the fold refuses it too).
    const reopened = { ...(await loadCommitment(p, id))!, status: 'open' };
    db.store.gapAuditEvent.push({ id: 'zz', kind: 'account.commitment', subject_type: 'account', subject_id: 'Pepsi Scratch Co', created_at: new Date('2027-01-01T00:00:00Z'), payload: { commitmentId: id, op: 'status', commitment: reopened } });
    expect((await loadCommitment(db.client(), id))?.status).toBe('done');
  });

  it('completed, waiting, blocked, skipped and snoozed are different records with different phases', async () => {
    const db = ledgerDb({ accounts: ['Kroger Scratch Co'] });
    const p = db.client();
    const mk = async (id: string) => {
      const r = await ensureCommitment(p, { accountName: 'Kroger Scratch Co', kind: 'task', title: `Task ${id}`, dueAt: NOW, source: { kind: 'seller', id } }, ctx);
      return r.ok ? r.commitment.commitmentId : '';
    };
    const [w, b, s, k] = [await mk('w'), await mk('b'), await mk('s'), await mk('k')];
    expect(await transitionCommitment(p, { commitmentId: w, to: 'waiting', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'dependency_required' });
    await transitionCommitment(p, { commitmentId: w, to: 'waiting', dependency: 'their volumes', actor: ACTOR, now: NOW });
    await transitionCommitment(p, { commitmentId: b, to: 'blocked', dependency: 'legal review of the pilot terms', actor: ACTOR, now: NOW });
    expect(await transitionCommitment(p, { commitmentId: s, to: 'snoozed', until: '2026-10-01T00:00:00Z', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'until_in_past' });
    expect(await transitionCommitment(p, { commitmentId: s, to: 'snoozed', until: '2027-06-01T00:00:00Z', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'until_too_far' });
    await transitionCommitment(p, { commitmentId: s, to: 'snoozed', until: nyDayAt('2026-10-09').toISOString(), actor: ACTOR, now: NOW });
    await transitionCommitment(p, { commitmentId: k, to: 'skipped', reason: 'they hired a 3PL', actor: ACTOR, now: NOW });
    const all = await loadCommitments(p, { accountNames: ['Kroger Scratch Co'] });
    expect(all).toHaveLength(4);
    const phase = (id: string) => commitmentPhase(all.find((c) => c.commitmentId === id)!, NOW);
    expect(phase(w)).toMatchObject({ phase: 'due' }); // waiting with a due time today is due (the dependency is said)
    expect(phase(b)).toMatchObject({ phase: 'blocked', line: 'Blocked: legal review of the pilot terms.' });
    expect(phase(s)).toMatchObject({ phase: 'snoozed', line: 'Snoozed until Oct 9.' });
    expect(phase(k)).toMatchObject({ phase: 'skipped', line: 'Skipped (they hired a 3PL).' });
    // The snooze returns on its date, never before, unless the buyer moved after it was set.
    const snoozed = all.find((c) => c.commitmentId === s)!;
    expect(commitmentPhase(snoozed, new Date('2026-10-09T13:00:00Z')).phase).toBe('due');
    expect(commitmentPhase(snoozed, new Date('2026-10-08T13:00:00Z'), () => 'Ann replied Oct 8.')).toMatchObject({ phase: 'due', returnedEarly: true });
  });

  it('two obligations at one account stay two, each with its own due day and tier', async () => {
    const db = ledgerDb({ accounts: ['Nfi Scratch Co'] });
    const p = db.client();
    await ensureCommitment(p, { accountName: 'Nfi Scratch Co', kind: 'deliverable', title: 'Send the two-site comparison', dueAt: nyDayAt('2026-10-06'), source: { kind: 'capture', id: 'c:1' } }, ctx);
    await ensureCommitment(p, { accountName: 'Nfi Scratch Co', kind: 'prepare_meeting', title: 'Prepare the Thursday meeting', dueAt: nyDayAt('2026-10-08'), source: { kind: 'disposition', id: 'd:9' } }, ctx);
    const all = await loadCommitments(p, { accountNames: ['Nfi Scratch Co'] });
    expect(all.map((c) => [c.title, commitmentPhase(c, NOW).phase, commitmentTier(c)])).toEqual([
      ['Send the two-site comparison', 'due', 'commitment'],
      ['Prepare the Thursday meeting', 'upcoming', 'meeting'],
    ]);
  });
});

describe('the sources that create commitments (R40)', () => {
  it('a confirmed disposition: answer a request, prepare a meeting, a dated not-now, a referral that names someone; a duplicate creates nothing; the answer closes the follow-up waiting on that person', async () => {
    const db = ledgerDb({ accounts: ['Nfi Scratch Co'], personas: [{ id: 41, name: 'Ann Scratch', email: 'ann@nfi.example.com', account_name: 'Nfi Scratch Co' }] });
    const p = db.client();
    const base = { accountName: 'Nfi Scratch Co', contactEmail: 'ann@nfi.example.com', personaId: 41, actor: ACTOR, now: NOW, stopsRun: true };
    const fu = await ensureCommitment(p, { accountName: 'Nfi Scratch Co', kind: 'follow_up', status: 'waiting', dependency: "Ann's reply", title: 'Follow up with Ann', dueAt: nyDayAt('2026-10-12'), person: { personaId: 41, name: 'Ann Scratch', email: 'ann@nfi.example.com' }, source: { kind: 'send', id: 'k0' } }, ctx);
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-req', responseClass: 'request_information', nextBestAction: 'send the two-site comparison', buyerLanguage: 'Send me the two-site comparison.' });
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-req', responseClass: 'request_information' });
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-meet', responseClass: 'meeting_accepted' });
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-later', responseClass: 'timing', resumeAt: nyDayAt('2026-11-02') });
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-ref', responseClass: 'referral', referral: { name: 'Bob Lane', title: 'VP Operations' } });
    const all = await loadCommitments(p, { accountNames: ['Nfi Scratch Co'] });
    const by = (id: string) => all.find((c) => c.commitmentId === id)!;
    expect(by('disposition:d-req')).toMatchObject({ kind: 'answer_request', status: 'open', title: "Answer Ann's request: send the two-site comparison", basis: 'Ann Scratch: "Send me the two-site comparison."' });
    expect(all.filter((c) => c.commitmentId === 'disposition:d-req')).toHaveLength(1);
    expect(by('disposition:d-meet')).toMatchObject({ kind: 'prepare_meeting', title: 'Prepare the meeting with Ann Scratch' });
    expect(by('disposition:d-later')).toMatchObject({ kind: 'reminder', status: 'snoozed', snoozeUntil: '2026-11-02T14:00:00.000Z' });
    // The referral names the referred person, never the referrer; nothing implies consent or a relationship.
    expect(by('disposition:d-ref')).toMatchObject({ kind: 'referral', title: 'Ann named Bob Lane (VP Operations): decide how to approach them', person: { personaId: null, name: 'Bob Lane' } });
    expect(commitmentTier(by('disposition:d-ref'))).toBe('reply');
    // The follow-up waiting on Ann is done, the disposition its proof.
    expect(by(fu.ok ? fu.commitment.commitmentId : '')).toMatchObject({ status: 'done', proof: { kind: 'disposition', id: 'd-req' } });
  });

  it('a snooze is a reminder that returns on its date; a newer snooze replaces it; clear skips it', async () => {
    const db = ledgerDb({ accounts: ['Pepsi Scratch Co'] });
    const p = db.client();
    await commitmentsFromOutcome(p, { outcomeId: 'o1', accountName: 'Pepsi Scratch Co', kind: 'snoozed', until: nyDayAt('2026-10-09').toISOString(), reason: 'travel', actor: ACTOR, now: NOW });
    await commitmentsFromOutcome(p, { outcomeId: 'o1', accountName: 'Pepsi Scratch Co', kind: 'snoozed', until: nyDayAt('2026-10-09').toISOString(), reason: 'travel', actor: ACTOR, now: NOW });
    let all = await loadCommitments(p, { accountNames: ['Pepsi Scratch Co'] });
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ kind: 'reminder', status: 'snoozed', title: 'Back to Pepsi Scratch Co: travel' });
    await commitmentsFromOutcome(p, { outcomeId: 'o2', accountName: 'Pepsi Scratch Co', kind: 'snoozed', until: nyDayAt('2026-10-14').toISOString(), reason: null, actor: ACTOR, now: NOW });
    await commitmentsFromOutcome(p, { outcomeId: 'o3', accountName: 'Pepsi Scratch Co', kind: 'clear', until: null, reason: null, actor: ACTOR, now: NOW });
    all = await loadCommitments(p, { accountNames: ['Pepsi Scratch Co'] });
    expect(all.map((c) => [c.source.id, c.status, c.reason])).toEqual([
      ['o1', 'skipped', 'replaced by a newer snoozed'],
      ['o2', 'skipped', 'snooze cleared'],
    ]);
  });

  // Batch item 8: a skip, clear or log on the account completed a reminder that had come back (done, "outcome" proof).
  it('a reminder that came back is never completed by an account outcome: a skip brings it back tomorrow, a clear or a log leaves it due', async () => {
    const db = ledgerDb({ accounts: ['Pepsi Scratch Co'] });
    const p = db.client();
    await commitmentsFromOutcome(p, { outcomeId: 'o1', accountName: 'Pepsi Scratch Co', kind: 'snoozed', until: nyDayAt('2026-10-07').toISOString(), reason: 'travel', actor: ACTOR, now: NOW });
    const back = new Date('2026-10-07T16:00:00Z'); // Wed Oct 7, noon New York: the reminder is back
    const reminder = async () => (await loadCommitments(p, { accountNames: ['Pepsi Scratch Co'] })).find((c) => c.source.id === 'o1')!;
    expect(commitmentPhase(await reminder(), back).phase).toBe('due');
    await commitmentsFromOutcome(p, { outcomeId: 'o2', accountName: 'Pepsi Scratch Co', kind: 'logged', until: null, reason: 'called', actor: ACTOR, now: back });
    await commitmentsFromOutcome(p, { outcomeId: 'o3', accountName: 'Pepsi Scratch Co', kind: 'clear', until: null, reason: null, actor: ACTOR, now: back });
    expect(await reminder()).toMatchObject({ status: 'snoozed', proof: null });
    expect(commitmentPhase(await reminder(), back).phase).toBe('due');
    await commitmentsFromOutcome(p, { outcomeId: 'o4', accountName: 'Pepsi Scratch Co', kind: 'skipped', until: null, reason: null, actor: ACTOR, now: back });
    const r = await reminder();
    expect(r).toMatchObject({ status: 'snoozed', snoozeUntil: nyDayAt('2026-10-08', 0).toISOString(), proof: null });
    expect(commitmentPhase(r, back).phase).toBe('snoozed');
    expect(commitmentPhase(r, new Date('2026-10-08T13:00:00Z')).phase).toBe('due');
  });

  it('a proven send leaves ONE waiting follow-up, due when the next touch is (or the house interval with no follow-up copy); a re-run adds nothing; the next send closes it with the ledger row', async () => {
    const twoStep = { id: 'v2', steps: { schema: 'gap.sequence.steps.v2', steps: [] } };
    const db = ledgerDb({ accounts: ['Fedex Scratch Co'], personas: [{ id: 7, name: 'Glen Scratch', email: 'glen@fedex.example.com', account_name: 'Fedex Scratch Co' }], sequenceVersions: [twoStep] });
    const p = db.client();
    const send = (id: string, step: number, sentAt: string) => db.store.gapAuditEvent.push({ id, kind: DIRECT_SENT, actor: ACTOR, subject_type: 'routing_decision', subject_id: 'dec1', created_at: new Date(sentAt), payload: { accountName: 'Fedex Scratch Co', personaId: 7, recipient: 'glen@fedex.example.com', stepIndex: step, sentAt, sequenceVersionId: 'v1', confirmedBy: ACTOR } });
    send('s0', 0, '2026-10-06T15:00:00Z');
    expect(await syncFollowUpsFromLedger(p, NOW)).toEqual({ created: 1, closed: 0 });
    expect(await syncFollowUpsFromLedger(p, NOW)).toEqual({ created: 0, closed: 0 });
    const [fu] = await loadCommitments(p, { accountNames: ['Fedex Scratch Co'] });
    // Single-step version (unknown here): the house interval, four business days, flagged as having no follow-up copy.
    expect(fu).toMatchObject({ kind: 'follow_up', status: 'waiting', title: 'Follow up with Glen Scratch', dueAt: '2026-10-12T13:00:00.000Z', person: { personaId: 7, email: 'glen@fedex.example.com' }, detail: { stepIndex: 1, decisionId: 'dec1', noFollowUpCopy: true } });
    expect(commitmentPhase(fu, NOW)).toMatchObject({ phase: 'waiting', line: "Waiting on Glen's reply; follow up Oct 12." });
    expect(commitmentPhase(fu, new Date('2026-10-12T15:00:00Z'))).toMatchObject({ phase: 'due', line: 'Follow-up due today: no reply from Glen Scratch.' });
    // A reply after the send blocks the follow-up: answer the reply first.
    expect(commitmentPhase(fu, new Date('2026-10-12T15:00:00Z'), () => 'Glen replied Oct 8.')).toMatchObject({ phase: 'blocked', line: 'Glen replied Oct 8. Answer that, not a follow-up.' });
    send('s1', 1, '2026-10-12T16:00:00Z');
    const r = await syncFollowUpsFromLedger(p, new Date('2026-10-12T17:00:00Z'));
    expect(r).toEqual({ created: 1, closed: 1 });
    const after = await loadCommitments(p, { accountNames: ['Fedex Scratch Co'] });
    expect(after.find((c) => c.commitmentId === fu.commitmentId)).toMatchObject({ status: 'done', proof: { kind: 'ledger', id: 's1' } });
    expect(after.filter((c) => c.status === 'waiting').map((c) => c.detail?.stepIndex)).toEqual([2]);
  });

  it('the fold keeps the newest snapshot per id and ignores rows that are not commitments', () => {
    const c = (status: string, at: string) => ({ id: at, created_at: new Date(at), payload: { commitmentId: 'seller:x', commitment: { commitmentId: 'seller:x', accountName: 'A', status } as unknown as Commitment } });
    const m = foldCommitments([c('waiting', '2026-10-06T10:00:00Z'), c('open', '2026-10-06T09:00:00Z'), { id: 'n', created_at: new Date(), payload: { kind: 'skipped' } }]);
    expect(m.get('seller:x')?.status).toBe('waiting');
    expect(m.size).toBe(1);
  });
});
