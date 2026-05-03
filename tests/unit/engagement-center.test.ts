import { describe, expect, it } from 'vitest';
import {
  buildEngagementItems,
  buildHotAccounts,
  engagementCenterTabs,
  getEngagementTabForLegacySignal,
  parseEngagementTab,
  type EngagementSourceBundle,
} from '@/lib/engagement-center';

function buildFixtureBundle(): EngagementSourceBundle {
  return {
    notifications: [
      {
        id: 10,
        type: 'reply',
        account_name: 'General Mills',
        persona_email: 'vp.ops@generalmills.com',
        subject: 'Re: Yard visibility follow-up',
        preview: 'Can you share timing and expected rollout?',
        read: false,
        created_at: new Date('2026-05-03T10:00:00Z'),
      },
      {
        id: 11,
        type: 'bounce',
        account_name: 'Frito-Lay',
        persona_email: 'bad@fritolay.com',
        subject: 'Delivery failure',
        preview: 'Mailbox does not exist',
        read: false,
        created_at: new Date('2026-05-03T09:00:00Z'),
      },
    ],
    emailLogs: [
      {
        id: 31,
        account_name: 'General Mills',
        persona_name: 'Taylor Lane',
        to_email: 'taylor@generalmills.com',
        subject: 'MODEX pilot options',
        campaign_id: 7,
        campaign: { name: 'MODEX Follow-Up', slug: 'modex-2026-follow-up' },
        status: 'clicked',
        opened_at: new Date('2026-05-03T08:00:00Z'),
        clicked_at: new Date('2026-05-03T08:10:00Z'),
        sent_at: new Date('2026-05-03T07:00:00Z'),
      },
    ],
    sendFailures: [
      {
        id: 41,
        account_name: 'Dollar Tree',
        persona_name: 'Alex Rowe',
        to_email: 'alex@dollartree.com',
        error_message: '550 mailbox unavailable',
        campaign_id: 7,
        campaign: { name: 'MODEX Follow-Up', slug: 'modex-2026-follow-up' },
        updated_at: new Date('2026-05-03T08:30:00Z'),
      },
    ],
    micrositeSessions: [
      {
        id: 'ms-1',
        account_name: 'General Mills',
        person_name: 'Taylor Lane',
        path: '/for/general-mills/taylor-lane',
        scroll_depth_pct: 82,
        duration_seconds: 134,
        cta_ids: ['book-demo'],
        updated_at: new Date('2026-05-03T09:45:00Z'),
      },
    ],
    meetings: [
      {
        id: 51,
        account_name: 'General Mills',
        persona: 'Taylor Lane',
        meeting_status: 'Meeting Booked',
        objective: 'Review pilot scope',
        meeting_date: new Date('2026-05-04T15:00:00Z'),
        updated_at: new Date('2026-05-03T09:15:00Z'),
      },
    ],
    activities: [
      {
        id: 61,
        account_name: 'Frito-Lay',
        activity_type: 'Call',
        persona: 'Morgan Dane',
        outcome: 'Needs pricing detail',
        next_step: 'Send recap',
        created_at: new Date('2026-05-03T07:30:00Z'),
      },
    ],
  };
}

describe('engagement center contract', () => {
  it('declares canonical Engagement tabs', () => {
    expect(engagementCenterTabs.map((tab) => tab.label)).toEqual([
      'Inbox',
      'Hot Accounts',
      'Microsite Sessions',
      'Bounces/Failures',
      'Recent Touches',
    ]);
  });

  it('normalizes engagement sources into one display contract with actions', () => {
    const items = buildEngagementItems(buildFixtureBundle());
    const reply = items.find((item) => item.kind === 'reply');
    const microsite = items.find((item) => item.kind === 'microsite-session');
    const failure = items.find((item) => item.kind === 'failure');
    const click = items.find((item) => item.kind === 'click');

    expect(reply?.tab).toBe('inbox');
    expect(reply?.actions.markReadHref).toContain('markRead=10');
    expect(reply?.actions.followUpHref).toContain('followUpAccount=General+Mills');
    expect(reply?.actions.accountHref).toBe('/accounts/general-mills');

    expect(microsite?.tab).toBe('microsite-sessions');
    expect(microsite?.actions.assetHref).toBe('/for/general-mills/taylor-lane');
    expect(microsite?.severity).toBe('high');

    expect(failure?.tab).toBe('bounces-failures');
    expect(failure?.actions.campaignHref).toBe('/campaigns/modex-2026-follow-up');
    expect(failure?.actions.followUpHref).toContain('send-failure%3A41');

    expect(click?.tab).toBe('inbox');
    expect(click?.statusLabel).toBe('Clicked');
    expect(click?.actions.campaignHref).toBe('/campaigns/modex-2026-follow-up');
  });

  it('ranks hot accounts by weighted signal urgency', () => {
    const items = buildEngagementItems(buildFixtureBundle());
    const hotAccounts = buildHotAccounts(items);
    expect(hotAccounts[0]?.accountName).toBe('General Mills');
    expect(hotAccounts[0]?.score).toBeGreaterThan(hotAccounts[1]?.score ?? 0);
    expect(hotAccounts[0]?.nextAction.length).toBeGreaterThan(10);
  });

  it('maps engagement kinds and tab query parsing deterministically', () => {
    expect(getEngagementTabForLegacySignal('failure')).toBe('bounces-failures');
    expect(getEngagementTabForLegacySignal('microsite-session')).toBe('microsite-sessions');
    expect(getEngagementTabForLegacySignal('activity')).toBe('recent-touches');
    expect(getEngagementTabForLegacySignal('open')).toBe('inbox');

    expect(parseEngagementTab('hot-accounts')).toBe('hot-accounts');
    expect(parseEngagementTab('not-a-tab')).toBe('inbox');
  });
});
