// @vitest-environment node
/**
 * C36, C37, C38a, C38b, C38c (GAP OS commercial context and execution audit, 2026-10-08): activity truth. The audit's
 * independent probes reproduced four defects in work/activity.ts, each converted here:
 *   C36   a draft-only first touch completed outreach accountability. Now a draft or an approval PREPARES the item
 *         (status `prepared`, awaiting send); a provider send or an explicit seller-reported send completes it, with
 *         its basis.
 *   C37   a meeting outcome counted as a booking. Now disqualified_problem, no_decision and more_discovery (and every
 *         other outcome) are `meeting_outcome_captured`; accepted (`meeting_accepted`), booked (`meeting_booked`, a
 *         calendar proof) and outcome captured are three kinds.
 *   C38a  a CRM note or task write counted as deal advancement. Now it is `crm_updated`, never `deal_advanced`.
 *   C38b  a recovered CRM write counted as a failure. Now recovered is an update; off, conflict and failed map apart.
 *   C38c  advancement needs an explicit stage transition (deal.stage_changed) or a defined milestone confirmed on one
 *         deal id, with its basis; a deal step done with no deal or no milestone is an obligation done.
 */
import { describe, expect, it } from 'vitest';
import { ACTIVITY_CLASS, ACTIVITY_KINDS, DEAL_STAGE_CHANGED, MEETING_BOOKED, accountability, projectActivity, type ActivityEvent, type LedgerRow } from '@/lib/gap/work/activity';
import { MEETING_OUTCOMES } from '@/lib/gap/capture/store';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';

const AT = new Date('2026-10-08T15:00:00Z');
const row = (kind: string, payload: unknown, over: Partial<LedgerRow> = {}): LedgerRow => ({ kind, subject_type: 'routing_decision', subject_id: 'dec-1', actor: 'casey@freightroll.com', payload, created_at: AT, ...over });
const item = (key: string, accountName: string, kind: PlanItem['kind'] = 'ready'): PlanItem => ({ key, rank: 0, accountName, kind, stateKind: 'ready', title: key, why: '', href: '/x', person: null, refs: {}, token: 'a'.repeat(32) });
const plan = (...items: PlanItem[]): DayPlan => ({ day: '2026-10-08', plannedAt: AT.toISOString(), fresh: false, counts: { needsYou: items.length, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 }, items });
const project = (r: LedgerRow): ActivityEvent => {
  const e = projectActivity(r);
  if (!e) throw new Error(`expected an event from ${r.kind}`);
  return e;
};
const counts = (events: ActivityEvent[]) => Object.fromEntries(accountability({ day: '2026-10-08', plan: null, events, tasks: [] }).completed.map((c) => [c.kind, c.provider + c.selfReported]));

describe('C36: a draft prepares an outreach item; only a send completes it', () => {
  const first = item('first_touch:dec-1', 'Kroger');
  const drafted = project(row('execution.gmail_drafted', { recipient: 'ann@kroger.example.com', accountName: 'Kroger' }));
  const approved = project(row('work.command_applied', { command: 'approve', itemKey: 'first_touch:dec-1' }));

  it('a draft-only first touch is prepared, not done: it sits in attention as awaiting send, and the draft is what prepared it', () => {
    expect(drafted).toMatchObject({ kind: 'draft_created', basis: 'provider', completes: [], prepares: ['first_touch:dec-1'] });
    expect(drafted.line).toMatch(/not a send/);
    const a = accountability({ day: '2026-10-08', plan: plan(first), events: [drafted, approved], tasks: [] });
    expect(a.intended).toEqual([{ item: first, status: 'prepared', by: approved }]);
    expect(a.attention.prepared.map((i) => i.key)).toEqual(['first_touch:dec-1']);
    expect(a.attention.open).toEqual([]);
    expect(ACTIVITY_CLASS.draft_created).toBe('preparation');
    expect(ACTIVITY_CLASS.message_approved).toBe('preparation');
  });

  it('a provider send completes it with basis provider; an explicit seller-reported send completes it with basis self_reported', () => {
    const providerSent = project(row('execution.gmail_direct_sent', { recipient: 'ann@kroger.example.com', stepIndex: 0, gmailSentMessageId: 'g1', accountName: 'Kroger' }, { created_at: new Date(AT.getTime() + 60_000) }));
    const a1 = accountability({ day: '2026-10-08', plan: plan(first), events: [drafted, providerSent], tasks: [] });
    expect(a1.intended[0]).toMatchObject({ status: 'done', by: { kind: 'message_sent', basis: 'provider' } });
    const saidSent = project(row('execution.gmail_manual_sent', { recipient: 'ann@kroger.example.com', stepIndex: 0, accountName: 'Kroger' }, { created_at: new Date(AT.getTime() + 60_000) }));
    const a2 = accountability({ day: '2026-10-08', plan: plan(first), events: [drafted, saidSent], tasks: [] });
    expect(a2.intended[0]).toMatchObject({ status: 'done', by: { kind: 'message_sent', basis: 'self_reported' } });
    expect(a2.attention.prepared).toEqual([]);
  });

  it('a reply draft prepares the reply item the same way; a copy prepares nothing and completes nothing', () => {
    expect(project(row('execution.reply_drafted', { recipient: 'ann@kroger.example.com' }, { subject_type: 'inbound_message', subject_id: 'm1' }))).toMatchObject({ kind: 'draft_created', completes: [], prepares: ['reply:m1'] });
    expect(project(row('execution.copy_released', { recipient: 'ann@kroger.example.com', stepIndex: 0 }))).toMatchObject({ kind: 'content_copied', completes: [], prepares: [] });
  });
});

describe('C37: accepted, booked and outcome captured are three kinds', () => {
  it('no meeting outcome increments booked; every outcome is an outcome captured, and next_meeting says the booking needs the calendar', () => {
    for (const outcome of MEETING_OUTCOMES) {
      const e = project(row('capture.meeting', { outcome, accountName: 'Kroger', hypothesisId: 'h1' }, { subject_type: 'capture', subject_id: 'cap-1' }));
      expect(e.kind, outcome).toBe('meeting_outcome_captured');
      expect(e.basis).toBe('self_reported');
    }
    const events = ['disqualified_problem', 'no_decision', 'more_discovery'].map((outcome) => project(row('capture.meeting', { outcome, accountName: 'Kroger' }, { subject_type: 'capture', subject_id: `cap-${outcome}` })));
    expect(counts(events)).toEqual({ meeting_outcome_captured: 3 });
    expect(counts(events).meeting_booked).toBeUndefined();
    expect(project(row('capture.meeting', { outcome: 'next_meeting', accountName: 'Kroger' }, { subject_type: 'capture', subject_id: 'cap-n' })).line).toMatch(/booked when the calendar shows it/);
  });

  it('a confirmed meeting_accepted disposition is meeting accepted (self-reported), never booked; a booking is its own row with a calendar proof', () => {
    const accepted = project(row('disposition.recorded', { humanConfirmed: true, accountName: 'Kroger', contactEmail: 'ann@kroger.example.com', responseClass: 'meeting_accepted', channel: 'email' }, { subject_type: 'disposition', subject_id: 'd1' }));
    expect(accepted).toMatchObject({ kind: 'meeting_accepted', basis: 'self_reported', who: 'ann@kroger.example.com' });
    const booked = project(row(MEETING_BOOKED, { contactEmail: 'ann@kroger.example.com', calendarEventId: 'cal-9', accountName: 'Kroger', dealId: '1001' }, { subject_type: 'meeting', subject_id: 'mb-1' }));
    expect(booked).toMatchObject({ kind: 'meeting_booked', basis: 'provider', dealId: '1001' });
    const said = project(row(MEETING_BOOKED, { contactEmail: 'ann@kroger.example.com', accountName: 'Kroger' }, { subject_type: 'meeting', subject_id: 'mb-2' }));
    expect(said).toMatchObject({ kind: 'meeting_booked', basis: 'self_reported' });
    const outcome = project(row('capture.meeting', { outcome: 'qualified_problem', accountName: 'Kroger' }, { subject_type: 'capture', subject_id: 'cap-q' }));
    expect(new Set([accepted.kind, booked.kind, outcome.kind]).size).toBe(3);
    expect(counts([accepted, booked, outcome])).toEqual({ meeting_accepted: 1, meeting_booked: 1, meeting_outcome_captured: 1 });
    expect(ACTIVITY_CLASS.meeting_accepted).toBe('contact');
    expect(ACTIVITY_CLASS.meeting_booked).toBe('commercial');
  });
});

describe('C38a and C38b: CRM maintenance is CRM updated; each write outcome maps apart', () => {
  const crm = (outcome: string, extra: Record<string, unknown> = {}) => project(row('crm.sync_result', { proposalId: 'p1', accountName: 'Kroger', outcome, objectRef: 'n-1', detail: null, ...extra }, { subject_type: 'crm_sync', subject_id: 'p1' }));

  it('a successful note, task, task completion or next-step write is CRM updated, never deal advanced', () => {
    for (const changeKind of ['note', 'task', 'task_complete', 'deal_property']) {
      const e = crm('written', { changeKind });
      expect(e.kind, changeKind).toBe('crm_updated');
      expect(e.basis).toBe('provider');
      expect(e.line).toMatch(/not a stage change/);
    }
    expect(crm('written', { changeKind: 'deal_property' }).line).toContain('a next step');
    expect(crm('written', { changeKind: 'task_complete' }).line).toContain('a task completed');
    expect(counts([crm('written', { changeKind: 'note' }), crm('written', { changeKind: 'task' })])).toEqual({ crm_updated: 2 });
    expect(ACTIVITY_CLASS.crm_updated).toBe('maintenance');
  });

  it('recovered is an update and no failure; off, conflict and failed are work blocked with their own words', () => {
    const recovered = crm('recovered');
    expect(recovered).toMatchObject({ kind: 'crm_updated', basis: 'provider' });
    expect(recovered.line).toMatch(/recovered, not repeated/);
    expect(counts([recovered]).work_blocked).toBeUndefined();
    const off = crm('off', { detail: 'GAP_CRM_APPROVED_WRITES_ENABLED is off' });
    expect(off).toMatchObject({ kind: 'work_blocked' });
    expect(off.line).toMatch(/writes are off here/);
    expect(off.line).toContain('GAP_CRM_APPROVED_WRITES_ENABLED is off');
    const conflict = crm('conflict');
    expect(conflict).toMatchObject({ kind: 'work_blocked' });
    expect(conflict.line).toMatch(/newer value/);
    const failed = crm('failed', { detail: '403' });
    expect(failed).toMatchObject({ kind: 'work_blocked' });
    expect(failed.line).toBe('A HubSpot change failed for Kroger: 403.');
    expect(counts([recovered, off, conflict, failed])).toEqual({ crm_updated: 1, work_blocked: 3 });
    expect(counts([crm('written'), crm('recovered'), crm('off'), crm('conflict'), crm('failed')]).deal_advanced).toBeUndefined();
  });
});

describe('C38c: advancement needs a stage transition or a confirmed milestone on one deal', () => {
  const commitment = (c: Record<string, unknown>) => project(row('account.commitment', { op: 'status', commitmentId: c.commitmentId, commitment: c }, { subject_type: 'account', subject_id: 'Kroger' }));

  it('an explicit stage transition is one deal_advanced event with its basis and deal id; one without a deal id is nothing', () => {
    const hub = project(row(DEAL_STAGE_CHANGED, { dealId: '1001', dealName: 'YardFlow - Kroger', from: 'qualifiedtobuy', to: 'presentationscheduled', basis: 'provider', accountName: 'Kroger' }, { subject_type: 'deal', subject_id: '1001' }));
    expect(hub).toMatchObject({ kind: 'deal_advanced', basis: 'provider', dealId: '1001', completes: ['deal:Kroger:2026-10-08'] });
    expect(hub.line).toBe('Deal YardFlow - Kroger moved from qualifiedtobuy to presentationscheduled (HubSpot).');
    const said = project(row(DEAL_STAGE_CHANGED, { dealId: '1001', to: 'contractsent', accountName: 'Kroger', commitmentId: 'c-3' }, { subject_type: 'deal', subject_id: '1001' }));
    expect(said).toMatchObject({ kind: 'deal_advanced', basis: 'self_reported', completes: ['commitment:c-3', 'deal:Kroger:2026-10-08'] });
    expect(projectActivity(row(DEAL_STAGE_CHANGED, { to: 'contractsent', accountName: 'Kroger' }, { subject_type: 'deal', subject_id: 'x' }))).toBeNull();
  });

  it('a defined milestone done on a deal id is advancement (provider when a record proves it, self-reported on the seller word); a deal step without a deal or a milestone is an obligation done', () => {
    const confirmed = commitment({ commitmentId: 'c-1', kind: 'deal_step', status: 'done', title: 'Pilot scope signed', dealId: '1001', detail: { milestone: 'pilot_scope' }, proof: { kind: 'capture', id: 'cap-1', note: null, at: AT.toISOString(), by: 'casey' } });
    expect(confirmed).toMatchObject({ kind: 'deal_advanced', basis: 'provider', dealId: '1001', completes: ['commitment:c-1', 'deal:Kroger:2026-10-08'] });
    const word = commitment({ commitmentId: 'c-2', kind: 'deal_step', status: 'done', title: 'Pilot scope signed', dealId: '1001', detail: { milestone: 'pilot_scope' }, proof: { kind: 'seller', id: null, note: 'signed today', at: AT.toISOString(), by: 'casey' } });
    expect(word).toMatchObject({ kind: 'deal_advanced', basis: 'self_reported', dealId: '1001' });
    expect(word.line).toMatch(/your word/);
    const noDeal = commitment({ commitmentId: 'c-3', kind: 'deal_step', status: 'done', title: 'Send the pilot scope', dealId: null, detail: { milestone: 'pilot_scope' }, proof: { kind: 'ledger', id: 'e1', note: null, at: AT.toISOString(), by: 'casey' } });
    expect(noDeal).toMatchObject({ kind: 'obligation_done', basis: 'provider', dealId: null });
    expect(noDeal.line).toMatch(/no deal named: not advancement/);
    const todo = commitment({ commitmentId: 'c-4', kind: 'deal_step', status: 'done', title: 'Send the deck', dealId: '1001', detail: {}, proof: { kind: 'mailbox_sent', id: 'g1', note: null, at: AT.toISOString(), by: 'casey' } });
    expect(todo).toMatchObject({ kind: 'obligation_done', basis: 'provider', dealId: '1001' });
    const followUp = commitment({ commitmentId: 'c-5', kind: 'follow_up', status: 'done', title: 'Call Ann again', dealId: null, proof: null });
    expect(followUp).toMatchObject({ kind: 'obligation_done', basis: 'self_reported', completes: ['commitment:c-5'] });
    expect(counts([confirmed, word, noDeal, todo, followUp])).toEqual({ deal_advanced: 2, obligation_done: 3 });
  });

  it('every kind has a class, and the view keeps preparation, contact and commercial progress apart', () => {
    for (const k of ACTIVITY_KINDS) expect(ACTIVITY_CLASS[k]).toBeTruthy();
    expect(ACTIVITY_CLASS.message_sent).toBe('contact');
    expect(ACTIVITY_CLASS.deal_advanced).toBe('commercial');
    expect(ACTIVITY_CLASS.obligation_done).toBe('other');
    const order = accountability({ day: '2026-10-08', plan: null, events: [project(row('execution.gmail_direct_sent', { recipient: 'a@b.c', gmailSentMessageId: 'g', accountName: 'Kroger' })), project(row('execution.gmail_drafted', { recipient: 'a@b.c' })), project(row(DEAL_STAGE_CHANGED, { dealId: '1', to: 'closedwon', basis: 'provider' }, { subject_type: 'deal', subject_id: '1' }))], tasks: [] }).completed.map((c) => c.cls);
    expect(order).toEqual(['preparation', 'contact', 'commercial']);
  });
});

/**
 * Seller acceptance follow-up (2026-10-09), C3: research in progress never becomes evidence of completed outreach or
 * commercial advancement, and the agent's own research shows as what it was. The October 9 rows, in their shapes:
 * Casey replied "DONE: researching catalysts" (with his signature block) on the Diego Fonseca follow-up and the
 * activity view said "Done: Follow up with Diego Fonseca when they are back"; the agent's research run (insufficient
 * evidence, 0 facts, 9 rejected) showed nowhere.
 */
describe('Seller acceptance (2026-10-09): a progress note, a held item and a research run are said as what they are', () => {
  const AT9 = new Date('2026-10-09T01:10:00Z');
  const NOTE = 'researching catalysts\nCasey Larkin · GTM, YardFlow by FreightRoll · c. 410-236-7434 · yardflow.ai';
  const diego = (proof: Record<string, unknown> | null, title = 'Follow up with Diego Fonseca when they are back') => row('account.commitment', { op: 'status', commitmentId: 'c-diego', commitment: { commitmentId: 'c-diego', accountName: 'Primo Brands', kind: 'follow_up', title, basis: null, owner: 'casey@freightroll.com', dueAt: '2026-10-09T13:00:00.000Z', person: { personaId: 7, name: 'Diego Fonseca', email: null }, dealId: null, threadId: null, status: 'done', snoozeUntil: null, dependency: null, proof, reason: null, source: { kind: 'reply', id: 'r-1' }, detail: {} } }, { subject_type: 'account', subject_id: 'Primo Brands', created_at: AT9 });

  it('(a) a commitment done on a seller note that reads as progress is an obligation done in class other, self-reported, said as in progress; it completes only the commitment key, never a first touch or a reply, and never counts as contact', () => {
    const e = project(diego({ kind: 'seller', id: null, note: NOTE, at: AT9.toISOString(), by: 'casey@freightroll.com' }));
    expect(e).toMatchObject({ kind: 'obligation_done', basis: 'self_reported', completes: ['commitment:c-diego'], prepares: [], dealId: null, accountName: 'Primo Brands' });
    expect(e.line).toBe('Marked done by your note "researching catalysts", which reads as work in progress, not a completed follow-up.');
    expect(ACTIVITY_CLASS[e.kind]).toBe('other');
    const first = item('first_touch:dec-9', 'Primo Brands');
    const reply = item('reply:m-9', 'Primo Brands', 'reply');
    const a = accountability({ day: '2026-10-09', plan: plan(first, reply), events: [e], tasks: [] });
    expect(a.intended.map((x) => x.status), 'the note completes no outreach item').toEqual(['open', 'open']);
    expect(Object.keys(counts([e]))).toEqual(['obligation_done']);
    expect(accountability({ day: '2026-10-09', plan: null, events: [e], tasks: [] }).completed.map((c) => c.cls)).toEqual(['other']);
    // The same row with a note that says what HAPPENED is the completion it was before.
    const done = project(diego({ kind: 'seller', id: null, note: 'called Diego, he will send the comparison Friday', at: AT9.toISOString(), by: 'casey@freightroll.com' }));
    expect(done.line).toBe('Done: Follow up with Diego Fonseca when they are back.');
    // A proof that is not the seller's word is never re-read as progress.
    const proven = project(diego({ kind: 'mailbox_sent', id: 'g-9', note: NOTE, at: AT9.toISOString(), by: 'casey@freightroll.com' }));
    expect(proven).toMatchObject({ kind: 'obligation_done', basis: 'provider' });
    expect(proven.line).toMatch(/^Done: Follow up/);
    // A deal step with a milestone under a progress note never advances the deal.
    const step = project(row('account.commitment', { op: 'status', commitmentId: 'c-m', commitment: { commitmentId: 'c-m', kind: 'deal_step', status: 'done', title: 'Pilot scope signed', dealId: '1001', detail: { milestone: 'pilot_scope' }, proof: { kind: 'seller', id: null, note: 'still waiting on legal', at: AT9.toISOString(), by: 'casey' } } }, { subject_type: 'account', subject_id: 'Kroger', created_at: AT9 }));
    expect(step).toMatchObject({ kind: 'obligation_done', basis: 'self_reported', completes: ['commitment:c-m'] });
    expect(counts([step]).deal_advanced).toBeUndefined();
  });

  it('(b) a command applied with effect progress_noted is the new kind progress_noted, class other, with the seller words; it completes nothing', () => {
    const e = project(row('work.command_applied', { gmailMessageId: 'm-done-9', from: 'casey@freightroll.com', at: AT9.toISOString(), command: 'done', revision: 2, effect: 'progress_noted', note: NOTE, cue: 'researching', itemKey: 'follow_up:Primo Brands:2026-10-09', commitmentId: 'c-diego', basis: 'self_reported' }, { subject_type: 'work_item', subject_id: 'follow_up:Primo Brands:2026-10-09', created_at: AT9 }));
    expect(e).toMatchObject({ kind: 'progress_noted', basis: 'self_reported', completes: [], prepares: [] });
    expect(e.line).toBe('In progress (your note): researching catalysts.');
    expect(ACTIVITY_CLASS.progress_noted).toBe('other');
    expect(ACTIVITY_KINDS).toContain('progress_noted');
    const a = accountability({ day: '2026-10-09', plan: plan(item('follow_up:Primo Brands:2026-10-09', 'Primo Brands', 'follow_up')), events: [e], tasks: [] });
    expect(a.intended[0].status, 'the item stays open').toBe('open');
    expect(counts([e])).toEqual({ progress_noted: 1 });
  });

  it('(c) a command applied with effect item_held_for_research is research generated (preparation), named by the account', () => {
    const e = project(row('work.command_applied', { gmailMessageId: 'm-done-9', from: 'casey@freightroll.com', at: AT9.toISOString(), command: 'done', revision: 2, effect: 'item_held_for_research', itemKey: 'follow_up:Primo Brands:2026-10-09', accountName: 'Primo Brands' }, { subject_type: 'work_item', subject_id: 'follow_up:Primo Brands:2026-10-09', created_at: AT9 }));
    expect(e).toMatchObject({ kind: 'research_generated', basis: 'provider', completes: [], accountName: 'Primo Brands' });
    expect(e.line).toBe('Held for GAP research: Primo Brands.');
    expect(ACTIVITY_CLASS.research_generated).toBe('preparation');
    const noAccount = project(row('work.command_applied', { command: 'done', effect: 'item_held_for_research', itemKey: 'follow_up:Primo Brands:2026-10-09' }, { subject_type: 'work_item', subject_id: 'follow_up:Primo Brands:2026-10-09', created_at: AT9 }));
    expect(noAccount.line).toBe('Held for GAP research: follow_up:Primo Brands:2026-10-09.');
  });

  it('(d) the research run\'s completion row is research generated with its outcome and counts, never contact; the same run recorded twice counts once', async () => {
    const run = (over: Record<string, unknown> = {}, id = 'run-9') => row('research.completed', { outcome: 'insufficient_evidence', accountName: 'Kenco', personaId: null, hypothesisId: null, facts: 0, rejected: 9, ...over }, { subject_type: 'research_run', subject_id: id, created_at: AT9, actor: 'agent' });
    const e = project(run());
    expect(e).toMatchObject({ kind: 'research_generated', basis: 'provider', accountName: 'Kenco', completes: [], evidence: 'research:run-9' });
    expect(e.line).toBe('GAP researched Kenco: insufficient evidence (0 facts, 9 rejected).');
    expect(ACTIVITY_CLASS[e.kind]).toBe('preparation');
    expect(project(run({ outcome: 'facts_found', facts: 3, rejected: 2 }, 'run-10')).line).toBe('GAP researched Kenco: 3 facts found, 2 rejected.');
    expect(project(run({ outcome: 'facts_found', facts: 1, rejected: 0 }, 'run-11')).line).toBe('GAP researched Kenco: 1 fact found.');
    expect(project(run({ accountName: null }, 'run-12')).line).toBe('GAP researched the account: insufficient evidence (0 facts, 9 rejected).');
    const { ledgerDb } = await import('./fixtures/ledger-db');
    const { loadActivity } = await import('@/lib/gap/work/activity');
    const db = ledgerDb({ audit: [run(), run()] }, AT9);
    const read = await loadActivity(db.client(), { since: new Date('2026-10-09T00:00:00Z'), until: new Date('2026-10-09T23:59:59Z') });
    expect(read.events.map((x) => x.kind)).toEqual(['research_generated']);
    expect(read.deduped).toBe(1);
    expect(counts(read.events)).toEqual({ research_generated: 1 });
  });
});
