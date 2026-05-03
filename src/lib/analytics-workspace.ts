export type AnalyticsTabId =
  | 'overview'
  | 'campaigns'
  | 'email-engagement'
  | 'pipeline'
  | 'quarterly';

export type AnalyticsTab = {
  id: AnalyticsTabId;
  label: string;
  purpose: string;
};

export const analyticsWorkspaceTabs: AnalyticsTab[] = [
  { id: 'overview', label: 'Overview', purpose: 'Top-level business performance summary for the operating week.' },
  { id: 'campaigns', label: 'Campaigns', purpose: 'Campaign-level throughput and delivery/completion comparisons.' },
  { id: 'email-engagement', label: 'Email/Engagement', purpose: 'Delivery, opens, replies, and buyer-response visibility.' },
  { id: 'pipeline', label: 'Pipeline', purpose: 'Stage progression and conversion indicators tied to revenue motion.' },
  { id: 'quarterly', label: 'Quarterly', purpose: 'Quarterly review route and high-level period performance snapshot.' },
];

export function parseAnalyticsTab(tab: string | undefined): AnalyticsTabId {
  const ids = new Set(analyticsWorkspaceTabs.map((item) => item.id));
  return ids.has(tab as AnalyticsTabId) ? (tab as AnalyticsTabId) : 'overview';
}
