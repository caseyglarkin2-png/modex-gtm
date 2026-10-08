// @vitest-environment node
/**
 * X20b (GAP OS sales execution engine, 2026-10-08): activity semantics, the mandate's section 10. One projection over
 * the ledger into the thirteen activity kinds, each with a basis: provider (a system of record proves it) or
 * self_reported (the seller said so). Pinned: a copied email is content copied, never sent; a dial link is a call
 * attempted, never a conversation; a manual send without its Gmail id is self-reported, with one is provider; a
 * recorded disposition is a conversation completed (self-reported) and a meeting accepted is a meeting booked; a
 * refused action is work blocked; delivered is never a kind. The accountability view: what I intended (the plan's
 * items, each done, set aside or open by the events that complete them), what was completed by kind and basis, what
 * needs attention, what the agents are handling.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { ACTIVITY_KINDS, accountability, loadAccountability, loadActivity, projectActivity, type ActivityEvent, type LedgerRow } from '@/lib/gap/work/activity';
import { planDay, type DayPlan, type PlanItem } from '@/lib/gap/work/plan';
import type { AgentTask } from '@/lib/gap/agents/tasks';
import type { WorkCard, WorkDay } from '@/lib/gap/work/list';

const AT = new Date('2026-10-08T15:00:00Z');
const row = (kind: string, payload: unknown, over: Partial<LedgerRow> = {}): LedgerRow => ({ kind, subject_type: 'routing_decision', subject_id: 'dec-1', actor: 'casey@freightroll.com', payload, created_at: AT, ...over });

describe('X20b: the projection', () => {
  it('delivered is never a kind; every kind has a label', () => {
    expect(ACTIVITY_KINDS).not.toContain('message_delivered');
    expect(ACTIVITY_KINDS).toHaveLength(13);
  });

  it('copied is content copied (self-reported), never sent; a Gmail-proven send is provider; a manual send without its id is self-reported', () => {
    expect(projectActivity(row('execution.copy_released', { recipient: 'ann@kroger.example.com', stepIndex: 0 }))).toMatchObject({ kind: 'content_copied', basis: 'self_reported', who: 'ann@kroger.example.com' });
    expect(projectActivity(row('execution.reply_copied', {}, { subject_type: 'inbound_message', subject_id: 'm1' }))).toMatchObject({ kind: 'content_copied', basis: 'self_reported' });
    expect(projectActivity(row('execution.gmail_direct_sent', { recipient: 'ann@kroger.example.com', stepIndex: 0, gmailSentMessageId: 'g1', accountName: 'Kroger' }))).toMatchObject({ kind: 'message_sent', basis: 'provider', accountName: 'Kroger', completes: ['first_touch:dec-1', 'follow_up:Kroger:2026-10-08'] });
    expect(projectActivity(row('execution.gmail_manual_sent', { recipient: 'ann@kroger.example.com', stepIndex: 1 }))).toMatchObject({ kind: 'message_sent', basis: 'self_reported', line: expect.stringContaining('no Gmail id') });
    expect(projectActivity(row('execution.gmail_manual_sent', { recipient: 'ann@kroger.example.com', stepIndex: 1, gmailSentMessageId: 'g2' }))).toMatchObject({ kind: 'message_sent', basis: 'provider' });
    expect(projectActivity(row('execution.reply_sent', { recipient: 'ann@kroger.example.com', gmailSentMessageId: 'g3', reconciledFromSent: true }, { subject_type: 'inbound_message', subject_id: 'm1' }))).toMatchObject({ kind: 'message_sent', basis: 'provider', completes: ['reply:m1'], line: 'Answered ann@kroger.example.com in their thread (found in Sent).' });
  });

  it('a dial link is a call attempted (self-reported); a confirmed disposition is a conversation completed (self-reported); meeting accepted is a meeting booked; an unconfirmed disposition is nothing', () => {
    expect(projectActivity(row('call.attempt_started', { accountName: 'Kroger', personaId: 41, basis: 'self_reported' }))).toMatchObject({ kind: 'call_attempted', basis: 'self_reported', accountName: 'Kroger' });
    expect(projectActivity(row('disposition.recorded', { humanConfirmed: true, accountName: 'Kroger', contactEmail: 'ann@kroger.example.com', responseClass: 'no_answer', channel: 'call' }, { subject_type: 'disposition', subject_id: 'd1' }))).toMatchObject({ kind: 'conversation_completed', basis: 'self_reported', line: "Recorded ann@kroger.example.com's answer (no answer), by phone.", completes: ['reply:Kroger:2026-10-08'] });
    expect(projectActivity(row('disposition.recorded', { humanConfirmed: true, accountName: 'Kroger', contactEmail: 'ann@kroger.example.com', responseClass: 'meeting_accepted', channel: 'email' }))).toMatchObject({ kind: 'meeting_booked', basis: 'self_reported' });
    expect(projectActivity(row('disposition.recorded', { humanConfirmed: false, accountName: 'Kroger', responseClass: 'timing' }))).toBeNull();
  });

  it('drafts, approvals, proposals, research, replies, deals, deferrals and refusals each map to their kind; an unknown row is nothing', () => {
    expect(projectActivity(row('execution.gmail_drafted', { recipient: 'ann@kroger.example.com', accountName: 'Kroger' }))).toMatchObject({ kind: 'draft_created', basis: 'provider', completes: ['first_touch:dec-1'] });
    expect(projectActivity(row('execution.copy_revision_approved', { decisionId: 'dec-9' }))).toMatchObject({ kind: 'message_approved', basis: 'provider', completes: ['first_touch:dec-9'] });
    expect(projectActivity(row('work.command_applied', { command: 'approve', itemKey: 'first_touch:dec-1' }))).toMatchObject({ kind: 'message_approved', completes: ['first_touch:dec-1'] });
    expect(projectActivity(row('work.command_applied', { command: 'defer', itemKey: 'commitment:c-1', reason: 'tomorrow' }))).toMatchObject({ kind: 'task_deferred', basis: 'self_reported', completes: ['commitment:c-1'] });
    expect(projectActivity(row('work.command_applied', { command: 'next' }))).toBeNull();
    expect(projectActivity(row('execution.copy_revision_proposed', { decisionId: 'dec-1' }))).toMatchObject({ kind: 'proposal_prepared', basis: 'provider' });
    expect(projectActivity(row('agent.task_succeeded', { result: { objection: 'We already run a YMS.', accountName: 'PepsiCo' } }, { subject_type: 'agent_task', subject_id: 'at_1' }))).toMatchObject({ kind: 'proposal_prepared', accountName: 'PepsiCo' });
    expect(projectActivity(row('research.background_run', { ran: 3 }, { subject_type: 'background_research', subject_id: 'r1' }))).toMatchObject({ kind: 'research_generated', basis: 'provider' });
    expect(projectActivity(row('reply.ingested', { toEmail: 'casey@yardflow.ai' }, { subject_type: 'inbound_message', subject_id: 'm2' }))).toMatchObject({ kind: 'reply_received', basis: 'provider' });
    expect(projectActivity(row('crm.sync_result', { accountName: 'Kroger', outcome: 'ok' }, { subject_type: 'crm_proposal', subject_id: 'p1' }))).toMatchObject({ kind: 'deal_advanced', basis: 'provider' });
    expect(projectActivity(row('crm.sync_result', { accountName: 'Kroger', outcome: 'failed', detail: '403' }, { subject_type: 'crm_proposal', subject_id: 'p1' }))).toMatchObject({ kind: 'work_blocked', basis: 'provider' });
    expect(projectActivity(row('account.commitment', { op: 'status', commitmentId: 'c-7', commitment: { commitmentId: 'c-7', kind: 'deal_step', status: 'done', title: 'Send the pilot scope', proof: { kind: 'self', id: 'x' } } }, { subject_type: 'account', subject_id: 'Kroger' }))).toMatchObject({ kind: 'deal_advanced', basis: 'self_reported', accountName: 'Kroger', completes: ['commitment:c-7', 'deal:Kroger:2026-10-08'] });
    expect(projectActivity(row('account.commitment', { op: 'status', commitmentId: 'c-8', commitment: { commitmentId: 'c-8', kind: 'follow_up', status: 'snoozed', title: 'Call Ann again' } }, { subject_type: 'account', subject_id: 'Kroger' }))).toMatchObject({ kind: 'task_deferred', completes: ['commitment:c-8'] });
    expect(projectActivity(row('account.commitment', { op: 'create', commitment: { status: 'open' } }, { subject_type: 'account', subject_id: 'Kroger' }))).toBeNull();
    expect(projectActivity(row('account.work_outcome', { kind: 'skipped' }, { subject_type: 'account', subject_id: 'GXO' }))).toMatchObject({ kind: 'task_deferred', completes: expect.arrayContaining(['deal:GXO:2026-10-08', 'follow_up:GXO:2026-10-08']) });
    expect(projectActivity(row('execution.gmail_direct_refused', { reason: 'active_opportunity' }))).toMatchObject({ kind: 'work_blocked', basis: 'provider', line: 'An action was refused: active opportunity.' });
    expect(projectActivity(row('hypothesis.submitted', {}))).toBeNull();
  });
});

describe('X20b: the accountability view', () => {
  const item = (key: string, accountName: string, kind: PlanItem['kind'] = 'ready'): PlanItem => ({ key, rank: 0, accountName, kind, stateKind: 'ready', title: key, why: '', href: '/x', person: null, refs: {}, token: 'a'.repeat(32) });
  const ev = (kind: ActivityEvent['kind'], basis: ActivityEvent['basis'], completes: string[], at = AT.toISOString()): ActivityEvent => ({ kind, basis, at, accountName: null, who: null, line: kind, ref: { kind: 'x', subjectType: 'y', subjectId: 'z' }, completes });
  const task = (over: Partial<AgentTask>): AgentTask => ({ id: 't', kind: 'revise_message', itemKey: 'k', itemToken: '', day: '2026-10-08', revision: 0, request: '', requestedBy: '', requestedFrom: '', status: 'queued', attempts: 0, queuedAt: AT.toISOString(), leaseUntil: null, fence: null, result: null, lastError: null, final: false, supersededBy: null, ...over });

  it('each intended item is done by the event that completes it, set aside by a deferral, or open; completed counts split provider from self-reported; blocked and open go to attention; the agents by status', () => {
    const plan: DayPlan = { day: '2026-10-08', plannedAt: AT.toISOString(), fresh: false, counts: { needsYou: 3, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 }, items: [item('first_touch:dec-1', 'Kroger'), item('commitment:c-1', 'Dole', 'commitment'), item('follow_up:Kenco:2026-10-08', 'Kenco', 'follow_up')] };
    const events = [ev('draft_created', 'provider', ['first_touch:dec-1'], '2026-10-08T14:00:00Z'), ev('message_sent', 'provider', ['first_touch:dec-1'], '2026-10-08T15:00:00Z'), ev('task_deferred', 'self_reported', ['commitment:c-1']), ev('content_copied', 'self_reported', []), ev('work_blocked', 'provider', [])];
    const a = accountability({ day: '2026-10-08', plan, events, tasks: [task({ id: 'q', status: 'queued' }), task({ id: 's', status: 'succeeded' }), task({ id: 'f', status: 'failed', final: true }), task({ id: 'old', status: 'succeeded', queuedAt: '2026-10-07T15:00:00Z' })] });
    expect(a.intended.map((x) => [x.item.key, x.status, x.by?.kind ?? null])).toEqual([
      ['first_touch:dec-1', 'done', 'message_sent'],
      ['commitment:c-1', 'set_aside', 'task_deferred'],
      ['follow_up:Kenco:2026-10-08', 'open', null],
    ]);
    expect(a.completed).toEqual([
      { kind: 'draft_created', label: 'Draft created', provider: 1, selfReported: 0 },
      { kind: 'content_copied', label: 'Content copied', provider: 0, selfReported: 1 },
      { kind: 'message_sent', label: 'Message sent', provider: 1, selfReported: 0 },
      { kind: 'task_deferred', label: 'Task deferred', provider: 0, selfReported: 1 },
      { kind: 'work_blocked', label: 'Work blocked', provider: 1, selfReported: 0 },
    ]);
    expect(a.attention.open.map((i) => i.key)).toEqual(['follow_up:Kenco:2026-10-08']);
    expect(a.attention.blocked).toHaveLength(1);
    expect(a.agents.queued.map((t) => t.id)).toEqual(['q']);
    expect(a.agents.succeeded.map((t) => t.id)).toEqual(['s']);
    expect(a.agents.failed.map((t) => t.id)).toEqual(['f']);
    expect(a.events[0].kind).toBe('message_sent');
    expect(accountability({ day: '2026-10-08', plan: null, events: [], tasks: [] })).toMatchObject({ planned: false, intended: [], completed: [] });
  });

  it('the loader reads the day: the stored plan, the ledger rows of the day only, the tasks; a client without the ledger answers empty', async () => {
    const db = ledgerDb({ accounts: ['Kroger'] }, new Date('2026-10-08T11:00:00Z'));
    const c = db.client();
    const card = (accountName: string, tier: NonNullable<WorkCard['tier']>): WorkCard => ({ accountName, href: `/gap/accounts/${accountName.toLowerCase()}`, lane: 'ready', stateKind: 'follow_up', state: 'Follow up due', why: 'w', person: null, next: null, blocker: null, index: 0, source: 'pursuit', tier });
    const day: WorkDay = { cards: [card('Kroger', 'follow_up')], waiting: [], snoozed: [], counts: { needsYou: 1, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } };
    await planDay(c, { now: new Date('2026-10-08T11:00:00Z'), load: async () => day }, 'test');
    await c.gapAuditEvent.create({ data: { kind: 'execution.gmail_direct_sent', actor: 'x', subject_type: 'routing_decision', subject_id: 'dec-1', payload: { recipient: 'ann@kroger.example.com', stepIndex: 2, gmailSentMessageId: 'g1', accountName: 'Kroger' } } });
    await c.gapAuditEvent.create({ data: { kind: 'execution.copy_released', actor: 'x', subject_type: 'routing_decision', subject_id: 'dec-2', payload: { recipient: 'bob@dole.example.com', stepIndex: 0 } } });
    const yesterday = db.store.gapAuditEvent.find((e) => e.kind === 'execution.copy_released')!;
    yesterday.created_at = new Date('2026-10-07T15:00:00Z');
    const a = await loadAccountability(c, new Date('2026-10-08T20:00:00Z'));
    expect(a.planned).toBe(true);
    expect(a.events.map((e) => e.kind)).toEqual(['message_sent']);
    expect(a.intended.map((x) => [x.item.key, x.status])).toEqual([['follow_up:Kroger:2026-10-08', 'done']]);
    expect(await loadActivity({}, { since: AT, until: AT })).toEqual([]);
  });
});
