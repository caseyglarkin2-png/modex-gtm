// @vitest-environment node
/**
 * X16 (GAP OS sales execution engine, 2026-10-08): calls are first-class activity. (a) Releasing the dial link records
 * the attempt (`call.attempt_started`, self-reported: a released link is not a call; a confirmed disposition is).
 * (b) A recorded no-answer or voicemail creates the follow-up itself: call them again in two business days, up to the
 * existing three-attempt hold (routing/rules.ts MAX_UNANSWERED_CALLS; after it the person is held and no follow-up
 * is made); a gatekeeper creates a task to get past them; an email-channel class never makes a call follow-up.
 * (c) The disposition service hands the builder the channel and the unanswered count since the last substantive
 * answer, the same count routing reads.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { commitmentsFromDisposition, loadCommitments, MAX_CALL_FOLLOW_UPS } from '@/lib/gap/work/commitments';
import { MAX_UNANSWERED_CALLS } from '@/lib/gap/routing/rules';
import { commitmentTier } from '@/lib/gap/work/commitment-model';
import { unansweredCallsFor } from '@/lib/gap/disposition/service';
import { CALL_ATTEMPT_STARTED, recordCallAttempt } from '@/lib/gap/execution/call-attempt';

const NOW = new Date('2026-10-08T15:00:00Z'); // Thu
const ACTOR = 'casey@freightroll.com';

describe('X16b: call outcomes make their own follow-ups', () => {
  let p: ReturnType<ReturnType<typeof ledgerDb>['client']>;
  const base = { accountName: 'Kroger Scratch Co', contactEmail: 'ann@kroger.example.com', personaId: 41, actor: ACTOR, now: NOW, stopsRun: false, channel: 'call' as const };
  beforeEach(() => {
    p = ledgerDb({ accounts: ['Kroger Scratch Co'], personas: [{ id: 41, name: 'Ann Scratch', email: 'ann@kroger.example.com', account_name: 'Kroger Scratch Co' }] }, NOW).client();
  });

  it('no answer and voicemail: a follow-up to call again in two business days, with the attempt count; the cap equals the routing hold', async () => {
    expect(MAX_CALL_FOLLOW_UPS).toBe(MAX_UNANSWERED_CALLS);
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-na', responseClass: 'no_answer', unansweredCalls: 1 });
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-vm', responseClass: 'voicemail', unansweredCalls: 2 });
    const all = await loadCommitments(p, { accountNames: ['Kroger Scratch Co'] });
    const na = all.find((c) => c.commitmentId === 'disposition:d-na')!;
    // The voicemail call settled the first call-again follow-up (that call was made); the newer one is open.
    expect(na).toMatchObject({ kind: 'follow_up', status: 'done', title: 'Call Ann Scratch again (attempt 2 of 3; no answer)', person: { personaId: 41, email: 'ann@kroger.example.com' }, proof: { kind: 'disposition', id: 'd-vm' }, detail: { callAgain: true } });
    expect(na.dueAt).toBe('2026-10-12T13:00:00.000Z'); // Mon Oct 12, 9 am New York
    expect(commitmentTier(na)).toBe('follow_up');
    expect(all.find((c) => c.commitmentId === 'disposition:d-vm')).toMatchObject({ status: 'open', title: 'Call Ann Scratch again (attempt 3 of 3; voicemail)' });
  });

  it('the third unanswered call makes no follow-up (the person is held); a gatekeeper makes a task; an email no-answer makes nothing', async () => {
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-3', responseClass: 'no_answer', unansweredCalls: 3 });
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-gk', responseClass: 'gatekeeper', unansweredCalls: 1 });
    await commitmentsFromDisposition(p, { ...base, dispositionId: 'd-email', responseClass: 'no_answer', channel: 'email', unansweredCalls: 0 });
    const all = await loadCommitments(p, { accountNames: ['Kroger Scratch Co'] });
    expect(all.map((c) => c.commitmentId)).toEqual(['disposition:d-gk']);
    expect(all[0]).toMatchObject({ kind: 'task', title: 'Get past the gatekeeper for Ann Scratch (a direct line, a colleague, a better time)' });
  });
});

describe('X16c: the service counts unanswered calls since the last substantive answer', () => {
  it('counts confirmed call dispositions of the unanswered classes after the newest substantive one', async () => {
    const rows = [
      { contact_email: 'ann@k.com', human_confirmed: true, channel: 'call', response_class: 'no_answer', created_at: new Date('2026-10-01T00:00:00Z') },
      { contact_email: 'ann@k.com', human_confirmed: true, channel: 'email', response_class: 'request_information', created_at: new Date('2026-10-02T00:00:00Z') },
      { contact_email: 'ann@k.com', human_confirmed: true, channel: 'call', response_class: 'voicemail', created_at: new Date('2026-10-03T00:00:00Z') },
      { contact_email: 'ann@k.com', human_confirmed: false, channel: 'call', response_class: 'no_answer', created_at: new Date('2026-10-04T00:00:00Z') },
    ];
    const prisma = {
      conversationDisposition: {
        findFirst: vi.fn(async (q: { where: { response_class?: { notIn?: string[] } } }) => rows.filter((r) => r.human_confirmed && !q.where.response_class?.notIn?.includes(r.response_class)).sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0] ?? null),
        count: vi.fn(async (q: { where: { created_at?: { gt: Date } } }) => rows.filter((r) => r.human_confirmed && r.channel === 'call' && ['no_answer', 'voicemail', 'gatekeeper'].includes(r.response_class) && (!q.where.created_at || r.created_at > q.where.created_at.gt)).length),
      },
    };
    expect(await unansweredCallsFor(prisma, 'ann@k.com')).toBe(1);
    expect(await unansweredCallsFor({ conversationDisposition: { findFirst: async () => null, count: async () => 2 } }, 'x@y.com')).toBe(2);
    expect(await unansweredCallsFor({}, 'x@y.com')).toBe(0);
  });
});

describe('X16a: a released dial link is recorded as an attempt, never as a call', () => {
  it('writes call.attempt_started with the card, the person and self-reported basis; a LinkedIn release records nothing', async () => {
    const db = ledgerDb({}, NOW);
    const r = await recordCallAttempt(db.client(), { decisionId: 'dec-1', accountName: 'Kroger Scratch Co', personaId: 41, channel: 'call', actor: ACTOR, now: NOW });
    expect(r).toEqual({ recorded: true });
    const rows = db.store.gapAuditEvent.filter((e) => e.kind === CALL_ATTEMPT_STARTED);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ subject_type: 'routing_decision', subject_id: 'dec-1', actor: ACTOR, payload: { accountName: 'Kroger Scratch Co', personaId: 41, basis: 'self_reported' } });
    expect(await recordCallAttempt(db.client(), { decisionId: 'dec-1', accountName: 'Kroger Scratch Co', personaId: 41, channel: 'linkedin', actor: ACTOR, now: NOW })).toEqual({ recorded: false });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === CALL_ATTEMPT_STARTED)).toHaveLength(1);
  });
});
