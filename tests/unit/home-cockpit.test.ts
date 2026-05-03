import { describe, expect, it } from 'vitest';
import { buildFocusItems, buildHomeCockpitSnapshot, type HomeCampaignSource } from '@/lib/home-cockpit';

const now = new Date('2026-05-02T14:00:00Z');

const campaign: HomeCampaignSource = {
  name: 'MODEX 2026 Follow-Up',
  slug: 'modex-2026-follow-up',
  status: 'active',
  owner: 'Casey',
  target_account_count: 10,
  start_date: new Date('2026-04-01T00:00:00Z'),
  end_date: new Date('2026-04-30T23:59:59Z'),
  messaging_angle: 'Book qualified YardFlow meetings from MODEX follow-up.',
  _count: {
    outreach_waves: 8,
    email_logs: 6,
    activities: 4,
    generated_content: 5,
  },
};

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
          owner: 'Jake',
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

  it('builds the four Home cockpit surfaces from named sources', () => {
    const snapshot = buildHomeCockpitSnapshot({
      accounts: [],
      activities: [
        {
          account_name: 'Frito-Lay',
          owner: 'Jake',
          activity_type: 'Follow-up',
          next_step: 'Send one-pager',
          next_step_due: '2026-05-03T12:00:00Z',
        },
      ],
      campaigns: [campaign],
      generationFailures: 1,
      sendFailures: 0,
      stuckJobs: 0,
      engagementAlerts: 2,
      proofStatus: {
        sprint: 'Sprint 1',
        status: 'Production browser-proven',
        result: 'pass',
        route: '/ops',
        evidence: 'Playwright nav proof passed with skipped 0.',
      },
      now,
    });

    expect(snapshot.today).toMatchObject({
      overdue: 0,
      dueToday: 0,
      dueThisWeek: 1,
      engagementAlerts: 2,
    });
    expect(snapshot.activeCampaigns[0]).toMatchObject({
      name: 'MODEX 2026 Follow-Up',
      readinessScore: 50,
      href: '/campaigns/modex-2026-follow-up',
    });
    expect(snapshot.health).toMatchObject({
      generationFailures: 1,
      sendFailures: 0,
      stuckJobs: 0,
      engagementAlerts: 2,
      tone: 'attention',
      label: 'Needs review',
    });
    expect(snapshot.proofStatus.result).toBe('pass');
  });
});
