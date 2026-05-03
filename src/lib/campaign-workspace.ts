export type CampaignWorkspaceTabId = 'overview' | 'phases' | 'targets' | 'content' | 'engagement' | 'settings';

export type CampaignWorkspaceTab = {
  id: CampaignWorkspaceTabId;
  label: string;
  legacyRoutes: string[];
  purpose: string;
};

export const campaignWorkspaceTabs: CampaignWorkspaceTab[] = [
  { id: 'overview', label: 'Overview', legacyRoutes: ['/campaigns/[slug]', '/waves/campaign'], purpose: 'Campaign thesis, saved views, status, and operating summary.' },
  { id: 'phases', label: 'Phases', legacyRoutes: ['/waves'], purpose: 'Outreach waves and phase progress inside the campaign.' },
  { id: 'targets', label: 'Targets', legacyRoutes: ['/waves'], purpose: 'Target accounts, contact coverage, and readiness.' },
  { id: 'content', label: 'Content', legacyRoutes: ['/generated-content'], purpose: 'Campaign-generated content and Content Studio handoff.' },
  { id: 'engagement', label: 'Engagement', legacyRoutes: ['/activities', '/analytics/emails'], purpose: 'Buyer response, sends, replies, and campaign activity.' },
  { id: 'settings', label: 'Settings', legacyRoutes: [], purpose: 'Campaign configuration, cadence, automation, and controls.' },
];

export function getCampaignTabForLegacyRoute(route: string): CampaignWorkspaceTab | undefined {
  return campaignWorkspaceTabs.find((tab) => tab.legacyRoutes.includes(route));
}

export type CampaignTargetInput = {
  accountName: string;
  wave: string;
  status: string;
  priorityScore: number | null;
  priorityBand: string | null;
  contactCount: number;
  generatedCount: number;
  sentCount: number;
};

export type CampaignTargetCohort = CampaignTargetInput & {
  readiness: 'ready' | 'needs-content' | 'needs-contacts';
  readinessLabel: string;
};

export function buildCampaignTargetCohorts(targets: CampaignTargetInput[]): CampaignTargetCohort[] {
  return targets
    .map((target) => {
      const readiness: CampaignTargetCohort['readiness'] = target.contactCount === 0
        ? 'needs-contacts'
        : target.generatedCount === 0
          ? 'needs-content'
          : 'ready';

      return {
        ...target,
        readiness,
        readinessLabel: readiness === 'ready'
          ? 'Ready'
          : readiness === 'needs-content'
            ? 'Needs Content'
            : 'Needs Contacts',
      };
    })
    .sort((left, right) => {
      if (left.readiness !== right.readiness) return readinessRank(left.readiness) - readinessRank(right.readiness);
      return (right.priorityScore ?? 0) - (left.priorityScore ?? 0);
    });
}

export type CampaignEngagementInput = {
  id: string;
  kind: 'email' | 'activity';
  accountName: string;
  title: string;
  detail: string;
  occurredAt: Date;
  status: string;
};

export function buildCampaignEngagementItems(items: CampaignEngagementInput[], limit = 12): CampaignEngagementInput[] {
  return items
    .filter((item) => !Number.isNaN(item.occurredAt.getTime()))
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
    .slice(0, limit);
}

function readinessRank(readiness: CampaignTargetCohort['readiness']) {
  if (readiness === 'ready') return 0;
  if (readiness === 'needs-content') return 1;
  return 2;
}
