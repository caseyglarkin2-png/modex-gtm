import { describe, expect, it } from 'vitest';
import {
  buildCampaignEngagementItems,
  buildCampaignTargetCohorts,
  campaignWorkspaceTabs,
  getCampaignTabForLegacyRoute,
} from '@/lib/campaign-workspace';

describe('campaign workspace contract', () => {
  it('declares canonical campaign workspace tabs and legacy route ownership', () => {
    expect(campaignWorkspaceTabs.map((tab) => tab.label)).toEqual([
      'Overview',
      'Phases',
      'Targets',
      'Content',
      'Engagement',
      'Settings',
    ]);

    expect(getCampaignTabForLegacyRoute('/waves')?.label).toBe('Phases');
    expect(getCampaignTabForLegacyRoute('/waves/campaign')?.label).toBe('Overview');
    expect(getCampaignTabForLegacyRoute('/generated-content')?.label).toBe('Content');
  });

  it('classifies target readiness from contact and content coverage', () => {
    const cohorts = buildCampaignTargetCohorts([
      {
        accountName: 'Ready Co',
        wave: 'Wave 1',
        status: 'Contacted',
        priorityScore: 90,
        priorityBand: 'A',
        contactCount: 3,
        generatedCount: 2,
        sentCount: 1,
      },
      {
        accountName: 'No Content Co',
        wave: 'Wave 1',
        status: 'Not started',
        priorityScore: 80,
        priorityBand: 'A',
        contactCount: 2,
        generatedCount: 0,
        sentCount: 0,
      },
      {
        accountName: 'No Contacts Co',
        wave: 'Wave 2',
        status: 'Not started',
        priorityScore: 70,
        priorityBand: 'B',
        contactCount: 0,
        generatedCount: 1,
        sentCount: 0,
      },
    ]);

    expect(cohorts.map((cohort) => cohort.readinessLabel)).toEqual(['Ready', 'Needs Content', 'Needs Contacts']);
  });

  it('sorts campaign engagement newest first', () => {
    const items = buildCampaignEngagementItems([
      {
        id: 'email-1',
        kind: 'email',
        accountName: 'General Mills',
        title: 'Email sent',
        detail: 'Intro',
        occurredAt: new Date('2026-05-01T12:00:00Z'),
        status: 'sent',
      },
      {
        id: 'activity-1',
        kind: 'activity',
        accountName: 'Frito-Lay',
        title: 'Reply',
        detail: 'Needs follow-up',
        occurredAt: new Date('2026-05-02T12:00:00Z'),
        status: 'open',
      },
    ]);

    expect(items.map((item) => item.id)).toEqual(['activity-1', 'email-1']);
  });
});
