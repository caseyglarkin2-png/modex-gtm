import { describe, expect, it } from 'vitest';
import {
  accountCommandTabs,
  buildAccountEngagementSummary,
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

  it('rebuilds next-best action from outcomes and reply momentum', () => {
    const wrongPersonAction = buildAccountNextBestAction(
      {
        next_action: null,
        due_date: null,
        research_status: 'Ready',
        outreach_status: 'Replied',
        meeting_status: 'No meeting',
      },
      {
        contactCount: 3,
        assetCount: 2,
        openTaskCount: 0,
        replyCount: 1,
        coverageGapCount: 2,
        latestOutcomeLabel: 'wrong-person',
        latestOutcomeNotes: 'Ops lead forwarded us to transportation director',
        hasMeetingSignal: false,
      },
    );

    expect(wrongPersonAction).toMatchObject({
      label: 'Replace the contact before the next send',
      route: '#contacts',
      tone: 'blocked',
    });

    const positiveAction = buildAccountNextBestAction(
      {
        next_action: null,
        due_date: null,
        research_status: 'Ready',
        outreach_status: 'Replied',
        meeting_status: 'No meeting',
      },
      {
        contactCount: 3,
        assetCount: 2,
        openTaskCount: 0,
        replyCount: 1,
        coverageGapCount: 0,
        latestOutcomeLabel: 'positive',
        latestOutcomeNotes: 'Interested in seeing the rollout path',
        hasMeetingSignal: false,
      },
    );

    expect(positiveAction).toMatchObject({
      label: 'Convert the warm response into a meeting',
      route: '#meetings',
      tone: 'ready',
    });
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
      sendRecipients: [
        {
          id: 9,
          send_job_id: 88,
          generated_content_id: 42,
          account_name: 'General Mills',
          to_email: 'ops@example.com',
          status: 'failed',
          error_message: 'Mailbox unavailable',
          sent_at: null,
          created_at: new Date('2026-05-04T12:00:00Z'),
          updated_at: new Date('2026-05-04T12:00:00Z'),
        },
      ],
      operatorOutcomes: [
        {
          id: 'out_1',
          generated_content_id: 42,
          outcome_label: 'positive',
          source_kind: 'email-log',
          source_id: '2',
          notes: 'Asked for pricing follow-up',
          created_at: new Date('2026-05-05T12:00:00Z'),
        },
      ],
    });

    expect(timeline.map((item) => item.kind)).toEqual(['outcome', 'send_job', 'microsite', 'email', 'activity']);
    expect(timeline[0]).toMatchObject({
      title: 'Outcome: positive',
      href: '/generated-content?contentId=42',
    });
    expect(timeline[1]).toMatchObject({
      title: 'Send failed',
      href: '/generated-content?account=General%20Mills',
    });
    expect(timeline[2]).toMatchObject({
      title: 'High-intent microsite session',
      href: '/for/general-mills',
    });
  });

  it('summarizes account engagement momentum from sends, outcomes, and meetings', () => {
    const summary = buildAccountEngagementSummary({
      emails: [
        { status: 'delivered', reply_count: 0, open_count: 0, opened_at: null, delivered_at: new Date('2026-05-03T08:00:00Z') },
        { status: 'opened', reply_count: 1, open_count: 2, opened_at: new Date('2026-05-04T08:00:00Z'), delivered_at: new Date('2026-05-04T07:00:00Z') },
      ],
      meetings: [
        { meeting_status: 'booked' },
        { meeting_status: 'draft' },
      ],
      operatorOutcomes: [
        { outcome_label: 'positive', notes: 'Buyer asked for next steps', created_at: new Date('2026-05-05T08:00:00Z') },
        { outcome_label: 'neutral', notes: 'Needs more proof', created_at: new Date('2026-05-04T08:00:00Z') },
      ],
    });

    expect(summary).toEqual({
      sent: 2,
      delivered: 2,
      opened: 1,
      replied: 1,
      positiveReplies: 1,
      meetingsInfluenced: 1,
      latestOutcomeLabel: 'positive',
      latestOutcomeNote: 'Buyer asked for next steps',
    });
  });
});
