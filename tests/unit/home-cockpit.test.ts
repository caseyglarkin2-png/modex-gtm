import { describe, expect, it } from 'vitest';
import { buildFocusItems } from '@/lib/home-cockpit';

const now = new Date('2026-05-02T14:00:00Z');

describe('home cockpit data contract', () => {
  it('normalizes and deduplicates priority focus items', () => {
    const focus = buildFocusItems(
      [
        {
          name: 'General Mills',
          owner: 'Casey',
          next_action: 'Send executive follow-up',
          due_date: '2026-05-01T12:00:00Z',
        },
      ],
      [
        {
          account_name: 'General Mills',
          owner: 'Casey',
          activity_type: 'Follow-up',
          next_step: 'Send executive follow-up',
          next_step_due: '2026-05-01T12:00:00Z',
        },
        {
          account_name: 'Frito-Lay',
          owner: 'Casey',
          activity_type: 'Meeting',
          next_step: 'Confirm meeting agenda',
          next_step_due: '2026-05-02T09:00:00Z',
        },
      ],
      now,
    );

    expect(focus).toHaveLength(2);
    expect(focus[0]).toMatchObject({
      account: 'General Mills',
      dueLabel: '1d overdue',
      urgency: 'overdue',
    });
    expect(focus[1]).toMatchObject({
      account: 'Frito-Lay',
      dueLabel: 'Due today',
      urgency: 'today',
    });
  });
});
