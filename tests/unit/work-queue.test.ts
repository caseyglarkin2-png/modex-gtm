import { describe, expect, it } from 'vitest';
import {
  buildWorkQueueItems,
  getMyWorkItems,
  parseWorkQueueTab,
  workQueueItemTypes,
  workQueueTabs,
  type WorkQueueSources,
} from '@/lib/work-queue';

function buildSources(): WorkQueueSources {
  return {
    activities: [
      {
        id: 1,
        account_name: 'General Mills',
        activity_type: 'Follow-up',
        next_step: 'Reply to buyer',
        outcome: null,
        next_step_due: new Date('2026-05-02T10:00:00Z'),
        notes: 'engagement-follow-up:notification:General Mills',
        created_at: new Date('2026-05-02T09:00:00Z'),
      },
    ],
    captures: [
      {
        id: 2,
        account_name: 'Frito-Lay',
        persona_name: 'Sam Rowe',
        notes: 'Warm booth conversation',
        heat_score: 17,
        due_date: new Date('2026-05-03T09:00:00Z'),
        followup_status: 'Open',
        created_at: new Date('2026-05-02T08:00:00Z'),
      },
    ],
    approvals: [
      {
        id: 3,
        type: 'approval_required',
        account_name: 'Dollar Tree',
        subject: 'Approval required for enrichment writeback',
        preview: 'Review field changes before apply.',
        read: false,
        created_at: new Date('2026-05-02T07:00:00Z'),
      },
    ],
    generationJobs: [
      {
        id: 4,
        account_name: 'General Mills',
        status: 'failed',
        retry_count: 1,
        error_message: 'Provider timeout',
        campaign: { slug: 'modex-2026-follow-up', name: 'MODEX 2026 Follow-Up' },
        created_at: new Date('2026-05-02T06:00:00Z'),
        updated_at: new Date('2026-05-02T06:30:00Z'),
        started_at: new Date('2026-05-02T06:05:00Z'),
      },
      {
        id: 5,
        account_name: 'Ford',
        status: 'processing',
        retry_count: 0,
        error_message: null,
        campaign: null,
        created_at: new Date('2026-05-02T05:00:00Z'),
        updated_at: new Date('2026-05-02T05:01:00Z'),
        started_at: new Date('2026-05-02T04:30:00Z'),
      },
    ],
    sendJobs: [
      {
        id: 6,
        status: 'failed',
        failed_count: 2,
        error_message: 'Delivery rejected',
        created_at: new Date('2026-05-02T04:00:00Z'),
        updated_at: new Date('2026-05-02T04:45:00Z'),
        started_at: new Date('2026-05-02T04:01:00Z'),
        recipients: [
          {
            account_name: 'General Mills',
            status: 'failed',
            error_message: 'Mailbox unavailable',
            campaign: { slug: 'modex-2026-follow-up', name: 'MODEX 2026 Follow-Up' },
          },
        ],
      },
    ],
  };
}

describe('work queue contract', () => {
  it('declares canonical tabs and queue item types', () => {
    expect(workQueueTabs.map((tab) => tab.label)).toEqual([
      'My Work',
      'Follow-ups',
      'Captures',
      'Approvals',
      'System Jobs',
      'Stuck/Failed',
    ]);

    expect(workQueueItemTypes.map((item) => item.id)).toEqual([
      'operator-action',
      'follow-up',
      'capture',
      'approval',
      'generation-job',
      'send-job',
      'stuck-job',
    ]);
  });

  it('maps source records into typed queue items with quick actions', () => {
    const items = buildWorkQueueItems(buildSources());
    const followUp = items.find((item) => item.itemType === 'follow-up');
    const capture = items.find((item) => item.itemType === 'capture');
    const generation = items.find((item) => item.itemType === 'generation-job');
    const send = items.find((item) => item.itemType === 'send-job');

    expect(followUp?.sourceTab).toBe('follow-ups');
    expect(followUp?.quickActions.accountHref).toBe('/accounts/general-mills');

    expect(capture?.sourceTab).toBe('captures');
    expect(capture?.severity).toBe('high');
    expect(capture?.quickActions.completeKey).toContain('capture-2');

    expect(generation?.quickActions.retry).toEqual({ kind: 'generation', id: 4 });
    expect(generation?.quickActions.campaignHref).toBe('/campaigns/modex-2026-follow-up');

    expect(send?.quickActions.retry).toEqual({ kind: 'send', id: 6 });
    expect(send?.quickActions.accountHref).toBe('/accounts/general-mills');
  });

  it('builds my work with prioritized actionable items', () => {
    const items = buildWorkQueueItems(buildSources());
    const myWork = getMyWorkItems(items);
    expect(myWork.length).toBeGreaterThan(3);
    expect(myWork.some((item) => item.itemType === 'capture')).toBe(true);
    expect(myWork.some((item) => item.itemType === 'follow-up')).toBe(true);
    expect(myWork.some((item) => item.itemType === 'generation-job')).toBe(true);
  });

  it('parses tab query with deterministic fallback', () => {
    expect(parseWorkQueueTab('captures')).toBe('captures');
    expect(parseWorkQueueTab('system-jobs')).toBe('system-jobs');
    expect(parseWorkQueueTab('not-a-tab')).toBe('my-work');
  });
});
