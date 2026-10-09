/**
 * X20b (GAP OS sales execution engine, 2026-10-08): the accountability view renders what I intended with each item's
 * status, what was completed as provider-proven apart from self-reported, what needs attention, what the agents are
 * handling, and the day's events with their basis; the empty states say nothing was found, never success.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityView } from '@/components/gap/activity-view';
import type { Accountability } from '@/lib/gap/work/activity';
import type { AgentTask } from '@/lib/gap/agents/tasks';

const AT = '2026-10-08T15:00:00.000Z';
const item = (key: string, accountName: string, title: string): Accountability['intended'][number]['item'] => ({ key, rank: 0, accountName, kind: 'ready', stateKind: 'ready', title, why: '', href: `/gap/accounts/${accountName.toLowerCase()}`, person: null, refs: {}, token: 'a'.repeat(32) });
const ev = (kind: Accountability['events'][number]['kind'], basis: 'provider' | 'self_reported', line: string, accountName: string | null = null): Accountability['events'][number] => ({ kind, basis, at: AT, accountName, who: null, line, ref: { kind: 'x', subjectType: 'y', subjectId: 'z' }, completes: [], prepares: [], dealId: null, evidence: null });
const task = (over: Partial<AgentTask>): AgentTask => ({ id: 't', kind: 'revise_message', itemKey: 'k', itemToken: '', day: '2026-10-08', revision: 0, request: 'Make it about the gate', requestedBy: '', requestedFrom: '', status: 'queued', attempts: 0, queuedAt: AT, leaseUntil: null, fence: null, result: null, lastError: null, final: false, supersededBy: null, ...over });

function view(): Accountability {
  const sent = ev('message_sent', 'provider', 'Sent touch 1 to ann@kroger.example.com.', 'Kroger');
  const deferred = ev('task_deferred', 'self_reported', 'Deferred by email: tomorrow.', 'Dole');
  const drafted = ev('draft_created', 'provider', 'A Gmail draft was created to bob@pepsico.example.com; not a send until Sent shows it.', 'PepsiCo');
  return {
    day: '2026-10-08',
    planned: true,
    intended: [
      { item: item('first_touch:dec-1', 'Kroger', 'Ready for a first touch'), status: 'done', by: sent },
      { item: item('commitment:c-1', 'Dole', 'Send the dock comparison'), status: 'set_aside', by: deferred },
      { item: item('follow_up:Kenco:2026-10-08', 'Kenco', 'Follow up due'), status: 'open', by: null },
      { item: item('first_touch:dec-2', 'PepsiCo', 'Ready for a first touch'), status: 'prepared', by: drafted },
    ],
    completed: [
      { kind: 'draft_created', label: 'Draft created', cls: 'preparation', provider: 1, selfReported: 0 },
      { kind: 'content_copied', label: 'Content copied', cls: 'preparation', provider: 0, selfReported: 2 },
      { kind: 'message_sent', label: 'Message sent', cls: 'contact', provider: 1, selfReported: 0 },
      { kind: 'crm_updated', label: 'CRM updated', cls: 'maintenance', provider: 1, selfReported: 0 },
    ],
    events: [sent, deferred, drafted, ev('work_blocked', 'provider', 'An action was refused: active opportunity.', 'GXO')],
    attention: { open: [item('follow_up:Kenco:2026-10-08', 'Kenco', 'Follow up due')], prepared: [item('first_touch:dec-2', 'PepsiCo', 'Ready for a first touch')], blocked: [ev('work_blocked', 'provider', 'An action was refused: active opportunity.', 'GXO')] },
    agents: { queued: [task({ id: 'q' })], running: [], succeeded: [task({ id: 's', status: 'succeeded', kind: 'answer_objection', request: 'We already run a YMS.' })], failed: [task({ id: 'f', status: 'failed', final: true, lastError: 'could_not_satisfy: product_named' })] },
    coverage: 'complete',
    coverageDetail: null,
  };
}

describe('X20b: <ActivityView>', () => {
  it('intended items carry their status and what did them; completed splits provider from self-reported; attention lists open and blocked; agents by status with their errors; events with their basis', () => {
    render(<ActivityView a={view()} />);
    const intended = within(screen.getByTestId('activity-intended')).getAllByTestId('activity-intended-item');
    expect(intended.map((li) => li.getAttribute('data-status'))).toEqual(['done', 'set_aside', 'open', 'prepared']);
    // C36: a drafted first touch is prepared, not done; its link says send it.
    expect(intended[3].textContent).toContain('Prepared, not sent');
    expect(within(intended[3]).getByRole('link', { name: 'Send it' })).toHaveAttribute('href', '/gap/accounts/pepsico');
    expect(intended[0].textContent).toContain('Sent touch 1 to ann@kroger.example.com.');
    expect(intended[1].textContent).toContain('(self-reported)');
    expect(within(intended[2]).getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/gap/accounts/kenco');
    expect(screen.getByTestId('activity-intended').textContent).toContain('4 items; 1 done, 1 prepared but not sent, 1 set aside, 1 open');
    // The counts are grouped by class: preparation, contact and CRM maintenance apart.
    expect(within(screen.getByTestId('activity-class-preparation')).getByTestId('activity-count-draft_created')).toBeTruthy();
    expect(within(screen.getByTestId('activity-class-contact')).getByTestId('activity-count-message_sent')).toBeTruthy();
    expect(screen.getByTestId('activity-class-maintenance').textContent).toContain('CRM maintenance');
    expect(screen.getByTestId('activity-class-maintenance').textContent).toContain('CRM updated');
    const copied = screen.getByTestId('activity-count-content_copied');
    expect(copied.textContent).toBe('Content copied02');
    expect(screen.getByTestId('activity-count-message_sent').textContent).toBe('Message sent10');
    const attention = screen.getByTestId('activity-attention');
    expect(within(attention).getByRole('link', { name: 'Kenco: Follow up due' })).toBeTruthy();
    expect(within(attention).getByTestId('activity-attention-prepared').textContent).toContain('prepared, awaiting your send');
    expect(attention.textContent).toContain('Blocked');
    expect(attention.textContent).toContain('at GXO');
    const tasks = within(screen.getByTestId('activity-agents')).getAllByTestId('activity-agent-task');
    expect(tasks.map((li) => li.getAttribute('data-status'))).toEqual(['queued', 'failed', 'succeeded']);
    expect(tasks[1].textContent).toContain('could_not_satisfy: product_named');
    expect(screen.getByTestId('activity-agents').textContent).toContain('1 queued, 0 running, 1 finished today, 1 failed today.');
    const events = screen.getByTestId('activity-events');
    expect(events.textContent).toContain('provider-proven · Kroger');
    expect(events.textContent).toContain('self-reported · Dole');
  });

  it('the empty states say nothing was found, never success; no plan says so', () => {
    render(<ActivityView a={{ day: '2026-10-08', planned: false, intended: [], completed: [], events: [], attention: { open: [], prepared: [], blocked: [] }, agents: { queued: [], running: [], succeeded: [], failed: [] }, coverage: 'complete', coverageDetail: null }} />);
    expect(screen.getByTestId('activity-intended').textContent).toContain('No plan was made for this day');
    expect(screen.getByTestId('activity-completed').textContent).toContain('No activity recorded for this day.');
    expect(screen.getByTestId('activity-attention').textContent).toContain('Nothing open, nothing prepared and unsent, nothing blocked.');
    expect(screen.getByTestId('activity-agents').textContent).toContain('No agent tasks.');
  });

  it('C49: an unavailable read says the counts are not zero; a partial read says they are a floor', () => {
    const base: Accountability = { day: '2026-10-08', planned: false, intended: [], completed: [], events: [], attention: { open: [], prepared: [], blocked: [] }, agents: { queued: [], running: [], succeeded: [], failed: [] }, coverage: 'unavailable', coverageDetail: 'connection reset' };
    const { unmount } = render(<ActivityView a={base} />);
    expect(screen.getByTestId('activity-coverage').getAttribute('data-coverage')).toBe('unavailable');
    expect(screen.getByTestId('activity-completed').textContent).toContain('nothing below is a count of zero');
    expect(screen.getByTestId('activity-completed').textContent).toContain('(connection reset)');
    expect(screen.getByTestId('activity-completed').textContent).toContain('Unknown: the activity ledger was not readable.');
    expect(screen.getByTestId('activity-completed').textContent).not.toContain('No activity recorded');
    unmount();
    render(<ActivityView a={{ ...base, coverage: 'partial', coverageDetail: 'the window holds more than 20000 rows; the newest 20000 were read', completed: [{ kind: 'message_sent', label: 'Message sent', cls: 'contact', provider: 20000, selfReported: 0 }] }} />);
    expect(screen.getByTestId('activity-coverage').textContent).toContain('these counts are a floor');
  });
});
