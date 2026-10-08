/**
 * R42b (independent audit at 31f09c71): "the person named in a referral gets no cold email until Casey chooses" was
 * recorded on the card but enforced nowhere. replies/referral-hold.ts is the one hold: an open referral obligation
 * naming the person (by email anywhere, or by full name at the account) holds them until the seller marks it done or
 * skipped. The gates that consume it (the send gate, live enrollment, routing) are pinned in their own suites.
 */
import { describe, expect, it } from 'vitest';
import { referralHoldDetail, referralHoldFor, referralHoldIn } from '@/lib/gap/replies/referral-hold';
import type { Commitment } from '@/lib/gap/work/commitment-model';
import { findManyFrom } from './fixtures/where';

const AT = '2026-10-05T15:00:00.000Z';
function referralCommitment(over: Partial<Commitment> & { person?: Commitment['person'] } = {}): Commitment {
  return {
    commitmentId: 'cmt-ref-1',
    accountName: 'Kroger',
    kind: 'referral',
    title: 'Ann named Bob Lane (VP Transportation): decide how to approach them',
    basis: 'Ann: talk to Bob Lane, our VP of Transportation.',
    owner: 'casey@freightroll.com',
    dueAt: AT,
    person: { personaId: null, name: 'Bob Lane', email: null },
    dealId: null,
    threadId: null,
    status: 'open',
    snoozeUntil: null,
    dependency: null,
    source: { kind: 'disposition', id: 'disp-1' },
    detail: null,
    proof: null,
    createdAt: AT,
    updatedAt: AT,
    ...over,
  } as Commitment;
}
/** The ledger row the commitment writer appends (work/commitments.ts `write`). */
function referralRow(c: Commitment, n = 0) {
  return { id: `evt-ref-${n}`, kind: 'account.commitment', actor: 'casey@freightroll.com', subject_type: 'account', subject_id: c.accountName, payload: { commitmentId: c.commitmentId, op: n === 0 ? 'create' : 'status', commitment: c }, created_at: new Date(new Date(AT).getTime() + n * 1000) };
}

describe('the referral hold (R42b)', () => {
  it('holds the named person by full name at the account, or by email anywhere; never the referrer, never a first-name-only match', () => {
    const byName = referralCommitment();
    expect(referralHoldIn([byName], { email: 'bob.lane@kroger.com', name: 'Bob Lane', accountName: 'Kroger' })).toMatchObject({ commitmentId: 'cmt-ref-1' });
    expect(referralHoldIn([byName], { email: 'b.lane@kroger.com', name: 'BOB  LANE', accountName: 'Kroger' })).not.toBeNull();
    expect(referralHoldIn([byName], { email: 'ann@kroger.com', name: 'Ann Scratch', accountName: 'Kroger' })).toBeNull();
    expect(referralHoldIn([byName], { email: 'bob@kroger.com', name: 'Bob', accountName: 'Kroger' })).toBeNull();
    expect(referralHoldIn([byName], { email: 'bob.lane@albertsons.com', name: 'Bob Lane', accountName: 'Albertsons' })).toBeNull();
    const byEmail = referralCommitment({ person: { personaId: null, name: 'Bob Lane', email: 'bob.lane@kroger.com' } });
    expect(referralHoldIn([byEmail], { email: 'Bob.Lane@Kroger.com', name: null, accountName: 'Kroger Fresh' })).not.toBeNull();
    // With an email on the obligation, a different address with the same name is someone else.
    expect(referralHoldIn([byEmail], { email: 'bob.lane2@kroger.com', name: 'Bob Lane', accountName: 'Kroger' })).toBeNull();
  });

  it('releases once the seller chose (done or skipped); a snooze or a wait does not release it', () => {
    const p = { email: 'bob.lane@kroger.com', name: 'Bob Lane', accountName: 'Kroger' };
    for (const status of ['done', 'skipped'] as const) expect(referralHoldIn([referralCommitment({ status })], p)).toBeNull();
    for (const status of ['open', 'snoozed', 'waiting', 'blocked'] as const) expect(referralHoldIn([referralCommitment({ status })], p)).not.toBeNull();
  });

  it('reads only referral obligations from the ledger and folds them: a later done row releases the hold', async () => {
    const open = referralCommitment();
    const rows: Array<Record<string, unknown>> = [referralRow(open), { ...referralRow({ ...open, commitmentId: 'cmt-fu', kind: 'follow_up', person: { personaId: null, name: 'Bob Lane', email: null } }), id: 'evt-fu' }];
    const prisma = { gapAuditEvent: { findMany: async (args: { where?: Record<string, unknown> }) => findManyFrom(rows, args) } };
    const p = { email: 'bob.lane@kroger.com', name: 'Bob Lane', accountName: 'Kroger' };
    const h = await referralHoldFor(prisma, p);
    expect(h).toMatchObject({ commitmentId: 'cmt-ref-1' });
    expect(referralHoldDetail(h!)).toBe('Ann named Bob Lane (VP Transportation). No cold email to them until you choose how to approach them: mark the referral done or skipped on Work.');
    rows.push(referralRow({ ...open, status: 'done' }, 1));
    expect(await referralHoldFor(prisma, p)).toBeNull();
  });

  it('an unreadable ledger throws: no gate reads it as clear', async () => {
    const prisma = { gapAuditEvent: { findMany: async () => { throw new Error('db down'); } } };
    await expect(referralHoldFor(prisma, { email: 'bob.lane@kroger.com', name: 'Bob Lane', accountName: 'Kroger' })).rejects.toThrow('db down');
  });
});
