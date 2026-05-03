import { describe, expect, it } from 'vitest';
import {
  accountCommandTabs,
  buildAccountNextBestAction,
  buildAccountTimeline,
  getCanonicalAccountTabForLegacy,
} from '@/lib/account-command-center';

describe('account command center contract', () => {
  it('declares the seven canonical account tabs and maps legacy tabs', () => {
    expect(accountCommandTabs.map((tab) => tab.label)).toEqual([
      'Overview',
      'Contacts',
      'Assets',
      'Engagement',
      'Tasks',
      'Meetings',
      'Pipeline',
    ]);

    expect(getCanonicalAccountTabForLegacy('personas')?.label).toBe('Contacts');
    expect(getCanonicalAccountTabForLegacy('brief')?.label).toBe('Assets');
    expect(getCanonicalAccountTabForLegacy('routes')?.label).toBe('Assets');
    expect(getCanonicalAccountTabForLegacy('activity')?.label).toBe('Engagement');
    expect(getCanonicalAccountTabForLegacy('waves')?.label).toBe('Pipeline');
  });

  it('prioritizes explicit next action before inferred actions', () => {
    const action = buildAccountNextBestAction(
      {
        next_action: 'Send VP logistics one-pager',
        due_date: '2026-05-03T12:00:00Z',
        research_status: 'Ready',
        outreach_status: 'Not started',
        meeting_status: 'No meeting',
      },
      { contactCount: 3, assetCount: 2, openTaskCount: 1 },
    );

    expect(action).toMatchObject({
      label: 'Send VP logistics one-pager',
      route: '#tasks',
      tone: 'attention',
    });
    expect(action.detail).toContain('May 3');
  });

  it('composes a newest-first engagement timeline across account sources', () => {
    const timeline = buildAccountTimeline({
      activities: [
        {
          id: 1,
          activity_type: 'Call',
          notes: 'Left voicemail',
          outcome: null,
          next_step: null,
          activity_date: new Date('2026-05-01T12:00:00Z'),
          created_at: new Date('2026-05-01T12:00:00Z'),
        },
      ],
      emails: [
        {
          id: 2,
          subject: 'YardFlow follow-up',
          status: 'sent',
          to_email: 'buyer@example.com',
          reply_count: 1,
          sent_at: new Date('2026-05-02T12:00:00Z'),
        },
      ],
      meetings: [],
      micrositeSessions: [
        {
          path: '/for/general-mills',
          personName: null,
          isHighIntent: true,
          viewedAt: new Date('2026-05-03T12:00:00Z'),
          ctaCount: 2,
        },
      ],
      captures: [],
    });

    expect(timeline.map((item) => item.kind)).toEqual(['microsite', 'email', 'activity']);
    expect(timeline[0]).toMatchObject({
      title: 'High-intent microsite session',
      href: '/for/general-mills',
    });
  });
});
